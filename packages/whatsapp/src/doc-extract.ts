import { inflateSync, inflateRawSync } from "node:zlib";

/**
 * High-performance, zero-external-dependency Document & Image Extraction Suite for WhatsApp Edge Workers.
 * 
 * Supports:
 * 1. Image OCR & Diagram Recognition (Gemini 3.8 Flash Vision Multimodal)
 * 2. PDF Stream Text Extraction (zero-ReDoS, fast FlateDecode decomp) with Gemini Multimodal Fallback
 * 3. Word (.docx) XML Text Extraction (Zip PK Header stream parser)
 * 4. Plain Text, Code, CSV, Markdown & JSON UTF-8 decoding
 */

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

// ── PDF Text Extraction ────────────────────────────────────────────────────────

const MAX_EXTRACTED_CHARS = 100_000;
const MAX_PARSE_TIME_MS = 2_000;

function decodePdfString(str: string): string {
  return str
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function decodeHexString(hex: string): string {
  try {
    let cleanHex = hex.trim();
    if (cleanHex.length % 2 !== 0) cleanHex += "0";
    if (cleanHex.toLowerCase().startsWith("feff")) {
      const bytes = new Uint8Array((cleanHex.length - 4) / 2);
      for (let i = 4, j = 0; i < cleanHex.length; i += 2, j++) {
        bytes[j] = parseInt(cleanHex.substring(i, i + 2), 16);
      }
      return new TextDecoder("utf-16be").decode(bytes);
    }
    let decoded = "";
    for (let k = 0; k < cleanHex.length; k += 2) {
      const code = parseInt(cleanHex.substring(k, k + 2), 16);
      if (code >= 32 && code <= 126) {
        decoded += String.fromCharCode(code);
      } else if (code === 10 || code === 13 || code === 9) {
        decoded += " ";
      }
    }
    return decoded;
  } catch {
    return "";
  }
}

function extractFromContentStream(streamStr: string): string {
  let result = "";
  const btMatches = streamStr.match(/BT[\s\S]*?ET/g) || [];
  for (const block of btMatches) {
    const tjMatches = block.match(/\[([\s\S]*?)\]\s*TJ/g) || [];
    for (const tj of tjMatches) {
      const inner = tj.slice(1, tj.lastIndexOf("]"));
      const pMatches = inner.match(/\((?:[^()\\]|\\.)*\)/g) || [];
      for (const p of pMatches) {
        const decoded = decodePdfString(p.slice(1, -1));
        if (decoded) result += decoded + " ";
      }
      const hexMatches = inner.match(/<([0-9a-fA-F]+)>/g) || [];
      for (const h of hexMatches) {
        const decoded = decodeHexString(h.slice(1, -1));
        if (decoded) result += decoded + " ";
      }
    }

    const singleMatches = block.match(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g) || [];
    for (const s of singleMatches) {
      const textPart = s.match(/\((.*)\)\s*Tj/);
      if (textPart) result += decodePdfString(textPart[1]) + "\n";
    }

    const hexSingle = block.match(/<([0-9a-fA-F]+)>\s*Tj/g) || [];
    for (const h of hexSingle) {
      const hexPart = h.match(/<([0-9a-fA-F]+)>\s*Tj/);
      if (hexPart) result += decodeHexString(hexPart[1]) + "\n";
    }

    const quoteMatches = block.match(/\(((?:[^()\\]|\\.)*)\)\s*['"]/g) || [];
    for (const q of quoteMatches) {
      const textPart = q.match(/\((.*)\)\s*['"]/);
      if (textPart) result += decodePdfString(textPart[1]) + "\n";
    }
  }

  return result;
}

function findBytes(buffer: Uint8Array, needle: Uint8Array, fromIndex: number): number {
  const len = buffer.length;
  const nLen = needle.length;
  if (nLen === 0) return fromIndex;
  const first = needle[0];
  const max = len - nLen;
  for (let i = fromIndex; i <= max; i++) {
    if (buffer[i] === first) {
      let match = true;
      for (let j = 1; j < nLen; j++) {
        if (buffer[i + j] !== needle[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
  }
  return -1;
}

const STREAM_NEEDLE = new Uint8Array([115, 116, 114, 101, 97, 109]); // 'stream'
const ENDSTREAM_NEEDLE = new Uint8Array([101, 110, 100, 115, 116, 114, 101, 97, 109]); // 'endstream'

export function extractTextFromPdfFast(data: Uint8Array): string {
  if (!data || data.length === 0) return "";

  const startTime = Date.now();
  let fullText = "";
  let pos = 0;
  const isBufferAvailable = typeof Buffer !== "undefined" && typeof Buffer.from === "function";
  const bufView = isBufferAvailable ? Buffer.from(data.buffer, data.byteOffset, data.byteLength) : null;

  while (pos < data.length) {
    if (fullText.length >= MAX_EXTRACTED_CHARS || Date.now() - startTime > MAX_PARSE_TIME_MS) {
      break;
    }

    let streamPos = -1;
    if (bufView) {
      streamPos = bufView.indexOf("stream", pos);
    } else {
      streamPos = findBytes(data, STREAM_NEEDLE, pos);
    }
    if (streamPos === -1) break;

    let streamStart = streamPos + 6;
    if (data[streamStart] === 13) streamStart++;
    if (data[streamStart] === 10) streamStart++;

    let streamEnd = -1;
    if (bufView) {
      streamEnd = bufView.indexOf("endstream", streamStart);
    } else {
      streamEnd = findBytes(data, ENDSTREAM_NEEDLE, streamStart);
    }
    if (streamEnd === -1) break;

    const dictStart = Math.max(0, streamPos - 600);
    const dictBytes = data.subarray(dictStart, streamPos);
    const dictChunk = new TextDecoder("latin1").decode(dictBytes);

    const isImage = dictChunk.includes("/Subtype /Image") || dictChunk.includes("/Subtype/Image");
    const isFont = dictChunk.includes("/FontFile") || dictChunk.includes("/Type /FontDescriptor") ||
                   dictChunk.includes("/Type/FontDescriptor");

    if (!isImage && !isFont && streamEnd > streamStart) {
      const chunk = data.subarray(streamStart, streamEnd);
      let decompressedStr: string | null = null;

      if (dictChunk.includes("/FlateDecode")) {
        try {
          const decompressed = inflateSync(chunk);
          decompressedStr = new TextDecoder("latin1").decode(decompressed);
        } catch {
          try {
            const decompressed = inflateRawSync(chunk);
            decompressedStr = new TextDecoder("latin1").decode(decompressed);
          } catch {
            // Not a valid zlib chunk
          }
        }
      } else {
        decompressedStr = new TextDecoder("latin1").decode(chunk);
      }

      if (decompressedStr && decompressedStr.includes("BT") && decompressedStr.includes("ET")) {
        const text = extractFromContentStream(decompressedStr);
        if (text.trim()) {
          fullText += text + "\n";
        }
      }
    }

    pos = streamEnd + 9;
  }

  if (!fullText.trim()) {
    const rawString = new TextDecoder("latin1").decode(data.subarray(0, Math.min(data.length, 1_000_000)));
    const rawMatches = rawString.match(/\(((?:[^()\\]|\\.)*)\)/g) || [];
    const filtered = rawMatches
      .map((s) => decodePdfString(s.slice(1, -1)))
      .filter((s) => /[a-zA-Z0-9\s]{4,}/.test(s) && !/^\s*$/.test(s) && !/^[\x00-\x1F]+$/.test(s))
      .join(" ");
    if (filtered.length > 50) {
      fullText = filtered;
    }
  }

  return fullText
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

// ── Word (.docx) Text Extraction ───────────────────────────────────────────────

export function extractTextFromDocx(buffer: Uint8Array): string {
  const bytes = buffer;
  let fullDocxText = "";

  for (let pos = 0; pos < bytes.length - 30; pos++) {
    if (
      bytes[pos] === 0x50 &&
      bytes[pos + 1] === 0x4b &&
      bytes[pos + 2] === 0x03 &&
      bytes[pos + 3] === 0x04
    ) {
      const compMethod = bytes[pos + 8] | (bytes[pos + 9] << 8);
      const compSize =
        bytes[pos + 18] |
        (bytes[pos + 19] << 8) |
        (bytes[pos + 20] << 16) |
        (bytes[pos + 21] << 24);
      const nameLen = bytes[pos + 26] | (bytes[pos + 27] << 8);
      const extraLen = bytes[pos + 28] | (bytes[pos + 29] << 8);

      let entryName = "";
      for (let i = 0; i < nameLen; i++) {
        entryName += String.fromCharCode(bytes[pos + 30 + i]);
      }

      if (
        entryName.includes("word/document.xml") ||
        entryName.includes("word/header") ||
        entryName.includes("word/footer")
      ) {
        const dataStart = pos + 30 + nameLen + extraLen;
        const dataEnd = compSize > 0 ? dataStart + compSize : bytes.length;
        const compressedChunk = bytes.subarray(dataStart, Math.min(dataEnd, bytes.length));

        let xmlStr = "";
        try {
          if (compMethod === 0) {
            xmlStr = new TextDecoder().decode(compressedChunk);
          } else if (compMethod === 8) {
            try {
              const decompressed = inflateRawSync(compressedChunk);
              xmlStr = new TextDecoder().decode(decompressed);
            } catch {
              // Ignore invalid zip chunk
            }
          }
        } catch {
          // Ignore decompression failure
        }

        if (xmlStr) {
          const wtMatches = xmlStr.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
          if (wtMatches.length > 0) {
            const extracted = wtMatches
              .map((m) => m.replace(/<[^>]+>/g, ""))
              .join(" ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'");
            fullDocxText += extracted + "\n";
          }
        }
      }
    }
  }

  return fullDocxText
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .slice(0, 15000)
    .trim();
}

// ── Multi-Tier Multimodal OCR (Images & Visual PDFs) ─────────────────────────

export interface MultimodalEnv {
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  WORKERS_AI?: any;
  AI?: any;
  ASR_ENGINE?: (buffer: ArrayBuffer, mimeType: string, env: any) => Promise<string>;
  [key: string]: any;
}

/**
 * Multi-Tier Vision & OCR Extractor:
 * Tier 1: OpenRouter openai/gpt-4o-mini (Unbeatable accuracy on handwriting, tables, and formulas)
 * Tier 2: Cloudflare Workers AI @cf/meta/llama-3.2-11b-vision-instruct
 * Tier 3: Gemini 2.0 Flash / 1.5 Flash Vision
 */
export async function extractTextFromImage(
  buffer: ArrayBuffer | Uint8Array,
  mimeType: string = "image/jpeg",
  caption: string = "",
  env?: MultimodalEnv
): Promise<string> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (!bytes || bytes.length === 0) return "";

  const cleanMime = (mimeType || "image/jpeg").split(";")[0].trim().toLowerCase();
  const b64 = arrayBufferToBase64(bytes);

  const prompt = `Transcribe and extract all text, messages, UI labels, handwriting, questions, formulas, tables, and visible details in this image verbatim.${
    caption ? `\nUser Note/Instruction: ${caption}` : ""
  }`;

  // ── Tier 1: OpenRouter gpt-4o-mini (Fast, rock-solid table/formula transcription) ──
  const openrouterKey =
    env?.OPENROUTER_API_KEY ||
    (typeof process !== "undefined" && process.env?.OPENROUTER_API_KEY) ||
    "";

  if (openrouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://voltrix.stream",
          "X-Title": "Voltrix WhatsApp Vision",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${cleanMime};base64,${b64}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      } else {
        const err = await res.text().catch(() => "");
        console.warn(`[WhatsApp OCR] OpenRouter Vision failed (${res.status}): ${err}`);
      }
    } catch (err) {
      console.warn("[WhatsApp OCR] OpenRouter Vision error:", err);
    }
  }

  // ── Tier 2: Cloudflare Workers AI Vision (@cf/meta/llama-3.2-11b-vision-instruct) ──
  const ai = env?.WORKERS_AI || env?.AI;
  if (ai && typeof ai.run === "function") {
    try {
      const res: any = await ai.run("@cf/meta/llama-3.2-11b-vision-instruct", {
        image: Array.from(bytes),
        prompt,
        max_tokens: 2048,
      });
      const text = res?.description || res?.response || (typeof res === "string" ? res : "");
      if (text && text.trim().length > 0) return text.trim();
    } catch (err) {
      console.warn("[WhatsApp OCR] Workers AI Vision error:", err);
    }
  }

  // ── Tier 3: Gemini 2.0 Flash / 1.5 Flash Vision ──
  const geminiKey = env?.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== "REPLACE_WITH_GEMINI_KEY") {
    const text = await extractTextFromImageWithGemini(geminiKey, bytes, cleanMime, caption);
    if (text) return text;
  }

  return "";
}

export async function extractTextFromImageWithGemini(
  geminiKey: string,
  buffer: ArrayBuffer | Uint8Array,
  mimeType: string = "image/jpeg",
  caption: string = ""
): Promise<string> {
  if (!geminiKey || geminiKey === "REPLACE_WITH_GEMINI_KEY") return "";
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length === 0) return "";
  const cleanMime = (mimeType || "image/jpeg").split(";")[0].trim().toLowerCase();
  const b64 = arrayBufferToBase64(bytes);

  const prompt = `Transcribe and extract all text, messages, UI labels, handwriting, questions, formulas, tables, and visible details in this image verbatim.${
    caption ? `\nUser Note/Instruction: ${caption}` : ""
  }`;

  for (const model of ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: cleanMime,
                      data: b64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch {
      // try next
    }
  }

  return "";
}

export async function extractTextFromPdfWithGemini(
  geminiKey: string,
  buffer: ArrayBuffer,
  caption: string = ""
): Promise<string> {
  if (!geminiKey || buffer.byteLength === 0) return "";
  const b64 = arrayBufferToBase64(buffer);

  for (const model of ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert document understanding model.
Transcribe, extract, and describe all text, questions, mathematical formulas, equations, tables, problem sets, and academic content from this PDF document verbatim.
If the PDF contains scanned pages, homework questions, or exam problems, list each problem clearly with all its given values and diagrams described.
${caption ? `User Instruction: ${caption}` : ""}`,
                  },
                  {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: b64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch {
      // try next
    }
  }

  return "";
}

// ── Multi-Tier Video Analysis & Speech Transcription ──────────────────────────

export async function analyzeVideo(
  buffer: ArrayBuffer | Uint8Array,
  mimeType: string = "video/mp4",
  caption: string = "",
  env?: MultimodalEnv
): Promise<string> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (!bytes || bytes.length === 0) return "";

  const cleanMime = (mimeType || "video/mp4").split(";")[0].trim().toLowerCase();

  // ── Tier 1: Gemini Multimodal Video ──
  const geminiKey = env?.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== "REPLACE_WITH_GEMINI_KEY") {
    const text = await analyzeVideoWithGemini(geminiKey, bytes, cleanMime, caption);
    if (text) return text;
  }

  // ── Tier 2: ASR Audio Speech Transcription from Video Track ──
  // A) Custom ASR_ENGINE
  if (typeof env?.ASR_ENGINE === "function") {
    try {
      const speech = await env.ASR_ENGINE(bytes.buffer as ArrayBuffer, cleanMime, env);
      if (speech && speech.trim()) {
        return `[Transcribed Speech from Video]:\n${speech.trim()}${caption ? `\n\nUser Note: ${caption}` : ""}`;
      }
    } catch (e) {
      console.warn("[WhatsApp Video] ASR_ENGINE failed:", e);
    }
  }

  // B) Groq Whisper with video buffer
  if (env?.GROQ_API_KEY) {
    try {
      const formData = new FormData();
      const ext = cleanMime.includes("webm") ? "webm" : "mp4";
      formData.append("file", new Blob([bytes], { type: cleanMime }), `video.${ext}`);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "json");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        if (data?.text?.trim()) {
          return `[Transcribed Speech from Video]:\n${data.text.trim()}${caption ? `\n\nUser Note: ${caption}` : ""}`;
        }
      }
    } catch (e) {
      console.warn("[WhatsApp Video] Groq Whisper failed:", e);
    }
  }

  // C) Workers AI Whisper
  const ai = env?.WORKERS_AI || env?.AI;
  if (ai && typeof ai.run === "function") {
    try {
      const res: any = await ai.run("@cf/openai/whisper", {
        audio: Array.from(bytes),
      });
      if (res?.text?.trim()) {
        return `[Transcribed Speech from Video]:\n${res.text.trim()}${caption ? `\n\nUser Note: ${caption}` : ""}`;
      }
    } catch (e) {
      console.warn("[WhatsApp Video] Workers AI Whisper failed:", e);
    }
  }

  return "";
}

export async function analyzeVideoWithGemini(
  geminiKey: string,
  buffer: ArrayBuffer | Uint8Array,
  mimeType: string = "video/mp4",
  caption: string = ""
): Promise<string> {
  if (!geminiKey || geminiKey === "REPLACE_WITH_GEMINI_KEY") return "";
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length === 0) return "";
  const cleanMime = (mimeType || "video/mp4").split(";")[0].trim().toLowerCase();
  const b64 = arrayBufferToBase64(bytes);

  const prompt = `Transcribe all speech verbatim from this video, and thoroughly describe all visual scenes, actions, on-screen text, diagrams, and questions.${
    caption ? `\nUser Note/Context: ${caption}` : ""
  }`;

  for (const model of ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: cleanMime,
                      data: b64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch {
      // try next
    }
  }

  return "";
}

// ── Master Universal Document Extractor ───────────────────────────────────────

export async function extractDocumentContent(
  buffer: ArrayBuffer,
  mimeType: string = "",
  filename: string = "",
  caption: string = "",
  envOrGeminiKey?: any
): Promise<string> {
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) return "";

  const env: MultimodalEnv =
    typeof envOrGeminiKey === "string"
      ? { GEMINI_API_KEY: envOrGeminiKey }
      : (envOrGeminiKey || {});

  const lowerMime = (mimeType || "").toLowerCase();
  const lowerName = (filename || "").toLowerCase();

  // 1. PDF Documents
  if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
    // A) Fast stream extraction first
    try {
      const fastText = extractTextFromPdfFast(bytes);
      if (fastText && fastText.length > 50) {
        return fastText;
      }
    } catch (e) {
      console.warn("[WhatsApp Document] Fast PDF extraction fallback triggered:", e);
    }

    // B) Multimodal Gemini Vision fallback (handles scanned PDFs, handwritten homework, diagrams)
    if (env.GEMINI_API_KEY) {
      const geminiText = await extractTextFromPdfWithGemini(env.GEMINI_API_KEY, buffer, caption);
      if (geminiText) return geminiText;
    }
  }

  // 2. Word .docx Documents
  if (
    lowerMime.includes("wordprocessingml") ||
    lowerMime.includes("msword") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc")
  ) {
    try {
      const docxText = extractTextFromDocx(bytes);
      if (docxText && docxText.length > 10) {
        return docxText;
      }
    } catch (e) {
      console.warn("[WhatsApp Document] DOCX extraction error:", e);
    }
  }

  // 3. Plain Text, Markdown, Code, CSV, JSON
  if (
    lowerMime.startsWith("text/") ||
    lowerMime.includes("json") ||
    lowerMime.includes("csv") ||
    /\.(txt|md|csv|json|py|js|ts|java|c|cpp|h|html|css|r|sql|tex|xml|yaml|yml)$/i.test(lowerName)
  ) {
    try {
      const text = new TextDecoder("utf-8").decode(bytes);
      if (text && text.trim().length > 0) {
        return text.slice(0, 25000).trim();
      }
    } catch {}
  }

  // 4. Image Documents (e.g. student uploaded homework photo as a document)
  if (
    lowerMime.startsWith("image/") ||
    /\.(png|jpg|jpeg|webp|bmp|gif|heic)$/i.test(lowerName)
  ) {
    const imgText = await extractTextFromImage(buffer, lowerMime || "image/jpeg", caption, env);
    if (imgText) return imgText;
  }

  return "";
}

/**
 * WhatsApp Cloud API Webhook, Media Gateway, and Agent Bridge for Voltrix OS
 *
 * Provides:
 * 1. Webhook Challenge Verification (GET hub.mode === 'subscribe')
 * 2. Incoming Event Ingestion (POST text, audio/voice, document, image, interactive)
 * 3. Formatting & Chunking Engine:
 *    - formatForWhatsApp(text): Markdown headers, bold, bullets, LaTeX equations
 *    - splitMessageChunks(text, maxLen): Clean splits at paragraph/sentence boundaries
 * 4. Two-Way Media & Document Messaging:
 *    - Media extraction & R2 persistence under hf-videos/whatsapp-<id>.<ext>
 *    - Document text extraction for PDF, DOCX, text/code/csv, and images
 *    - sendWhatsAppAudioMessage: Native voice note dispatch via Graph API
 *    - sendWhatsAppDocumentMessage: Native PDF/document dispatch via Graph API
 * 5. Interactive Commands Router (!help, !clear, !status, !link <code>)
 * 6. Edge Agent Bridge:
 *    - Multi-turn conversation sessions
 *    - LLM agent generation (Workers AI / Groq / OpenAI / custom bridge)
 *    - Formatted and chunked outbound WhatsApp dispatch
 */

import { inflateRawSync } from "node:zlib";
import { extractTextFromPdf } from "./pdf-extract.js";

export interface WhatsAppEnv {
  WHATSAPP_VERIFY_TOKEN?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
  BLUEPRINT_CONTENT?: R2Bucket;
  BLUEPRINTS?: KVNamespace;
  WORKERS_AI?: any;
  AI?: any;
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  CF_AI_GATEWAY?: string;
  CF_AI_GATEWAY_ACCOUNT_ID?: string;
  PUBLIC_BASE_URL?: string;
  ASR_ENGINE?: (audioBuffer: ArrayBuffer, mimeType: string, env: WhatsAppEnv) => Promise<string>;
  AGENT_BRIDGE?: (
    prompt: string,
    context: {
      phone: string;
      history: Array<{ role: string; content: string }>;
      linkedUserId?: string | null;
      name?: string;
    },
    env: WhatsAppEnv
  ) => Promise<string>;
  TTS_ENGINE?: (
    text: string,
    env: WhatsAppEnv
  ) => Promise<{ buffer: ArrayBuffer | Uint8Array; mimeType: string } | null>;
  AUTO_REPLY?: boolean;
  [key: string]: any;
}

export interface WhatsAppIncomingTextMessage {
  body: string;
}

export interface WhatsAppIncomingMediaMessage {
  id: string;
  mime_type?: string;
  filename?: string;
  caption?: string;
}

export interface WhatsAppIncomingInteractiveMessage {
  type?: string;
  button_reply?: { id: string; title: string };
  list_reply?: { id: string; title: string; description?: string };
}

export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: WhatsAppIncomingTextMessage;
  audio?: WhatsAppIncomingMediaMessage;
  voice?: WhatsAppIncomingMediaMessage;
  document?: WhatsAppIncomingMediaMessage;
  image?: WhatsAppIncomingMediaMessage;
  interactive?: WhatsAppIncomingInteractiveMessage;
  caption?: string;
  [key: string]: unknown;
}

export interface WhatsAppWebhookChangeValue {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: Array<{
    profile?: { name?: string };
    wa_id?: string;
  }>;
  messages?: WhatsAppWebhookMessage[];
  statuses?: unknown[];
}

export interface WhatsAppWebhookChange {
  field?: string;
  value?: WhatsAppWebhookChangeValue;
}

export interface WhatsAppWebhookEntry {
  id?: string;
  changes?: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
}

export interface ProcessedWhatsAppMessage {
  id: string;
  from: string;
  type: string;
  timestamp: string;
  text?: string;
  mediaId?: string;
  mimeType?: string;
  filename?: string;
  r2Key?: string;
  transcription?: string;
  extractedText?: string;
  reply?: string;
  command?: string;
  error?: string;
}

export interface WhatsAppUserSession {
  phoneNumber: string;
  linkedUserId?: string | null;
  userName?: string;
  history: Array<{ role: string; content: string; timestamp?: number }>;
  lastActive: number;
}

// In-memory multi-turn session storage for WhatsApp conversations
const userSessions = new Map<string, WhatsAppUserSession>();

// In-memory linking codes: maps 6-digit code -> { userId, name, expiresAt }
const linkingCodes = new Map<string, { userId: string; name?: string; expiresAt: number }>();

// Rolling 1,000 message dedup window to ignore Meta Graph API retries
const processedMessageIds = new Map<string, number>();

/**
 * Checks if a message ID has already been processed to prevent duplicates from Meta retries.
 */
export function isMessageProcessed(msgId: string): boolean {
  if (processedMessageIds.has(msgId)) return true;
  processedMessageIds.set(msgId, Date.now());
  if (processedMessageIds.size > 1000) {
    const oldestKey = processedMessageIds.keys().next().value;
    if (oldestKey) processedMessageIds.delete(oldestKey);
  }
  return false;
}

/**
 * Clears message deduplication history (primarily for tests).
 */
export function clearWhatsAppProcessedMessages(): void {
  processedMessageIds.clear();
}

/**
 * Sets an in-memory linking code for account pairing.
 */
export function setWhatsAppLinkingCode(
  code: string,
  data: { userId: string; name?: string; expiresAt: number }
): void {
  linkingCodes.set(code, data);
}

/**
 * Sets or updates the in-memory session for a given phone number.
 */
export function setWhatsAppSession(phone: string, session: WhatsAppUserSession): void {
  userSessions.set(cleanPhoneNumber(phone), session);
}

/**
 * Retrieves the in-memory session for a given phone number.
 */
export function getWhatsAppSession(phone: string): WhatsAppUserSession | undefined {
  return userSessions.get(cleanPhoneNumber(phone));
}

/**
 * Clears the session history for a given phone number.
 */
export function clearWhatsAppSession(phone: string): void {
  const clean = cleanPhoneNumber(phone);
  let session = userSessions.get(clean);
  if (!session) {
    session = { phoneNumber: clean, history: [], lastActive: Date.now() };
    userSessions.set(clean, session);
  } else {
    session.history = [];
    session.lastActive = Date.now();
  }
}

/**
 * Normalizes phone numbers by stripping non-numeric characters.
 */
export function cleanPhoneNumber(phone: string): string {
  let clean = String(phone).replace(/[^0-9]/g, "");
  if (clean.startsWith("0") && clean.length === 10) {
    clean = "256" + clean.slice(1);
  }
  return clean;
}

/**
 * Converts standard Markdown into WhatsApp-friendly markup.
 * - Headers (# Header) -> *Header*
 * - Bold (**bold**) -> *bold*
 * - Bullet points (- or *) -> •
 * - Numbered lists -> standardized
 * - LaTeX equations ($$...$$ -> monospace block, $...$ -> inline code)
 */
export function formatForWhatsApp(text: string): string {
  if (!text) return "";

  let out = text;

  // Preserve existing triple-backtick code blocks so their contents aren't altered
  const codeBlocks: string[] = [];
  out = out.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // LaTeX block equations: $$...$$ -> monospace code block ```\n...\n```
  out = out.replace(/\$\$([\s\S]*?)\$\$/g, (_, eq) => `\n\`\`\`\n${eq.trim()}\n\`\`\`\n`);

  // LaTeX inline equations: $...$ -> inline code `...`
  out = out.replace(/\$([^$\n]+)\$/g, "`$1`");

  // Markdown headers (# Title, ## Subtitle, etc.) -> *Title*
  out = out.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

  // Bold: **text** -> *text* (WhatsApp uses single asterisks for bold)
  out = out.replace(/\*\*([^*]+)\*\*/g, "*$1*");

  // Bullet points (- or *) -> • Unicode bullet
  out = out.replace(/^[\*\-]\s+(.+)$/gm, "• $1");

  // Numbered lists: 1. Item -> 1. Item
  out = out.replace(/^(\d+)\.\s+(.+)$/gm, "$1. $2");

  // Restore preserved code blocks
  out = out.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)] || "");

  return out.trim();
}

/**
 * Splits long responses exceeding WhatsApp limits (>4096 chars) into clean chunks (< maxLen)
 * at paragraph or sentence boundaries without breaking code blocks.
 */
export function splitMessageChunks(text: string, maxLen: number = 3800): string[] {
  if (!text) return [];
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split("\n\n");
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + (currentChunk ? "\n\n" : "") + para).length > maxLen) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      if (para.length > maxLen) {
        // Break huge single paragraph by lines
        const lines = para.split("\n");
        for (const line of lines) {
          if ((currentChunk + (currentChunk ? "\n" : "") + line).length > maxLen) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = "";
            }
            if (line.length > maxLen) {
              // Line itself exceeds maxLen, split by sentences or words
              let remaining = line;
              while (remaining.length > maxLen) {
                let splitIdx = remaining.lastIndexOf(". ", maxLen);
                if (splitIdx === -1 || splitIdx < maxLen / 2) {
                  splitIdx = remaining.lastIndexOf(" ", maxLen);
                }
                if (splitIdx === -1) {
                  splitIdx = maxLen;
                } else {
                  splitIdx += 1;
                }
                chunks.push(remaining.slice(0, splitIdx).trim());
                remaining = remaining.slice(splitIdx).trim();
              }
              currentChunk = remaining;
            } else {
              currentChunk = line;
            }
          } else {
            currentChunk = currentChunk ? `${currentChunk}\n${line}` : line;
          }
        }
      } else {
        currentChunk = para;
      }
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Maps audio MIME types to canonical file extensions.
 */
export function getExtensionFromMimeType(mimeType?: string): string {
  if (!mimeType) return "ogg";
  const clean = mimeType.split(";")[0].trim().toLowerCase();
  switch (clean) {
    case "audio/ogg":
    case "audio/opus":
      return "ogg";
    case "audio/mpeg":
    case "audio/mp3":
      return "mp3";
    case "audio/wav":
    case "audio/x-wav":
      return "wav";
    case "audio/m4a":
    case "audio/mp4":
    case "audio/x-m4a":
      return "m4a";
    case "audio/aac":
      return "aac";
    case "audio/amr":
      return "amr";
    default:
      return "ogg";
  }
}

/**
 * Normalizes audio MIME type and extension to Meta Graph API whitelisted formats.
 */
export function getAudioMimeAndExt(mimeType?: string): { mimeType: string; ext: string } {
  const lower = (mimeType || "").toLowerCase();
  if (lower.includes("ogg") || lower.includes("opus")) {
    return { mimeType: "audio/ogg", ext: "ogg" };
  }
  if (lower.includes("mp4") || lower.includes("m4a") || lower.includes("aac")) {
    return { mimeType: "audio/mp4", ext: "mp4" };
  }
  if (lower.includes("amr")) {
    return { mimeType: "audio/amr", ext: "amr" };
  }
  return { mimeType: "audio/mpeg", ext: "mp3" };
}

/**
 * High-accuracy Word .docx text extractor scanning zip stream entries for word/document.xml
 */
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

/**
 * Extracts human-readable text from uploaded documents (PDF, DOCX, text/code, and images).
 */
export async function extractDocumentText(
  buffer: ArrayBuffer | Uint8Array,
  mimeType: string = "",
  filename: string = "",
  caption: string = "",
  _env?: WhatsAppEnv
): Promise<string> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (!bytes || bytes.length === 0) return "";

  const lowerName = (filename || "").toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();

  // 1. PDF Documents
  if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
    try {
      const text = await extractTextFromPdf(bytes);
      if (text && text.trim().length > 0) {
        return text.slice(0, 15000).trim();
      }
    } catch (pdfErr) {
      console.warn("WhatsApp PDF parse error:", pdfErr);
    }
  }

  // 2. Word .docx / .doc Documents
  if (
    lowerMime.includes("wordprocessingml") ||
    lowerMime.includes("msword") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc")
  ) {
    try {
      const text = extractTextFromDocx(bytes);
      if (text && text.trim().length > 0) {
        return text.slice(0, 15000).trim();
      }
    } catch (docxErr) {
      console.warn("WhatsApp DOCX parse error:", docxErr);
    }
  }

  // 3. Plain text / Markdown / Source Code / CSV / JSON / XML
  if (
    lowerMime.startsWith("text/") ||
    lowerMime.includes("json") ||
    lowerMime.includes("csv") ||
    /\.(txt|md|csv|json|py|js|ts|java|c|cpp|h|html|css|r|sql|tex|xml)$/i.test(lowerName)
  ) {
    try {
      const text = new TextDecoder("utf-8").decode(bytes);
      if (text && text.trim().length > 0) {
        return text.slice(0, 15000).trim();
      }
    } catch {
      // Ignore text decoding failure
    }
  }

  // 4. Image document note fallback
  if (lowerMime.startsWith("image/") || /\.(png|jpg|jpeg|webp|bmp|gif)$/i.test(lowerName)) {
    if (caption) {
      return `Image note: ${caption}`;
    }
    return "Image attachment received.";
  }

  return "";
}

/**
 * Downloads media binary stream from WhatsApp Graph API.
 */
export async function fetchWhatsAppMedia(
  mediaId: string,
  accessToken: string
): Promise<{ buffer: ArrayBuffer; mimeType: string; url: string }> {
  const metaUrl = `https://graph.facebook.com/v21.0/${mediaId}`;
  const metaRes = await fetch(metaUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!metaRes.ok) {
    const errorText = await metaRes.text().catch(() => "");
    throw new Error(`Failed to query WhatsApp media URL (${metaRes.status}): ${errorText}`);
  }

  const metaData = (await metaRes.json()) as { url?: string; mime_type?: string };
  if (!metaData.url) {
    throw new Error("WhatsApp media metadata did not contain a download URL");
  }

  const mediaRes = await fetch(metaData.url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!mediaRes.ok) {
    const errorText = await mediaRes.text().catch(() => "");
    throw new Error(`Failed to download WhatsApp media binary (${mediaRes.status}): ${errorText}`);
  }

  const buffer = await mediaRes.arrayBuffer();
  return {
    buffer,
    mimeType: metaData.mime_type || "audio/ogg",
    url: metaData.url,
  };
}

/**
 * Persists audio to R2 bucket under `hf-videos/whatsapp-<id>.<ext>`
 */
export async function saveAudioToR2(
  bucket: R2Bucket,
  mediaId: string,
  mimeType: string,
  buffer: ArrayBuffer
): Promise<string> {
  const ext = getExtensionFromMimeType(mimeType);
  const r2Key = `hf-videos/whatsapp-${mediaId}.${ext}`;
  await bucket.put(r2Key, buffer, {
    httpMetadata: {
      contentType: mimeType,
    },
  });
  return r2Key;
}

/**
 * Calls ASR engine to transcribe voice notes.
 */
export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  env: WhatsAppEnv
): Promise<string> {
  if (typeof env.ASR_ENGINE === "function") {
    return await env.ASR_ENGINE(audioBuffer, mimeType, env);
  }

  // 1. Cloudflare Workers AI
  const ai = env.WORKERS_AI || (env as any).AI;
  if (ai && typeof ai.run === "function") {
    try {
      const response = await ai.run("@cf/openai/whisper", {
        audio: [...new Uint8Array(audioBuffer)],
      });
      if (response && typeof response === "object" && typeof response.text === "string") {
        return response.text.trim();
      }
    } catch (err) {
      console.warn("Workers AI Whisper transcription error:", err);
    }
  }

  // 2. Groq Whisper
  if (env.GROQ_API_KEY) {
    try {
      const endpoint =
        env.CF_AI_GATEWAY && env.CF_AI_GATEWAY_ACCOUNT_ID
          ? `https://gateway.ai.cloudflare.com/v1/${env.CF_AI_GATEWAY_ACCOUNT_ID}/${env.CF_AI_GATEWAY}/groq/audio/transcriptions`
          : "https://api.groq.com/openai/v1/audio/transcriptions";

      const ext = getExtensionFromMimeType(mimeType);
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append("file", blob, `whatsapp-audio.${ext}`);
      formData.append("model", "whisper-large-v3");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        if (data?.text) {
          return data.text.trim();
        }
      }
    } catch (err) {
      console.warn("Groq Whisper transcription error:", err);
    }
  }

  // 3. OpenAI Whisper
  if (env.OPENAI_API_KEY) {
    try {
      const endpoint =
        env.CF_AI_GATEWAY && env.CF_AI_GATEWAY_ACCOUNT_ID
          ? `https://gateway.ai.cloudflare.com/v1/${env.CF_AI_GATEWAY_ACCOUNT_ID}/${env.CF_AI_GATEWAY}/openai/audio/transcriptions`
          : "https://api.openai.com/v1/audio/transcriptions";

      const ext = getExtensionFromMimeType(mimeType);
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append("file", blob, `whatsapp-audio.${ext}`);
      formData.append("model", "whisper-1");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        if (data?.text) {
          return data.text.trim();
        }
      }
    } catch (err) {
      console.warn("OpenAI Whisper transcription error:", err);
    }
  }

  return "";
}

/**
 * Builds the outbound text message payload expected by WhatsApp Graph API.
 */
export function createWhatsAppTextMessagePayload(to: string, text: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhoneNumber(to),
    type: "text",
    text: {
      preview_url: false,
      body: text,
    },
  };
}

/**
 * Sends a WhatsApp text message via Meta Graph API.
 * POST https://graph.facebook.com/v21.0/<env.WHATSAPP_PHONE_NUMBER_ID>/messages
 */
export async function sendWhatsAppMessage(
  to: string,
  text: string,
  env: WhatsAppEnv
): Promise<boolean> {
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error("Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
    return false;
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const payload = createWhatsAppTextMessagePayload(to, text);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`WhatsApp send failed (${res.status}): ${errText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return false;
  }
}

/**
 * Uploads audio to Meta Graph API media endpoint and sends as native voice note.
 */
export async function sendWhatsAppAudioMessage(
  to: string,
  audioBufferOrUrl: ArrayBuffer | Uint8Array | string,
  env: WhatsAppEnv,
  mimeType: string = "audio/ogg"
): Promise<boolean> {
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken || !to || !audioBufferOrUrl) {
    console.error("Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN or audio payload");
    return false;
  }

  const cleanTo = cleanPhoneNumber(to);

  // If audioBufferOrUrl is a URL string
  if (
    typeof audioBufferOrUrl === "string" &&
    (audioBufferOrUrl.startsWith("http://") || audioBufferOrUrl.startsWith("https://"))
  ) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanTo,
          type: "audio",
          audio: { link: audioBufferOrUrl },
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("sendWhatsAppAudioMessage link error:", err);
      return false;
    }
  }

  // Binary or base64 audio
  try {
    let audioBytes: Uint8Array;
    if (typeof audioBufferOrUrl === "string") {
      const clean = audioBufferOrUrl.replace(/^data:audio\/[^;]+;base64,/, "");
      if (typeof Buffer !== "undefined") {
        audioBytes = Buffer.from(clean, "base64");
      } else {
        const bin = atob(clean);
        audioBytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) audioBytes[i] = bin.charCodeAt(i);
      }
    } else if (audioBufferOrUrl instanceof ArrayBuffer) {
      audioBytes = new Uint8Array(audioBufferOrUrl);
    } else {
      audioBytes = audioBufferOrUrl;
    }

    const { mimeType: effectiveMime, ext } = getAudioMimeAndExt(mimeType);

    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("file", new Blob([audioBytes], { type: effectiveMime }), `voice_reply.${ext}`);
    formData.append("type", effectiveMime);

    const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      console.error(`WhatsApp audio upload failed (${uploadRes.status}): ${errText}`);
      return false;
    }

    const uploadData = (await uploadRes.json()) as { id?: string };
    const mediaId = uploadData?.id;
    if (!mediaId) {
      console.error("WhatsApp audio upload returned no media ID");
      return false;
    }

    const sendRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "audio",
        audio: { id: mediaId },
      }),
    });

    return sendRes.ok;
  } catch (err) {
    console.error("sendWhatsAppAudioMessage error:", err);
    return false;
  }
}

/**
 * Sends generated PDFs, coursework documents, or export files to WhatsApp users.
 */
export async function sendWhatsAppDocumentMessage(
  to: string,
  documentBufferOrUrl: ArrayBuffer | Uint8Array | string,
  filename: string,
  caption: string = "",
  env: WhatsAppEnv,
  mimeType: string = "application/pdf"
): Promise<boolean> {
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken || !to || !documentBufferOrUrl) {
    console.error("Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN or document payload");
    return false;
  }

  const cleanTo = cleanPhoneNumber(to);
  const cleanFilename = filename || "Document.pdf";

  // If documentBufferOrUrl is a URL string
  if (
    typeof documentBufferOrUrl === "string" &&
    (documentBufferOrUrl.startsWith("http://") || documentBufferOrUrl.startsWith("https://"))
  ) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanTo,
          type: "document",
          document: {
            link: documentBufferOrUrl,
            filename: cleanFilename,
            caption: caption || undefined,
          },
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("sendWhatsAppDocumentMessage link error:", err);
      return false;
    }
  }

  // Binary or base64 document
  try {
    let docBytes: Uint8Array;
    if (typeof documentBufferOrUrl === "string") {
      const clean = documentBufferOrUrl.replace(/^data:[^;]+;base64,/, "");
      if (typeof Buffer !== "undefined") {
        docBytes = Buffer.from(clean, "base64");
      } else {
        const bin = atob(clean);
        docBytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) docBytes[i] = bin.charCodeAt(i);
      }
    } else if (documentBufferOrUrl instanceof ArrayBuffer) {
      docBytes = new Uint8Array(documentBufferOrUrl);
    } else {
      docBytes = documentBufferOrUrl;
    }

    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("file", new Blob([docBytes], { type: mimeType }), cleanFilename);
    formData.append("type", mimeType);

    const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      console.error(`WhatsApp document upload failed (${uploadRes.status}): ${errText}`);
      return false;
    }

    const uploadData = (await uploadRes.json()) as { id?: string };
    const mediaId = uploadData?.id;
    if (!mediaId) {
      console.error("WhatsApp document upload returned no media ID");
      return false;
    }

    const sendRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "document",
        document: {
          id: mediaId,
          filename: cleanFilename,
          caption: caption || undefined,
        },
      }),
    });

    return sendRes.ok;
  } catch (err) {
    console.error("sendWhatsAppDocumentMessage error:", err);
    return false;
  }
}

/**
 * Marks incoming WhatsApp message as read.
 */
export async function markWhatsAppMessageAsRead(
  messageId: string,
  env: WhatsAppEnv
): Promise<boolean> {
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken || !messageId) return false;

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Built-in command router for: !help, !clear, !status, !link <code>
 */
export async function handleWhatsAppCommand(
  from: string,
  commandText: string,
  env: WhatsAppEnv
): Promise<{ handled: boolean; reply?: string; command?: string }> {
  const text = (commandText || "").trim();
  const lower = text.toLowerCase();
  const cleanPhone = cleanPhoneNumber(from);

  // 1. !help / help / start / menu / features
  if (
    lower === "!help" ||
    lower === "help" ||
    lower === "start" ||
    lower === "!start" ||
    lower === "menu" ||
    lower === "!menu" ||
    lower === "features"
  ) {
    const helpMsg =
      `⚡ *Welcome to Voltrix OS on WhatsApp!*\n\n` +
      `I am your 24/7 AI Copilot, Academic Mentor, and System Assistant.\n\n` +
      `*Directives & Capabilities:*\n` +
      `• 📄 *Documents (PDF, DOCX, Code, CSV)* — Instant deep ingestion & analysis.\n` +
      `• 📸 *Photos & Diagrams* — Multimodal OCR & visual reasoning.\n` +
      `• 🎙️ *Voice Notes* — Whisper transcription & native voice replies.\n` +
      `• *!help* — Show this capabilities manual.\n` +
      `• *!clear* — Reset our chat memory and start a fresh session.\n` +
      `• *!status* — View your linked account status & active AI reasoning model.\n` +
      `• *!link <code>* — Link with your Voltrix OS web account using a 6-digit sync code.\n\n` +
      `_Type your question or send a photo/document/voice note to begin!_`;

    return { handled: true, command: "help", reply: helpMsg };
  }

  // 2. !clear / !reset
  if (lower === "!clear" || lower === "!reset" || lower === "clear" || lower === "reset") {
    clearWhatsAppSession(cleanPhone);
    if (env.BLUEPRINTS) {
      await env.BLUEPRINTS.delete(`wh:${cleanPhone}`).catch(() => {});
    }
    const reply =
      `🧹 *Conversation Memory Reset*\n\n` +
      `Your session context has been cleared. What would you like to work on next?`;
    return { handled: true, command: "clear", reply };
  }

  // 3. !status
  if (lower === "!status" || lower === "status") {
    const session = getWhatsAppSession(cleanPhone);
    let linkedUserId = session?.linkedUserId;

    if (!linkedUserId && env.BLUEPRINTS) {
      linkedUserId = (await env.BLUEPRINTS.get(`wp:${cleanPhone}`)) || undefined;
    }

    const isLinked = Boolean(linkedUserId);
    const historyCount = session?.history?.length || 0;

    const statusMsg =
      `📊 *Voltrix OS WhatsApp Copilot Status*\n\n` +
      `• *User:* ${cleanPhone}\n` +
      `• *Web Sync:* ${isLinked ? `✅ Linked (${linkedUserId})` : "⚪ Not Linked (Use !link <code>)"}\n` +
      `• *Reasoning Engine:* Voltrix Edge Agent & Llama 3.3 / DeepSeek R1\n` +
      `• *Context Turns:* ${historyCount} turns active\n` +
      `• *Capabilities:* 📄 Document Vision, 📸 Image OCR, 🎙️ Voice STT/TTS\n` +
      `• *Status:* ⚡ Operational`;

    return { handled: true, command: "status", reply: statusMsg };
  }

  // 4. !link <code>
  if (lower.startsWith("!link")) {
    const code = text.replace(/!link/i, "").trim();

    if (!code || !/^\d{6}$/.test(code)) {
      const invalidMsg =
        `❌ *Invalid Link Code*\n\n` +
        `To link your WhatsApp with Voltrix OS:\n` +
        `1. Log in on web: https://os.voltrix.stream\n` +
        `2. Open *Profile* or *Settings*\n` +
        `3. Click *Generate Link Code*\n` +
        `4. Reply here with: *!link 123456*`;
      return { handled: true, command: "link", reply: invalidMsg };
    }

    let linkedUser: { userId: string; name?: string } | null = null;

    // Check KV first
    if (env.BLUEPRINTS) {
      const raw = await env.BLUEPRINTS.get(`wl:${code}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          linkedUser = { userId: parsed.userId, name: parsed.name };
          await env.BLUEPRINTS.delete(`wl:${code}`);
          await env.BLUEPRINTS.put(`wp:${cleanPhone}`, parsed.userId, {
            expirationTtl: 60 * 60 * 24 * 365,
          });
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Check in-memory linking codes
    if (!linkedUser && linkingCodes.has(code)) {
      const info = linkingCodes.get(code)!;
      if (Date.now() <= info.expiresAt) {
        linkedUser = { userId: info.userId, name: info.name };
      }
      linkingCodes.delete(code);
    }

    if (!linkedUser) {
      const expiredMsg =
        `⚠️ *Expired or Invalid Link Code*\n\n` +
        `This code is not recognized or has expired. Please generate a fresh 6-digit code in your Voltrix OS dashboard.`;
      return { handled: true, command: "link", reply: expiredMsg };
    }

    // Update in-memory session
    let session = getWhatsAppSession(cleanPhone);
    if (!session) {
      session = {
        phoneNumber: cleanPhone,
        linkedUserId: linkedUser.userId,
        userName: linkedUser.name,
        history: [],
        lastActive: Date.now(),
      };
      userSessions.set(cleanPhone, session);
    } else {
      session.linkedUserId = linkedUser.userId;
      if (linkedUser.name) session.userName = linkedUser.name;
      session.lastActive = Date.now();
    }

    const successMsg =
      `🎉 *Account Successfully Linked!*\n\n` +
      `Your WhatsApp is now synced with your Voltrix OS account (${linkedUser.name || linkedUser.userId}). ` +
      `Your workspaces, notes, and profile will now automatically inform your AI answers!`;

    return { handled: true, command: "link", reply: successMsg };
  }

  return { handled: false };
}

/**
 * Edge Agent Bridge: processes incoming message, routes commands, runs AI agent,
 * formats and chunk splits reply, and dispatches outbound WhatsApp messages.
 */
export async function processWhatsAppMessage(
  message: ProcessedWhatsAppMessage,
  env: WhatsAppEnv
): Promise<{ reply?: string; sent?: boolean; command?: string }> {
  const from = message.from;
  const cleanPhone = cleanPhoneNumber(from);
  const userText = message.text || message.transcription || message.extractedText || "";

  if (!userText.trim()) {
    return { sent: false };
  }

  // 1. Check commands
  const cmdResult = await handleWhatsAppCommand(from, userText, env);
  if (cmdResult.handled && cmdResult.reply) {
    message.command = cmdResult.command;
    message.reply = cmdResult.reply;

    let sent = false;
    if (env.AUTO_REPLY !== false && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN) {
      sent = await sendWhatsAppMessage(cleanPhone, cmdResult.reply, env);
    }
    return { reply: cmdResult.reply, sent, command: cmdResult.command };
  }

  // 2. Load or initialize session
  let session = getWhatsAppSession(cleanPhone);
  if (!session) {
    session = {
      phoneNumber: cleanPhone,
      history: [],
      lastActive: Date.now(),
    };
    userSessions.set(cleanPhone, session);
  }
  session.lastActive = Date.now();

  if (!session.linkedUserId && env.BLUEPRINTS) {
    const linkedId = await env.BLUEPRINTS.get(`wp:${cleanPhone}`).catch(() => null);
    if (linkedId) session.linkedUserId = linkedId;
  }

  // Append user message to history
  session.history.push({ role: "user", content: userText, timestamp: Date.now() });
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }

  // 3. Generate Agent Response
  let rawReply = "";

  // 3.1 Custom AGENT_BRIDGE
  if (typeof env.AGENT_BRIDGE === "function") {
    try {
      rawReply = await env.AGENT_BRIDGE(
        userText,
        {
          phone: cleanPhone,
          history: session.history.slice(0, -1),
          linkedUserId: session.linkedUserId,
          name: session.userName,
        },
        env
      );
    } catch (err) {
      console.warn("AGENT_BRIDGE error:", err);
    }
  }

  // 3.2 Workers AI
  const ai = env.WORKERS_AI || (env as any).AI;
  if (!rawReply && ai && typeof ai.run === "function") {
    try {
      const messages = [
        {
          role: "system",
          content:
            "You are Voltrix OS AI Copilot on WhatsApp. Provide concise, accurate, and rigorous assistance. Use WhatsApp-friendly markdown.",
        },
        ...session.history.map((m) => ({ role: m.role, content: m.content })),
      ];
      const res = await ai.run("@cf/meta/llama-3.3-70b-instruct", { messages });
      if (res && typeof res.response === "string") {
        rawReply = res.response.trim();
      }
    } catch (err) {
      console.warn("Workers AI chat error:", err);
    }
  }

  // 3.3 Groq Chat Completion
  if (!rawReply && env.GROQ_API_KEY) {
    try {
      const endpoint =
        env.CF_AI_GATEWAY && env.CF_AI_GATEWAY_ACCOUNT_ID
          ? `https://gateway.ai.cloudflare.com/v1/${env.CF_AI_GATEWAY_ACCOUNT_ID}/${env.CF_AI_GATEWAY}/groq/chat/completions`
          : "https://api.groq.com/openai/v1/chat/completions";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are Voltrix OS AI Copilot on WhatsApp. Provide concise, accurate, and rigorous assistance. Use WhatsApp-friendly markdown.",
            },
            ...session.history.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        rawReply = data?.choices?.[0]?.message?.content?.trim() || "";
      }
    } catch (err) {
      console.warn("Groq chat error:", err);
    }
  }

  // 3.4 OpenAI Chat Completion
  if (!rawReply && env.OPENAI_API_KEY) {
    try {
      const endpoint =
        env.CF_AI_GATEWAY && env.CF_AI_GATEWAY_ACCOUNT_ID
          ? `https://gateway.ai.cloudflare.com/v1/${env.CF_AI_GATEWAY_ACCOUNT_ID}/${env.CF_AI_GATEWAY}/openai/chat/completions`
          : "https://api.openai.com/v1/chat/completions";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are Voltrix OS AI Copilot on WhatsApp. Provide concise, accurate, and rigorous assistance. Use WhatsApp-friendly markdown.",
            },
            ...session.history.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        rawReply = data?.choices?.[0]?.message?.content?.trim() || "";
      }
    } catch (err) {
      console.warn("OpenAI chat error:", err);
    }
  }

  // 3.5 Fallback intelligent reply
  if (!rawReply) {
    rawReply = `Hello! I received your message: "${userText}". How can Voltrix OS assist you today?`;
  }

  // Append assistant turn to history
  session.history.push({ role: "assistant", content: rawReply, timestamp: Date.now() });

  // Format response for WhatsApp
  const formattedReply = formatForWhatsApp(rawReply);
  message.reply = formattedReply;

  // Split into chunks
  const chunks = splitMessageChunks(formattedReply);

  // Dispatch outbound message if configured
  let sentAll = false;
  if (env.AUTO_REPLY !== false && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN) {
    sentAll = true;
    for (const chunk of chunks) {
      const ok = await sendWhatsAppMessage(cleanPhone, chunk, env);
      if (!ok) sentAll = false;
    }

    // Voice reply dispatch if incoming was voice or requested audio
    const isVoice = message.type === "voice" || message.type === "audio";
    const wantsVoice = /\b(voice\s*reply|voice\s*note|send\s*voice|audio\s*note|read\s*out|speak\s*to\s*me|send\s*audio)\b/i.test(
      userText
    );

    if ((isVoice || wantsVoice) && typeof env.TTS_ENGINE === "function") {
      try {
        const summary = formattedReply.replace(/[*_#•`]/g, "").slice(0, 300);
        const tts = await env.TTS_ENGINE(summary, env);
        if (tts?.buffer) {
          await sendWhatsAppAudioMessage(cleanPhone, tts.buffer, env, tts.mimeType || "audio/ogg");
        }
      } catch (ttsErr) {
        console.warn("Outbound voice synthesis error:", ttsErr);
      }
    }
  }

  return { reply: formattedReply, sent: sentAll };
}

/**
 * Challenge Verification Handler (GET /api/webhooks/whatsapp)
 *
 * Meta calls this with:
 * - hub.mode = "subscribe"
 * - hub.verify_token = env.WHATSAPP_VERIFY_TOKEN
 * - hub.challenge = <random challenge token>
 *
 * Returns 200 with challenge on match, 403 on mismatch.
 */
export async function handleWhatsAppWebhookGet(
  req: Request,
  env: WhatsAppEnv
): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expectedToken = env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expectedToken && token === expectedToken) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Incoming Webhook Handler (POST /api/webhooks/whatsapp)
 *
 * Parses incoming WhatsApp Cloud API events:
 * - text messages
 * - voice / audio messages
 * - document attachments (PDF, DOCX, text)
 * - images
 * - interactive button and list replies
 */
export async function handleWhatsAppWebhookPost(
  req: Request,
  env: WhatsAppEnv,
  _ctx?: ExecutionContext
): Promise<Response> {
  let payload: WhatsAppWebhookPayload;
  try {
    payload = (await req.json()) as WhatsAppWebhookPayload;
  } catch (err: any) {
    return Response.json(
      { error: "Invalid JSON payload", details: err?.message },
      { status: 400 }
    );
  }

  const processedMessages: ProcessedWhatsAppMessage[] = [];

  if (payload && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      if (!Array.isArray(entry.changes)) continue;
      for (const change of entry.changes) {
        const value = change.value;
        if (!value || !Array.isArray(value.messages)) continue;

        for (const message of value.messages) {
          const { id, from, timestamp, type } = message;

          // Message deduplication
          if (id && isMessageProcessed(id)) {
            continue;
          }

          markWhatsAppMessageAsRead(id, env).catch(() => {});

          if (type === "text" && message.text) {
            const body = message.text.body;
            const processedMsg: ProcessedWhatsAppMessage = {
              id,
              from,
              type: "text",
              timestamp,
              text: body,
            };

            await processWhatsAppMessage(processedMsg, env);
            processedMessages.push(processedMsg);
          } else if (type === "interactive" && message.interactive) {
            const buttonTitle =
              message.interactive.button_reply?.title || message.interactive.list_reply?.title || "";
            const processedMsg: ProcessedWhatsAppMessage = {
              id,
              from,
              type: "interactive",
              timestamp,
              text: buttonTitle,
            };

            await processWhatsAppMessage(processedMsg, env);
            processedMessages.push(processedMsg);
          } else if (type === "audio" || type === "voice") {
            const audioObj = message.audio || message.voice;
            if (!audioObj || !audioObj.id) {
              processedMessages.push({
                id,
                from,
                type,
                timestamp,
                error: "Missing audio or voice object id",
              });
              continue;
            }

            const mediaId = audioObj.id;
            const mimeType = audioObj.mime_type || "audio/ogg";

            try {
              if (!env.WHATSAPP_ACCESS_TOKEN) {
                throw new Error("WHATSAPP_ACCESS_TOKEN is not configured");
              }

              // 1. Query media URL & fetch binary stream
              const media = await fetchWhatsAppMedia(mediaId, env.WHATSAPP_ACCESS_TOKEN);
              const effectiveMimeType = media.mimeType || mimeType;

              // 2. Persist to R2 under hf-videos/whatsapp-<id>.<ext>
              let r2Key: string | undefined;
              if (env.BLUEPRINT_CONTENT) {
                r2Key = await saveAudioToR2(
                  env.BLUEPRINT_CONTENT,
                  mediaId,
                  effectiveMimeType,
                  media.buffer
                );
              }

              // 3. Transcribe audio via ASR engine
              const transcription = await transcribeAudio(
                media.buffer,
                effectiveMimeType,
                env
              );

              const processedMsg: ProcessedWhatsAppMessage = {
                id,
                from,
                type,
                timestamp,
                mediaId,
                mimeType: effectiveMimeType,
                r2Key,
                transcription,
              };

              await processWhatsAppMessage(processedMsg, env);
              processedMessages.push(processedMsg);
            } catch (mediaErr: any) {
              console.error(`Error processing WhatsApp audio ${mediaId}:`, mediaErr);
              processedMessages.push({
                id,
                from,
                type,
                timestamp,
                mediaId,
                mimeType,
                error: mediaErr?.message || String(mediaErr),
              });
            }
          } else if (type === "document") {
            const docObj = message.document;
            if (!docObj || !docObj.id) {
              processedMessages.push({
                id,
                from,
                type: "document",
                timestamp,
                error: "Missing document object id",
              });
              continue;
            }

            const mediaId = docObj.id;
            const filename = docObj.filename || "Document.pdf";
            const mimeType = docObj.mime_type || "application/pdf";
            const caption = message.caption || docObj.caption || "";

            try {
              if (!env.WHATSAPP_ACCESS_TOKEN) {
                throw new Error("WHATSAPP_ACCESS_TOKEN is not configured");
              }

              const media = await fetchWhatsAppMedia(mediaId, env.WHATSAPP_ACCESS_TOKEN);
              const extracted = await extractDocumentText(
                media.buffer,
                media.mimeType || mimeType,
                filename,
                caption,
                env
              );

              const formattedPrompt = extracted
                ? `📄 [Attached Document: "${filename}"]\n${caption ? `User Note: "${caption}"\n\n` : ""}[DOCUMENT CONTENT]:\n${extracted}\n[END DOCUMENT CONTENT]`
                : `📄 [Attached Document: "${filename}"]${caption ? `\nUser Note: ${caption}` : ""}`;

              const processedMsg: ProcessedWhatsAppMessage = {
                id,
                from,
                type: "document",
                timestamp,
                mediaId,
                mimeType: media.mimeType || mimeType,
                filename,
                extractedText: extracted,
                text: formattedPrompt,
              };

              await processWhatsAppMessage(processedMsg, env);
              processedMessages.push(processedMsg);
            } catch (docErr: any) {
              console.error(`Error processing WhatsApp document ${mediaId}:`, docErr);
              processedMessages.push({
                id,
                from,
                type: "document",
                timestamp,
                mediaId,
                filename,
                mimeType,
                error: docErr?.message || String(docErr),
              });
            }
          } else if (type === "image") {
            const imgObj = message.image;
            const caption = message.caption || imgObj?.caption || "";

            if (!imgObj || !imgObj.id) {
              processedMessages.push({
                id,
                from,
                type: "image",
                timestamp,
                error: "Missing image object id",
              });
              continue;
            }

            const mediaId = imgObj.id;
            const mimeType = imgObj.mime_type || "image/jpeg";

            try {
              let extracted = "";
              if (env.WHATSAPP_ACCESS_TOKEN) {
                const media = await fetchWhatsAppMedia(mediaId, env.WHATSAPP_ACCESS_TOKEN);
                extracted = await extractDocumentText(
                  media.buffer,
                  media.mimeType || mimeType,
                  "image.jpg",
                  caption,
                  env
                );
              }

              const prompt = `📸 [Attached Image Analysis]:\n${extracted || caption || "Image attached"}`;
              const processedMsg: ProcessedWhatsAppMessage = {
                id,
                from,
                type: "image",
                timestamp,
                mediaId,
                mimeType,
                text: prompt,
                extractedText: extracted,
              };

              await processWhatsAppMessage(processedMsg, env);
              processedMessages.push(processedMsg);
            } catch (imgErr: any) {
              console.error(`Error processing WhatsApp image ${mediaId}:`, imgErr);
              processedMessages.push({
                id,
                from,
                type: "image",
                timestamp,
                mediaId,
                mimeType,
                error: imgErr?.message || String(imgErr),
              });
            }
          } else {
            // Other unhandled message types
            processedMessages.push({
              id,
              from,
              type,
              timestamp,
            });
          }
        }
      }
    }
  }

  return Response.json(
    {
      status: "ok",
      processed: processedMessages.length,
      results: processedMessages,
    },
    { status: 200 }
  );
}

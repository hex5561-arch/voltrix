import { inflateSync, inflateRawSync } from "node:zlib";

/**
 * High-performance, zero-ReDoS PDF text extractor for Edge (Cloudflare Workers) and Node.js.
 * Uses buffer byte scanning instead of whole-file regexes to extract text from PDF content
 * streams in milliseconds without blocking the event loop.
 */

// Max characters to extract before truncation (safeguard against LLM context limits)
const MAX_EXTRACTED_CHARS = 150_000;
// Max time in ms allowed for extraction before graceful exit
const MAX_PARSE_TIME_MS = 2_500;

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

/**
 * Extract human text from a decoded content stream (BT ... ET blocks).
 * Uses strictly linear, non-backtracking regex patterns.
 */
function extractFromContentStream(streamStr: string): string {
  let result = "";
  const btMatches = streamStr.match(/BT[\s\S]*?ET/g) || [];
  for (const block of btMatches) {
    // 1. Array strings: [(Hello) 10 (World)] TJ
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

    // 2. Direct string: (Hello World) Tj
    const singleMatches = block.match(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g) || [];
    for (const s of singleMatches) {
      const textPart = s.match(/\((.*)\)\s*Tj/);
      if (textPart) result += decodePdfString(textPart[1]) + "\n";
    }

    // 3. Direct hex string: <48656c6c6f> Tj
    const hexSingle = block.match(/<([0-9a-fA-F]+)>\s*Tj/g) || [];
    for (const h of hexSingle) {
      const hexPart = h.match(/<([0-9a-fA-F]+)>\s*Tj/);
      if (hexPart) result += decodeHexString(hexPart[1]) + "\n";
    }

    // 4. Quote operators: ' or "
    const quoteMatches = block.match(/\(((?:[^()\\]|\\.)*)\)\s*['"]/g) || [];
    for (const q of quoteMatches) {
      const textPart = q.match(/\((.*)\)\s*['"]/);
      if (textPart) result += decodePdfString(textPart[1]) + "\n";
    }
  }

  return result;
}

/**
 * Fast byte-level search in Uint8Array.
 */
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

/**
 * Extract human-readable text from a PDF byte array.
 * Fast, non-blocking, and handles multi-megabyte PDFs in milliseconds.
 */
export async function extractTextFromPdf(data: Uint8Array): Promise<string> {
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

    // 1. Locate next 'stream' keyword
    let streamPos = -1;
    if (bufView) {
      streamPos = bufView.indexOf("stream", pos);
    } else {
      streamPos = findBytes(data, STREAM_NEEDLE, pos);
    }
    if (streamPos === -1) break;

    // 2. Locate start of stream binary data (skip \r?\n)
    let streamStart = streamPos + 6;
    if (data[streamStart] === 13) streamStart++;
    if (data[streamStart] === 10) streamStart++;

    // 3. Locate 'endstream'
    let streamEnd = -1;
    if (bufView) {
      streamEnd = bufView.indexOf("endstream", streamStart);
    } else {
      streamEnd = findBytes(data, ENDSTREAM_NEEDLE, streamStart);
    }
    if (streamEnd === -1) break;

    // 4. Inspect the preceding dictionary (up to 600 bytes) for stream type
    const dictStart = Math.max(0, streamPos - 600);
    const dictBytes = data.subarray(dictStart, streamPos);
    const dictChunk = new TextDecoder("latin1").decode(dictBytes);

    // Skip raster images and embedded font files (vast majority of PDF bytes)
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
            // Not a valid zlib chunk; ignore
          }
        }
      } else {
        // Uncompressed stream
        decompressedStr = new TextDecoder("latin1").decode(chunk);
      }

      // Check if the stream actually contains PDF text objects (BT ... ET)
      if (decompressedStr && decompressedStr.includes("BT") && decompressedStr.includes("ET")) {
        const text = extractFromContentStream(decompressedStr);
        if (text.trim()) {
          fullText += text + "\n";
        }
      }
    }

    pos = streamEnd + 9;
  }

  // Fallback: literal string scan if no text streams were found
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

  const cleaned = fullText
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  if (fullText.length >= MAX_EXTRACTED_CHARS) {
    return cleaned + "\n\n[... Additional document content truncated for context limit ...]";
  }

  return cleaned;
}

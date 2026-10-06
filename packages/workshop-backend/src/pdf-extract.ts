/**
 * Zero-dependency PDF text extractor for Edge and Node.js environments.
 * Extracts text from content streams (both uncompressed and FlateDecode compressed)
 * using standard Web APIs (DecompressionStream, TextDecoder) with Node zlib fallback.
 */

// Chunk size for converting Uint8Array to string without call stack overflow
const CHUNK_SIZE = 16384;

function bytesToString(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    result += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return result;
}

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
    // Check for UTF-16BE BOM
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
    // 1. Array strings: [(Hello) 10 (World)] TJ
    const tjArrayRegex = /\[((?:[^[\]]*|\([^)]*\)|<[^>]*>)+)\]\s*TJ/g;
    let m: RegExpExecArray | null;
    while ((m = tjArrayRegex.exec(block)) !== null) {
      const inner = m[1];
      // Match paren strings ( ... )
      const strMatches = inner.match(/\((?:[^()\\]|\\.)*\)/g) || [];
      for (const s of strMatches) {
        const decoded = decodePdfString(s.slice(1, -1));
        if (decoded) result += decoded + " ";
      }
      // Match hex strings < ... >
      const hexMatches = inner.match(/<([0-9a-fA-F]+)>/g) || [];
      for (const h of hexMatches) {
        const decoded = decodeHexString(h.slice(1, -1));
        if (decoded) result += decoded + " ";
      }
    }

    // 2. Direct strings: (Hello World) Tj
    const tjSingleRegex = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
    while ((m = tjSingleRegex.exec(block)) !== null) {
      if (m[1]) result += decodePdfString(m[1]) + "\n";
    }

    // 3. Hex strings: <48656c6c6f> Tj
    const tjHexRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
    while ((m = tjHexRegex.exec(block)) !== null) {
      const decoded = decodeHexString(m[1]);
      if (decoded) result += decoded + "\n";
    }

    // 4. Quotation operators: ' or "
    const quoteRegex = /\(((?:[^()\\]|\\.)*)\)\s*['"]/g;
    while ((m = quoteRegex.exec(block)) !== null) {
      if (m[1]) result += decodePdfString(m[1]) + "\n";
    }
  }

  return result;
}

async function decompressChunk(chunk: Uint8Array): Promise<string | null> {
  // 1. Try DecompressionStream('deflate') — RFC 1950 zlib format (standard in CF Workers & modern browsers)
  if (typeof DecompressionStream !== "undefined") {
    try {
      const ds = new DecompressionStream("deflate");
      const writer = ds.writable.getWriter();
      writer.write(chunk);
      writer.close();
      const res = new Response(ds.readable);
      const buf = await res.arrayBuffer();
      return new TextDecoder().decode(buf);
    } catch {
      // Fall through to deflate-raw
    }

    try {
      const ds = new DecompressionStream("deflate-raw");
      const writer = ds.writable.getWriter();
      writer.write(chunk);
      writer.close();
      const res = new Response(ds.readable);
      const buf = await res.arrayBuffer();
      return new TextDecoder().decode(buf);
    } catch {
      // Fall through to zlib
    }
  }

  // 2. Fallback for Node.js environments (unit tests / local dev)
  try {
    const zlib = await import("node:zlib");
    try {
      return zlib.inflateSync(chunk).toString("utf-8");
    } catch {
      return zlib.inflateRawSync(chunk).toString("utf-8");
    }
  } catch {
    // No decompressor available
  }

  return null;
}

/**
 * Extract human-readable text from a PDF byte array.
 * Works seamlessly in Cloudflare Workers edge environment and Node.js.
 */
export async function extractTextFromPdf(data: Uint8Array): Promise<string> {
  if (!data || data.length === 0) return "";

  const rawString = bytesToString(data);
  let fullExtractedText = "";

  // 1. Check uncompressed streams
  const uncompressedStreamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let streamMatch: RegExpExecArray | null;
  while ((streamMatch = uncompressedStreamRegex.exec(rawString)) !== null) {
    const streamContent = streamMatch[1];
    // Skip if it looks like binary image data
    if (/^\s*(ÿØÿ|\x89PNG|GIF8|BM)/.test(streamContent)) continue;
    const text = extractFromContentStream(streamContent);
    if (text.trim()) {
      fullExtractedText += text + "\n";
    }
  }

  // 2. Decompress FlateDecode streams
  const objStreamRegex = /<<[\s\S]*?\/Filter\s*(?:\[\s*\/FlateDecode|\/FlateDecode)[\s\S]*?>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let objMatch: RegExpExecArray | null;
  while ((objMatch = objStreamRegex.exec(rawString)) !== null) {
    try {
      const streamStart = objMatch.index + objMatch[0].indexOf("stream") + 6;
      let actualStart = streamStart;
      if (data[actualStart] === 13) actualStart++;
      if (data[actualStart] === 10) actualStart++;

      const streamEnd = objMatch.index + objMatch[0].lastIndexOf("endstream");
      let actualEnd = streamEnd;
      if (data[actualEnd - 1] === 10) actualEnd--;
      if (data[actualEnd - 1] === 13) actualEnd--;

      if (actualEnd > actualStart) {
        const compressedChunk = data.subarray(actualStart, actualEnd);
        const decompressedStr = await decompressChunk(compressedChunk);
        if (decompressedStr) {
          const text = extractFromContentStream(decompressedStr);
          if (text.trim()) {
            fullExtractedText += text + "\n";
          }
        }
      }
    } catch {
      // Continue searching other streams
    }
  }

  // 3. Fallback: Literal string search if streams yielded nothing
  if (!fullExtractedText.trim()) {
    const rawMatches = rawString.match(/\(((?:[^()\\]|\\.)*)\)/g) || [];
    const filtered = rawMatches
      .map((s) => decodePdfString(s.slice(1, -1)))
      .filter((s) => /[a-zA-Z0-9\s]{4,}/.test(s) && !/^\s*$/.test(s) && !/^[\x00-\x1F]+$/.test(s))
      .join(" ");
    if (filtered.length > 50) {
      fullExtractedText = filtered;
    }
  }

  return fullExtractedText
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

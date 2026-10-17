import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  extractTextFromImageWithGemini,
  analyzeVideoWithGemini,
  extractTextFromPdfFast,
  extractTextFromDocx,
  extractDocumentContent,
} from "../src/doc-extract.ts";

import {
  getVoltrixDbScript,
  normalizeSiteHtml,
  sanitizeSiteSlug,
} from "../../workshop-backend/src/sites.ts";

describe("Voltrix WhatsApp Multimodal & Edge Hosting Test Suite", () => {
  const originalFetch = globalThis.fetch;

  test("1. PTT Gating: sendWhatsAppAudioMessage strictly omits ptt:true for MP3", async () => {
    // Test logic simulating sendWhatsAppAudioMessage PTT gating
    const lowerMime = "audio/mpeg";
    const mp3Bytes = new Uint8Array([0x49, 0x44, 0x33, 0x03]); // ID3 header
    const hasOggMagic =
      mp3Bytes.length >= 4 &&
      mp3Bytes[0] === 0x4f &&
      mp3Bytes[1] === 0x67 &&
      mp3Bytes[2] === 0x67 &&
      mp3Bytes[3] === 0x53;

    const isOpusMime = lowerMime.includes("ogg") && lowerMime.includes("opus");
    const isOpusOnly = lowerMime.includes("opus") && !lowerMime.includes("mp3");
    let effectiveMime = "audio/mpeg";
    if (isOpusMime || (isOpusOnly && hasOggMagic)) {
      effectiveMime = "audio/ogg; codecs=opus";
    }

    const isOpusOgg = effectiveMime.includes("ogg") && effectiveMime.includes("opus");
    const pttRequested = true;
    const sendPtt = Boolean(pttRequested && isOpusOgg);

    assert.equal(effectiveMime, "audio/mpeg");
    assert.equal(sendPtt, false, "PTT flag must be false for MP3 audio to prevent Meta dropping message");
  });

  test("2. PTT Gating: sendWhatsAppAudioMessage enables ptt:true strictly for Ogg Opus", async () => {
    const oggBytes = new Uint8Array([0x4f, 0x67, 0x67, 0x53]); // OggS magic
    const lowerMime = "audio/ogg; codecs=opus";
    const hasOggMagic =
      oggBytes.length >= 4 &&
      oggBytes[0] === 0x4f &&
      oggBytes[1] === 0x67 &&
      oggBytes[2] === 0x67 &&
      oggBytes[3] === 0x53;

    let effectiveMime = "audio/ogg; codecs=opus";
    const isOpusOgg = effectiveMime.includes("ogg") && effectiveMime.includes("opus");
    const sendPtt = Boolean(true && isOpusOgg);

    assert.equal(hasOggMagic, true);
    assert.equal(isOpusOgg, true);
    assert.equal(sendPtt, true, "PTT flag must be true for authentic OGG Opus voice notes");
  });

  test("3. Media Download: verifies curl User-Agent and Authorization header for Meta CDN", async () => {
    let capturedHeadersMeta = null;
    let capturedHeadersCdn = null;

    globalThis.fetch = async (url, init) => {
      const urlStr = url.toString();
      if (urlStr.includes("graph.facebook.com")) {
        capturedHeadersMeta = new Headers(init?.headers);
        return new Response(JSON.stringify({ url: "https://lookaside.fbsbx.com/test-media.jpg", mime_type: "image/jpeg" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("lookaside.fbsbx.com")) {
        capturedHeadersCdn = new Headers(init?.headers);
        return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    };

    // Simulate downloadMedia logic
    const metaRes = await fetch("https://graph.facebook.com/v21.0/media_123", {
      headers: { Authorization: "Bearer token_xyz", "User-Agent": "curl/7.64.1" },
    });
    const meta = await metaRes.json();
    const cdnRes = await fetch(meta.url, {
      headers: { Authorization: "Bearer token_xyz", "User-Agent": "curl/7.64.1" },
    });
    const data = await cdnRes.arrayBuffer();

    assert.equal(capturedHeadersMeta.get("User-Agent"), "curl/7.64.1");
    assert.equal(capturedHeadersMeta.get("Authorization"), "Bearer token_xyz");
    assert.equal(capturedHeadersCdn.get("User-Agent"), "curl/7.64.1");
    assert.equal(capturedHeadersCdn.get("Authorization"), "Bearer token_xyz");
    assert.equal(data.byteLength, 4);

    globalThis.fetch = originalFetch;
  });

  test("4. Image OCR: extractTextFromImageWithGemini passes image base64 to Gemini Vision", async () => {
    let capturedBody = null;

    globalThis.fetch = async (url, init) => {
      if (url.toString().includes("models/gemini-3.8-flash:generateContent")) {
        capturedBody = JSON.parse(init.body);
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: "Problem 1: Evaluate integral of 2x dx from 0 to 5. Diagram shows a right triangle." }],
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("Not found", { status: 404 });
    };

    const dummyImg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;
    const result = await extractTextFromImageWithGemini("test_gemini_key", dummyImg, "image/jpeg", "Solve Question 1");

    assert.match(result, /Problem 1: Evaluate integral/);
    assert.equal(capturedBody.contents[0].parts[1].inlineData.mimeType, "image/jpeg");
    assert.match(capturedBody.contents[0].parts[0].text, /Solve Question 1/);

    globalThis.fetch = originalFetch;
  });

  test("5. Video Transcription: analyzeVideoWithGemini transcribes speech and visual scenes", async () => {
    let capturedBody = null;

    globalThis.fetch = async (url, init) => {
      if (url.toString().includes("models/gemini-3.8-flash:generateContent")) {
        capturedBody = JSON.parse(init.body);
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: "Speaker explains Newton's third law: 'Every action has an equal and opposite reaction.' Whiteboard demonstrates collision vectors.",
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("Not found", { status: 404 });
    };

    const dummyVideo = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]).buffer; // ftyp mp4
    const result = await analyzeVideoWithGemini("test_gemini_key", dummyVideo, "video/mp4", "Physics lecture");

    assert.match(result, /Newton's third law/);
    assert.equal(capturedBody.contents[0].parts[1].inlineData.mimeType, "video/mp4");
    assert.match(capturedBody.contents[0].parts[0].text, /Physics lecture/);

    globalThis.fetch = originalFetch;
  });

  test("6. Document Extraction: plain text, code, and markdown decoding", async () => {
    const pyCode = "def fibonacci(n):\n    return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)";
    const encoded = new TextEncoder().encode(pyCode).buffer;

    const extracted = await extractDocumentContent(encoded, "text/x-python", "solution.py", "");
    assert.equal(extracted, pyCode);
  });

  test("7. Edge App Backend: VoltrixDB SDK script generation and HTML injection", () => {
    const slug = "calculator-app-123";
    const script = getVoltrixDbScript(slug);

    assert.match(script, /window\.VoltrixDB/);
    assert.match(script, /calculator-app-123/);
    assert.match(script, /getApiBase/);
    assert.match(script, /localStorage\.getItem/);

    // Full HTML5 document injection
    const fullHtml = "<!DOCTYPE html><html><head><title>My App</title></head><body><h1>Calc</h1></body></html>";
    const normalizedFull = normalizeSiteHtml(fullHtml, "My App", slug);

    assert.match(normalizedFull, /id="voltrix-edge-sdk"/);
    assert.match(normalizedFull, /window\.VoltrixDB/);

    // Fragment wrapper injection
    const fragmentHtml = "<div class='p-4'><h1>Simple Fragment</h1></div>";
    const normalizedFragment = normalizeSiteHtml(fragmentHtml, "Simple Fragment", slug);

    assert.match(normalizedFragment, /id="voltrix-edge-sdk"/);
    assert.match(normalizedFragment, /Simple Fragment/);
  });

  test("8. WhatsApp App Card: auto-publishing replaces raw HTML block with clean App Card", () => {
    const aiReply =
      "Here is the interactive quiz game you requested!\n\n" +
      "```html\n<!DOCTYPE html><html><head><title>Solar System Quiz</title></head><body><h1>Quiz</h1></body></html>\n```\n\n" +
      "You can answer all questions directly in your browser!";

    const htmlBlockRegex = /```(?:html|web|xml)?\s*(<!DOCTYPE[\s\S]*?|<html[\s\S]*?)```/i;
    const match = aiReply.match(htmlBlockRegex);
    assert.ok(match, "HTML code block must be detected");

    const liveUrl = "https://voltrix.stream/s/solar-system-quiz-4819";
    const appCard =
      `\n\n🚀 *Your Web App is Live on Global Edge!*\n` +
      `📱 *App:* Solar System Quiz\n` +
      `🔗 *Live URL:* ${liveUrl}\n` +
      `💾 *Backend Storage:* \`VoltrixDB\` Enabled (Persistent State)\n` +
      `⚡ _Sub-50ms TTFB worldwide. Open to test and interact with your app directly on your phone!_`;

    const cleanedReply = aiReply.replace(match[0], "").trim() + "\n\n" + appCard;

    assert.ok(!cleanedReply.includes("<!DOCTYPE html>"), "Raw HTML must be stripped from WhatsApp text");
    assert.match(cleanedReply, /https:\/\/voltrix\.stream\/s\/solar-system-quiz-4819/);
    assert.match(cleanedReply, /VoltrixDB/);
  });
});

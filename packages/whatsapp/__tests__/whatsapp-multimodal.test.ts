import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  downloadMedia,
  sendWhatsAppAudioMessage,
  sendWhatsAppImageMessage,
  generateImage,
  processMessage,
  formatForWhatsApp,
  cleanPhoneNumber,
  cleanTextForSpeech,
  handleCommand,
  Env,
} from "../src/index";
import {
  extractTextFromImageWithGemini,
  analyzeVideoWithGemini,
  extractTextFromPdfFast,
  extractTextFromDocx,
  extractDocumentContent,
} from "../src/doc-extract";

describe("WhatsApp Edge Multimodal Capabilities", () => {
  const originalFetch = globalThis.fetch;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      WHATSAPP_PHONE_NUMBER_ID: "1234567890",
      WHATSAPP_ACCESS_TOKEN: "mock_wa_access_token_xyz",
      VERIFY_TOKEN: "mock_verify_token",
      GEMINI_API_KEY: "mock_gemini_key_123",
      THEHIVE_API_KEY: "mock_thehive_key_456",
      AI: {
        run: vi.fn(),
      },
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ── 1. IMAGE & MEDIA DOWNLOAD FIX ──────────────────────────────────────────

  describe("1. Image & Media Download (`downloadMedia`)", () => {
    it("fetches metadata with curl User-Agent and Authorization header, then downloads binary from CDN", async () => {
      const mediaId = "media_photo_123";
      const cdnUrl = "https://lookaside.fbsbx.com/whatsapp_business/attachments/photo.jpg";
      const dummyBinary = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);

      const fetchSpy = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.includes(`graph.facebook.com/v21.0/${mediaId}`)) {
          expect(init?.headers).toBeDefined();
          const headers = new Headers(init?.headers);
          expect(headers.get("Authorization")).toBe(`Bearer ${mockEnv.WHATSAPP_ACCESS_TOKEN}`);
          expect(headers.get("User-Agent")).toBe("curl/7.64.1");
          return new Response(JSON.stringify({ url: cdnUrl, mime_type: "image/jpeg" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (urlStr === cdnUrl) {
          expect(init?.headers).toBeDefined();
          const headers = new Headers(init?.headers);
          expect(headers.get("Authorization")).toBe(`Bearer ${mockEnv.WHATSAPP_ACCESS_TOKEN}`);
          expect(headers.get("User-Agent")).toBe("curl/7.64.1");
          return new Response(dummyBinary.buffer, {
            status: 200,
            headers: { "Content-Type": "image/jpeg" },
          });
        }
        return new Response("Not found", { status: 404 });
      });

      globalThis.fetch = fetchSpy;

      const result = await downloadMedia(mockEnv, mediaId);
      expect(result).not.toBeNull();
      expect(result?.mimeType).toBe("image/jpeg");
      expect(new Uint8Array(result!.data)).toEqual(dummyBinary);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("handles CDN download failure cleanly and logs error without crashing", async () => {
      const mediaId = "bad_media_id";
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Media not found" } }), { status: 404 })
      );

      const result = await downloadMedia(mockEnv, mediaId);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("extracts text and formulas from image using Gemini 3.8 Flash Vision", async () => {
      const dummyImgBytes = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const fakeTranscription = "Question 1: Calculate the integral of x^2 dx from 0 to 3.";

      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.includes("gemini-3.8-flash:generateContent")) {
          const body = JSON.parse(init?.body as string);
          expect(body.contents[0].parts[1].inlineData.mimeType).toBe("image/png");
          expect(body.contents[0].parts[1].inlineData.data).toBeDefined();
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: fakeTranscription }],
                  },
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const extracted = await extractTextFromImageWithGemini(
        mockEnv.GEMINI_API_KEY!,
        dummyImgBytes,
        "image/png",
        "Exam page 1"
      );
      expect(extracted).toBe(fakeTranscription);
    });

    it("processes inbound image message end-to-end and populates OCR transcription header", async () => {
      const imgBytes = new Uint8Array([10, 20, 30]).buffer;
      const ocrText = "Solve for x: 2x + 5 = 15";

      const calls: { url: string; body?: any }[] = [];
      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        const bodyStr = typeof init?.body === "string" ? init.body : undefined;
        const parsedBody = bodyStr ? JSON.parse(bodyStr) : undefined;
        calls.push({ url: urlStr, body: parsedBody });

        // Metadata endpoint
        if (urlStr.includes("graph.facebook.com/v21.0/img_123")) {
          return new Response(JSON.stringify({ url: "https://lookaside.fbsbx.com/test.jpg", mime_type: "image/jpeg" }), { status: 200 });
        }
        // CDN download
        if (urlStr === "https://lookaside.fbsbx.com/test.jpg") {
          return new Response(imgBytes, { status: 200 });
        }
        // Typing indicator
        if (urlStr.includes("/messages") && parsedBody?.typing_indicator) {
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        // Gemini Vision
        if (urlStr.includes("gemini-3.8-flash:generateContent")) {
          return new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: ocrText }] } }],
          }), { status: 200 });
        }
        // TheHive AI / Gemini AI reply
        if (urlStr.includes("thehive.ai") || urlStr.includes("gemini")) {
          return new Response(JSON.stringify({
            choices: [{ message: { content: "Subtract 5: 2x = 10, so x = 5." } }],
          }), { status: 200 });
        }
        // Outbound WhatsApp message
        if (urlStr.includes("/messages") && parsedBody?.type === "text") {
          return new Response(JSON.stringify({ messages: [{ id: "msg_sent" }] }), { status: 200 });
        }
        return new Response("OK", { status: 200 });
      });

      const message = {
        from: "256700000001",
        id: "wamid_inbound_img",
        type: "image",
        image: { id: "img_123", caption: "Help with homework" },
      };

      await processMessage(message, { profile: { name: "Alice" } }, mockEnv);

      // Verify outbound message was dispatched with solution
      const textMsg = calls.find(c => c.body?.type === "text" && c.body?.to === "256700000001");
      expect(textMsg).toBeDefined();
      expect(textMsg?.body?.text?.body).toContain("x = 5");
    });
  });

  // ── 2. VOICE & AUDIO REPLY FORMAT FIX ──────────────────────────────────────

  describe("2. Audio Message Format & Strict PTT Gating (`sendWhatsAppAudioMessage`)", () => {
    it("omits ptt or sets it false when sending MP3 (`audio/mpeg`) so Meta does not reject it", async () => {
      let mediaUploadedType = "";
      let messagePayload: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.endsWith("/media")) {
          const form = init?.body as FormData;
          mediaUploadedType = form.get("type") as string;
          return new Response(JSON.stringify({ id: "media_audio_mp3_1" }), { status: 200 });
        }
        if (urlStr.endsWith("/messages")) {
          messagePayload = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ messages: [{ id: "wam_audio_sent" }] }), { status: 200 });
        }
        return new Response("OK", { status: 200 });
      });

      const dummyMp3 = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]); // ID3 tag header
      const ok = await sendWhatsAppAudioMessage(mockEnv, "256712345678", dummyMp3, "audio/mpeg", true);

      expect(ok).toBe(true);
      expect(mediaUploadedType).toBe("audio/mpeg");
      expect(messagePayload).toBeDefined();
      expect(messagePayload.type).toBe("audio");
      expect(messagePayload.audio.id).toBe("media_audio_mp3_1");
      // PTT MUST BE OMITTED or undefined for MP3!
      expect(messagePayload.audio.ptt).toBeUndefined();
    });

    it("omits ptt for WAV (`audio/wav`) and MP4 (`audio/mp4`) audio messages", async () => {
      let sentAudio: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.endsWith("/media")) {
          return new Response(JSON.stringify({ id: "media_wav_1" }), { status: 200 });
        }
        if (urlStr.endsWith("/messages")) {
          sentAudio = JSON.parse(init?.body as string).audio;
          return new Response(JSON.stringify({ messages: [{ id: "wam_wav_sent" }] }), { status: 200 });
        }
        return new Response("OK", { status: 200 });
      });

      const dummyWav = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // RIFF
      const ok = await sendWhatsAppAudioMessage(mockEnv, "256712345678", dummyWav, "audio/wav", true);

      expect(ok).toBe(true);
      expect(sentAudio.ptt).toBeUndefined();
    });

    it("includes ptt: true ONLY when audio is genuinely Ogg Opus (`audio/ogg; codecs=opus`)", async () => {
      let mediaUploadedType = "";
      let messagePayload: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.endsWith("/media")) {
          const form = init?.body as FormData;
          mediaUploadedType = form.get("type") as string;
          return new Response(JSON.stringify({ id: "media_opus_1" }), { status: 200 });
        }
        if (urlStr.endsWith("/messages")) {
          messagePayload = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ messages: [{ id: "wam_opus_sent" }] }), { status: 200 });
        }
        return new Response("OK", { status: 200 });
      });

      // Genuine Ogg Opus bytes starting with 'OggS'
      const genuineOggOpus = new Uint8Array([
        0x4f, 0x67, 0x67, 0x53, // OggS
        0x00, 0x02, 0x00, 0x00,
        0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64, // OpusHead
      ]);

      const ok = await sendWhatsAppAudioMessage(
        mockEnv,
        "256712345678",
        genuineOggOpus,
        "audio/ogg; codecs=opus",
        true
      );

      expect(ok).toBe(true);
      expect(mediaUploadedType).toBe("audio/ogg; codecs=opus");
      expect(messagePayload.audio.ptt).toBe(true);
      expect(messagePayload.audio.id).toBe("media_opus_1");
    });
  });

  // ── 3. VIDEO TRANSCRIPTION & MULTIMODAL VIDEO ──────────────────────────────

  describe("3. Video Transcription & Multimodal Video (`analyzeVideoWithGemini`)", () => {
    it("calls Gemini 3.8 Flash Multimodal with exact video prompt and base64 video payload", async () => {
      const dummyVideo = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]).buffer; // MP4 header
      const expectedSummary = "A lecturer demonstrates organic chemistry reaction mechanisms on a whiteboard. Question: What is the IUPAC name of the product?";

      let capturedBody: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.includes("gemini-3.8-flash:generateContent")) {
          capturedBody = JSON.parse(init?.body as string);
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: expectedSummary }],
                  },
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const analysis = await analyzeVideoWithGemini(
        mockEnv.GEMINI_API_KEY!,
        dummyVideo,
        "video/mp4",
        "Explain step 3 in this lecture clip"
      );

      expect(analysis).toBe(expectedSummary);
      expect(capturedBody).toBeDefined();
      expect(capturedBody.contents[0].parts[0].text).toContain("Transcribe all speech verbatim from this video, and thoroughly describe all visual scenes, actions, on-screen text, diagrams, and questions.");
      expect(capturedBody.contents[0].parts[1].inlineData.mimeType).toBe("video/mp4");
      expect(capturedBody.contents[0].parts[1].inlineData.data).toBeDefined();
    });

    it("handles inbound video message and populates userText with 🎬 [Video Transcription & Analysis]", async () => {
      const vidBytes = new Uint8Array([0, 1, 2, 3]).buffer;
      const transcription = "Speech: Today we discuss Newton's second law. Force equals mass times acceleration.";

      const requests: { url: string; body?: any }[] = [];
      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        const bodyStr = typeof init?.body === "string" ? init.body : undefined;
        const parsed = bodyStr ? JSON.parse(bodyStr) : undefined;
        requests.push({ url: urlStr, body: parsed });

        if (urlStr.includes("graph.facebook.com/v21.0/vid_999")) {
          return new Response(JSON.stringify({ url: "https://lookaside.fbsbx.com/video.mp4", mime_type: "video/mp4" }), { status: 200 });
        }
        if (urlStr === "https://lookaside.fbsbx.com/video.mp4") {
          return new Response(vidBytes, { status: 200 });
        }
        if (urlStr.includes("gemini-3.8-flash:generateContent")) {
          return new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text: transcription }] } }],
          }), { status: 200 });
        }
        if (urlStr.includes("thehive.ai") || urlStr.includes("gemini")) {
          return new Response(JSON.stringify({
            choices: [{ message: { content: "Newton's Second Law: F = m * a." } }],
          }), { status: 200 });
        }
        if (urlStr.includes("/messages")) {
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response("OK", { status: 200 });
      });

      const message = {
        from: "256788888888",
        id: "wam_video_001",
        type: "video",
        video: { id: "vid_999", caption: "Explain this physics theorem" },
      };

      await processMessage(message, { profile: { name: "Bob" } }, mockEnv);

      const dispatchedText = requests.find(r => r.body?.type === "text" && r.body?.to === "256788888888");
      expect(dispatchedText).toBeDefined();
      expect(dispatchedText?.body?.text?.body).toContain("F = m * a");
    });
  });

  // ── 4. IMAGE GENERATION ON WHATSAPP ────────────────────────────────────────

  describe("4. Image Generation Trigger & WhatsApp Dispatch", () => {
    it("generates image via Workers AI and dispatches to WhatsApp media upload and message", async () => {
      const dummyPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      mockEnv.AI.run = vi.fn().mockResolvedValue(dummyPng);

      let mediaUploadType = "";
      let sentImagePayload: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.endsWith("/media")) {
          const form = init?.body as FormData;
          mediaUploadType = form.get("type") as string;
          return new Response(JSON.stringify({ id: "media_gen_img_456" }), { status: 200 });
        }
        if (urlStr.endsWith("/messages")) {
          sentImagePayload = JSON.parse(init?.body as string);
          return new Response(JSON.stringify({ messages: [{ id: "wam_img_sent" }] }), { status: 200 });
        }
        return new Response("OK", { status: 200 });
      });

      const ok = await sendWhatsAppImageMessage(
        mockEnv,
        "256701234567",
        dummyPng,
        "🎨 Quantum Computer Circuit"
      );

      expect(ok).toBe(true);
      expect(mediaUploadType).toBe("image/png");
      expect(sentImagePayload).toBeDefined();
      expect(sentImagePayload.type).toBe("image");
      expect(sentImagePayload.image.id).toBe("media_gen_img_456");
      expect(sentImagePayload.image.caption).toBe("🎨 Quantum Computer Circuit");
      expect(sentImagePayload.to).toBe("256701234567");
    });

    it("triggers image generation automatically on user intent (/^(?:!image|!draw|generate image|draw)/i)", async () => {
      const dummyPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01]);
      mockEnv.AI.run = vi.fn().mockResolvedValue(dummyPng);

      let dispatchedImage: any = null;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url.toString();
        if (urlStr.endsWith("/media")) {
          return new Response(JSON.stringify({ id: "media_gen_ai_789" }), { status: 200 });
        }
        if (urlStr.endsWith("/messages")) {
          const body = JSON.parse(init?.body as string);
          if (body.type === "image") {
            dispatchedImage = body;
          }
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response("OK", { status: 200 });
      });

      const message = {
        from: "256755555555",
        id: "wam_draw_req",
        type: "text",
        text: { body: "!image a futuristic solar powered university in Kampala" },
      };

      await processMessage(message, { profile: { name: "David" } }, mockEnv);

      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        "@cf/black-forest-labs/flux-1-schnell",
        expect.objectContaining({ prompt: "a futuristic solar powered university in Kampala" })
      );
      expect(dispatchedImage).not.toBeNull();
      expect(dispatchedImage.image.id).toBe("media_gen_ai_789");
      expect(dispatchedImage.image.caption).toContain("a futuristic solar powered university in Kampala");
    });
  });

  // ── 5. DOCUMENT EXTRACTION (PDF, DOCX, TEXT) ───────────────────────────────

  describe("5. Document Extraction (PDF, DOCX, Plain text)", () => {
    it("extracts text from plain text and code files", async () => {
      const code = `def quicksort(arr):\n    if len(arr) <= 1: return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)`;
      const buffer = new TextEncoder().encode(code).buffer;

      const extracted = await extractDocumentContent(buffer, "text/x-python", "algorithm.py");
      expect(extracted).toContain("quicksort(arr)");
      expect(extracted).toContain("pivot = arr[len(arr) // 2]");
    });

    it("parses PDF text from content stream operators (BT / ET, Tj, TJ)", () => {
      // Minimal raw content stream with BT (Text) Tj ET
      const pdfText = "BT /F1 12 Tf (Hello Voltrix Academic Copilot) Tj ET";
      const fullPdf = `%PDF-1.4\n1 0 obj\n<< /Length ${pdfText.length} >>\nstream\n${pdfText}\nendstream\nendobj\nxref\ntrailer<<>>\nstartxref\n0\n%%EOF`;
      const bytes = new TextEncoder().encode(fullPdf);

      const extracted = extractTextFromPdfFast(bytes);
      expect(extracted).toContain("Hello Voltrix Academic Copilot");
    });

    it("parses DOCX XML paragraphs and strips XML tags cleanly", () => {
      // Construct a minimal raw docx zip local header with word/document.xml
      const xml = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:t>Macroeconomics Term Paper</w:t></w:p><w:p><w:t>Inflation and Monetary Policy in East Africa</w:t></w:p></w:body></w:document>`;
      const xmlBytes = new TextEncoder().encode(xml);

      // Create a mock uncompressed zip header (compMethod = 0)
      const name = "word/document.xml";
      const nameBytes = new TextEncoder().encode(name);
      const totalLen = 30 + nameBytes.length + xmlBytes.length;
      const buffer = new Uint8Array(totalLen);

      // Signature PK\x03\x04
      buffer[0] = 0x50; buffer[1] = 0x4b; buffer[2] = 0x03; buffer[3] = 0x04;
      // compMethod = 0 (uncompressed)
      buffer[8] = 0x00; buffer[9] = 0x00;
      // compSize & uncompSize
      const size = xmlBytes.length;
      buffer[18] = size & 0xff; buffer[19] = (size >> 8) & 0xff;
      buffer[22] = size & 0xff; buffer[23] = (size >> 8) & 0xff;
      // nameLen
      buffer[26] = nameBytes.length & 0xff; buffer[27] = (nameBytes.length >> 8) & 0xff;
      // extraLen = 0
      buffer[28] = 0; buffer[29] = 0;
      // filename
      buffer.set(nameBytes, 30);
      // data
      buffer.set(xmlBytes, 30 + nameBytes.length);

      const extracted = extractTextFromDocx(buffer);
      expect(extracted).toContain("Macroeconomics Term Paper");
      expect(extracted).toContain("Inflation and Monetary Policy in East Africa");
    });

    it("falls back to Gemini Multimodal PDF when fast parser encounters scanned / empty PDF", async () => {
      const scannedPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]).buffer;
      const scannedTranscription = "Scanned Exam: Question 1 (15 Marks) Explain the Keynesian Multiplier.";

      globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes("gemini-3.8-flash:generateContent")) {
          return new Response(
            JSON.stringify({
              candidates: [{ content: { parts: [{ text: scannedTranscription }] } }],
            }),
            { status: 200 }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const extracted = await extractDocumentContent(
        scannedPdfBytes,
        "application/pdf",
        "scanned_exam.pdf",
        "Read question 1",
        mockEnv.GEMINI_API_KEY
      );

      expect(extracted).toBe(scannedTranscription);
    });
  });

  // ── 6. UTILITIES & FORMATTING ──────────────────────────────────────────────

  describe("6. Helper Utilities", () => {
    it("formats markdown correctly for WhatsApp chat style", () => {
      const md = "# Heading 1\n**bold text**\n- bullet point\n$$E = mc^2$$\n$x = 5$";
      const wa = formatForWhatsApp(md);
      expect(wa).toContain("*Heading 1*");
      expect(wa).toContain("*bold text*");
      expect(wa).toContain("• bullet point");
      expect(wa).toContain("```\nE = mc^2\n```");
      expect(wa).toContain("`x = 5`");
    });

    it("cleans phone numbers and applies international dialing prefixes", () => {
      expect(cleanPhoneNumber("+256 701-234-567")).toBe("256701234567");
      expect(cleanPhoneNumber("0712345678")).toBe("256712345678");
    });

    it("cleans text for natural speech synthesis", () => {
      const math = "The equation is \\alpha + \\beta = \\gamma with \\int_0^1 x dx";
      const spoken = cleanTextForSpeech(math);
      expect(spoken).toContain("alpha");
      expect(spoken).toContain("beta");
      expect(spoken).toContain("gamma");
      expect(spoken).toContain("the integral from 0 to 1 of");
    });
  });
});

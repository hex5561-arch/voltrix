import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleWhatsAppWebhookGet,
  handleWhatsAppWebhookPost,
  sendWhatsAppMessage,
  sendWhatsAppAudioMessage,
  sendWhatsAppDocumentMessage,
  createWhatsAppTextMessagePayload,
  fetchWhatsAppMedia,
  saveAudioToR2,
  transcribeAudio,
  getExtensionFromMimeType,
  getAudioMimeAndExt,
  cleanPhoneNumber,
  formatForWhatsApp,
  splitMessageChunks,
  extractDocumentText,
  extractTextFromDocx,
  handleWhatsAppCommand,
  processWhatsAppMessage,
  setWhatsAppLinkingCode,
  setWhatsAppSession,
  getWhatsAppSession,
  clearWhatsAppSession,
  clearWhatsAppProcessedMessages,
  WhatsAppEnv,
} from "../src/whatsapp-webhook";
import server from "../src/server";

describe("WhatsApp Webhook & Media Gateway Unit Tests", () => {
  const mockEnv: WhatsAppEnv = {
    WHATSAPP_VERIFY_TOKEN: "voltrix_secret_verify_token_123",
    WHATSAPP_ACCESS_TOKEN: "EAAG_TEST_ACCESS_TOKEN_ABC",
    WHATSAPP_PHONE_NUMBER_ID: "109876543210",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Challenge Verification (handleWhatsAppWebhookGet)", () => {
    it("successfully verifies challenge with 200 OK and returns hub.challenge string", async () => {
      const challengeToken = "challenge_nonce_xyz_987";
      const url = `https://voltrix.stream/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=voltrix_secret_verify_token_123&hub.challenge=${challengeToken}`;
      const req = new Request(url, { method: "GET" });

      const res = await handleWhatsAppWebhookGet(req, mockEnv);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/plain");
      const text = await res.text();
      expect(text).toBe(challengeToken);
    });

    it("returns 403 Forbidden when verify_token does not match", async () => {
      const url = "https://voltrix.stream/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=WRONG_TOKEN&hub.challenge=test_challenge";
      const req = new Request(url, { method: "GET" });

      const res = await handleWhatsAppWebhookGet(req, mockEnv);

      expect(res.status).toBe(403);
      const text = await res.text();
      expect(text).toBe("Forbidden");
    });

    it("returns 403 Forbidden when hub.mode is not subscribe", async () => {
      const url = "https://voltrix.stream/api/webhooks/whatsapp?hub.mode=unsubscribe&hub.verify_token=voltrix_secret_verify_token_123&hub.challenge=test_challenge";
      const req = new Request(url, { method: "GET" });

      const res = await handleWhatsAppWebhookGet(req, mockEnv);

      expect(res.status).toBe(403);
    });

    it("returns 403 Forbidden when WHATSAPP_VERIFY_TOKEN is missing in env", async () => {
      const url = "https://voltrix.stream/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=voltrix_secret_verify_token_123&hub.challenge=test_challenge";
      const req = new Request(url, { method: "GET" });

      const res = await handleWhatsAppWebhookGet(req, {});

      expect(res.status).toBe(403);
    });
  });

  describe("2. Incoming Text Message Parsing (handleWhatsAppWebhookPost)", () => {
    it("parses incoming text message payload and returns 200 with extracted message details", async () => {
      const webhookPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "BIZ_ACC_001",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: "256700000000",
                    phone_number_id: "109876543210",
                  },
                  contacts: [
                    {
                      profile: { name: "Isaac Newton" },
                      wa_id: "256701234567",
                    },
                  ],
                  messages: [
                    {
                      from: "256701234567",
                      id: "wamid.HBgLMjU2NzAxMjM0NTY3FQIAEhggMUFDN0E3QjVBMzc2",
                      timestamp: "1729000100",
                      type: "text",
                      text: {
                        body: "Hello Voltrix! Can you solve Navier-Stokes for incompressible laminar flow?",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = new Request("https://voltrix.stream/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });

      const res = await handleWhatsAppWebhookPost(req, mockEnv);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(json.status).toBe("ok");
      expect(json.processed).toBe(1);
      expect(json.results[0]).toMatchObject({
        id: "wamid.HBgLMjU2NzAxMjM0NTY3FQIAEhggMUFDN0E3QjVBMzc2",
        from: "256701234567",
        type: "text",
        text: "Hello Voltrix! Can you solve Navier-Stokes for incompressible laminar flow?",
        timestamp: "1729000100",
      });
    });

    it("returns 400 Bad Request when request body is not valid JSON", async () => {
      const req = new Request("https://voltrix.stream/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid{json:content",
      });

      const res = await handleWhatsAppWebhookPost(req, mockEnv);
      expect(res.status).toBe(400);
      const json = (await res.json()) as any;
      expect(json.error).toBe("Invalid JSON payload");
    });

    it("handles delivery status events gracefully without errors", async () => {
      const statusPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "BIZ_ACC_001",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  statuses: [
                    {
                      id: "wamid.HBgLMjU2NzAxMjM0NTY3",
                      status: "delivered",
                      timestamp: "1729000105",
                      recipient_id: "256701234567",
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = new Request("https://voltrix.stream/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusPayload),
      });

      const res = await handleWhatsAppWebhookPost(req, mockEnv);
      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.status).toBe("ok");
      expect(json.processed).toBe(0);
    });
  });

  describe("3. Incoming Audio / Voice Note Extraction & Mock Download", () => {
    it("extracts voice note, queries media URL, downloads binary stream, saves to R2, and transcribes audio", async () => {
      const audioId = "audio_media_id_777";
      const fakeBinaryAudio = new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0x00, 0x02]).buffer; // Ogg header bytes

      // Mock Graph API metadata query and binary download
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init?: any) => {
        const url = String(input);

        // Step 1: Query media URL
        if (url === `https://graph.facebook.com/v21.0/${audioId}`) {
          expect(init?.headers?.Authorization).toBe(`Bearer ${mockEnv.WHATSAPP_ACCESS_TOKEN}`);
          return new Response(
            JSON.stringify({
              messaging_product: "whatsapp",
              url: "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=777",
              mime_type: "audio/ogg; codecs=opus",
              sha256: "abc123sha",
              file_size: 1024,
              id: audioId,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        // Step 2: Download media binary
        if (url === "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=777") {
          expect(init?.headers?.Authorization).toBe(`Bearer ${mockEnv.WHATSAPP_ACCESS_TOKEN}`);
          return new Response(fakeBinaryAudio, {
            status: 200,
            headers: { "Content-Type": "audio/ogg; codecs=opus" },
          });
        }

        return new Response("Not found", { status: 404 });
      });

      // Mock R2 Bucket
      const mockR2Put = vi.fn().mockResolvedValue(undefined);
      const mockBucket = { put: mockR2Put } as unknown as R2Bucket;

      // Mock ASR engine
      const mockAsr = vi.fn().mockResolvedValue("Calculate the eigenvalues of the Hamiltonian matrix.");

      const envWithR2AndAsr: WhatsAppEnv = {
        ...mockEnv,
        BLUEPRINT_CONTENT: mockBucket,
        ASR_ENGINE: mockAsr,
      };

      const webhookVoicePayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "BIZ_ACC_001",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  messages: [
                    {
                      from: "256709876543",
                      id: "wamid.VOICE_NOTE_001",
                      timestamp: "1729000200",
                      type: "voice",
                      voice: {
                        id: audioId,
                        mime_type: "audio/ogg; codecs=opus",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = new Request("https://voltrix.stream/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookVoicePayload),
      });

      const res = await handleWhatsAppWebhookPost(req, envWithR2AndAsr);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(json.status).toBe("ok");
      expect(json.processed).toBe(1);

      const result = json.results[0];
      expect(result.id).toBe("wamid.VOICE_NOTE_001");
      expect(result.from).toBe("256709876543");
      expect(result.type).toBe("voice");
      expect(result.mediaId).toBe(audioId);
      expect(result.r2Key).toBe(`hf-videos/whatsapp-${audioId}.ogg`);
      expect(result.transcription).toBe("Calculate the eigenvalues of the Hamiltonian matrix.");

      // Verify R2 Put was called with required key prefix
      expect(mockR2Put).toHaveBeenCalledWith(
        `hf-videos/whatsapp-${audioId}.ogg`,
        expect.any(ArrayBuffer),
        expect.objectContaining({
          httpMetadata: { contentType: "audio/ogg; codecs=opus" },
        })
      );

      // Verify ASR engine was called
      expect(mockAsr).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        "audio/ogg; codecs=opus",
        envWithR2AndAsr
      );
    });

    it("supports type 'audio' with mp3 MIME type and saves to .mp3 in R2", async () => {
      const audioId = "audio_media_mp3_888";
      const fakeMp3Buffer = new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any) => {
        const url = String(input);
        if (url === `https://graph.facebook.com/v21.0/${audioId}`) {
          return new Response(
            JSON.stringify({
              url: "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=888",
              mime_type: "audio/mp3",
            }),
            { status: 200 }
          );
        }
        if (url === "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=888") {
          return new Response(fakeMp3Buffer, { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      });

      const mockR2Put = vi.fn().mockResolvedValue(undefined);
      const mockBucket = { put: mockR2Put } as unknown as R2Bucket;

      const envWithR2: WhatsAppEnv = {
        ...mockEnv,
        BLUEPRINT_CONTENT: mockBucket,
        ASR_ENGINE: vi.fn().mockResolvedValue("Audio transcription test"),
      };

      const webhookAudioPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "256709876543",
                      id: "wamid.AUDIO_002",
                      timestamp: "1729000210",
                      type: "audio",
                      audio: {
                        id: audioId,
                        mime_type: "audio/mp3",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = new Request("https://voltrix.stream/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookAudioPayload),
      });

      const res = await handleWhatsAppWebhookPost(req, envWithR2);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(json.results[0].r2Key).toBe(`hf-videos/whatsapp-${audioId}.mp3`);
      expect(mockR2Put).toHaveBeenCalledWith(
        `hf-videos/whatsapp-${audioId}.mp3`,
        expect.any(ArrayBuffer),
        expect.objectContaining({
          httpMetadata: { contentType: "audio/mp3" },
        })
      );
    });

    it("gracefully catches media download errors and reports error without crashing webhook", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("Media Expired", { status: 404 })
      );

      const webhookVoicePayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "256709876543",
                      id: "wamid.VOICE_FAIL",
                      timestamp: "1729000220",
                      type: "voice",
                      voice: { id: "bad_media_id" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = new Request("https://voltrix.stream/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookVoicePayload),
      });

      const res = await handleWhatsAppWebhookPost(req, mockEnv);
      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.results[0].error).toContain("Failed to query WhatsApp media URL (404)");
    });
  });

  describe("4. Outbound Reply Format (sendWhatsAppMessage)", () => {
    it("calls Graph API POST /v21.0/<PHONE_NUMBER_ID>/messages with correct auth and exact payload format", async () => {
      let capturedUrl = "";
      let capturedMethod = "";
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: any = null;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init?: any) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || "GET";
        capturedHeaders = init?.headers || {};
        capturedBody = JSON.parse(init?.body);
        return new Response(JSON.stringify({ messages: [{ id: "wamid.OUTBOUND_123" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      const recipient = "256701122334";
      const messageText = "Here is your detailed physics solution: F = ma.";

      const success = await sendWhatsAppMessage(recipient, messageText, mockEnv);

      expect(success).toBe(true);
      expect(capturedUrl).toBe(`https://graph.facebook.com/v21.0/${mockEnv.WHATSAPP_PHONE_NUMBER_ID}/messages`);
      expect(capturedMethod).toBe("POST");
      expect(capturedHeaders["Authorization"]).toBe(`Bearer ${mockEnv.WHATSAPP_ACCESS_TOKEN}`);
      expect(capturedHeaders["Content-Type"]).toBe("application/json");

      expect(capturedBody).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: {
          preview_url: false,
          body: messageText,
        },
      });
    });

    it("createWhatsAppTextMessagePayload builds the standard Meta Cloud API text message contract", () => {
      const payload = createWhatsAppTextMessagePayload("256777000111", "Study reminder: Calculus quiz at 9 AM");
      expect(payload).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "256777000111",
        type: "text",
        text: {
          preview_url: false,
          body: "Study reminder: Calculus quiz at 9 AM",
        },
      });
    });

    it("returns false if WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN is missing", async () => {
      const noId = await sendWhatsAppMessage("123", "test", { WHATSAPP_ACCESS_TOKEN: "tok" });
      expect(noId).toBe(false);

      const noToken = await sendWhatsAppMessage("123", "test", { WHATSAPP_PHONE_NUMBER_ID: "num" });
      expect(noToken).toBe(false);
    });

    it("returns false and logs error when Graph API returns non-200 status", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Invalid OAuth access token" } }), {
          status: 401,
        })
      );

      const success = await sendWhatsAppMessage("256701122334", "Hello", mockEnv);
      expect(success).toBe(false);
    });
  });

  describe("5. End-to-End Server Router Dispatch (/api/webhooks/whatsapp)", () => {
    it("server.ts routes GET /api/webhooks/whatsapp to challenge verification", async () => {
      const challengeToken = "challenge_via_server_router";
      const url = `https://voltrix.stream/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=voltrix_secret_verify_token_123&hub.challenge=${challengeToken}`;
      const req = new Request(url, { method: "GET" });

      const res = await server.fetch(req, mockEnv as any, {} as any);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe(challengeToken);
    });

    it("server.ts routes POST /api/webhooks/whatsapp to webhook payload ingestion", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "256788888888",
                      id: "wamid.SERVER_ROUTE_TEST",
                      timestamp: "1729000500",
                      type: "text",
                      text: { body: "Routed through server.fetch successfully!" },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = new Request("https://voltrix.stream/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await server.fetch(req, mockEnv as any, {} as any);
      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.status).toBe("ok");
      expect(json.results[0].text).toBe("Routed through server.fetch successfully!");
    });

    it("server.ts returns 405 Method Not Allowed for unsupported methods on /api/webhooks/whatsapp", async () => {
      const req = new Request("https://voltrix.stream/api/webhooks/whatsapp", {
        method: "PUT",
      });

      const res = await server.fetch(req, mockEnv as any, {} as any);
      expect(res.status).toBe(405);
    });
  });

  describe("6. Helper Functions & Edge Cases", () => {
    it("maps audio MIME types to correct extensions", () => {
      expect(getExtensionFromMimeType("audio/ogg; codecs=opus")).toBe("ogg");
      expect(getExtensionFromMimeType("audio/ogg")).toBe("ogg");
      expect(getExtensionFromMimeType("audio/mpeg")).toBe("mp3");
      expect(getExtensionFromMimeType("audio/mp3")).toBe("mp3");
      expect(getExtensionFromMimeType("audio/wav")).toBe("wav");
      expect(getExtensionFromMimeType("audio/m4a")).toBe("m4a");
      expect(getExtensionFromMimeType("audio/amr")).toBe("amr");
      expect(getExtensionFromMimeType(undefined)).toBe("ogg");
      expect(getExtensionFromMimeType("application/octet-stream")).toBe("ogg");
    });

    it("transcribeAudio falls back to Workers AI when available", async () => {
      const fakeAi = {
        run: vi.fn().mockResolvedValue({ text: "Workers AI Transcription Output" }),
      };
      const audioBuffer = new Uint8Array([1, 2, 3]).buffer;

      const result = await transcribeAudio(audioBuffer, "audio/ogg", { WORKERS_AI: fakeAi });
      expect(result).toBe("Workers AI Transcription Output");
      expect(fakeAi.run).toHaveBeenCalledWith("@cf/openai/whisper", {
        audio: [1, 2, 3],
      });
    });

    it("saveAudioToR2 puts content in R2 with exact key structure", async () => {
      const mockPut = vi.fn().mockResolvedValue(undefined);
      const bucket = { put: mockPut } as unknown as R2Bucket;
      const buffer = new Uint8Array([10, 20, 30]).buffer;

      const key = await saveAudioToR2(bucket, "test_media_99", "audio/wav", buffer);
      expect(key).toBe("hf-videos/whatsapp-test_media_99.wav");
      expect(mockPut).toHaveBeenCalledWith("hf-videos/whatsapp-test_media_99.wav", buffer, {
        httpMetadata: { contentType: "audio/wav" },
      });
    });
  });

  describe("7. Formatting Engine (formatForWhatsApp)", () => {
    it("converts markdown headers to bold asterisks", () => {
      const input = "# Main Title\n## Section 1\n### Subsection";
      const expected = "*Main Title*\n*Section 1*\n*Subsection*";
      expect(formatForWhatsApp(input)).toBe(expected);
    });

    it("converts markdown double asterisks **bold** to single asterisk *bold*", () => {
      const input = "This is **critical** information for your **quantum mechanics** exam.";
      const expected = "This is *critical* information for your *quantum mechanics* exam.";
      expect(formatForWhatsApp(input)).toBe(expected);
    });

    it("converts markdown bullets (- and *) to unicode bullet points", () => {
      const input = "- Newton's first law\n* Newton's second law\n- Newton's third law";
      const expected = "• Newton's first law\n• Newton's second law\n• Newton's third law";
      expect(formatForWhatsApp(input)).toBe(expected);
    });

    it("converts LaTeX display equations $$...$$ to monospace code blocks", () => {
      const input = "The kinetic energy equation is:\n$$E_k = \\frac{1}{2}mv^2$$\nUse it wisely.";
      const formatted = formatForWhatsApp(input);
      expect(formatted).toContain("```\nE_k = \\frac{1}{2}mv^2\n```");
    });

    it("converts LaTeX inline equations $...$ to inline code", () => {
      const input = "Notice that $F = ma$ represents mass acceleration.";
      const expected = "Notice that `F = ma` represents mass acceleration.";
      expect(formatForWhatsApp(input)).toBe(expected);
    });

    it("preserves pre-existing code blocks without altering inner content", () => {
      const input = "Here is the code:\n```python\n# This is a comment\nx = **not_bold**\n```";
      const formatted = formatForWhatsApp(input);
      expect(formatted).toContain("```python\n# This is a comment\nx = **not_bold**\n```");
    });
  });

  describe("8. Chunking Engine (splitMessageChunks)", () => {
    it("returns array with original text when length is <= maxLen", () => {
      const text = "A short physics explanation of thermodynamics.";
      const chunks = splitMessageChunks(text, 3800);
      expect(chunks).toEqual([text]);
    });

    it("cleanly splits long text exceeding maxLen at paragraph boundaries", () => {
      const p1 = "A".repeat(2500);
      const p2 = "B".repeat(2500);
      const fullText = `${p1}\n\n${p2}`;

      const chunks = splitMessageChunks(fullText, 3800);
      expect(chunks.length).toBe(2);
      expect(chunks[0]).toBe(p1);
      expect(chunks[1]).toBe(p2);
    });

    it("splits long single paragraph by lines or sentences without exceeding maxLen", () => {
      const line1 = "Sentence 1: " + "C".repeat(2000);
      const line2 = "Sentence 2: " + "D".repeat(2000);
      const fullText = `${line1}\n${line2}`;

      const chunks = splitMessageChunks(fullText, 3800);
      expect(chunks.length).toBe(2);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(3800);
      }
    });

    it("returns empty array for empty or whitespace text", () => {
      expect(splitMessageChunks("")).toEqual([]);
    });
  });

  describe("9. Document Ingestion (extractDocumentText & extractTextFromDocx)", () => {
    it("extracts text from plain text, python, and markdown attachments", async () => {
      const enc = new TextEncoder();
      const code = 'def compute_paxos(rounds):\n    return f"Consensus reached in {rounds}"';
      const text = await extractDocumentText(enc.encode(code), "text/x-python", "consensus.py");
      expect(text).toBe(code);

      const md = "# Research Notes\n- Hypothesis 1\n- Hypothesis 2";
      const mdText = await extractDocumentText(enc.encode(md), "text/markdown", "notes.md");
      expect(mdText).toBe(md);
    });

    it("extracts text from Word .docx zip entries", async () => {
      // Create mock .docx zip buffer with word/document.xml
      const filename = "word/document.xml";
      const xml = "<w:document><w:body><w:p><w:r><w:t>Quantum Computing Invariants</w:t></w:r></w:p></w:body></w:document>";
      const enc = new TextEncoder();
      const fileBytes = enc.encode(filename);
      const xmlBytes = enc.encode(xml);

      const header = new Uint8Array(30);
      header[0] = 0x50; header[1] = 0x4b; header[2] = 0x03; header[3] = 0x04;
      header[8] = 0; header[9] = 0; // uncompressed
      const size = xmlBytes.length;
      header[18] = size & 0xff; header[19] = (size >> 8) & 0xff;
      header[22] = size & 0xff; header[23] = (size >> 8) & 0xff;
      header[26] = fileBytes.length & 0xff; header[27] = (fileBytes.length >> 8) & 0xff;

      const docxBytes = new Uint8Array(30 + fileBytes.length + xmlBytes.length);
      docxBytes.set(header, 0);
      docxBytes.set(fileBytes, 30);
      docxBytes.set(xmlBytes, 30 + fileBytes.length);

      const extracted = await extractDocumentText(
        docxBytes,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "assignment.docx"
      );
      expect(extracted).toContain("Quantum Computing Invariants");
    });

    it("falls back to caption for image attachments", async () => {
      const fakeImage = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const result = await extractDocumentText(
        fakeImage,
        "image/jpeg",
        "graph.jpg",
        "Free body diagram of pendulum"
      );
      expect(result).toBe("Image note: Free body diagram of pendulum");
    });
  });

  describe("10. Outbound Audio & Document Messaging (sendWhatsAppAudioMessage & sendWhatsAppDocumentMessage)", () => {
    it("sendWhatsAppAudioMessage sends audio via URL link", async () => {
      let capturedBody: any;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_input: any, init?: any) => {
        capturedBody = JSON.parse(init?.body);
        return new Response(JSON.stringify({ messages: [{ id: "wamid.AUDIO_LINK" }] }), {
          status: 200,
        });
      });

      const audioUrl = "https://r2.voltrix.stream/audio/reply.ogg";
      const success = await sendWhatsAppAudioMessage("256701112233", audioUrl, mockEnv);

      expect(success).toBe(true);
      expect(capturedBody).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "256701112233",
        type: "audio",
        audio: { link: audioUrl },
      });
    });

    it("sendWhatsAppAudioMessage uploads binary audio stream and sends message with media ID", async () => {
      let uploadedFormData: FormData | null = null;
      let sendPayload: any = null;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init?: any) => {
        const url = String(input);
        if (url.endsWith("/media")) {
          uploadedFormData = init?.body as FormData;
          return new Response(JSON.stringify({ id: "media_uploaded_audio_99" }), { status: 200 });
        }
        if (url.endsWith("/messages")) {
          sendPayload = JSON.parse(init?.body);
          return new Response(JSON.stringify({ messages: [{ id: "wamid.AUDIO_ID_MSG" }] }), {
            status: 200,
          });
        }
        return new Response("Not found", { status: 404 });
      });

      const fakeAudioBuffer = new Uint8Array([0x4f, 0x67, 0x67, 0x53]).buffer;
      const success = await sendWhatsAppAudioMessage(
        "256701112233",
        fakeAudioBuffer,
        mockEnv,
        "audio/ogg"
      );

      expect(success).toBe(true);
      expect(uploadedFormData).toBeDefined();
      expect(sendPayload).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "256701112233",
        type: "audio",
        audio: { id: "media_uploaded_audio_99" },
      });
    });

    it("sendWhatsAppDocumentMessage sends document via URL link", async () => {
      let capturedBody: any;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_input: any, init?: any) => {
        capturedBody = JSON.parse(init?.body);
        return new Response(JSON.stringify({ messages: [{ id: "wamid.DOC_LINK" }] }), {
          status: 200,
        });
      });

      const docUrl = "https://os.voltrix.stream/api/docs/pdf/doc-123.pdf";
      const success = await sendWhatsAppDocumentMessage(
        "256701112233",
        docUrl,
        "Distributed_Systems.pdf",
        "Official ISO 216 Coursework PDF",
        mockEnv
      );

      expect(success).toBe(true);
      expect(capturedBody).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "256701112233",
        type: "document",
        document: {
          link: docUrl,
          filename: "Distributed_Systems.pdf",
          caption: "Official ISO 216 Coursework PDF",
        },
      });
    });

    it("sendWhatsAppDocumentMessage uploads binary document and sends message with media ID", async () => {
      let sendPayload: any = null;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init?: any) => {
        const url = String(input);
        if (url.endsWith("/media")) {
          return new Response(JSON.stringify({ id: "media_uploaded_doc_77" }), { status: 200 });
        }
        if (url.endsWith("/messages")) {
          sendPayload = JSON.parse(init?.body);
          return new Response(JSON.stringify({ messages: [{ id: "wamid.DOC_ID_MSG" }] }), {
            status: 200,
          });
        }
        return new Response("Not found", { status: 404 });
      });

      const fakePdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer; // %PDF
      const success = await sendWhatsAppDocumentMessage(
        "256701112233",
        fakePdfBuffer,
        "Coursework.pdf",
        "Submitted Paper",
        mockEnv
      );

      expect(success).toBe(true);
      expect(sendPayload).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "256701112233",
        type: "document",
        document: {
          id: "media_uploaded_doc_77",
          filename: "Coursework.pdf",
          caption: "Submitted Paper",
        },
      });
    });
  });

  describe("11. Interactive Slash & Exclamation Commands (handleWhatsAppCommand)", () => {
    it("handles !help command with comprehensive directives manual", async () => {
      const result = await handleWhatsAppCommand("256701112233", "!help", mockEnv);
      expect(result.handled).toBe(true);
      expect(result.command).toBe("help");
      expect(result.reply).toContain("Welcome to Voltrix OS on WhatsApp!");
      expect(result.reply).toContain("!help");
      expect(result.reply).toContain("!clear");
      expect(result.reply).toContain("!status");
      expect(result.reply).toContain("!link <code>");
    });

    it("handles !clear command by resetting conversation history", async () => {
      const phone = "256701112233";
      setWhatsAppSession(phone, {
        phoneNumber: phone,
        history: [
          { role: "user", content: "Previous question" },
          { role: "assistant", content: "Previous answer" },
        ],
        lastActive: Date.now(),
      });

      const result = await handleWhatsAppCommand(phone, "!clear", mockEnv);
      expect(result.handled).toBe(true);
      expect(result.command).toBe("clear");
      expect(result.reply).toContain("Conversation Memory Reset");

      const cleared = getWhatsAppSession(phone);
      expect(cleared?.history.length).toBe(0);
    });

    it("handles !status command showing linked account and system operational metrics", async () => {
      const phone = "256701112233";
      const result = await handleWhatsAppCommand(phone, "!status", mockEnv);
      expect(result.handled).toBe(true);
      expect(result.command).toBe("status");
      expect(result.reply).toContain("Voltrix OS WhatsApp Copilot Status");
      expect(result.reply).toContain(phone);
    });

    it("handles !link with invalid code returning instructional guide", async () => {
      const result = await handleWhatsAppCommand("256701112233", "!link abc", mockEnv);
      expect(result.handled).toBe(true);
      expect(result.command).toBe("link");
      expect(result.reply).toContain("Invalid Link Code");
      expect(result.reply).toContain("Generate Link Code");
    });

    it("handles !link with valid 6-digit code pairing WhatsApp to user account", async () => {
      const phone = "256701112233";
      const code = "654321";

      setWhatsAppLinkingCode(code, {
        userId: "user_pro_99",
        name: "Ada Lovelace",
        expiresAt: Date.now() + 600000,
      });

      const result = await handleWhatsAppCommand(phone, `!link ${code}`, mockEnv);
      expect(result.handled).toBe(true);
      expect(result.command).toBe("link");
      expect(result.reply).toContain("Account Successfully Linked!");
      expect(result.reply).toContain("Ada Lovelace");

      const session = getWhatsAppSession(phone);
      expect(session?.linkedUserId).toBe("user_pro_99");
    });
  });

  describe("12. Edge Agent Bridge & Multi-Turn Conversation (processWhatsAppMessage)", () => {
    it("routes incoming message into AGENT_BRIDGE, updates multi-turn history, and sends formatted reply", async () => {
      let sentBody: any;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (_input: any, init?: any) => {
        sentBody = JSON.parse(init?.body);
        return new Response(JSON.stringify({ messages: [{ id: "wamid.OUT_REPLY" }] }), {
          status: 200,
        });
      });

      const mockBridge = vi.fn().mockResolvedValue("## Solution\n**Force** equals mass times acceleration: $F = ma$.");

      const envWithBridge: WhatsAppEnv = {
        ...mockEnv,
        AGENT_BRIDGE: mockBridge,
      };

      const msg = {
        id: "wamid.AGENT_TEST_1",
        from: "256709998888",
        type: "text",
        timestamp: "1729000800",
        text: "How do you calculate force?",
      };

      const result = await processWhatsAppMessage(msg, envWithBridge);

      expect(mockBridge).toHaveBeenCalledWith(
        "How do you calculate force?",
        expect.objectContaining({ phone: "256709998888" }),
        envWithBridge
      );

      // Verify formatted reply was produced and sent
      expect(result.reply).toBe("*Solution*\n*Force* equals mass times acceleration: `F = ma`.");
      expect(result.sent).toBe(true);
      expect(sentBody?.text?.body).toBe(result.reply);

      // Verify session multi-turn conversation memory
      const session = getWhatsAppSession("256709998888");
      expect(session?.history.length).toBe(2);
      expect(session?.history[0].content).toBe("How do you calculate force?");
      expect(session?.history[1].content).toContain("Solution");
    });

    it("triggers outbound voice note reply when user requests voice reply with TTS_ENGINE configured", async () => {
      let sentAudio: any;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init?: any) => {
        const url = String(input);
        if (url.endsWith("/media")) {
          return new Response(JSON.stringify({ id: "media_tts_voice_id" }), { status: 200 });
        }
        if (url.endsWith("/messages")) {
          const body = JSON.parse(init?.body);
          if (body.type === "audio") {
            sentAudio = body;
          }
          return new Response(JSON.stringify({ messages: [{ id: "wamid.MSG_OK" }] }), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      });

      const mockTts = vi.fn().mockResolvedValue({
        buffer: new Uint8Array([0x4f, 0x67, 0x67, 0x53]),
        mimeType: "audio/ogg",
      });

      const envWithTts: WhatsAppEnv = {
        ...mockEnv,
        AGENT_BRIDGE: vi.fn().mockResolvedValue("Entropy increases in an isolated thermodynamic system."),
        TTS_ENGINE: mockTts,
      };

      const msg = {
        id: "wamid.VOICE_REQUEST_1",
        from: "256709997777",
        type: "text",
        timestamp: "1729000850",
        text: "Explain entropy and reply with voice note please",
      };

      await processWhatsAppMessage(msg, envWithTts);

      expect(mockTts).toHaveBeenCalled();
      expect(sentAudio).toBeDefined();
      expect(sentAudio.type).toBe("audio");
      expect(sentAudio.audio.id).toBe("media_tts_voice_id");
    });
  });
});

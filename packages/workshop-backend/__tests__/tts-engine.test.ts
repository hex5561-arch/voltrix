import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getVoice,
  listVoices,
  registerVoice,
  parseWavDuration,
  synthesizeSpeech,
  type VoicePersona,
} from "../src/tts-engine.js";

function createMockR2Bucket(): R2Bucket {
  const store = new Map<string, { body: ArrayBuffer | Uint8Array; metadata?: any; customMetadata?: any }>();
  return {
    async put(key: string, value: any, options?: any) {
      let body: Uint8Array;
      if (typeof value === "string") {
        body = new TextEncoder().encode(value);
      } else if (value instanceof ArrayBuffer) {
        body = new Uint8Array(value);
      } else if (value instanceof Uint8Array) {
        body = value;
      } else {
        body = new TextEncoder().encode(JSON.stringify(value));
      }
      store.set(key, {
        body,
        metadata: options?.httpMetadata,
        customMetadata: options?.customMetadata,
      });
      return { key };
    },
    async head(key: string) {
      const item = store.get(key);
      if (!item) return null;
      return {
        key,
        size: item.body.byteLength,
        customMetadata: item.customMetadata,
        httpMetadata: item.metadata,
      };
    },
    async get(key: string) {
      const item = store.get(key);
      if (!item) return null;
      return {
        key,
        arrayBuffer: async () => item.body.buffer,
        text: async () => new TextDecoder().decode(item.body),
        json: async () => JSON.parse(new TextDecoder().decode(item.body)),
        customMetadata: item.customMetadata,
        httpMetadata: item.metadata,
      };
    },
    async delete(key: string) {
      store.delete(key);
    },
  } as unknown as R2Bucket;
}

/**
 * Creates a synthetic standard PCM 16-bit 44100Hz stereo or mono WAV header.
 */
function createSyntheticWav(durationSeconds: number, sampleRate = 44100, numChannels = 1, bitsPerSample = 16): ArrayBuffer {
  const bytesPerSample = (bitsPerSample / 8) * numChannels;
  const byteRate = sampleRate * bytesPerSample;
  const dataSize = Math.round(durationSeconds * byteRate);
  const totalFileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // "RIFF"
  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46);
  view.setUint32(4, totalFileSize - 8, true);
  // "WAVE"
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45);
  // "fmt "
  view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20);
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);
  // "data"
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61);
  view.setUint32(40, dataSize, true);

  return buffer;
}

describe("Voltrix Neural Speech (TTS) Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Voice Persona Registry & Standard Voice Resolution", () => {
    it("resolves all standard voices: christopher, jenny, guy, aria, eric, ana, sonia, ryan, andrew, brian, emma, ava", () => {
      const standardVoices = [
        "christopher",
        "jenny",
        "guy",
        "aria",
        "eric",
        "ana",
        "sonia",
        "ryan",
        "andrew",
        "brian",
        "emma",
        "ava",
      ];

      for (const v of standardVoices) {
        const resolved = getVoice(v);
        expect(resolved.id).toBe(v);
        expect(resolved.name).toBeTruthy();
        expect(resolved.groq.voice).toBeTruthy();
        expect(resolved.workersAi.lang).toBeTruthy();
      }
    });

    it("resolves case-insensitively and normalizes Edge/Azure TTS aliases", () => {
      expect(getVoice("Christopher").id).toBe("christopher");
      expect(getVoice("CHRISTOPHER").id).toBe("christopher");
      expect(getVoice("en-US-ChristopherNeural").id).toBe("christopher");
      expect(getVoice("Jenny").id).toBe("jenny");
      expect(getVoice("en-US-JennyNeural").id).toBe("jenny");
      expect(getVoice("en-GB-SoniaNeural").id).toBe("sonia");
      expect(getVoice("en-gb-ryanneural").id).toBe("ryan");
    });

    it("falls back to zephyr for unknown voices", () => {
      const fallback = getVoice("completely-unknown-voice-slug");
      expect(fallback.id).toBe("zephyr");
    });

    it("lists all registered unique voice personas including standard voices", () => {
      const list = listVoices();
      const ids = list.map((p) => p.id);
      expect(ids).toContain("christopher");
      expect(ids).toContain("jenny");
      expect(ids).toContain("guy");
      expect(ids).toContain("aria");
      expect(ids).toContain("zephyr");
      expect(ids).toContain("ada");
      expect(ids).toContain("nova");
      expect(ids).toContain("marcus");
      expect(ids).toContain("kip");
      expect(ids).toContain("echo");
    });
  });

  describe("2. Audio Duration Parsing from WAV Headers (parseWavDuration)", () => {
    it("accurately calculates fractional duration from WAV headers", () => {
      const wav = createSyntheticWav(9.32, 44100, 1, 16);
      const parsed = parseWavDuration(wav);
      expect(parsed).toBe(9.32);
    });

    it("handles another sample rate and stereo channel duration correctly", () => {
      const wav = createSyntheticWav(7.15, 24000, 2, 16);
      const parsed = parseWavDuration(wav);
      expect(parsed).toBe(7.15);
    });

    it("returns null for non-WAV or truncated buffers", () => {
      expect(parseWavDuration(new ArrayBuffer(10))).toBeNull();
      expect(parseWavDuration(new Uint8Array([1, 2, 3, 4]))).toBeNull();
    });
  });

  describe("3. Speech Synthesis & Requested Voice Preservation", () => {
    it("preserves requested voice name in result and calculates accurate fractional duration", async () => {
      const bucket = createMockR2Bucket();
      const syntheticWav = createSyntheticWav(9.32, 44100, 1, 16);

      // Mock Groq API fetch response
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => syntheticWav,
      });

      const res = await synthesizeSpeech(
        {
          text: "General relativity describes gravity not as a force, but as curvature of spacetime.",
          voice: "christopher",
        },
        {
          BLUEPRINT_CONTENT: bucket,
          GROQ_API_KEY: "gsk_test_123",
        }
      );

      expect(res.ok).toBe(true);
      expect(res.voice).toBe("christopher");
      expect(res.durationEstimateSeconds).toBe(9.32);
      expect(res.durationSeconds).toBe(9.32);
      expect(res.format).toBe("wav");
      expect(res.audioUrl).toContain("https://voltrix.stream/api/hf-videos/");

      // Cache hit test: verify subsequent request preserves voice and exact duration
      const cachedRes = await synthesizeSpeech(
        {
          text: "General relativity describes gravity not as a force, but as curvature of spacetime.",
          voice: "christopher",
        },
        {
          BLUEPRINT_CONTENT: bucket,
          GROQ_API_KEY: "gsk_test_123",
        }
      );

      expect(cachedRes.provider).toBe("cached");
      expect(cachedRes.voice).toBe("christopher");
      expect(cachedRes.durationEstimateSeconds).toBe(9.32);
      expect(cachedRes.durationSeconds).toBe(9.32);
    });

    it("preserves jenny voice and fractional duration when requested", async () => {
      const bucket = createMockR2Bucket();
      const syntheticWav = createSyntheticWav(7.15, 44100, 1, 16);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => syntheticWav,
      });

      const res = await synthesizeSpeech(
        {
          text: "Let's explore how time dilates near massive black holes.",
          voice: "jenny",
        },
        {
          BLUEPRINT_CONTENT: bucket,
          GROQ_API_KEY: "gsk_test_123",
        }
      );

      expect(res.ok).toBe(true);
      expect(res.voice).toBe("jenny");
      expect(res.durationEstimateSeconds).toBe(7.15);
      expect(res.durationSeconds).toBe(7.15);
    });

    it("preserves fractional seconds in word-count estimate when WAV header is absent", async () => {
      const bucket = createMockR2Bucket();

      // Mock Workers AI fallback returning an mp3
      const mockWorkersAi = {
        run: vi.fn().mockResolvedValue(new Uint8Array([0xff, 0xfb, 0x90, 0x64]).buffer),
      };

      const text = "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two";
      const res = await synthesizeSpeech(
        {
          text,
          voice: "ryan",
        },
        {
          BLUEPRINT_CONTENT: bucket,
          WORKERS_AI: mockWorkersAi,
        }
      );

      expect(res.ok).toBe(true);
      expect(res.voice).toBe("ryan");
      expect(res.durationEstimateSeconds).toBeGreaterThan(0);
      // Duration should preserve two decimal precision, not be integer rounded
      expect(typeof res.durationEstimateSeconds).toBe("number");
      expect(res.durationEstimateSeconds).toBe(Number(res.durationEstimateSeconds.toFixed(2)));
    });
  });
});

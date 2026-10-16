import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  transcribeAudio,
  formatVttTimestamp,
  formatSrtTimestamp,
  generateWebVTT,
  generateSRT,
  groupWordsIntoSegments,
  type AudioSegment,
  type AudioWord,
} from "../src/asr-engine";

describe("ASR Engine - Timestamp & Subtitle Formatting", () => {
  it("formats WebVTT and SRT timestamps accurately across seconds, minutes, and hours", () => {
    // Zero
    expect(formatVttTimestamp(0)).toBe("00:00:00.000");
    expect(formatSrtTimestamp(0)).toBe("00:00:00,000");

    // Seconds with milliseconds
    expect(formatVttTimestamp(12.345)).toBe("00:00:12.345");
    expect(formatSrtTimestamp(12.345)).toBe("00:00:12,345");

    // Minutes rollover
    expect(formatVttTimestamp(75.8)).toBe("00:01:15.800");
    expect(formatSrtTimestamp(75.8)).toBe("00:01:15,800");

    // Hours rollover
    // 3725.009s = 1 hour, 2 minutes, 5 seconds, 9 ms
    expect(formatVttTimestamp(3725.009)).toBe("01:02:05.009");
    expect(formatSrtTimestamp(3725.009)).toBe("01:02:05,009");

    // Edge cases: NaN or negative seconds
    expect(formatVttTimestamp(NaN)).toBe("00:00:00.000");
    expect(formatSrtTimestamp(-10)).toBe("00:00:00,000");
  });

  it("generates valid WebVTT string from segments", () => {
    const segments: AudioSegment[] = [
      { id: 1, start: 0, end: 2.5, text: "Hello and welcome to Voltrix OS." },
      { id: 2, start: 2.6, end: 5.125, text: "This is automatic speech recognition." },
    ];

    const vtt = generateWebVTT(segments);
    expect(vtt).toContain("WEBVTT");
    expect(vtt).toContain("1\n00:00:00.000 --> 00:00:02.500\nHello and welcome to Voltrix OS.");
    expect(vtt).toContain("2\n00:00:02.600 --> 00:00:05.125\nThis is automatic speech recognition.");
  });

  it("generates valid SubRip (SRT) string with comma millisecond separators", () => {
    const segments: AudioSegment[] = [
      { id: 1, start: 1.5, end: 4.25, text: "Testing subrip subtitles." },
      { id: 2, start: 4.3, end: 7.8, text: "Comma millisecond format." },
    ];

    const srt = generateSRT(segments);
    expect(srt).toContain("1\n00:00:01,500 --> 00:00:04,250\nTesting subrip subtitles.");
    expect(srt).toContain("2\n00:00:04,300 --> 00:00:07,800\nComma millisecond format.");
  });

  it("handles empty segments gracefully", () => {
    expect(generateWebVTT([])).toBe("WEBVTT\n");
    expect(generateSRT([])).toBe("");
  });

  it("groups words into natural segments based on punctuation and phrase size", () => {
    const words: AudioWord[] = [
      { word: "Welcome", start: 0.1, end: 0.5 },
      { word: "to", start: 0.5, end: 0.7 },
      { word: "Voltrix.", start: 0.7, end: 1.2 },
      { word: "Experience", start: 1.3, end: 1.8 },
      { word: "edge", start: 1.8, end: 2.1 },
      { word: "intelligence", start: 2.1, end: 2.8 },
      { word: "today!", start: 2.8, end: 3.2 },
    ];

    const segments = groupWordsIntoSegments(words);
    expect(segments.length).toBe(2);
    expect(segments[0].text).toBe("Welcome to Voltrix.");
    expect(segments[0].start).toBe(0.1);
    expect(segments[0].end).toBe(1.2);

    expect(segments[1].text).toBe("Experience edge intelligence today!");
    expect(segments[1].start).toBe(1.3);
    expect(segments[1].end).toBe(3.2);
  });
});

describe("ASR Engine - Audio Transcription Execution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error when WORKERS_AI binding is missing", async () => {
    await expect(
      transcribeAudio(
        { audioBytes: new Uint8Array([1, 2, 3]) },
        { BLUEPRINT_CONTENT: {} as any, WORKERS_AI: null }
      )
    ).rejects.toThrow("Cloudflare Workers AI binding ('env.WORKERS_AI') is not available");
  });

  it("throws error when no audio data is provided", async () => {
    const mockAi = { run: vi.fn() };
    await expect(
      transcribeAudio(
        {},
        { BLUEPRINT_CONTENT: {} as any, WORKERS_AI: mockAi }
      )
    ).rejects.toThrow("No valid audio data provided");
  });

  it("transcribes audio from raw Uint8Array and executes primary model @cf/openai/whisper", async () => {
    const mockAi = {
      run: vi.fn().mockResolvedValue({
        text: "Cloudflare Workers AI delivers lightning-fast inference.",
        language: "en",
        duration: 3.8,
        word_count: 6,
        segments: [
          {
            id: 1,
            start: 0,
            end: 3.8,
            text: "Cloudflare Workers AI delivers lightning-fast inference.",
          },
        ],
      }),
    };

    const audioBytes = new Uint8Array([10, 20, 30, 40]);
    const result = await transcribeAudio(
      { audioBytes, language: "en" },
      { BLUEPRINT_CONTENT: {} as any, WORKERS_AI: mockAi }
    );

    expect(mockAi.run).toHaveBeenCalledTimes(1);
    expect(mockAi.run).toHaveBeenCalledWith("@cf/openai/whisper", {
      audio: [10, 20, 30, 40],
      language: "en",
    });

    expect(result.text).toBe("Cloudflare Workers AI delivers lightning-fast inference.");
    expect(result.language).toBe("en");
    expect(result.duration).toBe(3.8);
    expect(result.wordsCount).toBe(6);
    expect(result.segments.length).toBe(1);
    expect(result.vttUrl).toBeUndefined();
    expect(result.srtUrl).toBeUndefined();
  });

  it("retrieves audio file from R2 bucket when filename is provided", async () => {
    const fakeAudioData = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // RIFF wav header
    const mockGet = vi.fn().mockImplementation((key: string) => {
      if (key === "hf-videos/lecture.wav" || key === "lecture.wav") {
        return {
          arrayBuffer: async () => fakeAudioData.buffer,
        };
      }
      return null;
    });

    const mockBucket = {
      get: mockGet,
      put: vi.fn().mockResolvedValue({}),
    };

    const mockAi = {
      run: vi.fn().mockResolvedValue({
        text: "Quantum mechanics lecture chapter 1.",
        language: "en",
        duration: 2.5,
        word_count: 5,
        segments: [{ id: 1, start: 0, end: 2.5, text: "Quantum mechanics lecture chapter 1." }],
      }),
    };

    const result = await transcribeAudio(
      { filename: "lecture.wav" },
      { BLUEPRINT_CONTENT: mockBucket as any, WORKERS_AI: mockAi }
    );

    expect(mockGet).toHaveBeenCalledWith("lecture.wav");
    expect(result.text).toBe("Quantum mechanics lecture chapter 1.");
    expect(result.wordsCount).toBe(5);
  });

  it("fetches audio from audioUrl when audioBytes and filename are absent", async () => {
    const fakeAudioBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fakeAudioBytes.buffer,
    });
    vi.stubGlobal("fetch", mockFetch);

    const mockAi = {
      run: vi.fn().mockResolvedValue({
        text: "Audio streamed from remote host.",
        word_count: 5,
        segments: [{ id: 1, start: 0, end: 2.0, text: "Audio streamed from remote host." }],
      }),
    };

    const result = await transcribeAudio(
      { audioUrl: "https://example.com/audio/sample.mp3" },
      { BLUEPRINT_CONTENT: {} as any, WORKERS_AI: mockAi }
    );

    expect(mockFetch).toHaveBeenCalledWith("https://example.com/audio/sample.mp3");
    expect(result.text).toBe("Audio streamed from remote host.");
  });

  it("throws descriptive error when audioUrl fetch fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });
    vi.stubGlobal("fetch", mockFetch);

    const mockAi = { run: vi.fn() };

    await expect(
      transcribeAudio(
        { audioUrl: "https://example.com/missing.mp3" },
        { BLUEPRINT_CONTENT: {} as any, WORKERS_AI: mockAi }
      )
    ).rejects.toThrow("Failed to fetch audio from URL: 404 Not Found");
  });

  it("falls back to @cf/openai/whisper-large-v3-turbo when primary whisper fails", async () => {
    const mockAi = {
      run: vi
        .fn()
        .mockRejectedValueOnce(new Error("Primary whisper capacity full"))
        .mockResolvedValueOnce({
          text: "Transcription recovered from fallback model.",
          language: "en",
          segments: [{ id: 1, start: 0, end: 3.0, text: "Transcription recovered from fallback model." }],
        }),
    };

    const result = await transcribeAudio(
      { audioBytes: new Uint8Array([1, 2, 3]) },
      { BLUEPRINT_CONTENT: {} as any, WORKERS_AI: mockAi }
    );

    expect(mockAi.run).toHaveBeenCalledTimes(2);
    expect(mockAi.run).toHaveBeenNthCalledWith(1, "@cf/openai/whisper", expect.any(Object));
    expect(mockAi.run).toHaveBeenNthCalledWith(2, "@cf/openai/whisper-large-v3-turbo", expect.any(Object));
    expect(result.text).toBe("Transcription recovered from fallback model.");
  });

  it("throws combined error when both primary and fallback models fail", async () => {
    const mockAi = {
      run: vi
        .fn()
        .mockRejectedValueOnce(new Error("Primary failed"))
        .mockRejectedValueOnce(new Error("Fallback also failed")),
    };

    await expect(
      transcribeAudio(
        { audioBytes: new Uint8Array([1, 2, 3]) },
        { BLUEPRINT_CONTENT: {} as any, WORKERS_AI: mockAi }
      )
    ).rejects.toThrow(
      "ASR transcription failed with @cf/openai/whisper: Primary failed. Fallback to @cf/openai/whisper-large-v3-turbo also failed: Fallback also failed"
    );
  });

  it("generates WebVTT and SRT subtitles and persists to R2 when generateSubtitles is true", async () => {
    const mockPut = vi.fn().mockResolvedValue({});
    const mockBucket = {
      put: mockPut,
    };

    const mockAi = {
      run: vi.fn().mockResolvedValue({
        result: {
          text: "Welcome to Voltrix OS. The future of edge computing.",
          language: "en",
          duration: 4.5,
          word_count: 9,
          segments: [
            { id: 1, start: 0, end: 2.1, text: "Welcome to Voltrix OS." },
            { id: 2, start: 2.2, end: 4.5, text: "The future of edge computing." },
          ],
        },
      }),
    };

    const result = await transcribeAudio(
      {
        filename: "hf-videos/intro-narration.mp3",
        audioBytes: new Uint8Array([99, 100, 101]),
        generateSubtitles: true,
      },
      {
        BLUEPRINT_CONTENT: mockBucket as any,
        WORKERS_AI: mockAi,
      }
    );

    expect(mockPut).toHaveBeenCalledTimes(2);

    // 1. WebVTT put call
    expect(mockPut).toHaveBeenCalledWith(
      "hf-videos/intro-narration.vtt",
      expect.stringContaining("WEBVTT"),
      expect.objectContaining({
        httpMetadata: expect.objectContaining({
          contentType: "text/vtt",
        }),
      })
    );

    // 2. SRT put call
    expect(mockPut).toHaveBeenCalledWith(
      "hf-videos/intro-narration.srt",
      expect.stringContaining("00:00:00,000 --> 00:00:02,100"),
      expect.objectContaining({
        httpMetadata: expect.objectContaining({
          contentType: "text/plain",
        }),
      })
    );

    expect(result.vttUrl).toBe("https://voltrix.stream/api/hf-videos/intro-narration.vtt");
    expect(result.srtUrl).toBe("https://voltrix.stream/api/hf-videos/intro-narration.srt");
    expect(result.vttContent).toContain("WEBVTT");
    expect(result.srtContent).toContain("Welcome to Voltrix OS.");
  });

  it("handles word-level timings when segments array is omitted", async () => {
    const mockAi = {
      run: vi.fn().mockResolvedValue({
        text: "Fast edge recognition.",
        words: [
          { word: "Fast", start: 0.1, end: 0.4 },
          { word: "edge", start: 0.4, end: 0.8 },
          { word: "recognition.", start: 0.8, end: 1.5 },
        ],
      }),
    };

    const result = await transcribeAudio(
      { audioBytes: new Uint8Array([1, 2, 3]) },
      { BLUEPRINT_CONTENT: {} as any, WORKERS_AI: mockAi }
    );

    expect(result.segments.length).toBe(1);
    expect(result.segments[0].text).toBe("Fast edge recognition.");
    expect(result.duration).toBe(1.5);
    expect(result.wordsCount).toBe(3);
  });
});

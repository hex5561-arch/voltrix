/**
 * Voltrix OS Neural Automatic Speech Recognition (ASR) Engine
 *
 * Transcribes audio and generates synchronized subtitles (WebVTT and SubRip SRT)
 * using Cloudflare Workers AI with fallback:
 * 1. `@cf/openai/whisper` (Primary)
 * 2. `@cf/openai/whisper-large-v3-turbo` (Secondary / High-capacity fallback)
 *
 * Supports input from:
 * - Edge R2 Storage (`env.BLUEPRINT_CONTENT`, e.g. `hf-videos/lecture.mp3` or root)
 * - Direct public URL fetching
 * - Raw binary bytes (`Uint8Array` / `ArrayBuffer`)
 *
 * Persists subtitles (.vtt and .srt) into Cloudflare R2 and serves them
 * via public CDN at `https://voltrix.stream/api/hf-videos/<filename>`.
 */

export interface TranscribeAudioOptions {
  /** Filename or key in R2 storage (can be in 'hf-videos/' or root) */
  filename?: string;
  /** Optional direct URL to fetch audio bytes from if not in R2 */
  audioUrl?: string;
  /** Optional raw Uint8Array / ArrayBuffer */
  audioBytes?: Uint8Array | ArrayBuffer;
  /** Optional ISO language code hint (e.g. 'en', 'es', 'fr', 'sw') */
  language?: string;
  /**
   * If true, produces both WebVTT (.vtt) and SubRip (.srt) subtitle strings
   * and saves them to R2 under hf-videos/<basename>.vtt and .srt
   */
  generateSubtitles?: boolean;
}

export interface AudioSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface AudioWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscribeAudioResult {
  text: string;
  language?: string;
  duration?: number;
  wordsCount: number;
  segments: AudioSegment[];
  vttUrl?: string;
  srtUrl?: string;
  vttContent?: string;
  srtContent?: string;
}

export interface AsrEngineEnv {
  BLUEPRINT_CONTENT: R2Bucket;
  WORKERS_AI?: any;
  CF_AI_GATEWAY?: string;
  CF_AI_GATEWAY_ACCOUNT_ID?: string;
  [key: string]: unknown;
}

/**
 * Formats a duration in seconds into WebVTT timestamp format: HH:MM:SS.mmm
 */
export function formatVttTimestamp(seconds: number): string {
  const validSecs = typeof seconds === "number" && !isNaN(seconds) && seconds >= 0 ? seconds : 0;
  const totalMs = Math.round(validSecs * 1000);
  const ms = totalMs % 1000;
  const totalSecs = Math.floor(totalMs / 1000);
  const s = totalSecs % 60;
  const m = Math.floor(totalSecs / 60) % 60;
  const h = Math.floor(totalSecs / 3600);

  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const mmm = String(ms).padStart(3, "0");

  return `${hh}:${mm}:${ss}.${mmm}`;
}

/**
 * Formats a duration in seconds into SubRip (SRT) timestamp format: HH:MM:SS,mmm
 * Note: SubRip standard requires a comma between seconds and milliseconds.
 */
export function formatSrtTimestamp(seconds: number): string {
  const validSecs = typeof seconds === "number" && !isNaN(seconds) && seconds >= 0 ? seconds : 0;
  const totalMs = Math.round(validSecs * 1000);
  const ms = totalMs % 1000;
  const totalSecs = Math.floor(totalMs / 1000);
  const s = totalSecs % 60;
  const m = Math.floor(totalSecs / 60) % 60;
  const h = Math.floor(totalSecs / 3600);

  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const mmm = String(ms).padStart(3, "0");

  return `${hh}:${mm}:${ss},${mmm}`;
}

/**
 * Generates a valid WebVTT (.vtt) formatted subtitle string from timed segments.
 */
export function generateWebVTT(segments: AudioSegment[]): string {
  if (!segments || segments.length === 0) {
    return "WEBVTT\n";
  }

  const lines: string[] = ["WEBVTT", ""];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const id = typeof seg.id === "number" ? seg.id : i + 1;
    const start = formatVttTimestamp(seg.start);
    const end = formatVttTimestamp(seg.end);
    lines.push(String(id));
    lines.push(`${start} --> ${end}`);
    lines.push(seg.text);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generates a valid SubRip (.srt) formatted subtitle string from timed segments.
 */
export function generateSRT(segments: AudioSegment[]): string {
  if (!segments || segments.length === 0) {
    return "";
  }

  const lines: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const id = typeof seg.id === "number" ? seg.id : i + 1;
    const start = formatSrtTimestamp(seg.start);
    const end = formatSrtTimestamp(seg.end);
    lines.push(String(id));
    lines.push(`${start} --> ${end}`);
    lines.push(seg.text);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Groups raw word-level timings into natural sentence or phrase segments.
 */
export function groupWordsIntoSegments(words: AudioWord[]): AudioSegment[] {
  if (!words || words.length === 0) return [];

  const segments: AudioSegment[] = [];
  let currentGroup: AudioWord[] = [];

  const flush = () => {
    if (currentGroup.length === 0) return;
    const start = currentGroup[0].start;
    const end = currentGroup[currentGroup.length - 1].end;
    const text = currentGroup.map((w) => w.word).join(" ").trim();
    if (text) {
      segments.push({
        id: segments.length + 1,
        start,
        end,
        text,
      });
    }
    currentGroup = [];
  };

  for (const w of words) {
    currentGroup.push(w);
    const endsSentence = /[.?!]$/.test(w.word.trim());
    if (endsSentence || currentGroup.length >= 8) {
      flush();
    }
  }
  flush();

  return segments;
}

/**
 * Transcribes speech audio using Cloudflare Workers AI Whisper models,
 * produces WebVTT and SRT subtitles, and persists subtitles to R2.
 */
export async function transcribeAudio(
  options: TranscribeAudioOptions,
  env: AsrEngineEnv
): Promise<TranscribeAudioResult> {
  const bucket = env.BLUEPRINT_CONTENT;
  const ai = env.WORKERS_AI;

  if (!ai || typeof ai.run !== "function") {
    throw new Error("Cloudflare Workers AI binding ('env.WORKERS_AI') is not available on this instance.");
  }

  // 1. Resolve raw audio bytes
  let rawAudioBytes: Uint8Array | null = null;

  if (options.audioBytes) {
    if (options.audioBytes instanceof Uint8Array) {
      rawAudioBytes = options.audioBytes;
    } else if (options.audioBytes instanceof ArrayBuffer) {
      rawAudioBytes = new Uint8Array(options.audioBytes);
    } else if (ArrayBuffer.isView(options.audioBytes)) {
      rawAudioBytes = new Uint8Array(
        (options.audioBytes as any).buffer,
        (options.audioBytes as any).byteOffset,
        (options.audioBytes as any).byteLength
      );
    }
  }

  if (!rawAudioBytes && options.filename && bucket) {
    const rawKey = options.filename.trim();
    const candidateKeys = [
      rawKey,
      rawKey.startsWith("hf-videos/") ? rawKey.replace(/^hf-videos\//, "") : `hf-videos/${rawKey}`,
    ];

    for (const key of candidateKeys) {
      try {
        const obj = await bucket.get(key);
        if (obj) {
          const ab = await obj.arrayBuffer();
          rawAudioBytes = new Uint8Array(ab);
          break;
        }
      } catch {
        // try next candidate key
      }
    }
  }

  if (!rawAudioBytes && options.audioUrl) {
    const res = await fetch(options.audioUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch audio from URL: ${res.status} ${res.statusText}`);
    }
    const ab = await res.arrayBuffer();
    rawAudioBytes = new Uint8Array(ab);
  }

  if (!rawAudioBytes || rawAudioBytes.byteLength === 0) {
    throw new Error(
      "No valid audio data provided or audio file could not be retrieved. Please provide filename (in R2), audioUrl, or audioBytes."
    );
  }

  // 2. Prepare Whisper execution payload
  const inputPayload: Record<string, any> = {
    audio: Array.from(rawAudioBytes),
  };
  if (options.language) {
    inputPayload.language = options.language.trim();
  }

  // 3. Execute Workers AI with primary model and fallback
  let rawAiResponse: any;
  const primaryModel = "@cf/openai/whisper";
  const fallbackModel = "@cf/openai/whisper-large-v3-turbo";

  try {
    rawAiResponse = await ai.run(primaryModel, inputPayload);
  } catch (err: any) {
    console.warn(`[ASREngine] ${primaryModel} failed (${err.message}). Falling back to ${fallbackModel}...`);
    try {
      rawAiResponse = await ai.run(fallbackModel, inputPayload);
    } catch (fallbackErr: any) {
      throw new Error(
        `ASR transcription failed with ${primaryModel}: ${err.message}. Fallback to ${fallbackModel} also failed: ${fallbackErr.message}`
      );
    }
  }

  // 4. Normalize response
  const res = (rawAiResponse && typeof rawAiResponse === "object" && "result" in rawAiResponse && rawAiResponse.result)
    ? rawAiResponse.result
    : rawAiResponse;

  if (!res || (typeof res !== "object" && typeof res !== "string")) {
    throw new Error("Workers AI returned an empty or invalid transcription response.");
  }

  const text: string = (typeof res === "string" ? res : res.text || "").trim();
  const detectedLanguage: string | undefined = res.language || options.language;
  const rawSegments = Array.isArray(res.segments) ? res.segments : [];
  const rawWords = Array.isArray(res.words) ? res.words : [];

  let segments: AudioSegment[] = [];

  if (rawSegments.length > 0) {
    segments = rawSegments.map((s: any, idx: number) => ({
      id: typeof s.id === "number" ? s.id : idx + 1,
      start: typeof s.start === "number" ? s.start : Number(s.start) || 0,
      end: typeof s.end === "number" ? s.end : Number(s.end) || 0,
      text: String(s.text || "").trim(),
    }));
  } else if (rawWords.length > 0) {
    segments = groupWordsIntoSegments(
      rawWords.map((w: any) => ({
        word: String(w.word ?? w.text ?? ""),
        start: Number(w.start) || 0,
        end: Number(w.end) || 0,
      }))
    );
  } else if (text) {
    const rawDur = typeof res.duration === "number" ? res.duration : 0;
    segments = [
      {
        id: 1,
        start: 0,
        end: rawDur,
        text,
      },
    ];
  }

  let duration: number | undefined = typeof res.duration === "number" ? res.duration : undefined;
  if (duration === undefined && segments.length > 0) {
    duration = segments[segments.length - 1].end;
  }

  let wordsCount: number;
  if (typeof res.word_count === "number") {
    wordsCount = res.word_count;
  } else if (typeof res.wordsCount === "number") {
    wordsCount = res.wordsCount;
  } else if (rawWords.length > 0) {
    wordsCount = rawWords.length;
  } else {
    wordsCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  }

  // 5. Generate subtitles if requested
  let vttUrl: string | undefined;
  let srtUrl: string | undefined;
  let vttContent: string | undefined;
  let srtContent: string | undefined;

  if (options.generateSubtitles) {
    vttContent = generateWebVTT(segments);
    srtContent = generateSRT(segments);

    if (!bucket) {
      throw new Error("Durable edge storage bucket (env.BLUEPRINT_CONTENT) is not configured to save subtitles.");
    }

    let baseName = "";
    if (options.filename) {
      baseName = options.filename
        .replace(/^hf-videos\//i, "")
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-");
    } else if (options.audioUrl) {
      try {
        const url = new URL(options.audioUrl);
        const lastPart = url.pathname.split("/").filter(Boolean).pop() || "audio";
        baseName = lastPart.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-");
      } catch {
        baseName = `audio-${Date.now().toString(36)}`;
      }
    } else {
      baseName = `audio-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    if (!baseName) {
      baseName = `transcript-${Date.now().toString(36)}`;
    }

    const vttFilename = `${baseName}.vtt`;
    const srtFilename = `${baseName}.srt`;
    const r2VttKey = `hf-videos/${vttFilename}`;
    const r2SrtKey = `hf-videos/${srtFilename}`;

    await bucket.put(r2VttKey, vttContent, {
      httpMetadata: {
        contentType: "text/vtt",
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        source: "asr-whisper",
        language: detectedLanguage || "unknown",
        generatedAt: new Date().toISOString(),
      },
    });

    await bucket.put(r2SrtKey, srtContent, {
      httpMetadata: {
        contentType: "text/plain",
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        source: "asr-whisper",
        language: detectedLanguage || "unknown",
        generatedAt: new Date().toISOString(),
      },
    });

    vttUrl = `https://voltrix.stream/api/hf-videos/${vttFilename}`;
    srtUrl = `https://voltrix.stream/api/hf-videos/${srtFilename}`;
  }

  return {
    text,
    language: detectedLanguage,
    duration,
    wordsCount,
    segments,
    vttUrl,
    srtUrl,
    vttContent,
    srtContent,
  };
}

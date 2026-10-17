/**
 * Voltrix Neural Speech (TTS) Engine
 * 
 * Modular, multi-provider speech synthesis engine supporting:
 * 1. Groq Audio Speech via Cloudflare AI Gateway (Primary, ultra-fast, natural prosody)
 * 2. Cloudflare Workers AI MeloTTS (@cf/myshell-ai/melotts) (Secondary, edge-native fallback)
 * 3. Extensible Voice Persona Registry (6 core signature personas + dynamic registration)
 * 4. Content-Hash R2 Deduplication Cache (instant playback, zero wasted inference)
 */

export interface VoicePersona {
  id: string;
  name: string;
  archetype: string;
  description: string;
  gender: "female" | "male" | "neutral";
  defaultSpeed: number;
  aliases: string[];
  groq: {
    model: string;
    voice: string;
    pacingPrefix?: string;
  };
  workersAi: {
    model: string;
    lang: string;
  };
}

export interface SynthesizeSpeechOptions {
  text: string;
  voice?: string;
  speed?: number;
  purpose?: string;
  filename?: string;
  forceRegenerate?: boolean;
  apiKey?: string;
}

export interface SynthesizeSpeechResult {
  ok: boolean;
  audioUrl: string;
  relativeUrl: string;
  voice: string;
  persona: string;
  archetype: string;
  provider: "cached" | "groq-via-cloudflare" | "workers-ai";
  format: "wav" | "mp3";
  durationEstimateSeconds: number;
  durationSeconds?: number;
  htmlEmbed: string;
  attempts?: Array<{ provider: string; status?: number; error?: string }>;
}

const DEFAULT_VOICES: VoicePersona[] = [
  {
    id: "ada",
    name: "Ada (The Professor)",
    archetype: "Academic & Rigorous",
    description: "Articulate, measured, authoritative lecturer. Ideal for STEM proofs, derivations, and formal academic analysis.",
    gender: "female",
    defaultSpeed: 0.95,
    aliases: ["professor", "academic", "lecturer", "diana"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "diana",
      pacingPrefix: "[measured, academic] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-uk",
    },
  },
  {
    id: "zephyr",
    name: "Zephyr (Voltrix Core)",
    archetype: "Futuristic & Crisp",
    description: "Modern, energetic, razor-sharp AI copilot. The default persona for system interactions, coding, and quick responses.",
    gender: "neutral",
    defaultSpeed: 1.05,
    aliases: ["default", "core", "volt", "troy"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "troy",
      pacingPrefix: "[crisp, energetic] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-default",
    },
  },
  {
    id: "nova",
    name: "Nova (The Mentor)",
    archetype: "Inspiring & Youthful",
    description: "Warm, empathetic, upbeat mentor. Great for study motivation, high school and freshman tutoring, and confidence building.",
    gender: "female",
    defaultSpeed: 1.0,
    aliases: ["mentor", "tutor", "autumn", "hannah"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "autumn",
      pacingPrefix: "[warm, encouraging] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "marcus",
    name: "Marcus (The Historian)",
    archetype: "Deep & Contemplative",
    description: "Rich, contemplative baritone for humanities, historical analysis, philosophy, literature, and narrative storytelling.",
    gender: "male",
    defaultSpeed: 0.95,
    aliases: ["historian", "storyteller", "austin", "daniel"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "austin",
      pacingPrefix: "[deep, contemplative] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-au",
    },
  },
  {
    id: "kip",
    name: "Kip (East African Scholar)",
    archetype: "Regional Cadence & Clarity",
    description: "Friendly, rhythmic East African English cadence. Tailored for KCSE, KUCCPS, and regional university curriculum.",
    gender: "male",
    defaultSpeed: 1.0,
    aliases: ["kenya", "scholar", "regional", "kuccps", "east-africa"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "daniel",
      pacingPrefix: "[clear, rhythmic] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-in",
    },
  },
  {
    id: "echo",
    name: "Echo (The Scribe)",
    archetype: "Calm & Focused",
    description: "Gentle, soothing, rhythmic voice for spaced repetition flashcards, definitions, and distraction-free audio revision.",
    gender: "neutral",
    defaultSpeed: 0.9,
    aliases: ["scribe", "calm", "flashcard", "reader"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "diana",
      pacingPrefix: "[calm, gentle] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "christopher",
    name: "Christopher (The Narrator)",
    archetype: "Authoritative & Documentary",
    description: "Dynamic, clear American baritone. Ideal for documentaries, explainer videos, STEM, and narration.",
    gender: "male",
    defaultSpeed: 1.0,
    aliases: ["christopher", "en-us-christopherneural", "narrator"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "austin",
      pacingPrefix: "[clear, engaging] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "jenny",
    name: "Jenny (The Conversationalist)",
    archetype: "Natural & Warm",
    description: "Friendly, expressive, natural American voice. Perfect for conversational lessons, dialogue, and video explainers.",
    gender: "female",
    defaultSpeed: 1.0,
    aliases: ["jenny", "en-us-jennyneural", "conversational"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "autumn",
      pacingPrefix: "[natural, conversational] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "guy",
    name: "Guy (The Analyst)",
    archetype: "Crisp & Professional",
    description: "Formal, balanced, confident American male voice.",
    gender: "male",
    defaultSpeed: 1.0,
    aliases: ["guy", "en-us-guyneural", "analyst"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "troy",
      pacingPrefix: "[crisp, confident] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "aria",
    name: "Aria (The Guide)",
    archetype: "Expressive & Melodic",
    description: "Clear, expressive, engaging American female voice.",
    gender: "female",
    defaultSpeed: 1.0,
    aliases: ["aria", "en-us-arianeural", "guide"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "diana",
      pacingPrefix: "[expressive, engaging] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "eric",
    name: "Eric (The Engineer)",
    archetype: "Grounded & Pragmatic",
    description: "Practical, focused American voice for technical code reviews and engineering breakdowns.",
    gender: "male",
    defaultSpeed: 1.0,
    aliases: ["eric", "en-us-ericneural", "engineer"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "austin",
      pacingPrefix: "[grounded, technical] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "ana",
    name: "Ana (The Youth)",
    archetype: "Youthful & Clear",
    description: "Clear, youthful, gentle tone suited for primary and foundational learning.",
    gender: "female",
    defaultSpeed: 1.0,
    aliases: ["ana", "en-us-ananeural", "youth"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "autumn",
      pacingPrefix: "[gentle, youthful] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "sonia",
    name: "Sonia (British Academic)",
    archetype: "Articulate & Formal",
    description: "Refined British English female accent, ideal for literature, history, and scientific discourse.",
    gender: "female",
    defaultSpeed: 1.0,
    aliases: ["sonia", "en-gb-sonianeural", "british-female"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "diana",
      pacingPrefix: "[refined, British] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-uk",
    },
  },
  {
    id: "ryan",
    name: "Ryan (British Scholar)",
    archetype: "Polished & Contemporary",
    description: "Modern, engaging British English male voice for documentary and educational videos.",
    gender: "male",
    defaultSpeed: 1.0,
    aliases: ["ryan", "en-gb-ryanneural", "british-male"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "austin",
      pacingPrefix: "[polished, British] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-uk",
    },
  },
  {
    id: "andrew",
    name: "Andrew (The Explainer)",
    archetype: "Friendly & Conversational",
    description: "Warm, approachable American male voice.",
    gender: "male",
    defaultSpeed: 1.0,
    aliases: ["andrew", "en-us-andrewneural"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "troy",
      pacingPrefix: "[friendly] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "brian",
    name: "Brian (The Executive)",
    archetype: "Formal & Authoritative",
    description: "Confident, crisp American male voice for executive presentations and formal reports.",
    gender: "male",
    defaultSpeed: 1.0,
    aliases: ["brian", "en-us-brianneural"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "austin",
      pacingPrefix: "[authoritative] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "emma",
    name: "Emma (The Instructor)",
    archetype: "Crisp & Supportive",
    description: "Energetic, clear instructor voice.",
    gender: "female",
    defaultSpeed: 1.0,
    aliases: ["emma", "en-us-emmaneural"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "autumn",
      pacingPrefix: "[supportive] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
  {
    id: "ava",
    name: "Ava (The Studio)",
    archetype: "Modern & Smooth",
    description: "Contemporary, smooth voice for high-production explainer videos.",
    gender: "female",
    defaultSpeed: 1.0,
    aliases: ["ava", "en-us-avaneural"],
    groq: {
      model: "canopylabs/orpheus-v1-english",
      voice: "autumn",
      pacingPrefix: "[smooth] ",
    },
    workersAi: {
      model: "@cf/myshell-ai/melotts",
      lang: "en-us",
    },
  },
];

// In-memory modular registry
const registry = new Map<string, VoicePersona>();

function initDefaultVoices() {
  for (const voice of DEFAULT_VOICES) {
    registerVoice(voice);
  }
}

/**
 * Register a new voice persona (makes the voice system easily extensible).
 */
export function registerVoice(voice: VoicePersona): void {
  registry.set(voice.id.toLowerCase(), voice);
  for (const alias of voice.aliases || []) {
    registry.set(alias.toLowerCase(), voice);
  }
}

/**
 * Resolve a voice persona by ID or alias. Defaults to 'zephyr'.
 */
export function getVoice(idOrAlias?: string): VoicePersona {
  if (registry.size === 0) initDefaultVoices();
  if (!idOrAlias) return registry.get("zephyr") || DEFAULT_VOICES[1];
  const raw = idOrAlias.toLowerCase().trim();
  const direct = registry.get(raw);
  if (direct) return direct;
  // Normalized lookup: strip en-us-, en-gb-, and neural suffix
  const normalized = raw
    .replace(/^en-(us|gb)-/i, "")
    .replace(/neural$/i, "")
    .trim();
  const mapped = registry.get(normalized);
  if (mapped) return mapped;
  return registry.get("zephyr") || DEFAULT_VOICES[1];
}

/**
 * List all registered, unique voice personas.
 */
export function listVoices(): VoicePersona[] {
  if (registry.size === 0) initDefaultVoices();
  const seen = new Set<string>();
  const list: VoicePersona[] = [];
  for (const persona of registry.values()) {
    if (!seen.has(persona.id)) {
      seen.add(persona.id);
      list.push(persona);
    }
  }
  return list;
}

// Initialize on module load
initDefaultVoices();

/**
 * Hash utility for stable content caching.
 */
async function computeHash(content: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .slice(0, 12)
    .join("");
}

/**
 * Calculates audio duration in seconds from standard RIFF/WAV headers:
 * data bytes / (sampleRate * numChannels * (bitsPerSample / 8)) or data bytes / byteRate.
 */
export function parseWavDuration(buffer: ArrayBuffer | Uint8Array): number | null {
  try {
    const ab = buffer instanceof Uint8Array
      ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      : buffer;
    const view = new DataView(ab);
    if (view.byteLength < 44) return null;

    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    if (riff !== "RIFF" || wave !== "WAVE") return null;

    let offset = 12;
    let sampleRate = 0;
    let numChannels = 0;
    let bitsPerSample = 0;
    let byteRate = 0;
    let dataSize = 0;

    while (offset + 8 <= view.byteLength) {
      const chunkId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkId === "fmt ") {
        numChannels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        byteRate = view.getUint32(offset + 16, true);
        bitsPerSample = view.getUint16(offset + 22, true);
      } else if (chunkId === "data") {
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }

    if (byteRate > 0 && dataSize > 0) {
      return Number((dataSize / byteRate).toFixed(2));
    }
    if (sampleRate > 0 && numChannels > 0 && bitsPerSample > 0 && dataSize > 0) {
      const bytesPerSample = (bitsPerSample / 8) * numChannels;
      return Number((dataSize / (sampleRate * bytesPerSample)).toFixed(2));
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Core synthesis function executing the dual-engine waterfall.
 */
export async function synthesizeSpeech(
  options: SynthesizeSpeechOptions,
  env: {
    BLUEPRINT_CONTENT: R2Bucket;
    WORKERS_AI?: any;
    GROQ_API_KEY?: string;
    CF_AI_GATEWAY?: string;
    CF_AI_GATEWAY_ACCOUNT_ID?: string;
    [key: string]: unknown;
  }
): Promise<SynthesizeSpeechResult> {
  const cleanText = (options.text || "").trim();
  if (!cleanText) {
    throw new Error("Text is required for speech synthesis.");
  }

  const requestedVoice = (options.voice || "").trim();
  const persona = getVoice(requestedVoice);
  const resolvedVoice = requestedVoice || persona.id;
  const speed = typeof options.speed === "number" && options.speed > 0 ? options.speed : persona.defaultSpeed;

  // Words per minute estimate (~140 wpm at 1.0x speed), preserving two decimal places
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const durationEstimateSeconds = Number(Math.max(0.5, (wordCount / (140 * speed)) * 60).toFixed(2));

  // Compute deterministic content key
  const cacheKey = `${persona.id}:${speed}:${cleanText}`;
  const textHash = await computeHash(cacheKey);
  const baseName = options.filename
    ? options.filename.toLowerCase().replace(/[^a-z0-9_-]/g, "-")
    : `tts-${persona.id}-${textHash}`;

  const bucket = env.BLUEPRINT_CONTENT;
  if (!bucket) {
    throw new Error("Edge storage bucket (BLUEPRINT_CONTENT) is not configured.");
  }

  // ── Step 1: Content-Hash Cache Check ──
  if (!options.forceRegenerate) {
    // Check both potential extensions (.wav and .mp3)
    const existingWav = await bucket.head(`hf-videos/${baseName}.wav`);
    if (existingWav) {
      const targetFile = `${baseName}.wav`;
      const cachedDuration = existingWav.customMetadata?.durationSeconds
        ? parseFloat(existingWav.customMetadata.durationSeconds)
        : durationEstimateSeconds;
      return {
        ok: true,
        audioUrl: `https://voltrix.stream/api/hf-videos/${targetFile}`,
        relativeUrl: `/api/hf-videos/${targetFile}`,
        voice: resolvedVoice,
        persona: persona.name,
        archetype: persona.archetype,
        provider: "cached",
        format: "wav",
        durationEstimateSeconds: cachedDuration,
        durationSeconds: cachedDuration,
        htmlEmbed: `<audio controls src="https://voltrix.stream/api/hf-videos/${targetFile}" preload="metadata"></audio>`,
      };
    }
    const existingMp3 = await bucket.head(`hf-videos/${baseName}.mp3`);
    if (existingMp3) {
      const targetFile = `${baseName}.mp3`;
      const cachedDuration = existingMp3.customMetadata?.durationSeconds
        ? parseFloat(existingMp3.customMetadata.durationSeconds)
        : durationEstimateSeconds;
      return {
        ok: true,
        audioUrl: `https://voltrix.stream/api/hf-videos/${targetFile}`,
        relativeUrl: `/api/hf-videos/${targetFile}`,
        voice: resolvedVoice,
        persona: persona.name,
        archetype: persona.archetype,
        provider: "cached",
        format: "mp3",
        durationEstimateSeconds: cachedDuration,
        durationSeconds: cachedDuration,
        htmlEmbed: `<audio controls src="https://voltrix.stream/api/hf-videos/${targetFile}" preload="metadata"></audio>`,
      };
    }
  }

  // ── Step 2: Dual-Engine Execution Waterfall ──
  const groqApiKey = options.apiKey || (env.GROQ_API_KEY as string) || "";
  const cfGateway = (env.CF_AI_GATEWAY as string) || "voltrix-ai";
  const cfAccountId = (env.CF_AI_GATEWAY_ACCOUNT_ID as string) || "84f114e1b747a07d247ceb17b0c1dc14";
  const groqUrl = cfGateway && cfAccountId
    ? `https://gateway.ai.cloudflare.com/v1/${cfAccountId}/${cfGateway}/groq/openai/v1/audio/speech`
    : "https://api.groq.com/openai/v1/audio/speech";

  let audioBytes: ArrayBuffer | null = null;
  let ext: "wav" | "mp3" = "mp3";
  let contentType = "audio/mpeg";
  let provider: "groq-via-cloudflare" | "workers-ai" = "workers-ai";
  const attempts: Array<{ provider: string; status?: number; error?: string }> = [];

  // Primary: Groq Speech via Cloudflare AI Gateway
  if (groqApiKey) {
    try {
      const prefix = persona.groq.pacingPrefix || "";
      const promptText = cleanText.startsWith("[") ? cleanText : `${prefix}${cleanText}`;

      const groqRes = await fetch(groqUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: persona.groq.model || "canopylabs/orpheus-v1-english",
          voice: persona.groq.voice,
          input: promptText,
          response_format: "wav",
        }),
      });

      if (groqRes.ok) {
        audioBytes = await groqRes.arrayBuffer();
        ext = "wav";
        contentType = "audio/wav";
        provider = "groq-via-cloudflare";
      } else {
        const errText = await groqRes.text().catch(() => "");
        attempts.push({ provider: "groq-via-cloudflare", status: groqRes.status, error: errText });
      }
    } catch (e: any) {
      attempts.push({ provider: "groq-via-cloudflare", error: e.message || String(e) });
    }
  } else {
    attempts.push({ provider: "groq-via-cloudflare", error: "GROQ_API_KEY secret not found." });
  }

  // Secondary Fallback: Cloudflare Workers AI MeloTTS
  if (!audioBytes && env.WORKERS_AI) {
    try {
      const aiRes: any = await (env.WORKERS_AI as any).run(persona.workersAi.model || "@cf/myshell-ai/melotts", {
        prompt: cleanText,
        lang: persona.workersAi.lang || "en-default",
      });

      if (aiRes) {
        provider = "workers-ai";
        ext = "mp3";
        contentType = "audio/mpeg";

        if (aiRes instanceof ArrayBuffer) {
          audioBytes = aiRes;
        } else if (aiRes instanceof Uint8Array) {
          audioBytes = aiRes.buffer as ArrayBuffer;
        } else if (typeof aiRes === "object" && aiRes !== null && "audio" in aiRes) {
          audioBytes = Uint8Array.from(atob(aiRes.audio), c => c.charCodeAt(0)).buffer as ArrayBuffer;
        } else {
          audioBytes = await new Response(aiRes).arrayBuffer();
        }
      } else {
        attempts.push({ provider: "workers-ai", error: "Empty response from Workers AI." });
      }
    } catch (e: any) {
      attempts.push({ provider: "workers-ai", error: e.message || String(e) });
    }
  }

  if (!audioBytes) {
    throw new Error(`TTS synthesis failed across all backends:\n${JSON.stringify(attempts, null, 2)}`);
  }

  // Calculate accurate duration if WAV
  let exactDuration = durationEstimateSeconds;
  if (audioBytes && ext === "wav") {
    const wavDuration = parseWavDuration(audioBytes);
    if (wavDuration !== null && wavDuration > 0) {
      exactDuration = wavDuration;
    }
  }

  // ── Step 3: Persist to Edge R2 Storage ──
  const targetFile = `${baseName}.${ext}`;
  await bucket.put(`hf-videos/${targetFile}`, audioBytes, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      voice: resolvedVoice,
      persona: persona.name,
      provider,
      generatedAt: new Date().toISOString(),
      durationSeconds: String(exactDuration),
    },
  });

  const audioUrl = `https://voltrix.stream/api/hf-videos/${targetFile}`;
  const relativeUrl = `/api/hf-videos/${targetFile}`;

  return {
    ok: true,
    audioUrl,
    relativeUrl,
    voice: resolvedVoice,
    persona: persona.name,
    archetype: persona.archetype,
    provider,
    format: ext,
    durationEstimateSeconds: exactDuration,
    durationSeconds: exactDuration,
    htmlEmbed: `<audio controls src="${audioUrl}" preload="metadata"></audio>`,
    attempts,
  };
}

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
  const key = idOrAlias.toLowerCase().trim();
  return registry.get(key) || registry.get("zephyr") || DEFAULT_VOICES[1];
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

  const persona = getVoice(options.voice);
  const speed = typeof options.speed === "number" && options.speed > 0 ? options.speed : persona.defaultSpeed;

  // Words per minute estimate (~140 wpm at 1.0x speed)
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const durationEstimateSeconds = Math.max(1, Math.round((wordCount / (140 * speed)) * 60));

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
      return {
        ok: true,
        audioUrl: `https://voltrix.stream/api/hf-videos/${targetFile}`,
        relativeUrl: `/api/hf-videos/${targetFile}`,
        voice: persona.id,
        persona: persona.name,
        archetype: persona.archetype,
        provider: "cached",
        format: "wav",
        durationEstimateSeconds,
        htmlEmbed: `<audio controls src="https://voltrix.stream/api/hf-videos/${targetFile}" preload="metadata"></audio>`,
      };
    }
    const existingMp3 = await bucket.head(`hf-videos/${baseName}.mp3`);
    if (existingMp3) {
      const targetFile = `${baseName}.mp3`;
      return {
        ok: true,
        audioUrl: `https://voltrix.stream/api/hf-videos/${targetFile}`,
        relativeUrl: `/api/hf-videos/${targetFile}`,
        voice: persona.id,
        persona: persona.name,
        archetype: persona.archetype,
        provider: "cached",
        format: "mp3",
        durationEstimateSeconds,
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

  // ── Step 3: Persist to Edge R2 Storage ──
  const targetFile = `${baseName}.${ext}`;
  await bucket.put(`hf-videos/${targetFile}`, audioBytes, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      voice: persona.id,
      persona: persona.name,
      provider,
      generatedAt: new Date().toISOString(),
    },
  });

  const audioUrl = `https://voltrix.stream/api/hf-videos/${targetFile}`;
  const relativeUrl = `/api/hf-videos/${targetFile}`;

  return {
    ok: true,
    audioUrl,
    relativeUrl,
    voice: persona.id,
    persona: persona.name,
    archetype: persona.archetype,
    provider,
    format: ext,
    durationEstimateSeconds,
    htmlEmbed: `<audio controls src="${audioUrl}" preload="metadata"></audio>`,
    attempts,
  };
}

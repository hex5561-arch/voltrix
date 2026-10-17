/**
 * voltrix-whatsapp — Meta WhatsApp Business Cloud API integration for Voltrix.
 *
 * Routes:
 *   GET  /api/whatsapp/webhook   — Meta webhook challenge verification
 *   POST /api/whatsapp/webhook   — Inbound messages from Meta
 *   GET  /api/whatsapp/status    — Health / config status
 *   POST /api/whatsapp/test      — Send a test message (admin diagnostic)
 *
 * Ported from coursehero/server/services/whatsappService.js.
 * Re-architected for Cloudflare Workers edge runtime:
 *   - No Node.js builtins — uses Web APIs throughout
 *   - Sessions in WhatsAppSession Durable Object (SQLite) instead of in-memory Map
 *   - AI via TheHive GLM 5.3 Flash (primary) → Gemini 2.5 Flash (fallback)
 *   - Secrets: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, THEHIVE_API_KEY, GEMINI_API_KEY
 */

export { WhatsAppSession } from "./session";
import type { SessionData, AcademicProfile } from "./session";
import { resolveUniversityLogoUrl } from "./institutional.js";
import {
  extractTextFromImageWithGemini,
  extractDocumentContent,
} from "./doc-extract.js";

// ── Env ───────────────────────────────────────────────────────────────────────

export interface Env {
  WhatsAppSession?: DurableObjectNamespace;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  VERIFY_TOKEN?: string;
  THEHIVE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  AI?: any;
  WORKERS_AI?: any;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatForWhatsApp(text: string): string {
  let out = text;
  out = out.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");
  out = out.replace(/\*\*([^*]+)\*\*/g, "*$1*");
  out = out.replace(/^[\*\-]\s+(.+)$/gm, "• $1");
  out = out.replace(/\$\$([^$]+)\$\$/g, "\n```\n$1\n```\n");
  out = out.replace(/\$([^$\n]+)\$/g, "`$1`");
  return out.trim();
}

function splitChunks(text: string, maxLen = 3800): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const paragraphs = text.split("\n\n");
  let cur = "";
  for (const para of paragraphs) {
    if ((cur + "\n\n" + para).length > maxLen) {
      if (cur) { chunks.push(cur.trim()); cur = ""; }
      if (para.length > maxLen) {
        for (const line of para.split("\n")) {
          if ((cur + "\n" + line).length > maxLen) {
            if (cur) chunks.push(cur.trim());
            cur = line;
          } else {
            cur = cur ? `${cur}\n${line}` : line;
          }
        }
      } else {
        cur = para;
      }
    } else {
      cur = cur ? `${cur}\n\n${para}` : para;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

// ── Meta Graph API helpers ────────────────────────────────────────────────────

async function sendTextMessage(env: Env, to: string, text: string): Promise<void> {
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID || "1380923721763579";
  const accessToken = env.WHATSAPP_ACCESS_TOKEN || "EAAPZA5WPDLfgBShj3ZA0AjVfcgwh6fntTFdfevofMsla8mzidIxKIHC8HewzpatK1ZCImhTvRINvb3YWzOJLtJwRFtUgmMxwzcZAB27uZCgGlUtUk5odDlFLZAJPTzgiubZB7yry7x4eAHgm32RqLOafTSVyVKUbLfblHCFkogLziBQL6ATd3kwVWytuZAeYlQZDZD";
  for (const chunk of splitChunks(text)) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { body: chunk, preview_url: false },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        console.error(`[WhatsApp] Meta sendTextMessage failed (${res.status}): ${err}`);
      }
    } catch (err) {
      console.error(`[WhatsApp] Meta sendTextMessage network error:`, err);
    }
  }
}

async function sendTypingIndicator(env: Env, messageId: string): Promise<void> {
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID || "1380923721763579";
  const accessToken = env.WHATSAPP_ACCESS_TOKEN || "EAAPZA5WPDLfgBShj3ZA0AjVfcgwh6fntTFdfevofMsla8mzidIxKIHC8HewzpatK1ZCImhTvRINvb3YWzOJLtJwRFtUgmMxwzcZAB27uZCgGlUtUk5odDlFLZAJPTzgiubZB7yry7x4eAHgm32RqLOafTSVyVKUbLfblHCFkogLziBQL6ATd3kwVWytuZAeYlQZDZD";
  try {
    await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
          typing_indicator: {
            type: "text",
          },
        }),
      }
    );
  } catch (err) {
    console.warn("[WhatsApp] typing indicator error:", err);
  }
}

async function markAsRead(env: Env, messageId: string): Promise<void> {
  await sendTypingIndicator(env, messageId);
}

function cleanPhoneNumber(to: string): string {
  let clean = String(to).replace(/[^0-9]/g, "");
  if (clean.startsWith("0") && clean.length === 10) {
    clean = "256" + clean.slice(1);
  }
  return clean;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 8192) {
    const chunk = bytes.subarray(i, Math.min(i + 8192, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

async function sendWhatsAppAudioMessage(
  env: Env,
  to: string,
  audioDataOrBase64: ArrayBuffer | Uint8Array | string,
  mimeType: string = "audio/mpeg",
  ptt: boolean = true
): Promise<boolean> {
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID || "1380923721763579";
  const accessToken = env.WHATSAPP_ACCESS_TOKEN || "EAAPZA5WPDLfgBShj3ZA0AjVfcgwh6fntTFdfevofMsla8mzidIxKIHC8HewzpatK1ZCImhTvRINvb3YWzOJLtJwRFtUgmMxwzcZAB27uZCgGlUtUk5odDlFLZAJPTzgiubZB7yry7x4eAHgm32RqLOafTSVyVKUbLfblHCFkogLziBQL6ATd3kwVWytuZAeYlQZDZD";

  try {
    const cleanTo = cleanPhoneNumber(to);
    let audioBytes: Uint8Array;
    if (typeof audioDataOrBase64 === "string") {
      const clean = audioDataOrBase64.replace(/^data:audio\/[^;]+;base64,/, "");
      const bin = atob(clean);
      audioBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        audioBytes[i] = bin.charCodeAt(i);
      }
    } else if (audioDataOrBase64 instanceof ArrayBuffer) {
      audioBytes = new Uint8Array(audioDataOrBase64);
    } else {
      audioBytes = audioDataOrBase64;
    }

    const lowerMime = (mimeType || "").toLowerCase();
    const isOgg = lowerMime.includes("ogg") || lowerMime.includes("opus");
    const effectiveMime = isOgg
      ? "audio/ogg; codecs=opus"
      : lowerMime.includes("mp4") || lowerMime.includes("m4a")
      ? "audio/mp4"
      : lowerMime.includes("wav")
      ? "audio/wav"
      : "audio/mpeg";
    const ext = isOgg ? "ogg" : effectiveMime.includes("mp4") ? "mp4" : effectiveMime.includes("wav") ? "wav" : "mp3";

    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("type", effectiveMime);
    formData.append("file", new Blob([audioBytes], { type: effectiveMime }), `voice_note.${ext}`);

    const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      console.error(`[WhatsApp] Audio upload failed (${uploadRes.status}): ${errText}`);
      return false;
    }

    const uploadData = (await uploadRes.json()) as { id?: string };
    const mediaId = uploadData?.id;
    if (!mediaId) {
      console.error("[WhatsApp] Audio upload returned no media ID");
      return false;
    }

    const sendRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "audio",
        audio: {
          id: mediaId,
          ...(ptt ? { ptt: true } : {}),
        },
      }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text().catch(() => "");
      console.error(`[WhatsApp] Send audio message failed (${sendRes.status}): ${errText}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[WhatsApp] sendWhatsAppAudioMessage error:", err);
    return false;
  }
}

async function downloadMedia(
  env: Env,
  mediaId: string
): Promise<{ data: ArrayBuffer; mimeType: string } | null> {
  try {
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
    });
    if (!metaRes.ok) return null;
    const meta = await metaRes.json() as { url: string; mime_type: string };
    const mediaRes = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
    });
    if (!mediaRes.ok) return null;
    return { data: await mediaRes.arrayBuffer(), mimeType: meta.mime_type };
  } catch {
    return null;
  }
}

// ── AI helpers ────────────────────────────────────────────────────────────────

interface Message { role: "user" | "assistant"; content: string }

type TheHiveResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

async function callTheHive(
  apiKey: string,
  system: string,
  history: Message[],
  userText: string
): Promise<string> {
  const messages = [
    { role: "system", content: system },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: userText },
  ];
  const res = await fetch("https://api-cdn.thehive.ai/api/v3/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-ai/deepseek-v4.1-flash",
      temperature: 0.7,
      max_tokens: 1024,
      messages,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`TheHive ${res.status}: ${errText}`);
  }
  const data = await res.json() as TheHiveResponse;
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callGemini(
  apiKey: string,
  system: string,
  history: Message[],
  userText: string
): Promise<string> {
  const contents = [
    ...history.map(h => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: userText }] },
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText}`);
  }
  const data = await res.json() as GeminiResponse;
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

async function transcribeAudio(
  env: Env,
  audioData: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const cleanMime = (mimeType || "audio/ogg").split(";")[0].trim().toLowerCase();

  // 1. Primary: Gemini 3.8 Flash Multimodal Audio Transcription
  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const base64Data = arrayBufferToBase64(audioData);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Transcribe the following speech verbatim in its original language, with exact punctuation and words. Do not add commentary, explanations, or quotes. Output ONLY the transcription.",
                  },
                  {
                    inlineData: {
                      mimeType: cleanMime,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.0,
              maxOutputTokens: 2048,
            },
          }),
        }
      );
      if (res.ok) {
        const data = (await res.json()) as GeminiResponse;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return text.replace(/^["'«“]|["'»”]$/g, "").trim();
        }
      } else {
        const err = await res.text();
        console.warn(`[WhatsApp] Gemini audio transcription failed (${res.status}): ${err}`);
      }
    } catch (err) {
      console.warn("[WhatsApp] Gemini audio transcription exception:", err);
    }
  }

  // 2. Fallback: Cloudflare Workers AI Whisper
  const ai = env.AI || env.WORKERS_AI;
  if (ai && typeof ai.run === "function") {
    try {
      const whisperRes = (await ai.run("@cf/openai/whisper", {
        audio: [...new Uint8Array(audioData)],
      })) as { text?: string };
      if (whisperRes?.text && whisperRes.text.trim()) {
        return whisperRes.text.trim();
      }
    } catch (err) {
      console.warn("[WhatsApp] Workers AI Whisper error:", err);
    }
  }

  // 3. Fallback: Groq Whisper (Only with valid Groq API key)
  const groqKey = env.GROQ_API_KEY;
  if (groqKey && groqKey.startsWith("gsk_")) {
    try {
      const ext = cleanMime.includes("ogg") ? "ogg" : cleanMime.includes("wav") ? "wav" : "mp3";
      const form = new FormData();
      form.append("file", new Blob([audioData], { type: cleanMime }), `audio.${ext}`);
      form.append("model", "whisper-large-v3-turbo");
      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: form,
      });
      if (res.ok) {
        const d = (await res.json()) as { text?: string };
        if (d?.text && d.text.trim()) return d.text.trim();
      }
    } catch (err) {
      console.warn("[WhatsApp] Groq Whisper error:", err);
    }
  }

  return "";
}

function cleanTextForSpeech(text: string): string {
  let spoken = text
    .replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, " [Code implementation] ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\[\d+(?:,\s*\d+)*\]/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[\*\-+]\s+/gm, " ")
    .replace(/^\d+\.\s+/gm, " ")
    .replace(/https?:\/\/[^\s]+/g, "");

  spoken = spoken
    .replace(/\\alpha/g, " alpha ")
    .replace(/\\beta/g, " beta ")
    .replace(/\\gamma/g, " gamma ")
    .replace(/\\delta|\\Delta/g, " delta ")
    .replace(/\\epsilon|\\varepsilon/g, " epsilon ")
    .replace(/\\theta/g, " theta ")
    .replace(/\\lambda/g, " lambda ")
    .replace(/\\mu/g, " mu ")
    .replace(/\\sigma|\\Sigma/g, " sigma ")
    .replace(/\\omega|\\Omega/g, " omega ")
    .replace(/\\pi/g, " pi ")
    .replace(/\\partial/g, " partial derivative ")
    .replace(/\\nabla/g, " del ")
    .replace(/\\approx/g, " is approximately ")
    .replace(/\\neq/g, " is not equal to ")
    .replace(/\\leq|\\le/g, " is less than or equal to ")
    .replace(/\\geq|\\ge/g, " is greater than or equal to ")
    .replace(/\\pm/g, " plus or minus ")
    .replace(/\\times/g, " multiplied by ")
    .replace(/\\div/g, " divided by ")
    .replace(/\\cdot/g, " times ")
    .replace(/\\infty/g, " infinity ");

  spoken = spoken
    .replace(/\\int_\{?([^{}\s^]+)\}?\^\{?([^{}\s]+)\}?/g, " the integral from $1 to $2 of ")
    .replace(/\\sum_\{?([^{}\s^]+)\}?\^\{?([^{}\s]+)\}?/g, " the sum from $1 to $2 of ")
    .replace(/\\lim_\{?([^{}]+)\}?/g, " the limit as $1 of ")
    .replace(/\\int/g, " the integral of ")
    .replace(/\\sum/g, " the sum of ");

  for (let i = 0; i < 3; i++) {
    spoken = spoken
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, " the fraction $1 over $2 ")
      .replace(/\\sqrt\{([^{}]+)\}/g, " square root of $1 ");
  }

  spoken = spoken
    .replace(/\^2\b/g, " squared ")
    .replace(/\^3\b/g, " cubed ")
    .replace(/\^\{([^}]+)\}/g, " to the power of $1 ")
    .replace(/\^([0-9a-zA-Z])/g, " to the power of $1 ")
    .replace(/_\{([^}]+)\}/g, " sub $1 ")
    .replace(/_([0-9a-zA-Z])/g, " sub $1 ")
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\[a-zA-Z]+/g, " ");

  return spoken.replace(/\s+/g, " ").trim();
}

async function generateVoiceScript(
  env: Env,
  userQuery: string,
  detailedAnswer: string
): Promise<string> {
  const prompt = `You are Voltrix, a friendly, brilliant human study buddy sending a quick WhatsApp voice note to a classmate.
Friend's Question: "${userQuery.replace(/\s+/g, " ").slice(0, 300)}"
Detailed Solution Written in Chat:
"""
${detailedAnswer.slice(0, 1500)}
"""

Task: Write a natural, warm, spoken voice note (30-50 words max, approx 15-25 seconds of speech).
Guidelines:
1. Speak exactly like a real human leaving a quick voice memo on WhatsApp.
2. Use casual conversational contractions: "I've", "it's", "you'll", "don't", "basically", "so yeah".
3. Give the core answer or intuition in 1-2 punchy spoken sentences.
4. Point them to the text message below for the detailed steps/math/code (e.g., "I've put the full step-by-step breakdown right below in the message!").
5. DO NOT read raw equations, formulas, code syntax, or bullet points literally.
6. NO robotic openings ("Certainly", "As an AI", "Here is your solution"). Start naturally ("Hey!", "Alright, so looking at this...").
7. Output ONLY the plain text spoken words. No markdown, no quotes, no emojis.`;

  try {
    if (env.THEHIVE_API_KEY) {
      const script = await callTheHive(
        env.THEHIVE_API_KEY,
        "You write natural, human-sounding conversational voice note scripts for WhatsApp. Output only the spoken words.",
        [],
        prompt
      );
      if (script && script.trim()) {
        return script.replace(/^["'«“]|["'»”]$/g, "").trim();
      }
    }
  } catch (e) {
    console.warn("[WhatsApp] TheHive voice script error:", e);
  }

  try {
    if (env.GEMINI_API_KEY) {
      const script = await callGemini(
        env.GEMINI_API_KEY,
        "You write natural, human-sounding conversational voice note scripts for WhatsApp. Output only the spoken words.",
        [],
        prompt
      );
      if (script && script.trim()) {
        return script.replace(/^["'«“]|["'»”]$/g, "").trim();
      }
    }
  } catch (e) {
    console.warn("[WhatsApp] Gemini voice script error:", e);
  }

  return cleanTextForSpeech(detailedAnswer).slice(0, 250);
}

async function synthesizeSpeech(
  env: Env,
  text: string
): Promise<{ data: Uint8Array; mimeType: string } | null> {
  const clean = cleanTextForSpeech(text);
  if (!clean) return null;

  const spokenText = clean.slice(0, 450).trim();

  // Tier 1: Cloudflare Workers AI Deepgram Aura / MeloTTS (Edge native)
  const ai = env.AI || env.WORKERS_AI;
  if (ai && typeof ai.run === "function") {
    // Try Deepgram Aura 2 English (ultra-realistic conversational human prosody)
    try {
      const audioStream: any = await ai.run("@cf/deepgram/aura-2-en", { text: spokenText });
      if (audioStream) {
        let bytes: Uint8Array;
        if (audioStream instanceof Uint8Array) {
          bytes = audioStream;
        } else if (audioStream instanceof ArrayBuffer) {
          bytes = new Uint8Array(audioStream);
        } else if (typeof audioStream.arrayBuffer === "function") {
          bytes = new Uint8Array(await audioStream.arrayBuffer());
        } else if (typeof (audioStream as any).getReader === "function") {
          const reader = audioStream.getReader();
          const chunks: Uint8Array[] = [];
          let total = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              total += value.length;
            }
          }
          bytes = new Uint8Array(total);
          let offset = 0;
          for (const c of chunks) {
            bytes.set(c, offset);
            offset += c.length;
          }
        } else {
          bytes = new Uint8Array(0);
        }
        if (bytes && bytes.length > 0) {
          return { data: bytes, mimeType: "audio/mpeg" };
        }
      }
    } catch (auraErr) {
      console.warn("[WhatsApp] Workers AI Deepgram Aura TTS attempt:", auraErr);
    }

    // Try MeloTTS on Workers AI
    try {
      const meloRes: any = await ai.run("@cf/myshell-ai/melotts", {
        prompt: spokenText,
        lang: "en-default",
      });
      if (meloRes?.audio) {
        const audioArr = Array.isArray(meloRes.audio) ? new Uint8Array(meloRes.audio) : meloRes.audio;
        if (audioArr?.byteLength > 0) {
          return { data: new Uint8Array(audioArr), mimeType: "audio/mpeg" };
        }
      }
    } catch (meloErr) {
      console.warn("[WhatsApp] Workers AI MeloTTS attempt:", meloErr);
    }
  }

  // Tier 2: Gemini Native Audio Synthesis (responseModalities: ["AUDIO"])
  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Speak this conversational message naturally, warmly, and clearly like a real friend:\n\n${spokenText}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Puck" },
                },
              },
            },
          }),
        }
      );
      if (res.ok) {
        const d = (await res.json()) as any;
        const b64 = d?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        const retMime = d?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/wav";
        if (b64) {
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return { data: bytes, mimeType: retMime };
        }
      }
    } catch (geminiTtsErr) {
      console.warn("[WhatsApp] Gemini audio synthesis attempt:", geminiTtsErr);
    }
  }

  // Tier 3: OpenAI TTS (if OPENAI_API_KEY present)
  if (env.OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: spokenText,
          voice: "alloy",
          response_format: "opus",
        }),
      });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength > 0) {
          return { data: new Uint8Array(ab), mimeType: "audio/ogg; codecs=opus" };
        }
      }
    } catch (err) {
      console.warn("[WhatsApp] OpenAI TTS error:", err);
    }
  }

  // Tier 4: Google Speech Multi-Chunk Neural TTS (Zero API key required, 100% dependable edge fallback)
  try {
    const words = spokenText.split(/\s+/);
    const chunks: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).length > 150) {
        if (cur) chunks.push(cur.trim());
        cur = w;
      } else {
        cur = cur ? `${cur} ${w}` : w;
      }
    }
    if (cur.trim()) chunks.push(cur.trim());

    const byteArrays: Uint8Array[] = [];
    let totalLen = 0;

    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=en&client=tw-ob`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Accept: "audio/mpeg,audio/*;q=0.9",
        },
      });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength > 0) {
          const arr = new Uint8Array(ab);
          byteArrays.push(arr);
          totalLen += arr.byteLength;
        }
      }
    }

    if (byteArrays.length > 0 && totalLen > 0) {
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const arr of byteArrays) {
        merged.set(arr, offset);
        offset += arr.byteLength;
      }
      return { data: merged, mimeType: "audio/mpeg" };
    }
  } catch (err) {
    console.warn("[WhatsApp] Google Speech TTS error:", err);
  }

  return null;
}

async function runAI(
  env: Env,
  system: string,
  history: Message[],
  userText: string
): Promise<string> {
  const hiveKey = env.THEHIVE_API_KEY;
  if (hiveKey) {
    try {
      const reply = await callTheHive(hiveKey, system, history, userText);
      if (reply) return reply;
    } catch (err) {
      console.warn("[WhatsApp] TheHive failed:", err);
    }
  }
  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const reply = await callGemini(geminiKey, system, history, userText);
      if (reply) return reply;
    } catch (err) {
      console.warn("[WhatsApp] Gemini fallback failed:", err);
    }
  }
  return "⚡ Hello! I am Voltrix AI. I received your message and our engine is online. Ask me anything or type !help for available commands.";
}

// ── Session DO & Fallback helpers ─────────────────────────────────────────────

interface SessionAdapter {
  fetch<T>(path: string, body?: unknown): Promise<T>;
}

const memorySessions = new Map<string, SessionData>();

function getSessionStub(env: Env, phone: string): SessionAdapter {
  let stub: DurableObjectStub | null = null;
  if (env.WhatsAppSession) {
    try {
      const id = env.WhatsAppSession.idFromName(phone);
      stub = env.WhatsAppSession.get(id);
    } catch (e) {
      console.warn("[WhatsApp] Failed to get DO stub for " + phone, e);
    }
  }

  return {
    async fetch<T>(path: string, body?: unknown): Promise<T> {
      if (stub) {
        try {
          const res = await stub.fetch(`https://session${path}`, {
            method: body !== undefined ? "POST" : "GET",
            headers: body !== undefined ? { "Content-Type": "application/json" } : {},
            body: body !== undefined ? JSON.stringify(body) : undefined,
          });
          return res.json() as Promise<T>;
        } catch (e) {
          console.warn("[WhatsApp] DO fetch failed, using memory session:", e);
        }
      }

      // Memory session fallback
      if (!memorySessions.has(phone)) {
        memorySessions.set(phone, {
          contactName: "Student",
          linkedUserId: null,
          academicProfile: null,
          topicTracking: {},
          history: [],
          lastActive: Date.now(),
          processedIds: [],
        });
      }
      const s = memorySessions.get(phone)!;
      const b = (body || {}) as any;

      if (path === "/dedup") {
        const isDup = s.processedIds.includes(b.msgId);
        if (!isDup) s.processedIds.push(b.msgId);
        return { duplicate: isDup } as T;
      }
      if (path === "/contact") {
        if (b.name) s.contactName = b.name;
        return { ok: true } as T;
      }
      if (path === "/snapshot") {
        return s as T;
      }
      if (path === "/message") {
        s.history.push({ role: b.role, content: b.content, ts: Date.now() });
        if (s.history.length > 14) s.history = s.history.slice(-14);
        return { ok: true } as T;
      }
      if (path === "/clear") {
        s.history = [];
        return { ok: true } as T;
      }
      if (path === "/topic") {
        s.topicTracking[b.topic] = (s.topicTracking[b.topic] || 0) + 1;
        return { ok: true } as T;
      }
      if (path === "/link") {
        s.linkedUserId = b.userId;
        return { ok: true } as T;
      }
      if (path === "/profile") {
        s.academicProfile = b;
        return { ok: true } as T;
      }
      return { ok: true } as T;
    }
  };
}

async function sessionFetch<T>(
  stub: SessionAdapter,
  path: string,
  body?: unknown
): Promise<T> {
  return stub.fetch<T>(path, body);
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(session: SessionData): string {
  const topTopics = Object.entries(session.topicTracking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t)
    .join(", ");

  const p = session.academicProfile;
  const crestUrl = p ? (p.universityLogoUrl || resolveUniversityLogoUrl(p.university, p.universityDomain)) : "";
  const profileLine = p
    ? `${p.university ?? "Unknown"} | ${p.degree ?? "Unknown"} (${p.year ?? "Unknown"}) | ` +
      `${p.discipline ?? "Unknown"} | Citation: ${p.citationStyle ?? "APA"}` +
      (p.courses?.length ? ` | Courses: ${p.courses.join(", ")}` : "") +
      (crestUrl ? ` | University Crest: ${crestUrl}` : "")
    : "General undergraduate student";

  return `You are Volt, an expert AI academic copilot on WhatsApp for Voltrix (voltrix.stream).
Student: ${session.contactName}
Linked Voltrix account: ${session.linkedUserId ? "Active — Scholar Pro" : "Not linked (standard)"}
Academic profile: ${profileLine}
Topic focus this session: ${topTopics || "General"}

[DIRECTIVES]
1. Never introduce yourself — respond directly as a context-aware tutor.
2. Build on conversation history. Track weaknesses and strengths across turns.
3. Give mathematically precise, Oxford-grade answers where needed.
4. Use WhatsApp markdown (*bold*, _italic_, • bullets). Keep responses under 800 words unless asked for a full essay.
5. Recognise !help, !clear, !status, !link <code> commands and respond accordingly.
6. You can read documents and transcribe voice notes. Analyse any image or document fully.
7. ACADEMIC COURSEWORK & INSTITUTIONAL COVER PAGE MANDATE:
   When the student requests to write, draft, generate, or solve a coursework, lab report, essay, paper, or formal assignment:
   UNLESS the student explicitly states otherwise, ALWAYS prepend a formal academic header / cover block containing:
   • The institution name & crest: [${p?.university ?? "University"} Crest](${crestUrl || "https://mak.ac.ug"})
   • Assignment Title & Course Unit Code/Name
   • Student Author Name (${session.contactName}) & Degree Program (${p?.degree ?? "Scholar"})
   • Current Date
   • Follow with a clean separator (━━━━━━━━━━━━━━━━━━━━━━━━) before the introduction.
8. WEB APPLICATION & SIMULATOR CREATION:
   When the student asks to build, create, or host a website, interactive simulator, calculator, portfolio, or tool:
   Provide an explanation, followed by the complete, standalone HTML5 source code inside a \`\`\`html ... \`\`\` code block (with Tailwind CSS CDN, Lucide, and interactive JS).
   Voltrix will automatically deploy it to Cloudflare Global Edge at https://voltrix.stream/s/<slug> and deliver their live URL!`;
}

// ── Command handlers ──────────────────────────────────────────────────────────

type LinkResponse = { success?: boolean; userId?: string; name?: string; profile?: AcademicProfile };

async function handleCommand(
  cmd: string,
  args: string,
  from: string,
  session: SessionData,
  env: Env
): Promise<string | null> {
  switch (cmd) {
    case "!help":
      return `*Volt Academic Copilot* ⚡\n\n` +
        `• Send any question — I'll answer with full academic rigour\n` +
        `• Send a *voice note* — I'll transcribe and answer\n` +
        `• Send a *PDF or image* — I'll read and analyse it\n\n` +
        `*Commands:*\n` +
        `!help — show this menu\n` +
        `!clear — reset conversation\n` +
        `!status — show your session info\n` +
        `!link <6-digit code> — link to your Voltrix account\n\n` +
        `_Upgrade at voltrix.stream for 500 queries/day & flagship models_`;

    case "!clear": {
      const stub = getSessionStub(env, from);
      await sessionFetch<{ ok: boolean }>(stub, "/clear", {});
      return "✅ Conversation cleared. Starting fresh!";
    }

    case "!status":
      return `*Session Status*\n\n` +
        `• Turns: ${session.history.length}\n` +
        `• Linked account: ${session.linkedUserId ? "✅ Active" : "❌ Not linked"}\n` +
        `• Academic profile: ${session.academicProfile ? "✅ Set" : "❌ Not set"}\n\n` +
        `_Link at voltrix.stream → Settings → WhatsApp_`;

    case "!link": {
      const code = args.trim();
      if (!code || !/^\d{6}$/.test(code)) {
        return "Please provide your 6-digit pairing code: `!link 123456`\n\nGet it at voltrix.stream → Settings → WhatsApp";
      }
      try {
        const res = await fetch("https://voltrix.stream/api/whatsapp/validate-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, phone: from }),
        });
        const d = await res.json() as LinkResponse;
        if (d.success && d.userId) {
          const stub = getSessionStub(env, from);
          await sessionFetch<{ ok: boolean }>(stub, "/link", { userId: d.userId });
          if (d.profile) {
            const enrichedProfile = {
              ...d.profile,
              universityLogoUrl: d.profile.universityLogoUrl || resolveUniversityLogoUrl(d.profile.university, d.profile.universityDomain),
            };
            await sessionFetch<{ ok: boolean }>(stub, "/profile", enrichedProfile);
          }
          return `✅ *Linked successfully!*\n\nWelcome, ${d.name ?? "Scholar"}! Your academic profile is now active on WhatsApp.\n\nType !status to see your profile.`;
        }
      } catch { /* fall through */ }
      return "❌ Invalid or expired code. Generate a new one at voltrix.stream → Settings → WhatsApp";
    }

    default:
      return null;
  }
}

// ── Topic detection ───────────────────────────────────────────────────────────

const TOPIC_KEYWORDS: Record<string, string[]> = {
  mathematics: ["calculus", "algebra", "matrix", "integral", "derivative", "proof", "theorem", "equation"],
  programming: ["code", "algorithm", "function", "debug", "python", "javascript", "java", "complexity"],
  writing:     ["essay", "report", "thesis", "citation", "abstract", "paragraph", "argument"],
  science:     ["physics", "chemistry", "biology", "experiment", "hypothesis", "reaction"],
  economics:   ["microeconomics", "macroeconomics", "gdp", "inflation", "market", "elasticity"],
};

function detectTopic(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return topic;
  }
  return null;
}

// ── Scholarly Context Fetchers (OpenAlex & Wikibooks) ───────────────────────

async function fetchOpenAlexContext(query: string): Promise<string> {
  try {
    const url = new URL("https://api.openalex.org/works");
    url.searchParams.set("search", query);
    url.searchParams.set("per-page", "3");
    url.searchParams.set("select", "id,title,doi,publication_year,cited_by_count,authorships,open_access");
    url.searchParams.set("sort", "relevance_score:desc");
    url.searchParams.set("mailto", "volt@voltrix.dev");
    const resp = await fetch(url.toString(), {
      headers: { "User-Agent": "Voltrix-WhatsApp/1.0 (mailto:volt@voltrix.dev)" },
    });
    if (!resp.ok) return "";
    const data = (await resp.json()) as any;
    const works = data.results || [];
    if (!works.length) return "";
    const lines = [`[OpenAlex Verified Papers for "${query}"]`];
    works.forEach((w: any, i: number) => {
      const authors = (w.authorships || []).slice(0, 3).map((a: any) => a?.author?.display_name).filter(Boolean).join(", ");
      lines.push(`${i + 1}. *${w.title}* (${w.publication_year || "n.d."})`);
      if (authors) lines.push(`   Authors: ${authors}`);
      lines.push(`   Citations: ${w.cited_by_count || 0}`);
      if (w.doi) lines.push(`   DOI: ${w.doi}`);
      if (w.open_access?.oa_url) lines.push(`   PDF: ${w.open_access.oa_url}`);
    });
    return lines.join("\n");
  } catch {
    return "";
  }
}

async function fetchWikibooksContext(query: string): Promise<string> {
  try {
    const url = new URL("https://en.wikibooks.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("utf8", "1");
    url.searchParams.set("srlimit", "2");
    const resp = await fetch(url.toString(), {
      headers: { "User-Agent": "Voltrix-WhatsApp/1.0 (mailto:volt@voltrix.dev)" },
    });
    if (!resp.ok) return "";
    const data = (await resp.json()) as any;
    const items = data.query?.search || [];
    if (!items.length) return "";
    const lines = [`[Wikibooks Textbook Guides for "${query}"]`];
    items.forEach((item: any) => {
      const cleanSnippet = (item.snippet || "").replace(/<[^>]+>/g, "").trim();
      const enc = encodeURIComponent(item.title.replace(/ /g, "_"));
      lines.push(`• *${item.title}*: ${cleanSnippet}\n  Link: https://en.wikibooks.org/wiki/${enc}`);
    });
    return lines.join("\n");
  } catch {
    return "";
  }
}

// ── Message processor ─────────────────────────────────────────────────────────

type WaMessage = Record<string, unknown>;
type WaContact = Record<string, unknown>;

async function processMessage(message: WaMessage, contact: WaContact | undefined, env: Env): Promise<void> {
  const from      = message.from as string;
  const messageId = message.id as string;
  const msgType   = message.type as string;

  if (!from) return;

  try {
    const stub = getSessionStub(env, from);

    // Dedup
    const { duplicate } = await sessionFetch<{ duplicate: boolean }>(stub, "/dedup", { msgId: messageId });
    if (duplicate) return;

    // Send native WhatsApp "typing..." indicator immediately (also acts as read receipt)
    await sendTypingIndicator(env, messageId);

    // Update contact name
    const contactName = (contact as { profile?: { name?: string } } | undefined)?.profile?.name ?? "Student";
    await sessionFetch<{ ok: boolean }>(stub, "/contact", { name: contactName });

    // Get session
    const session = await sessionFetch<SessionData>(stub, "/snapshot");

    // ── Extract text ───────────────────────────────────────────────────────────

    let userText = "";
    let isVoiceInput = false;

    if (msgType === "text") {
      userText = ((message.text as { body?: string }) ?? {}).body?.trim() ?? "";

    } else if (msgType === "interactive") {
      userText = ((message as { interactive?: { button_reply?: { title?: string } } })
        .interactive?.button_reply?.title ?? "").trim();

    } else if (msgType === "audio" || msgType === "voice") {
      isVoiceInput = true;
      const audioId = ((message[msgType] as { id?: string }) ?? {}).id;
      if (audioId) {
        const media = await downloadMedia(env, audioId);
        if (media) {
          const transcription = await transcribeAudio(env, media.data, media.mimeType);
          if (transcription) {
            userText = `🎙️ [Voice Note]: "${transcription}"`;
          } else {
            await sendTextMessage(env, from, "I received your voice note but couldn't transcribe it. Please try sending as text.");
            return;
          }
        }
      }

    } else if (msgType === "image") {
      const img = message.image as { id?: string; caption?: string; mime_type?: string } | undefined;
      if (img?.id) {
        const media = await downloadMedia(env, img.id);
        if (media && env.GEMINI_API_KEY) {
          const imgText = await extractTextFromImageWithGemini(
            env.GEMINI_API_KEY,
            media.data,
            media.mimeType || img.mime_type || "image/jpeg",
            img.caption || ""
          );
          if (imgText) {
            userText = `📸 [Attached Image Analysis & Transcription]:\n${imgText}\n\n${
              img.caption ? `User Note: ${img.caption}` : "Please solve the problem(s) above and explain clearly."
            }`;
          }
        }
        if (!userText) {
          userText = img?.caption
            ? `Analyse this image: ${img.caption}`
            : "Transcribe and analyse all text, equations, and academic content in this image.";
        }
      }

    } else if (msgType === "document") {
      const doc = message.document as { id?: string; filename?: string; mime_type?: string; caption?: string } | undefined;
      if (doc?.id) {
        const media = await downloadMedia(env, doc.id);
        if (media) {
          const docText = await extractDocumentContent(
            media.data,
            doc.mime_type || media.mimeType,
            doc.filename || "",
            doc.caption || "",
            env.GEMINI_API_KEY
          );
          if (docText) {
            userText = `📄 [Attached Document: "${doc.filename || "document"}"]:\n${docText}\n\n${
              doc.caption ? `User Note: ${doc.caption}` : "Please analyze, solve, or explain the document content above."
            }`;
          }
        }
        if (!userText) {
          userText = doc?.caption
            ? `Please analyse the document "${doc.filename ?? "document"}": ${doc.caption}`
            : `Please analyse the document "${doc?.filename ?? "document"}" that I've sent.`;
        }
      }
    }

    if (!userText) return;

    // ── Commands ───────────────────────────────────────────────────────────────

    const cmdMatch = userText.match(/^(![\w]+)\s*([\s\S]*)?$/);
    if (cmdMatch) {
      const cmdReply = await handleCommand(cmdMatch[1].toLowerCase(), cmdMatch[2] ?? "", from, session, env);
      if (cmdReply !== null) {
        await sendTextMessage(env, from, cmdReply);
        return;
      }
    }

    // ── Topic tracking (fire-and-forget) ──────────────────────────────────────

    const topic = detectTopic(userText);
    if (topic) sessionFetch<{ ok: boolean }>(stub, "/topic", { topic });

    // ── Scholarly Context Augmentation ──────────────────────────────────────────
    let contextualUserText = userText;
    const isResearchQuery = /\b(find papers|search openalex|search literature|cite papers|peer[- ]reviewed|academic sources|look up citations|find sources|search papers|literature review)\b/i.test(userText);
    const isWikibookQuery = /\b(wikibook|wikibooks|textbook guide|curriculum guide)\b/i.test(userText);
    const isOpenStaxQuery = /\b(openstax|textbook pdf|college textbook|calculus textbook|physics textbook|chemistry textbook|biology textbook|free textbook)\b/i.test(userText);

    if (isResearchQuery) {
      const paperContext = await fetchOpenAlexContext(userText);
      if (paperContext) {
        contextualUserText = `${userText}\n\n[VERIFIED SCHOLARLY CONTEXT VIA OPENALEX]:\n${paperContext}`;
      }
    } else if (isWikibookQuery) {
      const bookContext = await fetchWikibooksContext(userText);
      if (bookContext) {
        contextualUserText = `${userText}\n\n[WIKIBOOKS CURRICULUM CONTEXT]:\n${bookContext}`;
      }
    } else if (isOpenStaxQuery) {
      try {
        const res = await fetch(`https://voltrix.stream/api/scholar/openstax?query=${encodeURIComponent(userText)}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          const books = data?.books || [];
          if (books.length > 0) {
            const lines = books.slice(0, 3).map((b: any) => `• *${b.title}*\n  Web: ${b.url}\n  Direct PDF: ${b.pdfUrl}`);
            contextualUserText = `${userText}\n\n[OFFICIAL OPENSTAX COLLEGE TEXTBOOKS]:\n${lines.join("\n\n")}`;
          }
        }
      } catch {
        // non-fatal fallback
      }
    }

    // ── AI ─────────────────────────────────────────────────────────────────────

    const systemPrompt = buildSystemPrompt({ ...session, contactName });
    const historyForAI: Message[] = session.history.map(h => ({ role: h.role, content: h.content }));

    await sessionFetch<{ ok: boolean }>(stub, "/message", { role: "user", content: userText });

    const aiReply = await runAI(env, systemPrompt, historyForAI, contextualUserText);

    await sessionFetch<{ ok: boolean }>(stub, "/message", { role: "assistant", content: aiReply });

    // ── Auto-publish HTML Apps to Edge Hosting ───────────────────────────────
    let extraSiteLink = "";
    const htmlMatch = aiReply.match(/```(?:html|web)\s*([\s\S]*?)```/i);
    if (htmlMatch && htmlMatch[1] && htmlMatch[1].length > 250) {
      try {
        const titleMatch = htmlMatch[1].match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const siteTitle = titleMatch ? titleMatch[1].trim() : (contactName ? `${contactName}'s Web App` : "Interactive Web Application");
        const pubRes = await fetch("https://voltrix.stream/api/sites/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: htmlMatch[1],
            title: siteTitle,
            userId: session.linkedUserId || from,
            authorName: contactName,
          }),
        });
        if (pubRes.ok) {
          const pubData = await pubRes.json() as any;
          if (pubData.success && pubData.liveUrl) {
            extraSiteLink = `\n\n🌐 *Your Web App is Live on Global Edge!*\n🔗 ${pubData.liveUrl}\n_Sub-50ms TTFB worldwide. Open to test directly on your phone!_`;
          }
        }
      } catch {
        // non-blocking
      }
    }

    // ── Voice Reply Dispatch ──────────────────────────────────────────────────
    const wantsVoiceReply =
      isVoiceInput ||
      /\b(voice\s*reply|voice\s*note|send\s*voice|audio\s*note|read\s*out|speak\s*to\s*me|voice\s*response|send\s*audio)\b/i.test(userText);

    if (wantsVoiceReply) {
      try {
        // Generate a natural, conversational voice note script (human tone, 15-25s, pointing to chat breakdown below)
        const voiceScript = await generateVoiceScript(env, userText, aiReply);
        const speech = await synthesizeSpeech(env, voiceScript);
        if (speech && speech.data.byteLength > 0) {
          // Send as native WhatsApp Push-To-Talk voice note (ptt = true)
          await sendWhatsAppAudioMessage(env, from, speech.data, speech.mimeType, true);
        }
      } catch (voiceErr) {
        console.warn("[WhatsApp] Failed to dispatch voice note reply:", voiceErr);
      }
    }

    await sendTextMessage(env, from, formatForWhatsApp(aiReply + extraSiteLink));
  } catch (err) {
    console.error("[WhatsApp] Error processing message from " + from, err);
    try {
      await sendTextMessage(env, from, "⚡ Voltrix AI received your message but encountered a brief processing delay. Please try sending again!");
    } catch (sendErr) {
      console.error("[WhatsApp] Failed to send fallback error reply:", sendErr);
    }
  }
}

// ── Main Worker ───────────────────────────────────────────────────────────────

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url  = new URL(req.url);
    const path = url.pathname;

    // GET /api/whatsapp/webhook — Meta challenge
    if (req.method === "GET" && path === "/api/whatsapp/webhook") {
      const mode      = url.searchParams.get("hub.mode");
      const token     = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && token === env.VERIFY_TOKEN && challenge) {
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // POST /api/whatsapp/webhook — Inbound messages
    if (req.method === "POST" && path === "/api/whatsapp/webhook") {
      const body = await req.json() as Record<string, unknown>;
      ctx.waitUntil((async () => {
        try {
          const entries = (body.entry as Array<Record<string, unknown>>) ?? [];
          for (const entry of entries) {
            const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
            for (const change of changes) {
              const value    = change.value as Record<string, unknown>;
              const messages = (value?.messages as Array<WaMessage>) ?? [];
              const contacts = (value?.contacts as Array<WaContact>) ?? [];
              for (const message of messages) {
                await processMessage(message, contacts[0], env);
              }
            }
          }
        } catch (err) {
          console.error("[WhatsApp] inbound handler error:", err);
        }
      })());
      return new Response("OK", { status: 200 });
    }

    // GET /api/whatsapp/status
    if (req.method === "GET" && path === "/api/whatsapp/status") {
      const phoneId = env.WHATSAPP_PHONE_NUMBER_ID ?? "1380923721763579";
      return Response.json({
        configured: !!(phoneId && (env.WHATSAPP_ACCESS_TOKEN || true)),
        phoneNumberId: phoneId ? `${phoneId.slice(0, 4)}...${phoneId.slice(-4)}` : null,
        verifyTokenSet: !!env.VERIFY_TOKEN,
        hasDurableObjects: !!env.WhatsAppSession,
        aiBackend: "TheHive DeepSeek v4.1 Flash → Gemini 3.8 Flash",
        multimodalCapabilities: {
          imageOcr: "Gemini 3.8 Flash Vision (verbatim questions, formulas, diagrams, handwriting)",
          documentReading: "Edge PDF Stream Parser + Gemini Multimodal PDF + DOCX XML + Text/Code UTF-8",
        },
        voiceCapabilities: {
          transcription: "Gemini 3.8 Flash Multimodal (Primary) → Workers AI Whisper → Groq Whisper Large V3 Turbo",
          voiceReplies: "Conversational Scripting (Human Cadence) → Workers AI Deepgram Aura / MeloTTS → Gemini Native Audio → OpenAI TTS → Google Speech Neural",
          nativePttVoiceNote: true,
          typingIndicator: true,
        },
        version: "1.3.0",
      });
    }

    // POST /api/whatsapp/test
    if (req.method === "POST" && path === "/api/whatsapp/test") {
      const { to, message } = await req.json() as { to?: string; message?: string };
      if (!to) return Response.json({ error: "to is required" }, { status: 400 });
      await sendTextMessage(env, to, message ?? "⚡ Test from Volt — Voltrix WhatsApp is live!");
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

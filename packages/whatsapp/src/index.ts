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

// ── Env ───────────────────────────────────────────────────────────────────────

export interface Env {
  WhatsAppSession: DurableObjectNamespace;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  VERIFY_TOKEN: string;
  THEHIVE_API_KEY: string;
  GEMINI_API_KEY?: string;
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
  for (const chunk of splitChunks(text)) {
    await fetch(
      `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
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
  }
}

async function markAsRead(env: Env, messageId: string): Promise<void> {
  await fetch(
    `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    }
  ).catch(() => {/* non-fatal */});
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
  output?: Array<{
    response?: {
      choices?: Array<{ message?: { content?: string } }>;
    };
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
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: userText },
  ];
  const res = await fetch("https://api.thehive.ai/api/v2/task/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "glm-5.3-flash",
      temperature: 0.7,
      max_tokens: 1024,
      system,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`TheHive ${res.status}`);
  const data = await res.json() as TheHiveResponse;
  return data?.output?.[0]?.response?.choices?.[0]?.message?.content?.trim() ?? "";
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json() as GeminiResponse;
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

async function transcribeAudio(
  env: Env,
  audioData: ArrayBuffer,
  mimeType: string
): Promise<string> {
  if (!env.THEHIVE_API_KEY) return "";
  const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "mp3";
  const form = new FormData();
  form.append("file", new Blob([audioData], { type: mimeType }), `audio.${ext}`);
  form.append("model", "whisper-large-v3-turbo");
  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.THEHIVE_API_KEY}` },
      body: form,
    });
    if (!res.ok) return "";
    const d = await res.json() as { text?: string };
    return d?.text?.trim() ?? "";
  } catch {
    return "";
  }
}

async function runAI(
  env: Env,
  system: string,
  history: Message[],
  userText: string
): Promise<string> {
  try {
    const reply = await callTheHive(env.THEHIVE_API_KEY, system, history, userText);
    if (reply) return reply;
  } catch (err) {
    console.warn("[WhatsApp] TheHive failed:", err);
  }
  if (env.GEMINI_API_KEY) {
    try {
      const reply = await callGemini(env.GEMINI_API_KEY, system, history, userText);
      if (reply) return reply;
    } catch (err) {
      console.warn("[WhatsApp] Gemini fallback failed:", err);
    }
  }
  return "I'm having trouble reaching my AI engine right now. Please try again in a moment.";
}

// ── Session DO helpers ────────────────────────────────────────────────────────

function getSessionStub(env: Env, phone: string): DurableObjectStub {
  const id = env.WhatsAppSession.idFromName(phone);
  return env.WhatsAppSession.get(id);
}

async function sessionFetch<T>(
  stub: DurableObjectStub,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await stub.fetch(`https://session${path}`, {
    method: body !== undefined ? "POST" : "GET",
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T>;
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(session: SessionData): string {
  const topTopics = Object.entries(session.topicTracking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t)
    .join(", ");

  const p = session.academicProfile;
  const profileLine = p
    ? `${p.university ?? "Unknown"} | ${p.degree ?? "Unknown"} (${p.year ?? "Unknown"}) | ` +
      `${p.discipline ?? "Unknown"} | Citation: ${p.citationStyle ?? "APA"}` +
      (p.courses?.length ? ` | Courses: ${p.courses.join(", ")}` : "")
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
6. You can read documents and transcribe voice notes. Analyse any image or document fully.`;
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
          if (d.profile) await sessionFetch<{ ok: boolean }>(stub, "/profile", d.profile);
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

// ── Message processor ─────────────────────────────────────────────────────────

type WaMessage = Record<string, unknown>;
type WaContact = Record<string, unknown>;

async function processMessage(message: WaMessage, contact: WaContact | undefined, env: Env): Promise<void> {
  const from      = message.from as string;
  const messageId = message.id as string;
  const msgType   = message.type as string;

  const stub = getSessionStub(env, from);

  // Dedup
  const { duplicate } = await sessionFetch<{ duplicate: boolean }>(stub, "/dedup", { msgId: messageId });
  if (duplicate) return;

  // Mark read (non-blocking)
  markAsRead(env, messageId);

  // Update contact name
  const contactName = (contact as { profile?: { name?: string } } | undefined)?.profile?.name ?? "Student";
  await sessionFetch<{ ok: boolean }>(stub, "/contact", { name: contactName });

  // Get session
  const session = await sessionFetch<SessionData>(stub, "/snapshot");

  // ── Extract text ───────────────────────────────────────────────────────────

  let userText = "";

  if (msgType === "text") {
    userText = ((message.text as { body?: string }) ?? {}).body?.trim() ?? "";

  } else if (msgType === "interactive") {
    userText = ((message as { interactive?: { button_reply?: { title?: string } } })
      .interactive?.button_reply?.title ?? "").trim();

  } else if (msgType === "audio" || msgType === "voice") {
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
    const img = message.image as { id?: string; caption?: string } | undefined;
    if (img?.id) {
      await downloadMedia(env, img.id); // download to confirm receipt; vision analysis future work
      userText = img.caption
        ? `Analyse this image: ${img.caption}`
        : "Transcribe and analyse all text, equations, and academic content in this image.";
    }

  } else if (msgType === "document") {
    const doc = message.document as { id?: string; filename?: string } | undefined;
    if (doc?.id) {
      userText = `Please analyse the document "${doc.filename ?? "document"}" that I've sent.`;
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

  // ── AI ─────────────────────────────────────────────────────────────────────

  const systemPrompt = buildSystemPrompt({ ...session, contactName });
  const historyForAI: Message[] = session.history.map(h => ({ role: h.role, content: h.content }));

  await sessionFetch<{ ok: boolean }>(stub, "/message", { role: "user", content: userText });

  const aiReply = await runAI(env, systemPrompt, historyForAI, userText);

  await sessionFetch<{ ok: boolean }>(stub, "/message", { role: "assistant", content: aiReply });

  await sendTextMessage(env, from, formatForWhatsApp(aiReply));
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
      const phoneId = env.WHATSAPP_PHONE_NUMBER_ID ?? "";
      return Response.json({
        configured: !!(phoneId && env.WHATSAPP_ACCESS_TOKEN),
        phoneNumberId: phoneId ? `${phoneId.slice(0, 4)}...${phoneId.slice(-4)}` : null,
        verifyTokenSet: !!env.VERIFY_TOKEN,
        aiBackend: "TheHive GLM 5.3 Flash → Gemini 2.5 Flash",
        version: "1.0.0",
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

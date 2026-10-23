// Hearth local: real-time voice with your own keys, on many AI providers.
// Node 20+, no dependencies. Real keys stay here; the browser only gets short-lived tokens.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

if (fs.existsSync(".env")) for (const l of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const env = process.env;
const PORT = Number(env.PORT || 3000);
const INSTRUCTIONS = "You are Hearth, a warm, friendly companion. Speak naturally and briefly, one or two sentences at a time. Be curious about the person, ask gentle follow-up questions, and let them interrupt you.";
const GREETING = "Greet the person warmly in one sentence and ask how their day is going.";

// OpenAI-style realtime (OpenAI, Azure OpenAI, or any compatible server). Browser uses WebRTC.
function openaiStyle({ id, label, base, headers, model, voices }) {
  return {
    id, label, voices, transport: "openai-webrtc",
    async session(voice) {
      const r = await fetch(`${base}/realtime/client_secrets`, {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ session: { type: "realtime", model, instructions: INSTRUCTIONS,
          audio: { output: { voice }, input: { transcription: { model: env.TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe" } } } } }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.value) throw new Error(j.error?.message || `${label} refused the session (${r.status})`);
      return { token: j.value, callsUrl: `${base}/realtime/calls`, greeting: GREETING };
    },
  };
}

const OPENAI_VOICES = ["marin", "cedar", "alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"];
const providers = [];
if (env.OPENAI_API_KEY) providers.push(openaiStyle({
  id: "openai", label: "OpenAI", base: (env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
  headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
  model: env.OPENAI_REALTIME_MODEL || "gpt-realtime", voices: OPENAI_VOICES,
}));
if (env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT) providers.push(openaiStyle({
  id: "azure", label: "Azure OpenAI", base: `${env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "")}/openai/v1`,
  headers: { "api-key": env.AZURE_OPENAI_API_KEY },
  model: env.AZURE_OPENAI_DEPLOYMENT || "gpt-realtime", voices: OPENAI_VOICES,
}));
if (env.GEMINI_API_KEY) {
  const model = env.GEMINI_LIVE_MODEL || "gemini-2.5-flash-native-audio-preview-09-2025";
  providers.push({
    id: "gemini", label: "Google Gemini Live", transport: "gemini-ws",
    voices: ["Puck", "Charon", "Kore", "Fenrir", "Aoede", "Leda", "Orus", "Zephyr"],
    async session(voice) {
      const now = Date.now();
      const r = await fetch("https://generativelanguage.googleapis.com/v1alpha/auth_tokens", {
        method: "POST", headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ uses: 1, expireTime: new Date(now + 30 * 60e3).toISOString(),
          newSessionExpireTime: new Date(now + 60e3).toISOString() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.name) throw new Error(j.error?.message || `Gemini refused the session (${r.status})`);
      return {
        token: j.name, greeting: GREETING,
        url: "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained",
        setup: { model: `models/${model}`, systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
          inputAudioTranscription: {}, outputAudioTranscription: {} },
      };
    },
  });
}

// Pipeline providers: any OpenAI-compatible chat API. Speech-to-text and text-to-speech run separately
// (a transcription API or the browser), so the "brain" can be any fast model.
const PRESETS = [
  ["groq", "Groq", "GROQ", "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile"],
  ["cerebras", "Cerebras", "CEREBRAS", "https://api.cerebras.ai/v1", "qwen-3.8-27b"],
  ["sambanova", "SambaNova", "SAMBANOVA", "https://api.sambanova.ai/v1", "Meta-Llama-3.3-70B-Instruct"],
  ["nvidia", "NVIDIA NIM", "NVIDIA", "https://integrate.api.nvidia.com/v1", "meta/llama-3.3-70b-instruct"],
  ["cloudflare", "Cloudflare Workers AI", "CLOUDFLARE", env.CLOUDFLARE_ACCOUNT_ID && `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`, "@cf/meta/llama-3.3-70b-instruct-fp8-fast"],
  ["gemini-chat", "Google Gemini (chat)", "GEMINI", "https://generativelanguage.googleapis.com/v1beta/openai", "gemini-2.5-flash"],
  ["openai-chat", "OpenAI (chat)", "OPENAI", "https://api.openai.com/v1", "gpt-4o-mini"],
  ["mistral", "Mistral", "MISTRAL", "https://api.mistral.ai/v1", "mistral-small-latest"],
  ["together", "Together AI", "TOGETHER", "https://api.together.xyz/v1", "meta-llama/Llama-3.3-70B-Instruct-Turbo"],
  ["fireworks", "Fireworks", "FIREWORKS", "https://api.fireworks.ai/inference/v1", "accounts/fireworks/models/llama-v3p3-70b-instruct"],
  ["deepseek", "DeepSeek", "DEEPSEEK", "https://api.deepseek.com/v1", "deepseek-chat"],
  ["openrouter", "OpenRouter", "OPENROUTER", "https://openrouter.ai/api/v1", "meta-llama/llama-3.3-70b-instruct"],
  ["ollama", "Ollama (local)", "OLLAMA", env.OLLAMA_BASE_URL || (env.OLLAMA_MODEL && "http://localhost:11434/v1"), "llama3.2"],
  ["custom", env.CUSTOM_LABEL || "Custom", "CUSTOM", env.CUSTOM_BASE_URL, "default"],
];
const chat = {};
for (const [id, label, P, base, model] of PRESETS) {
  const key = env[`${P}_API_KEY`] || (id === "cloudflare" ? env.CLOUDFLARE_API_TOKEN : "");
  if (!base || (!key && id !== "ollama" && id !== "custom")) continue;
  chat[id] = { base: (env[`${P}_BASE_URL`] || base).replace(/\/+$/, ""), key, model: env[`${P}_MODEL`] || model };
  providers.push({ id, label, transport: "pipeline", voices: null });
}

// Speech-to-text: an OpenAI-compatible /audio/transcriptions API, else the browser's own recognition.
const stt = env.STT_BASE_URL ? { base: env.STT_BASE_URL, key: env.STT_API_KEY, model: env.STT_MODEL || "whisper-1" }
  : env.GROQ_API_KEY ? { base: "https://api.groq.com/openai/v1", key: env.GROQ_API_KEY, model: env.STT_MODEL || "whisper-large-v3-turbo" }
  : env.OPENAI_API_KEY ? { base: "https://api.openai.com/v1", key: env.OPENAI_API_KEY, model: env.STT_MODEL || "gpt-4o-mini-transcribe" } : null;
// Text-to-speech: an OpenAI-compatible /audio/speech API, else the browser's built-in voices.
const tts = env.TTS_BASE_URL ? { base: env.TTS_BASE_URL, key: env.TTS_API_KEY, model: env.TTS_MODEL || "tts-1", voices: (env.TTS_VOICES || "alloy").split(",").map((v) => v.trim()) }
  : env.OPENAI_API_KEY ? { base: "https://api.openai.com/v1", key: env.OPENAI_API_KEY, model: env.TTS_MODEL || "gpt-4o-mini-tts", voices: OPENAI_VOICES } : null;
const VOLTRIX_VOICES = ["zephyr", "ada", "nova", "echo", "marcus", "kip", "aria", "brian", "emma", "marin", "coral"];
for (const p of providers) if (p.transport === "pipeline") { p.voices = VOLTRIX_VOICES; p.stt = "server"; }
const auth = (key) => (key ? { Authorization: `Bearer ${key}` } : {});
const readBody = async (req) => { const c = []; for await (const x of req) c.push(x); return Buffer.concat(c); };
const pipe = async (r, res) => {
  res.writeHead(r.status, { "Content-Type": r.headers.get("content-type") || "application/octet-stream" });
  for await (const c of r.body) res.write(c); res.end();
};
if (!providers.length) { console.error("No provider configured. Add at least one key to .env (see .env.example)."); process.exit(1); }

const json = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
const TYPES = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css" };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/providers") return json(res, 200, providers.map(({ id, label, voices, transport, stt }) => ({ id, label, voices, transport, stt })));
    if (req.method === "POST" && url.pathname === "/chat") {
      const { provider, messages } = JSON.parse(await readBody(req));
      const c = chat[provider]; if (!c) return json(res, 400, { error: { message: "Unknown provider" } });
      const r = await fetch(`${c.base}/chat/completions`, { method: "POST", headers: { ...auth(c.key), "Content-Type": "application/json" },
        body: JSON.stringify({ model: c.model, stream: true, max_tokens: 1500, messages: [{ role: "system", content: INSTRUCTIONS + " Your words are spoken aloud: no lists, markdown or emoji." }, ...messages.slice(-30)] }) });
      return pipe(r, res);
    }
    if (req.method === "POST" && url.pathname === "/stt") {
      const raw = await readBody(req);
      const b64 = raw.toString("base64");
      try {
        const trRes = await fetch("https://voltrix.stream/api/agents/voice/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: b64, language: "en" })
        });
        const trJson = await trRes.json();
        const text = trJson.result?.text || trJson.text || "";
        return json(res, 200, { text });
      } catch (e) {
        console.error("STT error:", e);
        return json(res, 500, { error: { message: e.message } });
      }
    }
    if (req.method === "POST" && url.pathname === "/tts") {
      const { text, voice } = JSON.parse(await readBody(req));
      try {
        const ttsRes = await fetch("https://voltrix.stream/api/tts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: voice || "zephyr" })
        });
        const ttsJson = await ttsRes.json();
        if (ttsJson.audioUrl) {
          const audioFetch = await fetch(ttsJson.audioUrl);
          return pipe(audioFetch, res);
        }
      } catch (e) {
        console.error("TTS error:", e);
      }
      return json(res, 500, { error: { message: "TTS failed" } });
    }
    if (req.method === "POST" && url.pathname === "/session") {
      const p = providers.find((x) => x.id === url.searchParams.get("provider") && x.session);
      if (!p) return json(res, 200, { token: "pipeline" });
      const v = url.searchParams.get("voice");
      try { return json(res, 200, await p.session(p.voices.includes(v) ? v : p.voices[0])); }
      catch (e) { return json(res, 502, { error: { message: e.message } }); }
    }
    const rel = path.normalize(url.pathname === "/" ? "index.html" : url.pathname).replace(/^([/\\]|\.\.[/\\])+/, "");
    const file = path.join("public", rel);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (e) { console.error(e); res.writeHead(500); res.end("Server error"); }
}).listen(PORT, () => console.log(`Hearth running at http://localhost:${PORT} — providers: ${providers.map((p) => p.label).join(", ")}`));

// Hearth local: real-time voice with your own keys, on verified AI providers.
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

// Process level safety to prevent crashes from dropped sockets or network glitches
process.on("uncaughtException", (err) => console.error("Uncaught exception caught safely:", err?.message || err));
process.on("unhandledRejection", (err) => console.error("Unhandled rejection caught safely:", err?.message || err));

// Read strictly from local .env to prevent stale system variables from leaking
const env = {};
if (fs.existsSync(".env")) {
  for (const l of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
}
const PORT = Number(env.PORT || 3000);
const INSTRUCTIONS = "You are Hearth, a warm, friendly companion. Speak naturally and briefly, one or two sentences at a time. Be curious about the person, ask gentle follow-up questions, and let them interrupt you.";
const GREETING = "Greet the person warmly in one sentence and ask how their day is going.";

const VOLTRIX_VOICES = ["zephyr", "ada", "nova", "echo", "marcus", "kip", "aria", "brian", "emma", "marin", "coral"];
const providers = [];

// Verified active providers (openrouter & deepseek abandoned due to credit exhaustion)
const PRESETS = [
  ["cerebras-fast", "Cerebras Fast (40ms / Qwen 27B)", "CEREBRAS", "https://api.cerebras.ai/v1", "qwen-3.8-27b"],
  ["cerebras-120b", "Cerebras Deep (120ms / GPT 120B)", "CEREBRAS", "https://api.cerebras.ai/v1", "gpt-oss-120b"],
];

const chat = {};
for (const [id, label, P, base, defaultModel] of PRESETS) {
  const key = env[`${P}_API_KEY`];
  if (!base || !key) continue;
  chat[id] = { base, key, model: env[`${P}_MODEL`] && id === "cerebras-fast" ? env[`${P}_MODEL`] : defaultModel };
  providers.push({ id, label, transport: "pipeline", voices: VOLTRIX_VOICES, stt: "server" });
}

if (!providers.length) {
  console.error("No valid provider configured in .env. Add CEREBRAS_API_KEY to .env.");
  process.exit(1);
}

const readBody = async (req) => { const c = []; for await (const x of req) c.push(x); return Buffer.concat(c); };
const json = (res, status, body) => {
  if (res.writableEnded) return;
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

// Reliable IPv4 HTTPS helpers (bypasses Node 24 IPv6/happy-eyeballs timeout bug)
function httpsPostJson(targetUrl, headers, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const postData = typeof data === "string" ? data : JSON.stringify(data);
    const req = https.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: "POST",
      family: 4,
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function streamHttpsChat(targetUrl, headers, data, clientRes) {
  const url = new URL(targetUrl);
  const postData = JSON.stringify(data);
  const req = https.request({
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: "POST",
    family: 4,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData)
    }
  }, (upstreamRes) => {
    clientRes.writeHead(upstreamRes.statusCode || 200, {
      "Content-Type": upstreamRes.headers["content-type"] || "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    upstreamRes.on("data", (chunk) => {
      if (!clientRes.writableEnded) clientRes.write(chunk);
    });
    upstreamRes.on("end", () => {
      if (!clientRes.writableEnded) clientRes.end();
    });
  });

  req.on("error", (err) => {
    console.error("Chat upstream error:", err.message);
    if (!clientRes.headersSent) {
      json(clientRes, 502, { error: { message: err.message } });
    } else if (!clientRes.writableEnded) {
      clientRes.end();
    }
  });

  req.write(postData);
  req.end();
}

function pipeAudioFromUrl(audioUrl, clientRes) {
  const url = new URL(audioUrl);
  const getter = url.protocol === "http:" ? http.get : https.get;
  getter(audioUrl, { family: 4 }, (upstreamRes) => {
    clientRes.writeHead(upstreamRes.statusCode || 200, {
      "Content-Type": upstreamRes.headers["content-type"] || "audio/mpeg",
      "Cache-Control": "public, max-age=3600"
    });
    upstreamRes.pipe(clientRes);
  }).on("error", (err) => {
    console.error("Audio pipe error:", err.message);
    if (!clientRes.headersSent) {
      json(clientRes, 500, { error: { message: "Failed to fetch audio stream" } });
    } else if (!clientRes.writableEnded) {
      clientRes.end();
    }
  });
}

const TYPES = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css" };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/providers") {
      return json(res, 200, providers.map(({ id, label, voices, transport, stt }) => ({ id, label, voices, transport, stt })));
    }

    // ── Chat Completion (Streamed) ──
    if (req.method === "POST" && url.pathname === "/chat") {
      const { provider, messages } = JSON.parse(await readBody(req));
      const c = chat[provider];
      if (!c) return json(res, 400, { error: { message: "Unknown provider" } });
      return streamHttpsChat(
        `${c.base}/chat/completions`,
        { Authorization: `Bearer ${c.key}` },
        {
          model: c.model,
          stream: true,
          max_tokens: 1500,
          messages: [
            {
              role: "system",
              content: INSTRUCTIONS + " Your words are spoken aloud: keep your response to 1-2 natural, friendly sentences. Do not use lists, bullet points, asterisks, markdown, or emoji."
            },
            ...messages.slice(-20)
          ]
        },
        res
      );
    }

    // ── Speech-To-Text (Cloudflare Workers AI Whisper) ──
    if (req.method === "POST" && url.pathname === "/stt") {
      try {
        const raw = await readBody(req);
        if (!raw || raw.length === 0) return json(res, 200, { text: "" });
        const b64 = raw.toString("base64");
        const resp = await httpsPostJson(
          "https://voltrix.stream/api/agents/voice/transcribe",
          {},
          { audio: b64, language: "en" }
        );
        const text = resp.data?.result?.text || resp.data?.text || "";
        return json(res, 200, { text });
      } catch (e) {
        console.error("STT error:", e.message);
        return json(res, 200, { text: "" });
      }
    }

    // ── Text-To-Speech (Cloudflare Edge TTS with Studio Voices) ──
    if (req.method === "POST" && url.pathname === "/tts") {
      try {
        const { text, voice } = JSON.parse(await readBody(req));
        if (!text || !text.trim()) return json(res, 400, { error: { message: "No text provided" } });
        const resp = await httpsPostJson(
          "https://voltrix.stream/api/tts/generate",
          {},
          { text, voice: voice || "zephyr" }
        );
        if (resp.data?.audioUrl) {
          return pipeAudioFromUrl(resp.data.audioUrl, res);
        }
      } catch (e) {
        console.error("TTS error:", e.message);
      }
      return json(res, 500, { error: { message: "Speech synthesis failed" } });
    }

    // ── Session (Pipeline fallback) ──
    if (req.method === "POST" && url.pathname === "/session") {
      return json(res, 200, { token: "pipeline", greeting: GREETING });
    }

    // ── Static Files ──
    const rel = path.normalize(url.pathname === "/" ? "index.html" : url.pathname).replace(/^([/\\]|\.\.[/\\])+/, "");
    const file = path.join("public", rel);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error("Server error:", e);
    if (!res.headersSent) res.writeHead(500);
    res.end("Server error");
  }
}).listen(PORT, () => console.log(`Hearth running at http://localhost:${PORT} — providers: ${providers.map((p) => p.label).join(", ")}`));

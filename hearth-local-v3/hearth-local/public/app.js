let providers = [], provider, voice, call, lines = [];
let currentState = "idle";
let animFrameId = null;

const $ = (id) => document.getElementById(id);
const orbCore = $("orb-core");
const orbAmbient = $("orb-ambient");
const orbHalo = $("orb-halo");
const statusDot = $("status-dot");
const statusText = $("status");

const ORB_THEMES = {
  idle: { color: "#06b6d4", glow: "rgba(6, 182, 212, 0.45)", label: "Ready (Tap Orb or Press Call)" },
  listening: { color: "#10b981", glow: "rgba(16, 185, 129, 0.65)", label: "Listening…" },
  processing: { color: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)", label: "Thinking…" },
  speaking: { color: "#a855f7", glow: "rgba(168, 85, 247, 0.65)", label: "Speaking…" },
  error: { color: "#f43f5e", glow: "rgba(244, 63, 94, 0.5)", label: "Error" },
};

function setOrbState(state, customLabel = null) {
  currentState = state;
  const theme = ORB_THEMES[state] || ORB_THEMES.idle;

  if (orbCore && orbAmbient && statusDot && statusText) {
    orbCore.style.setProperty("--orb", theme.color);
    orbCore.style.setProperty("--glow", theme.glow);
    orbAmbient.style.background = theme.glow;
    statusDot.style.background = theme.color;

    if (state === "listening") {
      statusText.textContent = customLabel || `Listening (${voice})…`;
      orbHalo.style.display = "none";
      orbCore.classList.remove("orb-think");
    } else if (state === "processing") {
      statusText.textContent = customLabel || "Thinking…";
      orbHalo.style.display = "block";
      orbCore.classList.add("orb-think");
    } else if (state === "speaking") {
      statusText.textContent = customLabel || `Speaking (${voice})…`;
      orbHalo.style.display = "none";
      orbCore.classList.remove("orb-think");
    } else if (state === "error") {
      statusText.textContent = customLabel || "Connection error";
      orbHalo.style.display = "none";
      orbCore.classList.remove("orb-think");
    } else {
      statusText.textContent = customLabel || (call ? `Ready (${voice})` : "Ready (Tap Orb or Press Call)");
      orbHalo.style.display = "none";
      orbCore.classList.remove("orb-think");
    }
  }
}

// Visualizer rhythm loop
function startOrbVisualizer() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  function tick() {
    if (currentState === "speaking") {
      const level = 0.2 + 0.3 * Math.abs(Math.sin(Date.now() / 120));
      if (orbCore) orbCore.style.transform = `scale(${1.05 + level * 0.25})`;
    } else if (currentState === "listening") {
      const level = 0.1 + 0.15 * Math.abs(Math.sin(Date.now() / 250));
      if (orbCore) orbCore.style.transform = `scale(${1 + level * 0.2})`;
    } else {
      if (orbCore) orbCore.style.transform = "scale(1.0)";
    }
    animFrameId = requestAnimationFrame(tick);
  }
  tick();
}

fetch("/providers").then((r) => r.json()).then((list) => {
  providers = list;
  for (const p of list) {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.label;
    $("provider").append(o);
  }
  $("provider").onchange = () => { if (!call) pick($("provider").value); };
  const defaultP = list.find(p => p.id === "cerebras") || list[0];
$("provider").value = defaultP.id;
pick(defaultP.id);
});

function pick(id) {
  provider = providers.find((p) => p.id === id);
  $("voices").innerHTML = "";
  const list = provider.voices || (typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en")).map((v) => v.name).slice(0, 16) : ["default"]);
  if (!provider.voices && !list.length && typeof speechSynthesis !== "undefined") {
    speechSynthesis.onvoiceschanged = () => pick(id);
  }
  voice = list[0];
  for (const v of list) {
    const b = document.createElement("button");
    b.textContent = v;
    b.dataset.v = v;
    b.onclick = () => { if (!call) { voice = v; render(); } };
    $("voices").append(b);
  }
  render();
}

function render() {
  document.querySelectorAll(".voices button").forEach((b) => b.className = b.dataset.v === voice ? "on" : "");
  $("provider").disabled = !!call;
}

function add(role, delta) {
  const last = lines[lines.length - 1];
  if (role === "break") { lines.push({ role }); return; }
  if (last && last.role === role) {
    last.text += delta;
    last.el.textContent = last.text;
  } else {
    const el = document.createElement("p");
    el.className = role === "user" ? "you" : "assistant";
    el.textContent = delta;
    $("log").append(el);
    lines.push({ role, text: delta, el });
    $("log").scrollTop = $("log").scrollHeight;
  }
}

async function start() {
  setOrbState("processing", "Connecting…");
  $("log").innerHTML = "";
  lines = [];
  startOrbVisualizer();

  const s = await fetch(`/session?provider=${provider.id}&voice=${encodeURIComponent(voice)}`, { method: "POST" }).then((r) => r.json());
  if (!s.token) throw new Error(s.error?.message || "Could not start session");

  const mod = await import(`./providers/${provider.transport}.js`);
  call = await mod.connect(s, {
    provider,
    voice,
    audio: $("audio"),
    onText: add,
    onStatus: (st, msg) => {
      if (st === "live") {
        setOrbState("listening", `Talking with ${voice} on ${provider.label}`);
      } else if (st === "listening" || st === "processing" || st === "speaking") {
        setOrbState(st, msg);
      } else if (st === "error") {
        setOrbState("error", msg || "Error");
      } else {
        setOrbState("idle", msg);
      }
    }
  });

  $("call").textContent = "End call";
  $("call").classList.add("active");
  render();
}

function stop() {
  call?.stop();
  call = null;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  $("call").textContent = "Call";
  $("call").classList.remove("active");
  setOrbState("idle", "Call ended.");
  render();
}

$("call").onclick = () => call ? stop() : start().catch((e) => { stop(); setOrbState("error", e.message); });

// Click Orb to start, interrupt, or stop
$("orb").onclick = () => {
  if (currentState === "speaking") {
    // Tap to interrupt
    call?.stop();
    start().catch((e) => { stop(); setOrbState("error", e.message); });
  } else if (call) {
    stop();
  } else {
    start().catch((e) => { stop(); setOrbState("error", e.message); });
  }
};

setOrbState("idle");

// Quick text input support
const inputEl = $("text-input");
const sendBtn = $("send-btn");
if (inputEl && sendBtn) {
  const sendTyped = () => {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    if (!call) {
      start().then(() => {
        setTimeout(() => {
          if (call && typeof call.reply === "function") call.reply(text);
        }, 500);
      });
    } else if (call && typeof call.reply === "function") {
      call.reply(text);
    }
  };
  sendBtn.onclick = sendTyped;
  inputEl.onkeydown = (e) => { if (e.key === "Enter") sendTyped(); };
}

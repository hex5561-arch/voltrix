let providers = [], provider, voice, call, lines = [];
const $ = (id) => document.getElementById(id);

fetch("/providers").then((r) => r.json()).then((list) => {
  providers = list;
  for (const p of list) {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.label;
    $("provider").append(o);
  }
  $("provider").onchange = () => { if (!call) pick($("provider").value); };
  pick(list[0].id);
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
  const orb = $("orb");
  if (orb) orb.className = "orb thinking";
  $("status").textContent = "Connecting…";
  $("log").innerHTML = "";
  lines = [];

  const s = await fetch(`/session?provider=${provider.id}&voice=${encodeURIComponent(voice)}`, { method: "POST" }).then((r) => r.json());
  if (!s.token) throw new Error(s.error?.message || "Could not start session");

  const mod = await import(`./providers/${provider.transport}.js`);
  call = await mod.connect(s, {
    provider,
    voice,
    audio: $("audio"),
    onText: add,
    onStatus: (st, msg) => {
      const orb = $("orb");
      if (orb) orb.className = `orb ${st}`;
      if (st === "live" || st === "listening") {
        $("status").textContent = msg || `Listening… (${voice})`;
      } else if (st === "thinking") {
        $("status").textContent = msg || `Thinking…`;
      } else if (st === "speaking") {
        $("status").textContent = msg || `Speaking (${voice})…`;
      } else if (st === "error") {
        $("status").textContent = `Error: ${msg || "unknown"}`;
      } else {
        $("status").textContent = msg || st;
      }
    }
  });

  $("call").textContent = "End call";
  $("call").style.background = "#dc2626";
  render();
}

function stop() {
  call?.stop();
  call = null;
  const orb = $("orb");
  if (orb) orb.className = "orb";
  $("call").textContent = "Call";
  $("call").style.background = "#c2410c";
  $("status").textContent = "Call ended.";
  render();
}

$("call").onclick = () => call ? stop() : start().catch((e) => {
  stop();
  $("status").textContent = "Error: " + e.message;
});

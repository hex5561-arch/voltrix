// Google Gemini Live over WebSocket: 16 kHz PCM up, 24 kHz PCM down.
const WORKLET = `class Mic extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.pos = 0; this.buf = []; }
  process([input]) { const ch = input[0]; if (!ch) return true;
    for (; this.pos < ch.length; this.pos += this.ratio) this.buf.push(ch[Math.floor(this.pos)]);
    this.pos -= ch.length;
    if (this.buf.length >= 1600) { const out = new Int16Array(this.buf.length);
      this.buf.forEach((v, i) => out[i] = Math.max(-1, Math.min(1, v)) * 0x7fff);
      this.port.postMessage(out.buffer, [out.buffer]); this.buf = []; }
    return true; } }
registerProcessor("mic", Mic);`;
const b64 = (buf) => { let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };

export async function connect(s, { onText, onStatus }) {
  const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const ctx = new AudioContext();
  const out = new AudioContext({ sampleRate: 24000 });
  await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" })));
  const node = new AudioWorkletNode(ctx, "mic");
  ctx.createMediaStreamSource(mic).connect(node);
  let playAt = 0; const playing = new Set();
  const ws = new WebSocket(`${s.url}?access_token=${encodeURIComponent(s.token)}`);
  const send = (m) => ws.readyState === 1 && ws.send(JSON.stringify(m));
  const stop = () => { mic.getTracks().forEach((t) => t.stop()); node.disconnect(); ctx.close(); out.close(); if (ws.readyState < 2) ws.close(); };
  await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = () => fail(new Error("Could not reach Gemini")); });
  ws.onclose = (e) => { if (e.code !== 1000) onStatus("error", e.reason || "Gemini closed the call"); };
  send({ setup: s.setup });
  ws.onmessage = async ({ data }) => {
    const e = JSON.parse(typeof data === "string" ? data : await data.text());
    if (e.setupComplete) {
      onStatus("live");
      node.port.onmessage = ({ data }) => send({ realtimeInput: { audio: { data: b64(data), mimeType: "audio/pcm;rate=16000" } } });
      send({ clientContent: { turns: [{ role: "user", parts: [{ text: s.greeting }] }], turnComplete: true } });
    }
    const sc = e.serverContent; if (!sc) return;
    if (sc.inputTranscription?.text) onText("user", sc.inputTranscription.text);
    if (sc.outputTranscription?.text) onText("assistant", sc.outputTranscription.text);
    if (sc.interrupted) { playing.forEach((n) => n.stop()); playing.clear(); playAt = 0; }
    for (const part of sc.modelTurn?.parts || []) {
      if (!part.inlineData?.data) continue;
      const bytes = Uint8Array.from(atob(part.inlineData.data), (c) => c.charCodeAt(0));
      const pcm = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
      const buf = out.createBuffer(1, pcm.length, 24000);
      buf.getChannelData(0).set(Float32Array.from(pcm, (v) => v / 0x8000));
      const src = out.createBufferSource(); src.buffer = buf; src.connect(out.destination);
      playAt = Math.max(playAt, out.currentTime); src.start(playAt); playAt += buf.duration;
      playing.add(src); src.onended = () => playing.delete(src);
    }
  };
  return { stop };
}

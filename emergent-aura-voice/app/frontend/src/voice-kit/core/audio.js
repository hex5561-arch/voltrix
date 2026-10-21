/** Create/resume the AudioContext and play a 1-sample silent buffer (Safari autoplay unlock). Must run synchronously in a click handler. */
export function unlockAudioContext(existing) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = existing || new Ctx();
  if (ctx.state === "suspended") ctx.resume();
  const buffer = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start(0);
  return ctx;
}

export function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export async function audioUrlToArrayBuffer(url) {
  if (url.startsWith("data:")) return base64ToArrayBuffer(url.slice(url.indexOf(",") + 1));
  const res = await fetch(url);
  return res.arrayBuffer();
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function decodeAudio(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(arrayBuffer, resolve, reject);
    if (p && p.then) p.then(resolve, reject);
  });
}

/** RMS of time-domain samples scaled to 0..1. */
export function rmsLevel(samples, gain = 4) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.min(1, Math.sqrt(sum / (samples.length || 1)) * gain);
}

export function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return options.find((m) => MediaRecorder.isTypeSupported?.(m)) || "";
}

export function peaksFromBuffer(buffer, bars = 140) {
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / bars));
  return Array.from({ length: bars }, (_, i) => {
    let max = 0;
    for (let j = i * step; j < Math.min(data.length, (i + 1) * step); j++) max = Math.max(max, Math.abs(data[j]));
    return max;
  });
}

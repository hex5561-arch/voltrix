import { blobToBase64, pickRecorderMime } from "./audio";

/**
 * Records one utterance with MediaRecorder, streaming 250ms chunks through `send(b64, mime)`.
 * `onDone({ discard, allSent, mime, chunks })` fires after the last chunk has been flushed.
 */
export class UtteranceRecorder {
  constructor(stream, { send, onDone }) {
    this.stream = stream;
    this.send = send;
    this.onDone = onDone;
    this.rec = null;
  }

  get recording() {
    return this.rec?.state === "recording";
  }

  start() {
    if (!this.stream || typeof MediaRecorder === "undefined" || this.recording) return;
    const preferred = pickRecorderMime();
    const rec = new MediaRecorder(this.stream, preferred ? { mimeType: preferred } : undefined);
    const run = { chunks: [], chain: Promise.resolve(), allSent: true, discard: false };
    rec.ondataavailable = (e) => {
      if (!e.data?.size) return;
      run.chunks.push(e.data);
      const blob = e.data;
      run.chain = run.chain
        .then(async () => {
          const data = await blobToBase64(blob);
          if (!run.discard && !this.send(data, rec.mimeType)) run.allSent = false;
        })
        .catch((err) => {
          run.allSent = false;
          console.warn("[voice-kit] failed to encode audio chunk", err);
        });
    };
    rec.onstop = () =>
      run.chain.then(() =>
        this.onDone({ discard: run.discard, allSent: run.allSent, mime: rec.mimeType || preferred || "audio/webm", chunks: run.chunks }),
      );
    rec.start(250);
    this.rec = rec;
    this.run = run;
  }

  stop(discard) {
    if (!this.rec || this.rec.state === "inactive") return;
    this.run.discard = discard;
    this.rec.stop();
  }
}

import { AudioTurnQueue } from "./audioQueue";
import { audioUrlToArrayBuffer, decodeAudio, unlockAudioContext } from "./audio";

const asUrl = (src) => (src.startsWith("data:") || src.startsWith("http") ? src : `data:audio/mpeg;base64,${src}`);

/** Plays sentence audio in arrival order; barge-in invalidates a turn so late packets are dropped. */
export class TurnAudioPlayer {
  constructor({ onStart, onIdle } = {}) {
    this.queue = new AudioTurnQueue();
    this.playing = null;
    this.ctx = null;
    this.onStart = onStart;
    this.onIdle = onIdle;
  }

  unlock() {
    this.ctx = unlockAudioContext(this.ctx);
    return this.ctx;
  }

  get busy() {
    return Boolean(this.playing) || !this.queue.isEmpty;
  }

  isStale(turnId) {
    return this.queue.isStale(turnId);
  }

  enqueue(turnId, chunkIndex, source) {
    if (this.queue.isStale(turnId)) return false;
    const ctx = this.ctx || this.unlock();
    const buffer = audioUrlToArrayBuffer(asUrl(source)).then((ab) => decodeAudio(ctx, ab));
    if (!this.queue.enqueue({ turnId, chunkIndex, buffer })) return false;
    this.playNext();
    return true;
  }

  async playNext() {
    if (this.playing) return;
    const item = this.queue.shift();
    if (!item) {
      this.onIdle?.();
      return;
    }
    this.playing = item;
    let buffer = null;
    try {
      buffer = await item.buffer;
    } catch (e) {
      console.warn("[voice-kit] could not decode sentence audio", e);
    }
    if (this.playing !== item || this.queue.isStale(item.turnId) || !buffer) {
      if (this.playing === item) this.playing = null;
      this.playNext();
      return;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.ctx.destination);
    item.source = src;
    src.onended = () => {
      if (this.playing !== item) return;
      this.playing = null;
      this.playNext();
    };
    this.onStart?.(item);
    src.start();
  }

  stop() {
    const source = this.playing?.source;
    this.playing = null;
    if (!source) return;
    try {
      source.stop();
    } catch (e) {
      if (e?.name !== "InvalidStateError") console.warn("[voice-kit] failed to stop playback", e);
    }
  }

  /** Barge-in: drop everything for `turnId` and older. */
  interrupt(turnId) {
    this.queue.invalidate(turnId);
    this.clear();
  }

  clear() {
    this.queue.clear();
    this.stop();
  }
}

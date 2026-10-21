import { BARGE_IN_HOLD_MS, BARGE_IN_THRESHOLD, MIN_SPEECH_MS, SILENCE_MS, SPEECH_THRESHOLD } from "./protocol";

/**
 * Pure level-driven VAD. `update()` returns one event per frame:
 * "barge_in" | "speech_start" | "speech_end" | "speech_discard" | null
 */
export class VoiceActivityDetector {
  constructor({
    speech = SPEECH_THRESHOLD, bargeIn = BARGE_IN_THRESHOLD, bargeHoldMs = BARGE_IN_HOLD_MS,
    silenceMs = SILENCE_MS, minSpeechMs = MIN_SPEECH_MS,
  } = {}) {
    Object.assign(this, { speech, bargeIn, bargeHoldMs, silenceMs, minSpeechMs });
    this.reset();
  }

  reset() {
    this.speaking = false;
    this.start = 0;
    this.lastVoice = 0;
    this.bargeSince = 0;
  }

  update(level, now, { mode, muted = false, bargeInEnabled = true }) {
    if (mode === "speaking" && bargeInEnabled && !muted) {
      if (level <= this.bargeIn) this.bargeSince = 0;
      else if (!this.bargeSince) this.bargeSince = now;
      else if (now - this.bargeSince > this.bargeHoldMs) {
        this.bargeSince = 0;
        return "barge_in";
      }
    }
    if (mode !== "listening" || muted) {
      if (!this.speaking) return null;
      this.speaking = false;
      return "speech_discard";
    }
    if (level > this.speech) {
      this.lastVoice = now;
      if (this.speaking) return null;
      this.speaking = true;
      this.start = now;
      return "speech_start";
    }
    if (!this.speaking || now - this.lastVoice <= this.silenceMs) return null;
    this.speaking = false;
    return this.lastVoice - this.start < this.minSpeechMs ? "speech_discard" : "speech_end";
  }
}

/**
 * voiceService.ts — Volt High-Fidelity TTS & Audio Engine
 * Ported from coursehero. Edge TTS path removed (no /api/tts in Voltrix OS);
 * falls straight through to Web Speech API.
 */

// ── LaTeX & STEM Math → Spoken English ───────────────────────────────────────

export function normalizeLatexForSpeech(text = ''): string {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  s = s.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const n = code.trim().split('\n').length;
    return ` [Code block: ${n} lines of ${lang ? lang.toUpperCase() : 'code'} implementation] `;
  });
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/!\[(.*?)\]\(.*?\)/g, '$1');
  s = s.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  s = s.replace(/\[\d+(?:,\s*\d+)*\]/g, '');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/_([^_]+)_/g, '$1');
  s = s.replace(/~~([^~]+)~~/g, '$1');
  s = s.replace(/^>\s+/gm, '');
  s = s.replace(/^[\*\-+]\s+/gm, ' ');
  s = s.replace(/^\d+\.\s+/gm, ' ');

  s = s
    .replace(/\\approx/g, ' is approximately ')
    .replace(/\\neq/g, ' is not equal to ')
    .replace(/\\leq/g, ' is less than or equal to ')
    .replace(/\\geq/g, ' is greater than or equal to ')
    .replace(/\\equiv/g, ' is identical to ')
    .replace(/\\pm/g, ' plus or minus ')
    .replace(/\\times/g, ' multiplied by ')
    .replace(/\\div/g, ' divided by ')
    .replace(/\\cdot/g, ' times ');

  s = s.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, 'integral from $1 to $2 of ');
  s = s.replace(/\\int/g, 'integral of ');
  s = s.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, 'sum from $1 to $2 of ');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1');
  s = s.replace(/\\partial/g, 'partial ');
  s = s.replace(/\\infty/g, 'infinity');
  s = s.replace(/([a-zA-Z0-9\)])\^2\b/g, '$1 squared');
  s = s.replace(/([a-zA-Z0-9\)])\^3\b/g, '$1 cubed');
  s = s.replace(/([a-zA-Z0-9\)])\^\{([^}]+)\}/g, '$1 to the power of $2');
  s = s.replace(/([a-zA-Z0-9\)])_\{([^}]+)\}/g, '$1 sub $2');

  const greek: Record<string, string> = {
    '\\alpha': 'alpha', '\\beta': 'beta', '\\gamma': 'gamma', '\\delta': 'delta',
    '\\theta': 'theta', '\\lambda': 'lambda', '\\mu': 'mu', '\\pi': 'pi',
    '\\sigma': 'sigma', '\\phi': 'phi', '\\omega': 'omega', '\\Sigma': 'Sigma',
  };
  for (const [tex, ph] of Object.entries(greek)) {
    s = s.split(tex).join(` ${ph} `);
  }

  s = s.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  s = s.replace(/\$([^$]+)\$/g, '$1');
  s = s.replace(/\\mathbf\{([^}]+)\}/g, '$1');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\[a-zA-Z]+/g, ' ');
  s = s.replace(/[\{\}]/g, '').replace(/\s+/g, ' ').trim();
  return s;
}

export function splitTextIntoSentences(text = ''): string[] {
  const cleaned = normalizeLatexForSpeech(text);
  if (!cleaned) return [];
  const raw = cleaned.match(/[^.!?:\n]+[.!?:\n]+/g) ?? [cleaned];
  const out: string[] = [];
  for (const s of raw) {
    const t = s.trim();
    if (!t) continue;
    if (t.length > 160) {
      const parts = t.split(/([,;]\s+)/);
      let buf = '';
      for (const p of parts) {
        if ((buf + p).length > 160 && buf.length > 30) { out.push(buf.trim()); buf = p; }
        else buf += p;
      }
      if (buf.trim()) out.push(buf.trim());
    } else {
      out.push(t);
    }
  }
  return out.length ? out : [cleaned];
}

// ── Voice Settings ─────────────────────────────────────────────────────────

const SETTINGS_KEY = 'voltrix_voice_settings';
interface VoiceSettings { voiceUri: string; rate: number; pitch: number; volume: number; }
const DEFAULTS: VoiceSettings = { voiceUri: '', rate: 1.0, pitch: 1.0, volume: 1.0 };

function loadSettings(): VoiceSettings {
  try { const s = localStorage.getItem(SETTINGS_KEY); return s ? { ...DEFAULTS, ...JSON.parse(s) } : DEFAULTS; }
  catch { return DEFAULTS; }
}
function saveSettings(s: Partial<VoiceSettings>): VoiceSettings {
  const merged = { ...loadSettings(), ...s };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged)); } catch { /* ok */ }
  return merged;
}

// ── VoiceState ────────────────────────────────────────────────────────────

export interface VoiceState {
  isPlaying: boolean;
  isPaused: boolean;
  title: string;
  currentSentence: string;
}
type VoiceListener = (state: VoiceState) => void;

// ── VoiceController ───────────────────────────────────────────────────────

class VoiceController {
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private voices: SpeechSynthesisVoice[] = [];
  private queue: string[] = [];
  private idx = 0;
  private title = '';
  private _isPlaying = false;
  private _isPaused = false;
  private listeners = new Set<VoiceListener>();
  private settings: VoiceSettings = loadSettings();
  private keepAlive: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
      if (typeof window !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => { this.voices = this.synth?.getVoices() ?? []; };
      }
    }
  }

  get isPlaying() { return this._isPlaying; }
  get isPaused()  { return this._isPaused; }

  subscribe(cb: VoiceListener): () => void {
    this.listeners.add(cb);
    cb(this.state());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const s = this.state();
    this.listeners.forEach(cb => { try { cb(s); } catch { /* ok */ } });
  }

  state(): VoiceState {
    return { isPlaying: this._isPlaying, isPaused: this._isPaused, title: this.title, currentSentence: this.queue[this.idx] ?? '' };
  }

  private bestVoice(): SpeechSynthesisVoice | null {
    const vs = this.voices.length ? this.voices : (this.synth?.getVoices() ?? []);
    if (!vs.length) return null;
    if (this.settings.voiceUri) { const m = vs.find(v => v.voiceURI === this.settings.voiceUri); if (m) return m; }
    return vs.find(v => (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Samantha')) && v.lang.startsWith('en'))
      ?? vs.find(v => v.lang.startsWith('en')) ?? vs[0];
  }

  async speak(text: string, title = '', opts: Partial<VoiceSettings> = {}): Promise<void> {
    this.stop();
    const sentences = splitTextIntoSentences(text);
    if (!sentences.length) return;
    this.queue = sentences; this.idx = 0; this.title = title;
    this._isPlaying = true; this._isPaused = false;
    if (opts.rate)  this.settings.rate  = opts.rate;
    if (opts.pitch) this.settings.pitch = opts.pitch;
    this.notify();
    this.speakChunk();
  }

  private speakChunk() {
    if (!this.synth || !this._isPlaying || this.idx >= this.queue.length) { this.finish(); return; }
    const text = this.queue[this.idx];
    if (!text?.trim()) { this.idx++; this.speakChunk(); return; }
    const utt = new SpeechSynthesisUtterance(text);
    const v = this.bestVoice(); if (v) utt.voice = v;
    utt.rate = this.settings.rate; utt.pitch = this.settings.pitch; utt.volume = this.settings.volume;
    let started = false;
    utt.onstart = () => { started = true; this.startKeepAlive(); this.notify(); };
    utt.onend   = () => { this.stopKeepAlive(); if (this._isPlaying && !this._isPaused) { this.idx++; this.speakChunk(); } };
    utt.onerror = (e) => { this.stopKeepAlive(); if (e.error !== 'canceled' && e.error !== 'interrupted') { this.idx++; this.speakChunk(); } };
    if (this.synth.paused) this.synth.resume();
    this.synth.speak(utt);
    this.notify();
    setTimeout(() => { if (!started && this._isPlaying && !this._isPaused) this.finish(); }, 750);
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAlive = setInterval(() => { if (this.synth && this._isPlaying && !this._isPaused) { try { this.synth.pause(); this.synth.resume(); } catch { /* ok */ } } }, 10000);
  }
  private stopKeepAlive() { if (this.keepAlive) { clearInterval(this.keepAlive); this.keepAlive = null; } }
  private finish() { this.stopKeepAlive(); this._isPlaying = false; this._isPaused = false; this.idx = 0; this.notify(); }

  stop() { this.stopKeepAlive(); this.synth?.cancel(); this._isPlaying = false; this._isPaused = false; this.notify(); }
  pause() { if (this.synth && this._isPlaying && !this._isPaused) { this.synth.pause(); this._isPaused = true; this.stopKeepAlive(); this.notify(); } }
  resume() { if (this.synth && this._isPaused) { this.synth.resume(); this._isPaused = false; this.startKeepAlive(); this.notify(); } }
  setRate(r: number)  { this.settings = saveSettings({ rate: r }); }
  setPitch(p: number) { this.settings = saveSettings({ pitch: p }); }
}

export const voiceService = new VoiceController();

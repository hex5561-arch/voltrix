/** Default backend origin; override per <VoiceProvider baseUrl>. */
export const DEFAULT_BASE_URL = process.env.REACT_APP_BACKEND_URL || (typeof window !== "undefined" ? window.location.origin : "");

export const BARGE_IN_THRESHOLD = 0.28;
export const BARGE_IN_HOLD_MS = 140;
export const SPEECH_THRESHOLD = 0.09;
export const SILENCE_MS = 850;
export const MIN_SPEECH_MS = 280;

export const PERSONAS = [
  { id: "zephyr", label: "Zephyr", voice: "nova", tone: "Bright and upbeat" },
  { id: "orion", label: "Orion", voice: "onyx", tone: "Deep and assured" },
  { id: "sage", label: "Sage", voice: "sage", tone: "Calm and measured" },
  { id: "coral", label: "Coral", voice: "coral", tone: "Warm and friendly" },
  { id: "echo", label: "Echo", voice: "echo", tone: "Smooth and even" },
];

export const STATUS_META = {
  idle: { label: "Idle", color: "#a1a1aa", glow: "rgba(161,161,170,0.22)" },
  connecting: { label: "Connecting", color: "#eab308", glow: "rgba(234,179,8,0.42)" },
  listening: { label: "Listening", color: "#06b6d4", glow: "rgba(6,182,212,0.6)" },
  processing: { label: "Thinking", color: "#8b5cf6", glow: "rgba(139,92,246,0.6)" },
  speaking: { label: "Speaking", color: "#10b981", glow: "rgba(16,185,129,0.7)" },
  error: { label: "Error", color: "#f43f5e", glow: "rgba(244,63,94,0.6)" },
};

const trim = (u) => (u || DEFAULT_BASE_URL).replace(/\/+$/, "");

export function wsUrl(baseUrl, sessionId) {
  return `${trim(baseUrl).replace(/^http/, "ws")}/api/agents/voice?sessionId=${encodeURIComponent(sessionId)}`;
}

export function apiUrl(baseUrl, path) {
  return `${trim(baseUrl)}/api${path}`;
}

/** Converts a host-app tools map into wire specs for `register_tools`. */
export function toolSpecs(tools) {
  return Object.entries(tools || {}).map(([name, t]) => ({
    name,
    description: t.description || "",
    parameters: t.parameters || { type: "object", properties: {} },
  }));
}

export function reconnectDelay(attempt) {
  return Math.min(10000, 1000 * 1.5 ** attempt) + Math.random() * 500;
}

/** Upserts a `tool_status` event into the recent-events list. */
export function mergeToolEvent(events, msg, limit = 12) {
  const prev = events.find((e) => e.callId === msg.callId) || {};
  return [...events.filter((e) => e.callId !== msg.callId), { ...prev, ...msg, at: Date.now() }].slice(-limit);
}

export function getSessionId() {
  const key = "voice-session-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `vs-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

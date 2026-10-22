# Hercules prompt — "Voltrix Voice Orb" (copy everything below the line)

---

Build a **frontend-only** real-time voice conversation app called **Voltrix Voice**. Do NOT use Convex tables, auth, or any backend functions. All conversation logic lives on an external **Cloudflare Agents SDK** WebSocket (a Durable Object `VoiceAgent`), which I already run. Your job is a polished UI plus a clean, self-contained voice module I can paste into my own React app.

## 1. Stack
React 19 + Vite + TypeScript + Tailwind + framer-motion + lucide-react. Dark theme only (bg `#05050a`). Single page, no routing.

## 2. File layout (keep exactly, so it is easy to lift out)
```
src/voice/
  config.ts          // VOICE_BASE_URL, PERSONAS, STATUS_META, thresholds
  protocol.ts        // wsUrl(), message types, reconnectDelay()
  useVoiceAgent.ts   // the hook: socket + mic + VAD + audio playback
  mockServer.ts      // offline demo fallback (see §6)
  VoiceOrb.tsx       // the orb (pure presentational)
  VoicePanel.tsx     // orb + status + persona picker + transcript + controls
src/App.tsx          // renders <VoicePanel baseUrl={VOICE_BASE_URL} />
```
`VoicePanel` takes only `{ baseUrl?: string; sessionId?: string; onTranscript?(m): void }`. No other app imports from `src/voice/*`.

## 3. The Orb (centerpiece — make it beautiful)
A large (≈260px, responsive down to 180px) **luminous glass orb**, pure CSS/SVG + framer-motion, no WebGL:
- Layers: soft outer glow (box-shadow in the status color), a radial-gradient core, two slowly counter-rotating conic-gradient "aurora" layers (blur 24px, mix-blend screen), a thin specular highlight arc on the upper left, and 3 expanding ripple rings when speaking.
- It is driven by `level` (0–1 audio amplitude, updated ~60fps via an `AnalyserNode`, NOT React state — use a ref + `useMotionValue`/`requestAnimationFrame` to set `scale` and glow opacity).
- States (color + motion): `idle` grey, slow breathing (scale 1→1.03, 6s) · `connecting` amber, spinning dashed ring · `listening` cyan, scale follows mic level · `processing` violet, aurora spins fast + shimmer · `speaking` emerald, scale follows playback level + ripples · `error` rose, one shake.
- Tap/click the orb = start/stop the conversation. Keyboard: Space toggles. `aria-label` reflects state.
Status colors: idle `#a1a1aa`, connecting `#eab308`, listening `#06b6d4`, processing `#8b5cf6`, speaking `#10b981`, error `#f43f5e`.

## 4. VoicePanel UI
- Orb centered; under it a status pill (dot + label) and a one-line live caption (latest partial transcript).
- Persona picker (chips): zephyr "Bright and upbeat", orion "Deep and assured", sage "Calm and measured", coral "Warm and friendly", echo "Smooth and even". Selecting sends `set_voice`.
- Bottom: ChatGPT-style floating pill (no enclosure/background band): `+`-less, just a text input "Type instead…", a mic toggle, and a send arrow. Enter sends `user_text`. Show a tiny monospace line under it: `{turns} turns · {latencyMs} ms`.
- Collapsible transcript drawer (user bubbles right, assistant left, auto-scroll). "Clear" sends `clear_history`.
- A visible **Interrupt** button while `speaking`. Mobile-first: on ≤640px the pill's input takes its own row.

## 5. Wire protocol (implement exactly — this is my existing server)
Socket URL: `${VOICE_BASE_URL.replace(/^http/, "ws")}/api/agents/voice?sessionId=${sessionId}`
`sessionId` = `localStorage["voice-session-id"]` or generate `vs-xxxxxxxx`. Reconnect with `min(10000, 1000*1.5**attempt)+rand(500)` ms. Send `{"type":"ping"}` every 25s.

**Client → server (JSON text frames):**
| type | fields | when |
|---|---|---|
| `user_text` | `text` | typed message |
| `audio_start` | – | VAD detects speech begin |
| `audio_chunk` | `data` (base64 16-bit PCM mono 16 kHz) | every ~100ms while speaking |
| `audio_end` | – | VAD silence ≥ 850 ms (min speech 280 ms) |
| `set_voice` | `voice` (persona id) | persona change & on open |
| `interrupt` | – | barge-in (mic level > 0.28 for 140 ms while speaking) or button |
| `clear_history`, `get_state`, `get_personas`, `ping` | – | utility |

**Server → client:**
| type | fields | UI effect |
|---|---|---|
| `voice_status` / `voice_state` | `status`: idle\|listening\|thinking\|speaking | set orb state (`thinking`→processing) |
| `transcript` | `role` user\|assistant, `text` | append to transcript + caption |
| `speech_ready` | `format`, `sampleRate` | prepare playback |
| `audio_chunk_stream` | `data` (base64 audio), `final?` | enqueue to gapless Web Audio queue; feed the playback `AnalyserNode` for orb level |
| `audio_started`, `audio_ack` | – | ignore |
| `voice_changed` | `voice`, `persona` | highlight chip |
| `interrupted` | – | flush playback queue immediately |
| `transcripts_cleared` | – | clear UI |
| `personas_list`, `voice_agent_sync`, `pong` | – | hydrate / ignore |

Playback: decode each chunk with `AudioContext.decodeAudioData` (fall back to raw PCM16 @ `sampleRate`), schedule back-to-back using a running `nextTime`, connect through an `AnalyserNode` (fftSize 256) to compute `level`. Mic: `getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})` + `AudioWorklet` (or ScriptProcessor fallback) to 16 kHz PCM16; simple RMS VAD with `SPEECH_THRESHOLD = 0.09`.

## 6. Preview-friendly offline mode (important)
My server is not reachable from the Hercules preview, so `mockServer.ts` must expose the same interface as a WebSocket (`send`, `onmessage`, `onopen`, `close`). If the real socket fails to open within 4s, or `VOICE_BASE_URL` is empty, fall back to the mock automatically and show a small "Demo mode" badge. The mock: on `user_text`/`audio_end` emit `voice_status thinking` → `transcript` (echo-style reply after 700ms) → `voice_status speaking` for ~2.5s while synthesizing a sine-swell into the playback analyser (so the orb really animates) → `idle`.

## 7. Config
`config.ts`: `export const VOICE_BASE_URL = import.meta.env.VITE_VOICE_BASE_URL ?? "https://voltrix.stream";` — one constant to change.

## 8. Quality bar
Strict TypeScript, no `any` in `src/voice/`. Orb renders at 60fps without re-rendering React per frame. Clean up streams/contexts/sockets on unmount. Handle mic-permission denial with an inline message and keep the text input usable. Add a short `src/voice/README.md` documenting props and the protocol table. Do not add any dependencies beyond the stack in §1.

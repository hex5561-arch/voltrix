# Hearth — local version (bring your own provider)

A real-time voice companion that runs on whichever AI services you have keys for.
You don't need Lovable or any packages.

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and fill in keys for any providers.
3. Run `npm start`, then open http://localhost:3000 in Chrome or Edge.
4. Pick a provider and voice, press Call, allow the microphone, and talk. Talk over it to interrupt.

## Two kinds of providers
- **Speech-to-speech** (OpenAI Realtime, Gemini Live, Azure OpenAI): the model hears and speaks itself. Lowest delay.
- **Chat models** (Groq, Cerebras, SambaNova, NVIDIA NIM, Cloudflare Workers AI, Gemini, OpenAI,
  Mistral, Together, Fireworks, DeepSeek, OpenRouter, Ollama, or any OpenAI-compatible server):
  Hearth transcribes you, streams the reply, and speaks it sentence by sentence.
  - Hearing: Groq Whisper (if you set a Groq key), else OpenAI, else Chrome's built-in recognition.
  - Speaking: OpenAI voices (if you set an OpenAI key), else your browser's built-in voices,
    or any OpenAI-compatible speech server via `TTS_BASE_URL`.

Your keys stay on the local server. The browser never sees them.

## Adding another provider
For an OpenAI-compatible chat API, add one line to `PRESETS` in `server.mjs` or use the `CUSTOM_*` settings.
For a new speech-to-speech protocol, add `public/providers/<name>.js` that exports
`connect(session, { audio, provider, voice, onText, onStatus })`, which returns `{ stop }`.

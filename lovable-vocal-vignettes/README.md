# Vocal Vignettes (Lovable) — extracted 2026-10-22
Source: https://vocal-vignettes.lovable.app/ (project lovp_3dcvvgy7xm8g9vrm1qcrmghhqn). No source map; decompiled from minified bundle.
- raw/ original index.html, JS, CSS · full/ prettier-formatted bundles
- routes-*.formatted.js: app code. Voice client = functions `v` (React hook useLive) and `y` (WebRTC session) ~lines 150-500, voice list `b` (marin, gleam, meridian, vesper, willow, stone, quartz...), transcript events `session.input_transcript.delta` / `session.output_transcript.delta`.
## Transport
WebRTC (RTCPeerConnection + data channel "oai-events", OpenAI-Realtime style) with WebSocket signaling to `/api/live`:
client->server `app.start {sdp, voice}`, `app.ready`, `gateway.heartbeat`, `session.close`;
server->client `gateway.session.created {transport:{type:"webrtc", sdp}}`, `session.started`, `gateway.heartbeat.ack`, `gateway.session.closing`, `session.closed {usage.seconds}`, `gateway.error`.
The `/api/live` gateway is Lovable-hosted server code and is NOT in the bundle.

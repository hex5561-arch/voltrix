// OpenAI-style realtime over WebRTC (OpenAI, Azure OpenAI, compatible servers).
export async function connect(s, { audio, onText, onStatus }) {
  const pc = new RTCPeerConnection();
  pc.ontrack = (e) => { audio.srcObject = e.streams[0]; };
  const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
  mic.getTracks().forEach((t) => pc.addTrack(t, mic));
  const dc = pc.createDataChannel("oai-events");
  dc.onopen = () => { onStatus("live"); dc.send(JSON.stringify({ type: "response.create", response: { instructions: s.greeting } })); };
  dc.onmessage = ({ data }) => {
    const e = JSON.parse(data);
    if (e.type === "response.output_audio_transcript.delta") onText("assistant", e.delta);
    if (e.type === "conversation.item.input_audio_transcription.delta") onText("user", e.delta);
    if (e.type === "error") onStatus("error", e.error?.message);
  };
  await pc.setLocalDescription(await pc.createOffer());
  const r = await fetch(s.callsUrl, { method: "POST", body: pc.localDescription.sdp, headers: { Authorization: `Bearer ${s.token}`, "Content-Type": "application/sdp" } });
  if (!r.ok) { mic.getTracks().forEach((t) => t.stop()); pc.close(); throw new Error(await r.text()); }
  await pc.setRemoteDescription({ type: "answer", sdp: await r.text() });
  return { stop() { mic.getTracks().forEach((t) => t.stop()); pc.close(); } };
}

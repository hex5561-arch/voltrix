import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { apiUrl, mergeToolEvent, toolSpecs, wsUrl } from "./core/protocol";
import { blobToBase64, rmsLevel, unlockAudioContext } from "./core/audio";
import { TurnAudioPlayer } from "./core/player";
import { VoiceActivityDetector } from "./core/vad";
import { UtteranceRecorder } from "./core/recorder";
import { ReconnectingSocket } from "./core/socket";
import { useBrowserCaptions } from "./hooks/useBrowserCaptions";

const WHISPER_PRIORITY_MS = 1200;

async function runTool(tools, msg) {
  const tool = tools?.[msg.name];
  try {
    if (!tool?.handler) throw new Error(`No handler for ${msg.name}`);
    return { result: (await tool.handler(msg.arguments || {})) ?? { ok: true } };
  } catch (e) {
    return { error: e?.message || String(e) };
  }
}

/** idle -> connecting -> listening -> processing -> speaking -> (listening) | error */
export function useVoiceInteraction({ sessionId, baseUrl, initialVoice = "zephyr", tools, partialCaptions = true }) {
  const [status, setStatusState] = useState("idle");
  const [level, setLevel] = useState(0);
  const [voice, setVoiceState] = useState(initialVoice);
  const [transcripts, setTranscripts] = useState([]);
  const [userText, setUserText] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [captionSource, setCaptionSource] = useState(null);
  const [serverStatus, setServerStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [ttfaMs, setTtfaMs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState("websocket");
  const [muted, setMuted] = useState(false);
  const [bargeInEnabled, setBargeInEnabled] = useState(true);
  const [toolEvents, setToolEvents] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  // Mutable engine state read by audio/socket callbacks (refs avoid stale closures in rAF and socket handlers).
  const s = useRef({
    status: "idle", active: false, voice: initialVoice, muted: false, bargeIn: true, serverDone: true,
    ignoreAssistant: false, lastServerTurn: 0, turnStart: 0, firstAudio: true, caption: { source: null, at: 0 },
    stream: null, micSource: null, analyser: null, raf: 0, smooth: 0, lastLevelPush: 0,
  }).current;
  const toolsRef = useRef(tools);
  toolsRef.current = tools;
  const currentTurnIdRef = useRef(0);
  const vad = useRef(new VoiceActivityDetector()).current;
  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const send = useCallback((msg) => socketRef.current?.send(msg) ?? false, []);
  const playerRef = useRef(null);
  const finishRef = useRef(() => {});

  const setStatus = useCallback((next) => {
    s.status = next;
    setStatusState(next);
  }, [s]);

  const finishIfDone = useCallback(() => {
    if (s.serverDone && !playerRef.current.busy && ["processing", "speaking"].includes(s.status)) {
      setStatus(s.active ? "listening" : "idle");
    }
  }, [s, setStatus]);

  if (!playerRef.current) {
    playerRef.current = new TurnAudioPlayer({
      onStart: () => {
        if (!s.firstAudio) {
          s.firstAudio = true;
          setTtfaMs(Math.round(performance.now() - s.turnStart));
        }
        setStatus("speaking");
      },
      onIdle: () => finishRef.current(),
    });
  }
  finishRef.current = finishIfDone;
  const player = playerRef.current;

  const setCaption = useCallback((text, source) => {
    s.caption = { source, at: performance.now() };
    setInterimText(text);
    setCaptionSource(text ? source : null);
  }, [s]);

  const captions = useBrowserCaptions({
    isListening: () => s.status === "listening",
    onCaption: (text) => {
      const whisperFresh = s.caption.source === "whisper" && performance.now() - s.caption.at < WHISPER_PRIORITY_MS;
      if (!whisperFresh) setCaption(text, "browser");
    },
  });

  const appendTranscript = useCallback((role, text, turnId) => {
    if (!text) return;
    setTranscripts((t) => [...t, { id: `${turnId}-${role}-${Date.now()}`, role, text, turnId }].slice(-30));
  }, []);

  const interrupt = useCallback(() => {
    send({ type: "interrupt" });
    currentTurnIdRef.current += 1;
    player.interrupt(s.lastServerTurn);
    s.ignoreAssistant = true;
    s.serverDone = true;
    setStatus(s.active ? "listening" : "idle");
  }, [send, s, player, setStatus]);

  const beginTurn = useCallback(() => {
    s.turnStart = performance.now();
    s.firstAudio = false;
    s.serverDone = false;
    setAssistantText("");
    setStatus("processing");
  }, [s, setStatus]);

  const postChat = useCallback(async (payload) => {
    setTransport("http");
    beginTurn();
    try {
      const { data } = await axios.post(apiUrl(baseUrl, "/agents/voice/chat"), { ...payload, sessionId, voice: s.voice });
      s.lastServerTurn = Math.max(s.lastServerTurn, data.turnId || 0);
      s.ignoreAssistant = false;
      setUserText(data.transcript || payload.text || "");
      setAssistantText(data.reply);
      appendTranscript("user", data.transcript || payload.text, data.turnId);
      appendTranscript("assistant", data.reply, data.turnId);
      s.serverDone = true;
      if (!data.audioUrl || !player.enqueue(data.turnId, 0, data.audioUrl)) finishIfDone();
    } catch (e) {
      s.serverDone = true;
      setError(e.response?.data?.detail || "Voice request failed");
      finishIfDone();
    }
  }, [s, player, baseUrl, sessionId, beginTurn, appendTranscript, finishIfDone]);

  const onServerStatus = useCallback((msg) => {
    setServerStatus(msg.status);
    if (msg.status === "transcribing" || msg.status === "thinking") {
      s.serverDone = false;
      if (s.status !== "speaking") setStatus("processing");
    } else if (msg.status === "idle" || msg.status === "listening") {
      s.serverDone = true;
      finishIfDone();
    }
  }, [s, setStatus, finishIfDone]);

  const onTranscript = useCallback((msg) => {
    if (msg.role === "user") {
      s.ignoreAssistant = false;
      setUserText(msg.text);
      setCaption("", null);
      setAssistantText("");
    } else if (!s.ignoreAssistant && !player.isStale(msg.turnId)) {
      setAssistantText(msg.text);
    }
    appendTranscript(msg.role, msg.text, msg.turnId);
  }, [s, player, setCaption, appendTranscript]);

  const handlers = {
    voice_agent_sync: (m) => {
      if (m.voice) { s.voice = m.voice; setVoiceState(m.voice); }
      setTranscripts(m.transcripts || []);
      setCapabilities(m.capabilities || []);
    },
    voice_changed: (m) => { s.voice = m.voice; setVoiceState(m.voice); },
    voice_status: onServerStatus,
    transcript: onTranscript,
    transcript_partial: (m) => (s.status === "listening" || s.status === "processing") && setCaption(m.text, "whisper"),
    transcript_chunk: (m) => !s.ignoreAssistant && !player.isStale(m.turnId) && setAssistantText(m.fullText),
    audio_chunk_stream: (m) => m.audioUrl && player.enqueue(m.turnId, m.chunkIndex, m.audioUrl),
    audio: (m) => m.data && player.enqueue(m.turnId, 0, m.data),
    interrupted: () => player.clear(),
    tool_call: async (m) => send({ type: "tool_result", callId: m.callId, ...(await runTool(toolsRef.current, m)) }),
    tool_status: (m) => setToolEvents((ev) => mergeToolEvent(ev, m)),
    turn_saved: () => setHistoryVersion((v) => v + 1),
    error: (m) => setError(m.message),
  };
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    const socket = new ReconnectingSocket(wsUrl(baseUrl, sessionId), {
      onOpen: () => {
        setConnected(true);
        setTransport("websocket");
        socket.send({ type: "set_voice", voice: s.voice });
        socket.send({ type: "configure", partials: partialCaptions });
        const specs = toolSpecs(toolsRef.current);
        if (specs.length) socket.send({ type: "register_tools", tools: specs });
        if (s.status === "connecting") setStatus("listening");
      },
      onMessage: (msg) => {
        if (typeof msg.turnId === "number" && !player.isStale(msg.turnId)) s.lastServerTurn = Math.max(s.lastServerTurn, msg.turnId);
        handlersRef.current[msg.type]?.(msg);
      },
      onClose: () => {
        setConnected(false);
        if (s.active && s.status === "connecting") {
          setTransport("http");
          setStatus("listening");
        }
      },
    });
    socketRef.current = socket;
    socket.connect();
  }, [s, player, baseUrl, sessionId, partialCaptions, setStatus]);

  const finalizeUtterance = useCallback(async ({ discard, allSent, mime, chunks }) => {
    if (!s.active) return;
    if (discard) {
      send({ type: "audio_cancel" });
      return;
    }
    if (allSent && socketRef.current?.isOpen) {
      beginTurn();
      send({ type: "audio_end", mime });
      return;
    }
    postChat({ audio: await blobToBase64(new Blob(chunks, { type: mime })), mime });
  }, [send, s, beginTurn, postChat]);

  const onVadEvent = useCallback((event) => {
    if (event === "barge_in") interrupt();
    else if (event === "speech_start") {
      setCaption("", null);
      recorderRef.current?.start();
    } else if (event === "speech_end" || event === "speech_discard") {
      recorderRef.current?.stop(event === "speech_discard");
    }
  }, [interrupt, setCaption]);

  const tickRef = useRef(null);
  tickRef.current = () => {
    if (!s.analyser || !s.active) return;
    const buf = new Float32Array(s.analyser.fftSize);
    s.analyser.getFloatTimeDomainData(buf);
    const lvl = rmsLevel(buf);
    const now = performance.now();
    s.smooth = s.smooth * 0.55 + lvl * 0.45;
    if (now - s.lastLevelPush > 33) {
      s.lastLevelPush = now;
      setLevel(s.muted ? 0 : s.smooth);
    }
    const event = vad.update(lvl, now, { mode: s.status, muted: s.muted, bargeInEnabled: s.bargeIn });
    if (event) onVadEvent(event);
    s.raf = requestAnimationFrame(() => tickRef.current());
  };

  const attachMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (!s.active) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }
    s.stream = stream;
    s.micSource = player.ctx.createMediaStreamSource(stream);
    s.analyser = player.ctx.createAnalyser();
    s.analyser.fftSize = 1024;
    s.micSource.connect(s.analyser);
    recorderRef.current = new UtteranceRecorder(stream, {
      send: (data, mime) => send({ type: "audio_chunk", data, mime }),
      onDone: finalizeUtterance,
    });
    return true;
  }, [send, s, player, finalizeUtterance]);

  const start = useCallback(async () => {
    if (s.active) return;
    player.unlock(); // must run synchronously inside the click (Safari autoplay policy)
    s.active = true;
    setError(null);
    setStatus("connecting");
    try {
      if (!(await attachMic())) return;
      captions.start(); // only after the mic stream is live
      vad.reset();
      s.raf = requestAnimationFrame(() => tickRef.current());
      connect();
    } catch (e) {
      s.active = false;
      setError(e?.name === "NotAllowedError" ? "Microphone permission denied" : e?.message || "Microphone unavailable");
      setStatus("error");
    }
  }, [s, player, vad, captions, attachMic, connect, setStatus]);

  const stop = useCallback(() => {
    s.active = false;
    cancelAnimationFrame(s.raf);
    recorderRef.current?.stop(true);
    recorderRef.current = null;
    vad.reset();
    captions.stop();
    s.stream?.getTracks().forEach((t) => t.stop());
    s.micSource?.disconnect();
    Object.assign(s, { stream: null, micSource: null, analyser: null });
    socketRef.current?.close();
    socketRef.current = null;
    player.interrupt(s.lastServerTurn);
    setConnected(false);
    setLevel(0);
    setInterimText("");
    setStatus("idle");
  }, [s, player, vad, captions, setStatus]);

  const sendUserText = useCallback((text) => {
    const clean = (text || "").trim();
    if (!clean) return;
    player.ctx = unlockAudioContext(player.ctx);
    if (player.busy) interrupt();
    if (!socketRef.current?.isOpen) {
      postChat({ text: clean });
      return;
    }
    beginTurn();
    send({ type: "user_text", text: clean });
  }, [send, player, interrupt, postChat, beginTurn]);

  const setVoice = useCallback((v) => {
    s.voice = v;
    setVoiceState(v);
    send({ type: "set_voice", voice: v });
  }, [send, s]);

  const toggleMute = useCallback(() => {
    s.muted = !s.muted;
    setMuted(s.muted);
  }, [s]);

  const toggleBargeIn = useCallback(() => {
    s.bargeIn = !s.bargeIn;
    setBargeInEnabled(s.bargeIn);
  }, [s]);

  useEffect(() => stop, [stop]);

  const toolKey = Object.keys(tools || {}).join(",");
  useEffect(() => {
    send({ type: "register_tools", tools: toolSpecs(toolsRef.current) });
  }, [send, toolKey]);

  return {
    status, level, voice, setVoice, transcripts, userText, assistantText, interimText, serverStatus, error,
    ttfaMs, connected, transport, muted, toggleMute, bargeInEnabled, toggleBargeIn, start, stop, interrupt,
    sendUserText, currentTurnIdRef, isActive: status !== "idle" && status !== "error",
    captionSource, toolEvents, capabilities, historyVersion, baseUrl,
  };
}

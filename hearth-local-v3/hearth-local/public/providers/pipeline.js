// Listen -> transcribe -> any chat model (streamed) -> speak sentence by sentence. Talking over it interrupts.
export async function connect(s, { provider, voice, audio, onText, onStatus }) {
  const history = [];
  let stopped = false, replyAbort, speakQueue = [], speaking = false, audioEl = null, gen = 0;

  function hush() {
    gen++;
    replyAbort?.abort();
    speakQueue = [];
    speaking = false;
    if (audioEl) {
      try { audioEl.pause(); audioEl.currentTime = 0; } catch (_) {}
      audioEl = null;
    }
    if (audio) {
      try { audio.pause(); audio.currentTime = 0; } catch (_) {}
    }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  async function speakNext(g) {
    if (speaking || g !== gen || !speakQueue.length) {
      if (!speaking && !speakQueue.length && !stopped) {
        onStatus("listening");
      }
      return;
    }
    speaking = true;
    const text = speakQueue.shift();
    onStatus("speaking");
    try {
      if (provider.voices) {
        const r = await fetch("/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice })
        });
        if (!r.ok) throw new Error("Speech synthesis failed");
        const blob = await r.blob();
        if (g !== gen) return;
        const url = URL.createObjectURL(blob);
        const player = audio || new Audio();
        audioEl = player;
        player.src = url;
        await new Promise((resolve) => {
          player.onended = () => { URL.revokeObjectURL(url); resolve(); };
          player.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          player.play().catch(resolve);
        });
      } else {
        const u = new SpeechSynthesisUtterance(text);
        if (window.speechSynthesis) {
          u.voice = speechSynthesis.getVoices().find((v) => v.name === voice) || null;
          await new Promise((resolve) => {
            u.onend = u.onerror = resolve;
            speechSynthesis.speak(u);
          });
        }
      }
    } catch (e) {
      console.warn("TTS error:", e);
      onStatus("error", e.message);
    }
    if (g !== gen) return;
    speaking = false;
    speakNext(g);
  }

  async function reply(userText, hidden) {
    hush();
    const g = gen;
    if (!hidden) { onText("user", userText); }
    history.push({ role: "user", content: userText });
    replyAbort = new AbortController();
    let full = "", pending = "";
    onStatus("thinking");
    try {
      const r = await fetch("/chat", {
        method: "POST",
        signal: replyAbort.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id, messages: history })
      });
      if (!r.ok) throw new Error((await r.text()).slice(0, 200) || "The model refused");
      const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          const d = line.replace(/^data:\s*/, "").trim();
          if (!d || d === "[DONE]" || !line.startsWith("data")) continue;
          let delta = "";
          try {
            const parsed = JSON.parse(d);
            delta = parsed.choices?.[0]?.delta?.content || "";
          } catch (_) {}
          if (!delta) continue;
          full += delta;
          pending += delta;
          onText("assistant", delta);
          const m = pending.match(/^([\s\S]*?[.!?…])\s+([\s\S]*)$/);
          if (m && m[1].length > 10) {
            speakQueue.push(m[1].trim());
            pending = m[2];
            speakNext(g);
          }
        }
      }
      if (pending.trim()) {
        speakQueue.push(pending.trim());
        speakNext(g);
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Chat error:", e);
        onStatus("error", e.message);
      }
    }
    if (full) history.push({ role: "assistant", content: full });
    onText("break");
  }

  let cleanup;
  if (s.stt === "server" || provider.stt === "server") {
    // Sensitive voice detection with VAD
    const mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const an = ctx.createAnalyser();
    an.fftSize = 1024;
    ctx.createMediaStreamSource(mic).connect(an);
    const data = new Float32Array(an.fftSize);
    let rec, chunks = [], lastLoud = 0, startedAt = 0, noise = 0.01;

    const timer = setInterval(() => {
      an.getFloatTimeDomainData(data);
      const rms = Math.sqrt(data.reduce((a, v) => a + v * v, 0) / data.length);
      const now = performance.now();
      if (!rec) noise = noise * 0.98 + rms * 0.02;
      const loud = rms > Math.max(0.018, noise * 2.5);

      if (loud) {
        lastLoud = now;
        if (speaking) hush();
        if (!rec) {
          onStatus("listening", "Listening to you…");
          rec = new MediaRecorder(mic);
          chunks = [];
          startedAt = now;
          rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
          rec.onstop = async () => {
            if (stopped || performance.now() - startedAt < 350) return;
            onStatus("thinking", "Transcribing speech…");
            try {
              const r = await fetch("/stt", {
                method: "POST",
                headers: { "Content-Type": "audio/webm" },
                body: new Blob(chunks, { type: "audio/webm" })
              });
              const text = r.ok ? ((await r.json()).text || "").trim() : "";
              if (text && text.split(/\s+/).length >= 1 && !/^(thank you\.?|you)$/i.test(text)) {
                reply(text);
              } else if (!speaking && !speakQueue.length) {
                onStatus("listening");
              }
            } catch (err) {
              console.error("STT error:", err);
              onStatus("listening");
            }
          };
          rec.start(100);
        }
      }

      if (rec && now - lastLoud > 750) {
        try { rec.stop(); } catch (_) {}
        rec = null;
      }
    }, 50);

    cleanup = () => {
      clearInterval(timer);
      try { rec?.stop(); } catch (_) {}
      mic.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
    };
  } else {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error("This browser can't transcribe speech. Use Chrome or configure server STT.");
    const sr = new SR();
    sr.continuous = true;
    sr.interimResults = true;
    sr.lang = "en-US";
    sr.onresult = (e) => {
      const r = e.results[e.results.length - 1];
      const text = r[0].transcript.trim();
      if (!r.isFinal) {
        if (speaking && text.split(/\s+/).length >= 3) hush();
        return;
      }
      if (text) reply(text);
    };
    sr.onend = () => { if (!stopped) sr.start(); };
    sr.start();
    cleanup = () => sr.stop();
  }

  onStatus("live");
  reply(s.greeting || "Say hello warmly in one sentence and ask how my day is going.", true);
  return {
    stop() {
      stopped = true;
      hush();
      cleanup();
    }
  };
}

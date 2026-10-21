import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Play, Loader2, Mic, MicOff } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DEFAULT_BASE_URL, PERSONAS, apiUrl } from "../core/protocol";
import { base64ToArrayBuffer, decodeAudio, peaksFromBuffer, unlockAudioContext } from "../core/audio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { WaveCanvas } from "./WaveCanvas";

const MODELS = [
  { id: "tts-1", label: "tts-1 · realtime" },
  { id: "tts-1-hd", label: "tts-1-hd · studio" },
];
const VOICES = ["alloy", "ash", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"];

const Metric = ({ label, value, unit, testId, accent }) => (
  <div className="rounded-xl border border-white/[0.07] bg-black/30 p-4">
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
    <p data-testid={testId} className="mt-2 font-mono text-2xl tabular-nums" style={{ color: accent || "#f4f4f6" }}>
      {value ?? "—"}<span className="ml-1 text-xs text-zinc-500">{value != null ? unit : ""}</span>
    </p>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block space-y-2">
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</span>
    {children}
  </label>
);

const useMicMonitor = (ctxRef) => {
  const [analyser, setAnalyser] = useState(null);
  const streamRef = useRef(null);
  const toggle = async () => {
    if (analyser) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setAnalyser(null);
      return;
    }
    ctxRef.current = unlockAudioContext(ctxRef.current);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const an = ctxRef.current.createAnalyser();
      an.fftSize = 2048;
      ctxRef.current.createMediaStreamSource(stream).connect(an);
      setAnalyser(an);
    } catch {
      toast.error("Microphone permission denied");
    }
  };
  return { analyser, toggle };
};

export const TTSStudioPanel = ({ baseUrl = DEFAULT_BASE_URL, script }) => {
  const ctxRef = useRef(null);
  const srcRef = useRef(null);
  const [text, setText] = useState("The capital of Uganda is Kampala. It sits on the northern shore of Lake Victoria.");
  const [model, setModel] = useState("tts-1");
  const [voice, setVoice] = useState("nova");
  const [speed, setSpeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);
  const [peaks, setPeaks] = useState([]);
  const [history, setHistory] = useState([]);
  const mic = useMicMonitor(ctxRef);

  useEffect(() => {
    if (script?.text) setText(script.text);
    if (script?.voice && VOICES.includes(script.voice)) setVoice(script.voice);
  }, [script]);

  const generate = async () => {
    if (!text.trim()) return toast.error("Enter some text first");
    ctxRef.current = unlockAudioContext(ctxRef.current);
    setBusy(true);
    const t0 = performance.now();
    try {
      const { data } = await axios.post(apiUrl(baseUrl, "/agents/voice/tts"), { text, model, voice, speed });
      const buffer = await decodeAudio(ctxRef.current, base64ToArrayBuffer(data.audio));
      try { srcRef.current?.stop(); } catch { /* noop */ }
      const src = ctxRef.current.createBufferSource();
      src.buffer = buffer;
      src.connect(ctxRef.current.destination);
      src.start();
      srcRef.current = src;
      const ttfa = Math.round(performance.now() - t0);
      const run = { run: history.length + 1, ttfa, server: data.latencyMs, model, voice, duration: buffer.duration, bytes: data.bytes };
      setLast(run);
      setPeaks(peaksFromBuffer(buffer));
      setHistory((h) => [...h, run].slice(-14));
    } catch (e) {
      toast.error(e.response?.data?.detail || "Synthesis failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section data-testid="tts-studio-panel" className="instrument-panel rounded-3xl p-5 sm:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400/80">Workbench / 02</p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">TTS Studio</h2>
          <p className="mt-2 max-w-md text-sm text-zinc-400">Audition models and voices, measure time-to-first-audio, watch your mic signal.</p>
        </div>
        <div className="flex flex-wrap gap-2" data-testid="tts-persona-presets">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              data-testid={`tts-preset-${p.id}`}
              onClick={() => setVoice(p.voice)}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors ${
                voice === p.voice ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-5">
          <Field label="Script">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={4000}
              data-testid="tts-text-input"
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-relaxed text-zinc-100 focus:border-emerald-400/40 focus:outline-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Model">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger data-testid="tts-model-select" className="border-white/10 bg-black/40 text-zinc-100"><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/10 bg-[#111118] text-zinc-100">
                  {MODELS.map((m) => <SelectItem key={m.id} value={m.id} data-testid={`tts-model-option-${m.id}`}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Voice">
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger data-testid="tts-voice-select" className="border-white/10 bg-black/40 text-zinc-100"><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/10 bg-[#111118] text-zinc-100">
                  {VOICES.map((x) => <SelectItem key={x} value={x} data-testid={`tts-voice-option-${x}`}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label={`Speed · ${speed.toFixed(2)}x`}>
            <Slider data-testid="tts-speed-slider" min={0.5} max={2} step={0.05} value={[speed]} onValueChange={([s]) => setSpeed(s)} />
          </Field>
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            data-testid="tts-generate-button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 py-3 text-sm font-semibold text-black transition-[background-color,transform] hover:bg-emerald-300 active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {busy ? "Synthesizing…" : "Generate & play"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="TTFA" value={last?.ttfa} unit="ms" testId="tts-latency-metric" accent="#34d399" />
            <Metric label="Synth" value={last?.server} unit="ms" testId="tts-server-latency-metric" />
            <Metric label="Duration" value={last ? last.duration.toFixed(1) : null} unit="s" testId="tts-duration-metric" />
            <Metric label="Payload" value={last ? Math.round(last.bytes / 1024) : null} unit="kb" testId="tts-bytes-metric" />
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-black/30 p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Output waveform</p>
            <WaveCanvas peaks={peaks} color="#34d399" height={72} testId="tts-output-waveform" />
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-black/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Mic input</p>
              <button type="button" onClick={mic.toggle} data-testid="tts-mic-monitor-toggle" className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-300 transition-colors hover:bg-white/10">
                {mic.analyser ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {mic.analyser ? "Stop" : "Monitor"}
              </button>
            </div>
            <WaveCanvas analyser={mic.analyser} color="#22d3ee" height={72} testId="tts-mic-waveform" />
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-black/30 p-4" data-testid="tts-latency-history">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">TTFA history · ms</p>
            <div className="h-32">
              {history.length ? (
                <ResponsiveContainer width="100%" height={128} minWidth={120}>
                  <BarChart data={history}>
                    <XAxis dataKey="run" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} width={36} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                    <Bar dataKey="ttfa" fill="#34d399" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="grid h-full place-items-center text-xs text-zinc-600">Run a synthesis to start the log.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

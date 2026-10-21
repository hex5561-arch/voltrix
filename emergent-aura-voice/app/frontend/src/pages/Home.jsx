import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AudioLines, ArrowDown, Mic } from "lucide-react";
import {
  VoiceProvider, useVoice, AuraOrb, RealtimeVoiceModal, LiveVoiceSidebarWidget, TTSStudioPanel, ConversationReplay,
} from "@/voice-kit";
import { CloudflareInfo } from "@/components/CloudflareInfo";
import { BackendSwitch, useBackendConfig } from "@/components/BackendSwitch";
import { AgentNotes } from "@/components/AgentNotes";
import { buildAppTools } from "@/lib/appTools";

const NAV = [["#voice", "Voice mode"], ["#studio", "TTS Studio"], ["#history", "Replay"], ["#cloudflare", "Cloudflare"]];

const Sidebar = ({ onOpenModal, backend, notes, onRemoveNote }) => {
  const v = useVoice();
  return (
    <aside className="flex flex-col gap-7 border-b border-white/[0.06] p-5 lg:sticky lg:top-0 lg:h-screen lg:w-[300px] lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><AudioLines className="h-5 w-5" /></div>
        <div>
          <p className="font-display text-lg font-semibold leading-none text-zinc-50">Aura</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">realtime voice agent</p>
        </div>
      </div>
      <nav className="hidden flex-col gap-1 lg:flex">
        {NAV.map(([href, label]) => (
          <a key={href} href={href} data-testid={`nav-link-${href.slice(1)}`} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100">{label}</a>
        ))}
      </nav>
      <BackendSwitch config={backend} />
      <AgentNotes notes={notes} onRemove={onRemoveNote} />
      <div className="lg:mt-auto">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">live widget</p>
        <LiveVoiceSidebarWidget onOpenModal={onOpenModal} />
        <p data-testid="session-id-label" className="mt-4 truncate font-mono text-[10px] text-zinc-600">session · {v.sessionId}</p>
      </div>
    </aside>
  );
};

const Hero = ({ onStart, backend }) => {
  const v = useVoice();
  const stack = backend.isCloudflare
    ? [["stt", "whisper"], ["llm", "llama-3.3"], ["tts", "aura-1"]]
    : [["stt", "whisper-1"], ["llm", "gpt-5.5"], ["tts", "tts-1"], ["tools", "web + app"]];
  return (
    <section id="voice" className="relative grid min-h-[86vh] items-center gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="space-y-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-400/80">Voice mode / 01</p>
        <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
          Talk to it.<br /><span className="text-zinc-500">Cut in any time.</span>
        </h1>
        <p className="max-w-md text-base text-zinc-400">
          Speech in, answers out, one sentence at a time. It can search the web and run commands in this app while you talk: try "take a note", "open the studio" or "what's in the news today?"
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onStart} data-testid="voice-mode-trigger-button" className="flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-[background-color,transform] hover:bg-zinc-200 active:scale-[0.98]">
            <Mic className="h-4 w-4" /> Start voice mode
          </button>
          <a href="#studio" data-testid="open-tts-studio-link" className="flex items-center gap-2 rounded-full border border-white/10 px-6 py-3.5 text-sm text-zinc-200 transition-colors hover:bg-white/5">
            Open TTS Studio <ArrowDown className="h-4 w-4" />
          </a>
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-4 pt-4 font-mono text-xs" data-testid="hero-stack">
          {stack.map(([k, val]) => (
            <div key={k}><dt className="uppercase tracking-[0.2em] text-zinc-600">{k}</dt><dd className="mt-1 text-zinc-300">{val}</dd></div>
          ))}
        </dl>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.15 }} className="grid place-items-center">
        <AuraOrb status={v.status === "idle" ? "listening" : v.status} level={v.level} size={240} testId="hero-aura-orb" />
      </motion.div>
    </section>
  );
};

const Shell = ({ ui, backend, notes, onRemoveNote, script }) => {
  const v = useVoice();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    ui.current.minimize = () => setOpen(false);
    ui.current.setVoice = v.setVoice;
  }, [ui, v.setVoice]);
  const openAndStart = () => {
    setOpen(true);
    v.start();
  };
  const close = () => {
    setOpen(false);
    v.stop();
  };
  return (
    <div className="app-bg min-h-screen text-zinc-100 lg:flex">
      <Sidebar onOpenModal={() => setOpen(true)} backend={backend} notes={notes} onRemoveNote={onRemoveNote} />
      <main className="min-w-0 flex-1 space-y-28 px-5 pb-24 sm:px-10 lg:px-16">
        <Hero onStart={openAndStart} backend={backend} />
        <div id="studio" className="scroll-mt-8"><TTSStudioPanel script={script} /></div>
        <div id="history" className="scroll-mt-8"><ConversationReplay /></div>
        <div id="cloudflare" className="scroll-mt-8"><CloudflareInfo activeUrl={backend.isCloudflare ? backend.cfUrl : null} /></div>
      </main>
      <RealtimeVoiceModal open={open} onClose={close} onMinimize={() => setOpen(false)} />
    </div>
  );
};

export default function Home() {
  const backend = useBackendConfig();
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem("voice-agent-notes") || "[]"));
  const [script, setScript] = useState(null);
  const ui = useRef({});

  useEffect(() => localStorage.setItem("voice-agent-notes", JSON.stringify(notes)), [notes]);
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const addNote = useCallback((text) => {
    setNotes((n) => [{ id: `${Date.now()}`, text }, ...n].slice(0, 30));
    return notesRef.current.length + 1;
  }, []);
  ui.current.addNote = addNote;
  ui.current.getNotes = () => notesRef.current;
  ui.current.setScript = setScript;

  const tools = useMemo(() => buildAppTools(ui), []);
  const removeNote = (id) => setNotes((n) => n.filter((x) => x.id !== id));

  return (
    <VoiceProvider key={backend.baseUrl} baseUrl={backend.baseUrl} tools={tools}>
      <Shell ui={ui} backend={backend} notes={notes} onRemoveNote={removeNote} script={script} />
    </VoiceProvider>
  );
}

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Hand, X, Send, Zap, ZapOff, Radio, Minimize2 } from "lucide-react";
import { AuraOrb } from "./AuraOrb";
import { StatusBadge } from "./StatusBadge";
import { ToolActivity } from "./ToolActivity";
import { useVoice } from "../VoiceProvider";
import { PERSONAS } from "../core/protocol";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HINTS = {
  connecting: "Waking the agent…",
  listening: "Go ahead, I'm listening",
  processing: "Thinking…",
  speaking: "Speak any time to interrupt",
  error: "Something went wrong",
  idle: "Tap the mic to start",
};

const CtrlButton = ({ onClick, active, label, testId, children, danger }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    aria-label={label}
    title={label}
    className={`grid h-14 w-14 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-200 hover:scale-105 active:scale-95 ${
      danger ? "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
        : active ? "border-white/25 bg-white/15 text-white" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

const Subtitles = ({ userText, interimText, captionSource, assistantText }) => (
  <div className="mx-auto w-full max-w-2xl space-y-4 px-6 text-center" data-testid="voice-subtitles">
    <p data-testid="voice-user-subtitle" data-live={Boolean(interimText)} className={`min-h-[1.5rem] text-sm sm:text-base ${interimText ? "text-cyan-200" : "text-cyan-300/80"}`}>
      {interimText || userText}
      {interimText && (
        <span data-testid="voice-caption-source" className="ml-2 inline-flex translate-y-[-1px] items-center gap-1 rounded-full border border-cyan-400/20 px-1.5 py-px align-middle font-mono text-[9px] uppercase tracking-[0.15em] text-cyan-400/70">
          <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-300" />{captionSource === "whisper" ? "whisper" : "live"}
        </span>
      )}
    </p>
    <p data-testid="voice-assistant-subtitle" className="font-display min-h-[3.5rem] text-xl leading-snug text-zinc-50 sm:text-2xl">
      {assistantText}
    </p>
  </div>
);

const currentTurnEvents = (events) => {
  const latest = Math.max(-1, ...events.map((e) => e.turnId ?? -1));
  return events.filter((e) => (e.turnId ?? -1) === latest);
};

export const RealtimeVoiceModal = ({ open, onClose, onMinimize }) => {
  const v = useVoice();
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const subsRef = useRef(null);
  const turnEvents = currentTurnEvents(v.toolEvents);
  const compact = turnEvents.length > 0 || v.assistantText.length > 110 || window.innerHeight < 760;
  const orbSize = window.innerWidth < 640 ? (compact ? 120 : 170) : compact ? 140 : 230;

  useEffect(() => {
    const el = subsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [v.assistantText, v.interimText]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = (e) => {
    e.preventDefault();
    v.sendUserText(draft);
    setDraft("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="voice-modal-container"
          className="fixed inset-0 z-50 flex flex-col bg-[#050507]/90 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="noise-overlay pointer-events-none absolute inset-0" />
          <header className="relative flex items-center justify-between gap-3 px-5 py-4 sm:px-10 sm:py-6">
            <div className="flex items-center gap-3">
              <StatusBadge status={v.status} />
              <span data-testid="voice-transport-indicator" className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 sm:inline">
                <Radio className="mr-1 inline h-3 w-3" />
                {v.transport === "websocket" ? (v.connected ? "ws live" : "ws offline") : "http fallback"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Select value={v.voice} onValueChange={v.setVoice}>
                <SelectTrigger data-testid="voice-persona-select" className="h-10 w-[150px] rounded-full border-white/10 bg-white/[0.04] text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[70] border-white/10 bg-[#111118] text-zinc-100">
                  {PERSONAS.map((p) => (
                    <SelectItem key={p.id} value={p.id} data-testid={`persona-option-${p.id}`}>
                      {p.label} <span className="text-zinc-500">· {p.voice}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {onMinimize && (
                <button
                  type="button"
                  onClick={onMinimize}
                  data-testid="voice-modal-minimize-button"
                  aria-label="Minimize voice mode"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/10"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                data-testid="voice-modal-close-button"
                aria-label="Close voice mode"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="relative flex min-h-0 flex-1 flex-col items-center gap-4 overflow-hidden">
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <AuraOrb status={v.status} level={v.level} size={orbSize} pad={compact ? 1.15 : 1.3} />
            </div>
            <p data-testid="voice-hint" className="shrink-0 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
              {v.error || HINTS[v.status]}
            </p>
            <div className="shrink-0"><ToolActivity events={turnEvents} limit={compact ? 2 : 3} /></div>
            <div ref={subsRef} data-testid="voice-subtitles-scroll" className="max-h-[26vh] w-full shrink-0 overflow-y-auto pb-2 [mask-image:linear-gradient(to_bottom,transparent,black_18%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_18%)]">
              <Subtitles userText={v.userText} interimText={v.interimText} captionSource={v.captionSource} assistantText={v.assistantText} />
            </div>
          </main>

          <footer className="relative space-y-5 px-5 pb-8 sm:pb-10">
            <div className="flex items-center justify-center gap-4">
              <CtrlButton onClick={v.toggleMute} active={!v.muted} label={v.muted ? "Unmute mic" : "Mute mic"} testId="mic-toggle-button">
                {v.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </CtrlButton>
              <CtrlButton onClick={v.interrupt} label="Interrupt" testId="voice-interrupt-button">
                <Hand className="h-5 w-5" />
              </CtrlButton>
              <CtrlButton onClick={v.toggleBargeIn} active={v.bargeInEnabled} label={v.bargeInEnabled ? "Barge-in on" : "Barge-in off"} testId="barge-in-toggle-button">
                {v.bargeInEnabled ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
              </CtrlButton>
              {v.isActive ? (
                <CtrlButton onClick={v.stop} label="End voice session" testId="voice-end-button" danger>
                  <X className="h-5 w-5" />
                </CtrlButton>
              ) : (
                <CtrlButton onClick={v.start} label="Start voice" testId="voice-start-button" active>
                  <Mic className="h-5 w-5" />
                </CtrlButton>
              )}
            </div>
            <form onSubmit={submit} className="mx-auto flex w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5 pl-5">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Or type a message…"
                data-testid="voice-text-input"
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <button type="submit" data-testid="voice-text-send-button" aria-label="Send" className="grid h-9 w-9 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95">
                <Send className="h-4 w-4" />
              </button>
            </form>
            {v.ttfaMs != null && (
              <p data-testid="voice-ttfa-readout" className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                last time-to-first-audio · {v.ttfaMs} ms
              </p>
            )}
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

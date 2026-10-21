import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Square, ChevronDown, Maximize2 } from "lucide-react";
import { useVoice } from "../VoiceProvider";
import { StatusBadge } from "./StatusBadge";
import { WaveformBars } from "./WaveformBars";
import { STATUS_META } from "../core/protocol";

const CollapsedMic = ({ status, onClick }) => {
  const color = (STATUS_META[status] || STATUS_META.idle).color;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="sidebar-widget-expand-button"
      aria-label="Open live voice widget"
      className="mic-pulse relative grid h-14 w-14 place-items-center rounded-full border bg-[#111118] text-zinc-100 transition-transform hover:scale-105"
      style={{ borderColor: `${color}88`, "--pulse": color }}
    >
      <Mic className="h-5 w-5" />
    </button>
  );
};

const TranscriptPreview = ({ transcripts, assistantText, userText, live }) => {
  const lastUser = userText || [...transcripts].reverse().find((t) => t.role === "user")?.text;
  const lastBot = assistantText || [...transcripts].reverse().find((t) => t.role === "assistant")?.text;
  return (
    <div data-testid="sidebar-transcript-preview" className="space-y-2 text-sm">
      <p className="line-clamp-2 text-cyan-300/80">{live || lastUser || "Your words will appear here."}</p>
      <p className="line-clamp-3 text-zinc-200">{lastBot || "Replies stream in sentence by sentence."}</p>
    </div>
  );
};

export const LiveVoiceSidebarWidget = ({ onOpenModal }) => {
  const v = useVoice();
  const [expanded, setExpanded] = useState(true);
  return (
    <div data-testid="sidebar-voice-widget" data-expanded={expanded}>
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="glass-card space-y-4 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <StatusBadge status={v.status} testId="sidebar-status-badge" />
              <div className="flex gap-1">
                <button type="button" onClick={onOpenModal} data-testid="sidebar-open-modal-button" aria-label="Open voice mode" className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setExpanded(false)} data-testid="sidebar-widget-collapse-button" aria-label="Collapse widget" className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            <WaveformBars level={v.level} status={v.status} />
            <button
              type="button"
              onClick={v.isActive ? v.stop : v.start}
              data-testid="sidebar-voice-toggle-button"
              className={`flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-[background-color,transform] duration-200 active:scale-[0.98] ${
                v.isActive ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {v.isActive ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
              {v.isActive ? "Stop voice" : "Start voice"}
            </button>
            <TranscriptPreview transcripts={v.transcripts} assistantText={v.assistantText} userText={v.userText} live={v.interimText} />
          </motion.div>
        ) : (
          <motion.div key="collapsed" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <CollapsedMic status={v.status} onClick={() => setExpanded(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { Globe, Loader2, TerminalSquare, Check, AlertTriangle } from "lucide-react";

const LABELS = {
  web_search: ["Searching the web", "Searched the web"],
  get_current_time: ["Checking the time", "Checked the time"],
};

const label = (e) => {
  const [running, done] = LABELS[e.name] || [`Running ${e.name.replace(/_/g, " ")}`, `Ran ${e.name.replace(/_/g, " ")}`];
  return e.status === "running" ? running : e.status === "error" ? `Failed ${e.name.replace(/_/g, " ")}` : done;
};
const detail = (e) => e.arguments?.query || Object.values(e.arguments || {}).filter((v) => typeof v === "string")[0] || "";

/** Live feed of tools/commands the agent runs mid-conversation. */
export const ToolActivity = ({ events, limit = 3, testId = "voice-tool-activity" }) => {
  const recent = events.slice(-limit);
  if (!recent.length) return null;
  return (
    <div data-testid={testId} className="flex flex-col items-center gap-2">
      {recent.map((e) => {
        const Icon = e.status === "running" ? Loader2 : e.status === "error" ? AlertTriangle : e.name === "web_search" ? Globe : e.status === "done" ? Check : TerminalSquare;
        const sources = e.name === "web_search" && e.status === "done" ? e.result?.sources || [] : [];
        return (
          <div key={e.callId} data-testid={`tool-event-${e.name}`} data-status={e.status} className="flex max-w-full flex-col items-center gap-1.5">
            <span className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] ${e.status === "error" ? "border-rose-500/30 text-rose-300" : "border-violet-400/25 bg-violet-400/[0.06] text-violet-200"}`}>
              <Icon className={`h-3 w-3 shrink-0 ${e.status === "running" ? "animate-spin" : ""}`} />
              <span className="truncate">{label(e)}{detail(e) ? ` · ${detail(e)}` : ""}</span>
            </span>
            {sources.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {sources.slice(0, 3).map((src) => (
                  <a key={src.url} href={src.url} target="_blank" rel="noreferrer" data-testid="tool-source-link" className="max-w-[180px] truncate rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400 transition-colors hover:text-zinc-100">
                    {src.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

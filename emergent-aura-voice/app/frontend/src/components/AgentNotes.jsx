import { StickyNote, X } from "lucide-react";

/** Notes the agent writes via the `take_note` command. */
export const AgentNotes = ({ notes, onRemove }) => (
  <div data-testid="agent-notes" className="space-y-2">
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">agent notes</p>
    {notes.length === 0 ? (
      <p className="text-xs text-zinc-600">Say "note that…" and the agent will save it here.</p>
    ) : (
      <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
        {notes.map((n) => (
          <li key={n.id} data-testid="agent-note-item" className="group flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-200">
            <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-amber-300/80" />
            <span className="flex-1">{n.text}</span>
            <button type="button" onClick={() => onRemove(n.id)} aria-label="Remove note" data-testid="agent-note-remove" className="opacity-0 transition-opacity group-hover:opacity-100">
              <X className="h-3 w-3 text-zinc-500" />
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

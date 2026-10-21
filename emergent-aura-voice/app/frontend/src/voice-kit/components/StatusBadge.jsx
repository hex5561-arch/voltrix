import { STATUS_META } from "../core/protocol";

export const StatusBadge = ({ status, testId = "voice-status-badge", compact = false }) => {
  const meta = STATUS_META[status] || STATUS_META.idle;
  return (
    <span
      data-testid={testId}
      data-status={status}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-300"
      style={{ color: meta.color }}
    >
      <span className="relative flex h-2 w-2">
        {status !== "idle" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: meta.color }} />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: meta.color }} />
      </span>
      {!compact && meta.label}
    </span>
  );
};

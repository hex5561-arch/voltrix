import { useEffect, useState } from "react";
import { computeBarHeights } from "../core/waveform";
import { STATUS_META } from "../core/protocol";

const AMBIENT = { speaking: 0.55, processing: 0.25, connecting: 0.12 };

export const WaveformBars = ({ level, status, testId = "sidebar-waveform-bars" }) => {
  const [phase, setPhase] = useState(0);
  const animated = status !== "idle" && status !== "error";
  useEffect(() => {
    if (!animated) return undefined;
    const id = setInterval(() => setPhase((p) => p + 0.45), 80);
    return () => clearInterval(id);
  }, [animated]);
  const drive = animated ? Math.max(level, AMBIENT[status] || 0) : 0;
  const heights = computeBarHeights(drive, phase);
  const color = (STATUS_META[status] || STATUS_META.idle).color;
  return (
    <div data-testid={testId} className="flex h-14 items-center justify-center gap-1.5">
      {heights.map((h, i) => (
        <span
          key={i}
          data-testid={`waveform-bar-${i}`}
          className="w-2 rounded-full transition-[height,background-color] duration-100 ease-out"
          style={{ height: `${h}%`, background: color, boxShadow: `0 0 12px ${color}55` }}
        />
      ))}
    </div>
  );
};

import { Play, FilmSlate, Clock } from "@phosphor-icons/react";

/** Shape of the JSON payload inside a ```hyperframes code block emitted by the agent. */
export interface HyperFramesVideoMeta {
  /** Topic / subject (e.g. "General Relativity") */
  topic?: string;
  /** Display title (e.g. "General Relativity Explained") */
  title?: string;
  /** "ready" | "generating" */
  status?: "ready" | "generating";
  /**
   * Either an absolute local path (/home/voltrix/videos/.../renders/foo.mp4)
   * or an API URL (/api/hf-videos/foo.mp4).
   */
  path?: string;
  /** Human-readable duration, e.g. "9:01" */
  duration?: string;
  /** Frame preset name, e.g. "cobalt-grid" */
  preset?: string;
}

/** Convert a local render path to the backend serving URL. */
export function hfVideoUrl(path: string): string {
  // Already an API URL
  if (path.startsWith("/api/")) return path;
  // Local path: extract the filename
  const name = path.split("/").pop() ?? path;
  return `/api/hf-videos/${name}`;
}

interface HyperFramesChatCardProps {
  data?: unknown;
  raw?: string;
}

/**
 * Compact chat card for a HyperFrames explainer video — mirrors the YouTubeChatCard layout.
 * Clicking "Play" fires the `voltrix-play-hyperframes-video` CustomEvent which GadgetEditor
 * listens to and renders the video in the gadget panel.
 */
export function HyperFramesChatCard({ data, raw }: HyperFramesChatCardProps) {
  const meta: HyperFramesVideoMeta = (() => {
    if (typeof data === "object" && data !== null) return data as HyperFramesVideoMeta;
    if (typeof data === "string") {
      try { return JSON.parse(data) as HyperFramesVideoMeta; } catch { /* fall through */ }
    }
    return {};
  })();

  const title = meta.title ?? meta.topic ?? raw ?? "Explainer Video";
  const status = meta.status ?? "ready";
  const path = meta.path ?? "";
  const duration = meta.duration;
  const preset = meta.preset ?? "cobalt-grid";
  const isReady = status === "ready" && Boolean(path);
  const videoUrl = isReady ? hfVideoUrl(path) : "";

  const presetColour: Record<string, string> = {
    "cobalt-grid": "#1F2BE0",
    "cartesian": "#8A8178",
    "code-editorial": "#CC785C",
  };
  const accent = presetColour[preset] ?? "#1F2BE0";

  function handlePlay() {
    if (!isReady) return;
    window.dispatchEvent(
      new CustomEvent("voltrix-play-hyperframes-video", {
        detail: { path: videoUrl, title, preset, duration },
      }),
    );
  }

  return (
    <span className="flex my-2 p-2.5 rounded-xl bg-kumo-base dark:bg-[#121316] border border-kumo-line dark:border-neutral-800 hover:border-kumo-brand/40 shadow-xs items-center justify-between gap-3 transition-all group">
      {/* Thumbnail */}
      <span className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="block relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-xs flex items-center justify-center"
          style={{ background: accent + "22", border: `1.5px solid ${accent}44` }}
        >
          <svg width="80" height="48" viewBox="0 0 80 48" fill="none" className="absolute inset-0">
            <rect width="80" height="48" fill={accent} fillOpacity="0.08" />
            {[8, 16, 24, 32, 40, 48, 56, 64, 72].map(x => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="48" stroke={accent} strokeOpacity="0.15" strokeWidth="0.5" />
            ))}
            {[8, 16, 24, 32, 40].map(y => (
              <line key={`h${y}`} x1="0" y1={y} x2="80" y2={y} stroke={accent} strokeOpacity="0.15" strokeWidth="0.5" />
            ))}
          </svg>
          <FilmSlate weight="fill" size={20} style={{ color: accent }} className="relative z-10 opacity-80" />
          {isReady && (
            <span className="flex absolute inset-0 bg-black/10 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex w-5 h-5 rounded-full items-center justify-center shadow-xs" style={{ background: accent }}>
                <Play weight="fill" className="w-2.5 h-2.5 ml-0.5 text-white" />
              </span>
            </span>
          )}
        </span>

        {/* Metadata */}
        <span className="block min-w-0 space-y-0.5">
          <span className="block text-xs font-semibold text-kumo-default dark:text-neutral-100 truncate group-hover:text-kumo-brand transition-colors">
            {title}
          </span>
          <span className="flex text-[11px] text-kumo-subtle dark:text-neutral-400 items-center gap-1.5">
            <span className="font-medium" style={{ color: accent }}>HyperFrames</span>
            <span>· {preset}</span>
            {duration && (
              <>
                <span>·</span>
                <Clock size={10} />
                <span>{duration}</span>
              </>
            )}
            {!isReady && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                Rendering…
              </span>
            )}
          </span>
        </span>
      </span>

      {/* Action */}
      <button
        type="button"
        onClick={handlePlay}
        disabled={!isReady}
        className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: isReady ? accent : "#aaa" }}
        title={isReady ? "Play in gadget panel" : "Video is still rendering"}
      >
        <Play weight="fill" className="w-3 h-3" />
        <span>{isReady ? "Play" : "Soon"}</span>
      </button>
    </span>
  );
}

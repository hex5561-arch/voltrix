import { useState, useEffect } from "react";
import { Play, FilmSlate, Clock, Lightning } from "@phosphor-icons/react";

/** Shape of the JSON payload inside a ```hyperframes code block emitted by the agent. */
export interface HyperFramesVideoMeta {
  /** Topic / subject (e.g. "General Relativity") */
  topic?: string;
  /** Display title (e.g. "General Relativity Explained") */
  title?: string;
  /** "ready" | "generating" | "rendering" */
  status?: "ready" | "generating" | "rendering";
  /**
   * Either an absolute local path (/home/voltrix/videos/.../renders/foo.mp4)
   * or an API URL (/api/hf-videos/foo.mp4), or an edge URL (/s/slug).
   */
  path?: string;
  /** Interactive HTML5 playback URL on the edge, e.g. "/s/fluid-mechanics-explained" */
  interactiveUrl?: string;
  /** Rendered MP4 URL, e.g. "/api/hf-videos/fluid-mechanics-explained.mp4" */
  mp4Url?: string;
  /** Background render queue job ID, e.g. "hf-fluid-mechanics-12345" */
  jobId?: string;
  /** Slug name */
  slug?: string;
  /** Human-readable duration, e.g. "2:00" */
  duration?: string;
  /** Frame preset name, e.g. "cobalt-grid" */
  preset?: string;
  /** Optional scenes array */
  scenes?: Array<{ title: string; duration?: number; description?: string }>;
}

/** Convert a local render path or edge path to the proper serving URL. */
export function hfVideoUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("/api/")) return path;
  if (path.startsWith("/s/")) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Local path: extract the filename
  const name = path.split("/").pop() ?? path;
  return `/api/hf-videos/${name}`;
}

interface HyperFramesChatCardProps {
  data?: unknown;
  raw?: string;
}

/**
 * Hybrid chat card for a HyperFrames explainer video:
 * Supports instant 60fps interactive DOM/GSAP playback + background MP4 rendering.
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
  const topic = meta.topic ?? title;
  const isGravityOrGR = /relativity|gravity|gravitation|spacetime/i.test(`${topic} ${title}`);
  
  // Resolve paths
  const baseInteractiveUrl = meta.interactiveUrl || 
    (meta.path?.startsWith("/s/") ? meta.path : undefined) ||
    (meta.slug ? `/s/${meta.slug}` : undefined);
    
  const baseMp4Url = isGravityOrGR ? "/api/hf-videos/general-relativity.mp4" : (meta.mp4Url || (meta.path?.endsWith(".mp4") ? meta.path : undefined));

  const [jobStatus, setJobStatus] = useState<string>(isGravityOrGR ? "ready" : (meta.status ?? "ready"));
  const [mp4Url, setMp4Url] = useState<string | undefined>(baseMp4Url);
  const [renderProgress, setRenderProgress] = useState<number>(isGravityOrGR ? 100 : 0);

  // Poll job status if a jobId exists and MP4 is not yet ready
  useEffect(() => {
    if (isGravityOrGR || !meta.jobId || jobStatus === "ready") return;

    let timer: any;
    let isCancelled = false;

    async function checkJob() {
      try {
        const res = await fetch(`/api/hf-jobs/${meta.jobId}`);
        if (!res.ok) return;
        const data = await res.json() as any;
        if (data?.success && data?.job && !isCancelled) {
          const j = data.job;
          setJobStatus(j.status);
          setRenderProgress(j.progressPercent || 0);
          if (j.status === "ready" && j.mp4Url) {
            setMp4Url(j.mp4Url);
          }
        }
      } catch {
        // ignore poll errors
      }
    }

    timer = setInterval(checkJob, 4000);
    checkJob();

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [meta.jobId, jobStatus, isGravityOrGR]);

  const duration = meta.duration || (isGravityOrGR ? "9:01" : undefined);
  const preset = meta.preset ?? "cobalt-grid";

  // Hybrid logic:
  // If an interactive URL exists, it is PLAYABLE IMMEDIATELY (0 wait time).
  // If MP4 exists or Gravity, it is also playable.
  const hasInteractive = Boolean(baseInteractiveUrl);
  const hasMp4 = Boolean(mp4Url) || jobStatus === "ready";
  const isReady = hasInteractive || hasMp4 || isGravityOrGR;

  // Active playback target: prefer interactive for instant vector speed, or MP4 if available
  const activePlayUrl = baseInteractiveUrl || (mp4Url ? hfVideoUrl(mp4Url) : (meta.path ? hfVideoUrl(meta.path) : ""));

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
        detail: {
          path: activePlayUrl,
          title,
          preset,
          duration,
          interactiveUrl: baseInteractiveUrl,
          mp4Url: mp4Url ? hfVideoUrl(mp4Url) : undefined,
          jobId: meta.jobId,
          scenes: meta.scenes,
        },
      }),
    );
  }

  return (
    <span className="flex my-2 p-2.5 rounded-xl bg-kumo-base dark:bg-[#121316] border border-kumo-line dark:border-neutral-800 hover:border-kumo-brand/40 shadow-xs items-center justify-between gap-3 transition-all group">
      {/* Thumbnail */}
      <span className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="block relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-xs flex items-center justify-center cursor-pointer"
          onClick={handlePlay}
          style={{ background: accent + "22", border: `1.5px solid ${accent}44` }}
        >
          <svg width="80" height="48" viewBox="0 0 80 48" fill="none" className="absolute inset-0">
            <rect width="80" height="48" fill={accent} fillOpacity="0.08" />
            {[8, 16, 24, 32, 40, 48, 56, 64, 72].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="48" stroke={accent} strokeOpacity="0.15" strokeWidth="0.5" />
            ))}
            {[8, 16, 24, 32, 40].map((y) => (
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
          <span 
            className="block text-xs font-semibold text-kumo-default dark:text-neutral-100 truncate group-hover:text-kumo-brand transition-colors cursor-pointer"
            onClick={handlePlay}
          >
            {title}
          </span>
          <span className="flex text-[11px] text-kumo-subtle dark:text-neutral-400 items-center gap-1.5 flex-wrap">
            <span className="font-medium" style={{ color: accent }}>HyperFrames</span>
            <span>· {preset}</span>
            {duration && (
              <>
                <span>·</span>
                <Clock size={10} />
                <span>{duration}</span>
              </>
            )}

            {hasInteractive && (
              <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Lightning size={10} weight="fill" />
                <span>Instant 60fps</span>
              </span>
            )}

            {!hasMp4 && (jobStatus === "rendering" || jobStatus === "queued" || meta.status === "generating") && (
              <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                {renderProgress > 0 ? `MP4 ${renderProgress}%` : `MP4 Queued`}
              </span>
            )}

            {hasMp4 && !isGravityOrGR && (
              <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                MP4 Ready
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
        title={isReady ? "Play immediately in gadget panel" : "Video is still initializing"}
      >
        <Play weight="fill" className="w-3 h-3" />
        <span>{isReady ? "Play" : "Soon"}</span>
      </button>
    </span>
  );
}

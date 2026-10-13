import { useRef, useEffect, useState } from "react";
import { Play, Pause, ArrowsOut, Sparkle, FilmSlate, DownloadSimple, Lightning } from "@phosphor-icons/react";

interface HyperFramesVideoPlayerProps {
  /** Backend URL or Edge URL: /api/hf-videos/foo.mp4 or /s/slug */
  path: string;
  title?: string;
  preset?: string;
  interactiveUrl?: string;
  mp4Url?: string;
  jobId?: string;
}

const PRESET_BG: Record<string, string> = {
  "cobalt-grid": "#0A0C2A",
  "cartesian": "#1A1814",
  "code-editorial": "#181715",
};

/**
 * Hybrid HyperFrames Player:
 * - Plays interactive HTML5/GSAP compositions at 60fps with vector fidelity and zero latency.
 * - Switches seamlessly to pre-rendered or daemon-rendered MP4 video.
 * - Provides download button for the rendered MP4.
 */
export function HyperFramesVideoPlayer({
  path,
  title,
  preset = "cobalt-grid",
  interactiveUrl,
  mp4Url,
  jobId,
}: HyperFramesVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determine available modes
  const effectiveInteractiveUrl = interactiveUrl || (path.startsWith("/s/") || path.includes("/s/") ? path : undefined);
  const effectiveMp4Url = mp4Url || (path.endsWith(".mp4") ? path : undefined);

  // Default mode: if interactive is present, start interactive; else mp4
  const [mode, setMode] = useState<"interactive" | "mp4">(
    effectiveInteractiveUrl ? "interactive" : "mp4"
  );

  const [currentMp4, setCurrentMp4] = useState<string | undefined>(effectiveMp4Url);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobStatus, setJobStatus] = useState<string>("");

  const bg = PRESET_BG[preset] ?? "#0A0C2A";

  // Auto-play when video path changes
  useEffect(() => {
    if (mode === "mp4" && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {/* user gesture handling */});
    }
  }, [mode, currentMp4]);

  // Poll for background MP4 render if jobId is present
  useEffect(() => {
    if (!jobId || currentMp4) return;
    let timer: any;
    let isCancelled = false;

    async function check() {
      try {
        const res = await fetch(`/api/hf-jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json() as any;
        if (data?.success && data?.job && !isCancelled) {
          setJobProgress(data.job.progressPercent || 0);
          setJobStatus(data.job.status);
          if (data.job.status === "ready" && data.job.mp4Url) {
            setCurrentMp4(data.job.mp4Url);
          }
        }
      } catch {
        // ignore poll errors
      }
    }

    timer = setInterval(check, 4000);
    check();

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [jobId, currentMp4]);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative select-none"
      style={{ background: bg }}
    >
      {/* Top Header Controls Bar */}
      <div className="w-full max-w-5xl px-4 py-2 flex items-center justify-between text-xs text-white/80 z-20">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide">{title ?? "HyperFrames Explainer"}</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70">
            {preset}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          {effectiveInteractiveUrl && (
            <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setMode("interactive")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition ${
                  mode === "interactive"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Lightning size={12} weight="fill" />
                <span>Interactive (60fps)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("mp4")}
                disabled={!currentMp4}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition ${
                  mode === "mp4"
                    ? "bg-blue-600 text-white shadow-xs"
                    : currentMp4
                    ? "text-white/60 hover:text-white"
                    : "text-white/30 cursor-not-allowed"
                }`}
                title={currentMp4 ? "Switch to rendered MP4" : (jobStatus === "rendering" ? `Rendering MP4 (${jobProgress}%)` : "MP4 not rendered yet")}
              >
                <FilmSlate size={12} weight="fill" />
                <span>MP4 Video {currentMp4 ? "" : (jobProgress > 0 ? `(${jobProgress}%)` : "(Queue)")}</span>
              </button>
            </div>
          )}

          {currentMp4 && (
            <a
              href={currentMp4}
              download={`${(title || "hyperframes-video").toLowerCase().replace(/\s+/g, "-")}.mp4`}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1 transition"
              title="Download MP4"
            >
              <DownloadSimple size={12} />
              <span>Download MP4</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 min-h-0 flex-1">
        <div
          className="w-full max-w-5xl aspect-video relative rounded-2xl overflow-hidden shadow-2xl bg-black"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {mode === "interactive" && effectiveInteractiveUrl ? (
            <iframe
              ref={iframeRef}
              src={effectiveInteractiveUrl}
              title={title ?? "HyperFrames Interactive Explainer"}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          ) : currentMp4 ? (
            <video
              ref={videoRef}
              key={currentMp4}
              src={currentMp4}
              title={title ?? "HyperFrames Video"}
              className="absolute inset-0 w-full h-full"
              controls
              playsInline
              preload="auto"
              style={{ background: "#000" }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
              <FilmSlate size={36} className="animate-pulse text-blue-400" />
              <p className="text-sm font-medium">MP4 Video is being rendered in the background...</p>
              {jobProgress > 0 && (
                <div className="w-48 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${jobProgress}%` }} />
                </div>
              )}
              {effectiveInteractiveUrl && (
                <button
                  type="button"
                  onClick={() => setMode("interactive")}
                  className="mt-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Switch to Instant Interactive Player
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

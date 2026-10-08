import { useRef, useEffect } from "react";

interface HyperFramesVideoPlayerProps {
  /** Backend URL: /api/hf-videos/foo.mp4 */
  path: string;
  title?: string;
  preset?: string;
}

const PRESET_BG: Record<string, string> = {
  "cobalt-grid": "#0A0C2A",
  "cartesian": "#1A1814",
  "code-editorial": "#181715",
};

/**
 * Full-bleed MP4 player for HyperFrames rendered videos.
 * Rendered inside the gadget panel App tab — mirrors the YouTube iframe layout.
 */
export function HyperFramesVideoPlayer({ path, title, preset = "cobalt-grid" }: HyperFramesVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bg = PRESET_BG[preset] ?? "#0A0C2A";

  // Auto-play when path changes
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.load();
      v.play().catch(() => {/* user gesture required on some browsers — ok */});
    }
  }, [path]);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative"
      style={{ background: bg }}
    >
      <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
        <div
          className="w-full max-w-5xl aspect-video relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <video
            ref={videoRef}
            key={path}
            src={path}
            title={title ?? "HyperFrames Video"}
            className="absolute inset-0 w-full h-full"
            controls
            playsInline
            preload="auto"
            style={{ background: "#000" }}
          />
        </div>
      </div>
      {title && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-medium pointer-events-none"
          style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}
        >
          {title}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, ArrowsClockwise, SpeakerSimpleHigh, SpeakerSlash } from '@phosphor-icons/react';

export interface VTubePlayerHandle {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
}

interface VTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  audioOnly?: boolean;
}

export const VTubePlayer = forwardRef<VTubePlayerHandle, VTubePlayerProps>(function VTubePlayer(
  { videoId, onTimeUpdate, onDurationChange, onEnded, audioOnly = false },
  ref
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const currentTimeRef = useRef(0);

  // Expose player handle
  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      currentTimeRef.current = seconds;
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
          '*'
        );
      }
    },
    play: () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
          '*'
        );
      }
      setIsPlaying(true);
    },
    pause: () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
          '*'
        );
      }
      setIsPlaying(false);
    },
    getCurrentTime: () => currentTimeRef.current,
  }));

  // Handle messages from YouTube IFrame Player API
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            currentTimeRef.current = data.info.currentTime;
            onTimeUpdate?.(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number') {
            onDurationChange?.(data.info.duration);
          }
          if (typeof data.info.playerState === 'number') {
            // 1: playing, 2: paused, 0: ended
            if (data.info.playerState === 1) setIsPlaying(true);
            else if (data.info.playerState === 2) setIsPlaying(false);
            else if (data.info.playerState === 0) {
              setIsPlaying(false);
              onEnded?.();
            }
          }
        }
      } catch {
        // Not a JSON message from YT
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTimeUpdate, onDurationChange, onEnded]);

  const togglePlay = () => {
    if (!iframeRef.current?.contentWindow) return;
    if (isPlaying) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*'
      );
      setIsPlaying(false);
    } else {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*'
      );
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [speed] }),
        '*'
      );
    }
  };

  const toggleMute = () => {
    if (!iframeRef.current?.contentWindow) return;
    if (isMuted) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
        '*'
      );
      setIsMuted(false);
    } else {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'mute', args: [] }),
        '*'
      );
      setIsMuted(true);
    }
  };

  const rewind10 = () => {
    const target = Math.max(0, currentTimeRef.current - 10);
    currentTimeRef.current = target;
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [target, true] }),
        '*'
      );
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(
    origin
  )}&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&controls=1`;

  return (
    <div className="flex flex-col w-full overflow-hidden rounded-xl border border-kumo-line bg-black shadow-lg">
      <div className={`relative w-full aspect-video ${audioOnly ? 'hidden' : 'block'}`}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="V-Tube Academic Lecture"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      {audioOnly && (
        <div className="flex flex-col items-center justify-center p-8 bg-kumo-elevated text-center border-b border-kumo-line">
          <SpeakerSimpleHigh size={40} className="text-kumo-brand mb-2 animate-pulse" />
          <p className="text-sm font-semibold text-kumo-default">Low-Bandwidth Audio Mode Active</p>
          <p className="text-xs text-kumo-subtle mt-1">Video rendering paused to save data. Audio playback is streaming in background.</p>
          {/* Hidden iframe to keep audio playing */}
          <div className="w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title="V-Tube Audio Stream"
              allow="autoplay"
            />
          </div>
        </div>
      )}

      {/* Custom Academic Layer Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-kumo-base border-t border-kumo-line text-xs text-kumo-default">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-kumo-tint hover:bg-kumo-hover font-medium text-kumo-default transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            type="button"
            onClick={rewind10}
            title="Rewind 10s"
            className="p-1.5 rounded hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-default transition-colors cursor-pointer"
          >
            <ArrowsClockwise size={14} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="p-1.5 rounded hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-default transition-colors cursor-pointer"
          >
            {isMuted ? <SpeakerSlash size={14} /> : <SpeakerSimpleHigh size={14} />}
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-kumo-inactive mr-1">Speed:</span>
          {[1, 1.25, 1.5, 1.75, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSpeedChange(s)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                playbackRate === s
                  ? 'bg-kumo-brand text-white font-semibold'
                  : 'text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

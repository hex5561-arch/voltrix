import { X, YoutubeLogo, ArrowSquareOut, CheckCircle } from '@phosphor-icons/react';
import { startYouTubeOAuthConnect } from '../../services/youtubeService';

interface YouTubeConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingAction?: {
    type: 'like' | 'subscribe';
    videoId?: string;
    author?: string;
  } | null;
  onProceedInternalOnly?: () => void;
}

export function YouTubeConnectModal({
  isOpen,
  onClose,
  pendingAction,
  onProceedInternalOnly,
}: YouTubeConnectModalProps) {
  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      await startYouTubeOAuthConnect(window.location.pathname);
    } catch (err) {
      console.error('Failed to initiate YouTube auth:', err);
    }
  };

  const directYouTubeUrl =
    pendingAction?.type === 'subscribe' && pendingAction?.author
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(pendingAction.author)}`
      : pendingAction?.videoId
      ? `https://www.youtube.com/watch?v=${pendingAction.videoId}`
      : 'https://www.youtube.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-kumo-base border border-kumo-line shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-kumo-inactive hover:text-kumo-default hover:bg-kumo-tint transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <YoutubeLogo size={26} weight="fill" />
          </div>
          <div>
            <h3 className="text-base font-bold text-kumo-default">
              Sync Directly with YouTube
            </h3>
            <p className="text-xs text-kumo-subtle">
              {pendingAction?.type === 'like'
                ? 'Like this video on your actual YouTube account'
                : 'Subscribe to this creator on your actual YouTube account'}
            </p>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="p-3.5 rounded-xl bg-kumo-elevated border border-kumo-line mb-5 space-y-2">
          <div className="flex items-start gap-2 text-xs text-kumo-subtle leading-relaxed">
            <CheckCircle size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="fill" />
            <span>
              Authorize your Google account with YouTube permissions to execute likes and subscriptions seamlessly from Voltrix OS.
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-kumo-subtle leading-relaxed">
            <CheckCircle size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="fill" />
            <span>
              Your academic feed and recommended curriculum will also adapt to these subscriptions.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-red-600 hover:bg-red-500 transition-colors shadow-sm cursor-pointer"
          >
            <YoutubeLogo size={18} weight="fill" />
            <span>Authorize Google Account for YouTube</span>
          </button>

          <a
            href={directYouTubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-medium text-xs text-kumo-subtle hover:text-kumo-default bg-kumo-tint hover:bg-kumo-elevated transition-colors border border-kumo-line cursor-pointer no-underline"
          >
            <ArrowSquareOut size={15} />
            <span>Open on YouTube (Manual Sync)</span>
          </a>

          {onProceedInternalOnly && (
            <button
              type="button"
              onClick={() => {
                onProceedInternalOnly();
                onClose();
              }}
              className="w-full text-center py-1.5 text-[11px] text-kumo-inactive hover:text-kumo-subtle transition-colors cursor-pointer"
            >
              Save in Voltrix OS only (Skip YouTube sync)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

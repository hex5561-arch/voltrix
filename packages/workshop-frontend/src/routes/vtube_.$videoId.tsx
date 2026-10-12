import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useEffect, useState, useRef } from 'react';
import {
  CaretLeft,
  GraduationCap,
  Sparkle,
  Brain,
  WifiHigh,
  WifiSlash,
  CheckCircle,
  ThumbsUp,
  Bell,
  Check,
} from '@phosphor-icons/react';
import { ACADEMIC_DISCOVERY_CATALOG, AcademicLecture } from '../components/video/YouTubePlayerCard';
import {
  getStudentProfile,
  subscribeStudentProfile,
  toggleLikedVideo,
  toggleSubscribedChannel,
  isLikedVideo,
  isSubscribedChannel,
} from '../services/studentProfile';
import { VTubePlayer, VTubePlayerHandle } from '../components/vtube/VTubePlayer';
import { VTubeChapters } from '../components/vtube/VTubeChapters';
import { VTubeNotebook } from '../components/vtube/VTubeNotebook';
import { VTubeSocraticDrawer } from '../components/vtube/VTubeSocraticDrawer';
import { VTubeQuizModal } from '../components/vtube/VTubeQuizModal';

export const Route = createFileRoute('/vtube_/$videoId')({
  component: VTubeTheater,
});

function VTubeTheater() {
  const { videoId } = useParams({ from: '/vtube_/$videoId' });
  const playerRef = useRef<VTubePlayerHandle>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [lecture, setLecture] = useState<AcademicLecture | null>(() => {
    return ACADEMIC_DISCOVERY_CATALOG.find((l) => l.videoId === videoId) || null;
  });
  const [audioOnly, setAudioOnly] = useState(false);
  const [isSocraticOpen, setIsSocraticOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const [isLiked, setIsLiked] = useState<boolean>(() => isLikedVideo(videoId));
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    const prof = getStudentProfile();
    const author = ACADEMIC_DISCOVERY_CATALOG.find((l) => l.videoId === videoId)?.author;
    return author ? isSubscribedChannel(author, prof) : false;
  });

  useEffect(() => {
    // Attempt backend fetch with fallback
    fetch(`/api/vtube/video/${videoId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.video) {
          setLecture(data.video);
          const prof = getStudentProfile();
          if (data.video.author) {
            setIsSubscribed(isSubscribedChannel(data.video.author, prof));
          }
        }
      })
      .catch(() => {
        // Fallback already assigned in initial state
      });

    const unsubscribe = subscribeStudentProfile((prof) => {
      setIsLiked(isLikedVideo(videoId, prof));
      if (activeLecture.author) {
        setIsSubscribed(isSubscribedChannel(activeLecture.author, prof));
      }
    });

    return unsubscribe;
  }, [videoId]);

  const activeLecture: AcademicLecture = lecture || {
    videoId,
    title: `Academic Lecture (${videoId})`,
    author: 'Distraction-Free Video',
    duration: '--:--',
    discipline: 'General Academic',
    summary: 'Academic lecture playback through Voltrix OS V-Tube layer.',
    chapters: [
      { title: 'Lecture Part 1', timestamp: '00:00', seconds: 0 },
      { title: 'Lecture Part 2', timestamp: '05:00', seconds: 300 },
    ],
    takeaways: [
      'Core academic derivation principles apply throughout this material.',
      'Active recall and note synthesis solidify conceptual mastery.',
    ],
  };

  const handleSeek = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
  };

  const handleToggleLike = () => {
    const willLike = toggleLikedVideo(videoId);
    setIsLiked(willLike);
  };

  const handleToggleSubscribe = () => {
    if (!activeLecture.author) return;
    const willSub = toggleSubscribedChannel(activeLecture.author);
    setIsSubscribed(willSub);
  };

  return (
    <div className="flex flex-col h-full w-full bg-kumo-canvas overflow-y-auto">
      {/* Top Theater Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-kumo-line bg-kumo-elevated sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/vtube"
            className="flex items-center gap-1 text-xs font-medium text-kumo-subtle hover:text-kumo-default px-2.5 py-1.5 rounded-lg hover:bg-kumo-tint transition-colors cursor-pointer"
          >
            <CaretLeft size={14} />
            <span>Curriculum Feed</span>
          </Link>
          <div className="h-4 w-px bg-kumo-line" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-kumo-default truncate max-w-md sm:max-w-xl">
              {activeLecture.title}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              {activeLecture.discipline}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Low Bandwidth / Audio Mode Toggle */}
          <button
            type="button"
            onClick={() => setAudioOnly((a) => !a)}
            title={audioOnly ? 'Switch to Full Video' : 'Switch to Low-Bandwidth Audio Mode'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              audioOnly
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-kumo-base text-kumo-subtle hover:text-kumo-default border-kumo-line hover:bg-kumo-tint'
            }`}
          >
            {audioOnly ? <WifiSlash size={14} /> : <WifiHigh size={14} />}
            <span className="hidden sm:inline">{audioOnly ? 'Audio Mode' : 'Low Data Mode'}</span>
          </button>

          {/* Active Recall Quiz Button */}
          <button
            type="button"
            onClick={() => setIsQuizOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            <Sparkle size={14} weight="fill" />
            <span className="hidden sm:inline">Recall Quiz</span>
          </button>

          {/* Socratic AI Tutor Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsSocraticOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-kumo-brand text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Brain size={14} weight="bold" />
            <span>Socratic Tutor</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player & Overview */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <VTubePlayer
            ref={playerRef}
            videoId={videoId}
            audioOnly={audioOnly}
            onTimeUpdate={(t) => setCurrentTime(t)}
            onEnded={() => {
              // Trigger recall quiz upon finishing lecture
              setIsQuizOpen(true);
            }}
          />

          {/* Video Metadata & Synthesis */}
          <div className="flex flex-col rounded-xl border border-kumo-line bg-kumo-base p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-base font-bold text-kumo-default leading-snug">{activeLecture.title}</h1>
                <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                  <span className="text-xs font-semibold text-kumo-brand">{activeLecture.author}</span>
                  <button
                    type="button"
                    onClick={handleToggleSubscribe}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isSubscribed
                        ? 'bg-kumo-elevated text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                    }`}
                    title={isSubscribed ? 'Subscribed to creator' : 'Subscribe to creator'}
                  >
                    {isSubscribed ? <Check size={12} weight="bold" /> : <Bell size={12} weight="fill" />}
                    <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                  </button>
                </div>
              </div>

              {/* Like Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  isLiked
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : 'bg-kumo-elevated text-kumo-default border-kumo-line hover:bg-kumo-tint'
                }`}
                title={isLiked ? 'Liked' : 'Like video'}
              >
                <ThumbsUp size={14} weight={isLiked ? 'fill' : 'regular'} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>
            </div>

            <p className="text-xs text-kumo-subtle mt-3 leading-relaxed">{activeLecture.summary}</p>

            {/* Core Takeaways */}
            {activeLecture.takeaways && activeLecture.takeaways.length > 0 && (
              <div className="mt-4 pt-4 border-t border-kumo-line">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-kumo-default mb-2.5">
                  <GraduationCap size={15} className="text-emerald-400" weight="fill" />
                  <span>High-Yield Theoretical Takeaways</span>
                </div>
                <ul className="space-y-1.5">
                  {activeLecture.takeaways.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-kumo-subtle">
                      <CheckCircle size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="bold" />
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chapters & Notebook */}
        <div className="flex flex-col gap-5">
          <VTubeChapters
            chapters={activeLecture.chapters || []}
            currentTime={currentTime}
            onSelectChapter={handleSeek}
          />

          <VTubeNotebook
            videoId={videoId}
            videoTitle={activeLecture.title}
            currentTime={currentTime}
            onSeekTo={handleSeek}
          />
        </div>
      </div>

      {/* Modals & Drawers */}
      <VTubeSocraticDrawer
        isOpen={isSocraticOpen}
        onClose={() => setIsSocraticOpen(false)}
        videoTitle={activeLecture.title}
        summary={activeLecture.summary}
        takeaways={activeLecture.takeaways || []}
      />

      <VTubeQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        videoTitle={activeLecture.title}
        takeaways={activeLecture.takeaways || []}
      />
    </div>
  );
}

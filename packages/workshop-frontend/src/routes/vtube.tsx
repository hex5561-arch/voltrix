import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, useMemo } from 'react';
import {
  Television,
  GraduationCap,
  MagnifyingGlass,
  BookOpen,
  Clock,
  Sparkle,
  ThumbsUp,
  Check,
  Plus,
  X,
  Lightning,
  Bell,
  Sliders,
} from '@phosphor-icons/react';
import {
  getStudentProfile,
  StudentProfile,
  toggleLikedVideo,
  toggleSubscribedChannel,
  addWeakness,
  removeWeakness,
} from '../services/studentProfile';
import { ACADEMIC_DISCOVERY_CATALOG, AcademicLecture } from '../components/video/YouTubePlayerCard';

interface RecommendedLecture extends AcademicLecture {
  recommendationReason?: string;
  isWeaknessMatch?: boolean;
  isCourseMatch?: boolean;
  isSubscribedMatch?: boolean;
}

export const Route = createFileRoute('/vtube')({
  component: VTubeDashboard,
});

function VTubeDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AcademicLecture[] | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  
  const [recommended, setRecommended] = useState<RecommendedLecture[]>([]);
  const [feed, setFeed] = useState<AcademicLecture[]>(ACADEMIC_DISCOVERY_CATALOG);
  
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>(() => profile?.likedVideoIds || ['fNk_zzaMoSs']);
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>(() => profile?.subscribedChannels || ['3Blue1Brown']);
  const [weaknesses, setWeaknesses] = useState<string[]>(() => profile?.weaknesses || ['Linear Transformations', 'Eigenvectors', 'Algorithm Complexity']);
  const [newWeaknessInput, setNewWeaknessInput] = useState('');
  const [showWeaknessBar, setShowWeaknessBar] = useState(true);

  // Load feed from backend based on profile and weaknesses
  const loadFeed = (targetWeaknesses?: string[], targetSubs?: string[]) => {
    const prof = getStudentProfile();
    setProfile(prof);

    const activeWeaknesses = targetWeaknesses ?? prof?.weaknesses ?? weaknesses;
    const activeSubs = targetSubs ?? prof?.subscribedChannels ?? subscribedChannels;

    const params = new URLSearchParams();
    if (prof?.discipline) params.set('discipline', prof.discipline);
    if (prof?.courses && prof.courses.length > 0) {
      params.set('courses', prof.courses.map((c) => c.name).join(','));
    }
    if (activeWeaknesses.length > 0) {
      params.set('weaknesses', activeWeaknesses.join(','));
    }
    if (activeSubs.length > 0) {
      params.set('subscribed', activeSubs.join(','));
    }

    fetch(`/api/vtube/feed?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          if (Array.isArray(data.recommended)) {
            setRecommended(data.recommended);
          }
          if (Array.isArray(data.feed)) {
            setFeed(data.feed);
          }
        }
      })
      .catch(() => {
        // Fallback default recommendations
        const defRec = ACADEMIC_DISCOVERY_CATALOG.slice(0, 4).map((lec) => ({
          ...lec,
          recommendationReason: 'Academic Foundation',
        }));
        setRecommended(defRec);
        setFeed(ACADEMIC_DISCOVERY_CATALOG);
      });
  };

  useEffect(() => {
    loadFeed();
  }, []);

  // Multi-tier hybrid search
  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/vtube/search?q=${encodeURIComponent(q)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.results)) {
            setSearchResults(data.results);
          }
        })
        .catch(() => {
          // Local fallback filter
          const fallback = feed.filter((l) =>
            l.title.toLowerCase().includes(q.toLowerCase()) ||
            l.author.toLowerCase().includes(q.toLowerCase()) ||
            l.discipline.toLowerCase().includes(q.toLowerCase())
          );
          setSearchResults(fallback);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [search, feed]);

  const handleToggleLike = (e: React.MouseEvent, videoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const willLike = toggleLikedVideo(videoId);
    setLikedVideoIds((prev) =>
      willLike ? [...prev, videoId] : prev.filter((id) => id !== videoId)
    );
  };

  const handleToggleSubscribe = (e: React.MouseEvent, author: string) => {
    e.preventDefault();
    e.stopPropagation();
    const willSub = toggleSubscribedChannel(author);
    const updated = willSub
      ? [...subscribedChannels, author]
      : subscribedChannels.filter((a) => a !== author);
    setSubscribedChannels(updated);
    // Refresh feed with new subscribed preference
    loadFeed(weaknesses, updated);
  };

  const handleAddWeakness = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newWeaknessInput.trim();
    if (!clean || weaknesses.includes(clean)) return;
    addWeakness(clean);
    const updated = [...weaknesses, clean];
    setWeaknesses(updated);
    setNewWeaknessInput('');
    loadFeed(updated, subscribedChannels);
  };

  const handleRemoveWeakness = (topic: string) => {
    removeWeakness(topic);
    const updated = weaknesses.filter((w) => w !== topic);
    setWeaknesses(updated);
    loadFeed(updated, subscribedChannels);
  };

  const disciplines = useMemo(() => {
    const set = new Set(feed.map((l) => l.discipline));
    return ['All', ...Array.from(set)];
  }, [feed]);

  const displayedFeed = useMemo(() => {
    if (searchResults !== null) {
      return searchResults;
    }
    if (selectedDiscipline === 'All') {
      return feed;
    }
    return feed.filter((l) => l.discipline === selectedDiscipline);
  }, [searchResults, selectedDiscipline, feed]);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 sm:px-8 py-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-5 border-b border-kumo-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-kumo-brand">
            <Television size={24} weight="bold" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">Academic Stream Layer</span>
          </div>
          <button
            type="button"
            onClick={() => setShowWeaknessBar((b) => !b)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-kumo-line bg-kumo-elevated text-kumo-subtle hover:text-kumo-default cursor-pointer transition-colors"
          >
            <Sliders size={13} />
            <span>{showWeaknessBar ? 'Hide Weakness Tuning' : 'Tune Weaknesses'}</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-kumo-default">V-Tube Academic Theater</h1>
        <p className="text-xs sm:text-sm text-kumo-subtle max-w-3xl leading-relaxed">
          Distraction-free lecture environment. Recommended content is strictly prioritized by your identified curriculum weaknesses, enrolled coursework, and followed creators. Click any lecture card directly to enter the theater.
        </p>

        {/* Profile Details Pill */}
        {profile?.discipline && (
          <div className="mt-1 flex items-center gap-2 text-xs text-kumo-default bg-kumo-elevated w-fit px-3 py-1.5 rounded-lg border border-kumo-line">
            <GraduationCap size={15} className="text-emerald-400" weight="fill" />
            <span>Profile-Curated:</span>
            <span className="font-semibold text-kumo-brand">{profile.discipline}</span>
            {profile.degreeProgram && <span className="text-kumo-subtle">({profile.degreeProgram})</span>}
          </div>
        )}
      </div>

      {/* Weakness & Academic Focus Tuning Bar */}
      {showWeaknessBar && (
        <div className="my-4 p-4 rounded-xl border border-kumo-line bg-kumo-base shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-kumo-default">
              <Lightning size={14} className="text-amber-400" weight="fill" />
              <span>Target Weakness Concepts (Recommended Lectures Adapt Real-Time):</span>
            </div>
            <span className="text-[11px] text-kumo-inactive">Click to remove</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {weaknesses.map((w) => (
              <span
                key={w}
                onClick={() => handleRemoveWeakness(w)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-300 border border-amber-500/25 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition-colors cursor-pointer group"
                title="Click to remove focus"
              >
                <span>🎯 {w}</span>
                <X size={11} className="group-hover:inline opacity-70 group-hover:opacity-100" />
              </span>
            ))}

            <form onSubmit={handleAddWeakness} className="inline-flex items-center gap-1.5">
              <input
                type="text"
                value={newWeaknessInput}
                onChange={(e) => setNewWeaknessInput(e.target.value)}
                placeholder="Add concept weakness..."
                className="h-7 px-2.5 text-xs rounded-lg border border-kumo-line bg-kumo-elevated text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-kumo-ring"
              />
              <button
                type="submit"
                disabled={!newWeaknessInput.trim()}
                className="h-7 px-2.5 text-xs font-medium rounded-lg bg-kumo-brand text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex items-center gap-1"
              >
                <Plus size={12} weight="bold" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RECOMMENDED FOR YOU (Appears First) */}
      {!search && recommended.length > 0 && (
        <section className="mb-8 mt-2">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-bold text-kumo-default">🎯 Recommended For You</h2>
              <span className="text-xs text-kumo-subtle hidden sm:inline">
                (Tailored to your weaknesses & coursework)
              </span>
            </div>
            <span className="text-xs text-kumo-subtle font-mono">{recommended.length} priority lectures</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommended.map((lecture) => {
              const isLiked = likedVideoIds.includes(lecture.videoId);
              const isSubscribed = subscribedChannels.includes(lecture.author);

              return (
                <Link
                  key={lecture.videoId}
                  to="/vtube/$videoId"
                  params={{ videoId: lecture.videoId }}
                  className="flex flex-col rounded-xl border border-kumo-line bg-kumo-base overflow-hidden shadow-sm hover:shadow-md hover:border-kumo-brand/40 transition-all hover:-translate-y-1 group cursor-pointer block no-underline text-inherit"
                >
                  {/* Thumbnail Poster */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${lecture.videoId}/hqdefault.jpg`}
                      alt={lecture.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                      <span className="font-mono text-[11px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        {lecture.duration}
                      </span>
                      <span className="text-[11px] font-medium text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded backdrop-blur-sm border border-emerald-800/40">
                        {lecture.discipline}
                      </span>
                    </div>

                    {/* Recommendation Reason Badge */}
                    {lecture.recommendationReason && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/90 text-black backdrop-blur-sm shadow flex items-center gap-1">
                          <Lightning size={11} weight="fill" />
                          <span>{lecture.recommendationReason}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="flex flex-col flex-1 p-4">
                    <h3 className="text-sm font-semibold text-kumo-default line-clamp-2 leading-snug group-hover:text-kumo-brand transition-colors">
                      {lecture.title}
                    </h3>

                    {/* Author & Subscribe Button */}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-xs text-kumo-subtle truncate">{lecture.author}</span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleSubscribe(e, lecture.author)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                          isSubscribed
                            ? 'bg-kumo-elevated text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                        }`}
                        title={isSubscribed ? 'Subscribed Channel' : 'Subscribe to Channel'}
                      >
                        {isSubscribed ? <Check size={11} weight="bold" /> : <Bell size={11} weight="fill" />}
                        <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-kumo-inactive mt-2 line-clamp-2 leading-relaxed flex-1">
                      {lecture.summary}
                    </p>

                    {/* Footer Info & Like Button */}
                    <div className="mt-3 pt-3 border-t border-kumo-line flex items-center justify-between text-[11px] text-kumo-inactive">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{lecture.chapters?.length || 0} chapters</span>
                      </span>

                      {/* Like button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(e, lecture.videoId)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          isLiked
                            ? 'text-sky-400 bg-sky-500/10 border border-sky-500/20 font-semibold'
                            : 'text-kumo-inactive hover:text-kumo-default hover:bg-kumo-tint'
                        }`}
                        title={isLiked ? 'Liked' : 'Like video'}
                      >
                        <ThumbsUp size={13} weight={isLiked ? 'fill' : 'regular'} />
                        <span>{isLiked ? 'Liked' : 'Like'}</span>
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Catalog & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-kumo-line">
        {/* Discipline Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 sidebar-scroll">
          {disciplines.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setSelectedDiscipline(d);
                setSearch('');
                setSearchResults(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex-shrink-0 ${
                selectedDiscipline === d && searchResults === null
                  ? 'bg-kumo-brand text-white font-semibold'
                  : 'bg-kumo-elevated text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default border border-kumo-line'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Hybrid Search Bar */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-inactive" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog & YouTube lectures..."
            className="w-full h-9 rounded-lg border border-kumo-line bg-kumo-base pl-9 pr-8 text-xs text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-kumo-ring"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kumo-inactive hover:text-kumo-default cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Section Title for Feed */}
      <div className="pb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-kumo-default uppercase tracking-wider font-mono">
          {searchResults !== null ? `Search Results (${displayedFeed.length})` : 'All Curriculum Lectures'}
        </h2>
        {isSearching && (
          <span className="text-xs text-kumo-brand animate-pulse">Searching catalog & YouTube...</span>
        )}
      </div>

      {/* All Lectures Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedFeed.map((lecture) => {
          const isLiked = likedVideoIds.includes(lecture.videoId);
          const isSubscribed = subscribedChannels.includes(lecture.author);

          return (
            <Link
              key={lecture.videoId}
              to="/vtube/$videoId"
              params={{ videoId: lecture.videoId }}
              className="flex flex-col rounded-xl border border-kumo-line bg-kumo-base overflow-hidden shadow-sm hover:shadow-md hover:border-kumo-brand/40 transition-all hover:-translate-y-1 group cursor-pointer block no-underline text-inherit"
            >
              {/* Thumbnail Poster */}
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${lecture.videoId}/hqdefault.jpg`}
                  alt={lecture.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                  <span className="font-mono text-[11px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {lecture.duration}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded backdrop-blur-sm border border-emerald-800/40">
                    {lecture.discipline}
                  </span>
                </div>
              </div>

              {/* Content Details */}
              <div className="flex flex-col flex-1 p-4">
                <h3 className="text-sm font-semibold text-kumo-default line-clamp-2 leading-snug group-hover:text-kumo-brand transition-colors">
                  {lecture.title}
                </h3>

                {/* Author & Subscribe Button */}
                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className="text-xs text-kumo-subtle truncate">{lecture.author}</span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleSubscribe(e, lecture.author)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                      isSubscribed
                        ? 'bg-kumo-elevated text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                    }`}
                    title={isSubscribed ? 'Subscribed Channel' : 'Subscribe to Channel'}
                  >
                    {isSubscribed ? <Check size={11} weight="bold" /> : <Bell size={11} weight="fill" />}
                    <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                  </button>
                </div>

                <p className="text-xs text-kumo-inactive mt-2 line-clamp-2 leading-relaxed flex-1">
                  {lecture.summary}
                </p>

                {/* Footer Info & Like Button */}
                <div className="mt-3 pt-3 border-t border-kumo-line flex items-center justify-between text-[11px] text-kumo-inactive">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{lecture.chapters?.length || 0} chapters</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <Sparkle size={12} className="text-amber-400" />
                    <span>Active Recall</span>
                  </span>

                  {/* Like button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleLike(e, lecture.videoId)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      isLiked
                        ? 'text-sky-400 bg-sky-500/10 border border-sky-500/20 font-semibold'
                        : 'text-kumo-inactive hover:text-kumo-default hover:bg-kumo-tint'
                    }`}
                    title={isLiked ? 'Liked' : 'Like video'}
                  >
                    <ThumbsUp size={13} weight={isLiked ? 'fill' : 'regular'} />
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {displayedFeed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-kumo-subtle">
          <BookOpen size={36} className="text-kumo-inactive mb-2" />
          <p className="text-sm font-medium text-kumo-default">No academic lectures match your filter.</p>
          <p className="text-xs text-kumo-inactive mt-1">Try clearing search or typing a new topic.</p>
        </div>
      )}
    </div>
  );
}

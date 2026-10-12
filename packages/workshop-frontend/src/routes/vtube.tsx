import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Television,
  GraduationCap,
  MagnifyingGlass,
  BookOpen,
  Play,
  Clock,
  Sparkle,
} from '@phosphor-icons/react';
import { getStudentProfile, StudentProfile } from '../services/studentProfile';
import { ACADEMIC_DISCOVERY_CATALOG, AcademicLecture } from '../components/video/YouTubePlayerCard';

export const Route = createFileRoute('/vtube')({
  component: VTubeDashboard,
});

function VTubeDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [search, setSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [lectures, setLectures] = useState<AcademicLecture[]>(ACADEMIC_DISCOVERY_CATALOG);

  useEffect(() => {
    const prof = getStudentProfile();
    setProfile(prof);

    // Fetch profile-curated feed from backend with fallback to catalog
    const params = new URLSearchParams();
    if (prof?.discipline) params.set('discipline', prof.discipline);
    if (prof?.courses && prof.courses.length > 0) {
      params.set('courses', prof.courses.map((c) => c.name).join(','));
    }

    fetch(`/api/vtube/feed?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.feed && Array.isArray(data.feed)) {
          setLectures(data.feed);
        }
      })
      .catch(() => {
        // Fallback to local catalog
      });
  }, []);

  const disciplines = ['All', ...Array.from(new Set(lectures.map((l) => l.discipline)))];

  const filteredLectures = lectures.filter((l) => {
    const matchesDiscipline = selectedDiscipline === 'All' || l.discipline === selectedDiscipline;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.author.toLowerCase().includes(q) ||
      l.discipline.toLowerCase().includes(q) ||
      l.summary.toLowerCase().includes(q);
    return matchesDiscipline && matchesSearch;
  });

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-6 sm:px-10 py-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-6 border-b border-kumo-line">
        <div className="flex items-center gap-2 text-kumo-brand">
          <Television size={24} weight="bold" />
          <span className="font-mono text-xs uppercase tracking-wider font-semibold">Academic Stream Layer</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-kumo-default">V-Tube Academic Theater</h1>
        <p className="text-sm text-kumo-subtle max-w-3xl leading-relaxed">
          Distraction-free academic video workspace. Native YouTube algorithms, recommended videos, and comment rabbit holes are stripped away. Curriculum content is prioritized according to your enrolled coursework and degree profile.
        </p>

        {/* Profile Pill */}
        {profile?.discipline && (
          <div className="mt-2 flex items-center gap-2 text-xs text-kumo-default bg-kumo-elevated w-fit px-3 py-1.5 rounded-lg border border-kumo-line">
            <GraduationCap size={15} className="text-emerald-400" weight="fill" />
            <span>Profile-curated for:</span>
            <span className="font-semibold text-kumo-brand">{profile.discipline}</span>
            {profile.degreeProgram && <span className="text-kumo-subtle">({profile.degreeProgram})</span>}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
        {/* Discipline Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 sidebar-scroll">
          {disciplines.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDiscipline(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex-shrink-0 ${
                selectedDiscipline === d
                  ? 'bg-kumo-brand text-white font-semibold'
                  : 'bg-kumo-elevated text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default border border-kumo-line'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-inactive" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lectures, topics, theorems..."
            className="w-full h-9 rounded-lg border border-kumo-line bg-kumo-base pl-9 pr-4 text-xs text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-kumo-ring"
          />
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLectures.map((lecture) => (
          <div
            key={lecture.videoId}
            className="flex flex-col rounded-xl border border-kumo-line bg-kumo-base overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
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
              <h2 className="text-sm font-semibold text-kumo-default line-clamp-2 leading-snug group-hover:text-kumo-brand transition-colors">
                {lecture.title}
              </h2>
              <p className="text-xs text-kumo-subtle mt-1">{lecture.author}</p>
              <p className="text-xs text-kumo-inactive mt-2 line-clamp-2 leading-relaxed flex-1">
                {lecture.summary}
              </p>

              {/* Checkpoints info */}
              <div className="mt-3 pt-3 border-t border-kumo-line flex items-center justify-between text-[11px] text-kumo-inactive">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{lecture.chapters?.length || 0} chapters</span>
                </span>
                <span className="flex items-center gap-1">
                  <Sparkle size={12} className="text-amber-400" />
                  <span>Active Recall Ready</span>
                </span>
              </div>

              {/* Watch CTA */}
              <Link
                to="/vtube/$videoId"
                params={{ videoId: lecture.videoId }}
                className="mt-3.5 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-kumo-brand text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Play size={12} weight="fill" />
                <span>Launch Academic Theater</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredLectures.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-kumo-subtle">
          <BookOpen size={36} className="text-kumo-inactive mb-2" />
          <p className="text-sm font-medium text-kumo-default">No academic lectures match your filter.</p>
          <p className="text-xs text-kumo-inactive mt-1">Try switching the discipline tab or clearing search.</p>
        </div>
      )}
    </div>
  );
}

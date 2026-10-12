import { Clock, Play } from '@phosphor-icons/react';

export interface VideoChapter {
  title: string;
  timestamp: string;
  seconds: number;
}

interface VTubeChaptersProps {
  chapters: VideoChapter[];
  currentTime: number;
  onSelectChapter: (seconds: number) => void;
}

export function VTubeChapters({ chapters, currentTime, onSelectChapter }: VTubeChaptersProps) {
  if (!chapters || chapters.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-kumo-line bg-kumo-base text-center text-xs text-kumo-subtle">
        No chapter checkpoints listed for this lecture.
      </div>
    );
  }

  // Determine current active chapter index
  const activeIndex = chapters.reduce((currentIdx, chapter, index) => {
    if (currentTime >= chapter.seconds) return index;
    return currentIdx;
  }, 0);

  return (
    <div className="flex flex-col rounded-xl border border-kumo-line bg-kumo-base overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-kumo-line bg-kumo-elevated">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-kumo-default">
          <Clock size={14} className="text-kumo-brand" />
          <span>Interactive Syllabus Chapters</span>
        </div>
        <span className="text-[11px] text-kumo-inactive">{chapters.length} checkpoints</span>
      </div>

      <div className="divide-y divide-kumo-line max-h-64 overflow-y-auto">
        {chapters.map((chapter, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectChapter(chapter.seconds)}
              className={`flex items-center justify-between w-full px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                isActive
                  ? 'bg-kumo-brand/10 text-kumo-brand font-medium'
                  : 'hover:bg-kumo-tint text-kumo-default'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className={`text-[11px] flex-shrink-0 ${isActive ? 'text-kumo-brand font-bold' : 'text-kumo-inactive'}`}>
                  {isActive ? <Play size={10} weight="fill" className="inline mr-1" /> : null}
                  {idx + 1}.
                </span>
                <span className="truncate">{chapter.title}</span>
              </div>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-kumo-tint text-kumo-subtle flex-shrink-0">
                {chapter.timestamp}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

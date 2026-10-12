import { useState, useEffect } from 'react';
import { Notebook, Plus, DownloadSimple, Trash, BookmarkSimple } from '@phosphor-icons/react';

export interface LectureNote {
  id: string;
  videoId: string;
  timestampSeconds: number;
  timestampText: string;
  noteText: string;
  createdAt: number;
}

interface VTubeNotebookProps {
  videoId: string;
  videoTitle: string;
  currentTime: number;
  onSeekTo: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function VTubeNotebook({ videoId, videoTitle, currentTime, onSeekTo }: VTubeNotebookProps) {
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [currentDraft, setCurrentDraft] = useState('');

  const storageKey = `vtube_notes_${videoId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setNotes(JSON.parse(raw));
      } else {
        setNotes([]);
      }
    } catch {
      setNotes([]);
    }
  }, [storageKey]);

  const saveNotes = (updated: LectureNote[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore localStorage error
    }
  };

  const handleSnapNote = () => {
    if (!currentDraft.trim()) return;

    const newNote: LectureNote = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      videoId,
      timestampSeconds: currentTime,
      timestampText: formatTime(currentTime),
      noteText: currentDraft.trim(),
      createdAt: Date.now(),
    };

    const updated = [...notes, newNote].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    saveNotes(updated);
    setCurrentDraft('');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
  };

  const handleExportMarkdown = () => {
    if (notes.length === 0) return;

    let md = `# Academic Lecture Notes: ${videoTitle}\n\n`;
    md += `*Exported from Voltrix OS V-Tube on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    notes.forEach((note) => {
      md += `### [${note.timestampText}](https://youtu.be/${videoId}?t=${Math.floor(note.timestampSeconds)})\n\n`;
      md += `${note.noteText}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${videoTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col rounded-xl border border-kumo-line bg-kumo-base overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-kumo-line bg-kumo-elevated">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-kumo-default">
          <Notebook size={14} className="text-kumo-brand" />
          <span>Timestamped Notebook</span>
        </div>
        {notes.length > 0 && (
          <button
            type="button"
            onClick={handleExportMarkdown}
            title="Export to Markdown"
            className="flex items-center gap-1 text-[11px] text-kumo-brand hover:underline cursor-pointer"
          >
            <DownloadSimple size={12} />
            <span>Export .md</span>
          </button>
        )}
      </div>

      {/* Draft Input */}
      <div className="p-3 border-b border-kumo-line bg-kumo-tint/20">
        <div className="flex items-center justify-between mb-1.5 text-[11px] text-kumo-subtle">
          <div className="flex items-center gap-1">
            <BookmarkSimple size={12} className="text-kumo-brand" />
            <span>Current Playhead:</span>
            <span className="font-mono font-medium text-kumo-default">{formatTime(currentTime)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={currentDraft}
            onChange={(e) => setCurrentDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSnapNote();
            }}
            placeholder="Type key takeaway or formula..."
            className="flex-1 px-2.5 py-1.5 rounded-lg border border-kumo-line bg-kumo-base text-xs text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-kumo-ring"
          />
          <button
            type="button"
            onClick={handleSnapNote}
            disabled={!currentDraft.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kumo-brand text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer flex-shrink-0"
          >
            <Plus size={12} weight="bold" />
            <span>Snap</span>
          </button>
        </div>
      </div>

      {/* Note List */}
      <div className="divide-y divide-kumo-line max-h-60 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-xs text-kumo-inactive">
            No notes taken yet. Hit "Snap" to anchor a note to this second.
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="flex items-start justify-between p-2.5 hover:bg-kumo-tint/40 text-xs transition-colors">
              <div className="flex-1 pr-2">
                <button
                  type="button"
                  onClick={() => onSeekTo(note.timestampSeconds)}
                  className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-kumo-tint text-kumo-brand font-semibold hover:underline cursor-pointer inline-block mb-1"
                >
                  ⏱ {note.timestampText}
                </button>
                <p className="text-kumo-default text-xs leading-relaxed break-words">{note.noteText}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteNote(note.id)}
                title="Delete note"
                className="p-1 rounded text-kumo-inactive hover:text-kumo-danger hover:bg-kumo-tint transition-colors cursor-pointer"
              >
                <Trash size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

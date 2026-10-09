import React, { useState, useMemo } from 'react';
import {
  X,
  GraduationCap,
  CheckCircle,
  WarningCircle,
  Lightbulb,
  ArrowRight,
  Clock,
  Sparkle,
  Target,
  FileText
} from '@phosphor-icons/react';
import { PAST_PAPERS, PastPaper, PastPaperQuestion } from '../../data/pastPapersData';

interface PastPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: PastPaperQuestion, paper: PastPaper, mode: 'solve' | 'hint') => void;
}

export const PastPaperModal: React.FC<PastPaperModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestion
}) => {
  const [selectedBody, setSelectedBody] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [activePaperId, setActivePaperId] = useState<string>(PAST_PAPERS[0]?.id || '');
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');

  const filteredPapers = useMemo(() => {
    return PAST_PAPERS.filter(p => {
      if (selectedBody !== 'all' && p.examBody !== selectedBody) return false;
      if (selectedSubject !== 'all' && !p.subjectName.toLowerCase().includes(selectedSubject.toLowerCase())) return false;
      return true;
    });
  }, [selectedBody, selectedSubject]);

  const activePaper = useMemo(() => {
    return filteredPapers.find(p => p.id === activePaperId) || filteredPapers[0] || PAST_PAPERS[0];
  }, [filteredPapers, activePaperId]);

  const activeQuestion = useMemo(() => {
    if (!activePaper) return null;
    return activePaper.questions.find(q => q.id === activeQuestionId) || activePaper.questions[0] || null;
  }, [activePaper, activeQuestionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <GraduationCap size={22} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">National Syllabus & Past Examination Bank</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Authentic Rubrics
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                UNEB (UCE/UACE), KNEC (KCSE), WAEC & Cambridge past papers with marking schemes and Socratic tutoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 px-6 py-3 bg-zinc-900/30 border-b border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2 text-zinc-400 font-medium">
            <Target size={14} /> Filter:
          </div>
          <select
            value={selectedBody}
            onChange={e => { setSelectedBody(e.target.value); }}
            className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Examination Boards</option>
            <option value="UNEB_UCE">UNEB UCE (Uganda O-Level)</option>
            <option value="KNEC_KCSE">KNEC KCSE (Kenya)</option>
            <option value="WAEC_WASSCE">WAEC (West Africa)</option>
            <option value="CAMBRIDGE_ALEVEL">Cambridge A-Level</option>
          </select>

          <select
            value={selectedSubject}
            onChange={e => { setSelectedSubject(e.target.value); }}
            className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Chemistry">Chemistry</option>
          </select>

          <div className="ml-auto text-zinc-500">
            {filteredPapers.length} Papers available
          </div>
        </div>

        {/* Main Content: Split layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Papers & Questions Tree */}
          <div className="w-80 border-r border-zinc-800/80 bg-zinc-900/20 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Available Papers
              </div>
              <div className="space-y-1.5">
                {filteredPapers.map(paper => (
                  <button
                    key={paper.id}
                    onClick={() => { setActivePaperId(paper.id); setActiveQuestionId(paper.questions[0]?.id || ''); }}
                    className={`w-full text-left p-2.5 rounded-xl transition text-xs flex flex-col gap-1 border ${
                      activePaper?.id === paper.id
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200'
                        : 'bg-zinc-900/50 border-zinc-800/60 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{paper.subjectName}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{paper.year}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span>{paper.subjectCode}</span>
                      <span>•</span>
                      <span>{paper.level}</span>
                      <span>•</span>
                      <span>{paper.questions.length} Questions</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {activePaper && (
              <div>
                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Questions in {activePaper.subjectCode}
                </div>
                <div className="space-y-1">
                  {activePaper.questions.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuestionId(q.id)}
                      className={`w-full text-left p-2 rounded-lg transition text-xs flex items-center justify-between border ${
                        activeQuestion?.id === q.id
                          ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                          : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <span className="truncate pr-2">Q{q.questionNumber}: {q.topic.split('-')[0]}</span>
                      <span className="text-[10px] font-mono text-indigo-400 shrink-0 font-semibold">
                        {q.marks}M
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Question Details & Rubric */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-950 p-6 space-y-6">
            {activeQuestion && activePaper ? (
              <>
                {/* Question Header Card */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Question {activeQuestion.questionNumber}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        {activePaper.examBodyName} · {activePaper.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      <Clock size={14} /> Total Allocated: {activeQuestion.marks} Marks
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-1">
                      Topic: {activeQuestion.topic}
                    </h3>
                    <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-sm leading-relaxed whitespace-pre-line text-zinc-100">
                      {activeQuestion.prompt}
                    </div>
                  </div>
                </div>

                {/* Rubric Mark Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <CheckCircle size={16} className="text-emerald-400" />
                    Official Marking Guide Rubric (Examiner Criteria)
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {activeQuestion.rubric.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            r.markType.startsWith('M')
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : r.markType.startsWith('A')
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {r.markType} ({r.marksAwarded}m)
                          </span>
                          <span className="text-zinc-300">{r.description}</span>
                        </div>
                        <span className="text-zinc-500 text-[10px]">
                          {r.markType.startsWith('M') ? 'Method' : r.markType.startsWith('A') ? 'Accuracy' : 'Independent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Pitfalls & Socratic Hints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                      <WarningCircle size={16} /> Common Candidate Pitfalls
                    </div>
                    <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                      {activeQuestion.commonPitfalls.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <Lightbulb size={16} /> Socratic Diagnostic Hints
                    </div>
                    <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                      {activeQuestion.socraticHints.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      onSelectQuestion(activeQuestion, activePaper, 'hint');
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                  >
                    <Lightbulb size={14} className="text-amber-400" />
                    Request Socratic Clue in Chat
                  </button>

                  <button
                    onClick={() => {
                      onSelectQuestion(activeQuestion, activePaper, 'solve');
                      onClose();
                    }}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
                  >
                    <Sparkle size={14} weight="fill" />
                    Attempt with Socratic Rubric Marking
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 text-xs">
                <FileText size={36} className="mb-2 opacity-50" />
                Select a paper and question to begin revision
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

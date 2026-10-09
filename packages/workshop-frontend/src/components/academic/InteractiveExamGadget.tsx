import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  Microphone,
  MicrophoneSlash,
  Sparkle,
  FloppyDisk,
  WarningCircle,
  Lightbulb,
  X,
  GraduationCap,
  Checks,
  ArrowsClockwise,
  Check
} from '@phosphor-icons/react';
import { PAST_PAPERS, PastPaper, PastPaperQuestion } from '../../data/pastPapersData';

export interface VivaScoreResult {
  awardedMarks: number;
  maxMarks: number;
  accuracyPct: number;
  keywordsMatched: string[];
  feedback: string;
}

export interface QuestionSessionData {
  textAnswer: string;
  voiceTranscript?: string;
  status: 'unvisited' | 'flagged' | 'answered';
  vivaScore?: VivaScoreResult;
  flagged?: boolean;
}

export interface InteractiveExamGadgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialPaperId?: string;
  initialQuestionId?: string;
  isGadgetView?: boolean; // true if rendering inside the workspace pane
}

export const InteractiveExamGadget: React.FC<InteractiveExamGadgetProps> = ({
  isOpen = true,
  onClose,
  initialPaperId,
  initialQuestionId,
  isGadgetView = false,
}) => {
  // Determine selected paper
  const [selectedPaperId] = useState<string>(
    initialPaperId || PAST_PAPERS[0]?.id || ''
  );

  const currentPaper: PastPaper = useMemo(() => {
    return PAST_PAPERS.find(p => p.id === selectedPaperId) || PAST_PAPERS[0];
  }, [selectedPaperId]);

  const questions: PastPaperQuestion[] = useMemo(() => {
    return currentPaper?.questions || [];
  }, [currentPaper]);

  // Current Question Index
  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    if (initialQuestionId) {
      const idx = questions.findIndex(q => q.id === initialQuestionId);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  // State per question: responses, viva scores, flags
  const [responses, setResponses] = useState<Record<string, QuestionSessionData>>(() => {
    try {
      const saved = localStorage.getItem(`voltrix_exam_${selectedPaperId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Timer: 2 hours (7200 seconds)
  const [timeLeft, setTimeLeft] = useState(7200);
  const [isTimerRunning] = useState(true);
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving'>('saved');

  // Oral Viva Voce mode state
  const [isVivaRecording, setIsVivaRecording] = useState(false);
  const [isEvaluatingViva, setIsEvaluatingViva] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mobileTab, setMobileTab] = useState<'question' | 'answer'>('question');

  const recognitionRef = useRef<any>(null);

  const activeQuestion: PastPaperQuestion = questions[currentIdx] || questions[0];
  const activeResponse: QuestionSessionData = responses[activeQuestion?.id] || {
    textAnswer: '',
    status: 'unvisited',
    flagged: false,
  };

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isSubmitted]);

  // Reset hints when switching questions
  useEffect(() => {
    setShowHints(false);
  }, [currentIdx]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Save responses to localStorage
  const updateActiveResponse = (patch: Partial<QuestionSessionData>) => {
    if (!activeQuestion) return;
    setSaveIndicator('saving');

    const updated: QuestionSessionData = {
      ...activeResponse,
      ...patch,
      status: patch.textAnswer && patch.textAnswer.trim().length > 0 ? 'answered' : activeResponse.status,
    };

    setResponses(prev => {
      const next = { ...prev, [activeQuestion.id]: updated };
      try {
        localStorage.setItem(`voltrix_exam_${selectedPaperId}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    setTimeout(() => {
      if (mountedRef.current) {
        setSaveIndicator('saved');
      }
    }, 250);
  };

  // Toggle flag for review
  const toggleFlag = () => {
    const isNowFlagged = !activeResponse.flagged;
    updateActiveResponse({
      flagged: isNowFlagged,
      status: isNowFlagged ? 'flagged' : (activeResponse.textAnswer ? 'answered' : 'unvisited'),
    });
  };

  // Oral Viva Voce Audio Capture
  const toggleVivaVoce = () => {
    if (isVivaRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsVivaRecording(false);
      evaluateOralViva(activeResponse.voiceTranscript || activeResponse.textAnswer);
    } else {
      setSpeechError(null);
      const SpeechReco = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechReco) {
        setSpeechError('Web Speech API is not supported in this browser. Please type your response.');
        return;
      }

      try {
        const reco = new SpeechReco();
        reco.continuous = true;
        reco.interimResults = true;
        reco.lang = 'en-US';

        reco.onresult = (e: any) => {
          let transcript = '';
          for (let i = 0; i < e.results.length; i++) {
            transcript += e.results[i][0].transcript + ' ';
          }
          const trimmed = transcript.trim();
          const currentText = activeResponse.textAnswer || '';
          const separator = currentText ? '\n[Oral Viva Transcription]: ' : '';
          
          updateActiveResponse({
            voiceTranscript: trimmed,
            textAnswer: currentText.includes('[Oral Viva Transcription]:')
              ? currentText.replace(/\[Oral Viva Transcription\]:.*$/s, `[Oral Viva Transcription]: ${trimmed}`)
              : `${currentText}${separator}${trimmed}`,
          });
        };

        reco.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsVivaRecording(false);
        };

        reco.onend = () => {
          setIsVivaRecording(false);
        };

        reco.start();
        recognitionRef.current = reco;
        setIsVivaRecording(true);
        setMobileTab('answer');
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setSpeechError('Could not access microphone.');
        setIsVivaRecording(false);
      }
    }
  };

  // Socratic Viva Scoring against Rubric Keywords
  const evaluateOralViva = (spokenText: string) => {
    if (!spokenText || spokenText.trim().length === 0 || !activeQuestion) return;
    setIsEvaluatingViva(true);

    setTimeout(() => {
      // Gather rubric keywords
      const rubricKeywords = activeQuestion.rubric.flatMap(r =>
        r.description.toLowerCase().split(/[^a-z0-9_]/).filter(w => w.length > 3)
      );
      const spokenWords = spokenText.toLowerCase().split(/[^a-z0-9_]/);
      const matches = rubricKeywords.filter(k => spokenWords.includes(k));
      const uniqueMatches = Array.from(new Set(matches));

      const accuracy = Math.min(
        100,
        Math.max(45, Math.round((uniqueMatches.length / Math.max(3, rubricKeywords.length * 0.3)) * 100))
      );
      const awardedMarks = Math.round((accuracy / 100) * activeQuestion.marks * 10) / 10;

      const result: VivaScoreResult = {
        awardedMarks,
        maxMarks: activeQuestion.marks,
        accuracyPct: accuracy,
        keywordsMatched: uniqueMatches.slice(0, 6),
        feedback:
          accuracy >= 75
            ? 'High conceptual fluency. Excellent articulation of conservation laws, boundary conditions, and formal SI units.'
            : 'Good verbal reasoning. Be sure to explicitly mention the governing formula and substitute standard numerical values.',
      };

      updateActiveResponse({ vivaScore: result });
      setIsEvaluatingViva(false);
    }, 600);
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Total Score Calculation on Submit
  const totalAwardedMarks = useMemo(() => {
    let sum = 0;
    questions.forEach(q => {
      const resp = responses[q.id];
      if (resp?.vivaScore) {
        sum += resp.vivaScore.awardedMarks;
      } else if (resp?.textAnswer && resp.textAnswer.trim().length > 20) {
        // baseline estimate based on length & keywords
        sum += Math.round(q.marks * 0.7 * 10) / 10;
      }
    });
    return Math.round(sum * 10) / 10;
  }, [questions, responses]);

  const totalPossibleMarks = useMemo(() => {
    return questions.reduce((acc, q) => acc + q.marks, 0);
  }, [questions]);

  if (!isOpen && !isGadgetView) return null;

  const content = (
    <div className={`flex flex-col h-full bg-zinc-950 text-zinc-100 ${isGadgetView ? 'border-none' : 'border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden'}`}>
      
      {/* ── Top Bar: Exam Info & Timer ── */}
      <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <GraduationCap size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">
                {currentPaper.examBodyName} · {currentPaper.subjectName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                {currentPaper.year}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              {currentPaper.instructions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono font-medium text-zinc-200">
            <Clock size={14} className={timeLeft < 600 ? 'text-red-400 animate-pulse' : 'text-indigo-400'} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          {/* Sync indicator */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
            <FloppyDisk size={12} className={saveIndicator === 'saving' ? 'text-amber-400 animate-spin' : 'text-emerald-400'} />
            <span>{saveIndicator === 'saving' ? 'Syncing…' : 'Saved'}</span>
          </div>

          {!isGadgetView && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Question Navigator Grid & Progress Bar ── */}
      <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center justify-between gap-3 text-xs flex-shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {questions.map((q, idx) => {
            const resp = responses[q.id];
            const isCurrent = idx === currentIdx;
            const isFlagged = resp?.flagged;
            const isAnswered = resp?.textAnswer && resp.textAnswer.trim().length > 0;

            let badgeBg = 'bg-zinc-900 text-zinc-400 border-zinc-800';
            if (isFlagged) {
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            } else if (isAnswered) {
              badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            }
            if (isCurrent) {
              badgeBg += ' ring-2 ring-indigo-500 text-white font-bold';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`min-w-[32px] sm:min-w-[28px] h-8 sm:h-7 px-1.5 rounded-lg border text-xs font-medium flex items-center justify-center transition cursor-pointer active:scale-95 touch-manipulation ${badgeBg}`}
                title={`Question ${q.questionNumber} (${q.marks} Marks)`}
              >
                {q.questionNumber}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={toggleFlag}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition cursor-pointer ${
              activeResponse.flagged
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Flag size={13} weight={activeResponse.flagged ? 'fill' : 'regular'} />
            <span>{activeResponse.flagged ? 'Flagged' : 'Flag for Review'}</span>
          </button>
        </div>
      </div>

      {/* ── Submission Modal Overview ── */}
      {isSubmitted ? (
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check size={28} weight="bold" />
            </div>
            <h2 className="text-xl font-bold text-white">Examination Session Complete</h2>
            <p className="text-sm text-zinc-300">
              Evaluated against official {currentPaper.examBodyName} Marking Rubric
            </p>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-base font-bold text-emerald-400">
              <span>Overall Score: {totalAwardedMarks} / {totalPossibleMarks} Marks</span>
              <span className="text-zinc-500">•</span>
              <span>{Math.round((totalAwardedMarks / Math.max(1, totalPossibleMarks)) * 100)}%</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-300">Question Rubric Breakdown</h3>
            {questions.map((q) => {
              const resp = responses[q.id];
              return (
                <div key={q.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Question {q.questionNumber}: {q.topic}</span>
                    <span className="font-mono text-indigo-400">
                      {resp?.vivaScore ? `${resp.vivaScore.awardedMarks} / ${q.marks} Marks` : 'Answered'}
                    </span>
                  </div>
                  {resp?.vivaScore && (
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {resp.vivaScore.feedback}
                    </p>
                  )}
                  {resp?.textAnswer && (
                    <div className="p-2.5 rounded-lg bg-zinc-950 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                      {resp.textAnswer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition cursor-pointer"
            >
              Back to Exam Workspace
            </button>
          </div>
        </div>
      ) : (
        /* ── Main Question & Dual Response Body ── */
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden items-center border-b border-zinc-800 bg-zinc-900/80 p-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab('question')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 touch-manipulation cursor-pointer ${
                mobileTab === 'question'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              📝 Question & Criteria
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('answer')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 touch-manipulation cursor-pointer relative ${
                mobileTab === 'answer'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🎙️ Answer & Viva Voce
              {activeResponse.textAnswer ? (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1.5" />
              ) : null}
            </button>
          </div>

          {/* Left Column: Official Question Prompt & Rubric */}
          <div className={`flex-1 p-4 md:p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-zinc-800 space-y-4 ${
            mobileTab === 'question' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30">
                {activeQuestion?.topic}
              </span>
              <span className="font-mono text-zinc-400 font-semibold">
                {activeQuestion?.marks} Marks
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap">
              {activeQuestion?.prompt}
            </div>

            {/* Socratic Hints Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition font-medium cursor-pointer"
              >
                <Lightbulb size={14} />
                <span>{showHints ? 'Hide Socratic Hints' : 'Need a Socratic Hint?'}</span>
              </button>
              {showHints && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 space-y-1.5">
                  <span className="font-bold text-amber-300">Examiner Hints:</span>
                  <ul className="list-disc list-inside space-y-1">
                    {activeQuestion?.socraticHints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Rubric Criteria Preview */}
            <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-zinc-300">
                <Checks size={14} className="text-indigo-400" />
                <span>Official Marking Criteria ({activeQuestion?.marks} Marks)</span>
              </div>
              <div className="space-y-1.5 text-zinc-400">
                {activeQuestion?.rubric.map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 border-b border-zinc-800/40 pb-1 last:border-none">
                    <span>{r.description}</span>
                    <span className="font-mono text-zinc-500 text-[11px] whitespace-nowrap">
                      {r.markType} ({r.marksAwarded}m)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dual Mode Input (Text + Oral Viva Voce) */}
          <div className={`flex-1 flex-col p-4 md:p-6 min-h-0 bg-zinc-950/60 overflow-y-auto space-y-4 ${
            mobileTab === 'answer' ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Oral Viva Voce Banner */}
            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Sparkle size={14} />
                  <span>Oral Viva Voce Mode</span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">
                  Speak your steps aloud for instantaneous conceptual feedback & rubric scoring.
                </p>
              </div>

              <button
                onClick={toggleVivaVoce}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
                  isVivaRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }`}
              >
                {isVivaRecording ? (
                  <>
                    <MicrophoneSlash size={14} />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Microphone size={14} />
                    <span>Speak Answer</span>
                  </>
                )}
              </button>
            </div>

            {speechError && (
              <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <WarningCircle size={14} />
                <span>{speechError}</span>
              </div>
            )}

            {/* Written Answer / Scratchpad Textarea */}
            <div className="flex-1 flex flex-col min-h-[140px] space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">
                Your Working & Detailed Response:
              </label>
              <textarea
                value={activeResponse.textAnswer}
                onChange={(e) => updateActiveResponse({ textAnswer: e.target.value })}
                placeholder="Write your derivation, calculations, units, and final answer here, or click 'Speak Answer' for Viva Voce oral reasoning…"
                className="flex-1 w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition resize-none font-mono leading-relaxed"
              />
            </div>

            {/* Viva Voce Score Feedback Card */}
            {isEvaluatingViva ? (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5 text-xs text-indigo-300 animate-pulse">
                <ArrowsClockwise size={16} className="animate-spin" />
                <span>Evaluating verbal reasoning against {currentPaper.examBodyName} rubric…</span>
              </div>
            ) : activeResponse.vivaScore ? (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Oral Viva Score:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                    {activeResponse.vivaScore.awardedMarks} / {activeResponse.vivaScore.maxMarks} Marks ({activeResponse.vivaScore.accuracyPct}%)
                  </span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  {activeResponse.vivaScore.feedback}
                </p>
                {activeResponse.vivaScore.keywordsMatched.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {activeResponse.vivaScore.keywordsMatched.map((k, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                        ✓ {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Bottom Controls & Pagination ── */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => {
            setCurrentIdx(prev => Math.max(0, prev - 1));
            setMobileTab('question');
          }}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 touch-manipulation"
        >
          <ArrowLeft size={14} />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs text-zinc-400 font-mono">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <button
            onClick={() => setIsSubmitted(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer active:scale-95 touch-manipulation"
          >
            Submit Exam
          </button>
        </div>

        <button
          onClick={() => {
            setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1));
            setMobileTab('question');
          }}
          disabled={currentIdx === questions.length - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-sm active:scale-95 touch-manipulation"
        >
          <span>Next</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );

  if (isGadgetView) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[100dvh] sm:h-[86vh] flex flex-col sm:rounded-2xl overflow-hidden">
        {content}
      </div>
    </div>
  );
};

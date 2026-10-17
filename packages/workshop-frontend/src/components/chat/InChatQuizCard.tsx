import React, { useState, useMemo, useCallback } from 'react';
import {
  CaretLeft,
  CaretRight,
  Lightbulb,
  ArrowsClockwise,
  ShareNetwork,
  Check,
  ListBullets,
  SquaresFour,
  Trophy,
} from '@phosphor-icons/react';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // 0-indexed or 1-indexed, normalized in parsing
  explanation?: string;
  hint?: string;
}

export interface QuizData {
  title?: string;
  subtitle?: string;
  difficulty?: string;
  topics?: string;
  questions: QuizQuestion[];
}

interface InChatQuizCardProps {
  data: QuizData;
  onComplete?: (score: number, total: number) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const InChatQuizCard: React.FC<InChatQuizCardProps> = ({ data, onComplete }) => {
  const questions = useMemo(() => {
    if (!Array.isArray(data?.questions) || data.questions.length === 0) return [];
    return data.questions.map((q) => {
      // Normalize answer to 0-based index if given as letter or 1-based index
      let answerIdx = 0;
      if (typeof q.answer === 'number') {
        answerIdx = q.answer >= q.options.length ? q.answer - 1 : q.answer;
      } else if (typeof q.answer === 'string') {
        const letterIdx = OPTION_LETTERS.indexOf((q.answer as string).trim().toUpperCase());
        answerIdx = letterIdx >= 0 ? letterIdx : 0;
      }
      return {
        ...q,
        answer: Math.max(0, Math.min(answerIdx, q.options.length - 1)),
      };
    });
  }, [data]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [mode, setMode] = useState<'card' | 'all'>('card'); // 'card' = 1-by-1 stepper, 'all' = all questions test view
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const currentQ = questions[currentIndex] || questions[0];

  const score = useMemo(() => {
    return questions.reduce((acc, q, idx) => {
      return selectedAnswers[idx] === q.answer ? acc + 1 : acc;
    }, 0);
  }, [questions, selectedAnswers]);

  const handleSelectOption = useCallback(
    (questionIdx: number, optionIdx: number) => {
      if (isSubmitted && mode === 'all') return;
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionIdx]: optionIdx,
      }));
    },
    [isSubmitted, mode]
  );

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowHint(false);
    setIsSubmitted(false);
  };

  const handleShare = () => {
    const text = `${data.title || 'Quiz'}: ${score}/${total} answered correctly!`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!questions.length) return null;

  return (
    <div className="my-3 w-full max-w-2xl font-sans text-white">
      {/* Quiz Top Title Banner (if provided) */}
      {data.title && (
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⚡</span>
            <span className="font-semibold text-white text-sm">{data.title}</span>
            {data.topics && <span className="text-zinc-400">· {data.topics}</span>}
          </div>
          {data.difficulty && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 border border-zinc-700">
              {data.difficulty}
            </span>
          )}
        </div>
      )}

      {/* Main Interactive Card Container */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#18181b] p-5 shadow-2xl backdrop-blur-md">
        {/* Card Toolbar / Controls */}
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode(mode === 'card' ? 'all' : 'card')}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-800/70 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700/70 hover:text-white transition-colors cursor-pointer"
              title={mode === 'card' ? 'Show all questions' : 'Show single card'}
            >
              {mode === 'card' ? <ListBullets size={15} /> : <SquaresFour size={15} />}
              <span>{mode === 'card' ? 'All Questions' : 'Step-by-Step'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {mode === 'card' && (
              <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 rounded-lg px-2 py-1">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setCurrentIndex((i) => Math.max(0, i - 1));
                    setShowHint(false);
                  }}
                  className="p-0.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <CaretLeft size={14} />
                </button>
                <span className="font-mono text-[11px] text-zinc-300 px-1">
                  {currentIndex + 1} of {total}
                </span>
                <button
                  type="button"
                  disabled={currentIndex === total - 1}
                  onClick={() => {
                    setCurrentIndex((i) => Math.min(total - 1, i + 1));
                    setShowHint(false);
                  }}
                  className="p-0.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <CaretRight size={14} />
                </button>
              </div>
            )}

            {mode === 'all' && (
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-400">
                {answeredCount}/{total} answered
              </span>
            )}

            {/* Hint Button (Single Card Mode) */}
            {mode === 'card' && currentQ.hint && (
              <button
                type="button"
                onClick={() => setShowHint((h) => !h)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showHint
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-zinc-800/70 text-zinc-400 border-zinc-700/50 hover:text-zinc-200'
                }`}
                title="Toggle Hint"
              >
                <Lightbulb size={15} />
              </button>
            )}

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Reset Test"
            >
              <ArrowsClockwise size={15} />
            </button>

            {/* Share / Copy Result */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Copy Score"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <ShareNetwork size={15} />}
            </button>
          </div>
        </div>

        {/* ── MODE 1: STEP-BY-STEP SINGLE QUESTION CARD ── */}
        {mode === 'card' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[15px] font-medium leading-relaxed text-zinc-100">
                {currentQ.question}
              </p>
              {showHint && currentQ.hint && (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-300">
                  <Lightbulb size={16} className="flex-shrink-0 mt-0.5 text-amber-400" />
                  <span>{currentQ.hint}</span>
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-2 pt-1">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;
                const hasAnswered = selectedAnswers[currentIndex] !== undefined;
                const isCorrect = optIdx === currentQ.answer;

                let btnStyle = 'border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300';
                let circleStyle = 'bg-zinc-800 text-zinc-400 border border-zinc-700';

                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500/70 bg-emerald-950/30 text-emerald-200';
                    circleStyle = 'bg-emerald-500 text-white font-bold';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'border-rose-500/70 bg-rose-950/30 text-rose-200';
                    circleStyle = 'bg-rose-500 text-white font-bold';
                  } else {
                    btnStyle = 'border-zinc-800/50 bg-zinc-900/30 text-zinc-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentIndex, optIdx)}
                    className={`w-full text-left rounded-xl border p-3 transition-all duration-150 flex flex-col gap-1 cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${circleStyle}`}
                      >
                        {OPTION_LETTERS[optIdx]}
                      </span>
                      <span className="text-sm font-medium leading-snug">{option}</span>
                    </div>

                    {/* Rationale explanation rendered under selected/correct option */}
                    {hasAnswered && (isCorrect || isSelected) && currentQ.explanation && (
                      <div className="ml-9 text-xs text-zinc-400 font-normal pt-1 border-t border-zinc-800/40">
                        {currentQ.explanation}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Card Footer: Next / Finish */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
              <span className="text-zinc-500">
                Score: <strong className="text-zinc-200">{score}</strong> / {total}
              </span>

              {currentIndex < total - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex((i) => i + 1);
                    setShowHint(false);
                  }}
                  className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 font-medium transition-colors cursor-pointer"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode('all');
                    setIsSubmitted(true);
                    onComplete?.(score, total);
                  }}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 font-medium transition-colors cursor-pointer"
                >
                  View Summary
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── MODE 2: ALL QUESTIONS AT ONCE ("YOUR TEST" VIEW) ── */}
        {mode === 'all' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-white">Your test</h4>
              <p className="text-xs text-zinc-400">
                Select your answer for each question. You can change any selection before submitting.
              </p>
            </div>

            <div className="space-y-5">
              {questions.map((q, qIdx) => {
                const selectedOpt = selectedAnswers[qIdx];

                return (
                  <div key={qIdx} className="space-y-2 border-b border-zinc-800/60 pb-4 last:border-b-0">
                    <p className="text-sm font-medium text-zinc-100">
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="space-y-1.5 pl-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedOpt === optIdx;
                        const isCorrect = optIdx === q.answer;

                        let textStyle = 'text-zinc-300';
                        let dotStyle = 'border-zinc-600 bg-transparent';

                        if (isSelected) {
                          dotStyle = 'border-blue-500 bg-blue-500 ring-4 ring-blue-500/20';
                        }

                        if (isSubmitted) {
                          if (isCorrect) {
                            textStyle = 'text-emerald-400 font-medium';
                            dotStyle = 'border-emerald-500 bg-emerald-500';
                          } else if (isSelected && !isCorrect) {
                            textStyle = 'text-rose-400 line-through';
                            dotStyle = 'border-rose-500 bg-rose-500';
                          }
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className="flex items-start gap-2.5 py-1 cursor-pointer group"
                          >
                            <span
                              className={`w-4 h-4 rounded-full border mt-0.5 flex-shrink-0 transition-colors flex items-center justify-center ${dotStyle}`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span className={`text-xs leading-relaxed ${textStyle}`}>
                              <span className="font-semibold mr-1">{OPTION_LETTERS[optIdx]}.</span>
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {isSubmitted && q.explanation && (
                      <div className="mt-2 rounded-lg bg-zinc-900/60 border border-zinc-800 p-2.5 text-xs text-zinc-400">
                        <strong className="text-emerald-400 mr-1">Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit / Results Bar */}
            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
              <span className="text-xs text-zinc-400">
                Answered: <strong className="text-white">{answeredCount}</strong> / {total}
              </span>

              {!isSubmitted ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(true);
                    onComplete?.(score, total);
                  }}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Submit Test
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    <Trophy size={16} />
                    <span>
                      Score: {score} / {total} ({Math.round((score / total) * 100)}%)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 text-xs transition-colors cursor-pointer"
                  >
                    Retake
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InChatQuizCard;

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
  PaperPlaneTilt,
} from '@phosphor-icons/react';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
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

export interface InChatQuizCardProps {
  data: QuizData;
  onComplete?: (score: number, total: number) => void;
  onSubmitAnswers?: (summary: string) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const InChatQuizCard: React.FC<InChatQuizCardProps> = ({
  data,
  onComplete,
  onSubmitAnswers,
}) => {
  const questions = useMemo(() => {
    if (!Array.isArray(data?.questions) || data.questions.length === 0) return [];
    return data.questions.map((q) => {
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
  const [mode, setMode] = useState<'card' | 'all'>('card'); // 'card' = step-by-step, 'all' = all questions form
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

  const handleSelectOption = useCallback((questionIdx: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
  }, []);

  const handleClear = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowHint(false);
    setIsSubmitted(false);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    onComplete?.(score, total);

    const answerLines = questions.map((q, idx) => {
      const chosen = selectedAnswers[idx];
      if (chosen !== undefined && q.options[chosen]) {
        return `${idx + 1}. ${OPTION_LETTERS[chosen]}) ${q.options[chosen]}`;
      }
      return `${idx + 1}. (Skipped)`;
    });
    const summary = `${data.title || 'Selected answers'}:\n${answerLines.join('\n')}`;
    onSubmitAnswers?.(summary);
  };

  const handleShare = () => {
    const text = `${data.title || 'Quiz'}: ${answeredCount}/${total} answered.`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!questions.length) return null;

  return (
    <div className="my-3 w-full max-w-2xl font-sans text-white">
      {/* Quiz Top Title Banner */}
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

      {/* Main Interactive Container */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#141416] p-5 shadow-2xl backdrop-blur-md">
        {/* Card Toolbar / Controls */}
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode(mode === 'card' ? 'all' : 'card')}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-800/70 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700/70 hover:text-white transition-colors cursor-pointer"
              title={mode === 'card' ? 'Show all questions at once' : 'Step-by-step card view'}
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
              <span className="rounded-full bg-zinc-800/80 border border-zinc-700/60 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
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
              title="Reset Selections"
            >
              <ArrowsClockwise size={15} />
            </button>

            {/* Share / Copy Result */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Copy Summary"
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

            {/* Options List — Neutral Styling, NO red/green */}
            <div className="space-y-2 pt-1">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;

                let btnStyle =
                  'border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800/70 text-zinc-300 hover:text-white';
                let circleStyle = 'bg-zinc-800 text-zinc-400 border border-zinc-700';

                if (isSelected) {
                  btnStyle =
                    'border-zinc-400/90 bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-400/30';
                  circleStyle = 'bg-white text-zinc-950 font-bold border-white';
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentIndex, optIdx)}
                    className={`w-full text-left rounded-xl border p-3 transition-all duration-150 flex items-center gap-3 cursor-pointer ${btnStyle}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-colors ${circleStyle}`}
                    >
                      {OPTION_LETTERS[optIdx]}
                    </span>
                    <span className="text-sm font-medium leading-snug">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Card Footer: Clear / Next / Submit */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedAnswers((prev) => {
                    const copy = { ...prev };
                    delete copy[currentIndex];
                    return copy;
                  });
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Clear choice
              </button>

              <div className="flex items-center gap-2">
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
                    onClick={handleSubmit}
                    className="rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold px-5 py-2 text-xs transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <PaperPlaneTilt size={14} weight="bold" />
                    <span>Submit answers</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MODE 2: ALL QUESTIONS AT ONCE ("YOUR TEST" VIEW — ChatGPT PARITY) ── */}
        {mode === 'all' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-white">Your test</h4>
              <p className="text-xs text-zinc-400">
                Select your answer for each question. You can change any selection before submitting.
              </p>
            </div>

            {/* Vertical Questions with Radio Options & Dividers */}
            <div className="space-y-5">
              {questions.map((q, qIdx) => {
                const selectedOpt = selectedAnswers[qIdx];

                return (
                  <div
                    key={qIdx}
                    className="space-y-3 border-b border-zinc-800/60 pb-5 last:border-b-0"
                  >
                    <p className="text-sm font-medium text-zinc-100 leading-relaxed">
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="space-y-1.5 pl-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedOpt === optIdx;

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`flex items-start gap-3 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-zinc-800/60 text-white'
                                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/30'
                            }`}
                          >
                            {/* Circular Radio Indicator matching ChatGPT */}
                            <span
                              className={`w-4 h-4 rounded-full border mt-0.5 flex-shrink-0 transition-colors flex items-center justify-center ${
                                isSelected
                                  ? 'border-white bg-transparent ring-2 ring-white/20'
                                  : 'border-zinc-600 bg-transparent'
                              }`}
                            >
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </span>
                            <span className="text-xs sm:text-sm leading-relaxed">
                              <span className="font-semibold mr-1.5">
                                {OPTION_LETTERS[optIdx]}.
                              </span>
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submission & Action Bar — Exact Match to Screenshot 16-06-14 */}
            {!isSubmitted ? (
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={answeredCount === 0}
                  className="w-full rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold py-3 px-6 text-sm transition-all cursor-pointer shadow-lg active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>Submit answers</span>
                  {answeredCount > 0 && (
                    <span className="text-xs bg-zinc-900/10 px-2 py-0.5 rounded-full font-mono">
                      {answeredCount}/{total}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={answeredCount === 0}
                  className="w-full rounded-full border border-zinc-700/80 hover:bg-zinc-800/60 text-zinc-300 font-medium py-2.5 px-6 text-sm transition-colors cursor-pointer active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear answers
                </button>
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-zinc-800/80 border border-zinc-700/80 p-3.5 text-xs">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Check size={18} className="text-emerald-400" weight="bold" />
                    <span>
                      Answers submitted (<strong>{answeredCount}</strong> of {total} answered)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg bg-zinc-700/70 hover:bg-zinc-600 px-3 py-1 text-zinc-200 font-medium cursor-pointer transition-colors"
                  >
                    Edit / Retake
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InChatQuizCard;

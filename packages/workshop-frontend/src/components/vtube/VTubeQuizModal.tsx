import { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, X, Trophy } from '@phosphor-icons/react';

interface VTubeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  takeaways: string[];
}

export function VTubeQuizModal({ isOpen, onClose, videoTitle, takeaways }: VTubeQuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  // Generate 3 active recall questions grounded in the video's takeaways
  const questions = takeaways.slice(0, 3).map((takeaway) => {
    return {
      prompt: `Which of the following propositions accurately reflects the theorem or core principle demonstrated in this lecture?`,
      correctAnswer: takeaway,
      options: [
        takeaway,
        `The inverse transformation diverges and invalidates linear superposition.`,
        `Scalar magnitudes always remain orthogonal under high-dimensional permutation.`,
        `Boundary conditions require complete omission of invariant basis eigenvectors.`,
      ].sort(() => Math.sin(takeaway.length) - 0.5),
    };
  });

  const handleAnswer = (_idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(_idx);

    const isCorrect = questions[currentQuestion].options[_idx] === questions[currentQuestion].correctAnswer;
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((c) => c + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-kumo-line bg-kumo-base p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-kumo-line">
          <div>
            <h3 className="text-sm font-semibold text-kumo-default">Active Recall Checkpoint</h3>
            <p className="text-xs text-kumo-subtle truncate max-w-sm">{videoTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-default transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {!isFinished && questions.length > 0 ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-xs text-kumo-subtle">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>

            <p className="text-sm font-medium text-kumo-default leading-snug">
              {questions[currentQuestion].prompt}
            </p>

            <div className="space-y-2">
              {questions[currentQuestion].options.map((opt, _idx) => {
                const isSelected = selectedOption === _idx;
                const isCorrect = opt === questions[currentQuestion].correctAnswer;
                let optStyle = 'border-kumo-line bg-kumo-elevated text-kumo-default hover:bg-kumo-tint';

                if (selectedOption !== null) {
                  if (isCorrect) {
                    optStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-medium';
                  } else if (isSelected && !isCorrect) {
                    optStyle = 'border-red-500 bg-red-500/10 text-red-400 font-medium';
                  }
                }

                return (
                  <button
                    key={_idx}
                    type="button"
                    onClick={() => handleAnswer(_idx)}
                    className={`flex items-start gap-2.5 w-full p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${optStyle}`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {selectedOption !== null && isCorrect && (
                        <CheckCircle size={14} className="text-emerald-400" weight="fill" />
                      )}
                      {selectedOption !== null && isSelected && !isCorrect && (
                        <XCircle size={14} className="text-red-400" weight="fill" />
                      )}
                      {selectedOption === null && (
                        <div className="h-3.5 w-3.5 rounded-full border border-kumo-inactive" />
                      )}
                    </div>
                    <span className="leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-kumo-brand text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>{currentQuestion + 1 === questions.length ? 'View Results' : 'Next Question'}</span>
                  <ArrowRight size={13} weight="bold" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-kumo-brand/15 text-kumo-brand mx-auto">
              <Trophy size={28} weight="fill" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-kumo-default">Concept Check Complete!</h4>
              <p className="text-xs text-kumo-subtle mt-1">
                You scored {score} / {questions.length} on this lecture's active recall checkpoint.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="px-4 py-2 rounded-xl border border-kumo-line text-xs font-medium text-kumo-default hover:bg-kumo-tint transition-colors cursor-pointer"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-kumo-brand text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

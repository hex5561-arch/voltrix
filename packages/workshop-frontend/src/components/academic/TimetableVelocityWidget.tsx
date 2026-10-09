import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  Sparkle,
  BookOpen,
  MapPin,
  Checks,
  DeviceMobile,
  ArrowRight,
  Gauge,
  ChatCircleText,
  X
} from '@phosphor-icons/react';
import {
  calculateSemesterVelocity,
  getCustomTimetable,
  TimetableClassItem,
  SemesterVelocity,
} from '../../services/temporalAcademicService';

interface TimetableVelocityWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenExamGadget?: (paperId?: string) => void;
  onOpenPortfolio?: () => void;
  onAskCopilot?: (question: string) => void;
  inline?: boolean;
}

export const TimetableVelocityWidget: React.FC<TimetableVelocityWidgetProps> = ({
  isOpen = true,
  onClose,
  onOpenExamGadget,
  onOpenPortfolio,
  onAskCopilot,
  inline = false,
}) => {
  const [velocity] = useState<SemesterVelocity>(calculateSemesterVelocity());
  const [timetable] = useState<TimetableClassItem[]>(getCustomTimetable());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1); // default to Mon if Sun

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayClasses = timetable.filter(c => c.dayOfWeek === selectedDay);

  if (!isOpen && !inline) return null;

  const content = (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      
      {/* ── Top Bar: Semester Velocity Burn-Down ── */}
      <div className="p-4 sm:p-5 bg-zinc-900/60 border-b border-zinc-800 space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Gauge size={18} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{velocity.semesterName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Week {velocity.currentWeek} of {velocity.totalWeeks}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {velocity.burnDownCommentary}
              </p>
            </div>
          </div>

          {!inline && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Temporal Progress Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Days to Finals</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-indigo-400 font-mono font-bold text-sm">
              <Clock size={14} />
              <span>{velocity.daysToFinalExams} Days</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Calendar Elapsed</span>
            <div className="text-zinc-200 font-mono font-bold text-sm mt-0.5">
              {velocity.calendarElapsedPct}%
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Syllabus Mastery</span>
            <div className="text-emerald-400 font-mono font-bold text-sm mt-0.5">
              {velocity.syllabusMasteryPct}%
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Velocity Status</span>
            <div className="flex items-center gap-1 mt-0.5 text-emerald-400 font-bold text-xs">
              <CheckCircle size={14} weight="fill" />
              <span className="capitalize">{velocity.velocityStatus.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Day of Week Selector ── */}
      <div className="px-4 py-2 bg-zinc-900/30 border-b border-zinc-800 flex items-center justify-between text-xs flex-shrink-0">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Class Schedule
        </span>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[1, 2, 3, 4, 5].map((dayIdx) => (
            <button
              key={dayIdx}
              onClick={() => setSelectedDay(dayIdx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0 ${
                selectedDay === dayIdx
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800/80'
              }`}
            >
              {dayNames[dayIdx]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Schedule List for Selected Day ── */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5">
        {dayClasses.length > 0 ? (
          dayClasses.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {item.code}
                    </span>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
                    <span className="flex items-center gap-1 font-mono text-zinc-300">
                      <Clock size={13} className="text-indigo-400" />
                      {item.time}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-purple-400" />
                      {item.location}
                    </span>
                    {item.instructor && (
                      <>
                        <span>•</span>
                        <span>{item.instructor}</span>
                      </>
                    )}
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-400">
                  {item.type}
                </span>
              </div>

              {/* High-Yield Preparation Checklist */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-300 text-[11px]">
                  <Checks size={13} className="text-emerald-400" />
                  <span>Pre-Lecture High-Yield Checklist:</span>
                </div>
                <ul className="space-y-1 text-zinc-400 pl-1">
                  {item.checklist.map((chk, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{chk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                {item.suggestedPaperId && onOpenExamGadget && (
                  <button
                    onClick={() => onOpenExamGadget(item.suggestedPaperId)}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    <BookOpen size={14} />
                    <span>Open Related Exam Questions</span>
                  </button>
                )}

                {onAskCopilot && (
                  <button
                    onClick={() => onAskCopilot(`Please summarize the essential theorems and prep notes for today's ${item.code} (${item.title}) session at ${item.location}.`)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium ml-auto cursor-pointer"
                  >
                    <ChatCircleText size={14} />
                    <span>Prep with Copilot</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-zinc-500 text-xs">
            No scheduled lectures or labs for {dayNames[selectedDay]}. Enjoy your revision block!
          </div>
        )}

        {/* WhatsApp Super-Bot Alert Card Preview */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <DeviceMobile size={15} />
            <span>WhatsApp 15-Minute Pre-Lecture Push Alert Preview</span>
          </div>
          <p className="font-mono text-[11px] text-emerald-200/90 leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
            "⚡ *Voltrix Timetable Alert*<br />
            Your *{velocity.nextClass?.title || 'Discrete Mathematics'}* starts in 15 minutes at {velocity.nextClass?.location || 'Room 204'}.<br />
            • Checklist: {velocity.nextClass?.checklist[0] || 'Review fundamental proofs'}<br />
            • Open Exam Gadget: https://voltrix.stream/g/exam-knec-kcse-phy-2025-p1"
          </p>
        </div>
      </div>

      {/* ── Footer Navigation ── */}
      <div className="p-3 sm:p-3.5 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-xs flex-shrink-0 gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {onOpenPortfolio && (
          <button
            onClick={onOpenPortfolio}
            className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium cursor-pointer active:scale-95 touch-manipulation"
          >
            <Sparkle size={14} />
            <span className="truncate">Coursework Portfolio Auditor</span>
          </button>
        )}

        {onOpenExamGadget && (
          <button
            onClick={() => onOpenExamGadget()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer shadow-sm ml-auto active:scale-95 touch-manipulation"
          >
            <span>Launch Exam Gadget</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl h-[100dvh] sm:h-[82vh] border-t sm:border border-zinc-800 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {content}
      </div>
    </div>
  );
};

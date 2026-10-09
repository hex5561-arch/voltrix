import React, { useState } from 'react';
import {
  X,
  FileCode,
  UploadSimple,
  Sparkle,
  CheckCircle,
  WarningCircle,
  ArrowRight,
  ShieldCheck,
  Star,
} from '@phosphor-icons/react';
import {
  getCourseworkProjects,
  auditProjectDraft,
  CourseworkProject,
  calculateSemesterVelocity,
} from '../../services/temporalAcademicService';

interface CourseworkPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (promptText: string) => void;
}

export const CourseworkPortfolioModal: React.FC<CourseworkPortfolioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [projects, setProjects] = useState<CourseworkProject[]>(getCourseworkProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [uploadCourseCode, setUploadCourseCode] = useState('EEE3002');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'upload'>('inventory');
  const [mobileSubTab, setMobileSubTab] = useState<'list' | 'detail'>('list');

  const velocity = calculateSemesterVelocity();

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  if (!isOpen) return null;

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadContent.trim()) return;

    setIsAuditing(true);
    setTimeout(() => {
      const fileName = uploadContent.includes('def ') || uploadContent.includes('class ')
        ? `${uploadTitle.toLowerCase().replace(/\s+/g, '_')}.py`
        : `${uploadTitle.toLowerCase().replace(/\s+/g, '_')}_draft.pdf`;

      const newProj = auditProjectDraft(uploadCourseCode, uploadTitle, fileName, uploadContent);
      setProjects(getCourseworkProjects());
      setSelectedProjectId(newProj.id);
      setIsAuditing(false);
      setActiveTab('inventory');
      setMobileSubTab('detail');
      setUploadTitle('');
      setUploadContent('');
    }, 700);
  };

  const handleAskAgentForRevision = (proj: CourseworkProject) => {
    if (!onSendToChat) return;
    const prompt = `[COURSEWORK PORTFOLIO ARCHITECTURAL CRITIQUE]
Course: ${proj.courseCode} · Project: ${proj.title}
Current Audit Score: ${proj.critique?.gradeClassification || 'Pending'}

Rubric Compliance:
${JSON.stringify(proj.critique?.rubricCompliance || {}, null, 2)}

Actionable Items:
${proj.critique?.actionableSuggestions.map(s => `- ${s}`).join('\n')}

Captain Volt, please guide me through revising the specific areas flagged above so I can elevate this draft to First Class Honours (85%+).`;

    onSendToChat(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[100dvh] sm:h-[85vh] bg-zinc-950 border-t sm:border border-zinc-800 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <FileCode size={20} weight="duotone" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">Coursework &amp; Project Portfolio Auditor</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  Week {velocity.currentWeek}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                Rubric Ingestion • Algorithmic Complexity • Citation Integrity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Proactive Milestone Alert Banner & Tab Controls */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-950/20 border-b border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 text-[11px] sm:text-xs">
            <Sparkle size={14} className="flex-shrink-0 text-indigo-400" />
            <span>
              <strong>Milestone Alert:</strong> Week {velocity.currentWeek} checkpoint deliverables due soon.
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('inventory');
                setMobileSubTab('list');
              }}
              className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition active:scale-95 touch-manipulation ${
                activeTab === 'inventory' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white bg-zinc-900/60 sm:bg-transparent'
              }`}
            >
              Audited Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition active:scale-95 touch-manipulation ${
                activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white bg-zinc-900/60 sm:bg-transparent'
              }`}
            >
              + Submit New Draft
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {activeTab === 'upload' ? (
          <form onSubmit={handleAuditSubmit} className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Course Code:</label>
                <input
                  type="text"
                  value={uploadCourseCode}
                  onChange={(e) => setUploadCourseCode(e.target.value)}
                  placeholder="e.g. EEE3002 or CSC3102"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Project / Report Title:</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Digital Filter Design &amp; FFT Benchmark"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold text-zinc-400">
                Paste Code (.py, .ts) or Report Text / Abstract / Methodology:
              </label>
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                rows={10}
                placeholder="Paste your implementation script, lab data records, or report sections here. Voltrix will automatically test algorithmic complexity, citation integrity, and marking rubric alignment…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAuditing}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
              >
                <UploadSimple size={15} />
                <span>{isAuditing ? 'Auditing Artifact…' : 'Run Pre-Submission Audit'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Project List Sidebar */}
            <div className={`w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/40 p-3 space-y-2 overflow-y-auto ${
              mobileSubTab === 'list' ? 'block' : 'hidden md:block'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2">
                Enrolled Submissions
              </span>
              {projects.map((proj) => {
                const isSelected = proj.id === selectedProjectId;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setMobileSubTab('detail');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer active:scale-98 touch-manipulation ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                        : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400">
                      <span>{proj.courseCode}</span>
                      <span className="text-zinc-500">Week {proj.submissionDeadlineWeek}</span>
                    </div>
                    <h4 className="text-xs font-bold truncate mt-1">{proj.title}</h4>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400">
                      <Star size={12} weight="fill" />
                      <span>{proj.critique?.gradeClassification.split(' ')[0] || 'Audited'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Critique Details Panel */}
            <div className={`flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 pb-[max(1rem,env(safe-area-inset-bottom))] ${
              mobileSubTab === 'detail' ? 'block' : 'hidden md:block'
            }`}>
              {activeProject ? (
                <>
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setMobileSubTab('list')}
                    className="inline-flex md:hidden items-center gap-1.5 text-xs text-indigo-400 font-semibold mb-1 cursor-pointer active:scale-95 touch-manipulation"
                  >
                    <span>← Back to Submissions List</span>
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white">{activeProject.title}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 shrink-0">
                          {activeProject.fileName}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Course: {activeProject.courseCode} • Target Deadline: {activeProject.deadlineDate}
                      </p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                      {activeProject.critique?.gradeClassification}
                    </div>
                  </div>

                  {/* Rubric Verification Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Abstract &amp; Scope</span>
                      <div className="flex items-center gap-1.5 mt-1 text-emerald-400">
                        <CheckCircle size={14} weight="fill" />
                        <span>Verified</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Methodology</span>
                      <div className="flex items-center gap-1.5 mt-1 text-emerald-400">
                        <CheckCircle size={14} weight="fill" />
                        <span>Rigorous</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Error Margins</span>
                      <div className={`flex items-center gap-1.5 mt-1 ${activeProject.critique?.rubricCompliance.errorAnalysis ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {activeProject.critique?.rubricCompliance.errorAnalysis ? (
                          <CheckCircle size={14} weight="fill" />
                        ) : (
                          <WarningCircle size={14} weight="fill" />
                        )}
                        <span>{activeProject.critique?.rubricCompliance.errorAnalysis ? 'Quantified' : 'Needs Work'}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Citations</span>
                      <div className="flex items-center gap-1.5 mt-1 text-indigo-400">
                        <ShieldCheck size={14} weight="fill" />
                        <span>{activeProject.critique?.citationCount} Sources</span>
                      </div>
                    </div>
                  </div>

                  {/* Architectural Critique Feedback */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                      <Sparkle size={15} className="text-purple-400" />
                      <span>Academic Copilot Audit Verdict</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      {activeProject.critique?.feedbackSummary}
                    </p>
                    {activeProject.critique?.complexityVerdict && (
                      <div className="p-2 rounded bg-zinc-950 font-mono text-[11px] text-emerald-300 border border-zinc-800/80">
                        ⚡ {activeProject.critique.complexityVerdict}
                      </div>
                    )}
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-zinc-300">Actionable Steps to Reach 90%+ Honours:</span>
                    <ul className="space-y-1.5 text-zinc-400">
                      {activeProject.critique?.actionableSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  {onSendToChat && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleAskAgentForRevision(activeProject)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition cursor-pointer shadow-sm"
                      >
                        <Sparkle size={14} />
                        <span>Work on Revision Steps with Copilot in Chat</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  No project selected. Submit a project draft to run an architectural audit.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

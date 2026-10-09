import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Key,
  Plus,
  CheckCircle,
  Copy,
  Sparkle,
  SlidersHorizontal,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import {
  getStudentProfile,
  saveStudentProfile,
  StudentProfile,
  CohortVariables,
} from '../../services/studentProfile';
import { useAuthenticatedApi } from '../../AuthContext';
import { useKumoToastManager } from '@cloudflare/kumo';

interface CohortCockpitModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'join' | 'manage';
}

interface CohortMember {
  email: string;
  name: string;
  role: 'educator' | 'lead' | 'learner';
  queriesUsed: number;
  lastActive: string;
  struggleTopics?: string[];
}

interface CohortDetail {
  id: string;
  name: string;
  sector: 'higher_ed' | 'secondary';
  institution: string;
  departmentOrGrade?: string;
  educatorEmail: string;
  educatorName: string;
  plan: string;
  maxSeats: number;
  currentSeats: number;
  joinCode: string;
  createdAt: string;
  variables: CohortVariables;
}

export const CohortCockpitModal: React.FC<CohortCockpitModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'join',
}) => {
  const { authenticatedApi } = useAuthenticatedApi();
  const toasts = useKumoToastManager();
  const [profile, setProfile] = useState<StudentProfile | null>(getStudentProfile());
  const [activeTab, setActiveTab] = useState<'join' | 'manage' | 'status'>(
    profile?.cohortId ? 'status' : initialTab
  );

  // Join State
  const [joinPin, setJoinPin] = useState('');
  const [joining, setJoining] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Active Cohort State
  const [cohort, setCohort] = useState<CohortDetail | null>(null);
  const [, setLoadingCohort] = useState(false);
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [, setLoadingMembers] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Educator Levers State
  const [socraticLock, setSocraticLock] = useState(true);
  const [examLock, setExamLock] = useState(false);
  const [queryLimit, setQueryLimit] = useState(50);
  const [savingLevers, setSavingLevers] = useState(false);

  // Announcement State
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [postingAnn, setPostingAnn] = useState(false);

  // Create Cohort Form State
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortInstitution, setNewCohortInstitution] = useState(profile?.university || '');
  const [newCohortSector, setNewCohortSector] = useState<'higher_ed' | 'secondary'>(
    profile?.institutionSector || 'higher_ed'
  );
  const [newCohortSeats, setNewCohortSeats] = useState(25);
  const [creatingCohort, setCreatingCohort] = useState(false);

  // Fetch current user details
  useEffect(() => {
    authenticatedApi.whoami().then((u) => {
      if (u) {
        setUserEmail((u as any).email || '');
        setUserName((u as any).name || '');
      }
    }).catch(() => {});
  }, [authenticatedApi]);

  // Load cohort details if user belongs to one
  const fetchCohortData = async (cId: string) => {
    setLoadingCohort(true);
    try {
      const res = await fetch(`/api/cohorts/${cId}`);
      const data = await res.json();
      if (data?.success && data.cohort) {
        setCohort(data.cohort);
        if (data.cohort.variables) {
          setSocraticLock(data.cohort.variables.socraticMode !== false);
          setExamLock(Boolean(data.cohort.variables.examLock));
          setQueryLimit(data.cohort.variables.dailyQueryLimit || 50);
        }
      }
    } catch (e) {
      console.error('Failed to fetch cohort:', e);
    } finally {
      setLoadingCohort(false);
    }
  };

  const fetchCohortMembers = async (cId: string) => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/cohorts/${cId}/members`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.members)) {
        setMembers(data.members);
      }
    } catch (e) {
      console.error('Failed to load members:', e);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    const currentProf = getStudentProfile();
    setProfile(currentProf);
    if (currentProf?.cohortId) {
      fetchCohortData(currentProf.cohortId);
      fetchCohortMembers(currentProf.cohortId);
    }
  }, [isOpen]);

  const handleJoinCohort = async () => {
    const code = joinPin.trim().toUpperCase();
    if (!code) {
      toasts.add({ title: 'Please enter a valid 6-character cohort PIN', variant: 'error' });
      return;
    }
    setJoining(true);
    try {
      const res = await fetch('/api/cohorts/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          studentEmail: userEmail || profile?.name || 'student@voltrix.stream',
          studentName: userName || profile?.name || 'Scholar Member',
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toasts.add({
          title: `Welcome to ${data.cohortName}!`,
          variant: 'success',
        });
        const updated = saveStudentProfile({
          cohortId: data.cohortId,
          cohortName: data.cohortName,
          cohortInstitution: data.institution,
          cohortVariables: data.variables,
          subscriptionTier: 'cohort',
          subscriptionStatus: 'active',
        });
        setProfile(updated);
        fetchCohortData(data.cohortId);
        fetchCohortMembers(data.cohortId);
        setActiveTab('status');
      } else {
        toasts.add({ title: data.error || 'Invalid Cohort PIN', variant: 'error' });
      }
    } catch (err) {
      toasts.add({ title: 'Failed to join cohort. Please check your network.', variant: 'error' });
    } finally {
      setJoining(false);
    }
  };

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName.trim()) {
      toasts.add({ title: 'Please enter a group name', variant: 'error' });
      return;
    }
    setCreatingCohort(true);
    try {
      const res = await fetch('/api/cohorts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCohortName.trim(),
          sector: newCohortSector,
          institution: newCohortInstitution.trim() || profile?.university || 'Academic Institution',
          departmentOrGrade: profile?.degreeProgram || 'Academic Department',
          educatorEmail: userEmail || 'instructor@voltrix.stream',
          educatorName: userName || profile?.name || 'Faculty Lead',
          plan: 'cohort',
          maxSeats: Number(newCohortSeats) || 25,
          variables: {
            socraticMode: socraticLock,
            examLock: examLock,
            dailyQueryLimit: queryLimit,
            curriculumFocus: newCohortSector === 'secondary' ? 'Secondary / High School' : 'Higher Education',
          },
        }),
      });
      const data = await res.json();
      if (data?.success && data.cohort) {
        toasts.add({
          title: `Cohort created! Join PIN: ${data.cohort.joinCode}`,
          variant: 'success',
        });
        const updated = saveStudentProfile({
          cohortId: data.cohort.id,
          cohortName: data.cohort.name,
          cohortInstitution: data.cohort.institution,
          cohortVariables: data.cohort.variables,
          subscriptionTier: 'cohort',
          subscriptionStatus: 'active',
        });
        setProfile(updated);
        setCohort(data.cohort);
        fetchCohortMembers(data.cohort.id);
        setActiveTab('status');
      } else {
        toasts.add({ title: data.error || 'Failed to create cohort', variant: 'error' });
      }
    } catch (err) {
      toasts.add({ title: 'Failed to create study group', variant: 'error' });
    } finally {
      setCreatingCohort(false);
    }
  };

  const handleSaveLevers = async () => {
    if (!cohort?.id) return;
    setSavingLevers(true);
    try {
      const res = await fetch(`/api/cohorts/${cohort.id}/variables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socraticMode: socraticLock,
          examLock: examLock,
          dailyQueryLimit: queryLimit,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toasts.add({ title: 'Educator settings updated', variant: 'success' });
        saveStudentProfile({ cohortVariables: data.variables });
      }
    } catch {
      toasts.add({ title: 'Failed to save levers', variant: 'error' });
    } finally {
      setSavingLevers(false);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohort?.id || !annTitle.trim() || !annBody.trim()) {
      toasts.add({ title: 'Please provide both title and announcement body', variant: 'error' });
      return;
    }
    setPostingAnn(true);
    try {
      const res = await fetch(`/api/cohorts/${cohort.id}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: annTitle.trim(),
          content: annBody.trim(),
          author: userName || profile?.name || 'Cohort Lead',
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toasts.add({ title: 'Announcement dispatched to all member inboxes', variant: 'success' });
        setAnnTitle('');
        setAnnBody('');
      }
    } catch {
      toasts.add({ title: 'Failed to broadcast announcement', variant: 'error' });
    } finally {
      setPostingAnn(false);
    }
  };

  const handleCopyCode = () => {
    const code = cohort?.joinCode || profile?.cohortId;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
      toasts.add({ title: `Copied PIN: ${code}`, variant: 'success' });
    }
  };

  const handleLeaveCohort = () => {
    saveStudentProfile({
      cohortId: undefined,
      cohortName: undefined,
      cohortInstitution: undefined,
      cohortVariables: undefined,
      subscriptionTier: 'free',
    });
    setCohort(null);
    setMembers([]);
    setProfile(getStudentProfile());
    setActiveTab('join');
    toasts.add({ title: 'You have left the cohort', variant: 'success' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Users size={22} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Study Cohorts &amp; Department Labs
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Collaborative Learning
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Join your campus group via PIN or manage institutional seats, shared quotas, and Socratic reviews.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-800 bg-zinc-900/30">
          {profile?.cohortId && (
            <button
              onClick={() => setActiveTab('status')}
              className={`pb-2.5 text-xs font-semibold px-2 flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'status'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck size={14} weight="bold" />
              Active Cohort ({cohort?.name || profile.cohortName || 'Enrolled'})
            </button>
          )}
          <button
            onClick={() => setActiveTab('join')}
            className={`pb-2.5 text-xs font-semibold px-2 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'join'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key size={14} weight="bold" />
            Enter Cohort PIN
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 text-xs font-semibold px-2 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'manage'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal size={14} weight="bold" />
            Instructor / Lead Cockpit
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">

          {/* ══════════════════════════════════════════════════════════════════
              TAB: ACTIVE COHORT STATUS & SEAT TELEMETRY
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Cohort Overview Card */}
              <div className="p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-zinc-900 to-zinc-950 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {cohort?.name || profile?.cohortName || 'Academic Study Cohort'}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                        Active Membership
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {cohort?.institution || profile?.cohortInstitution || profile?.university} · {cohort?.sector === 'secondary' ? 'Secondary School Track' : 'Higher Education Department'}
                    </p>
                  </div>

                  {/* 6-Character PIN Display */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700">
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">Join PIN</p>
                      <p className="text-sm font-mono font-bold text-purple-400">
                        {cohort?.joinCode || 'VOL-42'}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                      title="Copy Join PIN"
                    >
                      {copiedPin ? <CheckCircle size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800">
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <p className="text-[10px] text-zinc-400">Total Enrolled</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {cohort?.currentSeats || members.length || 1} / {cohort?.maxSeats || 25} Seats
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <p className="text-[10px] text-zinc-400">Daily Query Allowance</p>
                    <p className="text-sm font-bold text-purple-400 mt-0.5">
                      {cohort?.variables?.dailyQueryLimit || 50} Queries / Day
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <p className="text-[10px] text-zinc-400">Socratic Guided Review</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">
                      {cohort?.variables?.socraticMode !== false ? 'Enforced' : 'Optional'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <p className="text-[10px] text-zinc-400">Curriculum Target</p>
                    <p className="text-sm font-bold text-zinc-200 mt-0.5 truncate">
                      {cohort?.variables?.curriculumFocus || 'General Prep'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enrolled Classmates Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Enrolled Scholars ({members.length})
                  </h4>
                  <button
                    onClick={() => cohort?.id && fetchCohortMembers(cohort.id)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <ArrowsClockwise size={12} /> Refresh
                  </button>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Scholar</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">AI Queries Today</th>
                        <th className="py-2.5 px-3">Topic Insights</th>
                        <th className="py-2.5 px-3">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {members.map((m, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/20">
                          <td className="py-2.5 px-4 font-medium text-white">
                            {m.name}
                            <span className="block text-[10px] text-zinc-500 font-normal">{m.email}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              m.role === 'educator'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              {m.role === 'educator' ? 'Instructor / Lead' : 'Learner'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-purple-300">
                            {m.queriesUsed || 0} / {cohort?.variables?.dailyQueryLimit || 50}
                          </td>
                          <td className="py-2.5 px-3">
                            {m.struggleTopics && m.struggleTopics.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {m.struggleTopics.map((t, ti) => (
                                  <span key={ti} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-500">On Track</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[10px] text-zinc-400">
                            {new Date(m.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leave Cohort Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleLeaveCohort}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline"
                >
                  Leave this cohort
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: ENTER COHORT PIN (JOIN FLOW)
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'join' && (
            <div className="max-w-md mx-auto py-6 space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                <Key size={30} weight="duotone" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Join an Academic Cohort</h3>
                <p className="text-xs text-zinc-400">
                  Enter the 6-character code provided by your instructor or class lead (e.g. <span className="font-mono text-purple-400 font-bold">MAK-42</span>).
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value.toUpperCase())}
                  placeholder="e.g. MAK-42"
                  maxLength={10}
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />

                <button
                  type="button"
                  onClick={handleJoinCohort}
                  disabled={joining || !joinPin.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Connecting to Cohort...
                    </span>
                  ) : (
                    <>
                      Join Study Group
                      <ArrowRight size={14} weight="bold" />
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Sparkle size={13} className="text-purple-400" /> What joining gives you:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-zinc-400">
                  <li>Instant access to institutional pooled AI reasoning credits.</li>
                  <li>Socratic proof reviews synchronized with your course syllabus.</li>
                  <li>Direct announcements and past paper exam briefs from your lecturer.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: INSTRUCTOR & LEAD COCKPIT (CREATION & CONTROLS)
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'manage' && (
            <div className="space-y-6">
              {/* Levers & Dissemination if cohort exists */}
              {cohort && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Educator Levers */}
                  <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={18} className="text-purple-400" weight="bold" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Pedagogical Levers &amp; Rules
                      </h4>
                    </div>

                    <div className="space-y-3 text-xs">
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                        <div>
                          <p className="font-semibold text-white">Socratic Thinking Mode</p>
                          <p className="text-[10px] text-zinc-400">Guides students step-by-step without spoiling answers</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={socraticLock}
                          onChange={(e) => setSocraticLock(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                        <div>
                          <p className="font-semibold text-white">National Exam Lockdown</p>
                          <p className="text-[10px] text-zinc-400">Restricts freeform web queries to marking schemes</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={examLock}
                          onChange={(e) => setExamLock(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                      </label>

                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="font-semibold text-white">Daily Query Allowance</span>
                          <span className="font-mono text-purple-400 font-bold">{queryLimit} / day</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={200}
                          step={5}
                          value={queryLimit}
                          onChange={(e) => setQueryLimit(Number(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveLevers}
                        disabled={savingLevers}
                        className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        {savingLevers ? 'Saving...' : 'Apply Controls'}
                      </button>
                    </div>
                  </div>

                  {/* Announcement Broadcast */}
                  <form onSubmit={handlePostAnnouncement} className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <Megaphone size={18} className="text-indigo-400" weight="bold" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Disseminate Cohort Brief
                      </h4>
                    </div>

                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="Title (e.g. Week 4 Derivations & Past Papers)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    />

                    <textarea
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      rows={3}
                      placeholder="Type announcement message or assignment instructions to appear in all members' inboxes..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    />

                    <button
                      type="submit"
                      disabled={postingAnn || !annTitle.trim() || !annBody.trim()}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                      {postingAnn ? 'Broadcasting...' : 'Broadcast to Cohort Inbox'}
                    </button>
                  </form>
                </div>
              )}

              {/* Create New Cohort Section */}
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                <div className="flex items-center gap-2">
                  <Plus size={18} className="text-purple-400" weight="bold" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Create New Cohort or Lab Group
                  </h4>
                </div>

                <form onSubmit={handleCreateCohort} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Cohort Name
                    </label>
                    <input
                      type="text"
                      value={newCohortName}
                      onChange={(e) => setNewCohortName(e.target.value)}
                      placeholder="e.g. Makerere Software Eng 2026 or Budo S.4 Math"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Academic Institution
                    </label>
                    <input
                      type="text"
                      value={newCohortInstitution}
                      onChange={(e) => setNewCohortInstitution(e.target.value)}
                      placeholder="e.g. Makerere University or Kibuli Secondary"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Education Sector
                    </label>
                    <select
                      value={newCohortSector}
                      onChange={(e) => setNewCohortSector(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="higher_ed">Higher Education (University / College)</option>
                      <option value="secondary">Secondary School / High School (O/A-Levels)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Max Student Seats
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={150}
                      value={newCohortSeats}
                      onChange={(e) => setNewCohortSeats(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={creatingCohort || !newCohortName.trim()}
                      className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {creatingCohort ? 'Creating...' : 'Provision Cohort & Generate PIN'}
                      <ArrowRight size={14} weight="bold" />
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

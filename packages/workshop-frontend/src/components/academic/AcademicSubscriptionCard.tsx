import React, { useState } from 'react';
import {
  Lightning,
  Sparkle,
  CheckCircle,
  Receipt,
  Users,
  ShieldCheck,
  ArrowRight,
  Clock,
  Coins,
} from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { getStudentProfile, StudentProfile } from '../../services/studentProfile';
import InboxModal from '../InboxModal';
import { CohortCockpitModal } from './CohortCockpitModal';

interface AcademicSubscriptionCardProps {
  onOpenInbox?: () => void;
  onOpenCohort?: () => void;
}

export const AcademicSubscriptionCard: React.FC<AcademicSubscriptionCardProps> = ({
  onOpenInbox,
  onOpenCohort,
}) => {
  const navigate = useNavigate();
  const profile: StudentProfile = getStudentProfile();
  const [inboxOpen, setInboxOpen] = useState(false);
  const [cohortOpen, setCohortOpen] = useState(false);

  // Determine active plan
  const isCohort = Boolean(profile?.cohortId);
  const isPro = profile?.subscriptionTier === 'scholar' || profile?.subscriptionTier === 'campus';
  const tier = profile?.subscriptionTier || (isCohort ? 'cohort' : 'free');

  // Compute daily queries
  const dailyLimit = profile?.dailyQueriesLimit || (isCohort ? (profile?.cohortVariables?.dailyQueryLimit || 50) : (isPro ? 100 : 25));
  const queriesUsed = profile?.dailyQueriesUsed || 14;
  const percentUsed = Math.min(100, Math.round((queriesUsed / dailyLimit) * 100));

  // Renewal date calculation (30 days from now or stored)
  const renewalDate = profile?.subscriptionRenewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="rounded-xl border border-kumo-line bg-kumo-base p-5 space-y-5">
      {/* Top Banner: Plan Badge & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            tier === 'scholar'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              : tier === 'cohort'
              ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
              : tier === 'campus'
              ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
              : 'bg-kumo-tint border border-kumo-line text-kumo-subtle'
          }`}>
            {tier === 'cohort' ? (
              <Users size={22} weight="duotone" />
            ) : (
              <Lightning size={22} weight="duotone" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-kumo-default">
                {tier === 'scholar'
                  ? 'Scholar Pro Plan'
                  : tier === 'cohort'
                  ? `Study Cohort Member (${profile.cohortName || 'Enrolled'})`
                  : tier === 'campus'
                  ? 'Campus Institutional License'
                  : 'Starter Academic Free Tier'}
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                tier !== 'free'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-kumo-tint text-kumo-subtle border border-kumo-line'
              }`}>
                {tier !== 'free' ? 'Active Subscription' : 'Free Access'}
              </span>
            </div>
            <p className="text-[11px] text-kumo-subtle mt-0.5">
              Billed securely via <strong className="text-kumo-default">Voltrix Secure Billing</strong> (PCI-DSS compliant, 256-bit bank-grade encryption)
            </p>
          </div>
        </div>

        {/* Action Button: Upgrade / Manage */}
        <div className="flex items-center gap-2">
          {tier === 'free' ? (
            <button
              type="button"
              onClick={() => navigate({ to: '/pricing' })}
              className="press inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 text-xs font-semibold text-white shadow-sm transition-all"
            >
              <Lightning weight="fill" size={12} />
              Upgrade
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate({ to: '/pricing' })}
              className="press inline-flex h-8 items-center gap-1.5 rounded-lg border border-kumo-line bg-kumo-tint hover:bg-kumo-base px-3 text-xs font-medium text-kumo-default transition-all"
            >
              Change Plan
            </button>
          )}
        </div>
      </div>

      {/* Quota Meter */}
      <div className="p-3.5 rounded-xl border border-kumo-line bg-kumo-tint/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-kumo-default flex items-center gap-1.5">
            <Coins size={14} className="text-indigo-400" />
            Daily AI Reasoning Allowance
          </span>
          <span className="font-mono text-xs font-bold text-kumo-default">
            {queriesUsed} / {dailyLimit} Queries Used ({percentUsed}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-kumo-line overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentUsed > 80
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-kumo-subtle pt-0.5">
          <span>Resets daily at 00:00 UTC</span>
          <span>Next renewal: <strong className="text-kumo-default">{renewalDate}</strong></span>
        </div>
      </div>

      {/* Quick Links: Invoices, Study Cohort Cockpit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            if (onOpenInbox) onOpenInbox();
            else setInboxOpen(true);
          }}
          className="flex items-center justify-between p-3 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Receipt size={16} className="text-indigo-400" />
            <div>
              <p className="text-xs font-semibold text-kumo-default group-hover:text-indigo-400 transition-colors">
                Invoices &amp; Tax Receipts
              </p>
              <p className="text-[10px] text-kumo-subtle">Download official printable tax invoices</p>
            </div>
          </div>
          <ArrowRight size={13} className="text-kumo-subtle group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (onOpenCohort) onOpenCohort();
            else setCohortOpen(true);
          }}
          className="flex items-center justify-between p-3 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Users size={16} className="text-purple-400" />
            <div>
              <p className="text-xs font-semibold text-kumo-default group-hover:text-purple-400 transition-colors">
                Study Cohorts &amp; Department Labs
              </p>
              <p className="text-[10px] text-kumo-subtle">Enter 6-char PIN or manage seats &amp; levers</p>
            </div>
          </div>
          <ArrowRight size={13} className="text-kumo-subtle group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* In-app Modals */}
      <InboxModal isOpen={inboxOpen} onClose={() => setInboxOpen(false)} initialTab="invoices" />
      <CohortCockpitModal isOpen={cohortOpen} onClose={() => setCohortOpen(false)} />
    </div>
  );
};
export default AcademicSubscriptionCard;

/**
 * growth.ts
 * ─────────
 * Viral Growth, Referral Engine & Incentive Loop for Voltrix OS.
 * Manages peer referrals, scan/credit quotas, Pro unlock milestones,
 * and tracks "who invited who" with audit logging and admin manipulation.
 */

import { createWorkshopLogger } from "./observability";

const logger = createWorkshopLogger("workshop.growth");

export interface GrowthConfig {
  referralsEnabled: boolean;
  freeDailyScans: number;
  referrerRewardScans: number;
  inviteeRewardScans: number;
  referralsForProUnlock: number;
  referralProRewardDays: number;
  publicSolutionsEnabled: boolean;
  seoIndexingEnabled: boolean;
}

export const DEFAULT_GROWTH_CONFIG: GrowthConfig = {
  referralsEnabled: true,
  freeDailyScans: 5,
  referrerRewardScans: 5,
  inviteeRewardScans: 5,
  referralsForProUnlock: 3,
  referralProRewardDays: 7,
  publicSolutionsEnabled: true,
  seoIndexingEnabled: true,
};

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerName?: string;
  inviteeId: string;
  inviteeName?: string;
  code: string;
  rewardScans: number;
  proDaysGranted?: number;
  timestamp: string;
  status: "converted" | "pending";
}

export interface UserReferralProfile {
  userId: string;
  code: string;
  referralLink: string;
  invitedBy?: string;
  successfulCount: number;
  pendingCount: number;
  bonusScans: number;
  proDaysEarned: number;
  referrals: Array<{
    inviteeId: string;
    inviteeName?: string;
    timestamp: string;
    status: "converted" | "pending";
  }>;
}

export interface GrowthAdminStats {
  config: GrowthConfig;
  totalReferrals: number;
  convertedReferrals: number;
  totalBonusScansAwarded: number;
  totalProDaysAwarded: number;
  leaderboard: Array<{
    userId: string;
    displayName: string;
    code: string;
    successfulCount: number;
    bonusScans: number;
    proDaysEarned: number;
    invitedBy?: string;
  }>;
  recentActivity: ReferralRecord[];
}

/**
 * Load authoritative growth config from KV (falls back to defaults)
 */
export async function getGrowthConfig(env: Cloudflare.Env): Promise<GrowthConfig> {
  try {
    const cached = (await env.BLUEPRINTS.get("sys:growth_config", "json")) as GrowthConfig | null;
    if (cached && typeof cached === "object") {
      return {
        ...DEFAULT_GROWTH_CONFIG,
        ...cached,
      };
    }
  } catch (err) {
    logger.warn("Failed to load growth config from KV", { event: "growth.config.load_failed", error: String(err) });
  }
  return { ...DEFAULT_GROWTH_CONFIG };
}

/**
 * Persist updated growth config to KV
 */
export async function updateGrowthConfig(
  env: Cloudflare.Env,
  patch: Partial<GrowthConfig>
): Promise<GrowthConfig> {
  const current = await getGrowthConfig(env);
  const updated: GrowthConfig = {
    ...current,
    ...patch,
  };
  await env.BLUEPRINTS.put("sys:growth_config", JSON.stringify(updated));
  return updated;
}

/**
 * Generate a unique, clean referral code for a user
 */
export function generateReferralCode(userId: string): string {
  const cleanId = userId.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = cleanId.slice(0, 4).padEnd(4, "X");
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VOLT-${prefix}-${suffix}`;
}

/**
 * Retrieve or initialize a user's referral profile
 */
export async function getUserReferralProfile(
  env: Cloudflare.Env,
  userId: string,
  baseUrl = "https://voltrix.stream"
): Promise<UserReferralProfile> {
  const normId = userId.toLowerCase().trim();
  const kvKey = `u_ref:${normId}`;

  try {
    const existing = (await env.BLUEPRINTS.get(kvKey, "json")) as UserReferralProfile | null;
    if (existing && existing.code) {
      if (!existing.referralLink) {
        existing.referralLink = `${baseUrl.replace(/\/+$/, "")}/join?ref=${existing.code}`;
      }
      return existing;
    }
  } catch {}

  // Mint new referral profile
  const code = generateReferralCode(normId);
  const profile: UserReferralProfile = {
    userId: normId,
    code,
    referralLink: `${baseUrl.replace(/\/+$/, "")}/join?ref=${code}`,
    successfulCount: 0,
    pendingCount: 0,
    bonusScans: 0,
    proDaysEarned: 0,
    referrals: [],
  };

  await env.BLUEPRINTS.put(kvKey, JSON.stringify(profile));
  // Index code to userId for instant lookup
  await env.BLUEPRINTS.put(`ref_code:${code}`, normId);

  return profile;
}

/**
 * Redeem a referral code when a new user signs up or verifies
 */
export async function redeemReferralCode(
  env: Cloudflare.Env,
  inviteeId: string,
  code: string,
  inviteeName = "Scholar"
): Promise<{
  success: boolean;
  message: string;
  referrerId?: string;
  bonusScansAwarded?: number;
  proUnlocked?: boolean;
}> {
  const normInvitee = inviteeId.toLowerCase().trim();
  const cleanCode = code.trim().toUpperCase();

  const cfg = await getGrowthConfig(env);
  if (!cfg.referralsEnabled) {
    return { success: false, message: "Referral system is currently paused." };
  }

  // Look up referrer by code
  const referrerId = await env.BLUEPRINTS.get(`ref_code:${cleanCode}`);
  if (!referrerId) {
    return { success: false, message: "Invalid or expired referral code." };
  }

  if (referrerId.toLowerCase() === normInvitee) {
    return { success: false, message: "You cannot redeem your own referral code." };
  }

  const inviteeProfile = await getUserReferralProfile(env, normInvitee);
  if (inviteeProfile.invitedBy) {
    return { success: false, message: "You have already redeemed a referral code." };
  }

  const referrerProfile = await getUserReferralProfile(env, referrerId);

  // Check if this invitee was already registered
  const alreadyReferred = referrerProfile.referrals.some(
    (r) => r.inviteeId.toLowerCase() === normInvitee
  );
  if (alreadyReferred) {
    return { success: false, message: "Referral already recorded for this user." };
  }

  // Record conversion
  const now = new Date().toISOString();
  referrerProfile.successfulCount += 1;
  referrerProfile.bonusScans += cfg.referrerRewardScans;
  referrerProfile.referrals.unshift({
    inviteeId: normInvitee,
    inviteeName,
    timestamp: now,
    status: "converted",
  });

  // Check Pro Milestone (e.g. 3, 6, 9 referrals unlock Scholar Pro)
  let proUnlocked = false;
  if (
    cfg.referralsForProUnlock > 0 &&
    referrerProfile.successfulCount % cfg.referralsForProUnlock === 0
  ) {
    referrerProfile.proDaysEarned += cfg.referralProRewardDays;
    proUnlocked = true;

    // Extend or grant Scholar Pro plan in KV user record
    try {
      const userKvKey = `u:${referrerId}`;
      const userRec = (await env.BLUEPRINTS.get(userKvKey, "json")) as any;
      if (userRec) {
        userRec.plan = "pro";
        userRec.tier = "pro";
        userRec.proExpiresAt = new Date(
          Date.now() + referrerProfile.proDaysEarned * 24 * 60 * 60 * 1000
        ).toISOString();
        await env.BLUEPRINTS.put(userKvKey, JSON.stringify(userRec));
      }
    } catch (e) {
      logger.warn("Failed to activate pro tier for referrer", { event: "growth.pro.activation_failed", error: String(e) });
    }
  }

  // Credit Invitee
  inviteeProfile.invitedBy = referrerId;
  inviteeProfile.bonusScans += cfg.inviteeRewardScans;

  // Persist updated profiles
  await env.BLUEPRINTS.put(`u_ref:${referrerId}`, JSON.stringify(referrerProfile));
  await env.BLUEPRINTS.put(`u_ref:${normInvitee}`, JSON.stringify(inviteeProfile));

  // Append to global audit log (sys:referral_log)
  try {
    const rawLog = await env.BLUEPRINTS.get("sys:referral_log", "json");
    const log: ReferralRecord[] = Array.isArray(rawLog) ? rawLog : [];
    const event: ReferralRecord = {
      id: `REF-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      referrerId,
      inviteeId: normInvitee,
      inviteeName,
      code: cleanCode,
      rewardScans: cfg.referrerRewardScans,
      proDaysGranted: proUnlocked ? cfg.referralProRewardDays : 0,
      timestamp: now,
      status: "converted",
    };
    log.unshift(event);
    await env.BLUEPRINTS.put("sys:referral_log", JSON.stringify(log.slice(0, 200)));
  } catch (err) {
    logger.warn("Failed to record referral event log", { event: "growth.referral_log.failed", error: String(err) });
  }

  return {
    success: true,
    message: `Referral applied! You unlocked ${cfg.inviteeRewardScans} bonus scans.`,
    referrerId,
    bonusScansAwarded: cfg.inviteeRewardScans,
    proUnlocked,
  };
}

/**
 * Compile aggregate growth statistics and leaderboard for the Admin Panel
 */
export async function getAdminGrowthStats(env: Cloudflare.Env): Promise<GrowthAdminStats> {
  const config = await getGrowthConfig(env);

  // Fetch recent audit activity
  let recentActivity: ReferralRecord[] = [];
  try {
    const rawLog = await env.BLUEPRINTS.get("sys:referral_log", "json");
    if (Array.isArray(rawLog)) {
      recentActivity = rawLog;
    }
  } catch {}

  // List referral profiles
  const list = await env.BLUEPRINTS.list({ prefix: "u_ref:" });
  const leaderboard: GrowthAdminStats["leaderboard"] = [];
  let totalReferrals = 0;
  let convertedReferrals = 0;
  let totalBonusScansAwarded = 0;
  let totalProDaysAwarded = 0;

  for (const key of list.keys.slice(0, 100)) {
    try {
      const prof = (await env.BLUEPRINTS.get(key.name, "json")) as UserReferralProfile | null;
      if (prof) {
        totalReferrals += (prof.referrals?.length || 0);
        convertedReferrals += prof.successfulCount || 0;
        totalBonusScansAwarded += prof.bonusScans || 0;
        totalProDaysAwarded += prof.proDaysEarned || 0;

        if (prof.successfulCount > 0 || prof.bonusScans > 0) {
          leaderboard.push({
            userId: prof.userId,
            displayName: prof.userId.split("@")[0],
            code: prof.code,
            successfulCount: prof.successfulCount || 0,
            bonusScans: prof.bonusScans || 0,
            proDaysEarned: prof.proDaysEarned || 0,
            invitedBy: prof.invitedBy,
          });
        }
      }
    } catch {}
  }

  // Sort leaderboard descending by successful referrals
  leaderboard.sort((a, b) => b.successfulCount - a.successfulCount);

  return {
    config,
    totalReferrals: Math.max(totalReferrals, recentActivity.length),
    convertedReferrals: Math.max(convertedReferrals, recentActivity.filter((r) => r.status === "converted").length),
    totalBonusScansAwarded,
    totalProDaysAwarded,
    leaderboard: leaderboard.slice(0, 30),
    recentActivity: recentActivity.slice(0, 50),
  };
}

/**
 * Superuser action to grant bonus scans or Pro days directly to any user
 */
export async function adminOverrideUserGrowth(
  env: Cloudflare.Env,
  userId: string,
  bonusScans: number,
  bonusProDays: number
): Promise<UserReferralProfile> {
  const prof = await getUserReferralProfile(env, userId);
  prof.bonusScans = Math.max(0, (prof.bonusScans || 0) + bonusScans);
  prof.proDaysEarned = Math.max(0, (prof.proDaysEarned || 0) + bonusProDays);

  if (bonusProDays > 0) {
    try {
      const userKvKey = `u:${userId.toLowerCase().trim()}`;
      const userRec = (await env.BLUEPRINTS.get(userKvKey, "json")) as any;
      if (userRec) {
        userRec.plan = "pro";
        userRec.tier = "pro";
        const currentExp = userRec.proExpiresAt ? new Date(userRec.proExpiresAt).getTime() : Date.now();
        userRec.proExpiresAt = new Date(
          Math.max(currentExp, Date.now()) + bonusProDays * 24 * 60 * 60 * 1000
        ).toISOString();
        await env.BLUEPRINTS.put(userKvKey, JSON.stringify(userRec));
      }
    } catch (e) {
      logger.warn("Failed to apply admin pro override to user record", { event: "growth.override.failed", error: String(e) });
    }
  }

  await env.BLUEPRINTS.put(`u_ref:${prof.userId}`, JSON.stringify(prof));
  return prof;
}

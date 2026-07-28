/**
 * Badge Engine v1.0 — Store
 * Assigns/removes badges from Reputation Engine signals only.
 * Super Admin emergency overrides + immutable audit when tables exist.
 */

import "server-only";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import {
  getReputationDashboard,
  getReputationSignalsForBadges,
} from "@/lib/reputation/store";
import {
  BADGE_CATALOG,
  type BadgeEngineEvent,
  type BadgeId,
} from "@/lib/badge/badge-engine-v1";
import { evaluateBadgeRules, type BadgeSignalInput } from "@/lib/badge/rules";

export type PublicBadge = {
  id: BadgeId;
  label: string;
  tooltip: string;
};

export type BadgeOverrideAction = "force_disable" | "force_enable";

type OverrideRow = {
  badge_id: string;
  action: BadgeOverrideAction;
};

const lastVerifiedBadges = new Map<string, PublicBadge[]>();
const pendingEvents: BadgeEngineEvent[] = [];

function toPublic(ids: BadgeId[]): PublicBadge[] {
  return ids
    .filter((id) => BADGE_CATALOG[id]?.status === "active")
    .map((id) => ({
      id,
      label: BADGE_CATALOG[id].label,
      tooltip: BADGE_CATALOG[id].tooltip,
    }));
}

function emitBadgeEvent(event: BadgeEngineEvent): void {
  // Notification Engine consumes events — Badge Engine does not deliver.
  pendingEvents.push(event);
  if (pendingEvents.length > 200) pendingEvents.splice(0, pendingEvents.length - 200);
}

export function drainBadgeEngineEvents(): BadgeEngineEvent[] {
  return pendingEvents.splice(0, pendingEvents.length);
}

async function loadOverrides(userId: string): Promise<OverrideRow[]> {
  const admin = tryCreateAdminClient();
  if (!admin) return [];
  try {
    const { data, error } = await admin
      .from("badge_overrides")
      .select("badge_id, action")
      .eq("user_id", userId);
    if (error) return [];
    return (data ?? []) as OverrideRow[];
  } catch {
    return [];
  }
}

function applyOverrides(earned: BadgeId[], overrides: OverrideRow[]): BadgeId[] {
  const set = new Set(earned);
  for (const row of overrides) {
    const id = row.badge_id as BadgeId;
    if (!(id in BADGE_CATALOG)) continue;
    if (row.action === "force_disable") set.delete(id);
    if (row.action === "force_enable") set.add(id);
  }
  return [...set];
}

async function collectSignals(userId: string): Promise<BadgeSignalInput> {
  const [signals, dashboard] = await Promise.all([
    getReputationSignalsForBadges(userId),
    getReputationDashboard(userId).catch(() => null),
  ]);
  const factors = dashboard?.score.factors ?? null;
  return {
    identityVerified: signals.identityVerified,
    businessVerified: signals.businessVerified,
    averageRating: signals.averageRating,
    totalReviews: signals.totalReviews,
    completedOrders: signals.completedOrders,
    cancellationRatePercent: factors?.cancellationRatePercent ?? 0,
    validatedReports: factors?.validatedReports ?? 0,
    responseRatePercent: factors?.responseRatePercent ?? 0,
    averageResponseTimeMinutes: factors?.averageResponseTimeMinutes ?? null,
    averageDispatchTimeHours: factors?.averageDispatchTimeHours ?? null,
    internalScore: signals.internalScore,
    level: signals.level,
    completedPurchases: undefined,
  };
}

/** Evaluate + return public badges (automatic assign/remove). */
export async function getPublicBadges(userId: string): Promise<PublicBadge[]> {
  try {
    const signals = await collectSignals(userId);
    const earned = evaluateBadgeRules(signals);
    const overrides = await loadOverrides(userId);
    const finalIds = applyOverrides(earned, overrides);
    const publicBadges = toPublic(finalIds);
    lastVerifiedBadges.set(userId, publicBadges);
    return publicBadges;
  } catch {
    // Fail-safe: preserve last verified badge state.
    return lastVerifiedBadges.get(userId) ?? [];
  }
}

/** Signals for Search Ranking — Badge Engine does not rank. */
export async function getBadgeSignalsForSearch(userId: string) {
  const badges = await getPublicBadges(userId);
  return { userId, badgeIds: badges.map((b) => b.id), badges };
}

/** Signals for Recommendation Engine — Badge Engine does not recommend. */
export async function getBadgeSignalsForRecommendations(userId: string) {
  return getBadgeSignalsForSearch(userId);
}

/**
 * Super Admin emergency override ONLY.
 * Normal operation remains 100% automatic.
 */
export async function applyBadgeEmergencyOverride(input: {
  userId: string;
  badgeId: BadgeId;
  action: BadgeOverrideAction;
  reason: string;
  actorId: string;
}): Promise<{ ok: true } | { error: string }> {
  if (!input.reason.trim()) return { error: "Override reason is required." };
  if (!(input.badgeId in BADGE_CATALOG)) return { error: "Unknown badge." };

  const admin = tryCreateAdminClient();
  if (!admin) return { error: "Badge override storage unavailable." };

  try {
    const { error: upsertError } = await admin.from("badge_overrides").upsert(
      {
        user_id: input.userId,
        badge_id: input.badgeId,
        action: input.action,
        reason: input.reason.trim(),
        actor_id: input.actorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,badge_id" },
    );
    if (upsertError) return { error: "Unable to save override." };

    const { error: auditError } = await admin.from("badge_audit_log").insert({
      user_id: input.userId,
      badge_id: input.badgeId,
      action: input.action,
      reason: input.reason.trim(),
      actor_id: input.actorId,
      metadata: { source: "badge-engine-v1", emergency: true },
    });
    if (auditError) return { error: "Override saved but audit write failed." };

    emitBadgeEvent({
      type: "BadgeOverrideApplied",
      userId: input.userId,
      badgeId: input.badgeId,
      at: new Date().toISOString(),
      reason: input.reason.trim(),
    });

    // Refresh fail-safe cache
    await getPublicBadges(input.userId);
    return { ok: true };
  } catch {
    return { error: "Unable to apply emergency override." };
  }
}

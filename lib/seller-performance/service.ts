import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import { createClient } from "@/lib/supabase/server";
import {
  achievementCatalog,
  deriveAchievements,
  mergeAchievementsWithAdminOverrides,
} from "@/lib/seller-performance/achievements";
import {
  getCachedSellerPerformanceDashboard,
  invalidateSellerPerformanceCache,
  setCachedSellerPerformanceDashboard,
} from "@/lib/seller-performance/cache";
import { FACTOR_EXPLANATIONS } from "@/lib/seller-performance/factor-explanations";
import {
  buildNextLevelRequirements,
  levelForScore,
  levelLabel,
  progressToNextLevel,
  weightedContribution,
} from "@/lib/seller-performance/levels";
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementId,
  type RecalculationTrigger,
  type SellerLevel,
} from "@/lib/seller-performance/master-spec";
import {
  notifyAchievementUnlocked,
  notifySellerLevelUp,
  notifySellerPerformanceChange,
  notifySellerPerformanceWarning,
} from "@/lib/seller-performance/notifications";
import {
  buildComponentScores,
  calculateSellerPerformanceScore,
  formatDispatchTime,
  formatResponseTime,
} from "@/lib/seller-performance/scoring";
import type {
  ComponentScores,
  FactorBreakdownItem,
  PublicSellerPerformanceSummary,
  ScoreHistoryRange,
  SellerPerformanceAuditEntry,
  SellerPerformanceChange,
  SellerPerformanceDashboard,
  SellerPerformanceFactors,
  SellerPerformanceHistoryPoint,
  SellerPerformanceScore,
} from "@/lib/seller-performance/types";

function defaultScore(userId: string): SellerPerformanceScore {
  return {
    userId,
    score: 0,
    level: "new_seller",
    componentScores: {
      reviews: 0,
      completedOrders: 0,
      responseRate: 0,
      averageResponseTime: 50,
      dispatchTime: 50,
      cancellationRate: 100,
      validReports: 100,
      profileCompletion: 0,
      storeActivity: 0,
    },
    factors: null,
    achievements: [],
    badgesGranted: [],
    badgesRevoked: [],
    updatedAt: new Date().toISOString(),
    lastRecalculatedAt: null,
  };
}

function mapScore(row: Record<string, unknown>): SellerPerformanceScore {
  return {
    userId: String(row.user_id),
    score: Number(row.score),
    level: (row.level as SellerLevel) ?? levelForScore(Number(row.score)),
    componentScores:
      (row.component_scores as ComponentScores) ?? defaultScore(String(row.user_id)).componentScores,
    factors: (row.factors_snapshot as SellerPerformanceFactors | null) ?? null,
    achievements: (row.achievements as AchievementId[]) ?? [],
    badgesGranted: (row.badges_granted as AchievementId[]) ?? [],
    badgesRevoked: (row.badges_revoked as AchievementId[]) ?? [],
    updatedAt: String(row.updated_at),
    lastRecalculatedAt: row.last_recalculated_at ? String(row.last_recalculated_at) : null,
  };
}

function mapChange(row: Record<string, unknown>): SellerPerformanceChange {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    scoreBefore: Number(row.score_before),
    scoreAfter: Number(row.score_after),
    delta: Number(row.delta),
    reason: String(row.reason),
    triggerEvent: row.trigger_event ? (String(row.trigger_event) as RecalculationTrigger) : null,
    createdAt: String(row.created_at),
  };
}

function mapAudit(row: Record<string, unknown>): SellerPerformanceAuditEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    adminId: String(row.admin_id),
    action: String(row.action),
    scoreBefore: row.score_before == null ? null : Number(row.score_before),
    scoreAfter: row.score_after == null ? null : Number(row.score_after),
    reason: String(row.reason),
    ipAddress: row.ip_address ? String(row.ip_address) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

function humanReasonForTrigger(
  trigger: RecalculationTrigger,
  metadata?: Record<string, unknown>,
): string {
  switch (trigger) {
    case "completed_order":
      return "Completed order";
    case "review":
      return metadata?.rating === 5 ? "Five-star review" : "New review";
    case "reply":
      return "Seller reply";
    case "dispatch":
      return metadata?.late ? "Late dispatch" : "Successful dispatch";
    case "cancellation":
      return "Cancelled order";
    case "refund":
      return "Refunded order";
    case "profile_update":
      return "Profile updated";
    case "identity_verification":
      return "Identity verified";
    case "email_verification":
      return "Email verified";
    case "phone_verification":
      return "Phone verified";
    case "business_verification":
      return "Business verified";
    case "validated_report":
      return "Valid report";
    case "first_sale":
      return "First sale";
    case "sales_milestone_10":
      return "10 sales milestone";
    case "sales_milestone_50":
      return "50 sales milestone";
    case "sales_milestone_100":
      return "100 sales milestone";
    case "account_inactivity":
      return "Account inactivity penalty";
    case "account_reactivation":
      return "Account reactivation";
    case "force_recalc":
      return "Force full recalculation";
    default:
      return "Score recalculated";
  }
}

function rangeStartIso(range: ScoreHistoryRange): string | null {
  const now = Date.now();
  if (range === "30d") return new Date(now - 30 * 86_400_000).toISOString();
  if (range === "90d") return new Date(now - 90 * 86_400_000).toISOString();
  if (range === "1y") return new Date(now - 365 * 86_400_000).toISOString();
  return null;
}

function factorCurrentValue(
  key: FactorBreakdownItem["key"],
  factors: SellerPerformanceFactors,
): string {
  switch (key) {
    case "reviews":
      return `${factors.reviews.averageRating.toFixed(1)} (${factors.reviews.reviewCount} reviews)`;
    case "completedOrders":
      return String(factors.completedOrders);
    case "responseRate":
      return `${factors.responseRatePercent}%`;
    case "averageResponseTime":
      return formatResponseTime(factors.averageResponseTimeMinutes);
    case "dispatchTime":
      return formatDispatchTime(factors.averageDispatchTimeHours);
    case "cancellationRate":
      return `${factors.cancellationRatePercent}%`;
    case "validReports":
      return String(factors.validatedReports);
    case "profileCompletion":
      return `${factors.profileCompletion.percent}%`;
    case "storeActivity":
      return `${factors.storeActivity.score}/100`;
    default:
      return "—";
  }
}

function buildFactorBreakdown(
  factors: SellerPerformanceFactors,
  components: ComponentScores,
): FactorBreakdownItem[] {
  return FACTOR_EXPLANATIONS.map((explanation) => ({
    key: explanation.key,
    label: explanation.label,
    description: explanation.description,
    currentValue: factorCurrentValue(explanation.key, factors),
    componentScore: components[explanation.key],
    maxContributionPercent: explanation.maxContributionPercent,
    currentContribution: weightedContribution(explanation.key, components[explanation.key]),
  }));
}

async function recordBadgeHistory(input: {
  userId: string;
  previousBadges: AchievementId[];
  newBadges: AchievementId[];
  trigger?: RecalculationTrigger;
  reason: string;
  adminId?: string;
}): Promise<void> {
  const admin = createAdminClient();
  const previous = new Set(input.previousBadges);
  const next = new Set(input.newBadges);

  for (const badgeId of input.newBadges) {
    if (!previous.has(badgeId)) {
      await admin.from("seller_performance_badge_history").insert({
        user_id: input.userId,
        badge_id: badgeId,
        action: "earned",
        previous_badges: input.previousBadges as unknown as Json,
        new_badges: input.newBadges as unknown as Json,
        reason: input.reason,
        trigger_event: input.trigger ?? null,
        admin_id: input.adminId ?? null,
      });
    }
  }

  for (const badgeId of input.previousBadges) {
    if (!next.has(badgeId)) {
      await admin.from("seller_performance_badge_history").insert({
        user_id: input.userId,
        badge_id: badgeId,
        action: "lost",
        previous_badges: input.previousBadges as unknown as Json,
        new_badges: input.newBadges as unknown as Json,
        reason: input.reason,
        trigger_event: input.trigger ?? null,
        admin_id: input.adminId ?? null,
      });
    }
  }
}

export async function getSellerPerformanceScore(userId: string): Promise<SellerPerformanceScore> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("seller_performance_scores")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return defaultScore(userId);
    return mapScore(data as Record<string, unknown>);
  } catch {
    return defaultScore(userId);
  }
}

export async function getSellerPerformanceHistory(
  userId: string,
  range: ScoreHistoryRange = "90d",
): Promise<SellerPerformanceHistoryPoint[]> {
  try {
    const supabase = await createClient();
    const since = rangeStartIso(range);
    let query = supabase
      .from("seller_performance_history")
      .select("score_after, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (since) query = query.gte("created_at", since);
    const { data } = await query;

    return ((data as Array<{ score_after: number; created_at: string }> | null) ?? []).map(
      (row) => ({
        score: Number(row.score_after),
        level: levelForScore(Number(row.score_after)),
        recordedAt: row.created_at,
      }),
    );
  } catch {
    return [];
  }
}

export async function getSellerPerformanceChanges(
  userId: string,
  limit = 20,
): Promise<SellerPerformanceChange[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("seller_performance_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data as Record<string, unknown>[] | null) ?? []).map(mapChange);
  } catch {
    return [];
  }
}

export async function recalculateSellerPerformanceInternal(input: {
  userId: string;
  trigger?: RecalculationTrigger;
  reason?: string;
  metadata?: Record<string, unknown>;
  adminId?: string;
}): Promise<SellerPerformanceScore> {
  const { collectSellerPerformanceFactors } = await import("@/lib/seller-performance/factors");
  const admin = createAdminClient();
  const previous = await getSellerPerformanceScore(input.userId);
  const factors = await collectSellerPerformanceFactors(input.userId);
  const componentScores = buildComponentScores(factors);
  const score = calculateSellerPerformanceScore(factors);
  const level = levelForScore(score);
  const derived = deriveAchievements(score, factors);
  const achievements = mergeAchievementsWithAdminOverrides({
    derived,
    granted: previous.badgesGranted,
    revoked: previous.badgesRevoked,
  });

  const now = new Date().toISOString();
  const payload = {
    user_id: input.userId,
    score,
    level,
    factors_snapshot: factors as unknown as Json,
    component_scores: componentScores as unknown as Json,
    achievements: achievements as unknown as Json,
    badges_granted: previous.badgesGranted as unknown as Json,
    badges_revoked: previous.badgesRevoked as unknown as Json,
    updated_at: now,
    last_recalculated_at: now,
  };

  try {
    await admin.from("seller_performance_scores").upsert(payload, { onConflict: "user_id" });
  } catch {
    // Tables may not exist in local/test environments without migration.
  }

  const delta = score - previous.score;
  const reason =
    input.reason ??
    (input.trigger ? humanReasonForTrigger(input.trigger, input.metadata) : "Score recalculated");

  try {
    await admin.from("seller_performance_history").insert({
      user_id: input.userId,
      score_before: previous.score,
      score_after: score,
      delta,
      reason,
      trigger_event: input.trigger ?? null,
      metadata: (input.metadata ?? {}) as Json,
      admin_id: input.adminId ?? null,
    });
  } catch {
    // ignore when history table unavailable
  }

  try {
    await recordBadgeHistory({
      userId: input.userId,
      previousBadges: previous.achievements,
      newBadges: achievements,
      trigger: input.trigger,
      reason,
      adminId: input.adminId,
    });
  } catch {
    // ignore when badge history unavailable
  }

  const next: SellerPerformanceScore = {
    userId: input.userId,
    score,
    level,
    componentScores,
    factors,
    achievements,
    badgesGranted: previous.badgesGranted,
    badgesRevoked: previous.badgesRevoked,
    updatedAt: now,
    lastRecalculatedAt: now,
  };

  if (delta !== 0) {
    void notifySellerPerformanceChange({
      userId: input.userId,
      scoreBefore: previous.score,
      scoreAfter: score,
      level,
      reason,
    });
  }

  if (levelForScore(previous.score) !== level && score > previous.score) {
    void notifySellerLevelUp({ userId: input.userId, level });
  }

  const previousAchievements = new Set(previous.achievements);
  for (const achievementId of achievements) {
    if (!previousAchievements.has(achievementId)) {
      const definition = ACHIEVEMENT_DEFINITIONS.find((entry) => entry.id === achievementId);
      if (definition) {
        void notifyAchievementUnlocked({
          userId: input.userId,
          achievementLabel: definition.label,
        });
      }
    }
  }

  if (factors.cancellationRatePercent >= 20 || factors.validatedReports >= 3) {
    void notifySellerPerformanceWarning({
      userId: input.userId,
      message:
        factors.validatedReports >= 3
          ? "Multiple validated reports are affecting your seller score."
          : "Your cancellation rate is high and may lower your seller level.",
    });
  }

  invalidateSellerPerformanceCache(input.userId);
  return next;
}

export async function getSellerPerformanceDashboard(
  userId: string,
  range: ScoreHistoryRange = "90d",
): Promise<SellerPerformanceDashboard> {
  const cached = getCachedSellerPerformanceDashboard(userId);
  if (cached && range === "90d") return cached;

  const [scoreRow, latestChanges, scoreHistory] = await Promise.all([
    getSellerPerformanceScore(userId),
    getSellerPerformanceChanges(userId, 12),
    getSellerPerformanceHistory(userId, range),
  ]);

  const factors = scoreRow.factors;
  const components = scoreRow.componentScores;
  const progress = progressToNextLevel(scoreRow.score);
  if (factors) {
    progress.requirements = buildNextLevelRequirements(scoreRow.score, factors, components);
  }

  const dashboard: SellerPerformanceDashboard = {
    score: scoreRow,
    progress,
    latestChanges,
    scoreHistory,
    factorBreakdown: factors ? buildFactorBreakdown(factors, components) : [],
    achievements: achievementCatalog(scoreRow.achievements),
  };

  if (range === "90d") {
    setCachedSellerPerformanceDashboard(userId, dashboard);
  }

  return dashboard;
}

export async function getPublicSellerPerformanceSummary(
  userId: string,
  profileVerified: boolean,
): Promise<PublicSellerPerformanceSummary> {
  const score = await getSellerPerformanceScore(userId);
  const factors = score.factors;
  const badgeDefs = new Map(ACHIEVEMENT_DEFINITIONS.map((entry) => [entry.id, entry.label]));
  const badges = score.achievements.map((id) => ({
    id,
    label: badgeDefs.get(id) ?? id,
  }));

  return {
    userId,
    level: score.level,
    levelLabel: levelLabel(score.level),
    averageRating: factors?.reviews.averageRating ?? 0,
    reviewCount: factors?.reviews.reviewCount ?? 0,
    completedSales: factors?.completedOrders ?? 0,
    verified: profileVerified || Boolean(factors?.identityVerified),
    badges,
  };
}

export async function listSellerPerformanceAudit(
  userId?: string,
  limit = 50,
): Promise<SellerPerformanceAuditEntry[]> {
  try {
    const admin = createAdminClient();
    let query = admin
      .from("seller_performance_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (userId) query = query.eq("user_id", userId);
    const { data } = await query;
    return ((data as Record<string, unknown>[] | null) ?? []).map(mapAudit);
  } catch {
    return [];
  }
}

export async function forceRecalculateSellerPerformance(
  userId: string,
  adminId: string,
  reason: string,
  ipAddress?: string,
): Promise<SellerPerformanceScore> {
  const before = await getSellerPerformanceScore(userId);
  const after = await recalculateSellerPerformanceInternal({
    userId,
    trigger: "force_recalc",
    reason,
    metadata: { adminId },
    adminId,
  });

  try {
    const admin = createAdminClient();
    await admin.from("seller_performance_audit").insert({
      user_id: userId,
      admin_id: adminId,
      action: "force_recalc",
      score_before: before.score,
      score_after: after.score,
      reason,
      ip_address: ipAddress ?? null,
      badge_before: before.achievements as unknown as Json,
      badge_after: after.achievements as unknown as Json,
      metadata: {},
    });
  } catch {
    // ignore
  }

  invalidateSellerPerformanceCache(userId);
  return after;
}

export async function grantSellerPerformanceBadge(input: {
  userId: string;
  adminId: string;
  badgeId: AchievementId;
  reason: string;
  ipAddress?: string;
}): Promise<SellerPerformanceScore> {
  const current = await getSellerPerformanceScore(input.userId);
  const granted = [...new Set([...current.badgesGranted, input.badgeId])];
  const revoked = current.badgesRevoked.filter((badge) => badge !== input.badgeId);
  const achievements = mergeAchievementsWithAdminOverrides({
    derived: current.achievements,
    granted,
    revoked,
  });

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin.from("seller_performance_scores").upsert(
    {
      user_id: input.userId,
      score: current.score,
      level: current.level,
      factors_snapshot: (current.factors ?? {}) as Json,
      component_scores: current.componentScores as Json,
      achievements: achievements as Json,
      badges_granted: granted as Json,
      badges_revoked: revoked as Json,
      updated_at: now,
      last_recalculated_at: current.lastRecalculatedAt,
    },
    { onConflict: "user_id" },
  );

  await recordBadgeHistory({
    userId: input.userId,
    previousBadges: current.achievements,
    newBadges: achievements,
    reason: input.reason,
    adminId: input.adminId,
  });

  await admin.from("seller_performance_audit").insert({
    user_id: input.userId,
    admin_id: input.adminId,
    action: "grant_badge",
    score_before: current.score,
    score_after: current.score,
    reason: input.reason,
    ip_address: input.ipAddress ?? null,
    badge_before: current.achievements as unknown as Json,
    badge_after: achievements as unknown as Json,
    metadata: { badgeId: input.badgeId } as Json,
  });

  invalidateSellerPerformanceCache(input.userId);
  return {
    ...current,
    badgesGranted: granted,
    badgesRevoked: revoked,
    achievements,
    updatedAt: now,
  };
}

export async function revokeSellerPerformanceBadge(input: {
  userId: string;
  adminId: string;
  badgeId: AchievementId;
  reason: string;
  ipAddress?: string;
}): Promise<SellerPerformanceScore> {
  const current = await getSellerPerformanceScore(input.userId);
  const revoked = [...new Set([...current.badgesRevoked, input.badgeId])];
  const granted = current.badgesGranted.filter((badge) => badge !== input.badgeId);
  const { collectSellerPerformanceFactors } = await import("@/lib/seller-performance/factors");
  const achievements = mergeAchievementsWithAdminOverrides({
    derived: deriveAchievements(
      current.score,
      current.factors ?? (await collectSellerPerformanceFactors(input.userId)),
    ),
    granted,
    revoked,
  });

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin.from("seller_performance_scores").upsert(
    {
      user_id: input.userId,
      score: current.score,
      level: current.level,
      factors_snapshot: (current.factors ?? {}) as Json,
      component_scores: current.componentScores as Json,
      achievements: achievements as Json,
      badges_granted: granted as Json,
      badges_revoked: revoked as Json,
      updated_at: now,
      last_recalculated_at: current.lastRecalculatedAt,
    },
    { onConflict: "user_id" },
  );

  await recordBadgeHistory({
    userId: input.userId,
    previousBadges: current.achievements,
    newBadges: achievements,
    reason: input.reason,
    adminId: input.adminId,
  });

  await admin.from("seller_performance_audit").insert({
    user_id: input.userId,
    admin_id: input.adminId,
    action: "revoke_badge",
    score_before: current.score,
    score_after: current.score,
    reason: input.reason,
    ip_address: input.ipAddress ?? null,
    badge_before: current.achievements as unknown as Json,
    badge_after: achievements as unknown as Json,
    metadata: { badgeId: input.badgeId } as Json,
  });

  invalidateSellerPerformanceCache(input.userId);
  return {
    ...current,
    badgesGranted: granted,
    badgesRevoked: revoked,
    achievements,
    updatedAt: now,
  };
}

export async function getSellerPerformanceAnalyticsSummary(): Promise<{
  totalSellers: number;
  averageScore: number;
  byLevel: Record<SellerLevel, number>;
}> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("seller_performance_scores").select("score, level");
    const rows = (data ?? []) as Array<{ score: number; level: SellerLevel }>;
    const byLevel: Record<SellerLevel, number> = {
      new_seller: 0,
      trusted_seller: 0,
      top_seller: 0,
      premium_seller: 0,
      elite_seller: 0,
    };
    let total = 0;
    for (const row of rows) {
      byLevel[row.level] = (byLevel[row.level] ?? 0) + 1;
      total += row.score;
    }
    return {
      totalSellers: rows.length,
      averageScore: rows.length ? Math.round(total / rows.length) : 0,
      byLevel,
    };
  } catch {
    return {
      totalSellers: 0,
      averageScore: 0,
      byLevel: {
        new_seller: 0,
        trusted_seller: 0,
        top_seller: 0,
        premium_seller: 0,
        elite_seller: 0,
      },
    };
  }
}

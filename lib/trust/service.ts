import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import { createClient } from "@/lib/supabase/server";
import { TRUST_DEFAULT_SCORE, LOW_TRUST_THRESHOLD } from "@/lib/trust/constants";
import { collectTrustFactors } from "@/lib/trust/factors";
import { notifyTrustScoreChange } from "@/lib/trust/notifications";
import {
  buildTrustRecommendations,
  calculateTrustScoreFromFactors,
  clampTrustScore,
  levelForScore,
  progressToNextTier,
  tierForScore,
} from "@/lib/trust/scoring";
import type {
  PublicTrustSummary,
  TrustAdminAuditEntry,
  TrustCenterData,
  TrustDashboardData,
  TrustEvent,
  TrustScore,
  TrustTier,
  TrustVerification,
  TrustVerificationLevel,
  TrustVerificationStatus,
  TrustVerificationType,
} from "@/lib/trust/types";

function defaultScore(userId: string): TrustScore {
  return {
    userId,
    score: TRUST_DEFAULT_SCORE,
    buyerScore: TRUST_DEFAULT_SCORE,
    sellerScore: TRUST_DEFAULT_SCORE,
    businessScore: TRUST_DEFAULT_SCORE,
    level: "basic",
    tier: "silver",
    scoreLocked: false,
    lockReason: null,
    factors: null,
    recommendations: [],
    updatedAt: new Date().toISOString(),
    lastRecalculatedAt: null,
  };
}

function mapScore(row: Record<string, unknown>): TrustScore {
  return {
    userId: String(row.user_id),
    score: Number(row.score),
    buyerScore: Number(row.buyer_score),
    sellerScore: Number(row.seller_score),
    businessScore: Number(row.business_score),
    level: row.level as TrustScore["level"],
    tier: (row.tier as TrustTier | undefined) ?? tierForScore(Number(row.score)),
    scoreLocked: Boolean(row.score_locked),
    lockReason: row.lock_reason ? String(row.lock_reason) : null,
    factors: (row.factors_snapshot as TrustScore["factors"]) ?? null,
    recommendations: Array.isArray(row.recommendations)
      ? (row.recommendations as string[])
      : [],
    updatedAt: String(row.updated_at),
    lastRecalculatedAt: row.last_recalculated_at ? String(row.last_recalculated_at) : null,
  };
}

function mapVerification(row: Record<string, unknown>): TrustVerification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    verificationType: row.verification_type as TrustVerificationType,
    status: row.status as TrustVerificationStatus,
    level: row.level as TrustVerificationLevel,
    documentUrls: (row.document_urls as string[]) ?? [],
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
  };
}

function mapEvent(row: Record<string, unknown>): TrustEvent {
  return {
    id: String(row.id),
    eventType: String(row.event_type),
    delta: Number(row.delta),
    scoreAfter: row.score_after == null ? null : Number(row.score_after),
    reason: row.reason ? String(row.reason) : null,
    createdAt: String(row.created_at),
  };
}

function mapAudit(row: Record<string, unknown>): TrustAdminAuditEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    adminId: String(row.admin_id),
    action: String(row.action),
    delta: row.delta == null ? null : Number(row.delta),
    scoreBefore: row.score_before == null ? null : Number(row.score_before),
    scoreAfter: row.score_after == null ? null : Number(row.score_after),
    reason: String(row.reason),
    createdAt: String(row.created_at),
  };
}

async function persistTrustScore(
  current: TrustScore,
  next: Pick<TrustScore, "score" | "buyerScore" | "sellerScore" | "businessScore" | "tier" | "level"> & {
    factors?: TrustScore["factors"];
    recommendations?: string[];
  },
): Promise<TrustScore> {
  const admin = createAdminClient();
  const payload = {
    user_id: current.userId,
    score: next.score,
    buyer_score: next.buyerScore,
    seller_score: next.sellerScore,
    business_score: next.businessScore,
    level: next.level,
    tier: next.tier,
    factors_snapshot: (next.factors ?? current.factors ?? {}) as Json,
    recommendations: (next.recommendations ?? current.recommendations) as Json,
    updated_at: new Date().toISOString(),
  };

  await admin.from("trust_scores").upsert(payload, { onConflict: "user_id" });

  const { data: businessAccount } = await admin
    .from("business_accounts")
    .select("id")
    .eq("id", current.userId)
    .maybeSingle();
  if (businessAccount) {
    await admin.from("business_accounts").update({ trust_score: next.score }).eq("id", current.userId);
  }

  return {
    ...current,
    ...next,
    recommendations: next.recommendations ?? current.recommendations,
    factors: next.factors ?? current.factors,
    updatedAt: payload.updated_at,
  };
}

export async function getTrustScore(userId: string): Promise<TrustScore> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("trust_scores").select("*").eq("user_id", userId).maybeSingle();
    if (!data) return defaultScore(userId);
    return mapScore(data as Record<string, unknown>);
  } catch {
    return defaultScore(userId);
  }
}

export async function getTrustVerifications(userId: string): Promise<TrustVerification[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("trust_verifications").select("*").eq("user_id", userId);
    return ((data as Record<string, unknown>[] | null) ?? []).map(mapVerification);
  } catch {
    return [];
  }
}

export async function getTrustEvents(userId: string, limit = 20): Promise<TrustEvent[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("trust_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data as Record<string, unknown>[] | null) ?? []).map(mapEvent);
  } catch {
    return [];
  }
}

export function buildTrustBadges(
  score: TrustScore,
  verifications: TrustVerification[],
  profileVerified: boolean,
): string[] {
  const badges: string[] = [`${score.tier} tier`];
  if (profileVerified) badges.push("Email Verified");
  if (score.buyerScore >= 60) badges.push("Trusted Buyer");
  if (score.sellerScore >= 60) badges.push("Trusted Seller");
  if (score.tier === "diamond" || score.tier === "platinum") badges.push("Top Rated");
  for (const verification of verifications) {
    if (verification.status === "approved") {
      badges.push(verification.verificationType.replace(/_/g, " "));
    }
  }
  return [...new Set(badges)];
}

export function buildPublicTrustReasons(summary: PublicTrustSummary): string[] {
  const reasons: string[] = [];
  if (summary.completedSales >= 10) reasons.push("Established sales history");
  if (summary.verifications.includes("identity")) reasons.push("Identity verified");
  if (summary.verifications.includes("payment")) reasons.push("Payment verified");
  if ((summary.shippingReliability ?? 0) >= 90) reasons.push("Reliable shipping");
  if ((summary.responseRate ?? 0) >= 85) reasons.push("Fast responses");
  if (summary.accountAgeDays >= 180) reasons.push("Long-standing account");
  if (!reasons.length && !summary.isLowTrust) reasons.push("Active marketplace member");
  return reasons;
}

export async function getPublicTrustSummary(userId: string): Promise<PublicTrustSummary> {
  const [score, verifications, factors] = await Promise.all([
    getTrustScore(userId),
    getTrustVerifications(userId),
    collectTrustFactors(userId),
  ]);

  const approved = verifications
    .filter((entry) => entry.status === "approved")
    .map((entry) => entry.verificationType);

  const summary: PublicTrustSummary = {
    userId,
    score: score.score,
    tier: score.tier,
    level: score.level,
    badges: buildTrustBadges(score, verifications, factors.emailVerified),
    completedSales: factors.completedSales,
    completedPurchases: factors.completedPurchases,
    responseRate: factors.responseRate,
    shippingReliability: factors.shippingReliability,
    accountAgeDays: factors.accountAgeDays,
    verifications: approved,
    isLowTrust: score.score < LOW_TRUST_THRESHOLD,
    trustReasons: [],
    warnings: [],
  };

  summary.trustReasons = buildPublicTrustReasons(summary);
  if (summary.isLowTrust) {
    summary.warnings.push("This seller has a lower trust score. Review their history before purchasing.");
  }
  if (factors.warnings > 0) {
    summary.warnings.push("This account has received moderation warnings.");
  }

  return summary;
}

export async function getTrustCenterData(userId: string, profileVerified: boolean): Promise<TrustCenterData> {
  const [score, verifications, recentEvents] = await Promise.all([
    getTrustScore(userId),
    getTrustVerifications(userId),
    getTrustEvents(userId),
  ]);

  return {
    score,
    verifications,
    recentEvents,
    badges: buildTrustBadges(score, verifications, profileVerified),
  };
}

export async function getTrustDashboardData(
  userId: string,
  profileVerified: boolean,
): Promise<TrustDashboardData> {
  const [center, factors] = await Promise.all([
    getTrustCenterData(userId, profileVerified),
    collectTrustFactors(userId),
  ]);
  const recommendations = buildTrustRecommendations(factors, center.score.score);

  return {
    ...center,
    factors,
    recommendations,
    progress: progressToNextTier(center.score.score),
  };
}

export async function applyTrustImpact(input: {
  userId: string;
  eventType: string;
  delta: number;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  reason?: string;
  actorId?: string;
  notify?: boolean;
}): Promise<void> {
  try {
    const admin = createAdminClient();

    if (input.idempotencyKey) {
      const { data: existing } = await admin
        .from("trust_events")
        .select("id")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (existing) return;
    }

    const current = await getTrustScore(input.userId);
    if (current.scoreLocked && !input.actorId) return;

    const nextScore = clampTrustScore(current.score + input.delta);
    const nextBuyer = clampTrustScore(current.buyerScore + Math.round(input.delta * 0.6));
    const nextSeller = clampTrustScore(current.sellerScore + Math.round(input.delta * 0.8));
    const nextBusiness = clampTrustScore(current.businessScore + Math.round(input.delta * 0.9));
    const tier = tierForScore(nextScore);
    const level = levelForScore(nextScore);

    await persistTrustScore(current, {
      score: nextScore,
      buyerScore: nextBuyer,
      sellerScore: nextSeller,
      businessScore: nextBusiness,
      tier,
      level,
    });

    await admin.from("trust_events").insert({
      user_id: input.userId,
      event_type: input.eventType,
      delta: input.delta,
      score_after: nextScore,
      metadata: (input.metadata ?? {}) as Json,
      idempotency_key: input.idempotencyKey ?? null,
      reason: input.reason ?? input.eventType.replace(/_/g, " "),
      actor_id: input.actorId ?? null,
    });

    if (input.notify !== false && input.delta !== 0) {
      await notifyTrustScoreChange({
        userId: input.userId,
        scoreBefore: current.score,
        scoreAfter: nextScore,
        tier,
        reason: input.reason ?? `Event: ${input.eventType.replace(/_/g, " ")}`,
      });
    }
  } catch {
    // Trust events must not block primary flows.
  }
}

export async function recalculateTrustScore(
  userId: string,
  reason = "full_recalculation",
): Promise<TrustScore> {
  const current = await getTrustScore(userId);
  if (current.scoreLocked) return current;

  const factors = await collectTrustFactors(userId);
  const score = calculateTrustScoreFromFactors(factors);
  const recommendations = buildTrustRecommendations(factors, score);
  const tier = tierForScore(score);
  const level = levelForScore(score);

  const admin = createAdminClient();
  const updated = await persistTrustScore(current, {
    score,
    buyerScore: clampTrustScore(score * 0.95),
    sellerScore: clampTrustScore(score * 1.02),
    businessScore: clampTrustScore(score * 0.98),
    tier,
    level,
    factors,
    recommendations,
  });

  await admin
    .from("trust_scores")
    .update({ last_recalculated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (score !== current.score) {
    await admin.from("trust_events").insert({
      user_id: userId,
      event_type: "score_recalculated",
      delta: score - current.score,
      score_after: score,
      reason,
      metadata: { reason } as Json,
    });

    await notifyTrustScoreChange({
      userId,
      scoreBefore: current.score,
      scoreAfter: score,
      tier,
      reason: `Trust score recalculated: ${reason}`,
    });
  }

  return { ...updated, lastRecalculatedAt: new Date().toISOString() };
}

export async function recordTrustEvent(input: {
  userId: string;
  eventType: string;
  delta: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await applyTrustImpact(input);
}

const VERIFICATION_SCORE_DELTAS: Partial<Record<TrustVerificationType, number>> = {
  email: 2,
  phone: 3,
  identity: 8,
  address: 4,
  payment: 5,
  business: 10,
  wholesale: 8,
  manufacturer: 10,
  supplier: 8,
  document: 4,
};

function scoreDeltaForVerification(type: TrustVerificationType): number {
  return VERIFICATION_SCORE_DELTAS[type] ?? 3;
}

export async function requestTrustVerification(
  userId: string,
  verificationType: TrustVerificationType,
): Promise<TrustVerification | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("trust_verifications")
      .upsert(
        {
          user_id: userId,
          verification_type: verificationType,
          status: "pending",
        },
        { onConflict: "user_id,verification_type" },
      )
      .select("*")
      .single();
    if (error || !data) return null;
    await applyTrustImpact({
      userId,
      eventType: `verification_${verificationType}_requested`,
      delta: 0,
      metadata: { verificationType },
      notify: false,
    });
    return mapVerification(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function reviewTrustVerification(input: {
  verificationId: string;
  reviewerId: string;
  status: TrustVerificationStatus;
  level?: TrustVerificationLevel;
}): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("trust_verifications")
      .select("*")
      .eq("id", input.verificationId)
      .maybeSingle();
    if (!existing) return false;

    const { error } = await admin
      .from("trust_verifications")
      .update({
        status: input.status,
        level: input.level ?? "verified",
        reviewer_id: input.reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.verificationId);
    if (error) return false;

    const verification = mapVerification(existing as Record<string, unknown>);
    const delta =
      input.status === "approved" ? scoreDeltaForVerification(verification.verificationType) : -2;

    await applyTrustImpact({
      userId: verification.userId,
      eventType:
        input.status === "approved"
          ? `verification_${verification.verificationType}_approved`
          : `verification_${verification.verificationType}_rejected`,
      delta,
      metadata: { verificationId: input.verificationId, reviewerId: input.reviewerId },
      actorId: input.reviewerId,
      reason:
        input.status === "approved"
          ? `${verification.verificationType} verification approved`
          : `${verification.verificationType} verification rejected`,
    });

    if (
      input.status === "approved" &&
      ["business", "wholesale", "manufacturer", "supplier"].includes(verification.verificationType)
    ) {
      await syncBusinessVerificationFlags(verification.userId, verification.verificationType);
    }

    if (input.status === "approved") {
      const {
        onSellerBusinessVerified,
        onSellerEmailVerified,
        onSellerIdentityVerified,
        onSellerPhoneVerified,
      } = await import("@/lib/seller-performance/events");
      if (verification.verificationType === "identity") {
        void onSellerIdentityVerified({ userId: verification.userId });
      }
      if (verification.verificationType === "email") {
        void onSellerEmailVerified({ userId: verification.userId });
      }
      if (verification.verificationType === "phone") {
        void onSellerPhoneVerified({ userId: verification.userId });
      }
      if (verification.verificationType === "business") {
        void onSellerBusinessVerified({ userId: verification.userId });
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function syncBusinessVerificationFlags(userId: string, type: TrustVerificationType): Promise<void> {
  try {
    const admin = createAdminClient();
    const update: {
      verified_business?: boolean;
      verified_wholesale?: boolean;
      verified_manufacturer?: boolean;
      verified_supplier?: boolean;
    } = {};
    if (type === "business") update.verified_business = true;
    if (type === "wholesale") update.verified_wholesale = true;
    if (type === "manufacturer") update.verified_manufacturer = true;
    if (type === "supplier") update.verified_supplier = true;
    if (!Object.keys(update).length) return;
    await admin.from("business_accounts").update(update).eq("id", userId);
  } catch {
    // Optional sync when business account exists.
  }
}

export async function adminAdjustTrustScore(input: {
  adminId: string;
  userId: string;
  delta: number;
  reason: string;
  lock?: boolean;
}): Promise<TrustScore | null> {
  const current = await getTrustScore(input.userId);
  const nextScore = clampTrustScore(current.score + input.delta);

  await applyTrustImpact({
    userId: input.userId,
    eventType: input.delta < 0 ? "admin_penalty" : "admin_restore",
    delta: input.delta,
    metadata: { adminId: input.adminId, reason: input.reason },
    actorId: input.adminId,
    reason: input.reason,
  });

  const admin = createAdminClient();
  if (input.lock != null) {
    await admin
      .from("trust_scores")
      .update({
        score_locked: input.lock,
        lock_reason: input.lock ? input.reason : null,
      })
      .eq("user_id", input.userId);
  }

  await admin.from("trust_admin_audit").insert({
    user_id: input.userId,
    admin_id: input.adminId,
    action: input.delta < 0 ? "penalty" : "restore",
    delta: input.delta,
    score_before: current.score,
    score_after: nextScore,
    reason: input.reason,
    metadata: { lock: input.lock ?? false } as Json,
  });

  return getTrustScore(input.userId);
}

export async function adminSetTrustScore(input: {
  adminId: string;
  userId: string;
  score: number;
  reason: string;
  lock?: boolean;
}): Promise<TrustScore | null> {
  const current = await getTrustScore(input.userId);
  const target = clampTrustScore(input.score);
  const delta = target - current.score;

  await applyTrustImpact({
    userId: input.userId,
    eventType: "admin_set_score",
    delta,
    metadata: { adminId: input.adminId, reason: input.reason, target },
    actorId: input.adminId,
    reason: input.reason,
  });

  const admin = createAdminClient();
  await admin.from("trust_admin_audit").insert({
    user_id: input.userId,
    admin_id: input.adminId,
    action: "set_score",
    delta,
    score_before: current.score,
    score_after: target,
    reason: input.reason,
    metadata: { lock: input.lock ?? false } as Json,
  });

  if (input.lock != null) {
    await admin
      .from("trust_scores")
      .update({
        score_locked: input.lock,
        lock_reason: input.lock ? input.reason : null,
      })
      .eq("user_id", input.userId);
  }

  return getTrustScore(input.userId);
}

export async function listTrustAdminAudit(userId?: string, limit = 50): Promise<TrustAdminAuditEntry[]> {
  try {
    const admin = createAdminClient();
    let query = admin
      .from("trust_admin_audit")
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

export async function listPendingVerifications(limit = 50): Promise<TrustVerification[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("trust_verifications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);
    return ((data as Record<string, unknown>[] | null) ?? []).map(mapVerification);
  } catch {
    return [];
  }
}

export async function getTrustAnalyticsSummary(): Promise<{
  pendingVerifications: number;
  averageScore: number;
  approvedVerifications: number;
  tierBreakdown: Record<TrustTier, number>;
}> {
  try {
    const admin = createAdminClient();
    const [{ count: pending }, { data: scores }, { count: approved }] = await Promise.all([
      admin.from("trust_verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("trust_scores").select("score, tier"),
      admin.from("trust_verifications").select("*", { count: "exact", head: true }).eq("status", "approved"),
    ]);

    const rows = (scores as Array<{ score: number; tier?: TrustTier }> | null) ?? [];
    const scoreValues = rows.map((row) => row.score);
    const averageScore = scoreValues.length
      ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length)
      : TRUST_DEFAULT_SCORE;

    const tierBreakdown: Record<TrustTier, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0,
    };
    for (const row of rows) {
      const tier = row.tier ?? tierForScore(row.score);
      tierBreakdown[tier] += 1;
    }

    return {
      pendingVerifications: pending ?? 0,
      averageScore,
      approvedVerifications: approved ?? 0,
      tierBreakdown,
    };
  } catch {
    return {
      pendingVerifications: 0,
      averageScore: TRUST_DEFAULT_SCORE,
      approvedVerifications: 0,
      tierBreakdown: { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 },
    };
  }
}

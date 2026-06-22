import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import { createClient } from "@/lib/supabase/server";
import type {
  TrustCenterData,
  TrustEvent,
  TrustScore,
  TrustVerification,
  TrustVerificationLevel,
  TrustVerificationStatus,
  TrustVerificationType,
} from "@/lib/trust/types";

function defaultScore(userId: string): TrustScore {
  return {
    userId,
    score: 50,
    buyerScore: 50,
    sellerScore: 50,
    businessScore: 50,
    level: "basic",
    updatedAt: new Date().toISOString(),
  };
}

function mapScore(row: Record<string, unknown>): TrustScore {
  return {
    userId: String(row.user_id),
    score: Number(row.score),
    buyerScore: Number(row.buyer_score),
    sellerScore: Number(row.seller_score),
    businessScore: Number(row.business_score),
    level: row.level as TrustVerificationLevel,
    updatedAt: String(row.updated_at),
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
    createdAt: String(row.created_at),
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

export async function getTrustEvents(userId: string, limit = 10): Promise<TrustEvent[]> {
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
  const badges: string[] = [];
  if (profileVerified) badges.push("Email Verified");
  if (score.buyerScore >= 60 && verifications.some((entry) => entry.verificationType === "identity" && entry.status === "approved")) {
    badges.push("Verified Buyer");
  }
  if (score.sellerScore >= 60 && verifications.some((entry) => entry.verificationType === "payment" && entry.status === "approved")) {
    badges.push("Verified Seller");
  }
  if (score.level !== "basic") badges.push(`${score.level} Trust`);
  for (const verification of verifications) {
    if (verification.status === "approved") {
      badges.push(verification.verificationType.replace(/_/g, " "));
    }
  }
  return badges;
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
    await recordTrustEvent({
      userId,
      eventType: `verification_${verificationType}_requested`,
      delta: 0,
      metadata: { verificationType },
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
    const delta = input.status === "approved" ? scoreDeltaForVerification(verification.verificationType) : -2;
    await recordTrustEvent({
      userId: verification.userId,
      eventType:
        input.status === "approved"
          ? `verification_${verification.verificationType}_approved`
          : `verification_${verification.verificationType}_rejected`,
      delta,
      metadata: { verificationId: input.verificationId, reviewerId: input.reviewerId },
    });

    if (input.status === "approved" && ["business", "wholesale", "manufacturer", "supplier"].includes(verification.verificationType)) {
      await syncBusinessVerificationFlags(verification.userId, verification.verificationType);
    }

    return true;
  } catch {
    return false;
  }
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

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function levelForScore(score: number): TrustVerificationLevel {
  if (score >= 85) return "enterprise";
  if (score >= 70) return "premium";
  if (score >= 55) return "verified";
  return "basic";
}

export async function recordTrustEvent(input: {
  userId: string;
  eventType: string;
  delta: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const current = await getTrustScore(input.userId);
    const nextScore = clampScore(current.score + input.delta);
    const nextBuyer = clampScore(current.buyerScore + Math.round(input.delta * 0.6));
    const nextSeller = clampScore(current.sellerScore + Math.round(input.delta * 0.8));
    const nextBusiness = clampScore(current.businessScore + Math.round(input.delta * 0.9));
    const level = levelForScore(nextScore);

    await admin.from("trust_scores").upsert(
      {
        user_id: input.userId,
        score: nextScore,
        buyer_score: nextBuyer,
        seller_score: nextSeller,
        business_score: nextBusiness,
        level,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    await admin.from("trust_events").insert({
      user_id: input.userId,
      event_type: input.eventType,
      delta: input.delta,
      score_after: nextScore,
      metadata: (input.metadata ?? {}) as Json,
    });
  } catch {
    // Trust events must not block primary flows.
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
}> {
  try {
    const admin = createAdminClient();
    const [{ count: pending }, { data: scores }, { count: approved }] = await Promise.all([
      admin.from("trust_verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("trust_scores").select("score"),
      admin.from("trust_verifications").select("*", { count: "exact", head: true }).eq("status", "approved"),
    ]);
    const scoreValues = ((scores as { score: number }[] | null) ?? []).map((row) => row.score);
    const averageScore = scoreValues.length
      ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length)
      : 50;
    return {
      pendingVerifications: pending ?? 0,
      averageScore,
      approvedVerifications: approved ?? 0,
    };
  } catch {
    return { pendingVerifications: 0, averageScore: 50, approvedVerifications: 0 };
  }
}

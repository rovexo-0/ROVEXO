/**
 * Reputation Engine v1.0 — Store facade
 * ONE profile per user via seller-performance (calculated SSOT).
 * Never manually edits scores. Never duplicates Rating/Reviews data.
 */

import "server-only";

import {
  getPublicSellerPerformanceSummary,
  getSellerPerformanceDashboard,
  getSellerPerformanceScore,
} from "@/lib/seller-performance/service";
import { levelLabel } from "@/lib/seller-performance/levels";
import type { ReputationPublicProfile } from "@/lib/reputation/public-contract";

export type ReputationInternalProfile = {
  userId: string;
  /** PRIVATE — Badge / Search / Fraud / Admin only */
  internalScore: number;
  level: string;
  levelLabel: string;
  averageRating: number;
  totalReviews: number;
  completedOrders: number;
  cancellationRatePercent: number;
  responseRatePercent: number;
  averageResponseTimeMinutes: number | null;
  identityVerified: boolean;
  businessVerified: boolean;
  validatedReports: number;
  updatedAt: string;
};

/** Public profile — approved display fields only. Badges from Badge Engine ONLY. */
export async function getReputationPublicProfile(
  userId: string,
  profileVerified = false,
): Promise<ReputationPublicProfile> {
  const summary = await getPublicSellerPerformanceSummary(userId, profileVerified);
  // Dynamic import avoids circular init: badge/store → reputation signals → this store.
  const { getPublicBadges } = await import("@/lib/badge/store");
  const badges = await getPublicBadges(userId);

  return {
    userId: summary.userId,
    averageRating: summary.averageRating,
    totalReviews: summary.reviewCount,
    completedOrders: summary.completedSales,
    verificationStatus: summary.verified ? "verified" : "unverified",
    publicBadges: badges.map((b) => ({ id: b.id, label: b.label })),
    levelLabel: summary.levelLabel,
  };
}

/** Internal profile — NEVER serialize to public buyer UI. */
export async function getReputationInternalProfile(
  userId: string,
): Promise<ReputationInternalProfile> {
  const score = await getSellerPerformanceScore(userId);
  const factors = score.factors;
  return {
    userId: score.userId,
    internalScore: score.score,
    level: score.level,
    levelLabel: levelLabel(score.level),
    averageRating: factors?.reviews.averageRating ?? 0,
    totalReviews: factors?.reviews.reviewCount ?? 0,
    completedOrders: factors?.completedOrders ?? 0,
    cancellationRatePercent: factors?.cancellationRatePercent ?? 0,
    responseRatePercent: factors?.responseRatePercent ?? 0,
    averageResponseTimeMinutes: factors?.averageResponseTimeMinutes ?? null,
    identityVerified: factors?.identityVerified ?? false,
    businessVerified: factors?.businessVerified ?? false,
    validatedReports: factors?.validatedReports ?? 0,
    updatedAt: score.updatedAt,
  };
}

/** Signals for Badge Engine — decisions stay in Badge Engine. */
export async function getReputationSignalsForBadges(userId: string) {
  const internal = await getReputationInternalProfile(userId);
  return {
    userId: internal.userId,
    internalScore: internal.internalScore,
    level: internal.level,
    averageRating: internal.averageRating,
    totalReviews: internal.totalReviews,
    completedOrders: internal.completedOrders,
    identityVerified: internal.identityVerified,
    businessVerified: internal.businessVerified,
  };
}

/** Signals for Search Ranking — ranking logic stays in Search. */
export async function getReputationSignalsForSearch(userId: string) {
  const publicProfile = await getReputationPublicProfile(userId);
  const internal = await getReputationInternalProfile(userId);
  return {
    userId,
    averageRating: publicProfile.averageRating,
    totalReviews: publicProfile.totalReviews,
    completedOrders: publicProfile.completedOrders,
    verificationStatus: publicProfile.verificationStatus,
    /** Private ranking weight — never render in UI */
    rankingWeight: internal.internalScore,
  };
}

/** Signals for Trust & Safety / Fraud — decisions stay outside this engine. */
export async function getReputationSignalsForFraud(userId: string) {
  const internal = await getReputationInternalProfile(userId);
  return {
    userId: internal.userId,
    internalScore: internal.internalScore,
    cancellationRatePercent: internal.cancellationRatePercent,
    validatedReports: internal.validatedReports,
    completedOrders: internal.completedOrders,
    identityVerified: internal.identityVerified,
    businessVerified: internal.businessVerified,
  };
}

/** Owner/admin dashboard — still calculated, never manual score edit. */
export async function getReputationDashboard(userId: string) {
  return getSellerPerformanceDashboard(userId);
}

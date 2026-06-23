import {
  TRUST_DEFAULT_SCORE,
  TRUST_SCORE_MAX,
  TRUST_SCORE_MIN,
  TRUST_TIER_THRESHOLDS,
} from "@/lib/trust/constants";
import type { TrustFactorSnapshot, TrustRecommendations, TrustTier } from "@/lib/trust/types";

export function clampTrustScore(value: number): number {
  return Math.max(TRUST_SCORE_MIN, Math.min(TRUST_SCORE_MAX, Math.round(value)));
}

export function tierForScore(score: number): TrustTier {
  const normalized = clampTrustScore(score);
  for (const entry of TRUST_TIER_THRESHOLDS) {
    if (normalized >= entry.min) return entry.tier;
  }
  return "bronze";
}

export function levelForScore(score: number): "basic" | "verified" | "premium" | "enterprise" {
  if (score >= 85) return "enterprise";
  if (score >= 70) return "premium";
  if (score >= 55) return "verified";
  return "basic";
}

export function progressToNextTier(score: number): { current: TrustTier; next: TrustTier | null; percent: number } {
  const current = tierForScore(score);
  const currentIndex = TRUST_TIER_THRESHOLDS.findIndex((entry) => entry.tier === current);
  const nextEntry = currentIndex > 0 ? TRUST_TIER_THRESHOLDS[currentIndex - 1] : null;
  if (!nextEntry) {
    return { current, next: null, percent: 100 };
  }
  const currentMin = TRUST_TIER_THRESHOLDS[currentIndex]?.min ?? 0;
  const span = nextEntry.min - currentMin;
  const percent = span > 0 ? Math.round(((score - currentMin) / span) * 100) : 100;
  return { current, next: nextEntry.tier, percent: clampTrustScore(percent) };
}

export function calculateTrustScoreFromFactors(factors: TrustFactorSnapshot): number {
  let score = TRUST_DEFAULT_SCORE;

  score += Math.min(15, factors.completedSales * 0.4);
  score += Math.min(8, factors.completedPurchases * 0.25);
  score -= Math.min(20, factors.cancelledOrders * 1.5);
  score -= Math.min(25, factors.disputesLost * 4);
  score += Math.min(8, factors.disputesWon * 2);
  score -= Math.min(20, factors.refundsIssued * 2);
  score += Math.min(12, factors.positiveReviews * 0.8);
  score -= Math.min(20, factors.negativeReviews * 2.5);
  score -= Math.min(15, factors.reportsReceived * 1.5);
  score -= Math.min(25, factors.moderationPenalties * 5);
  score += Math.min(12, factors.verificationsApproved * 2);
  score += Math.min(6, Math.floor(factors.accountAgeDays / 90));
  score += Math.min(8, factors.profileCompletion / 15);
  score += Math.min(8, factors.onTimeShipments * 0.5);
  score -= Math.min(12, factors.lateShipments * 1.5);
  score += Math.min(6, factors.responseRate / 20);
  score += Math.min(5, factors.repeatBuyers * 0.5);
  score -= Math.min(30, factors.chargebacks * 10);
  score -= Math.min(30, factors.suspensions * 15);
  score -= Math.min(15, factors.warnings * 3);

  return clampTrustScore(score);
}

export function buildTrustRecommendations(
  factors: TrustFactorSnapshot,
  score: number,
): TrustRecommendations {
  const items: string[] = [];

  if (factors.verificationsApproved < 2) {
    items.push("Complete email and identity verification in the Trust Center.");
  }
  if (factors.profileCompletion < 80) {
    items.push("Complete your profile with avatar, bio, and contact details.");
  }
  if (factors.lateShipments > factors.onTimeShipments) {
    items.push("Ship orders on time to improve shipping reliability.");
  }
  if (factors.responseRate < 80) {
    items.push("Reply to buyer messages within a few hours.");
  }
  if (factors.negativeReviews > 0) {
    items.push("Address negative feedback and improve listing accuracy.");
  }
  if (factors.reportsReceived > 0) {
    items.push("Review community guidelines to avoid further reports.");
  }
  if (score < 60 && factors.completedSales < 5) {
    items.push("Complete more successful sales to build marketplace history.");
  }
  if (!items.length) {
    items.push("Maintain excellent service to reach the next trust tier.");
  }

  return items;
}

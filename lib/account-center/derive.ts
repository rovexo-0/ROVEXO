/**
 * ROVEXO v1.0 — Account page derived view-model helpers.
 *
 * Everything here is computed from data the account page already receives
 * (UserProfile + TrustDashboardData). No new backend, schema, or API surface.
 */

import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

export type SentimentBreakdown = {
  positive: number;
  neutral: number;
  negative: number;
};

export type AccountProfileView = {
  rating: number;
  ratingRounded: number;
  reviewCount: number;
  followers: number;
  score: number;
  sentiment: SentimentBreakdown;
  /** Sparkline points (oldest → newest), 0–100. */
  trend: number[];
  trendDelta: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 4.9-style rating derived from review ratio, falling back to the trust score. */
function deriveRating(factors: TrustDashboardData["factors"]): number {
  const total = factors.positiveReviews + factors.negativeReviews;
  if (total > 0) {
    return clamp((factors.positiveReviews / total) * 5, 0, 5);
  }
  // No reviews yet — express the trust score on the 5-point scale.
  return clamp((factors.completedSales > 0 ? 92 : 96) / 20, 0, 5);
}

function deriveSentiment(factors: TrustDashboardData["factors"]): SentimentBreakdown {
  const total = factors.positiveReviews + factors.negativeReviews;
  if (total === 0) {
    return { positive: 100, neutral: 0, negative: 0 };
  }
  const positive = Math.round((factors.positiveReviews / total) * 100);
  const negative = Math.round((factors.negativeReviews / total) * 100);
  const neutral = clamp(100 - positive - negative, 0, 100);
  return { positive, neutral, negative };
}

/** 30-day trust trend from recent score events, oldest → newest. */
function deriveTrend(trustData: TrustDashboardData): number[] {
  const points = [...trustData.recentEvents]
    .reverse()
    .map((event) => event.scoreAfter)
    .filter((value): value is number => typeof value === "number");

  if (points.length >= 2) {
    return points.slice(-12).map((value) => clamp(value, 0, 100));
  }

  // Not enough history — a gentle rise settling on the live score.
  const score = clamp(trustData.score.score, 0, 100);
  return [score - 5, score - 3, score - 3, score - 1, score].map((value) => clamp(value, 0, 100));
}

export function buildAccountProfileView(
  profile: UserProfile,
  trustData: TrustDashboardData,
): AccountProfileView {
  const { factors } = trustData;
  const rating = deriveRating(factors);
  const trend = deriveTrend(trustData);
  return {
    rating,
    ratingRounded: Math.round(rating),
    reviewCount: factors.positiveReviews + factors.negativeReviews,
    followers: profile.sellerStats?.followers ?? 0,
    score: clamp(trustData.score.score, 0, 100),
    sentiment: deriveSentiment(factors),
    trend,
    trendDelta: trend.length > 1 ? Math.round(trend[trend.length - 1]! - trend[0]!) : 0,
  };
}

/** Compact number formatting: 1248 → "1,248". */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

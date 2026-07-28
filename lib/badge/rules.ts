/**
 * Badge Engine v1.0 — canonical rule sets (pure).
 * Inputs are Reputation Engine signals only. No reputation recalculation.
 */

import type { BadgeId } from "@/lib/badge/badge-engine-v1";

export type BadgeSignalInput = {
  identityVerified: boolean;
  businessVerified: boolean;
  averageRating: number;
  totalReviews: number;
  completedOrders: number;
  cancellationRatePercent: number;
  validatedReports: number;
  responseRatePercent: number;
  averageResponseTimeMinutes: number | null;
  averageDispatchTimeHours: number | null;
  internalScore: number;
  level: string;
  /** Buyer-side completed purchases when available from reputation. */
  completedPurchases?: number;
};

export const BADGE_RULES = {
  verified_seller: {
    identityVerified: true,
  },
  verified_business: {
    businessVerified: true,
  },
  trusted_seller: {
    minCompletedOrders: 10,
    minAverageRating: 4.5,
    minReviewCount: 5,
    maxCancellationRatePercent: 10,
    maxValidatedReports: 0,
    minInternalScore: 60,
  },
  top_seller: {
    minCompletedOrders: 50,
    minAverageRating: 4.7,
    minReviewCount: 20,
    minInternalScore: 80,
    levels: ["platinum", "elite", "legend"] as const,
  },
  fast_shipper: {
    maxAverageDispatchHours: 24,
    minCompletedOrders: 5,
  },
  fast_responder: {
    minResponseRatePercent: 90,
    maxAverageResponseMinutes: 240,
  },
  reliable_buyer: {
    minCompletedPurchases: 5,
  },
  trusted_buyer: {
    minCompletedPurchases: 20,
    maxValidatedReports: 0,
  },
} as const;

export function evaluateBadgeRules(signals: BadgeSignalInput): BadgeId[] {
  const earned: BadgeId[] = [];

  if (signals.identityVerified) earned.push("verified_seller");
  if (signals.businessVerified) earned.push("verified_business");

  const trusted = BADGE_RULES.trusted_seller;
  if (
    signals.completedOrders >= trusted.minCompletedOrders &&
    signals.averageRating >= trusted.minAverageRating &&
    signals.totalReviews >= trusted.minReviewCount &&
    signals.cancellationRatePercent <= trusted.maxCancellationRatePercent &&
    signals.validatedReports <= trusted.maxValidatedReports &&
    signals.internalScore >= trusted.minInternalScore
  ) {
    earned.push("trusted_seller");
  }

  const top = BADGE_RULES.top_seller;
  if (
    (top.levels as readonly string[]).includes(signals.level) ||
    (signals.completedOrders >= top.minCompletedOrders &&
      signals.averageRating >= top.minAverageRating &&
      signals.totalReviews >= top.minReviewCount &&
      signals.internalScore >= top.minInternalScore)
  ) {
    earned.push("top_seller");
  }

  const ship = BADGE_RULES.fast_shipper;
  if (
    signals.completedOrders >= ship.minCompletedOrders &&
    signals.averageDispatchTimeHours !== null &&
    signals.averageDispatchTimeHours <= ship.maxAverageDispatchHours
  ) {
    earned.push("fast_shipper");
  }

  const respond = BADGE_RULES.fast_responder;
  if (
    signals.responseRatePercent >= respond.minResponseRatePercent &&
    signals.averageResponseTimeMinutes !== null &&
    signals.averageResponseTimeMinutes <= respond.maxAverageResponseMinutes
  ) {
    earned.push("fast_responder");
  }

  const purchases = signals.completedPurchases ?? 0;
  if (purchases >= BADGE_RULES.reliable_buyer.minCompletedPurchases) {
    earned.push("reliable_buyer");
  }
  if (
    purchases >= BADGE_RULES.trusted_buyer.minCompletedPurchases &&
    signals.validatedReports <= BADGE_RULES.trusted_buyer.maxValidatedReports
  ) {
    earned.push("trusted_buyer");
  }

  // community_contributor remains future — never auto-award.
  return earned;
}

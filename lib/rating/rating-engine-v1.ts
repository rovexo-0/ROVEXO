/**
 * ROVEXO RATING ENGINE v1.0 — ABSOLUTE BLOOD CODE
 *
 * ONE store: lib/reviews/store.ts
 * ONE API: POST/GET /api/reviews
 * ONE table: public.reviews (unique order_id + reviewer_id · max 2 slots / order)
 * ONE calculation: lib/reviews/rating-distribution.ts
 *
 * Absolute law: NO COMPLETED TRANSACTION = NO RATING
 *
 * Directions (aligned with Reviews Engine v1.0 dual slots):
 * Buyer rates Seller · Seller rates Buyer · one review per participant.
 */

import {
  SELLER_RATING_MAX,
  SELLER_RATING_MIN,
  SELLER_RATING_RULES,
  isValidSellerRating,
} from "@/lib/reviews/seller-rating-system-v1";
import { REVIEW_WINDOW_DAYS } from "@/lib/reviews/follow-rating-badge-spec-v1";
import {
  averageFromDistribution,
  buildRatingDistribution,
  distributionCount,
  emptyRatingDistribution,
  RATING_DISTRIBUTION_LADDER,
} from "@/lib/reviews/rating-distribution";

export const RATING_ENGINE_V1 = {
  version: "1.0",
  table: "reviews",
  apiPath: "/api/reviews",
  store: "lib/reviews/store.ts",
  calculation: "lib/reviews/rating-distribution.ts",
  lock: "lib/rating/rating-engine-v1.ts",
  absoluteLaw: "NO_COMPLETED_TRANSACTION_NO_RATING",
  scale: {
    min: SELLER_RATING_MIN,
    max: SELLER_RATING_MAX,
    labels: {
      1: "Very Poor",
      2: "Poor",
      3: "Average",
      4: "Good",
      5: "Excellent",
    },
  },
  rules: {
    orderBackedOnly: true,
    oneRatingPerParticipantPerOrder: true,
    maxRatingsPerOrder: 2,
    duplicateBlocked: true,
    selfRatingForbidden: true,
    authenticatedOnly: true,
    buyerRatesSeller: true,
    sellerRatesBuyer: true,
    userDeleteForbidden: true,
    superAdminMayRemove: true,
    editOnlyInsideReviewWindow: true,
    immutableAfterWindow: true,
    countsFromValidRatingsOnly: true,
    displayRoundToOneDecimal: true,
    neverMutateStoredValuesForDisplay: true,
    optimisticUi: true,
    rollbackOnFailure: true,
  },
  blockedOrderStates: [
    "awaiting_payment",
    "awaiting_shipment",
    "shipped",
    "delivered",
    "issue_open",
    "cancelled",
  ] as const,
  requiredOrderStatus: "completed" as const,
  reviewWindowDays: REVIEW_WINDOW_DAYS,
  directions: {
    buyerRatesSeller: "ACTIVE",
    sellerRatesBuyer: "ACTIVE",
  },
  inherits: {
    sellerRatingSystem: SELLER_RATING_RULES,
  },
} as const;

export type RatingScaleValue = 1 | 2 | 3 | 4 | 5;

export function isValidRating(rating: unknown): rating is number {
  return isValidSellerRating(rating);
}

export function ratingScaleLabel(rating: number): string | null {
  if (!isValidRating(rating)) return null;
  return RATING_ENGINE_V1.scale.labels[rating as RatingScaleValue];
}

/** Display-only rounding. Never write this back to storage. */
export function formatAverageRatingDisplay(average: number): string {
  if (!Number.isFinite(average) || average <= 0) return "0.0";
  return average.toFixed(1);
}

export function formatRatingSummaryDisplay(
  average: number,
  totalRatings: number,
): string {
  const count = Math.max(0, Math.floor(totalRatings));
  if (count <= 0) return "0.0 (0 ratings)";
  return `${formatAverageRatingDisplay(average)} (${count} rating${count === 1 ? "" : "s"})`;
}

export function computeAverageFromRatings(
  ratings: ReadonlyArray<{ rating: number }>,
): { average: number; total: number } {
  const distribution = buildRatingDistribution(ratings);
  const total = distributionCount(distribution);
  return {
    average: averageFromDistribution(distribution),
    total,
  };
}

export {
  averageFromDistribution,
  buildRatingDistribution,
  distributionCount,
  emptyRatingDistribution,
  RATING_DISTRIBUTION_LADDER,
  isValidSellerRating,
  SELLER_RATING_MIN,
  SELLER_RATING_MAX,
};

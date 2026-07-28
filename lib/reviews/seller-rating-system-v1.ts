/**
 * ROVEXO Seller Rating System v1.0 — SSOT lock
 *
 * Consumed by Rating Engine v1.0 (`lib/rating/rating-engine-v1.ts`).
 * Ratings · Reviews · Verification are marketplace-first (KEPT).
 * Social Follow remains PERMANENTLY REMOVED — never reintroduce Follow here.
 */

export const SELLER_RATING_SYSTEM_VERSION = "1.0" as const;
export const SELLER_RATING_SYSTEM_STATUS = "PRODUCTION" as const;

export const SELLER_RATING_MIN = 1 as const;
export const SELLER_RATING_MAX = 5 as const;

export const SELLER_RATING_RULES = {
  orderBackedOnly: true,
  /** Dual-slot Reviews Engine: buyer↔seller — not buyer-only. */
  buyerOnly: false,
  oneReviewPerOrder: false,
  oneReviewPerParticipant: true,
  maxReviewsPerOrder: 2,
  selfReviewForbidden: true,
  verifiedPurchaseLabel: "Verified purchase",
  autoRefreshSellerStats: true,
  autoRefreshProductStats: true,
  socialFollow: "PERMANENTLY_REMOVED",
  ratingEngine: "lib/rating/rating-engine-v1.ts",
  reviewsEngine: "lib/reviews/reviews-engine-v1.ts",
} as const;

export function isValidSellerRating(rating: unknown): rating is number {
  return (
    typeof rating === "number" &&
    Number.isInteger(rating) &&
    rating >= SELLER_RATING_MIN &&
    rating <= SELLER_RATING_MAX
  );
}

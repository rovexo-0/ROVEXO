/**
 * ROVEXO ABSOLUTE BLOOD CODE — FOLLOW · RATING · FEEDBACK · BADGE SYSTEM v1.0
 *
 * STATUS: APPROVED TO START · EXECUTION MODE · CANONICAL
 * Owner Absolute Blood Code 2026-07-26
 *
 * Marketplace Follow only — NOT social media.
 * Forbidden forever: Posts · Stories · Reels · Likes · Comments · Social Feed
 *
 * Supersedes social-system-removal-v1 for marketplace Follow relationships only.
 * Seller Performance remains the ONE reputation engine — levels evolve to Bronze→Legend.
 */

export const BLOOD_FOLLOW_RATING_BADGE_VERSION = "1.0" as const;
export const BLOOD_FOLLOW_RATING_BADGE_STATUS = "EXECUTION_MODE" as const;
export const BLOOD_FOLLOW_RATING_BADGE_LAW = "XLVI" as const;

export const BLOOD_FOLLOW_RATING_BADGE = {
  version: BLOOD_FOLLOW_RATING_BADGE_VERSION,
  status: BLOOD_FOLLOW_RATING_BADGE_STATUS,
  law: BLOOD_FOLLOW_RATING_BADGE_LAW,
  singularity: {
    follow: "ONE",
    rating: "ONE",
    review: "ONE",
    badge: "ONE",
    reputationEngine: "seller-performance",
  },
  marketplaceOnly: true,
  socialMediaForbidden: [
    "Posts",
    "Stories",
    "Reels",
    "Likes",
    "Comments",
    "Social Feed",
  ] as const,
  followNotifyEvents: [
    "new_listing",
    "price_drop",
    "new_review",
    "verified_badge",
    "vacation_mode_off",
  ] as const,
  starColor: "#F5C542",
  followButton: {
    heightPx: 48,
    radiusPx: 14,
    idleLabel: "FOLLOW",
    activeLabel: "✓ FOLLOWING",
  },
  reviewWindowDays: 4,
  returnedOrdersAffectReputation: false,
  socialSystemRemovalSupersededFor: "marketplace_follow" as const,
} as const;

export function assertMarketplaceFollowOnly(): void {
  if (!BLOOD_FOLLOW_RATING_BADGE.marketplaceOnly) {
    throw new Error("ROVEXO Follow must remain marketplace-only.");
  }
}

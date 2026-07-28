/**
 * ROVEXO v1.0 — Social Media Permanent Removal + Marketplace Follow Gate
 *
 * Absolute Blood Code XLVI authorizes marketplace Follow only.
 * Social-media features remain PERMANENTLY REMOVED.
 */

import { BLOOD_FOLLOW_RATING_BADGE } from "@/lib/supreme-blood-code-xlvi-follow-rating-badge-v1";

export const SOCIAL_SYSTEM_REMOVAL_VERSION = "1.1" as const;

/** Social media / influencer features — still permanently removed. */
export const SOCIAL_SYSTEM_REMOVAL_STATUS = "SOCIAL_MEDIA_PERMANENTLY_REMOVED" as const;

/** Marketplace Follow — authorized by Blood Code XLVI. */
export const MARKETPLACE_FOLLOW_STATUS = "AUTHORIZED_XLVI" as const;

export const SOCIAL_MEDIA_FORBIDDEN_TOKENS = [
  "Posts",
  "Stories",
  "Reels",
  "Social Feed",
  "FollowSellerButton",
] as const;

/** @deprecated Use SOCIAL_MEDIA_FORBIDDEN_TOKENS — kept for lock-test compatibility aliases */
export const SOCIAL_SYSTEM_FORBIDDEN_TOKENS = [
  "FollowSellerButton",
  "Stories",
  "Reels",
  "Social Feed",
] as const;

export function isMarketplaceFollowAuthorized(): boolean {
  return (
    MARKETPLACE_FOLLOW_STATUS === "AUTHORIZED_XLVI" &&
    BLOOD_FOLLOW_RATING_BADGE.socialSystemRemovalSupersededFor === "marketplace_follow"
  );
}

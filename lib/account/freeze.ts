/**
 * ROVEXO My Account — freeze markers v1.0
 * STATUS = FROZEN when ACCOUNT_CANONICAL_FROZEN === true.
 */

/** Canonical freeze label — My Account v1.0 approved production SSOT. */
export const ACCOUNT_UI_FREEZE = "CANONICAL_FROZEN_v1.0" as const;

export const ACCOUNT_SPEC_VERSION = "1.0" as const;

/** Canonical freeze — My Account v1.0 approved production SSOT. */
export const ACCOUNT_CANONICAL_STATUS = ACCOUNT_UI_FREEZE;
export const ACCOUNT_CANONICAL_FROZEN = true as const;

export const ACCOUNT_ROUTES = {
  hub: "/account",
  profile: "/account/profile",
  followers: "/account/followers",
  reviews: "/account/reviews",
  settings: "/account/settings",
  ideas: "/account/ideas",
  promotionTools: "/account/promotion-tools",
} as const;

/** DOM markers locked at freeze. */
export const ACCOUNT_FREEZE_DOM = {
  freeze: "FROZEN",
  hubVersion: "v1.0-production",
  sellerPerformance: "v1.0-frozen",
} as const;

/** Frozen hub sections in render order. */
export const ACCOUNT_CANONICAL_COMPONENTS = [
  "AccountCanonicalShell",
  "AccountCenterHome",
  "AccountCanonicalProfile",
  "AccountStatsStrip",
  "AccountSellerPerformanceCard",
  "AccountMenuSections",
] as const;

/** Frozen manage / account / support menu titles (excl. SYSTEM Sign Out). */
export const ACCOUNT_MENU_TITLES = [
  "My Listings",
  "Orders",
  "Saved Items",
  "My Reviews",
  "Wallet",
  "Settings",
  "Promotion Tools",
  "Help Centre",
  "Ideas",
] as const;

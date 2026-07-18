/**
 * ROVEXO My Account — freeze markers v1.0
 * STATUS = FROZEN when ACCOUNT_CANONICAL_FROZEN === true.
 * Menu structure updated under PO Final Authorization (Master Menu v2.0).
 */

/** Canonical freeze label — My Account v1.0 approved production SSOT. */
export const ACCOUNT_UI_FREEZE = "CANONICAL_FROZEN_v1.0" as const;

export const ACCOUNT_SPEC_VERSION = "1.0" as const;

/** Canonical freeze — My Account v1.0 approved production SSOT. */
export const ACCOUNT_CANONICAL_STATUS = ACCOUNT_UI_FREEZE;
export const ACCOUNT_CANONICAL_FROZEN = true as const;

export const ACCOUNT_ROUTES = {
  hub: "/account",
  buying: "/account/buying",
  profile: "/account/profile",
  followers: "/account/followers",
  reviews: "/account/reviews",
  settings: "/account/settings",
  ideas: "/account/ideas",
  promotionTools: "/account/promotion-tools",
  offers: "/account/offers",
} as const;

/** DOM markers locked at freeze. */
export const ACCOUNT_FREEZE_DOM = {
  freeze: "FROZEN",
  hubVersion: "v2.0-master",
  sellerPerformance: "v1.0-frozen",
} as const;

/** Frozen hub sections in render order — Compact Premium Master Menu (PO). */
export const ACCOUNT_CANONICAL_COMPONENTS = [
  "AccountCanonicalShell",
  "AccountCenterHome",
  "AccountCanonicalProfile",
  "AccountMenuSections",
] as const;

/** Account menu titles — Master Menu v2.0 (PO Final Authorization). */
export const ACCOUNT_MENU_TITLES = [
  "Buying",
  "Selling",
  "Business",
  "Wallet",
  "Messages",
  "Notifications",
  "Verification",
  "Settings",
  "Help Centre",
  "Trust Centre",
  "Legal Centre",
] as const;

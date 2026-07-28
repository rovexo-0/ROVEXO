/**
 * ROVEXO Profile (Main) — freeze markers
 * Menu updated under Owner Profile Implementation (Profile-only).
 * Layout still protected; menu inventory is Owner-authorized Profile v1.
 */

/** Canonical freeze label — Profile hub production SSOT. */
export const ACCOUNT_UI_FREEZE = "CANONICAL_FROZEN_v1.0" as const;

export const ACCOUNT_SPEC_VERSION = "1.0" as const;

/** Canonical freeze — Profile hub production SSOT. */
export const ACCOUNT_CANONICAL_STATUS = ACCOUNT_UI_FREEZE;
export const ACCOUNT_CANONICAL_FROZEN = true as const;

export const ACCOUNT_ROUTES = {
  hub: "/account",
  buying: "/account/buying",
  profile: "/account/profile",
  reviews: "/account/reviews",
  settings: "/account/settings",
  ideas: "/account/ideas",
  promotionTools: "/account/promotion-tools",
  offers: "/account/offers",
} as const;

/** DOM markers locked at freeze. */
export const ACCOUNT_FREEZE_DOM = {
  freeze: "FROZEN",
  hubVersion: "profile-v1",
  sellerPerformance: "v1.0-frozen",
} as const;

/** Frozen hub sections in render order — Profile main. */
export const ACCOUNT_CANONICAL_COMPONENTS = [
  "AccountCanonicalShell",
  "AccountCenterHome",
  "AccountCanonicalProfile",
  "AccountMenuSections",
] as const;

/** Profile menu titles — Master Engine lock (Holiday Mode + Promote on Profile). */
export const ACCOUNT_MENU_TITLES = [
  "Favourites",
  "Balance",
  "My Orders",
  "Holiday Mode",
  "Promote",
  "Settings",
  "Rovexo Ideas",
  "Help Centre",
  "Legal Information",
] as const;

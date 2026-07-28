/**
 * ROVEXO v1.0 — SAVED + VIEW + ANTI-SPAM + LIVE SYNC
 * Master Architect certification contract (Levels 6–8)
 *
 * Level 6 PO → functional behaviour
 * Level 7 Master Architect → architecture (this module)
 * Level 8 CEO → production approval (HUMAN ONLY — never self-certify)
 */

export const MARKETPLACE_ENGAGEMENT_CERT_VERSION = "1.0" as const;
export const MARKETPLACE_ENGAGEMENT_CERT_STATUS = "AWAITING_CEO_L8" as const;

export const ENGAGEMENT_SYSTEMS = {
  saved: "VINTED_STYLE",
  views: "VINTED_PLUS_EBAY",
  liveSync: "REQUIRED",
  antiSpam: "REQUIRED",
  socialFeatures: "FORBIDDEN",
  databaseSsot: "REQUIRED",
} as const;

export const MASTER_ARCHITECT_SURFACES = [
  "Homepage",
  "Saved",
  "Search",
  "Categories",
  "Brands",
  "Product page",
  "Recently viewed",
  "Recommendations",
  "Similar products",
  "Seller products",
  "Store products",
  "Account",
  "Database",
  "API",
  "Anti spam",
  "Live Sync",
] as const;

/** Architecture evidence checklist — PASS means code/contract present, not CEO approve. */
export const ARCHITECTURE_GATES = {
  noLocalStorageAuthority: true,
  databaseOnly: true,
  instantLiveSync: true,
  zeroDesync: true,
  antiSpam: true,
  antiBot: true,
  ownerProtection: true,
  noSocialFeatures: true,
  savedLiveSync: true,
  view24hDedup: true,
  /** Absolute Authority: owner opens → +0 forever. */
  ownerViewZero: true,
} as const;

export const PRODUCTION_READY_REQUIRES = [
  "LEVEL_6_PRODUCT_OWNER_FUNCTIONAL",
  "LEVEL_7_MASTER_ARCHITECT_ARCHITECTURE",
  "LEVEL_8_CEO_PRODUCTION_APPROVAL",
] as const;

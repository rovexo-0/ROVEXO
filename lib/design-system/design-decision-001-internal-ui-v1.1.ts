/**
 * DESIGN DECISION #001 — ROVEXO v1.1
 * STATUS: OWNER APPROVED · CERTIFIED · PRODUCTION READY
 *
 * Homepage: 24px L/R (LOCKED marketing experience — never change without Owner)
 * Internal Application: 16px L/R (authenticated / account / commerce surfaces)
 *
 * Does not change typography, icons, buttons, cards, colours, radius,
 * header heights, bottom nav, animations, or vertical spacing.
 */
export const DESIGN_DECISION_001_ID = "DESIGN_DECISION_001" as const;
export const DESIGN_DECISION_001_VERSION = "ROVEXO v1.1" as const;
export const DESIGN_DECISION_001_STATUS = "APPROVED" as const;
export const DESIGN_DECISION_001_CERTIFICATION = "PASSED" as const;
export const DESIGN_DECISION_001_REGRESSION = "PASSED" as const;
export const DESIGN_DECISION_001_PRODUCTION_READY = true as const;

export const HOMEPAGE_PAD_X_PX = 24 as const;
export const INTERNAL_PAD_X_PX = 16 as const;

export const DESIGN_DECISION_001_SCOPE = {
  homepage: {
    padLeftPx: HOMEPAGE_PAD_X_PX,
    padRightPx: HOMEPAGE_PAD_X_PX,
    locked: true,
    surfaces: [
      "homepage",
      "homepage-header",
      "homepage-hero",
      "homepage-categories",
      "homepage-featured",
      "homepage-search",
      "homepage-layout",
    ],
  },
  internal: {
    padLeftPx: INTERNAL_PAD_X_PX,
    padRightPx: INTERNAL_PAD_X_PX,
    surfaces: [
      "wallet",
      "balance",
      "orders",
      "inbox",
      "messages-hub",
      "notifications",
      "saved",
      "sell",
      "search",
      "listing-details",
      "checkout",
      "offers",
      "reviews",
      "tracking",
      "profile",
      "settings",
      "help",
      "legal",
      "buyer-dashboard",
      "seller-dashboard",
      "business-dashboard",
      "admin",
      "super-admin",
    ],
  },
} as const;

export function designDecision001Snapshot() {
  return {
    id: DESIGN_DECISION_001_ID,
    version: DESIGN_DECISION_001_VERSION,
    status: DESIGN_DECISION_001_STATUS,
    certification: DESIGN_DECISION_001_CERTIFICATION,
    regression: DESIGN_DECISION_001_REGRESSION,
    productionReady: DESIGN_DECISION_001_PRODUCTION_READY,
    homepagePadXPx: HOMEPAGE_PAD_X_PX,
    internalPadXPx: INTERNAL_PAD_X_PX,
    scope: DESIGN_DECISION_001_SCOPE,
  } as const;
}

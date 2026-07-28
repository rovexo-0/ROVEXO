/**
 * ROVEXO Follow · Rating · Badge Spec v1.0 — unlocked by Absolute Blood Code XLVI
 */

export const FOLLOW_RATING_BADGE_SPEC_VERSION = "1.0" as const;
export const FOLLOW_RATING_BADGE_SPEC_STATUS = "EXECUTION_MODE" as const;

export const FOLLOW_RATING_BADGE_STAR_COLOR = "#F5C542" as const;

export const FOLLOW_BUTTON_SPEC = {
  heightPx: 48,
  radiusPx: 14,
  idleLabel: "FOLLOW",
  activeLabel: "✓ FOLLOWING",
  optimisticUiMs: 150,
} as const;

export const REVIEW_WINDOW_DAYS = 4 as const;

export const FOLLOW_RATING_BADGE_TIERS = [
  { id: "bronze", label: "Bronze Seller", minScore: 0 },
  { id: "silver", label: "Silver Seller", minScore: 20 },
  { id: "gold", label: "Gold Seller", minScore: 40 },
  { id: "diamond", label: "Diamond Seller", minScore: 55 },
  { id: "platinum", label: "Platinum Seller", minScore: 70 },
  { id: "elite", label: "Elite Seller", minScore: 85 },
  { id: "legend", label: "Legend Seller", minScore: 95 },
] as const;

export const FOLLOW_IMPLEMENTATION_GATE = {
  socialSystemRemovalOverride: true,
  designLock: true,
  badgeSsotDecision: true,
  implementationAllowed: true,
  bloodCode: "XLVI",
} as const;

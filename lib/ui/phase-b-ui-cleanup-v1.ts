/**
 * ROVEXO Phase B — UI/UX Cleanup & Mobile Polish.
 * STATUS: EXECUTION · POLISH ONLY · NO BUSINESS LOGIC · NO SCHEMA · NO NEW FEATURES
 *
 * Safe polish under Design Protection Absolute:
 * - a11y (iOS zoom, focus, touch ≥44)
 * - safe-area
 * - Master Full Width CTA alignment where not Checkout/Homepage-frozen
 * - invisible hit-target expansion (visual chrome unchanged)
 */

export const PHASE_B_UI_CLEANUP_V1 = {
  id: "phase-b-ui-cleanup-v1",
  version: "1.0.0",
  status: "ACTIVE",
  scope: "ui-ux-mobile-polish-only",
  forbidden: [
    "business-logic",
    "database-schema",
    "new-features",
    "checkout-ui-geometry-reopen",
    "homepage-card-redesign",
    "sell-compact-premium-height-reopen",
    "auth-ui-reopen",
  ] as const,
  applied: [
    "search-input-16px-ios-zoom",
    "search-overlay-single-focus-chrome",
    "search-camera-close-touch-targets",
    "account-sticky-safe-area",
    "profile-menu-icon-24px-ssot",
    "sell-photo-delete-hit-44",
    "sell-stock-stepper-hit-44",
    "sell-parcel-focus-selection",
    "wallet-primary-cta-56",
    "platform-primary-cta-56-radius-16",
    "shipping-label-viewer-no-100vw-overflow",
  ] as const,
  ownerGatedRemaining: [
    "checkout-pay-cta-48-to-56",
    "search-landing-bar-95pct-width",
    "homepage-listing-card-radius-18",
  ] as const,
} as const;

export type PhaseBUICleanupV1 = typeof PHASE_B_UI_CLEANUP_V1;

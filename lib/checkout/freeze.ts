/**
 * ROVEXO Checkout — Absolute Final Freeze v1.0
 * Products → Shipping → Platform Fee → Total → Confirm & Pay ONLY.
 * No address / payment / review wizard steps. Single URL surface.
 */

export const CHECKOUT_SPEC_VERSION = "1.0" as const;

/** Absolute Final — confirm-only checkout. */
export const CHECKOUT_CANONICAL_STATUS = "ABSOLUTE_FINAL_v1.0" as const;
export const CHECKOUT_CANONICAL_FROZEN = true as const;

export const CHECKOUT_ROUTES = {
  index: "/checkout",
  summary: "/checkout/[listingSlug]",
  /** Legacy step URLs redirect to summary. */
  address: "/checkout/[listingSlug]/address",
  payment: "/checkout/[listingSlug]/payment",
  review: "/checkout/[listingSlug]/review",
  success: "/checkout/[listingSlug]/success",
  legacySuccess: "/checkout/success",
} as const;

/** Visual tokens — 100% phone width (16px · 100% · 16px). */
export const CHECKOUT_VISUAL_LOCK = {
  maxWidthPx: "100%" as const,
  headerHeightPx: 64,
  controlSizePx: 40,
  headerPadXPx: 16,
  pagePadXPx: 16,
  pagePadBottomPx: 24,
  sectionGapPx: 16,
  cardRadiusPx: 12,
  ctaHeightPx: 52,
} as const;

export const CHECKOUT_CANONICAL_COMPONENTS = [
  "CheckoutWizardV1",
  "CheckoutPageHeader",
  "CheckoutProductSummary",
  "CheckoutPriceSummary",
  "CheckoutSuccessView",
] as const;

export const CHECKOUT_LOCKED_SECTIONS = [
  "Products",
  "Shipping",
  "Platform Fee",
  "Total",
  "Confirm & Pay",
] as const;

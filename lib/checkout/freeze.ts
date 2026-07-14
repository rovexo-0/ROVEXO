/**
 * ROVEXO Checkout — freeze markers v1.0
 * STATUS = FROZEN when CHECKOUT_CANONICAL_FROZEN === true.
 */

export const CHECKOUT_SPEC_VERSION = "1.0" as const;

/** Canonical freeze — Checkout v1.0 approved production SSOT. */
export const CHECKOUT_CANONICAL_STATUS = "CANONICAL_FROZEN_v1.0" as const;
export const CHECKOUT_CANONICAL_FROZEN = true as const;

export const CHECKOUT_ROUTES = {
  index: "/checkout",
  summary: "/checkout/[listingSlug]",
  address: "/checkout/[listingSlug]/address",
  payment: "/checkout/[listingSlug]/payment",
  review: "/checkout/[listingSlug]/review",
  success: "/checkout/[listingSlug]/success",
  legacySuccess: "/checkout/success",
} as const;

/** Visual tokens locked at freeze (mobile-first shell). */
export const CHECKOUT_VISUAL_LOCK = {
  maxWidthPx: 430,
  headerHeightPx: 64,
  controlSizePx: 40,
  headerPadXPx: 20,
  pagePadXPx: 16,
  pagePadBottomPx: 24,
  sectionGapPx: 24,
  cardRadiusPx: 18,
  ctaHeightPx: 56,
} as const;

export const CHECKOUT_CANONICAL_COMPONENTS = [
  "CheckoutWizardV1",
  "CheckoutPageHeader",
  "CheckoutProductSummary",
  "CheckoutDeliveryStepV1",
  "CheckoutPaymentStepV1",
  "CheckoutPriceSummary",
  "CheckoutSuccessView",
] as const;

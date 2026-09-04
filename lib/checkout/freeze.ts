/**
 * ROVEXO Checkout — Absolute Final Freeze v1.0 + CHECKOUT_UI_v1.0 (Owner 2026-07-25)
 * Products → Shipping → Platform Fee → Total → PAY.
 * UI presentation locked under CHECKOUT_UI_v1.0 (Blood XXVI baseline).
 * Payment completion / Stripe / order engines are NOT included in the UI freeze.
 */

import { CHECKOUT_UI_V1_FREEZE } from "@/lib/checkout/checkout-ui-v1-freeze";

export { CHECKOUT_UI_V1_FREEZE };

export const CHECKOUT_SPEC_VERSION = "1.0" as const;

/** Absolute Final — confirm-only checkout. */
export const CHECKOUT_CANONICAL_STATUS = "ABSOLUTE_FINAL_v1.0" as const;
export const CHECKOUT_CANONICAL_FROZEN = true as const;

/** Owner UI freeze stamp — presentation only. */
export const CHECKOUT_UI_FROZEN = CHECKOUT_UI_V1_FREEZE.freezeLocked;
export const CHECKOUT_UI_FREEZE_NAME = CHECKOUT_UI_V1_FREEZE.freezeName;
export const CHECKOUT_UI_OWNER_APPROVED = CHECKOUT_UI_V1_FREEZE.ownerApproved;

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

/** Visual tokens — CHECKOUT_UI_v1.0 Owner lock (Blood XXVI). */
export const CHECKOUT_VISUAL_LOCK = {
  maxWidthPx: "100%" as const,
  headerHeightPx: CHECKOUT_UI_V1_FREEZE.visualLock.headerHeightPx,
  controlSizePx: 40,
  headerPadXPx: CHECKOUT_UI_V1_FREEZE.visualLock.padXPx,
  pagePadXPx: CHECKOUT_UI_V1_FREEZE.visualLock.padXPx,
  pagePadBottomPx: 8,
  sectionGapPx: CHECKOUT_UI_V1_FREEZE.visualLock.sectionGapPx,
  cardRadiusPx: CHECKOUT_UI_V1_FREEZE.visualLock.cardRadiusPx,
  ctaHeightPx: CHECKOUT_UI_V1_FREEZE.visualLock.ctaHeightPx,
  ctaRadiusPx: CHECKOUT_UI_V1_FREEZE.visualLock.ctaRadiusPx,
} as const;

export const CHECKOUT_CANONICAL_COMPONENTS = [
  "CheckoutWizardV1",
  "CheckoutPageHeader",
  "CheckoutProductSummary",
  "CheckoutPriceSummary",
  "CheckoutSuccessView",
] as const;

export const CHECKOUT_LOCKED_SECTIONS = [
  "Product",
  "Address",
  "Delivery option",
  "Delivery details",
  "Phone",
  "Payment",
  "Price summary",
  "TOTAL PAY",
  "Secure Checkout",
] as const;

/**
 * CHECKOUT_UI_v1.0 — CTA presents TOTAL PAY £TOTAL (visual total lives on button).
 * Buyer Protection label remains mandatory (buyer-visible).
 */
export const CHECKOUT_MASTER_FREEZE_COPY = {
  cta: "TOTAL PAY",
  feeLabel: "Buyer Protection",
  forbiddenCta: ["Pay Securely", "Continue", "Proceed", "Checkout"] as const,
  forbiddenFee: [
    "Platform Fee",
    "Platform Fees",
    "Buyer Protection Fee",
    "Buyer Protection Included",
  ] as const,
} as const;

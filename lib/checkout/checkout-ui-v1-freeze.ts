/**
 * ROVEXO CHECKOUT UI FREEZE — CHECKOUT_UI_v1.0
 * STATUS: FROZEN · OWNER APPROVED · 2026-07-25
 *
 * Visual presentation only. Does NOT freeze payment completion,
 * Stripe success, order/transaction/escrow/shipping/tracking engines,
 * or backend business rules.
 *
 * Blood XXVI polish = frozen visual baseline.
 * Blood Compact UI (Owner) = mobile density refresh (−20–30% vertical).
 * No visual redesign / spacing / typography / polish without Owner approval.
 */

export const CHECKOUT_UI_V1_FREEZE = {
  freezeName: "CHECKOUT_UI_v1.0",
  version: "1.0",
  status: "FROZEN",
  ownerApproved: true,
  freezeLocked: true,
  approvedAt: "2026-07-25",

  scope: [
    "Checkout Layout",
    "Product Card",
    "Address Card",
    "Delivery Option",
    "Delivery Details",
    "Contact Details",
    "Payment Section",
    "Price Summary",
    "PAY Button",
    "Secure Checkout Footer",
    "Typography",
    "Card Radius",
    "Padding",
    "Margins",
    "Spacing",
    "Visual Density",
    "Responsive Layout",
    "Mobile Layout",
    "Checkout Visual Hierarchy",
  ] as const,

  lockedForbiddenWithoutOwnerApproval: [
    "Visual redesign",
    "Spacing changes",
    "Padding changes",
    "Margin changes",
    "Card height changes",
    "Typography changes",
    "Button position changes",
    "Component order changes",
    "Visual polishing",
    "UI refactoring",
  ] as const,

  notIncluded: [
    "Payment Completion",
    "Stripe Success",
    "Order Engine",
    "Transaction Engine",
    "Escrow",
    "Shipping",
    "Print Label",
    "Tracking",
    "Delivery",
    "Review",
    "Seller Flow",
    "Backend Logic",
    "Business Rules",
  ] as const,

  canonicalSurfaces: {
    wizard: "features/checkout/components/CheckoutWizardV1.tsx",
    css: "styles/rovexo/checkout-v1.css",
    product: "features/checkout/components/CheckoutProductSummary.tsx",
    price: "features/checkout/components/CheckoutPriceSummary.tsx",
    header: "features/checkout/components/CheckoutPageHeader.tsx",
    page: "features/checkout/components/CheckoutPage.tsx",
  } as const,

  /** Owner-approved visual tokens — Blood Compact UI (mobile density). */
  visualLock: {
    padXPx: 16,
    sectionGapPx: 10,
    sectionTitleGapPx: 6,
    cardRadiusPx: 10,
    cardPadYPx: 8,
    cardPadXPx: 10,
    headerHeightPx: 52,
    productImagePx: 64,
    productCardMaxHeightPx: 70,
    optionMinHeightPx: 44,
    optionGapPx: 6,
    ctaHeightPx: 48,
    ctaRadiusPx: 10,
    ctaLabelPattern: "TOTAL PAY £",
    secureFooter: ["Secure Checkout", "Payment protected"] as const,
  } as const,

  dom: {
    freeze: "CHECKOUT_UI_v1.0",
    version: "v1.0",
    ui: "v1.0",
  } as const,
} as const;

export type CheckoutUiV1Freeze = typeof CHECKOUT_UI_V1_FREEZE;

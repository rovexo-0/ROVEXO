/**
 * ROVEXO BUNDLE ENGINE v1.0 — MASTER LAW (OWNER LOCKED)
 *
 * STATUS: OWNER LOCKED IMPLEMENTATION · NOT FROZEN until certification gates PASS
 * Bundle is an extension of Product Detail — NOT a cart, NOT a second checkout.
 *
 * Listing → Bundle → Checkout
 * Exactly ONE Bundle Engine. Zero duplicates. Fail closed. Atomic. Full rollback.
 *
 * No commit / push / deploy until Owner authorizes.
 */

export const BUNDLE_ENGINE_V1 = {
  version: "1.0",
  status: "OWNER_LOCKED_IMPLEMENTATION",
  freezeLocked: false,
  permanentlyFrozen: false,
  ownerLocked: true,
  noCommitUntilOwner: true,
  noPushUntilOwner: true,
  noDeployUntilOwner: true,

  equation: "LISTING → BUNDLE → CHECKOUT" as const,
  notACart: true,
  notASecondCheckout: true,
  extendsProductDetail: true,

  singularity: {
    oneEngine: true,
    oneActiveBundlePerBuyer: true,
    oneSellerPerActiveBundle: true,
    oneOrderPerPaidBundle: true,
    oneConversationPerBundleOffer: true,
    onePayoutPerSellerBundle: true,
    onePaymentPerBuyerBundle: true,
  } as const,

  ssot: {
    law: "lib/bundle/bundle-engine-v1.ts",
    engineeringSpec: "docs/modules/bundle/MASTER_ENGINEERING_SPECIFICATION_V1.md",
    uiSpec: "docs/modules/bundle/MASTER_UI_SPECIFICATION_V1.md",
    migration: "supabase/migrations/20260801180000_bundle_engine_v1.sql",
    reviewRoute: "/bundle/review",
    parents: {
      sellFreeze: "lib/sell/sell-ui-v1-freeze.ts",
      viewItemFreeze: "lib/product-detail/view-item-ui-ux-freeze-v1.ts",
      checkoutUiFreeze: "lib/checkout/checkout-ui-v1-freeze.ts",
    },
  } as const,

  surfaces: [
    "View Item",
    "Review Bundle",
    "Messages",
    "Offers",
    "Checkout",
    "Orders",
    "Wallet",
    "Notifications",
  ] as const,

  tables: ["bundles", "bundle_items", "bundle_events"] as const,
  /**
   * O3 Owner decision: offers + message meta is the ONLY offer SSOT.
   * bundle_offers exists in DB (infra) but is not written by the app.
   */
  offerSsot: "offers_with_bundle_message_meta" as const,

  viewItemExtension: {
    redesignForbidden: true,
    galleryUnchanged: true,
    sellerCardUnchanged: true,
    descriptionUnchanged: true,
    productInformationUnchanged: true,
    priceUnchanged: true,
    buyNowUnchanged: true,
    makeOfferUnchanged: true,
    /** Stock status under price only when stock > 1 (Owner Bundle Master Spec). */
    stockStatusOnlyWhenStockGreaterThan: 1,
    quantityOnlyWhenStockGreaterThan: 1,
    addToBundleHeightPx: 48,
    addToBundleFullWidth: true,
    addToBundleOutlinePurple: true,
    sheetHeightPx: 320,
    sheetAnimMs: 220,
    stickyBarHeightPx: 60,
  } as const,

  sellerConflict: {
    popupCopy: "You already have an active bundle. Finish or discard it first.",
    buttons: ["Continue", "Cancel"] as const,
  } as const,

  payment: {
    atomicEntireBundleOrNothing: true,
  } as const,

  phase1: {
    checkoutIntegrity: true,
    stockReservation: true,
    atomicCheckout: true,
    concurrencyProtection: true,
    notificationMatrix: true,
    snapshotImmutable: true,
    clientTotalsNeverTrusted: true,
  } as const,

  forbidden: [
    "second-bundle-engine",
    "cart-redesign",
    "second-checkout",
    "parallel-orders-per-item",
    "parallel-message-threads",
    "localStorage-as-authority",
    "duplicate-totals-owners",
    "soft-fail-stock",
    "view-item-redesign",
    "sell-redesign",
  ] as const,

  freezeRequires: [
    "100% buyer-seller journey",
    "zero-duplicate-logic-ui",
    "typescript-pass",
    "eslint-pass-touched",
    "production-build-pass",
    "all-certification-gates",
    "sell-v1-unchanged",
    "view-item-v1-unchanged-except-approved-extensions",
  ] as const,
} as const;

export type BundleEngineV1 = typeof BUNDLE_ENGINE_V1;

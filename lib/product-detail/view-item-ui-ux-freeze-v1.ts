/**
 * ROVEXO VIEW ITEM v1.0 — OWNER UI/UX FREEZE
 *
 * STATUS: FROZEN · OWNER LOCKED · CANONICAL
 * Route: /listing/[slug]
 * UI: features/product-detail/ProductDetailPage.tsx
 *
 * No structural modifications unless Owner explicitly lifts this freeze.
 * Future Bundle / Multi-Stock / Offers / Checkout must extend — never redesign.
 */

export const VIEW_ITEM_UI_UX_FREEZE_V1 = {
  version: "1.0",
  status: "FROZEN",
  ownerLocked: true,
  freezeLocked: true,
  name: "VIEW ITEM v1.0 — FROZEN",
  route: "/listing/[slug]",
  officialLocal: "http://localhost:3000/listing/[slug]",
  page: "features/product-detail/ProductDetailPage.tsx",
  fieldMap: "lib/product-detail/product-information-field-map-v1.ts",
  parentUiLock: "lib/product-detail/view-item-final-ui-lock-v1.ts",
  parentCanonicalFreeze: "lib/product-detail/product-page-canonical-freeze-v1.ts",

  lockedModules: [
    "Image Gallery",
    "Header",
    "Favourite",
    "Share",
    "Price Section",
    "Stock Status",
    "Seller Card",
    "Description",
    "Product Information Table",
    "Quantity Selector",
    "Buy Now",
    "Make Offer",
    "Bottom Action Bar",
    "Full Page Scroll",
  ] as const,

  /** Product Information — populated fields only, fixed order. */
  productInformationOrder: [
    "Category",
    "Brand",
    "Condition",
    "Material",
    "Colour",
    "Size",
    "Storage",
    "Network",
    "Compatibility",
    "Season",
    "Uploaded",
  ] as const,

  stock: {
    onceUnderPrice: true,
    forbiddenInInformationTable: true,
    quantityOnlyWhenStockGreaterThan: 1,
  } as const,

  bundle: {
    /** Deferred — ROVEXO Bundle Engine v1.0 (Owner Preview Certification excludes Bundle). */
    deferredToBundleEngine: true,
    includedInThisPreview: false,
  } as const,

  scroll: {
    singleVerticalScroll: true,
    scrollToLastPixel: true,
    neverHideBehindStickyActions: true,
    preserveIosSafeArea: true,
  } as const,

  designFreeze: {
    spacing: true,
    typography: true,
    colours: true,
    buttonDimensions: true,
    borderRadius: true,
    shadows: true,
    cardLayout: true,
    dividers: true,
    animations: true,
    visualHierarchy: true,
  } as const,

  allowedAfterFreeze: ["bug-fix"] as const,
  forbiddenAfterFreeze: [
    "ui-redesign",
    "ux-redesign",
    "structural-modification",
    "spacing-change",
    "typography-change",
    "colour-change",
    "button-resize",
  ] as const,

  productionGatesBeforeCommit: [
    "TypeScript",
    "ESLint",
    "Build",
    "Responsive QA",
    "Mobile QA",
    "Desktop QA",
    "Regression Testing",
    "Owner Approval",
  ] as const,
} as const;

export type ViewItemUiUxFreezeV1 = typeof VIEW_ITEM_UI_UX_FREEZE_V1;

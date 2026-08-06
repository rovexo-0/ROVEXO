/**
 * ROVEXO VIEW ITEM v2.0 FINAL — OWNER FREEZE CERTIFICATE (COD SÂNGE)
 *
 * STATUS: PRODUCTION UI LOCK ACTIVE
 * CANONICAL VERSION: view-item-v2.0-final
 * Route: /listing/[slug]
 * UI: features/product-detail/ProductDetailPage.tsx
 *
 * Owner verified: Android · Localhost · Lightbox · Sticky actions · Mobile UX
 * No structural / visual / flow changes unless Owner explicitly UNFREEZES.
 * Post-freeze: bug · security · a11y · performance · browser only.
 * Change control: NO COMMIT · NO PUSH · NO DEPLOY until Owner unfreeze approval.
 */

export const VIEW_ITEM_UI_UX_FREEZE_V1 = {
  version: "2.0",
  canonicalVersion: "view-item-v2.0-final",
  status: "PRODUCTION_UI_LOCK_ACTIVE",
  freezeStatus: "FROZEN",
  ownerLocked: true,
  freezeLocked: true,
  ownerVerified: true,
  productionReady: true,
  name: "VIEW ITEM v2.0 FINAL — FREEZE ACTIVE",
  route: "/listing/[slug]",
  officialLocal: "http://localhost:3000/listing/[slug]",
  page: "features/product-detail/ProductDetailPage.tsx",
  fieldMap: "lib/product-detail/product-information-field-map-v1.ts",
  parentUiLock: "lib/product-detail/view-item-final-ui-lock-v1.ts",
  parentCanonicalFreeze: "lib/product-detail/product-page-canonical-freeze-v1.ts",

  lockedComponents: [
    "features/product-detail/ProductDetailPage.tsx",
    "features/product-detail/ProductPageChrome.tsx",
    "features/product-detail/ProductGalleryV1.tsx",
    "features/product-detail/ProductDescriptionV1.tsx",
    "features/product-detail/ProductInformationRows.tsx",
    "features/product-detail/ProductStockStatus.tsx",
    "features/product-detail/ProductActionBarV1.tsx",
  ] as const,

  lockedBehaviour: [
    "Gallery",
    "Fullscreen Lightbox",
    "Swipe",
    "Zoom",
    "Counter",
    "Close button",
    "Favourite",
    "More menu",
    "Seller card",
    "Visit Store",
    "Stock indicator",
    "Description",
    "Read More",
    "Specifications",
    "Sticky Buy Now",
    "Sticky Make Offer",
    "Bundle visibility rules",
    "Buyer / Seller behaviour",
  ] as const,

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
    onceUnderPrice: false,
    belowSeller: true,
    forbiddenInInformationTable: true,
    /** View Item v2.0 — always show In Stock when available. */
    statusOnlyWhenStockGreaterThan: 0,
    quantityOnlyWhenStockGreaterThan: 1,
  } as const,

  bundle: {
    deferredToBundleEngine: false,
    includedInThisPreview: true,
    engine: "lib/bundle/bundle-engine-v1.ts",
    extensionsOnly: true,
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
    gallery: true,
    stickyBar: true,
  } as const,

  allowedAfterFreeze: [
    "bug-fix",
    "security-fix",
    "accessibility",
    "performance",
    "browser-compatibility",
  ] as const,

  forbiddenAfterFreeze: [
    "ui-redesign",
    "ux-redesign",
    "layout-change",
    "visual-change",
    "flow-change",
    "typography-change",
    "gallery-redesign",
    "sticky-bar-redesign",
    "component-replacement",
    "structural-modification",
    "spacing-change",
    "colour-change",
    "button-resize",
  ] as const,

  changeControl: {
    commit: "FORBIDDEN_UNTIL_OWNER_UNFREEZE",
    push: "FORBIDDEN_UNTIL_OWNER_UNFREEZE",
    deploy: "FORBIDDEN_UNTIL_OWNER_UNFREEZE",
  } as const,

  productionGatesBeforeCommit: [
    "TypeScript",
    "ESLint",
    "Build",
    "Related tests",
    "Responsive QA",
    "Mobile QA",
    "Desktop QA",
    "Regression Testing",
    "Owner Approval",
    "Owner Unfreeze Approval",
  ] as const,
} as const;

export type ViewItemUiUxFreezeV1 = typeof VIEW_ITEM_UI_UX_FREEZE_V1;

/**
 * ROVEXO VIEW ITEM — FINAL UI LOCK + OWNER FREEZE CERTIFICATE (COD SÂNGE)
 *
 * STATUS: PRODUCTION UI LOCK ACTIVE
 * CANONICAL VERSION: view-item-v2.0-final
 * Route: /listing/[slug]
 * UI: features/product-detail/ProductDetailPage.tsx
 * Freeze SSOT: lib/product-detail/view-item-ui-ux-freeze-v1.ts
 *
 * Do NOT redesign · Do NOT move sections · Do NOT change spacing/buttons.
 * Post-freeze: bug · security · a11y · performance · browser only.
 * NO COMMIT / PUSH / DEPLOY until Owner unfreeze approval.
 */

export const VIEW_ITEM_FINAL_UI_LOCK_V1 = {
  version: "2.0",
  canonicalVersion: "view-item-v2.0-final",
  status: "PRODUCTION_UI_LOCK_ACTIVE",
  freezeStatus: "FROZEN",
  ownerApproved: true,
  ownerVerified: true,
  freezeLocked: true,
  productionReady: true,
  uiUxFreeze: "lib/product-detail/view-item-ui-ux-freeze-v1.ts",
  route: "/listing/[slug]",
  officialLocal: "http://localhost:3000/listing/[slug]",
  parentFreeze: "lib/product-detail/product-page-canonical-freeze-v1.ts",
  page: "features/product-detail/ProductDetailPage.tsx",

  lockedComponents: [
    "ProductPageChrome",
    "ProductGalleryV1",
    "ProductDescriptionV1",
    "ProductInformationRows",
    "ProductStockStatus",
    "ProductActionBarV1",
  ] as const,

  /** Exact scroll order — Product Information rows are dynamic (populated only). */
  layoutOrder: [
    "Image Gallery",
    "Title",
    "Price",
    "Total incl.",
    "View Counter",
    "Seller Card",
    "Stock Status",
    "Description",
    "Product Information (dynamic field map)",
    "Quantity (stock > 1 only)",
    "Buy Now",
    "Make Offer",
  ] as const,

  productInformationFieldMap: "lib/product-detail/product-information-field-map-v1.ts",
  /** Owner FREEZE order — Compatibility before Season. */
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
    displayOnceUnderPrice: false,
    displayBelowSeller: true,
    forbiddenInSpecificationTable: true,
    copyInStock: "In Stock",
    copyOnlyOne: "Only 1 available",
    copyNAvailable: "{n} available",
  } as const,

  quantity: {
    visibleWhenStockGreaterThan: 1,
    hiddenWhenStockEquals: 1,
  } as const,

  forbiddenSections: [
    "Delivery",
    "Duplicated Stock row",
    "Similar Items on View Item body",
    "Add to Cart",
  ] as const,

  scroll: {
    naturalDocumentScroll: true,
    oneVerticalScrollContainer: "document",
    noFixedHeightContentTrap: true,
    noHiddenOverflowOnPage: true,
    lastContentClearsStickyActions: true,
    stickyActions: ["Buy Now", "Make Offer"] as const,
    scrollContainerForbiddenOnPdp: "ScrollContainer",
    clearanceIncludesSafeAreaAndSafetyMargin: true,
  } as const,

  actions: {
    fixedBottom: true,
    redesignForbidden: true,
  } as const,

  lightbox: {
    fullscreen: true,
    swipe: true,
    zoom: true,
    counter: true,
    closeButton: true,
    imageMustRender: true,
  } as const,

  changeControl: {
    commit: "FORBIDDEN_UNTIL_OWNER_UNFREEZE",
    push: "FORBIDDEN_UNTIL_OWNER_UNFREEZE",
    deploy: "FORBIDDEN_UNTIL_OWNER_UNFREEZE",
  } as const,
} as const;

export type ViewItemFinalUiLockV1 = typeof VIEW_ITEM_FINAL_UI_LOCK_V1;

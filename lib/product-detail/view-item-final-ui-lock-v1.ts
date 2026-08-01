/**
 * ROVEXO VIEW ITEM — FINAL UI LOCK + OWNER UI/UX FREEZE (COD SÂNGE)
 *
 * STATUS: FROZEN · OWNER LOCKED
 * Route: /listing/[slug]
 * UI: features/product-detail/ProductDetailPage.tsx
 * Freeze SSOT: lib/product-detail/view-item-ui-ux-freeze-v1.ts
 *
 * Do NOT redesign · Do NOT move sections · Do NOT change spacing/buttons.
 * Future Bundle / Multi-Stock / Offers / Checkout extend this layout only.
 */

export const VIEW_ITEM_FINAL_UI_LOCK_V1 = {
  version: "1.0",
  status: "FROZEN",
  ownerApproved: true,
  freezeLocked: true,
  uiUxFreeze: "lib/product-detail/view-item-ui-ux-freeze-v1.ts",
  route: "/listing/[slug]",
  officialLocal: "http://localhost:3000/listing/[slug]",
  parentFreeze: "lib/product-detail/product-page-canonical-freeze-v1.ts",
  page: "features/product-detail/ProductDetailPage.tsx",

  /** Exact scroll order — Product Information rows are dynamic (populated only). */
  layoutOrder: [
    "Image Gallery",
    "Title",
    "Price",
    "Stock Status",
    "Total incl.",
    "View Counter",
    "Seller Card",
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
    displayOnceUnderPrice: true,
    forbiddenInSpecificationTable: true,
    copyInStock: "✓ In Stock",
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
} as const;

export type ViewItemFinalUiLockV1 = typeof VIEW_ITEM_FINAL_UI_LOCK_V1;

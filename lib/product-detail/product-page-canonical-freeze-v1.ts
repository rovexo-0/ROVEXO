/**
 * ROVEXO v1.0 — PRODUCT PAGE FINAL FREEZE (CODE BLOOD v3.1)
 *
 * STATUS: OWNER APPROVED · FINAL FREEZE
 * Route: /listing/[slug]
 * UI: features/product-detail/ProductDetailPage.tsx
 *
 * Absolute: Less is more. Premium > complexity. If it looks premium, do not touch it.
 */

export const PRODUCT_PAGE_CANONICAL_FREEZE_V1 = {
  version: "cod-sange-v3.1",
  status: "FINAL_FREEZE",
  ownerCertified: true,
  freezeLocked: true,
  officialLocal: "http://localhost:3000/listing/[slug]",
  implementationPass: [
    "DELETE Add To Cart",
    "DELETE Platform Fee text",
    "DELETE Report Seller",
    "DELETE Shipping calculated at checkout",
    "DELETE Old Header",
    "Transparent chrome ← / •••",
    "Views right-aligned",
    "£incl. only",
  ] as const,
  delivery: ["Delivery", "2-3 working days", "Tracked delivery available"] as const,
  locked: [
    "Gallery",
    "Price",
    "Views",
    "Description",
    "Condition",
    "Delivery",
    "Seller Card",
    "Visit Store",
    "Similar Items",
    "Make Offer",
    "Buy Now",
  ] as const,
  actions: {
    buyNow: true,
    makeOffer: true,
    addToCart: false,
  } as const,
  removedForever: [
    "Add to Cart",
    "Platform Fee text on product page",
    "Report Seller",
    "Shipping calculated at checkout",
    "White header title bar",
    "Header product title",
  ] as const,
  forbiddenPostFreeze: [
    "redesign",
    "experiments",
    "additional features",
    "new buttons",
    "unnecessary text",
    "structural changes",
    "colour redesign",
  ] as const,
  ssot: {
    freeze: "lib/product-detail/product-page-canonical-freeze-v1.ts",
    page: "features/product-detail/ProductDetailPage.tsx",
    chrome: "features/product-detail/ProductPageChrome.tsx",
    delivery: "features/product-detail/ProductShippingCard.tsx",
    actionBar: "lib/transaction-hub/product-action-bar.ts",
  } as const,
} as const;

/**
 * ROVEXO STORE v2.0 FINAL — SSOT
 *
 * Visit Store ONLY (`/store/[slug]`).
 * Profile `/user/[username]` is a separate page — do not share this UI.
 *
 * Owner Freeze Certificate: PRODUCTION_FREEZE_ACTIVE
 * Lock SSOT: lib/store/visit-store-final-ui-lock-v1.ts
 */

export const STORE_V2_VERSION = "2.0" as const;
export const STORE_V2_CANONICAL = "store-v2.0-final" as const;
export const STORE_V2_STATUS = "PRODUCTION_FREEZE_ACTIVE" as const;

export const STORE_V2_ROUTES = {
  /** Visit Store only — never Profile */
  store: "/store/[slug]",
} as const;

export const STORE_V2_UI = {
  header: {
    standard: "ROVEXO Header Standard v1.0",
    layout: ["back", "title:Store", "overflow"] as const,
    mustMatch: "Orders",
    component: "AccountCanonicalHeader",
  },
  headerForbidden: ["header Follow", "header Close", "hidden title"] as const,
  tabs: ["listings", "reviews"] as const,
  tabSplit: "50/50",
  listings: {
    activeOnly: true,
    columns: 2,
    card: "ListingCard",
    price: "seller-set listing.price only",
    saved: "♡/❤️ + products.likes on image",
    views: "👁 products.views",
    forbidden: ["Featured", "Search", "Filter", "categories", "incl.", "🛡"] as const,
    pagination: "infinite-scroll-or-load-more",
  },
  reviews: {
    summary: ["average", "star-breakdown"] as const,
    card: [
      "avatar",
      "name",
      "stars",
      "relative-time",
      "verified-purchase",
      "comment",
      "product-thumbnail",
    ] as const,
    productThumbHref: "/listing/[slug]",
    forbidden: [
      "order arrow",
      "Order Details",
      "Tracking",
      "Payment",
      "Conversation",
      "Delivery info",
      "order access",
    ] as const,
  },
  verifiedPurchaseRequires: [
    "order.status === completed",
    "review exists",
    "buyer_id === review.author",
    "listing_id === review.listing_id",
  ] as const,
} as const;

/** Canonical Visit Store UI — never ViewProfilePage */
export const STORE_V2_CANONICAL_UI =
  "features/store/components/StoreVisitPageV2.tsx" as const;

export const STORE_V2_FORBIDDEN_PROFILE_UI =
  "features/profile/components/ViewProfilePage.tsx" as const;

export const STORE_V2_FINAL_UI_LOCK =
  "lib/store/visit-store-final-ui-lock-v1.ts" as const;

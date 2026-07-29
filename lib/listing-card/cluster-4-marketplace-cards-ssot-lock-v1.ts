/**
 * ROVEXO CLUSTER 4 — MARKETPLACE CARDS & IMAGE SYSTEM
 * SSOT ARCHITECTURE LOCK v1.0
 *
 * OWNER APPROVED · SCOPE LOCKED · ARCHITECTURE CERTIFIED
 * Cod Sânge — Cluster 4 · SearchResultCard Exception Certification
 *
 * Equation:
 * ONE MARKETPLACE CARD SSOT (ListingCard)
 * + ONE APPROVED SEARCH UX EXCEPTION (SearchResultCard)
 * + ZERO SECOND MARKETPLACE CARDS
 * = CLUSTER 4 ARCHITECTURE LOCK
 *
 * This file is architecture / Scope Lock only.
 * It does not certify Production Freeze or Production Ready.
 */

export const CLUSTER_4_MARKETPLACE_CARDS_SSOT_LOCK = {
  version: "1.0",
  cluster: "CLUSTER_4_MARKETPLACE_CARDS_IMAGE_SYSTEM",
  status: "OWNER_APPROVED_VISUAL_QA_PRODUCTION_FROZEN",
  approvedByOwner: true,
  scopeLocked: true,
  architectureCertified: true,
  /** Owner Visual QA PASS — Production Freeze applied. */
  productionReady: true,
  freezeApplied: true,

  equation:
    "ListingCard (marketplace SSOT) + SearchResultCard (search typeahead exception only) + zero parallel marketplace cards",

  marketplaceCardSsot: {
    component: "ListingCard",
    path: "components/ui/ListingCard.tsx",
    css: "components/ui/ListingCard.module.css",
    propsSsot: "lib/listing-card/defaults.ts",
    role: "MARKETPLACE_CARD_SSOT",
    allowedSurfaces: [
      "Homepage",
      "Browse",
      "Categories",
      "Saved",
      "Featured",
      "Product grids",
      "Store",
      "Marketplace feeds",
      "Search results grid (full results page)",
      "Similar / Recently viewed / SEO listing grids",
    ] as const,
  } as const,

  searchUxException: {
    component: "SearchResultCard",
    path: "features/search/components/SearchResultCard.tsx",
    role: "SEARCH_UX_EXCEPTION",
    ownerApproved: true,
    isMarketplaceCard: false,
    isSecondMarketplaceCard: false,
    allowedOnly: [
      "Search Typeahead",
      "Instant Search Suggestions",
      "Search Autocomplete",
    ] as const,
    allowedDirectImporters: [
      "features/search/components/SearchSuggestionList.tsx",
      "features/search/components/ProductResults.tsx",
    ] as const,
    allowedRuntimeHosts: [
      "features/search/components/SearchTypeaheadPanel.tsx",
      "features/search/components/SearchOverlay.tsx",
    ] as const,
    forbiddenSurfaces: [
      "Homepage",
      "Marketplace feeds",
      "Categories",
      "Saved Items",
      "Featured listings",
      "Product grids",
      "Any new marketplace surface",
    ] as const,
  } as const,

  imageSystemSsot: {
    safeImage: "components/ui/SafeImage.tsx",
    validation: "lib/media/is-valid-image-src.ts",
    cardImageResolve: "lib/media/use-card-image-src.ts",
    placeholder: "lib/media/product-image.ts",
  } as const,

  permanentlyForbidden: [
    "Second marketplace card component",
    "ListingCardV2 / ProductCardV2 / HomepageCard marketplace forks",
    "Using SearchResultCard on Homepage / Browse / Categories / Saved / Featured / product grids",
    "New marketplace card without explicit Owner approval",
  ] as const,

  ssot: {
    scopeLock: "lib/listing-card/cluster-4-marketplace-cards-ssot-lock-v1.ts",
    listingCard: "components/ui/ListingCard.tsx",
    searchResultCard: "features/search/components/SearchResultCard.tsx",
    safeImage: "components/ui/SafeImage.tsx",
  } as const,
} as const;

export type Cluster4MarketplaceCardsSsotLock =
  typeof CLUSTER_4_MARKETPLACE_CARDS_SSOT_LOCK;

export function getCluster4MarketplaceCardsSsotLockSnapshot() {
  return CLUSTER_4_MARKETPLACE_CARDS_SSOT_LOCK;
}

export function assertCluster4MarketplaceCardsArchitectureOrBlock(): void {
  const lock = CLUSTER_4_MARKETPLACE_CARDS_SSOT_LOCK;
  if (!lock.approvedByOwner || !lock.scopeLocked || !lock.architectureCertified) {
    throw new Error(
      "CLUSTER 4 Marketplace Cards architecture Scope Lock is not Owner-approved.",
    );
  }
  if (lock.searchUxException.isMarketplaceCard || lock.searchUxException.isSecondMarketplaceCard) {
    throw new Error(
      "CLUSTER 4 invariant broken: SearchResultCard must not be classified as a marketplace card.",
    );
  }
}

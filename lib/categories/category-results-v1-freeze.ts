/**
 * ROVEXO CATEGORY RESULTS v1.0 FINAL — OWNER FREEZE CERTIFICATE (COD SÂNGE)
 *
 * STATUS: PRODUCTION UI LOCK ACTIVE
 * CANONICAL VERSION: category-results-v1.0-final
 * Route: /category/[...slug]
 * UI: features/categories/components/CategoryPageView.tsx
 *
 * Owner verified: Android · listings-only · RX Bear empty state
 * Post-freeze: bug · security · a11y · performance · browser only.
 * NO COMMIT / PUSH / DEPLOY until Owner unfreeze approval.
 */

export const CATEGORY_RESULTS_V1_FREEZE = {
  version: "1.0",
  canonicalVersion: "category-results-v1.0-final",
  status: "PRODUCTION_UI_LOCK_ACTIVE",
  freezeStatus: "FROZEN",
  ownerLocked: true,
  freezeLocked: true,
  ownerVerified: true,
  productionReady: true,
  name: "CATEGORY RESULTS v1.0 FINAL — FREEZE ACTIVE",
  route: "/category/[...slug]",
  officialLocal: "http://localhost:3000/category/[...slug]",
  page: "features/categories/components/CategoryPageView.tsx",
  routePage: "app/(platform)/category/[...slug]/page.tsx",

  lockedBehaviour: [
    "Browse categories",
    "Category selection",
    "Category listings grid",
    "Listing cards",
    "Search",
    "Filters",
    "Pagination",
    "Empty state (RX Bear)",
    "Navigation",
    "Mobile layout",
    "Desktop layout",
  ] as const,

  removedLocked: [
    "About this category",
    "Buying tips",
    "Selling tips",
    "Frequently asked questions",
    "Discover more",
    "Editorial content below listings",
  ] as const,

  expectedBehaviour: {
    withListings: "Display ONLY category listings",
    withoutListings: "Display existing RX Bear empty state exactly as approved",
  } as const,

  emptyState: {
    marker: 'data-empty-state="no-products-v1"',
    component: "MarketplaceNoProductsEmpty",
    redesignForbidden: true,
  } as const,

  listings: {
    card: "components/ui/ListingCard.tsx",
    gridClass: "rx-listing-grid",
    editorialBelowForbidden: true,
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
    "layout-change",
    "flow-change",
    "typography-change",
    "spacing-change",
    "editorial-reintroduction",
    "component-replacement",
    "duplicate-implementation",
  ] as const,

  changeControl: {
    commit: "FORBIDDEN_UNTIL_OWNER_UNFREEZE",
    push: "FORBIDDEN_UNTIL_OWNER_UNFREEZE",
    deploy: "FORBIDDEN_UNTIL_OWNER_UNFREEZE",
  } as const,

  productionGates: [
    "TypeScript",
    "ESLint",
    "Build",
    "Related tests",
    "Android verified",
    "Mobile-first",
    "Production ready",
  ] as const,
} as const;

export type CategoryResultsV1Freeze = typeof CATEGORY_RESULTS_V1_FREEZE;

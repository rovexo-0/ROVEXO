/**
 * ROVEXO Owner UI Lock — Global Empty State (Search & Browse) v1.0
 *
 * Canonical empty product results surface:
 * Back · Search bar · Teddy illustration · "No products found" (sr-only)
 * Vertically centered · identical on Search and Browse.
 */

export const GLOBAL_EMPTY_STATE_SEARCH_BROWSE_LOCK = {
  version: "1.0",
  status: "OWNER_UI_LOCKED",
  title: "No products found",
  keep: ["Back button", "Search bar", "Empty-state illustration/icon", "No products found"] as const,
  remove: [
    "All categories",
    "Quick filter chips",
    "Helper text below the title",
    "Browse Categories button",
    "Suggestion links",
    "Recommendation lists",
  ] as const,
  component: "features/search/components/MarketplaceNoProductsEmpty.tsx",
  surfaces: [
    "features/search/components/SearchResultsView.tsx",
    "features/search/components/SearchResultsEmpty.tsx",
    "features/seo/components/ProgrammaticPageView.tsx",
    "features/categories/components/CategoryPageView.tsx",
  ] as const,
} as const;

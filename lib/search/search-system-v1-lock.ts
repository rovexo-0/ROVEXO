/**
 * ROVEXO Search System v1.0 — PRODUCTION LOCK (Owner Absolute Authority)
 *
 * ONE FEATURE = ONE IMPLEMENTATION = ONE SOURCE OF TRUTH
 *
 * Canonical flow:
 * Homepage → Search Bar → Search Overlay → Items | Members | Camera |
 * Image Search | Stores | Brands | Categories | Filters → Results → Certify
 *
 * NO AI POLICY: products / listings / categories / members / stores / brands DB only.
 * Social Follow / Followers permanently forbidden on store results.
 */

export const SEARCH_SYSTEM_V1 = {
  version: "1.0",
  status: "PRODUCTION_LOCK",
  placeholder: "Search for items or members",
  historyMax: 20,
  cameraAlwaysVisible: true,
  closeAlwaysVisible: true,
  homepageHiddenWhileActive: true,
  noAi: true,
  noVoiceAssistant: true,
  overlayIdleSections: [
    "Recent Searches",
    "Trending Searches",
    "Popular Searches",
    "Suggested Categories",
    "Suggested Stores",
    "Suggested Brands",
  ] as const,
  overlayForbidden: [
    "Homepage feed",
    "Homepage cards",
    "Homepage categories bar",
    "Homepage recommendations",
  ] as const,
  ssot: {
    overlay: "features/search/components/SearchOverlay.tsx",
    provider: "features/search/components/SearchProvider.tsx",
    homepageField: "components/home/HomepageSearchField.tsx",
    server: "features/search/utils/search-server.ts",
    history: "features/search/utils/history.ts",
    imageSearch: "features/search/components/ImageSearchView.tsx",
    results: "features/search/components/SearchResultsView.tsx",
    lock: "lib/search/search-system-v1-lock.ts",
  },
} as const;

export type SearchSystemV1 = typeof SEARCH_SYSTEM_V1;

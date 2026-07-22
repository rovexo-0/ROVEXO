/**
 * ROVEXO Search System v1.0 — MASTER FREEZE (Owner Absolute Authority)
 *
 * STATUS: IN PROGRESS (not Production Ready without Owner approval)
 * Engine SSOT: `lib/search/search-engine-v1.ts` (ONE engine · ZERO admin ranking)
 *
 * Canonical overlay order:
 * Recent → Trending → Popular → Categories → Items → Members → Stores → Brands
 *
 * Camera: Take/Upload → Similar Products / Categories / Brands / Listings only.
 * NO AI / NO Voice / NO external AI APIs.
 * Social Follow permanently forbidden (Store “Followers” = stats later, never Follow UI).
 *
 * Deploy: Preview authorized. Production Deploy forbidden without Owner approval.
 */

export const SEARCH_SYSTEM_V1 = {
  version: "1.0",
  status: "IN_PROGRESS",
  placeholder: "Search for items or members",
  historyMax: 20,
  cameraAlwaysVisible: true,
  closeAlwaysVisible: true,
  homepageHiddenWhileActive: true,
  noAi: true,
  noVoiceAssistant: true,
  noExternalAiApis: true,
  overlayIdleSections: [
    "Recent Searches",
    "Trending Searches",
  ] as const,
  overlayQuerySections: [
    "Suggestions",
    "Products",
    "Relevant Categories",
    "Relevant Stores",
    "Relevant Members",
    "Similar Products",
  ] as const,
  cameraAllow: [
    "Take Photo",
    "Upload Photo",
    "Similar Products",
    "Similar Categories",
    "Similar Brands",
    "Similar Listings",
  ] as const,
  overlayForbidden: [
    "Homepage feed",
    "Homepage cards",
    "Homepage categories bar",
    "Homepage recommendations",
    "AI Search",
    "AI Assistant",
    "Chat Search",
    "Voice Search",
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

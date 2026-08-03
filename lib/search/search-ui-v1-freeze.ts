/**
 * ROVEXO SEARCH UI FREEZE — SEARCH_UI_v1.0
 * STATUS: FROZEN · OWNER APPROVED · CERTIFIED · 2026-07-25
 *
 * Visual presentation only for /search idle landing.
 * Does NOT freeze search engine, ranking, API, AI, camera recognition,
 * recent/trending logic, category database, backend, Supabase, caching,
 * performance optimisation, or analytics.
 *
 * Canonical SSOT until Owner explicitly removes the freeze.
 */

export const SEARCH_UI_FREEZE_NAME = "SEARCH_UI_v1.0" as const;

export const SEARCH_UI_V1_FREEZE = {
  freezeName: SEARCH_UI_FREEZE_NAME,
  version: "1.0",
  status: "FROZEN",
  ownerApproved: true,
  freezeLocked: true,
  permanentlyFrozen: true,
  certified: true,
  approvedAt: "2026-07-25",
  officialRoute: "http://localhost:3000/search",

  scope: [
    "Search Page Layout",
    "Search Bar",
    "Camera Button",
    "Clear Button",
    "Browse Categories",
    "Category Grid",
    "Category Images",
    "Transparent Background Images",
    "Natural Soft Shadows",
    "Category Typography",
    "Category Item Counter",
    "Category Spacing",
    "Card Layout",
    "Responsive Layout",
    "Recent Searches",
    "Trending Searches",
    "Bottom Navigation",
    "Mobile UX",
    "Tablet UX",
    "Desktop Scaling",
  ] as const,

  visualCertification: {
    premiumMarketplaceLayout: "PASS",
    categoryGrid: "PASS",
    imageQuality: "PASS",
    transparentBackgroundImages: "PASS",
    naturalShadows: "PASS",
    compactLayout: "PASS",
    spacing: "PASS",
    typography: "PASS",
    searchBar: "PASS",
    trendingSearches: "PASS",
    recentSearches: "PASS",
    responsiveBehaviour: "PASS",
    visualConsistency: "PASS",
    overallPremiumAppearance: "PASS",
  } as const,

  lockedForbiddenWithoutOwnerApproval: [
    "Visual redesign",
    "Spacing changes",
    "Padding changes",
    "Margin changes",
    "Grid changes",
    "Category size changes",
    "Image size changes",
    "Typography changes",
    "Shadow changes",
    "Border radius changes",
    "Animation changes",
    "Visual refactoring",
  ] as const,

  notIncluded: [
    "Search Engine",
    "Search Ranking",
    "Search API",
    "AI Search",
    "Camera Recognition",
    "Recent Search Logic",
    "Trending Logic",
    "Category Database",
    "Backend",
    "Supabase",
    "Caching",
    "Performance Optimisation",
    "Analytics",
  ] as const,

  canonicalSurfaces: {
    landing: "features/search/components/SearchLandingView.tsx",
    categoryCard: "features/search/components/SearchCategoryBrowseCard.tsx",
    css: "styles/rovexo/search-landing-v1.css",
    heroes: "lib/search/search-category-heroes-v1.ts",
    heroAssets: "public/search/categories/",
    page: "app/(platform)/search/page.tsx",
  } as const,

  /** Owner-approved visual baseline (Blood XXVII–XXXI). Do not change without Owner. */
  visualLock: {
    hierarchy: [
      "Search Bar",
      "Browse Categories",
      "Category Grid",
      "Recent Searches",
      "Trending Searches",
    ] as const,
    categoryGridColumns: 3,
    categoryRootCount: 9,
    categoryBadges: false,
    categoryStructure: ["image", "name", "itemCount"] as const,
    transparentHeroes: true,
    naturalSoftShadows: true,
    logoOnSearchLanding: false,
  } as const,

  bloodLineage: ["XXVII", "XXVIII", "XXIX", "XXXI"] as const,

  dom: {
    freeze: SEARCH_UI_FREEZE_NAME,
    version: "v1.0",
    ui: "v1.0",
  } as const,
} as const;

export type SearchUiV1Freeze = typeof SEARCH_UI_V1_FREEZE;
export const SEARCH_UI_FREEZE_V1 = SEARCH_UI_V1_FREEZE;

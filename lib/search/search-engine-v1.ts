/**
 * ROVEXO SEARCH ENGINE v1.0 — ABSOLUTE MASTER FREEZE
 *
 * GOLDEN RULE: User only WRITES what they want. ROVEXO does everything else.
 *
 * Idle (nothing written): Recent Searches + Trending Searches ONLY.
 * Typing: Suggestions → Products → Relevant Categories → Stores → Members → Similar.
 * Filters: ONLY after a search has results (never before).
 * Zero questions · Zero admin · One engine only.
 *
 * STATUS: ABSOLUTE MASTER FREEZE · APPROVED UX CONTRACT
 * Production deploy: FORBIDDEN until Owner 100% certification.
 */

export const SEARCH_ENGINE_V1 = {
  version: "1.0",
  status: "ABSOLUTE_MASTER_FREEZE",
  productionDeploy: "FORBIDDEN_UNTIL_100_CERTIFIED",
  zeroAdminPolicy: true,
  zeroQuestionsPolicy: true,
  userMustOnlyWrite: true,
  channels: ["text", "camera", "filters"] as const,
  idleSections: ["Recent Searches", "Trending Searches"] as const,
  idleForbidden: [
    "Categories",
    "Brands",
    "Stores",
    "Members",
    "Filters",
    "Products",
    "Popular Searches",
  ] as const,
  typingSections: [
    "Suggestions",
    "Products",
    "Relevant Categories",
    "Relevant Stores",
    "Relevant Members",
    "Similar Products",
  ] as const,
  filtersAfterSearchOnly: true,
  canonicalRules: [
    "USER MUST DO LESS",
    "ROVEXO MUST DO MORE",
    "SHOW ONLY WHAT IS RELEVANT",
    "NEVER ASK UNNECESSARY QUESTIONS",
  ] as const,
  coreSurfaces: ["products", "stores", "members", "categories"] as const,
  indexSignals: [
    "products",
    "users",
    "stores",
    "tags",
    "reviews",
    "views",
    "orders",
    "ratings",
    "sales",
    "attributes",
  ] as const,
  cacheBuckets: ["hot", "trending", "recent", "popular"] as const,
  resultPriority: [
    "exact",
    "category",
    "title",
    "attribute",
    "brand",
    "store",
    "popular",
    "trending",
    "similar",
    "related",
  ] as const,
  failSafe: {
    imageSearchFails: "text_search",
    cacheFails: "database_search",
    suggestionsFail: "popular_searches",
    storeSearchFails: "member_search",
  } as const,
  forbidden: [
    "Search v2",
    "Search v3",
    "Search PRO",
    "AI Search",
    "GPT Search",
    "Duplicate systems",
    "Multiple search engines",
    "Ask category/brand/store first",
    "Filters before search",
    "Idle category/brand/store pickers",
    "Admin-edited trending/popular/ranking",
  ] as const,
  ssot: {
    engine: "lib/search/search-engine-v1.ts",
    rank: "lib/search/rank-products.ts",
    cache: "lib/search/cache.ts",
    imagePipeline: "lib/search/image-pipeline.ts",
    server: "features/search/utils/search-server.ts",
    overlay: "features/search/components/SearchOverlay.tsx",
    camera: "features/search/components/SearchInputActions.tsx",
    imageSearch: "features/search/components/ImageSearchView.tsx",
    results: "features/search/components/SearchResultsView.tsx",
    adminOpsOnly: "lib/search-engine/",
  },
} as const;

export type SearchEngineV1 = typeof SEARCH_ENGINE_V1;

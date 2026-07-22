/**
 * ROVEXO SEARCH ENGINE v1.0 — SENIOR ARCHITECT FREEZE
 *
 * ONE SEARCH ENGINE ONLY
 * Text + Camera + Filters → Search Core → Index signals → Cache → Results
 *
 * ZERO ADMIN POLICY: trending / popular / recent / suggestions / ranking
 * are automatic from marketplace signals — never manual admin edits.
 *
 * STATUS: CANONICAL · MASTER FREEZE · PRE-PRODUCTION
 * Production deploy: FORBIDDEN until Owner 100% certification.
 */

export const SEARCH_ENGINE_V1 = {
  version: "1.0",
  status: "CANONICAL_MASTER_FREEZE",
  productionDeploy: "FORBIDDEN_UNTIL_100_CERTIFIED",
  zeroAdminPolicy: true,
  channels: ["text", "camera", "filters"] as const,
  coreSurfaces: ["items", "members", "stores", "brands", "categories"] as const,
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
    "AI Search",
    "GPT Search",
    "Duplicate systems",
    "Multiple search engines",
    "Multiple camera systems",
    "Multiple filter systems",
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
    /** Super-admin ops module — must NEVER drive marketplace discovery ranking. */
    adminOpsOnly: "lib/search-engine/",
  },
} as const;

export type SearchEngineV1 = typeof SEARCH_ENGINE_V1;

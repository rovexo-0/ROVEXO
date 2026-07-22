/**
 * ROVEXO CAMERA SEARCH — PERFORMANCE MASTER FREEZE v1.0
 * OWNER APPROVED · ABSOLUTE AUTHORITY
 *
 * NO AI · NO CHAT · NO QUESTIONS · NO DEAD ENDS · NO REFRESH · NO RELOAD · NO SECOND SEARCH
 * Parallel matching only. Total target <2s · absolute max <3s.
 */

export const CAMERA_SEARCH_PERFORMANCE_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED_PERFORMANCE_FREEZE",
  noRefresh: true,
  noReload: true,
  noSecondSearch: true,
  parallelMatchingOnly: true,
  oneApiCall: true,
  targetsMs: {
    imageCompression: 150,
    parallelMatching: 700,
    preparingResults: 400,
    renderResults: 300,
    totalTarget: 2_000,
    absoluteMaximum: 3_000,
  },
  loadingChecklist: [
    "Searching.....",
    "Matching Products",
    "Matching Categories",
    "Matching Listings",
    "Matching Similar Products",
    "Matching Recommendations",
    "Preparing Results.....",
  ] as const,
  resultsPriority: [
    "Exact Products",
    "Similar Products",
    "Relevant Products",
    "Marketplace Listings",
    "Relevant Categories",
    "Recommendations",
    "Filters",
    "Sort",
  ] as const,
  noExactMatchCopy:
    "No exact match found. Showing similar and relevant marketplace results.",
  forbidden: [
    "sequential await ProductSearch→CategorySearch→…",
    "window.location.reload",
    "router.refresh for camera search",
    "Empty pages",
    "No Results",
    "Try Again",
    "AI chat",
  ] as const,
  ssot: {
    performance: "lib/search/camera-search-performance-v1.ts",
    corpusApi: "app/api/search/image-corpus/route.ts",
    engine: "lib/image-search/search.ts",
    corpus: "lib/image-search/corpus.ts",
    view: "features/search/components/ImageSearchView.tsx",
  },
} as const;

export type CameraSearchPerformanceV1 = typeof CAMERA_SEARCH_PERFORMANCE_V1;

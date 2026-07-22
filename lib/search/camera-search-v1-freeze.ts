/**
 * ROVEXO CAMERA SEARCH v1.0 — MASTER FREEZE (ABSOLUTE AUTHORITY)
 *
 * LEVEL 8 OWNER CERTIFICATE: 100% COMPLETE · CERTIFIED · PRODUCTION READY · FREEZE LOCKED
 * See: lib/search/camera-search-v1-level8-certificate.ts
 *
 * ONE PHOTO = ONE CLICK = ONE SEARCH = ONE STATE UPDATE = ONE AUTO NAVIGATION = ONE RESULTS PAGE
 *
 * NO refresh · NO reload · NO second search · NO second click · NO dead ends
 * Parallel Promise.all only. Target 1–2s · 100% <5s · NEVER 10–20s.
 * NO FURTHER MODIFICATIONS ALLOWED without Owner Level 8 re-authorization.
 */

export const CAMERA_SEARCH_V1 = {
  version: "1.0",
  status: "PRODUCTION_CERTIFIED_LEVEL_8_FREEZE_LOCKED",
  complete: true,
  certified: true,
  productionReady: true,
  freezeLocked: true,
  oneCameraSearchOnly: true,
  noAi: true,
  noChat: true,
  noQuestions: true,
  zeroDeadEnds: true,
  neverBlockOnImageQuality: true,
  autoSearchAfterConfirm: true,
  noRefresh: true,
  noReload: true,
  noSecondSearch: true,
  noSecondClick: true,
  parallelMatchingOnly: true,
  oneRequestOnly: true,
  resultsRoute: "/search/image/results",
  /** Owner loading: 4 × 0.3s = 1.2s UX floor. */
  stepDurationMs: 300,
  loadingSteps: [
    "Validating image",
    "Matching products",
    "Finding similar items",
    "Preparing results",
  ] as const,
  /** Soft UX floor for loading checklist (4 × 300ms). */
  maxSearchAnimationMs: 1_200,
  targetsMs: {
    totalTarget: 2_000,
    p98: 3_000,
    absoluteMaximum: 5_000,
  },
  resultsPriority: [
    "Exact Products",
    "Similar Products",
    "Relevant Products",
    "Relevant Categories",
    "Recommended Products",
    "Filters",
  ] as const,
  noExactMatchCopy:
    "No exact match found. Showing relevant marketplace results.",
  forbiddenUiCopy: [
    "NO RESULTS FOUND",
    "NOT FOUND",
    "EMPTY PAGE",
    "TRY AGAIN",
    "PLEASE TRY AGAIN",
    "ZERO PRODUCTS FOUND",
    "WHITE SCREEN",
    "Describe your image",
    "Unknown object",
    "Unsupported image",
    "Select category",
    "Select brand",
    "Search again",
    "No similar listings found",
    "What is this?",
    "Image Unsupported",
    "Nothing Found",
  ] as const,
  forbiddenCode: [
    "router.refresh",
    "window.reload",
    "location.reload",
    "setTimeout(5000)",
    "sequential await exact→similar→categories→filters",
  ] as const,
  /** @deprecated use noExactMatchCopy */
  allowedStatusWhenNoExact:
    "No exact match found. Showing relevant marketplace results.",
  /** @deprecated use loadingSteps */
  animationSteps: [
    "Validating image",
    "Matching products",
    "Finding similar items",
    "Preparing results",
  ] as const,
  ssot: {
    freeze: "lib/search/camera-search-v1-freeze.ts",
    performance: "lib/search/camera-search-performance-v1.ts",
    engine: "lib/image-search/search.ts",
    resultsStore: "lib/image-search/results-store.ts",
    view: "features/search/components/ImageSearchView.tsx",
    camera: "features/search/components/SearchInputActions.tsx",
    pipeline: "lib/search/image-pipeline.ts",
    corpusApi: "app/api/search/image-corpus/route.ts",
    resultsPage: "app/search/image/results/page.tsx",
  },
} as const;

export type CameraSearchV1 = typeof CAMERA_SEARCH_V1;

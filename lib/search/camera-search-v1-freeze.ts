/**
 * ROVEXO CAMERA SEARCH v1.0 — SENIOR ARCHITECT FREEZE (APPROVED)
 *
 * ZERO DEAD ENDS · ZERO QUESTIONS · SEARCH MUST NEVER FAIL
 * Photo → Confirm → Searching animation (≤2s) → Results page always.
 */

export const CAMERA_SEARCH_V1 = {
  version: "1.0",
  status: "APPROVED_FREEZE",
  maxSearchAnimationMs: 2_000,
  animationSteps: [
    "Searching...",
    "Matching products...",
    "Matching categories...",
    "Matching brands...",
    "Finding similar products...",
    "Preparing results...",
  ] as const,
  zeroDeadEnds: true,
  neverBlockOnImageQuality: true,
  zeroQuestions: true,
  noAiChat: true,
  resultsAlwaysShow: [
    "Products",
    "Similar Products",
    "Relevant Categories",
    "Relevant Brands",
    "Relevant Listings",
    "Recommended Products",
    "Relevant Filters",
  ] as const,
  forbiddenUiCopy: [
    "NO RESULTS FOUND",
    "NOT FOUND",
    "EMPTY PAGE",
    "PLEASE TRY AGAIN",
    "ZERO PRODUCTS FOUND",
    "WHITE SCREEN",
    "No similar listings found",
  ] as const,
  allowedStatusWhenNoExact: "No exact match found",
  ssot: {
    freeze: "lib/search/camera-search-v1-freeze.ts",
    engine: "lib/image-search/search.ts",
    view: "features/search/components/ImageSearchView.tsx",
    pipeline: "lib/search/image-pipeline.ts",
  },
} as const;

export type CameraSearchV1 = typeof CAMERA_SEARCH_V1;

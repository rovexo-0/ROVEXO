/**
 * ROVEXO CAMERA SEARCH v1.0 — OWNER APPROVED ABSOLUTE FREEZE
 *
 * NO AI · NO CHAT · NO QUESTIONS · NO DEAD ENDS · ONE CAMERA SEARCH ONLY
 *
 * Camera → Take/Upload → Confirm → AUTO SEARCH → Results page only.
 * User does nothing after Confirm. ROVEXO does everything.
 * 50+ YEARS FREEZE — never terminate in an empty / dead-end flow.
 */

export const CAMERA_SEARCH_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED",
  oneCameraSearchOnly: true,
  noAi: true,
  noChat: true,
  noQuestions: true,
  zeroDeadEnds: true,
  neverBlockOnImageQuality: true,
  autoSearchAfterConfirm: true,
  /** Target total animation before results (Owner: <2s). */
  maxSearchAnimationMs: 1_500,
  stepDurationMs: 500,
  animationSteps: [
    "Searching.....",
    "Matching Products.....",
    "Matching Categories.....",
    "Matching Attributes.....",
    "Matching Similar Products.....",
    "Preparing Results.....",
  ] as const,
  resultsPriority: [
    "Exact Products",
    "Similar Products",
    "Relevant Products",
    "Matching Categories",
    "Recommended Products",
    "Marketplace Listings",
    "Filters",
    "Sort",
  ] as const,
  noExactMatchCopy: "No exact match found. Showing similar and relevant products.",
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
  ] as const,
  /** @deprecated use noExactMatchCopy */
  allowedStatusWhenNoExact: "No exact match found. Showing similar and relevant products.",
  ssot: {
    freeze: "lib/search/camera-search-v1-freeze.ts",
    engine: "lib/image-search/search.ts",
    view: "features/search/components/ImageSearchView.tsx",
    camera: "features/search/components/SearchInputActions.tsx",
    pipeline: "lib/search/image-pipeline.ts",
  },
} as const;

export type CameraSearchV1 = typeof CAMERA_SEARCH_V1;

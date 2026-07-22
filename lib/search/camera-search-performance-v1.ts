/**
 * ROVEXO CAMERA SEARCH — PERFORMANCE MASTER FREEZE v1.0
 * Aligned with CAMERA SEARCH MASTER FREEZE (Absolute Authority).
 */

import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";

export const CAMERA_SEARCH_PERFORMANCE_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED_PERFORMANCE_FREEZE",
  noRefresh: true,
  noReload: true,
  noSecondSearch: true,
  parallelMatchingOnly: true,
  oneApiCall: true,
  resultsRoute: CAMERA_SEARCH_V1.resultsRoute,
  targetsMs: {
    imageCompression: 150,
    parallelMatching: 700,
    preparingResults: 400,
    renderResults: 300,
    stepDuration: CAMERA_SEARCH_V1.stepDurationMs,
    /** 95% */
    totalTarget: CAMERA_SEARCH_V1.targetsMs.totalTarget,
    /** 98% */
    p98: CAMERA_SEARCH_V1.targetsMs.p98,
    /** 100% absolute max — NEVER 10–20s */
    absoluteMaximum: CAMERA_SEARCH_V1.targetsMs.absoluteMaximum,
  },
  loadingChecklist: CAMERA_SEARCH_V1.loadingSteps,
  resultsPriority: CAMERA_SEARCH_V1.resultsPriority,
  noExactMatchCopy: CAMERA_SEARCH_V1.noExactMatchCopy,
  forbidden: [
    "sequential await ProductSearch→CategorySearch→…",
    "window.location.reload",
    "router.refresh for camera search",
    "setTimeout(5000) artificial wait",
    "Empty pages",
    "No Results",
    "Try Again",
    "AI chat",
  ] as const,
  ssot: CAMERA_SEARCH_V1.ssot,
} as const;

export type CameraSearchPerformanceV1 = typeof CAMERA_SEARCH_PERFORMANCE_V1;

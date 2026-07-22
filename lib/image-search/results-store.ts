import type { ImageSearchMatch } from "@/lib/image-search/search";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";

export type CameraSearchFilters = {
  brands: string[];
  priceRanges: string[];
};

/** ONE state update payload — Master Freeze. */
export type CameraSearchResultsPayload = {
  queryDataUrl: string | null;
  matches: ImageSearchMatch[];
  categories: string[];
  filters: CameraSearchFilters;
  hasExactMatch: boolean;
  readyAt: number;
};

const RESULTS_KEY = "rovexo-camera-search-results-v1";

let memoryResults: CameraSearchResultsPayload | null = null;

/**
 * Store results once after parallel search — never re-search on results page.
 */
export function setImageSearchResults(payload: CameraSearchResultsPayload): void {
  memoryResults = payload;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RESULTS_KEY, JSON.stringify(payload));
  } catch {
    // Memory still holds payload for same-tab navigation.
  }
  void CAMERA_SEARCH_V1.noSecondSearch;
}

export function getImageSearchResults(): CameraSearchResultsPayload | null {
  if (memoryResults?.matches?.length) return memoryResults;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RESULTS_KEY);
    if (!raw) return memoryResults;
    const parsed = JSON.parse(raw) as CameraSearchResultsPayload;
    if (!parsed?.matches?.length) return memoryResults;
    memoryResults = parsed;
    return parsed;
  } catch {
    return memoryResults;
  }
}

export function clearImageSearchResults(): void {
  memoryResults = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RESULTS_KEY);
  } catch {
    // ignore
  }
}

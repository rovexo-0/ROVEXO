import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scoreImageSimilarity } from "@/lib/image-search/similarity";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";
import { CAMERA_SEARCH_PERFORMANCE_V1 } from "@/lib/search/camera-search-performance-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Camera Search v1.0 — Master Freeze", () => {
  it("locks one-photo one-search one-replace navigation", () => {
    expect(CAMERA_SEARCH_V1.version).toBe("1.0");
    expect(CAMERA_SEARCH_V1.status).toBe("OWNER_APPROVED_MASTER_FREEZE");
    expect(CAMERA_SEARCH_V1.oneCameraSearchOnly).toBe(true);
    expect(CAMERA_SEARCH_V1.autoSearchAfterConfirm).toBe(true);
    expect(CAMERA_SEARCH_V1.zeroDeadEnds).toBe(true);
    expect(CAMERA_SEARCH_V1.noRefresh).toBe(true);
    expect(CAMERA_SEARCH_V1.noReload).toBe(true);
    expect(CAMERA_SEARCH_V1.noSecondSearch).toBe(true);
    expect(CAMERA_SEARCH_V1.parallelMatchingOnly).toBe(true);
    expect(CAMERA_SEARCH_V1.resultsRoute).toBe("/search/image/results");
    expect(CAMERA_SEARCH_V1.stepDurationMs).toBe(300);
    expect(CAMERA_SEARCH_V1.loadingSteps).toEqual([
      "Validating image",
      "Matching products",
      "Finding similar items",
      "Preparing results",
    ]);
    expect(CAMERA_SEARCH_V1.noExactMatchCopy).toBe(
      "No exact match found. Showing relevant marketplace results.",
    );
    expect(CAMERA_SEARCH_V1.targetsMs.absoluteMaximum).toBe(5_000);
    expect(CAMERA_SEARCH_V1.forbiddenUiCopy).toContain("NO RESULTS FOUND");
  });

  it("locks Performance Freeze targets and parallel-only policy", () => {
    expect(CAMERA_SEARCH_PERFORMANCE_V1.parallelMatchingOnly).toBe(true);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.oneApiCall).toBe(true);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.resultsRoute).toBe("/search/image/results");
    expect(CAMERA_SEARCH_PERFORMANCE_V1.targetsMs.totalTarget).toBe(2_000);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.targetsMs.p98).toBe(3_000);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.targetsMs.absoluteMaximum).toBe(5_000);
  });

  it("Confirm hands results to SearchProvider — Provider owns close + replace", () => {
    const actions = readSource("features/search/components/SearchInputActions.tsx");
    const provider = readSource("features/search/components/SearchProvider.tsx");
    const state = readSource("features/search/hooks/use-search-overlay-state.ts");
    const camera = readSource("components/home/ImageSearchCamera.tsx");
    const search = readSource("components/home/HomepageSearchField.tsx");
    const layout = readSource("app/layout.tsx");

    expect(search).not.toContain("ImageSearchCamera");
    expect(camera).toContain("NativeImageFileInput");
    expect(actions).toContain("Confirm");
    expect(actions).toContain("runAutoSearch");
    expect(actions).toContain("runCameraSearchMaster");
    expect(actions).toContain("search.setResults");
    expect(actions).toContain("search.setResultsReady");
    expect(actions).not.toContain("router.replace");
    expect(actions).not.toContain("router.refresh");
    expect(actions).not.toContain("location.reload");
    expect(actions).not.toContain("window.reload");
    expect(actions).not.toContain("setTimeout(5000)");
    expect(actions).not.toMatch(/>\s*Search\s*</);

    expect(state).toContain("router.replace");
    expect(state).toContain("resultsReady === true");
    expect(state).toContain("overlayClosed === true");
    expect(state).toContain("navigationReady === true");
    expect(state).toContain("setImageSearchResults");
    expect(provider).toContain("useSearchOverlayState");
    expect(provider).toContain("handleOverlayDismiss");
    expect(layout).toContain("<SearchProvider>");
    // ONE provider only in root layout
    expect(layout.match(/<SearchProvider/g)?.length).toBe(1);
  });

  it("engine uses Promise.all find* channels and one corpus request", () => {
    const engine = readSource("lib/image-search/search.ts");
    const corpus = readSource("lib/image-search/corpus.ts");
    const api = readSource("app/api/search/image-corpus/route.ts");
    const page = readSource("app/search/image/results/page.tsx");
    const legacy = readSource("app/search/page.tsx");
    const view = readSource("features/search/components/ImageSearchView.tsx");

    expect(engine).toContain("findExactProducts");
    expect(engine).toContain("findSimilarProducts");
    expect(engine).toContain("findRelevantCategories");
    expect(engine).toContain("findRelevantFilters");
    expect(engine).toContain("Promise.all([");
    expect(engine).toContain("runCameraSearchMaster");
    expect(engine).not.toContain("openai");

    expect(corpus).toContain("/api/search/image-corpus");
    expect(api).toContain("Promise.all");

    expect(page).toContain("ImageSearchView");
    expect(page).toContain("CAMERA_SEARCH_V1.resultsRoute");
    expect(legacy).toContain("redirect(CAMERA_SEARCH_V1.resultsRoute)");

    expect(view).toContain("getImageSearchResults");
    expect(view).toContain("Exact Products");
    expect(view).toContain("Similar Products");
    expect(view).toContain("Recommended Products");
    expect(view).not.toContain("router.refresh");
    expect(view).not.toContain("location.reload");
    expect(view).not.toContain("NO RESULTS FOUND");
    expect(view).not.toContain("Describe your image");
  });

  it("scores identical hashes as most similar", () => {
    const hash = "1010101010101010";
    expect(scoreImageSimilarity(hash, hash)).toBe(1);
    expect(scoreImageSimilarity(hash, "0000000000000000")).toBeLessThan(1);
  });
});

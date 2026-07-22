import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scoreImageSimilarity } from "@/lib/image-search/similarity";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";
import { CAMERA_SEARCH_PERFORMANCE_V1 } from "@/lib/search/camera-search-performance-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Camera Search v1.0 — Owner Approved Freeze", () => {
  it("locks auto-search, zero-dead-end, and no-AI policies", () => {
    expect(CAMERA_SEARCH_V1.version).toBe("1.0");
    expect(CAMERA_SEARCH_V1.status).toBe("OWNER_APPROVED");
    expect(CAMERA_SEARCH_V1.oneCameraSearchOnly).toBe(true);
    expect(CAMERA_SEARCH_V1.autoSearchAfterConfirm).toBe(true);
    expect(CAMERA_SEARCH_V1.zeroDeadEnds).toBe(true);
    expect(CAMERA_SEARCH_V1.noAi).toBe(true);
    expect(CAMERA_SEARCH_V1.noChat).toBe(true);
    expect(CAMERA_SEARCH_V1.noQuestions).toBe(true);
    expect(CAMERA_SEARCH_V1.animationSteps[0]).toBe("Searching.....");
    expect(CAMERA_SEARCH_V1.animationSteps).toContain("Matching Listings");
    expect(CAMERA_SEARCH_V1.animationSteps).toContain("Matching Recommendations");
    expect(CAMERA_SEARCH_V1.noExactMatchCopy).toBe(
      "No exact match found. Showing similar and relevant marketplace results.",
    );
    expect(CAMERA_SEARCH_V1.forbiddenUiCopy).toContain("Describe your image");
    expect(CAMERA_SEARCH_V1.forbiddenUiCopy).toContain("Unsupported image");
  });

  it("locks Performance Master Freeze — parallel, one API, no refresh", () => {
    expect(CAMERA_SEARCH_PERFORMANCE_V1.version).toBe("1.0");
    expect(CAMERA_SEARCH_PERFORMANCE_V1.parallelMatchingOnly).toBe(true);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.oneApiCall).toBe(true);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.noRefresh).toBe(true);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.noReload).toBe(true);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.noSecondSearch).toBe(true);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.targetsMs.totalTarget).toBe(2_000);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.targetsMs.absoluteMaximum).toBe(3_000);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.noExactMatchCopy).toBe(
      "No exact match found. Showing similar and relevant marketplace results.",
    );
    expect(CAMERA_SEARCH_PERFORMANCE_V1.loadingChecklist).toContain("Matching Products");
    expect(CAMERA_SEARCH_PERFORMANCE_V1.loadingChecklist).toContain("Preparing Results.....");
  });

  it("keeps Homepage search free of camera; camera uses native picker only", () => {
    const search = readSource("components/home/HomepageSearchField.tsx");
    const camera = readSource("components/home/ImageSearchCamera.tsx");
    const actions = readSource("features/search/components/SearchInputActions.tsx");

    expect(search).not.toContain("ImageSearchCamera");
    expect(camera).toContain("NativeImageFileInput");
    expect(camera).not.toContain("getUserMedia");
    expect(actions).toContain("Confirm");
    expect(actions).toContain("startAutoSearch");
    expect(actions).toContain("autoSearchAfterConfirm");
    expect(actions).not.toMatch(/>\s*Search\s*</);
    expect(actions).not.toContain("router.refresh");
    expect(actions).not.toContain("location.reload");
  });

  it("always renders results page with priority shelves and no dead-end copy", () => {
    const view = readSource("features/search/components/ImageSearchView.tsx");
    const engine = readSource("lib/image-search/search.ts");
    const corpus = readSource("lib/image-search/corpus.ts");
    const page = readSource("app/search/page.tsx");
    const css = readSource("styles/rovexo/image-search.css");
    const api = readSource("app/api/search/image-corpus/route.ts");

    expect(view).toContain("Image Search");
    expect(view).toContain("Exact Products");
    expect(view).toContain("Similar Products");
    expect(view).toContain("Recommended Products");
    expect(view).toContain("Relevant categories");
    expect(view).toContain("Relevant brands");
    expect(view).toContain("rx-image-search-results__checklist");
    expect(view).toContain("runImageSimilaritySearch");
    expect(view).toContain("CAMERA_SEARCH_PERFORMANCE_V1");
    expect(view).toContain("ABSOLUTE_MAX_MS");
    expect(view).not.toContain("router.refresh");
    expect(view).not.toContain("location.reload");
    expect(view).not.toContain("No similar listings found");
    expect(view).not.toContain("Describe your image");
    expect(view).not.toContain("What is this?");
    expect(view).not.toContain("Unsupported image");

    expect(engine).toContain("Promise.all");
    expect(engine).toContain("PARALLEL_BATCH");
    expect(engine).toContain("asRecommended");
    expect(engine).toContain("MIN_SHOW");
    expect(engine).not.toContain("openai");

    expect(corpus).toContain("/api/search/image-corpus");
    expect(corpus).toContain("sessionStorage");
    expect(api).toContain("Promise.all");

    expect(page).toContain('visual === "1"');
    expect(css).toContain("background-color: #ffffff");
    expect(css).toContain("rx-image-search-results__checklist");

    const freeze = readSource("lib/search/camera-search-v1-freeze.ts");
    expect(freeze).toContain("Matching Products");
    expect(freeze).toContain("Matching Recommendations");
  });

  it("scores identical hashes as most similar", () => {
    const hash = "1010101010101010";
    expect(scoreImageSimilarity(hash, hash)).toBe(1);
    expect(scoreImageSimilarity(hash, "0000000000000000")).toBeLessThan(1);
  });
});

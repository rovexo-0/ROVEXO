import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scoreImageSimilarity } from "@/lib/image-search/similarity";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";

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
    expect(CAMERA_SEARCH_V1.maxSearchAnimationMs).toBe(1500);
    expect(CAMERA_SEARCH_V1.stepDurationMs).toBe(500);
    expect(CAMERA_SEARCH_V1.animationSteps[0]).toBe("Searching.....");
    expect(CAMERA_SEARCH_V1.animationSteps).toContain("Matching Attributes.....");
    expect(CAMERA_SEARCH_V1.noExactMatchCopy).toBe(
      "No exact match found. Showing similar and relevant products.",
    );
    expect(CAMERA_SEARCH_V1.forbiddenUiCopy).toContain("Describe your image");
    expect(CAMERA_SEARCH_V1.forbiddenUiCopy).toContain("Unsupported image");
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
  });

  it("always renders results page with priority shelves and no dead-end copy", () => {
    const view = readSource("features/search/components/ImageSearchView.tsx");
    const engine = readSource("lib/image-search/search.ts");
    const page = readSource("app/search/page.tsx");
    const css = readSource("styles/rovexo/image-search.css");

    expect(view).toContain("Image Search");
    expect(view).toContain("Exact Products");
    expect(view).toContain("Similar Products");
    expect(view).toContain("Recommended Products");
    expect(view).toContain("Relevant categories");
    expect(view).toContain("Relevant brands");
    expect(view).toContain("noExactMatchCopy");
    expect(view).not.toContain("No similar listings found");
    expect(view).not.toContain("Describe your image");
    expect(view).not.toContain("What is this?");
    expect(view).not.toContain("Unsupported image");
    expect(engine).toContain("asRecommended");
    expect(engine).toContain("MIN_SHOW");
    expect(engine).not.toContain("openai");
    expect(page).toContain('visual === "1"');
    expect(css).toContain("background-color: #ffffff");

    const freeze = readSource("lib/search/camera-search-v1-freeze.ts");
    expect(freeze).toContain("Matching Products.....");
    expect(freeze).toContain("Matching Attributes.....");
  });

  it("scores identical hashes as most similar", () => {
    const hash = "1010101010101010";
    expect(scoreImageSimilarity(hash, hash)).toBe(1);
    expect(scoreImageSimilarity(hash, "0000000000000000")).toBeLessThan(1);
  });
});

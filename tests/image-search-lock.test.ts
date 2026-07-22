import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scoreImageSimilarity } from "@/lib/image-search/similarity";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Camera Search v1.0 Freeze — zero dead ends", () => {
  it("locks animation, zero-dead-end, and no-AI policies", () => {
    expect(CAMERA_SEARCH_V1.version).toBe("1.0");
    expect(CAMERA_SEARCH_V1.zeroDeadEnds).toBe(true);
    expect(CAMERA_SEARCH_V1.neverBlockOnImageQuality).toBe(true);
    expect(CAMERA_SEARCH_V1.maxSearchAnimationMs).toBe(2000);
    expect(CAMERA_SEARCH_V1.animationSteps[0]).toBe("Searching...");
    expect(CAMERA_SEARCH_V1.allowedStatusWhenNoExact).toBe("No exact match found");
    expect(CAMERA_SEARCH_V1.forbiddenUiCopy).toContain("NO RESULTS FOUND");
  });

  it("keeps Homepage search free of camera; camera uses native picker only", () => {
    const search = readSource("components/home/HomepageSearchField.tsx");
    const camera = readSource("components/home/ImageSearchCamera.tsx");

    expect(search).not.toContain("ImageSearchCamera");
    expect(search).not.toContain("handleImageSearchFiles");
    expect(camera).toContain("NativeImageFileInput");
    expect(camera).not.toContain("getUserMedia");
  });

  it("always renders a results page with similarity + recommended fallbacks", () => {
    const view = readSource("features/search/components/ImageSearchView.tsx");
    const engine = readSource("lib/image-search/search.ts");
    const page = readSource("app/search/page.tsx");
    const css = readSource("styles/rovexo/image-search.css");

    expect(view).toContain("Image Search");
    expect(view).toContain("Exact matches");
    expect(view).toContain("Similar products");
    expect(view).toContain("Recommended products");
    expect(view).toContain("Relevant categories");
    expect(view).toContain("Relevant brands");
    expect(view).toContain("CAMERA_SEARCH_V1");
    expect(view).toContain("animationSteps");
    expect(view).toContain("maxSearchAnimationMs");
    expect(view).not.toContain("No similar listings found");
    expect(view).not.toContain("NO RESULTS FOUND");
    expect(view).not.toContain("Please describe");
    expect(view).not.toContain("What is this?");
    expect(engine).toContain("asRecommended");
    expect(engine).toContain("MIN_SHOW");
    expect(engine).not.toContain("openai");
    expect(engine).not.toContain("vision");
    expect(page).toContain('visual === "1"');
    expect(css).toContain("background-color: #ffffff");
    expect(css).not.toMatch(/purple|#7c3aed|gradient/i);

    const freeze = readSource("lib/search/camera-search-v1-freeze.ts");
    expect(freeze).toContain("Matching products...");
  });

  it("scores identical hashes as most similar", () => {
    const hash = "1010101010101010";
    expect(scoreImageSimilarity(hash, hash)).toBe(1);
    expect(scoreImageSimilarity(hash, "0000000000000000")).toBeLessThan(1);
  });
});

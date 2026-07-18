import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scoreImageSimilarity } from "@/lib/image-search/similarity";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Homepage UI Lock v1.0 — image search", () => {
  it("opens native picker from homepage search without routing first", () => {
    const search = readSource("components/home/HomepageSearchField.tsx");
    const camera = readSource("components/home/ImageSearchCamera.tsx");

    expect(search).toContain("ImageSearchCamera");
    expect(search).toContain("handleImageSearchFiles");
    expect(search).toContain("isImageProcessing");
    expect(camera).toContain("NativeImageFileInput");
    expect(camera).not.toContain("getUserMedia");
  });

  it("renders image search results with canonical listing cards on white background", () => {
    const view = readSource("features/search/components/ImageSearchView.tsx");
    const page = readSource("app/search/page.tsx");
    const css = readSource("styles/rovexo/image-search.css");

    expect(view).toContain("Image Search");
    expect(view).toContain("Exact matches");
    expect(view).toContain("Similar products");
    expect(view).toContain("Similar brands");
    expect(view).toContain("ProductGridSkeleton");
    expect(view).toContain("ListingCard");
    expect(view).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(view).toContain('import("@/lib/image-search/search")');
    expect(page).toContain('visual === "1"');
    expect(page).toContain("rx-image-search-page");
    expect(css).toContain("background-color: #ffffff");
    expect(css).not.toMatch(/purple|#7c3aed|gradient/i);
  });

  it("uses client-side similarity against homepage feed corpus", () => {
    const search = readSource("lib/image-search/search.ts");
    const corpus = readSource("lib/image-search/corpus.ts");

    expect(corpus).toContain("/api/homepage/feed");
    expect(search).not.toContain("ocr");
    expect(search).not.toContain("openai");
    expect(search).not.toContain("vision");
  });

  it("scores identical hashes as most similar", () => {
    const hash = "1010101010101010";
    expect(scoreImageSimilarity(hash, hash)).toBe(1);
    expect(scoreImageSimilarity(hash, "0000000000000000")).toBeLessThan(1);
  });
});

describe("Homepage UI Lock v1.0 — wordmark", () => {
  it("locks official ROVEXO wordmark colors", () => {
    const css = readSource("styles/rovexo/header-v2.css");
    const wordmark = readSource("components/brand/RovexoWordmark.tsx");

    expect(wordmark).toContain("ROVE");
    expect(wordmark).toContain("rx-wordmark__x");
    expect(css).toContain("#7c3aed");
    expect(css).toContain("#111111");
  });
});

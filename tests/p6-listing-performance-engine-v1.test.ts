import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("P6 Listing Performance Engine v1", () => {
  it("does not fetch unused similar products on Listing page", () => {
    const page = readSource("app/(platform)/listing/[slug]/page.tsx");
    expect(page).not.toContain("fetchSimilarProducts");
    expect(page).toContain("fetchProductBySlug");
    const detail = readSource("features/product-detail/ProductDetailPage.tsx");
    expect(detail).not.toContain("similarProducts");
  });

  it("memoises Listing static / gallery surfaces", () => {
    expect(readSource("features/product-detail/ProductGalleryV1.tsx")).toContain(
      "memo(function ProductGalleryV1",
    );
    expect(readSource("features/product-detail/ProductDescriptionV1.tsx")).toContain(
      "memo(function ProductDescriptionV1",
    );
    expect(readSource("features/product-detail/ProductInformationRows.tsx")).toContain(
      "memo(function ProductInformationRows",
    );
    expect(readSource("features/product-detail/ProductStoreSection.tsx")).toContain(
      "memo(function ProductStoreSection",
    );
    expect(readSource("features/product-detail/ProductPageChrome.tsx")).toContain(
      "memo(function ProductPageChrome",
    );
    expect(readSource("features/product-detail/ProductViewsLive.tsx")).toContain(
      "memo(function ProductViewsLive",
    );
    expect(readSource("features/product-detail/ProductActionBarV1.tsx")).toContain(
      "memo(function ProductActionBarV1",
    );
  });

  it("keeps lightbox slides stable across activeIndex (no remount key)", () => {
    const gallery = readSource("features/product-detail/ProductGalleryV1.tsx");
    expect(gallery).toContain("isActive={index === activeIndex}");
    expect(gallery).not.toMatch(/key=\{`\$\{image\}-\$\{index\}-\$\{index === activeIndex\}`\}/);
    expect(gallery).toContain("if (isActive !== wasActive)");
  });

  it("stabilises offer negotiation action callbacks", () => {
    const hook = readSource("features/product-detail/use-product-offer-negotiation.ts");
    expect(hook).toContain("useMemo");
    expect(hook).toContain("const clearError = useCallback");
    expect(hook).toContain("const refresh = useCallback");
    expect(hook).toContain("const cancel = useCallback");
  });
});

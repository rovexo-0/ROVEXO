import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bundle Review UX patch — selected preview + sticky summary split", () => {
  it("Review Bundle shows compact selected-product image preview", () => {
    const page = readSource("features/bundle/BundleReviewPage.tsx");
    const css = readSource("styles/rovexo/product-detail-v1.css");
    expect(page).toContain('import "@/styles/rovexo/product-detail-v1.css"');
    expect(page).toContain("BundleSelectedPreview");
    expect(page).toContain("data-bundle-selected-preview");
    expect(page).toContain("item.imageUrl");
    expect(page).not.toMatch(/pd-v1__bundle-bar/);
    expect(css).toContain(".pd-v1__bundle-review-preview");
    expect(css).toContain(".pd-v1__bundle-review-preview-more");
  });

  it("hides Sticky Bundle Bar on Review Bundle only; Store path remains eligible", () => {
    const globalBar = readSource("features/bundle/GlobalStickyBundleBar.tsx");
    const sticky = readSource("features/bundle/StickyBundleBar.tsx");
    expect(globalBar).toContain('pathname.startsWith("/bundle/review")');
    expect(globalBar).toContain("return null");
    expect(sticky).toContain("pd-v1__bundle-bar");
    expect(sticky).toContain("Review");
    expect(sticky).toContain("items");
  });

  it("Create Bundle selection keeps store premium card sizing (no larger cards)", () => {
    const storeBundles = readSource("features/store/components/StoreShopBundles.tsx");
    const premium = readSource("styles/rovexo/store-listing-card-premium-v1.css");
    expect(storeBundles).toContain("ListingCard");
    expect(storeBundles).toContain("sv2__bundle-select");
    expect(storeBundles).not.toContain("BundleListingCard");
    expect(premium).toContain(
      '[data-store-listing-cards] > .sv2__bundle-select [data-listing-card="rovexo"]',
    );
    expect(premium).toContain(
      '[data-store-listing-cards] > .sv2__bundle-select [data-listing-card="rovexo"] figure',
    );
  });
});

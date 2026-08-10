import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bundle Review UX patch — selected preview + sticky summary removed", () => {
  it("Review Bundle shows compact selected-product image preview", () => {
    const page = readSource("features/bundle/BundleReviewPage.tsx");
    const css = readSource("styles/rovexo/product-detail-v1.css");
    expect(page).toContain('import "@/styles/rovexo/product-detail-v1.css"');
    expect(page).toContain("BundleSelectedPreview");
    expect(page).toContain("data-bundle-selected-preview");
    expect(page).toContain("item.imageUrl");
    expect(page).not.toMatch(/pd-v1__bundle-bar/);
    expect(page).toContain("Make Offer");
    expect(page).toContain("Buy Now");
    expect(page).toContain("OfferComposerSheet");
    expect(css).toContain(".pd-v1__bundle-review-preview");
    expect(css).toContain(".pd-v1__bundle-review-preview-more");
  });

  it("unmounts floating Sticky Bundle Bar (no Review summary card)", () => {
    const globalBar = readSource("features/bundle/GlobalStickyBundleBar.tsx");
    expect(globalBar).toContain("return null");
    expect(globalBar).not.toMatch(/import\s*\{[^}]*StickyBundleBar/);
    expect(globalBar).not.toContain("<StickyBundleBar");
    expect(globalBar).not.toContain("pd-v1__bundle-bar");
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

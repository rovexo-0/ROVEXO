import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const CANONICAL_PRODUCT_DETAIL_FILES = [
  "features/product-detail/ProductDetailPage.tsx",
  "features/product-detail/ProductGalleryV1.tsx",
  "features/product-detail/ProductDescriptionV1.tsx",
  "features/product-detail/ProductConditionCard.tsx",
  "features/product-detail/ProductShippingCard.tsx",
  "features/product-detail/ProductStoreSection.tsx",
  "features/product-detail/ProductDetailBadges.tsx",
  "features/product-detail/ProductSimilarItems.tsx",
  "features/product-detail/ProductRecentlyViewed.tsx",
  "features/product-detail/ProductActionBarV1.tsx",
  "features/product-detail/ProductReportDialog.tsx",
  "features/product-detail/SellerReportDialog.tsx",
  "features/product-detail/AddedToCartToast.tsx",
  "features/product-detail/icons.tsx",
] as const;

const REMOVED_PRODUCT_DETAIL_FILES = [
  "features/product-detail/ProductDetailHeader.tsx",
  "features/product-detail/ProductDetailTopBar.tsx",
  "features/product-detail/ProductDetailScrollHeader.tsx",
  "features/product-detail/ProductGallery.tsx",
  "features/product-detail/ProductActionBar.tsx",
  "features/product-detail/ProductSellerCard.tsx",
  "features/product-detail/ProductDescription.tsx",
  "features/product-detail/ProductDelivery.tsx",
  "features/product-detail/ProductEngagementRow.tsx",
  "features/product-detail/ProductBuyerProtection.tsx",
  "features/product-detail/GlassIconButton.tsx",
] as const;

describe("Product Details UI v1.1", () => {
  it("keeps a single canonical product detail architecture", () => {
    for (const file of CANONICAL_PRODUCT_DETAIL_FILES) {
      expect(existsSync(join(process.cwd(), file)), `${file} must exist`).toBe(true);
    }

    for (const file of REMOVED_PRODUCT_DETAIL_FILES) {
      expect(existsSync(join(process.cwd(), file)), `${file} must be removed`).toBe(false);
    }
  });

  it("locks official product detail layout markers", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const css = readSource("styles/rovexo/product-detail-v1.css");

    expect(page).toContain('data-pd-detail-version="v1.1"');
    expect(page).toContain("ProductGalleryV1");
    expect(page).toContain("ProductConditionCard");
    expect(page).toContain("ProductShippingCard");
    expect(page).toContain("ProductStoreSection");
    expect(page).toContain("ProductSimilarItems");
    expect(page).toContain("ProductRecentlyViewed");
    expect(page).toContain("ProductActionBarV1");
    expect(css).toContain(".pd-v1__gallery");
    expect(css).toContain(".pd-v1__action-bar");
    expect(css).not.toContain(".pd-v1__gallery-badge");
    expect(css).not.toContain(".pd-v1__header");
  });

  it("uses the canonical page header for back navigation", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");

    expect(page).toContain("CanonicalPageHeader");
    expect(page).toContain('<div className="pd-v1__shell">');
    expect(page.indexOf("CanonicalPageHeader")).toBeLessThan(page.indexOf('<div className="pd-v1__shell">'));
  });

  it("keeps approved pricing and removes buyer protection section", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");

    expect(page).toContain("formatListingPriceIncl");
    expect(page).toContain("ProductDetailBadges");
    expect(page).not.toContain("ProductBuyerProtection");
    expect(page).not.toContain("Rating");
  });

  it("orders content sections per official reference", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const mainBlock = page.slice(page.indexOf('className="pd-v1__main"'));
    const badgesIndex = mainBlock.indexOf("<ProductDetailBadges");
    const descriptionIndex = mainBlock.indexOf("<ProductDescriptionV1");
    const conditionIndex = mainBlock.indexOf("<ProductConditionCard");
    const shippingIndex = mainBlock.indexOf("<ProductShippingCard");
    const storeIndex = mainBlock.indexOf("<ProductStoreSection");
    const similarIndex = mainBlock.indexOf("<ProductSimilarItems");

    expect(badgesIndex).toBeGreaterThan(-1);
    expect(descriptionIndex).toBeGreaterThan(badgesIndex);
    expect(conditionIndex).toBeGreaterThan(descriptionIndex);
    expect(shippingIndex).toBeGreaterThan(conditionIndex);
    expect(storeIndex).toBeGreaterThan(shippingIndex);
    expect(similarIndex).toBeGreaterThan(storeIndex);
  });

  it("uses verified seller badge on product info", () => {
    const badges = readSource("features/product-detail/ProductDetailBadges.tsx");

    expect(badges).toContain("Verified Seller");
    expect(badges).not.toContain("Verified Store");
  });

  it("gallery removes promotion badge and supports fullscreen zoom", () => {
    const gallery = readSource("features/product-detail/ProductGalleryV1.tsx");

    expect(gallery).not.toContain("resolveHomepagePromotionBadge");
    expect(gallery).not.toContain("pd-v1__gallery-badge");
    expect(gallery).toContain("pd-v1__lightbox");
    expect(gallery).toContain("PinchZoomSlide");
  });

  it("uses Visit Store CTA and shipping card", () => {
    const store = readSource("features/product-detail/ProductStoreSection.tsx");
    const shipping = readSource("features/product-detail/ProductShippingCard.tsx");

    expect(store).toContain("Visit Store");
    expect(shipping).toContain("resolveShippingEstimate");
  });

  it("similar items use homepage listing card configuration", () => {
    const similar = readSource("features/product-detail/ProductSimilarItems.tsx");

    expect(similar).toContain("HP_CANONICAL_LISTING_PROPS");
  });

  it("action bar matches canonical three-button marketplace layout", () => {
    const bar = readSource("features/product-detail/ProductActionBarV1.tsx");
    const css = readSource("styles/rovexo/product-detail-v1.css");
    const page = readSource("features/product-detail/ProductDetailPage.tsx");

    expect(bar).toContain("PRODUCT_ACTION_BUTTONS");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.buyNow");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.addToCart");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.makeOffer");
    expect(bar).toContain("pd-v1__action-btn--buy");
    expect(bar).toContain("pd-v1__action-btn--cart");
    expect(bar).toContain("pd-v1__action-btn--offer");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).toContain("pd-v1__action-btn--buy");
    expect(css).toContain("pd-v1__action-btn--cart .pd-v1__action-icon");
    expect(page).toContain("useProductActionBar");
    expect(bar).toContain("cartState");
    expect(bar).toContain("buyState");
    expect(page).toContain("OfferComposerSheet");
    expect(bar).not.toContain("Message");
  });

  it("locks canonical add to cart toast flow", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const toast = readSource("features/product-detail/AddedToCartToast.tsx");
    const css = readSource("styles/rovexo/product-detail-v1.css");

    expect(page).toContain("PRODUCT_ACTION_BAR_COPY.addedToCart");
    expect(page).toContain("refreshBadges");
    expect(page).not.toContain('payload.success ? "Added to cart."');
    expect(toast).toContain("Added to your cart");
    expect(toast).toContain("View Your Cart");
    expect(toast).toContain("4500");
    expect(css).toContain(".pd-v1__cart-toast");
    expect(css).toContain("pd-v1-cart-toast-in");
    expect(css).toContain("border-radius: 20px");
  });
});

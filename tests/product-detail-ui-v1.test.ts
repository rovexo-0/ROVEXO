import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PRODUCT_PAGE_CANONICAL_FREEZE_V1 } from "@/lib/product-detail/product-page-canonical-freeze-v1";

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
  "features/product-detail/ProductPageChrome.tsx",
  "features/product-detail/ProductSimilarItems.tsx",
  "features/product-detail/ProductActionBarV1.tsx",
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

describe("Product Page Canonical Freeze v3.1", () => {
  it("locks Owner FINAL FREEZE SSOT", () => {
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.status).toBe("FINAL_FREEZE");
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.version).toBe("cod-sange-v3.1");
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.addToCart).toBe(false);
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.buyNow).toBe(true);
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.makeOffer).toBe(true);
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.removedForever).toContain("Add to Cart");
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.removedForever).toContain("Report Seller");
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.removedForever).toContain(
      "Shipping calculated at checkout",
    );
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.removedForever).toContain(
      "Platform Fee text on product page",
    );
  });

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

    expect(page).toContain('data-pd-detail-version="cod-sange-v3.1"');
    expect(page).toContain('data-product-page-freeze="FINAL_FREEZE"');
    expect(page).toContain('data-add-to-cart="removed-forever"');
    expect(page).toContain("ProductGalleryV1");
    expect(page).toContain("ProductPageChrome");
    expect(page).toContain("ProductConditionCard");
    expect(page).toContain("ProductShippingCard");
    expect(page).toContain("ProductStoreSection");
    expect(page).toContain("ProductSimilarItems");
    expect(page).not.toContain("ProductRecentlyViewed");
    expect(page).not.toContain("ProductDetailBadges");
    expect(page).not.toContain("onAddToCart");
    expect(page).not.toContain("formatPlatformFeeLine");
    expect(page).not.toContain("Platform Fee");
    expect(page).toContain("ProductActionBarV1");
    expect(page).toContain("pd-v1__price-row");
    expect(css).toContain(".pd-v1__gallery");
    expect(css).toContain(".pd-v1__gallery-scroller");
    expect(css).toContain(".pd-v1__chrome");
    expect(css).toContain(".pd-v1__action-bar");
  });

  it("uses transparent chrome overlay — no white title header", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const chrome = readSource("features/product-detail/ProductPageChrome.tsx");

    expect(page).not.toContain("CanonicalPageHeader");
    expect(page).toContain("ProductPageChrome");
    expect(page).toContain('<div className="pd-v1__shell">');
    expect(chrome).toContain("pd-v1__chrome");
    expect(chrome).toContain('aria-label={back.label}');
    expect(chrome).toContain('trigger="menu"');
    expect(chrome).toContain("goBack");
  });

  it("keeps £incl. and removes Platform Fee wording", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");

    expect(page).toContain("formatListingPriceIncl");
    expect(page).not.toContain("formatPlatformFeeLine");
    expect(page).not.toContain("ProductBuyerProtection");
    expect(page).not.toContain("Buyer Protection");
    expect(page).not.toContain("Platform Fee");
    expect(page).not.toContain("ShieldLineIcon");
  });

  it("seller card has avatar, rating, Visit Store on the right", () => {
    const store = readSource("features/product-detail/ProductStoreSection.tsx");
    const shipping = readSource("features/product-detail/ProductShippingCard.tsx");
    const css = readSource("styles/rovexo/product-detail-v1.css");

    expect(store).toContain("Avatar");
    expect(store).toContain("Visit Store");
    expect(store).toContain("pd-v1__store-top");
    expect(store).not.toContain("SellerReportDialog");
    expect(store.indexOf("pd-v1__store-meta")).toBeLessThan(store.indexOf("pd-v1__visit-store"));
    expect(shipping).toContain("Tracked delivery available");
    expect(shipping).toContain("resolveShippingEstimate");
    expect(shipping).not.toContain("Shipping calculated at checkout");
    expect(css).toContain(".pd-v1__visit-store");
    expect(css).toContain("margin-left: auto");
  });

  it("similar items use homepage listing card + See all", () => {
    const similar = readSource("features/product-detail/ProductSimilarItems.tsx");

    expect(similar).toContain("HP_CANONICAL_LISTING_PROPS");
    expect(similar).toContain("See all");
  });

  it("action bar is Buy Now + Make Offer only", () => {
    const bar = readSource("features/product-detail/ProductActionBarV1.tsx");
    const css = readSource("styles/rovexo/product-detail-v1.css");
    const page = readSource("features/product-detail/ProductDetailPage.tsx");

    expect(bar).toContain("PRODUCT_ACTION_BUTTONS");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.buyNow");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.buyNowLoading");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.makeOffer");
    expect(bar).not.toContain("PRODUCT_ACTION_BAR_COPY.addToCart");
    expect(bar).not.toContain("pd-v1__action-btn--cart");
    expect(bar).toContain('data-add-to-cart="removed-forever"');
    expect(css).toContain("repeat(2, minmax(0, 1fr))");
    expect(page).toContain("useProductActionBar");
    expect(page).toContain("OfferComposerSheet");
    expect(bar).not.toContain("Message");
  });
});

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PRODUCT_PAGE_CANONICAL_FREEZE_V1 } from "@/lib/product-detail/product-page-canonical-freeze-v1";
import { VIEW_ITEM_FINAL_UI_LOCK_V1 } from "@/lib/product-detail/view-item-final-ui-lock-v1";
import { VIEW_ITEM_UI_UX_FREEZE_V1 } from "@/lib/product-detail/view-item-ui-ux-freeze-v1";
import { PRODUCT_INFORMATION_FIELD_MAP_V1 } from "@/lib/product-detail/product-information-field-map-v1";
import { buildProductInformationRows } from "@/features/product-detail/build-product-information-rows";
import type { ProductDetail } from "@/lib/products/types";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const CANONICAL_PRODUCT_DETAIL_FILES = [
  "features/product-detail/ProductDetailPage.tsx",
  "features/product-detail/ProductGalleryV1.tsx",
  "features/product-detail/ProductDescriptionV1.tsx",
  "features/product-detail/ProductInformationRows.tsx",
  "features/product-detail/ProductStoreSection.tsx",
  "features/product-detail/ProductPageChrome.tsx",
  "features/product-detail/ProductActionBarV1.tsx",
  "features/product-detail/ProductQuantityStepper.tsx",
  "features/product-detail/ProductStockStatus.tsx",
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

function sampleProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1",
    slug: "sample",
    title: "Sample",
    price: 10,
    condition: "New",
    brand: "Nike",
    colour: "Black",
    material: "Cotton",
    sellerName: "Seller",
    sellerId: "s1",
    rating: 5,
    reviewCount: 1,
    imageUrl: "/x.jpg",
    sections: ["new"],
    images: ["/x.jpg"],
    description: "Desc",
    salesCount: 1,
    deliveryCarriers: ["Royal Mail"],
    stock: 5,
    availability: "in_stock",
    transactionMode: DEFAULT_TRANSACTION_MODE,
    categoryId: "c1",
    categoryBreadcrumbs: [{ id: "c1", name: "Fashion", slug: "fashion" }],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Product Page Canonical Freeze v3.1 + View Item OWNER UI/UX FREEZE", () => {
  it("locks Owner VIEW ITEM v1.0 FROZEN SSOT", () => {
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.status).toBe("FROZEN");
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.version).toBe("cod-sange-v3.1");
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.viewItemVersion).toBe("1.0");
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.addToCart).toBe(false);
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.buyNow).toBe(true);
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.makeOffer).toBe(true);
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.addToBundle).toBe(true);
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.addToCart).toBe(false);
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.deliveryRemovedFromViewItem).toBe(true);
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.removedForever).toContain("Add to Cart");
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.removedForever).toContain("Delivery on View Item");
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.removedForever).toContain(
      "Similar Items on View Item body",
    );
    expect(VIEW_ITEM_FINAL_UI_LOCK_V1.status).toBe("FROZEN");
    expect(VIEW_ITEM_FINAL_UI_LOCK_V1.stock.displayOnceUnderPrice).toBe(true);
    expect(VIEW_ITEM_FINAL_UI_LOCK_V1.stock.forbiddenInSpecificationTable).toBe(true);
    expect(VIEW_ITEM_UI_UX_FREEZE_V1.status).toBe("FROZEN");
    expect(VIEW_ITEM_UI_UX_FREEZE_V1.ownerLocked).toBe(true);
    expect(VIEW_ITEM_UI_UX_FREEZE_V1.productInformationOrder).toEqual([
      "Category",
      "Brand",
      "Condition",
      "Material",
      "Colour",
      "Size",
      "Storage",
      "Network",
      "Compatibility",
      "Season",
      "Uploaded",
    ]);
    expect(PRODUCT_INFORMATION_FIELD_MAP_V1.map((f) => f.id)).toEqual([
      "category",
      "brand",
      "condition",
      "material",
      "colour",
      "size",
      "storage",
      "network",
      "compatibility",
      "season",
      "uploaded",
    ]);
  });

  it("keeps a single canonical product detail architecture", () => {
    for (const file of CANONICAL_PRODUCT_DETAIL_FILES) {
      expect(existsSync(join(process.cwd(), file)), `${file} must exist`).toBe(true);
    }

    for (const file of REMOVED_PRODUCT_DETAIL_FILES) {
      expect(existsSync(join(process.cwd(), file)), `${file} must be removed`).toBe(false);
    }
  });

  it("locks official View Item layout markers and order", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const css = readSource("styles/rovexo/product-detail-v1.css");

    expect(page).toContain('data-pd-detail-version="cod-sange-v3.1"');
    expect(page).toContain('data-product-page-freeze="FROZEN"');
    expect(page).toContain('data-view-item-ui-lock="FROZEN"');
    expect(page).toContain('data-view-item-version="1.0"');
        expect(page).toContain('data-add-to-cart="removed-forever"');
    expect(page).toContain("ProductGalleryV1");
    expect(page).toContain("ProductPageChrome");
    expect(page).toContain("ProductStockStatus");
    expect(page).toContain("ProductStoreSection");
    expect(page).toContain("ProductDescriptionV1");
    expect(page).toContain("ProductInformationRows");
    expect(page).toContain("ProductQuantityStepper");
    expect(page).not.toContain("ProductShippingCard");
    expect(page).not.toContain("ProductConditionCard");
    expect(page).not.toContain("ProductSimilarItems");
    expect(page).not.toContain("ProductRecentlyViewed");
    expect(page).not.toContain("ProductDetailBadges");
    expect(page).not.toContain("onAddToCart");
    expect(page).not.toContain("formatPlatformFeeLine");
    expect(page).not.toContain("Platform Fee");
    expect(page).not.toContain("ScrollContainer");
    expect(page).toContain('data-pd-scroll="document"');
    expect(page).toContain("data-pd-scroll-end");
    expect(page).toContain("ProductActionBarV1");
    expect(page).toContain("pd-v1__price-row");

    const storeIdx = page.indexOf("<ProductStoreSection");
    const descIdx = page.indexOf("<ProductDescriptionV1");
    const infoIdx = page.indexOf("<ProductInformationRows");
    const qtyIdx = page.indexOf("<ProductQuantityStepper");
    expect(storeIdx).toBeGreaterThan(-1);
    expect(descIdx).toBeGreaterThan(storeIdx);
    expect(infoIdx).toBeGreaterThan(descIdx);
    expect(qtyIdx).toBeGreaterThan(infoIdx);

    expect(css).toContain(".pd-v1__gallery");
    expect(css).toContain(".pd-v1__gallery-scroller");
    expect(css).toContain(".pd-v1__chrome");
    expect(css).toContain(".pd-v1__action-bar");
    expect(css).toContain("--pd-v1-sticky-action-clearance");
    expect(css).toContain("--pd-v1-sticky-action-safety");
    expect(css).toContain("overflow: visible");
    expect(css).toContain("max-height: none");
    expect(css).toContain(".pd-v1__scroll-end");
  });

  it("P0 scroll: sticky clearance cannot be clobbered by rx-scroll-page--no-nav", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const pdCss = readSource("styles/rovexo/product-detail-v1.css");
    const scrollCss = readSource("styles/rovexo/mobile-scroll-v1.css");
    const indexCss = readSource("styles/rovexo/index.css");

    expect(page).not.toContain("ScrollContainer");
    expect(page).toContain('data-pd-scroll="document"');
    expect(pdCss).toContain("--pd-v1-sticky-action-safety");
    expect(pdCss.indexOf(".pd-v1 .pd-v1__main")).toBeGreaterThan(-1);
    expect(scrollCss).toContain(".pd-v1 .pd-v1__main.rx-scroll-page--no-nav");
    expect(scrollCss).toContain("padding-bottom: calc(");
    expect(indexCss.indexOf("product-detail-v1.css")).toBeLessThan(
      indexCss.indexOf("mobile-scroll-v1.css"),
    );
  });
  it("uses transparent chrome overlay — no white title header", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const chrome = readSource("features/product-detail/ProductPageChrome.tsx");

    expect(page).not.toContain("CanonicalPageHeader");
    expect(page).toContain("ProductPageChrome");
    expect(page).toContain('<div className="pd-v1__shell">');
    expect(chrome).toContain("pd-v1__chrome");
    expect(chrome).toContain('aria-label={back.label}');
    expect(chrome).toContain("ProductListingActionsMenu");
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
    const css = readSource("styles/rovexo/product-detail-v1.css");

    expect(store).toContain("Avatar");
    expect(store).toContain("Visit Store");
    expect(store).toContain("pd-v1__store-top");
    expect(store).not.toContain("SellerReportDialog");
    expect(store.indexOf("pd-v1__store-meta")).toBeLessThan(store.indexOf("pd-v1__visit-store"));
    expect(css).toContain(".pd-v1__visit-store");
    expect(css).toContain("margin-left: auto");
  });

  it("never shows Delivery on View Item", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    expect(page).not.toContain("ProductShippingCard");
    expect(page).not.toContain("Tracked delivery available");
    expect(page).not.toContain("2–3 working days");
    expect(page).not.toContain("2-3 working days");
  });

  it("info rows never duplicate stock; dynamic map omits empty fields", () => {
    // Leaf schema (t-shirts) drives order — Attribute Engine v1.0 (not hardcoded Fashion root).
    const apparel = sampleProduct({
      size: null,
      categoryBreadcrumbs: [
        { id: "w", name: "Women's Fashion", slug: "womens-fashion" },
        { id: "t", name: "Tops", slug: "womens-tops" },
        { id: "ts", name: "T-Shirts", slug: "t-shirts" },
      ],
    });
    const rows = buildProductInformationRows(apparel);
    expect(rows.map((r) => r.id)).toEqual([
      "category",
      "brand",
      "colour",
      "condition",
      "material",
      "uploaded",
    ]);
    expect(rows.some((r) => r.id === "stock")).toBe(false);

    const stockOnly = buildProductInformationRows(
      sampleProduct({
        stock: 1,
        material: null,
        colour: null,
        size: null,
        categoryBreadcrumbs: [
          { id: "w", name: "Women's Fashion", slug: "womens-fashion" },
          { id: "t", name: "Tops", slug: "womens-tops" },
          { id: "ts", name: "T-Shirts", slug: "t-shirts" },
        ],
      }),
    );
    expect(stockOnly.some((r) => r.id === "stock")).toBe(false);
    expect(stockOnly.map((r) => r.id)).toEqual(["category", "brand", "condition", "uploaded"]);
  });

  it("action bar is Buy Now + Make Offer + Add to Bundle (no cart)", () => {
    const bar = readSource("features/product-detail/ProductActionBarV1.tsx");
    const css = readSource("styles/rovexo/product-detail-v1.css");
    const page = readSource("features/product-detail/ProductDetailPage.tsx");

    expect(bar).toContain("PRODUCT_ACTION_BUTTONS");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.buyNow");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.buyNowLoading");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.makeOffer");
    expect(bar).toContain("onAddToBundle");
    expect(bar).toContain("Add to Bundle");
    expect(bar).not.toContain("PRODUCT_ACTION_BAR_COPY.addToCart");
    expect(bar).not.toContain("pd-v1__action-btn--cart");
    expect(bar).toContain('data-add-to-cart="removed-forever"');
    expect(css).toContain("repeat(2, minmax(0, 1fr))");
    expect(css).toContain(".pd-v1__add-to-bundle");
    expect(page).toContain("useProductActionBar");
    expect(page).toContain("OfferComposerSheet");
    expect(page).toContain("handleAddToBundle");
    expect(bar).not.toContain("Message");
  });
});

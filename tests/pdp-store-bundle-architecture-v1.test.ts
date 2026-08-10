/**
 * Owner final architecture — PDP Add to Bundle REMOVED; Store is canonical create surface.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";
import { PRODUCT_PAGE_CANONICAL_FREEZE_V1 } from "@/lib/product-detail/product-page-canonical-freeze-v1";
import { VIEW_ITEM_BUNDLE_MULTI_STOCK_V1 } from "@/lib/product-detail/view-item-bundle-multi-stock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("COD SÂNGE — PDP vs Store bundle architecture", () => {
  it("SSOT: PDP addToBundle false · Store creation canonical", () => {
    expect(PRODUCT_PAGE_CANONICAL_FREEZE_V1.actions.addToBundle).toBe(false);
    expect(VIEW_ITEM_BUNDLE_MULTI_STOCK_V1.addToBundle).toBe(false);
    expect(VIEW_ITEM_BUNDLE_MULTI_STOCK_V1.storeBundleCreationCanonical).toBe(true);
    expect(BUNDLE_ENGINE_V1.pdpAddToBundle).toBe(false);
    expect(BUNDLE_ENGINE_V1.storeBundleCreationCanonical).toBe(true);
    expect(BUNDLE_ENGINE_V1.ssot.storeCreateSurface).toBe(
      "features/store/components/StoreShopBundles.tsx",
    );
  });

  it("PDP does not render Add to Bundle / sheet / host sticky create CTA", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const bar = readSource("features/product-detail/ProductActionBarV1.tsx");
    expect(page).toContain("onBuy={handleBuyNow}");
    expect(page).toContain("onMakeOffer={handleMakeOffer}");
    expect(page).not.toContain("onAddToBundle");
    expect(page).not.toContain("handleAddToBundle");
    expect(page).not.toContain("AddToBundleSheet");
    expect(page).not.toContain("StickyBundleBar");
    expect(page).not.toContain("persistAddToBundle");
    expect(bar).not.toContain("Add to Bundle");
    expect(bar).not.toContain("onAddToBundle");
    expect(bar).not.toContain('data-bundle-cta="add"');
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.buyNow");
    expect(bar).toContain("PRODUCT_ACTION_BAR_COPY.makeOffer");
  });

  it("Store mounts Shop bundles + Create bundle via one engine client", () => {
    const storePage = readSource("features/store/components/StoreVisitPageV2.tsx");
    const shop = readSource("features/store/components/StoreShopBundles.tsx");
    const client = readSource("features/bundle/add-line-to-bundle-client-v1.ts");
    expect(storePage).toContain("StoreShopBundles");
    expect(shop).toContain("Shop bundles");
    expect(shop).toContain("Create bundle");
    expect(shop).toContain("addLineToBundleClient");
    expect(shop).toContain("BundleSellerConflictDialog");
    expect(shop).toContain("sv2__bundle-builder-bar");
    expect(client).toContain("/api/bundle");
    expect(client).not.toContain("second-bundle-engine");
  });
});

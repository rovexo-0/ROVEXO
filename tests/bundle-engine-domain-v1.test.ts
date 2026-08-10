/**
 * Bundle Engine v1.0 — domain unit tests.
 */

import { describe, expect, it } from "vitest";
import {
  bundleItemCount,
  bundleSubtotal,
  clampBundleQuantity,
  mergeLineIntoBundle,
  removeBundleLinePure,
  showViewItemQuantity,
  showViewItemStockStatus,
  updateBundleLineQuantityPure,
  type BundleSnapshotV1,
} from "@/lib/bundle/bundle-domain-v1";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";

const line = (overrides: Partial<BundleSnapshotV1["items"][0]> = {}) => ({
  productId: "11111111-1111-4111-8111-111111111111",
  slug: "item-a",
  title: "Item A",
  imageUrl: "/a.jpg",
  unitPrice: 10,
  quantity: 1,
  maxStock: 5,
  ...overrides,
});

describe("Bundle Engine domain v1", () => {
  it("locks singularity and equation", () => {
    expect(BUNDLE_ENGINE_V1.equation).toBe("STORE → BUNDLE → CHECKOUT");
    expect(BUNDLE_ENGINE_V1.storeBundleCreationCanonical).toBe(true);
    expect(BUNDLE_ENGINE_V1.pdpAddToBundle).toBe(false);
    expect(BUNDLE_ENGINE_V1.extendsProductDetail).toBe(false);
    expect(BUNDLE_ENGINE_V1.viewItemExtension.pdpAddToBundle).toBe(false);
    expect(BUNDLE_ENGINE_V1.surfaces).toContain("Store");
    expect(BUNDLE_ENGINE_V1.surfaces).not.toContain("View Item");
    expect(BUNDLE_ENGINE_V1.singularity.oneActiveBundlePerBuyer).toBe(true);
    expect(BUNDLE_ENGINE_V1.singularity.oneSellerPerActiveBundle).toBe(true);
    expect(BUNDLE_ENGINE_V1.notACart).toBe(true);
    expect(BUNDLE_ENGINE_V1.notASecondCheckout).toBe(true);
  });

  it("hides View Item stock/qty when stock == 1", () => {
    expect(showViewItemStockStatus(1)).toBe(false);
    expect(showViewItemQuantity(1)).toBe(false);
    expect(showViewItemStockStatus(2)).toBe(true);
    expect(showViewItemQuantity(5)).toBe(true);
  });

  it("clamps quantity 1..stock", () => {
    expect(clampBundleQuantity(0, 5)).toBe(1);
    expect(clampBundleQuantity(99, 5)).toBe(5);
    expect(clampBundleQuantity(3, 5)).toBe(3);
  });

  it("merges same product qty and blocks other seller", () => {
    const first = mergeLineIntoBundle({
      current: null,
      sellerId: "seller-a",
      sellerName: "Seller A",
      line: line({ quantity: 2 }),
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const merged = mergeLineIntoBundle({
      current: first.bundle,
      sellerId: "seller-a",
      sellerName: "Seller A",
      line: line({ quantity: 2 }),
    });
    expect(merged.ok).toBe(true);
    if (!merged.ok) return;
    expect(merged.bundle.items[0]?.quantity).toBe(4);
    expect(bundleItemCount(merged.bundle)).toBe(4);
    expect(bundleSubtotal(merged.bundle)).toBe(40);

    const conflict = mergeLineIntoBundle({
      current: merged.bundle,
      sellerId: "seller-b",
      sellerName: "Seller B",
      line: line({ productId: "22222222-2222-4222-8222-222222222222", slug: "b" }),
    });
    expect(conflict.ok).toBe(false);
    if (conflict.ok) return;
    expect(conflict.reason).toBe("other_seller");
  });

  it("updates and removes lines", () => {
    const created = mergeLineIntoBundle({
      current: null,
      sellerId: "seller-a",
      sellerName: "Seller A",
      line: line(),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = updateBundleLineQuantityPure(created.bundle, line().productId, 3);
    expect(updated?.items[0]?.quantity).toBe(3);

    const emptied = removeBundleLinePure(updated!, line().productId);
    expect(emptied).toBeNull();
  });
});

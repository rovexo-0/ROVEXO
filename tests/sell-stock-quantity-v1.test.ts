import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatStockAvailabilityCopy } from "@/lib/products/stock-availability-copy";
import {
  INVENTORY_MAX,
  clampInventory,
  formatOnlyLeftBadge,
  formatSellerStockLabel,
} from "@/lib/sell/inventory";

describe("Sell Stock Quantity + product availability", () => {
  it("clamps stock to 1–99999 whole numbers", () => {
    expect(INVENTORY_MAX).toBe(99999);
    expect(clampInventory(0)).toBe(1);
    expect(clampInventory(1.7)).toBe(2);
    expect(clampInventory(999999)).toBe(99999);
  });

  it("formats product page In Stock / N available / Out of stock", () => {
    expect(formatStockAvailabilityCopy(12, "in_stock")).toEqual({
      headline: "In Stock",
      detail: "12 available",
      outOfStock: false,
    });
    expect(formatStockAvailabilityCopy(3, "low_stock")).toEqual({
      headline: "In Stock",
      detail: "3 available",
      outOfStock: false,
    });
    expect(formatStockAvailabilityCopy(0, "out_of_stock")).toEqual({
      headline: "Out of stock",
      detail: null,
      outOfStock: true,
    });
  });

  it("homepage only-left badge for 1–5 units", () => {
    expect(formatOnlyLeftBadge(6)).toBeNull();
    expect(formatOnlyLeftBadge(5)).toBe("Only 5 left");
    expect(formatOnlyLeftBadge(1)).toBe("Only 1 left");
    expect(formatOnlyLeftBadge(0)).toBeNull();
  });

  it("seller stock labels", () => {
    expect(formatSellerStockLabel(12)).toBe("12 available");
    expect(formatSellerStockLabel(0)).toBe("Out of stock");
  });

  it("Sell page mounts Quantity between Price and Parcel", () => {
    const page = readFileSync(join(process.cwd(), "features/sell/ui/SellPage.tsx"), "utf8");
    expect(page).toContain("<SellStockQuantityBlock");
    const priceJsx = page.indexOf("<SellPricingBlock");
    const stockJsx = page.indexOf("<SellStockQuantityBlock");
    const parcelJsx = page.indexOf("<SellParcelBlock");
    expect(priceJsx).toBeGreaterThan(-1);
    expect(stockJsx).toBeGreaterThan(priceJsx);
    expect(parcelJsx).toBeGreaterThan(stockJsx);
  });

  it("publish payload still includes draft.stock as inventory.stock", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/sell/build-listing-publish-payload.ts"),
      "utf8",
    );
    expect(source).toContain("clampInventory(draft.stock)");
    expect(source).toContain("inventory: {");
  });
});

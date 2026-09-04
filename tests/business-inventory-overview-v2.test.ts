import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  filterInventoryItems,
  formatInventoryStockOverview,
  inventoryFilterStats,
  normalizeInventoryViewFilter,
  type InventoryItem,
} from "@/lib/business/inventory-overview-v1";
import { editListingHref } from "@/lib/sell/canonical-edit-listing-engine-v1";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function item(
  overrides: Partial<InventoryItem> & Pick<InventoryItem, "id" | "title" | "status" | "stock">,
): InventoryItem {
  return {
    sku: `SKU-${overrides.id}`,
    imageUrl: "",
    ...overrides,
  };
}

describe("Business Inventory overview v2", () => {
  it("removes Bulk Pricing and does not add another pricing system", () => {
    const page = src("features/business/inventory/components/BusinessInventoryPage.tsx");
    expect(page).not.toContain("WholesalePricingManager");
    expect(page).not.toContain("Bulk pricing");
    expect(page).not.toContain("Bulk pricing tiers");
    expect(page).not.toContain("Add tier");
    expect(page).not.toContain("Unit price");
    expect(page).not.toContain("No pricing tiers yet");
  });

  it("opens canonical Sell edit and does not embed a second stock editor", () => {
    const page = src("features/business/inventory/components/BusinessInventoryPage.tsx");
    expect(page).toContain("data-business-inventory=\"overview-v2\"");
    expect(page).toContain("data-inventory-count");
    expect(page).toContain("items.length");
    expect(page).toContain("formatInventoryStockOverview");
    expect(page).toContain("editListingHref");
    expect(page).toContain("Edit product");
    expect(page).toContain("Manage stock");
    expect(page).toContain("Delete product");
    expect(page).not.toContain("type=\"number\"");
    expect(page).not.toContain("aria-label=\"Increase");
    expect(page).not.toContain("aria-label=\"Decrease");
    expect(page).not.toContain("parseInventoryInput");
    expect(page).not.toContain("showChevron");
    expect(editListingHref("listing-1")).toBe("/seller/listings/listing-1/edit");
  });

  it("formats stock from the same Sell quantity number", () => {
    expect(formatInventoryStockOverview(3)).toBe("3 in stock");
    expect(formatInventoryStockOverview(1)).toBe("1 in stock");
    expect(formatInventoryStockOverview(0)).toBe("Out of stock");
    expect(formatInventoryStockOverview(-2)).toBe("Out of stock");
    const overview = src("lib/business/inventory-overview-v1.ts");
    const engine = src("lib/business/inventory.ts");
    expect(overview).toContain("clampStockLevel");
    expect(overview).toContain("from \"@/lib/sell/inventory\"");
    expect(engine).toContain(".select(\"id, title, sku, stock, low_stock_alert\")");
    expect(engine).toContain("stock: product.stock");
    expect(src("features/business/inventory/components/BusinessInventoryPage.tsx")).toContain(
      "inventory-overview-v1",
    );
    expect(src("features/business/inventory/components/BusinessInventoryPage.tsx")).not.toContain(
      "from \"@/lib/business/inventory\"",
    );
  });

  it("isolates Business context on the server, not only in the UI", () => {
    const engine = src("lib/business/inventory.ts");
    const route = src("app/api/business/inventory/route.ts");
    const page = src("app/(platform)/business/inventory/page.tsx");
    expect(engine).toContain("active_seller_context");
    expect(engine).toContain('=== "business"');
    expect(engine).toContain("assertBusinessSellerContext");
    expect(engine).toContain(".eq(\"seller_id\", resolvedUserId)");
    expect(route).toContain("status.activeSellerContext !== \"business\"");
    expect(route).toContain("!status.stripe.verified");
    expect(page).toContain("status.activeSellerContext !== \"business\"");
    expect(page).toContain("status.stripe.verified");
    expect(page).not.toContain("data.items.filter((item) => item.sellerContext");
  });

  it("keeps Business Menu navigation and Stripe gate", () => {
    expect(src("lib/business/pwa-business-menu-v1.ts")).toContain(
      'href: "/business/inventory"',
    );
    expect(src("features/business/inventory/components/BusinessInventoryPage.tsx")).toContain(
      'backHref="/business/menu"',
    );
    expect(src("app/api/business/inventory/route.ts")).not.toContain("verified_business: true");
  });

  it("reuses exclusive low-stock status and canonical search/filter selectors", () => {
    const items = [
      item({ id: "a", title: "Wiper Motor", status: "active", stock: 4, sku: "SKU-AA8284D4" }),
      item({ id: "b", title: "Brake Pad", status: "low_stock", stock: 2, sku: "SKU-LOW" }),
      item({ id: "c", title: "Mirror", status: "out_of_stock", stock: 0, sku: "SKU-OUT" }),
    ];
    expect(inventoryFilterStats(items)).toEqual({ all: 3, inStock: 1, low: 1, out: 1 });
    expect(filterInventoryItems(items, "wiper", "all").map((row) => row.id)).toEqual(["a"]);
    expect(filterInventoryItems(items, "sku-low", "all").map((row) => row.id)).toEqual(["b"]);
    expect(filterInventoryItems(items, "", "active").map((row) => row.id)).toEqual(["a"]);
    expect(filterInventoryItems(items, "", "low_stock").map((row) => row.id)).toEqual(["b"]);
    expect(filterInventoryItems(items, "", "out_of_stock").map((row) => row.id)).toEqual(["c"]);
    expect(filterInventoryItems(items, "missing", "all")).toEqual([]);
    expect(normalizeInventoryViewFilter("in_stock")).toBe("active");
    expect(normalizeInventoryViewFilter("low_stock")).toBe("low_stock");
    expect(src("lib/business/inventory.ts")).toContain("inventoryStatus(product.stock, product.low_stock_alert)");
    expect(src("lib/business/inventory-overview-v1.ts")).not.toContain("LOW_STOCK_THRESHOLD");
  });

  it("deletes through the canonical listing DELETE and refreshes inventory", () => {
    const page = src("features/business/inventory/components/BusinessInventoryPage.tsx");
    expect(page).toContain("Delete product?");
    expect(page).toContain("Are you sure you want to delete");
    expect(page).toContain("This action cannot be undone.");
    expect(page).toContain('fetch(`/api/listings/${pendingDelete.id}`, { method: "DELETE" })');
    expect(page).toContain('fetch("/api/business/inventory"');
    expect(page).toContain('cache: "no-store"');
    expect(page).toContain('addEventListener("pageshow"');
    expect(page).toContain('addEventListener("visibilitychange"');
    expect(page).toContain("if (isDeleting) return");
    expect(page).toContain("openMenuId");
    expect(page).not.toContain("setInterval");
    expect(src("app/api/listings/[id]/route.ts")).toContain("deleteSellerListing");
  });
});

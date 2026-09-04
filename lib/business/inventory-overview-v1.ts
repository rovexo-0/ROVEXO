import { clampStockLevel } from "@/lib/sell/inventory";

export type InventoryStatus = "active" | "low_stock" | "out_of_stock";

/** Card/filter ids. `active` is the exclusive In-stock bucket (not low / not out). */
export type InventoryViewFilter = "all" | InventoryStatus;

export type InventoryOverview = {
  totalProducts: number;
  availableListings: number;
  outOfStock: number;
  totalInventory: number;
  unitsSold: number;
  lowStock: number;
};

export type InventoryItem = {
  id: string;
  title: string;
  sku: string;
  stock: number;
  status: InventoryStatus;
  imageUrl: string;
};

export type InventoryFilterStats = {
  all: number;
  inStock: number;
  low: number;
  out: number;
};

/** Read-only overview copy. Quantity remains editable only in Sell. */
export function formatInventoryStockOverview(stock: number): string {
  const qty = clampStockLevel(stock);
  if (qty <= 0) return "Out of stock";
  return `${qty} in stock`;
}

export function normalizeInventoryViewFilter(
  value: string | null | undefined,
): InventoryViewFilter {
  if (value === "active" || value === "in_stock") return "active";
  if (value === "low_stock") return "low_stock";
  if (value === "out_of_stock") return "out_of_stock";
  return "all";
}

/**
 * Exclusive ROVEXO buckets from `listInventoryItems` status
 * (`products.stock` + `products.low_stock_alert`).
 * In stock + Low stock + Out of stock = All.
 */
export function inventoryFilterStats(items: readonly InventoryItem[]): InventoryFilterStats {
  let inStock = 0;
  let low = 0;
  let out = 0;
  for (const item of items) {
    if (item.status === "out_of_stock") out += 1;
    else if (item.status === "low_stock") low += 1;
    else inStock += 1;
  }
  return { all: items.length, inStock, low, out };
}

export function filterInventoryItems(
  items: readonly InventoryItem[],
  query: string,
  filter: InventoryViewFilter,
): InventoryItem[] {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    if (!needle) return true;
    return item.title.toLowerCase().includes(needle) || item.sku.toLowerCase().includes(needle);
  });
}

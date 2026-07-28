/**
 * Product stock availability copy — products.stock SSOT.
 */

import { clampStockLevel } from "@/lib/sell/inventory";

export type StockAvailabilityCopy = {
  headline: string;
  detail: string | null;
  outOfStock: boolean;
};

/**
 * Product page:
 *   In Stock / N available
 *   Out of stock
 */
export function formatStockAvailabilityCopy(
  stock: number,
  availability?: "in_stock" | "low_stock" | "out_of_stock",
): StockAvailabilityCopy {
  const qty = clampStockLevel(stock);

  if (qty <= 0 || availability === "out_of_stock") {
    return { headline: "Out of stock", detail: null, outOfStock: true };
  }

  return {
    headline: "In Stock",
    detail: `${qty} available`,
    outOfStock: false,
  };
}

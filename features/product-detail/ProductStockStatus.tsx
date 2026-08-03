"use client";

import { clampStockLevel } from "@/lib/sell/inventory";
import { showViewItemStockStatus } from "@/lib/bundle/bundle-domain-v1";
import type { ProductDetail } from "@/lib/products/types";

type ProductStockStatusProps = {
  stock: ProductDetail["stock"];
  availability: ProductDetail["availability"];
};

/**
 * Product-page-only stock visibility (Bundle Engine Master Spec).
 * Stock == 1 → hide under-price status. Stock > 1 → In Stock · N available.
 * Listing cards never show stock badges or quantity.
 */
export function ProductStockStatus({ stock, availability }: ProductStockStatusProps) {
  const qty = clampStockLevel(stock);
  const outOfStock = qty <= 0 || availability === "out_of_stock";

  if (outOfStock) {
    return (
      <p
        className="pd-v1__stock"
        data-stock-availability="out_of_stock"
        data-out-of-stock="true"
        aria-live="polite"
      >
        <span className="pd-v1__stock-headline">Out of stock</span>
        <span className="pd-v1__stock-detail">This item is currently unavailable.</span>
      </p>
    );
  }

  if (!showViewItemStockStatus(qty)) {
    return null;
  }

  return (
    <p
      className="pd-v1__stock"
      data-stock-availability={availability}
      data-out-of-stock="false"
      aria-live="polite"
    >
      <span className="pd-v1__stock-headline">
        <span className="pd-v1__stock-check" aria-hidden>
          ✓
        </span>{" "}
        In Stock
      </span>
      <span className="pd-v1__stock-detail">{`${qty} available`}</span>
    </p>
  );
}

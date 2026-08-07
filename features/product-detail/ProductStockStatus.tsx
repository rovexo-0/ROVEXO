import { clampStockLevel } from "@/lib/sell/inventory";
import type { ProductDetail } from "@/lib/products/types";

type ProductStockStatusProps = {
  stock: ProductDetail["stock"];
  availability: ProductDetail["availability"];
};

/**
 * View Item v2.0 stock line — green dot + In Stock (mockup).
 * No card. Below seller. Out of stock remains fail-closed copy.
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
        <span className="pd-v1__stock-dot" aria-hidden />
        <span className="pd-v1__stock-headline">Out of stock</span>
      </p>
    );
  }

  return (
    <p
      className="pd-v1__stock"
      data-stock-availability={availability}
      data-out-of-stock="false"
      aria-live="polite"
    >
      <span className="pd-v1__stock-dot" aria-hidden />
      <span className="pd-v1__stock-headline">In Stock</span>
    </p>
  );
}

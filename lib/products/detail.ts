import type { DeliveryCarrier, Product, ProductDetail } from "@/lib/products/types";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";

const DEFAULT_CARRIERS: DeliveryCarrier[] = ["Royal Mail", "Evri", "DPD", "InPost"];

/**
 * Absolute Law v5.0 — real products only.
 * Gallery/description come from DB fields. Never pad with demo/category/fake images.
 */
function buildGallery(product: Product): string[] {
  if (product.imageUrl?.trim()) return [product.imageUrl];
  return [];
}

function buildDescription(product: Product): string {
  return product.description?.trim() || product.title;
}

export function toProductDetail(product: Product): ProductDetail {
  const sellerId = product.sellerId?.trim();
  if (!sellerId) {
    throw new Error("REAL_PRODUCTS_ONLY: product detail requires sellerId from database.");
  }

  return {
    ...product,
    images: buildGallery(product),
    description: buildDescription(product),
    salesCount: Math.max(0, product.reviewCount ?? 0),
    freeDelivery: product.freeDelivery ?? false,
    deliveryCarriers: DEFAULT_CARRIERS,
    sellerVerified: Boolean(product.sellerVerified),
    stock: 1,
    availability: "in_stock",
    sellerId,
    transactionMode: product.transactionMode ?? DEFAULT_TRANSACTION_MODE,
  };
}

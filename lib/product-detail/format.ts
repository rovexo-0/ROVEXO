import type { Product, ProductDetail } from "@/lib/products/types";
import { normalizeCondition } from "@/lib/products/utils";

const SUBTITLE_BY_SLUG: Record<string, string> = {
  "demo-iphone-15-pro": "Natural Titanium",
  "nike-air-max-90": "White / Blue · UK 9",
};

const CONDITION_COPY: Record<string, string> = {
  "Like New":
    "This item is in excellent condition with minimal signs of use. Fully tested and in perfect working order.",
  "Very Good":
    "This item shows light signs of use but remains in great working condition. Fully tested before listing.",
  Good: "This item is in good condition with visible signs of use. Fully functional and ready to use.",
  New: "This item is brand new, unused, and in original packaging where applicable.",
};

export function resolveProductSubtitle(product: Product): string | null {
  const mapped = SUBTITLE_BY_SLUG[product.slug];
  if (mapped) return mapped;

  const parts = product.title.split(" - ");
  if (parts.length > 1) return parts.slice(1).join(" - ").trim();

  return null;
}

export function resolveConditionLabel(condition: string): string {
  return normalizeCondition(condition);
}

export function resolveConditionCopy(condition: string): string {
  const label = resolveConditionLabel(condition);
  return (
    CONDITION_COPY[label] ??
    `This item is listed as ${label.toLowerCase()}. Inspected by the seller and ready for delivery.`
  );
}

export function resolveShippingEstimate(product: ProductDetail): string {
  if (product.freeDelivery) return "Estimated delivery: 2-3 days";
  if (product.deliveryCarriers.includes("DPD")) return "Estimated delivery: 1-2 days";
  return "Estimated delivery: 2-3 days";
}

export function isPremiumSeller(product: Product): boolean {
  return product.sellerTier === "premium" || product.listingType === "premium";
}

export function isVerifiedStore(product: Product): boolean {
  return (
    Boolean(product.sellerVerified) ||
    product.sellerTier === "business" ||
    product.sellerTier === "verified"
  );
}

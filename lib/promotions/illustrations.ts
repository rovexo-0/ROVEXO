/**
 * Promote page premium illustrations — ROVEXO 2026 artwork SSOT.
 * Optimized WebP under /public/promotions/
 */

import type { PromotionPreviewVariant } from "@/lib/promotions/catalog";

export type PromoteIllustrationAsset = {
  src: string;
  alt: string;
};

const ILLUSTRATIONS: Record<
  "search-bump" | "store-featured" | "feed-boost",
  PromoteIllustrationAsset
> = {
  "search-bump": {
    src: "/promotions/promote-bump-listing-2026.webp",
    alt: "Premium marketplace products with elevated listing visibility",
  },
  "store-featured": {
    src: "/promotions/promote-store-showcase-2026.webp",
    alt: "Premium store product showcase with featured exposure",
  },
  "feed-boost": {
    src: "/promotions/promote-boost-package-2026.webp",
    alt: "Multiple premium products under maximum marketplace visibility",
  },
};

export function getPromoteIllustration(
  variant: PromotionPreviewVariant,
): PromoteIllustrationAsset {
  if (variant === "store-featured") return ILLUSTRATIONS["store-featured"];
  if (variant === "feed-boost" || variant === "homepage-premium") {
    return ILLUSTRATIONS["feed-boost"];
  }
  return ILLUSTRATIONS["search-bump"];
}

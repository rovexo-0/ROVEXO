import type { PromotionCatalogId } from "@/lib/promotions/catalog";

export type PromotionToolSlug = "bump" | "store-featured" | "boost";

export type PromotionToolMenuItem = {
  slug: PromotionToolSlug;
  title: string;
  catalogId: PromotionCatalogId;
};

export const PROMOTION_TOOL_MENU_ITEMS: PromotionToolMenuItem[] = [
  { slug: "bump", title: "Bump Listing", catalogId: "bump" },
  { slug: "store-featured", title: "Featured Store", catalogId: "store_featured" },
  { slug: "boost", title: "Boost Package", catalogId: "boost" },
];

export function resolvePromotionToolSlug(value: string): PromotionToolSlug | null {
  return PROMOTION_TOOL_MENU_ITEMS.find((item) => item.slug === value)?.slug ?? null;
}

export function getPromotionToolMenuItem(slug: PromotionToolSlug): PromotionToolMenuItem {
  const item = PROMOTION_TOOL_MENU_ITEMS.find((entry) => entry.slug === slug);
  if (!item) {
    throw new Error(`Unknown promotion tool slug: ${slug}`);
  }
  return item;
}

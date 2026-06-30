import type { RovexoCategoryPremiumKey } from "@/lib/home/category-premium-library";
import { ROVEXO_HOME_CATEGORY_RAIL } from "@/lib/home/category-premium-library";
import { HOME_HERO_BANNERS } from "@/lib/home/constants";

/** Maps category rail icons to hero campaign slide ids */
export const HERO_CATEGORY_SLIDE_MAP: Record<RovexoCategoryPremiumKey, string> = {
  vehicles: "fast-delivery",
  autoparts: "fast-delivery",
  property: "verified-businesses",
  phones: "electronics-deals",
  computers: "electronics-deals",
  electronics: "electronics-deals",
  gaming: "electronics-deals",
  "home-garden": "home-garden",
  diy: "home-garden",
  tools: "home-garden",
  "womens-fashion": "zero-fees",
  "mens-fashion": "zero-fees",
  "kids-fashion": "home-garden",
  shoes: "fast-delivery",
  jewellery: "premium-auctions",
  beauty: "zero-fees",
  health: "buy-securely",
  pets: "home-garden",
  sports: "fast-delivery",
  services: "zero-fees",
  fashion: "zero-fees",
  furniture: "home-garden",
  books: "buy-securely",
  business: "verified-businesses",
  collectibles: "premium-auctions",
  kids: "home-garden",
  luxury: "premium-auctions",
  handmade: "zero-fees",
  export: "fast-delivery",
  more: "buy-securely",
};

export function resolveHeroSlideIndex(categoryKey: RovexoCategoryPremiumKey): number {
  const slideId = HERO_CATEGORY_SLIDE_MAP[categoryKey];
  const index = HOME_HERO_BANNERS.findIndex((slide) => slide.id === slideId);
  return index >= 0 ? index : 0;
}

export function resolveCategoryKeyFromHref(href: string | null): RovexoCategoryPremiumKey | null {
  if (!href) return null;

  const item = ROVEXO_HOME_CATEGORY_RAIL.find(
    (category) => category.href === href || href === `/category/${category.slug}`,
  );
  return item?.icon ?? null;
}

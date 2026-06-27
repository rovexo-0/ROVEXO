import type { RovexoCategoryPremiumKey } from "@/lib/home/category-premium-library";
import { ROVEXO_HOME_CATEGORY_RAIL } from "@/lib/home/category-premium-library";
import { HOME_HERO_BANNERS } from "@/lib/home/constants";

/** Maps category rail icons to hero campaign slide ids */
export const HERO_CATEGORY_SLIDE_MAP: Record<RovexoCategoryPremiumKey, string> = {
  vehicles: "vehicles",
  autoparts: "vehicles",
  property: "property",
  phones: "phones",
  computers: "computers",
  electronics: "electronics",
  gaming: "electronics",
  "home-garden": "home-garden",
  diy: "home-garden",
  tools: "home-garden",
  fashion: "fashion",
  kids: "fashion",
  sports: "seasonal",
  pets: "home-garden",
  business: "verified-sellers",
  services: "verified-sellers",
  luxury: "luxury",
  collectibles: "luxury",
  handmade: "home-garden",
  furniture: "home-garden",
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

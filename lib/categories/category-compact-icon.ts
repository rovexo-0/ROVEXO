import type { HomeCategoryIconType } from "@/lib/home/constants";
import {
  isRovexoCategoryPremiumKey,
  type RovexoCategoryPremiumKey,
} from "@/lib/home/category-premium-library";
import { RovexoIcons } from "@/lib/icons/icons";
import type { RovexoIconRef } from "@/lib/icons/types";

/** Maps legacy/home icon types to registered premium category keys. */
const LEGACY_TO_PREMIUM: Partial<Record<HomeCategoryIconType, RovexoCategoryPremiumKey>> = {
  more: "services",
  fashion: "womens-fashion",
  furniture: "home-garden",
  baby: "kids-fashion",
  kids: "kids-fashion",
  jobs: "services",
  wholesale: "services",
  business: "services",
  auctions: "gaming",
  collectibles: "gaming",
  cycling: "sports",
  luxury: "jewellery",
  handmade: "diy",
};

export function resolveCategoryCompactIcon(type: HomeCategoryIconType): RovexoIconRef {
  const premiumKey: RovexoCategoryPremiumKey = isRovexoCategoryPremiumKey(type)
    ? type
    : (LEGACY_TO_PREMIUM[type] ?? "electronics");

  return RovexoIcons.categories[premiumKey];
}

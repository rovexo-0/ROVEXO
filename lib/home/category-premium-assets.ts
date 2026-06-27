import type { HomeCategoryIconType } from "@/lib/home/constants";
import {
  getCategoryPremiumAssetPath,
  isRovexoCategoryPremiumKey,
  ROVEXO_CATEGORY_PREMIUM_KEYS,
  ROVEXO_CATEGORY_RENDER_SIZE,
  type RovexoCategoryPremiumKey,
} from "@/lib/home/category-premium-library";

export {
  ROVEXO_CATEGORY_PREMIUM_KEYS as CATEGORY_PREMIUM_RENDER_TYPES,
  ROVEXO_CATEGORY_RENDER_SIZE,
  type RovexoCategoryPremiumKey as CategoryPremiumRenderType,
};

const PREMIUM_RENDER_SET = new Set<string>(ROVEXO_CATEGORY_PREMIUM_KEYS);

export function getCategoryPremiumRenderSrc(type: HomeCategoryIconType): string {
  if (!isRovexoCategoryPremiumKey(type)) {
    throw new Error(
      `[ROVEXO] Missing premium category asset mapping for "${type}". ` +
        `Add source PNG at public/categories/home/source/${type}.png and register in category-premium-library.ts`,
    );
  }
  return getCategoryPremiumAssetPath(type);
}

export function hasCategoryPremiumRender(type: HomeCategoryIconType): type is RovexoCategoryPremiumKey {
  return PREMIUM_RENDER_SET.has(type);
}

export function assertCategoryPremiumRender(type: HomeCategoryIconType): asserts type is RovexoCategoryPremiumKey {
  if (!hasCategoryPremiumRender(type)) {
    throw new Error(
      `[ROVEXO] Premium category asset required for "${type}". ` +
        `Place public/categories/home/source/${type}.png then run: node scripts/generate-home-category-icons.mjs`,
    );
  }
}

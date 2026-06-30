import type { HomeCategoryIconType } from "@/lib/home/constants";
import {
  getCategoryPremiumPngSrc,
  getCategoryPremiumSrcSet,
  isRovexoCategoryPremiumKey,
  resolveCategoryPremiumIcon,
  ROVEXO_CATEGORY_PREMIUM_KEYS,
  ROVEXO_CATEGORY_RENDER_SIZE,
  type RovexoCategoryPremiumKey,
} from "@/lib/home/category-premium-library";

export {
  ROVEXO_CATEGORY_PREMIUM_KEYS as CATEGORY_PREMIUM_RENDER_TYPES,
  ROVEXO_CATEGORY_RENDER_SIZE,
  type RovexoCategoryPremiumKey as CategoryPremiumRenderType,
  getCategoryPremiumPngSrc,
  getCategoryPremiumSrcSet,
  resolveCategoryPremiumIcon,
};

const PREMIUM_RENDER_SET = new Set<string>(ROVEXO_CATEGORY_PREMIUM_KEYS);

export function getCategoryPremiumRenderSrc(type: HomeCategoryIconType | string): string {
  const resolved = resolveCategoryPremiumIcon(type);
  if (!isRovexoCategoryPremiumKey(resolved)) {
    throw new Error(
      `[ROVEXO] Missing premium category asset mapping for "${type}". ` +
        `Add source PNG at public/categories/source/${resolved}.png`,
    );
  }
  return getCategoryPremiumPngSrc(resolved);
}

export function hasCategoryPremiumRender(type: HomeCategoryIconType | string): type is RovexoCategoryPremiumKey {
  const resolved = resolveCategoryPremiumIcon(type);
  return PREMIUM_RENDER_SET.has(resolved);
}

export function assertCategoryPremiumRender(type: HomeCategoryIconType | string): asserts type is RovexoCategoryPremiumKey {
  if (!hasCategoryPremiumRender(type)) {
    throw new Error(
      `[ROVEXO] Premium category asset required for "${type}". ` +
        `Run: node scripts/generate-production-from-sources.mjs`,
    );
  }
}

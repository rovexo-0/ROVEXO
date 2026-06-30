import { resolveCategoryPremiumIcon, getCategoryPremiumPngSrc } from "@/lib/home/category-premium-library";

/** Maps marketplace category slugs to premium PNG icon keys (no emoji, no SVG). */
export function resolveCategoryIconType(slug: string): string {
  return resolveCategoryPremiumIcon(slug);
}

/** Returns the canonical premium PNG asset path for a category slug. */
export function getCategoryIconPath(slug: string): string {
  return getCategoryPremiumPngSrc(resolveCategoryPremiumIcon(slug));
}

/** @deprecated Use getCategoryIconPath or CategoryPremiumIcon */
export function getHomeCategoryIconSrc(): string {
  return "";
}

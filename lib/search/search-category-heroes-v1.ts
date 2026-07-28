/**
 * ROVEXO SUPREME BLOOD CODE XXIX + Blood Laws XXXV / XXXVI — Search category hero assets.
 * Search landing uses this set exclusively. Homepage rail assets unchanged.
 * Visual identity SSOT: lib/supreme-blood-law-xxxv-category-visual-identity-v1.ts
 * Library freeze: lib/supreme-blood-law-xxxvi-category-visual-library-freeze-v1.ts
 */

import type { RovexoCategoryPremiumKey } from "@/lib/home/category-premium-library";
import { isRovexoCategoryPremiumKey } from "@/lib/home/category-premium-library";

export const SEARCH_CATEGORY_HEROES_V1 = {
  version: "1.0",
  bloodCode: "XXIX",
  basePath: "/search/categories",
  format: "png" as const,
  /** Canonical Search roots (Law XXX / Catalog Master) — one premium hero each. */
  keys: [
    "womens-fashion",
    "mens-fashion",
    "jewellery",
    "kids-fashion",
    "home-garden",
    "electronics",
    "books",
    "collectibles",
    "sports",
    "autoparts",
  ] as const satisfies readonly RovexoCategoryPremiumKey[],
} as const;

export type SearchCategoryHeroKey = (typeof SEARCH_CATEGORY_HEROES_V1.keys)[number];

export function getSearchCategoryHeroPath(key: RovexoCategoryPremiumKey | string): string {
  const safe = isRovexoCategoryPremiumKey(key) ? key : "electronics";
  const heroKey = (SEARCH_CATEGORY_HEROES_V1.keys as readonly string[]).includes(safe)
    ? safe
    : "electronics";
  // PNG masters for max visual quality on Search cards (UI polish).
  return `${SEARCH_CATEGORY_HEROES_V1.basePath}/${heroKey}.png`;
}

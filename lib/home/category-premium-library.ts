/**
 * ROVEXO permanent premium category visual asset library.
 * Homepage + Search rail SSOT — Absolute Laws XXX / XXXV / XXXVI (Visual Library Freeze).
 *
 * Assets: public/categories/{icon}.{avif,webp,png} (1024×1024 · studio · white bg)
 * Roots lock: lib/categories/canonical-root-categories-v1.ts
 * Visual law: lib/supreme-blood-law-xxxv-category-visual-identity-v1.ts
 * Library freeze: lib/supreme-blood-law-xxxvi-category-visual-library-freeze-v1.ts
 */

import {
  CANONICAL_ROOT_CATEGORIES,
  type CanonicalRootCategory,
} from "@/lib/categories/canonical-root-categories-v1";

export const ROVEXO_CATEGORY_RENDER_SIZE = 1024;

export type RovexoCategoryPremiumKey =
  | "vehicles"
  | "property"
  | "phones"
  | "computers"
  | "electronics"
  | "gaming"
  | "home-garden"
  | "diy"
  | "tools"
  | "womens-fashion"
  | "mens-fashion"
  | "kids-fashion"
  | "shoes"
  | "jewellery"
  | "beauty"
  | "health"
  | "pets"
  | "sports"
  | "services"
  | "autoparts"
  | "books"
  | "collectibles";

export type RovexoCategoryPremiumItem = {
  name: string;
  slug: string;
  icon: RovexoCategoryPremiumKey;
  subtitle: string;
  href?: string;
};

function toPremiumItem(root: CanonicalRootCategory): RovexoCategoryPremiumItem {
  return {
    name: root.name,
    slug: root.slug,
    icon: root.icon as RovexoCategoryPremiumKey,
    subtitle: root.subtitle,
  };
}

/**
 * Canonical Homepage + Search category rail — Law XXX / Catalog Master.
 * Exactly 10 roots · fixed order · Vehicle Parts own root · no whole Vehicles / Property / Business.
 */
export const ROVEXO_HOME_CATEGORY_RAIL: readonly RovexoCategoryPremiumItem[] =
  CANONICAL_ROOT_CATEGORIES.map(toPremiumItem);

/** All known premium asset keys (includes legacy icons kept for sell/taxonomy UI). */
export const ROVEXO_CATEGORY_PREMIUM_KEYS: readonly RovexoCategoryPremiumKey[] = [
  "vehicles",
  "property",
  "phones",
  "computers",
  "electronics",
  "gaming",
  "home-garden",
  "diy",
  "tools",
  "womens-fashion",
  "mens-fashion",
  "kids-fashion",
  "shoes",
  "jewellery",
  "beauty",
  "health",
  "pets",
  "sports",
  "services",
  "autoparts",
  "books",
  "collectibles",
] as const;

/** Keys required on disk for the live 10-root rail. */
export const ROVEXO_CANONICAL_RAIL_ICON_KEYS: readonly RovexoCategoryPremiumKey[] =
  ROVEXO_HOME_CATEGORY_RAIL.map((item) => item.icon);

export function getCategoryPremiumAssetPath(icon: RovexoCategoryPremiumKey): string {
  return `/categories/${icon}.webp`;
}

export function getCategoryPremiumAvifSrc(icon: RovexoCategoryPremiumKey): string {
  return `/categories/${icon}.avif`;
}

export function getCategoryPremiumPngSrc(icon: RovexoCategoryPremiumKey): string {
  return `/categories/${icon}.png`;
}

export function getCategoryPremiumSrcSet(
  icon: RovexoCategoryPremiumKey,
  format: "avif" | "webp" | "png",
): string {
  const sizes = [64, 128, 256, 512, 1024] as const;
  const resolver =
    format === "avif"
      ? (key: RovexoCategoryPremiumKey, size: number) =>
          size === 1024 ? `/categories/${key}.avif` : `/categories/${key}-${size}.avif`
      : format === "webp"
        ? (key: RovexoCategoryPremiumKey, size: number) =>
            size === 1024 ? `/categories/${key}.webp` : `/categories/${key}-${size}.webp`
        : (key: RovexoCategoryPremiumKey, size: number) =>
            size === 1024 ? `/categories/${key}.png` : `/categories/${key}-${size}.png`;

  return sizes.map((size) => `${resolver(icon, size)} ${size}w`).join(", ");
}

export function isRovexoCategoryPremiumKey(value: string): value is RovexoCategoryPremiumKey {
  return (ROVEXO_CATEGORY_PREMIUM_KEYS as readonly string[]).includes(value);
}

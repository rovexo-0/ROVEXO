/**
 * ROVEXO permanent premium category visual asset library.
 * Single source of truth for homepage category rail assets, nav labels, and export keys.
 *
 * Assets: public/categories/{icon}.{avif,webp,png} (1024×1024 transparent)
 * Sources: public/categories/source/{icon}.png
 * Regenerate: node scripts/generate-production-from-sources.mjs
 * Import masters: node scripts/import-premium-photo-sources.mjs
 * Verify: node scripts/verify-category-premium-assets.mjs
 */

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
  | "autoparts";

export type RovexoCategoryPremiumItem = {
  name: string;
  slug: string;
  icon: RovexoCategoryPremiumKey;
  subtitle: string;
  href?: string;
};

/** Canonical homepage category rail — Prompt 019 premium design system */
export const ROVEXO_HOME_CATEGORY_RAIL: readonly RovexoCategoryPremiumItem[] = [
  { name: "Vehicles", slug: "vehicles", icon: "vehicles", subtitle: "Cars, vans & bikes" },
  { name: "Property", slug: "property", icon: "property", subtitle: "Homes & rentals" },
  { name: "Phones", slug: "phones", icon: "phones", subtitle: "Mobile & tablets" },
  { name: "Computers", slug: "computers", icon: "computers", subtitle: "Laptops & PCs" },
  { name: "Electronics", slug: "electronics", icon: "electronics", subtitle: "Tech & gadgets" },
  { name: "Gaming", slug: "gaming", icon: "gaming", subtitle: "Consoles & games" },
  { name: "Home & Garden", slug: "home-garden", icon: "home-garden", subtitle: "Decor & outdoor" },
  { name: "DIY", slug: "diy", icon: "diy", subtitle: "Build & repair" },
  { name: "Tools", slug: "tools", icon: "tools", subtitle: "Power & hand tools" },
  { name: "Women's Fashion", slug: "womens-fashion", icon: "womens-fashion", subtitle: "Style & apparel" },
  { name: "Men's Fashion", slug: "mens-fashion", icon: "mens-fashion", subtitle: "Clothing & accessories" },
  { name: "Kids Fashion", slug: "kids", icon: "kids-fashion", subtitle: "Children & baby" },
  { name: "Shoes", slug: "shoes", icon: "shoes", subtitle: "Trainers & footwear" },
  { name: "Jewellery", slug: "jewellery", icon: "jewellery", subtitle: "Rings, watches & gems" },
  { name: "Beauty", slug: "beauty", icon: "beauty", subtitle: "Skincare & cosmetics" },
  { name: "Health", slug: "health", icon: "health", subtitle: "Wellness & fitness" },
  { name: "Pets", slug: "pets", icon: "pets", subtitle: "Animals & supplies" },
  { name: "Sports", slug: "sports", icon: "sports", subtitle: "Fitness & gear" },
  { name: "Services", slug: "services", icon: "services", subtitle: "Local professionals" },
  { name: "Auto Parts", slug: "car-parts", icon: "autoparts", subtitle: "Parts & accessories" },
] as const;

export const ROVEXO_CATEGORY_PREMIUM_KEYS: readonly RovexoCategoryPremiumKey[] =
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

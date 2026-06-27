/**
 * ROVEXO permanent premium category visual asset library.
 * Single source of truth for homepage category rail assets, nav labels, and export keys.
 *
 * Assets: public/categories/home/{icon}.webp (1024×1024 transparent WebP)
 * Sources: public/categories/home/source/{icon}.png
 * Regenerate: node scripts/generate-home-category-icons.mjs
 * Verify: node scripts/verify-category-premium-assets.mjs
 */

export const ROVEXO_CATEGORY_RENDER_SIZE = 1024;

export type RovexoCategoryPremiumKey =
  | "vehicles"
  | "autoparts"
  | "property"
  | "phones"
  | "computers"
  | "electronics"
  | "gaming"
  | "home-garden"
  | "diy"
  | "tools"
  | "fashion"
  | "kids"
  | "sports"
  | "pets"
  | "business"
  | "services"
  | "luxury"
  | "collectibles"
  | "handmade"
  | "furniture";

export type RovexoCategoryPremiumItem = {
  name: string;
  slug: string;
  icon: RovexoCategoryPremiumKey;
  subtitle: string;
  href?: string;
};

/** Canonical homepage category rail — order and assets are locked */
export const ROVEXO_HOME_CATEGORY_RAIL: readonly RovexoCategoryPremiumItem[] = [
  { name: "Vehicles", slug: "vehicles", icon: "vehicles", subtitle: "Cars, vans & bikes" },
  { name: "Auto Parts", slug: "car-parts", icon: "autoparts", subtitle: "Parts & accessories" },
  { name: "Property", slug: "property", icon: "property", subtitle: "Homes & rentals" },
  { name: "Phones", slug: "phones", icon: "phones", subtitle: "Mobile & tablets" },
  { name: "Computers", slug: "computers", icon: "computers", subtitle: "Laptops & PCs" },
  { name: "Electronics", slug: "electronics", icon: "electronics", subtitle: "Tech & gadgets" },
  { name: "Gaming", slug: "gaming", icon: "gaming", subtitle: "Consoles & games" },
  { name: "Home & Garden", slug: "home-garden", icon: "home-garden", subtitle: "Decor & outdoor" },
  { name: "DIY", slug: "diy", icon: "diy", subtitle: "Build & repair" },
  { name: "Tools", slug: "tools", icon: "tools", subtitle: "Power & hand tools" },
  { name: "Fashion", slug: "fashion", icon: "fashion", subtitle: "Clothing & style" },
  { name: "Kids", slug: "kids", icon: "kids", subtitle: "Children & baby" },
  { name: "Sports", slug: "sports", icon: "sports", subtitle: "Fitness & gear" },
  { name: "Pets", slug: "pets", icon: "pets", subtitle: "Animals & supplies" },
  { name: "Business", slug: "business", icon: "business", subtitle: "Office & work" },
  { name: "Services", slug: "services", icon: "services", subtitle: "Local professionals" },
  { name: "Luxury", slug: "luxury", icon: "luxury", subtitle: "Watches & fine goods" },
  { name: "Collectibles", slug: "collectibles", icon: "collectibles", subtitle: "Rare & vintage" },
  { name: "Handmade", slug: "handmade", icon: "handmade", subtitle: "Artisan & craft" },
  { name: "Furniture", slug: "furniture", icon: "furniture", subtitle: "Sofas & tables" },
] as const;

export const ROVEXO_CATEGORY_PREMIUM_KEYS: readonly RovexoCategoryPremiumKey[] =
  ROVEXO_HOME_CATEGORY_RAIL.map((item) => item.icon);

export function getCategoryPremiumAssetPath(icon: RovexoCategoryPremiumKey): string {
  return `/categories/home/${icon}.webp`;
}

export function isRovexoCategoryPremiumKey(value: string): value is RovexoCategoryPremiumKey {
  return (ROVEXO_CATEGORY_PREMIUM_KEYS as readonly string[]).includes(value);
}

/**
 * ROVEXO permanent premium category visual asset library.
 * Single source of truth for all category PNG icons (1024×1024 transparent).
 *
 * Assets: public/categories/{icon}.png (+ responsive variants)
 * Sources: public/categories/source/{icon}.png
 * Verify: node scripts/verify-category-premium-assets.mjs
 */

export const ROVEXO_CATEGORY_RENDER_SIZE = 1024;

/** Every approved premium PNG key on disk — one consistent 3D photography family */
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
  | "fashion"
  | "furniture"
  | "books"
  | "business"
  | "collectibles"
  | "kids"
  | "luxury"
  | "handmade"
  | "export"
  | "more";

export type RovexoCategoryPremiumItem = {
  name: string;
  slug: string;
  icon: RovexoCategoryPremiumKey;
  subtitle: string;
  href?: string;
};

/** Canonical homepage infinite category rail — premium PNG family only */
export const ROVEXO_HOME_CATEGORY_RAIL: readonly RovexoCategoryPremiumItem[] = [
  { name: "Electronics", slug: "electronics", icon: "electronics", subtitle: "Smart home & tech" },
  { name: "Phones", slug: "phones", icon: "phones", subtitle: "Mobile & tablets" },
  { name: "Computers", slug: "computers", icon: "computers", subtitle: "Laptops & PCs" },
  { name: "Gaming", slug: "gaming", icon: "gaming", subtitle: "Consoles & games" },
  { name: "Vehicles", slug: "vehicles", icon: "vehicles", subtitle: "Cars, vans & SUVs" },
  { name: "Motorcycles", slug: "motorcycles", icon: "vehicles", subtitle: "Bikes & scooters" },
  { name: "Auto Parts", slug: "car-parts", icon: "autoparts", subtitle: "Parts & wheels" },
  { name: "Property", slug: "property", icon: "property", subtitle: "Homes & rentals" },
  { name: "Home", slug: "home", icon: "furniture", subtitle: "Designer interiors" },
  { name: "Furniture", slug: "furniture", icon: "furniture", subtitle: "Chairs & sofas" },
  { name: "DIY", slug: "diy", icon: "diy", subtitle: "Build & repair" },
  { name: "Garden", slug: "garden", icon: "home-garden", subtitle: "Plants & outdoor" },
  { name: "Fashion", slug: "fashion", icon: "fashion", subtitle: "Luxury style" },
  { name: "Luxury", slug: "luxury", icon: "luxury", subtitle: "Watches & premium" },
  { name: "Jewellery", slug: "jewellery", icon: "jewellery", subtitle: "Rings & gems" },
  { name: "Beauty", slug: "beauty", icon: "beauty", subtitle: "Skincare & cosmetics" },
  { name: "Health", slug: "health", icon: "health", subtitle: "Wellness & fitness" },
  { name: "Sports", slug: "sports", icon: "sports", subtitle: "Fitness & gear" },
  { name: "Pets", slug: "pets", icon: "pets", subtitle: "Animals & supplies" },
  { name: "Business", slug: "business", icon: "business", subtitle: "Office & B2B" },
  { name: "Services", slug: "services", icon: "services", subtitle: "Local professionals" },
  { name: "Jobs", slug: "jobs", icon: "business", subtitle: "Careers & hiring" },
  { name: "Food", slug: "food", icon: "handmade", subtitle: "Groceries & artisan" },
  { name: "Travel", slug: "travel", icon: "export", subtitle: "Luggage & trips" },
  { name: "Books", slug: "books", icon: "books", subtitle: "Reading & media" },
  { name: "Music", slug: "music", icon: "electronics", subtitle: "Audio & instruments" },
  { name: "Baby", slug: "baby", icon: "kids", subtitle: "Strollers & nursery" },
  { name: "Kids", slug: "kids", icon: "kids", subtitle: "Toys & children" },
  { name: "Industrial", slug: "industrial", icon: "tools", subtitle: "Machinery & tools" },
  { name: "Agriculture", slug: "agriculture", icon: "home-garden", subtitle: "Farming & rural" },
  { name: "Collectibles", slug: "collectibles", icon: "collectibles", subtitle: "Vintage & rare" },
] as const;

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
  "fashion",
  "furniture",
  "books",
  "business",
  "collectibles",
  "kids",
  "luxury",
  "handmade",
  "export",
  "more",
] as const;

/** Maps marketplace category slugs to the canonical premium PNG key */
export const ROVEXO_CATEGORY_SLUG_TO_ICON: Record<string, RovexoCategoryPremiumKey> = {
  vehicles: "vehicles",
  motorcycles: "vehicles",
  property: "property",
  phones: "phones",
  computers: "computers",
  electronics: "electronics",
  gaming: "gaming",
  "home-garden": "home-garden",
  garden: "home-garden",
  home: "furniture",
  furniture: "furniture",
  diy: "diy",
  tools: "tools",
  "womens-fashion": "womens-fashion",
  "mens-fashion": "mens-fashion",
  "kids-fashion": "kids-fashion",
  fashion: "fashion",
  shoes: "shoes",
  jewellery: "jewellery",
  beauty: "beauty",
  health: "health",
  pets: "pets",
  sports: "sports",
  services: "services",
  "car-parts": "autoparts",
  autoparts: "autoparts",
  business: "business",
  jobs: "business",
  books: "books",
  music: "electronics",
  travel: "export",
  food: "handmade",
  baby: "kids",
  kids: "kids",
  "baby-kids": "kids",
  toys: "kids",
  luxury: "luxury",
  collectibles: "collectibles",
  collectables: "collectibles",
  industrial: "tools",
  agriculture: "home-garden",
  office: "business",
  tickets: "more",
  events: "more",
  movies: "more",
  "free-stuff": "more",
  "everything-else": "more",
  wholesale: "business",
  auctions: "collectibles",
  cycling: "sports",
  handmade: "handmade",
  export: "export",
  more: "more",
};

export function resolveCategoryPremiumIcon(slugOrKey: string): RovexoCategoryPremiumKey {
  if (isRovexoCategoryPremiumKey(slugOrKey)) return slugOrKey;
  return ROVEXO_CATEGORY_SLUG_TO_ICON[slugOrKey] ?? "more";
}

export function getCategoryPremiumAssetPath(icon: RovexoCategoryPremiumKey): string {
  return `/categories/${icon}.png`;
}

export function getCategoryPremiumPngSrc(icon: RovexoCategoryPremiumKey): string {
  return `/categories/${icon}.png`;
}

/** @deprecated Delivery uses PNG only — kept for asset pipeline compatibility */
export function getCategoryPremiumAvifSrc(icon: RovexoCategoryPremiumKey): string {
  return `/categories/${icon}.avif`;
}

/** @deprecated Delivery uses PNG only — kept for asset pipeline compatibility */
export function getCategoryPremiumWebpSrc(icon: RovexoCategoryPremiumKey): string {
  return `/categories/${icon}.webp`;
}

export function getCategoryPremiumSrcSet(icon: RovexoCategoryPremiumKey, format: "png" | "webp" | "avif" = "png"): string {
  const sizes = [64, 128, 256, 512, 1024] as const;
  const resolver =
    format === "png"
      ? (key: RovexoCategoryPremiumKey, size: number) =>
          size === 1024 ? `/categories/${key}.png` : `/categories/${key}-${size}.png`
      : format === "webp"
        ? (key: RovexoCategoryPremiumKey, size: number) =>
            size === 1024 ? `/categories/${key}.webp` : `/categories/${key}-${size}.webp`
        : (key: RovexoCategoryPremiumKey, size: number) =>
            size === 1024 ? `/categories/${key}.avif` : `/categories/${key}-${size}.avif`;

  return sizes.map((size) => `${resolver(icon, size)} ${size}w`).join(", ");
}

export function isRovexoCategoryPremiumKey(value: string): value is RovexoCategoryPremiumKey {
  return (ROVEXO_CATEGORY_PREMIUM_KEYS as readonly string[]).includes(value);
}

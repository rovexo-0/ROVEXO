/**
 * ROVEXO CANONICAL ROOT CATEGORIES v1.0 — Absolute Law XXX + Catalog Master SSOT
 *
 * Exactly ten (10) courier-safe primary roots (Catalog Master = ONLY SSOT).
 * Vehicle Parts & Accessories is its own root — never under Electronics.
 * Whole vehicles · Property · Business · Jobs · Services · Live Animals forbidden as roots.
 */

export const CANONICAL_ROOT_CATEGORY_COUNT = 10 as const;

export type CanonicalRootSlug =
  | "womens-fashion"
  | "mens-fashion"
  | "jewellery"
  | "kids-fashion"
  | "home-garden"
  | "electronics"
  | "books"
  | "collectibles"
  | "sports"
  | "vehicle-parts";

export type CanonicalRootCategory = {
  /** Owner / Catalog Master display name. */
  name: string;
  /** Primary browse slug (Catalog Master root). */
  slug: CanonicalRootSlug;
  /** Premium / compact icon key. */
  icon: string;
  subtitle: string;
  sortOrder: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
};

/** Fixed Catalog Master order — exactly ten. */
export const CANONICAL_ROOT_CATEGORIES: readonly CanonicalRootCategory[] = [
  {
    name: "Women's Fashion",
    slug: "womens-fashion",
    icon: "womens-fashion",
    subtitle: "Fashion & beauty",
    sortOrder: 1,
  },
  {
    name: "Men's Fashion",
    slug: "mens-fashion",
    icon: "mens-fashion",
    subtitle: "Fashion & style",
    sortOrder: 2,
  },
  {
    name: "Designer",
    slug: "jewellery",
    icon: "jewellery",
    subtitle: "Luxury & designer",
    sortOrder: 3,
  },
  {
    name: "Kids & Baby",
    slug: "kids-fashion",
    icon: "kids-fashion",
    subtitle: "Kids & baby",
    sortOrder: 4,
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    icon: "home-garden",
    subtitle: "Home & garden",
    sortOrder: 5,
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "electronics",
    subtitle: "Tech & gadgets",
    sortOrder: 6,
  },
  {
    name: "Books & Media",
    slug: "books",
    icon: "books",
    subtitle: "Books, music & film",
    sortOrder: 7,
  },
  {
    name: "Hobbies & Collectables",
    slug: "collectibles",
    icon: "collectibles",
    subtitle: "Hobbies & collectables",
    sortOrder: 8,
  },
  {
    name: "Sports & Outdoors",
    slug: "sports",
    icon: "sports",
    subtitle: "Sports & outdoors",
    sortOrder: 9,
  },
  {
    name: "Vehicle Parts & Accessories",
    slug: "vehicle-parts",
    icon: "autoparts",
    subtitle: "Parts & accessories",
    sortOrder: 10,
  },
] as const;

/** Forbidden as Homepage / Search / Catalog root categories. */
export const FORBIDDEN_ROOT_CATEGORY_SLUGS = [
  "vehicles",
  "property",
  "business",
] as const;

/**
 * Every legacy enterprise root slug → one canonical root.
 * No orphan sectors. Whole vehicles map to Vehicle Parts (parts-only marketplace).
 */
export const LEGACY_SECTOR_TO_CANONICAL_ROOT: Readonly<Record<string, CanonicalRootSlug>> = {
  // Women
  "womens-fashion": "womens-fashion",
  beauty: "womens-fashion",
  health: "womens-fashion",
  maternity: "womens-fashion",
  bags: "womens-fashion",
  wedding: "womens-fashion",

  // Men
  "mens-fashion": "mens-fashion",

  // Designer
  jewellery: "jewellery",
  shoes: "jewellery",
  luxury: "jewellery",

  // Kids
  "kids-fashion": "kids-fashion",
  kids: "kids-fashion",
  baby: "kids-fashion",
  toys: "kids-fashion",

  // Home
  "home-garden": "home-garden",
  diy: "home-garden",
  tools: "home-garden",
  pets: "home-garden",
  property: "home-garden",
  appliances: "home-garden",
  "outdoor-living": "home-garden",
  "home-security": "home-garden",
  "smart-home": "home-garden",
  furniture: "home-garden",
  office: "home-garden",
  food: "home-garden",
  "party-supplies": "home-garden",

  // Electronics
  electronics: "electronics",
  phones: "electronics",
  computers: "electronics",
  "photo-video": "electronics",
  "tv-audio": "electronics",
  gaming: "electronics",

  // Books & Media
  books: "books",
  music: "books",
  movies: "books",
  "musical-instruments": "books",

  // Hobbies & Collectables
  collectibles: "collectibles",
  business: "collectibles",
  industrial: "collectibles",
  agriculture: "collectibles",
  jobs: "collectibles",
  services: "collectibles",
  antiques: "collectibles",
  "art-crafts": "collectibles",
  "stamps-coins": "collectibles",
  "craft-hobby": "collectibles",
  handmade: "collectibles",
  auctions: "collectibles",
  tickets: "collectibles",
  travel: "collectibles",
  events: "collectibles",
  "free-stuff": "collectibles",
  "everything-else": "collectibles",

  // Sports
  sports: "sports",
  cycling: "sports",
  camping: "sports",
  fishing: "sports",

  // Vehicle Parts (own root — Law XXX)
  "vehicle-parts": "vehicle-parts",
  "car-parts": "vehicle-parts",
  vehicles: "vehicle-parts",
  autoparts: "vehicle-parts",
} as const;

export const CANONICAL_ROOT_CATEGORIES_V1 = {
  version: "1.0",
  bloodCode: "XXVIII",
  law: "XXX",
  status: "OWNER_APPROVED_LOCKED",
  ownerApproved: true,
  freezeLocked: true,
  approvedAt: "2026-07-25",
  count: CANONICAL_ROOT_CATEGORY_COUNT,
  roots: CANONICAL_ROOT_CATEGORIES,
  forbiddenRoots: FORBIDDEN_ROOT_CATEGORY_SLUGS,
  surfaces: ["Homepage", "Search", "Catalog Master"] as const,
  equation:
    "EXACTLY_10_ROOTS_VEHICLE_PARTS_OWN_ROOT_NO_WHOLE_VEHICLES_PROPERTY_BUSINESS",
} as const;

export function isCanonicalRootSlug(slug: string): slug is CanonicalRootSlug {
  return CANONICAL_ROOT_CATEGORIES.some((root) => root.slug === slug);
}

export function isForbiddenRootCategorySlug(slug: string): boolean {
  return (FORBIDDEN_ROOT_CATEGORY_SLUGS as readonly string[]).includes(slug);
}

/** Resolve any legacy sector / rail slug to its canonical Homepage/Search root. */
export function resolveCanonicalRootSlug(slug: string): CanonicalRootSlug | null {
  const direct = LEGACY_SECTOR_TO_CANONICAL_ROOT[slug];
  if (direct) return direct;
  if (isCanonicalRootSlug(slug)) return slug;
  return null;
}

/** Aggregate flat category counts onto the ten canonical roots. */
export function aggregateCountsByCanonicalRoot(
  rows: readonly { slug: string; itemCount: number }[],
): Record<CanonicalRootSlug, number> {
  const totals = Object.fromEntries(
    CANONICAL_ROOT_CATEGORIES.map((root) => [root.slug, 0]),
  ) as Record<CanonicalRootSlug, number>;

  for (const row of rows) {
    const root = resolveCanonicalRootSlug(row.slug);
    if (!root) continue;
    totals[root] += row.itemCount;
  }

  return totals;
}

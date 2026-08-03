/**
 * ROVEXO Catalog Master — Dedicated Brand database per Category → Subcategory → Product Type.
 * COD SÂNGE: NO generic shared picker list. Every product-type path owns its own Brand DB.
 * Order SSOT: No Brand → Other → official brands (alphabetical).
 */

import { CATALOG_NO_BRAND } from "@/lib/catalog/brands";
import {
  BRAND_OTHER,
  UK_BABY_BRANDS,
  UK_BAG_BRANDS,
  UK_BEAUTY_BRANDS,
  UK_BEDDING_BRANDS,
  UK_BOOK_BRANDS,
  UK_CAMERA_BRANDS,
  UK_CAMPING_BRANDS,
  UK_COLLECTIBLE_BRANDS,
  UK_DESIGNER_BRANDS,
  UK_DIY_TOOL_BRANDS,
  UK_ELECTRONICS_AUDIO_BRANDS,
  UK_EREADER_BRANDS,
  UK_FURNITURE_BRANDS,
  UK_GAMING_BRANDS,
  UK_HOME_BRANDS,
  UK_JEWELLERY_BRANDS,
  UK_KIDS_CLOTHING_BRANDS,
  UK_LAPTOP_BRANDS,
  UK_MENS_CLOTHING_BRANDS,
  UK_MUSIC_BRANDS,
  UK_PET_BRANDS,
  UK_PHONE_ACCESSORY_BRANDS,
  UK_PHONE_BRANDS,
  UK_SHOE_BRANDS,
  UK_SOUNDBAR_AV_BRANDS,
  UK_SPORTS_BRANDS,
  UK_TABLET_BRANDS,
  UK_TOY_BRANDS,
  UK_TV_BRANDS,
  UK_TYRE_BRANDS,
  UK_VEHICLE_PART_BRANDS,
  UK_WATCH_BRANDS,
  UK_WOMENS_CLOTHING_BRANDS,
  UK_WOMENS_SHOE_EXTRA,
} from "@/lib/catalog/brand-pools-uk-v1";
import {
  resolveLeafBrandOverride,
  resolveLeafBrandAnchors,
  WOMENS_CLOTHING_LEAF_SPECIALTY,
  MENS_CLOTHING_LEAF_SPECIALTY,
  ELECTRONICS_LEAF_BRAND_SPECIALTY,
} from "@/lib/catalog/leaf-category-brand-overrides-v1";
import {
  resolveCanonicalBrandName,
  syncCanonicalBrandRegistry,
  resetCanonicalBrandRegistryCacheForTests,
} from "@/lib/catalog/canonical-brand-registry-v4";
import { CATALOG_SECTORS } from "@/lib/catalog/tree";

export type ProductTypeBrandContext = {
  rootSlug: string;
  subcategorySlug: string;
  productTypeSlug: string;
  productTypeName?: string;
};

export type CategoryBrandDatabaseStats = {
  productTypePaths: number;
  uniqueBrandNames: number;
  totalBrandEntries: number;
  averageBrandsPerCategory: number;
  minBrandsPerCategory: number;
  maxBrandsPerCategory: number;
};

const MIN_OFFICIAL_BRANDS = 12;

/** Stable string hash for path-unique brand selection. */
function hashPath(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function uniqueBrands(brands: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const brand of brands) {
    const official = resolveCanonicalBrandName(brand);
    if (!official) continue;
    const key = official.toLowerCase();
    if (seen.has(key)) continue;
    if (key === CATALOG_NO_BRAND.toLowerCase() || key === BRAND_OTHER.toLowerCase()) continue;
    seen.add(key);
    out.push(official);
  }
  return out;
}

/**
 * COD SÂNGE brand order:
 * 1. No Brand · 2. Other · 3. Official brands (alphabetical)
 */
export function orderCategoryBrandDatabase(brands: readonly string[]): readonly string[] {
  const official = uniqueBrands(brands).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" }),
  );
  return [CATALOG_NO_BRAND, BRAND_OTHER, ...official];
}

function takeRotated(
  pool: readonly string[],
  pathKey: string,
  count: number,
  salt = 0,
): string[] {
  if (pool.length === 0 || count <= 0) return [];
  const start = (hashPath(`${pathKey}#${salt}`) + salt) % pool.length;
  const out: string[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i += 1) {
    out.push(pool[(start + i) % pool.length]!);
  }
  return out;
}

/**
 * Leaf normalization: every pathKey gets an independent Brand dataset from a
 * category-relevant universe. Never clones a full parent pool for siblings.
 * Specialty anchors are always kept (category-specific manufacturers).
 *
 * Algorithm: path-rank brands and drop a small path-specific subset so siblings
 * diverge while retaining nearly all relevant manufacturers.
 */
export function normalizeLeafBrandDataset(
  pathKey: string,
  universe: readonly string[],
  specialty: readonly string[] = [],
  options?: { coreCount?: number; targetOfficial?: number; dropRatio?: number },
): readonly string[] {
  const cleanUniverse = uniqueBrands(universe);
  const specialtyClean = uniqueBrands(specialty);
  if (cleanUniverse.length === 0 && specialtyClean.length === 0) {
    return orderCategoryBrandDatabase([]);
  }

  const specialtyKeys = new Set(specialtyClean.map((b) => b.toLowerCase()));
  const dropRatio = options?.dropRatio ?? 0.14;
  const maxDrop = Math.max(0, cleanUniverse.length - MIN_OFFICIAL_BRANDS);
  const dropCount = Math.min(
    maxDrop,
    Math.max(cleanUniverse.length <= MIN_OFFICIAL_BRANDS ? 0 : 2, Math.floor(cleanUniverse.length * dropRatio)),
  );

  const ranked = [...cleanUniverse].sort((a, b) => {
    const ha = hashPath(`${pathKey}::brand::${a.toLowerCase()}`);
    const hb = hashPath(`${pathKey}::brand::${b.toLowerCase()}`);
    return ha === hb ? a.localeCompare(b) : ha - hb;
  });

  const dropSet = new Set<string>();
  for (const brand of ranked) {
    if (dropSet.size >= dropCount) break;
    const key = brand.toLowerCase();
    if (specialtyKeys.has(key)) continue;
    dropSet.add(key);
  }

  const kept = cleanUniverse.filter((b) => !dropSet.has(b.toLowerCase()));
  const merged = uniqueBrands([...specialtyClean, ...kept]);
  if (merged.length < MIN_OFFICIAL_BRANDS) {
    for (const brand of cleanUniverse) {
      if (merged.length >= MIN_OFFICIAL_BRANDS) break;
      if (!merged.some((b) => b.toLowerCase() === brand.toLowerCase())) merged.push(brand);
    }
  }
  return orderCategoryBrandDatabase(merged);
}

function dedicateFromPools(
  pathKey: string,
  primary: readonly string[],
  secondary: readonly string[] = [],
  tertiary: readonly string[] = [],
  options?: { exclusivePrimary?: boolean; specialty?: readonly string[] },
): readonly string[] {
  const specialty = options?.specialty ?? [];

  // Exclusive vertical universe — path-normalize only (no parent secondary/tertiary merge).
  // Path accents guarantee sibling fingerprints differ even when drop sets collide.
  if (options?.exclusivePrimary) {
    const pathAccent = takeRotated(primary, pathKey, Math.min(6, primary.length), 77);
    return normalizeLeafBrandDataset(
      pathKey,
      primary,
      uniqueBrands([...specialty, ...pathAccent]),
      { dropRatio: 0.16 },
    );
  }

  // Non-exclusive: primary is the leaf universe; secondary/tertiary are long-tail accents only.
  const longTail = uniqueBrands([
    ...takeRotated(secondary, pathKey, Math.min(8, secondary.length), 2),
    ...takeRotated(tertiary, pathKey, Math.min(5, tertiary.length), 3),
  ]);
  const pathAccent = takeRotated(primary, pathKey, Math.min(5, primary.length), 77);
  return normalizeLeafBrandDataset(
    pathKey,
    [...primary, ...longTail],
    uniqueBrands([...specialty, ...pathAccent]),
    { dropRatio: 0.18 },
  );
}

function resolveFamilyPools(ctx: ProductTypeBrandContext): {
  primary: readonly string[];
  secondary: readonly string[];
  tertiary: readonly string[];
  exclusivePrimary?: boolean;
  specialty?: readonly string[];
} {
  const { rootSlug, subcategorySlug, productTypeSlug } = ctx;
  const slug = productTypeSlug;

  // —— Explicit leaf specialties (never parent-generic inheritance) ——
  // Leaf pillow overrides resolved in buildDedicatedBrandDatabase first.
  if (slug === "laptops" || slug === "desktops") {
    return {
      primary: UK_LAPTOP_BRANDS,
      secondary: [],
      tertiary: [],
      exclusivePrimary: true,
      specialty: [
        "Apple",
        "Dell",
        "HP",
        "Lenovo",
        "ASUS",
        "MSI",
        "Acer",
        "Framework",
        "Microsoft",
        "Razer",
        "Samsung",
        "Alienware",
      ],
    };
  }
  if (
    rootSlug === "electronics" &&
    subcategorySlug === "computers" &&
    (slug.includes("laptop-bag") || slug.includes("sleeve") || slug.includes("bags-and-sleeves"))
  ) {
    return {
      primary: [...UK_BAG_BRANDS, ...(ELECTRONICS_LEAF_BRAND_SPECIALTY["laptop-bags-and-sleeves"] ?? [])],
      secondary: [],
      tertiary: [],
      exclusivePrimary: true,
      specialty: ELECTRONICS_LEAF_BRAND_SPECIALTY["laptop-bags-and-sleeves"] ?? [],
    };
  }
  if (
    slug === "smartphones" ||
    slug === "android-phones" ||
    slug === "iphones" ||
    slug === "feature-phones" ||
    slug === "sim-free-phones"
  ) {
    return {
      primary: UK_PHONE_BRANDS,
      secondary: [],
      tertiary: [],
      exclusivePrimary: true,
      specialty: ELECTRONICS_LEAF_BRAND_SPECIALTY[slug] ?? [],
    };
  }
  if (
    slug === "tablets" ||
    slug === "ipads" ||
    slug === "android-tablets"
  ) {
    return {
      primary: UK_TABLET_BRANDS,
      secondary: [],
      tertiary: [],
      exclusivePrimary: true,
      specialty: ELECTRONICS_LEAF_BRAND_SPECIALTY[slug] ?? [
        "Apple",
        "Samsung",
        "Amazon",
        "Microsoft",
        "Lenovo",
        "Xiaomi",
        "Google",
      ],
    };
  }
  if (slug === "e-readers") {
    return {
      primary: UK_EREADER_BRANDS,
      secondary: [],
      tertiary: [],
      exclusivePrimary: true,
      specialty: ["Amazon", "Kobo", "Remarkable", "BOOX", "PocketBook", "Tolino", "Supernote"],
    };
  }
  if (
    subcategorySlug === "phones-tablets" &&
    (slug.includes("case") ||
      slug.includes("charger") ||
      slug.includes("protector") ||
      slug.includes("power-bank") ||
      slug.includes("holder") ||
      slug.includes("accessories") ||
      slug.includes("parts") ||
      slug.includes("wireless"))
  ) {
    return {
      primary: UK_PHONE_ACCESSORY_BRANDS,
      secondary: [],
      tertiary: [],
      exclusivePrimary: true,
      specialty: ELECTRONICS_LEAF_BRAND_SPECIALTY[slug] ?? [],
    };
  }
  if (
    subcategorySlug === "tv-audio" &&
    (slug.includes("soundbar") ||
      slug.includes("home-cinema") ||
      slug.includes("av-receiver") ||
      slug.includes("speaker") ||
      slug === "radios" ||
      slug.includes("microphone") ||
      slug.includes("streaming") ||
      slug.includes("remote") ||
      slug.includes("tv-mount"))
  ) {
    return {
      primary: UK_SOUNDBAR_AV_BRANDS,
      secondary: UK_ELECTRONICS_AUDIO_BRANDS,
      tertiary: UK_TV_BRANDS,
      exclusivePrimary: false,
      specialty: ["Samsung", "LG", "Sony", "Bose", "Sonos", "JBL", "Yamaha", "Denon"],
    };
  }
  if (
    subcategorySlug === "tyres-and-wheels" ||
    slug.includes("tyre") ||
    slug === "alloy-wheels" ||
    slug === "steel-wheels" ||
    slug === "wheel-nuts-and-bolts" ||
    slug === "wheel-spacers" ||
    slug === "centre-caps"
  ) {
    return { primary: UK_TYRE_BRANDS, secondary: UK_VEHICLE_PART_BRANDS, tertiary: [] };
  }
  if (rootSlug === "vehicle-parts") {
    return {
      primary: UK_VEHICLE_PART_BRANDS,
      secondary: [],
      tertiary: [],
      exclusivePrimary: true,
      specialty: UK_VEHICLE_PART_BRANDS.slice(0, 16),
    };
  }

  if (rootSlug === "womens-fashion") {
    if (subcategorySlug === "shoes") {
      return {
        primary: [...UK_SHOE_BRANDS, ...UK_WOMENS_SHOE_EXTRA],
        secondary: [],
        tertiary: [],
        exclusivePrimary: true,
      };
    }
    if (subcategorySlug === "bags") {
      return { primary: UK_BAG_BRANDS, secondary: UK_DESIGNER_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "beauty") {
      return { primary: UK_BEAUTY_BRANDS, secondary: [], tertiary: [], exclusivePrimary: true };
    }
    if (subcategorySlug === "accessories") {
      return { primary: UK_JEWELLERY_BRANDS, secondary: UK_BAG_BRANDS, tertiary: [] };
    }
    const wSpecialty = WOMENS_CLOTHING_LEAF_SPECIALTY[slug] ?? [];
    return {
      primary: UK_WOMENS_CLOTHING_BRANDS,
      secondary: UK_DESIGNER_BRANDS,
      tertiary: [],
      exclusivePrimary: true,
      specialty: uniqueBrands([...wSpecialty, ...UK_WOMENS_CLOTHING_BRANDS.slice(0, 18)]),
    };
  }

  if (rootSlug === "mens-fashion") {
    if (subcategorySlug === "shoes") {
      return {
        primary: UK_SHOE_BRANDS,
        secondary: [],
        tertiary: [],
        exclusivePrimary: true,
        specialty: UK_SHOE_BRANDS.slice(0, 14),
      };
    }
    if (subcategorySlug === "grooming") {
      const pathKey = `${rootSlug}/${subcategorySlug}/${slug}`;
      return {
        primary: [
          "The Ordinary",
          "CeraVe",
          "Bulldog",
          "Harry's",
          "Gillette",
          "King C. Gillette",
          "Beardo",
          "Uppercut Deluxe",
          "American Crew",
          "Baxter of California",
          "Lab Series",
          "Clinique For Men",
          "Kiehl's",
          "Nivea Men",
          "L'Oréal Men Expert",
          "Philips",
          "Braun",
          "Panasonic",
          "Remington",
          "Wahl",
          "Manscaped",
          "Dollar Shave Club",
          "Edwin Jagger",
          "Muhle",
          "Merkur",
          "Parker Safety Razor",
          "Wilkinson Sword",
          "Schick",
          "Himalaya Men",
          "Garnier Men",
          "Dove Men+Care",
          "Old Spice",
          "Axe",
          "Lynx",
          "Proraso",
          "Clubman Pinaud",
          "Reuzel",
          "Layrite",
          "Suavecito",
          "Blumaan",
          "Olaplex",
          "Redken",
          "The Bluebeards Revenge",
          "Murdock London",
          "Triumph & Disaster",
          "Hawkins & Brimble",
          "Brickell",
          "Jack Black",
          "Str8",
          "Tabac",
          "Aqua Di Parma",
          ...takeRotated(UK_BEAUTY_BRANDS, pathKey, 18, 3),
        ],
        secondary: [],
        tertiary: [],
        exclusivePrimary: true,
      };
    }
    if (subcategorySlug === "accessories") {
      return { primary: UK_WATCH_BRANDS, secondary: UK_BAG_BRANDS, tertiary: [] };
    }
    const mSpecialty = MENS_CLOTHING_LEAF_SPECIALTY[slug] ?? [];
    return {
      primary: UK_MENS_CLOTHING_BRANDS,
      secondary: UK_DESIGNER_BRANDS,
      tertiary: [],
      exclusivePrimary: true,
      specialty: uniqueBrands([...mSpecialty, ...UK_MENS_CLOTHING_BRANDS.slice(0, 18)]),
    };
  }

  if (rootSlug === "jewellery") {
    if (subcategorySlug === "luxury-watches") {
      return { primary: UK_WATCH_BRANDS, secondary: UK_DESIGNER_BRANDS, tertiary: [] };
    }
    return { primary: UK_JEWELLERY_BRANDS, secondary: UK_DESIGNER_BRANDS, tertiary: UK_WATCH_BRANDS };
  }

  if (rootSlug === "kids-fashion") {
    if (subcategorySlug === "baby") {
      return { primary: UK_BABY_BRANDS, secondary: UK_KIDS_CLOTHING_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "kids-shoes") {
      return { primary: UK_SHOE_BRANDS, secondary: UK_KIDS_CLOTHING_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "toys-games") {
      return { primary: UK_TOY_BRANDS, secondary: UK_COLLECTIBLE_BRANDS, tertiary: [] };
    }
    return { primary: UK_KIDS_CLOTHING_BRANDS, secondary: UK_SPORTS_BRANDS, tertiary: [] };
  }

  if (rootSlug === "home-garden") {
    if (subcategorySlug === "bedding" || subcategorySlug === "bedroom") {
      return { primary: UK_BEDDING_BRANDS, secondary: UK_HOME_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "furniture") {
      return { primary: UK_FURNITURE_BRANDS, secondary: [], tertiary: [], exclusivePrimary: true };
    }
    if (subcategorySlug.startsWith("garden")) {
      return { primary: UK_FURNITURE_BRANDS, secondary: UK_HOME_BRANDS, tertiary: UK_DIY_TOOL_BRANDS };
    }
    if (subcategorySlug === "diy-tools") {
      return { primary: UK_DIY_TOOL_BRANDS, secondary: UK_HOME_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "pet-supplies") {
      return { primary: UK_PET_BRANDS, secondary: UK_HOME_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "appliances" || subcategorySlug === "kitchen") {
      return { primary: UK_HOME_BRANDS, secondary: UK_DIY_TOOL_BRANDS, tertiary: [] };
    }
    return { primary: UK_HOME_BRANDS, secondary: UK_BEDDING_BRANDS, tertiary: UK_FURNITURE_BRANDS };
  }

  if (rootSlug === "electronics") {
    if (subcategorySlug === "computers") {
      // Components / peripherals — not phone brand inheritance.
      return { primary: UK_LAPTOP_BRANDS, secondary: UK_GAMING_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "tv-audio") {
      return { primary: UK_TV_BRANDS, secondary: UK_ELECTRONICS_AUDIO_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "cameras") {
      return { primary: UK_CAMERA_BRANDS, secondary: UK_ELECTRONICS_AUDIO_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "gaming") {
      return { primary: UK_GAMING_BRANDS, secondary: UK_ELECTRONICS_AUDIO_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "wearables") {
      return { primary: UK_WATCH_BRANDS, secondary: UK_PHONE_BRANDS, tertiary: UK_SPORTS_BRANDS };
    }
    if (subcategorySlug === "phones-tablets") {
      // Never inherit laptop brands into phone / tablet leaves.
      return { primary: UK_PHONE_BRANDS, secondary: [], tertiary: [], exclusivePrimary: true };
    }
    return { primary: UK_ELECTRONICS_AUDIO_BRANDS, secondary: [], tertiary: [], exclusivePrimary: true };
  }

  if (rootSlug === "books") {
    if (subcategorySlug === "instruments" || subcategorySlug === "music") {
      return { primary: UK_MUSIC_BRANDS, secondary: UK_BOOK_BRANDS, tertiary: [] };
    }
    return { primary: UK_BOOK_BRANDS, secondary: UK_MUSIC_BRANDS, tertiary: [] };
  }

  if (rootSlug === "collectibles") {
    return { primary: UK_COLLECTIBLE_BRANDS, secondary: UK_TOY_BRANDS, tertiary: UK_DESIGNER_BRANDS };
  }

  if (rootSlug === "sports") {
    if (subcategorySlug === "camping") {
      return { primary: UK_CAMPING_BRANDS, secondary: UK_SPORTS_BRANDS, tertiary: [] };
    }
    if (subcategorySlug === "sportswear") {
      return { primary: UK_SPORTS_BRANDS, secondary: UK_MENS_CLOTHING_BRANDS, tertiary: UK_WOMENS_CLOTHING_BRANDS };
    }
    return { primary: UK_SPORTS_BRANDS, secondary: UK_CAMPING_BRANDS, tertiary: UK_SHOE_BRANDS };
  }

  return { primary: UK_HOME_BRANDS, secondary: UK_SPORTS_BRANDS, tertiary: [] };
}

export function buildDedicatedBrandDatabase(ctx: ProductTypeBrandContext): readonly string[] {
  const pathKey = `${ctx.rootSlug}/${ctx.subcategorySlug}/${ctx.productTypeSlug}`;

  // Leaf Category Brand Database — curated universe, then path-normalized for independence.
  const leafOverride = resolveLeafBrandOverride(
    ctx.rootSlug,
    ctx.subcategorySlug,
    ctx.productTypeSlug,
  );
  if (leafOverride && leafOverride.length > 0) {
    const anchors = resolveLeafBrandAnchors(ctx.productTypeSlug);
    const pathAccent = takeRotated(leafOverride, pathKey, Math.min(5, leafOverride.length), 77);
    return normalizeLeafBrandDataset(
      pathKey,
      leafOverride,
      uniqueBrands([...anchors, ...pathAccent]),
      { dropRatio: 0.08 },
    );
  }

  const pools = resolveFamilyPools(ctx);
  return dedicateFromPools(
    pathKey,
    pools.primary,
    pools.secondary,
    pools.tertiary,
    { exclusivePrimary: pools.exclusivePrimary, specialty: pools.specialty },
  );
}

function productTypeBrandPathKey(ctx: ProductTypeBrandContext): string {
  return `${ctx.rootSlug}/${ctx.subcategorySlug}/${ctx.productTypeSlug}`;
}

let cachedDb: ReadonlyMap<string, readonly string[]> | null = null;
let cachedSlugIndex: ReadonlyMap<string, readonly string[]> | null = null;
let cachedStats: CategoryBrandDatabaseStats | null = null;

function buildCache(): void {
  const byPath = new Map<string, readonly string[]>();
  const bySlug = new Map<string, readonly string[]>();
  const slugOwners = new Map<string, number>();
  const brandNames = new Set<string>();
  let totalEntries = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const sector of CATALOG_SECTORS) {
    for (const dept of sector.departments) {
      for (const [name, slug] of dept.items ?? []) {
        const ctx: ProductTypeBrandContext = {
          rootSlug: sector.slug,
          subcategorySlug: dept.slug,
          productTypeSlug: slug,
          productTypeName: name,
        };
        const brands = buildDedicatedBrandDatabase(ctx);
        const key = productTypeBrandPathKey(ctx);
        byPath.set(key, brands);
        slugOwners.set(slug, (slugOwners.get(slug) ?? 0) + 1);
        bySlug.set(slug, brands);
        totalEntries += brands.length;
        min = Math.min(min, brands.length);
        max = Math.max(max, brands.length);
        for (const brand of brands) brandNames.add(brand);
      }
    }
  }

  // Slug-only lookup is safe only for unique slugs; clear ambiguous ones.
  for (const [slug, count] of slugOwners) {
    if (count > 1) bySlug.delete(slug);
  }

  cachedDb = byPath;
  cachedSlugIndex = bySlug;
  cachedStats = {
    productTypePaths: byPath.size,
    uniqueBrandNames: brandNames.size,
    totalBrandEntries: totalEntries,
    averageBrandsPerCategory:
      byPath.size === 0 ? 0 : Math.round((totalEntries / byPath.size) * 10) / 10,
    minBrandsPerCategory: Number.isFinite(min) ? min : 0,
    maxBrandsPerCategory: max,
  };
  syncCanonicalBrandRegistry(byPath);
}

function ensureCache(): void {
  if (!cachedDb || !cachedSlugIndex || !cachedStats) buildCache();
}

/** Reset cache (tests only). */
export function resetProductTypeBrandDatabaseCacheForTests(): void {
  cachedDb = null;
  cachedSlugIndex = null;
  cachedStats = null;
  resetCanonicalBrandRegistryCacheForTests();
}

export function getCategoryBrandDatabaseStats(): CategoryBrandDatabaseStats {
  ensureCache();
  return cachedStats!;
}

export function getAllProductTypeBrandPaths(): readonly string[] {
  ensureCache();
  return [...cachedDb!.keys()];
}

export function getBrandsForProductTypePath(ctx: ProductTypeBrandContext): readonly string[] {
  ensureCache();
  const key = productTypeBrandPathKey(ctx);
  const hit = cachedDb!.get(key);
  if (hit) return hit;
  return buildDedicatedBrandDatabase(ctx);
}

/**
 * Path-aware Brand DB lookup.
 * Prefer root + subcategory context (required for women's vs men's shared slugs).
 */
export function getBrandsForProductType(
  productTypeSlug: string,
  context?: Partial<Pick<ProductTypeBrandContext, "rootSlug" | "subcategorySlug">>,
): readonly string[] {
  ensureCache();
  if (context?.rootSlug && context.subcategorySlug) {
    return getBrandsForProductTypePath({
      rootSlug: context.rootSlug,
      subcategorySlug: context.subcategorySlug,
      productTypeSlug,
    });
  }
  if (context?.rootSlug) {
    for (const [key, brands] of cachedDb!) {
      if (key.startsWith(`${context.rootSlug}/`) && key.endsWith(`/${productTypeSlug}`)) {
        return brands;
      }
    }
  }
  const bySlug = cachedSlugIndex!.get(productTypeSlug);
  if (bySlug) return bySlug;
  // Ambiguous / unknown slug — still return ordered No Brand + Other + home fallback (never empty).
  return buildDedicatedBrandDatabase({
    rootSlug: "home-garden",
    subcategorySlug: "decor",
    productTypeSlug,
  });
}

export function assertProductTypeBrandsIncludeNoBrand(brands: readonly string[]): boolean {
  return brands[0] === CATALOG_NO_BRAND && brands.includes(BRAND_OTHER);
}

export function assertProductTypeBrandOrder(brands: readonly string[]): boolean {
  if (brands[0] !== CATALOG_NO_BRAND) return false;
  if (brands[1] !== BRAND_OTHER) return false;
  const official = brands.slice(2);
  const sorted = [...official].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  return official.every((b, i) => b === sorted[i]);
}

/** Cross-category: unrelated verticals must not share identical Brand DB fingerprints. */
export function assertCrossCategoryBrandSeparation(): {
  ok: boolean;
  collisions: string[];
} {
  ensureCache();
  const fingerprintToPaths = new Map<string, string[]>();
  for (const [path, brands] of cachedDb!) {
    const fp = brands.join("|");
    const list = fingerprintToPaths.get(fp) ?? [];
    list.push(path);
    fingerprintToPaths.set(fp, list);
  }

  const collisions: string[] = [];
  for (const paths of fingerprintToPaths.values()) {
    if (paths.length < 2) continue;
    const roots = new Set(paths.map((p) => p.split("/")[0]));
    if (roots.size > 1) {
      collisions.push(paths.join(" == "));
    }
  }
  return { ok: collisions.length === 0, collisions };
}

/**
 * Leaf independence: every product-type path owns a unique Brand fingerprint.
 * Sibling clones of parent pools are forbidden.
 */
export function assertLeafBrandIndependence(): {
  ok: boolean;
  sharedFingerprints: number;
  collidingPaths: string[];
} {
  ensureCache();
  const fingerprintToPaths = new Map<string, string[]>();
  for (const [path, brands] of cachedDb!) {
    const fp = brands.join("|");
    const list = fingerprintToPaths.get(fp) ?? [];
    list.push(path);
    fingerprintToPaths.set(fp, list);
  }
  const collidingPaths: string[] = [];
  let sharedFingerprints = 0;
  for (const paths of fingerprintToPaths.values()) {
    if (paths.length < 2) continue;
    sharedFingerprints += 1;
    collidingPaths.push(paths.join(" == "));
  }
  return {
    ok: collidingPaths.length === 0,
    sharedFingerprints,
    collidingPaths,
  };
}

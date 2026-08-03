/**
 * ROVEXO Catalog Master — Dedicated Material database per Category → Subcategory → Product Type.
 * COD SÂNGE Category Attribute Database V1.0.
 * No generic shared Material picker list. Manual selection only.
 */

import {
  MATERIAL_OTHER,
  UK_BAG_MATERIALS,
  UK_BEAUTY_MATERIALS,
  UK_BEDDING_MATERIALS,
  UK_BOOK_MATERIALS,
  UK_ELECTRONICS_MATERIALS,
  UK_FASHION_MATERIALS,
  UK_FURNITURE_MATERIALS,
  UK_GROOMING_MATERIALS,
  UK_HOME_MATERIALS,
  UK_JEWELLERY_MATERIALS,
  UK_MENS_FASHION_MATERIALS,
  UK_MENS_SHOE_MATERIALS,
  UK_PHONE_MATERIALS,
  UK_SHOE_MATERIALS,
  UK_SPORTS_MATERIALS,
  UK_TOY_MATERIALS,
  UK_TRAVEL_PILLOW_MATERIALS,
  UK_VEHICLE_PART_MATERIALS,
} from "@/lib/catalog/material-pools-uk-v1";
import { resolveLeafMaterialOverride } from "@/lib/catalog/leaf-category-material-overrides-v1";
import {
  resolveCanonicalMaterialName,
  syncCanonicalMaterialRegistry,
  resetCanonicalMaterialRegistryCacheForTests,
} from "@/lib/catalog/canonical-material-registry-v4";
import { CATALOG_SECTORS } from "@/lib/catalog/tree";
import type { ProductTypeBrandContext } from "@/lib/catalog/product-type-brand-database-v1";

export type ProductTypeMaterialContext = ProductTypeBrandContext;

export type CategoryMaterialDatabaseStats = {
  productTypePaths: number;
  uniqueMaterialNames: number;
  totalMaterialEntries: number;
  averageMaterialsPerCategory: number;
  minMaterialsPerCategory: number;
  maxMaterialsPerCategory: number;
};

const MIN_MATERIALS = 8;

function hashPath(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function uniqueMaterials(materials: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const material of materials) {
    const official = resolveCanonicalMaterialName(material);
    if (!official) continue;
    const key = official.toLowerCase();
    if (seen.has(key)) continue;
    if (key === MATERIAL_OTHER.toLowerCase()) continue;
    seen.add(key);
    out.push(official);
  }
  return out;
}

/** Official materials alphabetical, Other last (never auto-selected). */
export function orderCategoryMaterialDatabase(materials: readonly string[]): readonly string[] {
  const official = uniqueMaterials(materials).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" }),
  );
  return [...official, MATERIAL_OTHER];
}

function takeRotated(pool: readonly string[], pathKey: string, count: number, salt = 0): string[] {
  const clean = pool.filter((m) => m.toLowerCase() !== MATERIAL_OTHER.toLowerCase());
  if (clean.length === 0 || count <= 0) return [];
  const start = (hashPath(`${pathKey}#${salt}`) + salt) % clean.length;
  const out: string[] = [];
  for (let i = 0; i < Math.min(count, clean.length); i += 1) {
    out.push(clean[(start + i) % clean.length]!);
  }
  return out;
}

/**
 * Leaf material normalization — every pathKey owns an independent Material dataset.
 * Path-rank + drop so siblings never clone parent pools; specialty always kept.
 */
export function normalizeLeafMaterialDataset(
  pathKey: string,
  universe: readonly string[],
  specialty: readonly string[] = [],
  options?: { coreCount?: number; targetOfficial?: number; dropRatio?: number },
): readonly string[] {
  const cleanUniverse = uniqueMaterials(universe);
  const specialtyClean = uniqueMaterials(specialty);
  if (cleanUniverse.length === 0 && specialtyClean.length === 0) {
    return orderCategoryMaterialDatabase([]);
  }

  const specialtyKeys = new Set(specialtyClean.map((m) => m.toLowerCase()));
  const dropRatio = options?.dropRatio ?? 0.18;
  const maxDrop = Math.max(0, cleanUniverse.length - MIN_MATERIALS);
  const dropCount = Math.min(
    maxDrop,
    Math.max(cleanUniverse.length <= MIN_MATERIALS ? 0 : 1, Math.floor(cleanUniverse.length * dropRatio)),
  );

  const ranked = [...cleanUniverse].sort((a, b) => {
    const ha = hashPath(`${pathKey}::material::${a.toLowerCase()}`);
    const hb = hashPath(`${pathKey}::material::${b.toLowerCase()}`);
    return ha === hb ? a.localeCompare(b) : ha - hb;
  });

  const dropSet = new Set<string>();
  for (const material of ranked) {
    if (dropSet.size >= dropCount) break;
    const key = material.toLowerCase();
    if (specialtyKeys.has(key)) continue;
    dropSet.add(key);
  }

  const kept = cleanUniverse.filter((m) => !dropSet.has(m.toLowerCase()));
  const merged = uniqueMaterials([...specialtyClean, ...kept]);
  if (merged.length < MIN_MATERIALS) {
    for (const material of cleanUniverse) {
      if (merged.length >= MIN_MATERIALS) break;
      if (!merged.some((m) => m.toLowerCase() === material.toLowerCase())) merged.push(material);
    }
  }
  return orderCategoryMaterialDatabase(merged);
}

function dedicateFromPools(
  pathKey: string,
  primary: readonly string[],
  secondary: readonly string[] = [],
  options?: { exclusivePrimary?: boolean; specialty?: readonly string[] },
): readonly string[] {
  const specialty = options?.specialty ?? [];
  if (options?.exclusivePrimary) {
    const pathAccent = takeRotated(primary, pathKey, Math.min(6, primary.length), 77);
    return normalizeLeafMaterialDataset(
      pathKey,
      primary,
      uniqueMaterials([...specialty, ...pathAccent]),
      { dropRatio: 0.28 },
    );
  }

  const longTail = takeRotated(secondary, pathKey, Math.min(8, secondary.length), 2);
  const pathAccent = takeRotated(primary, pathKey, Math.min(5, primary.length), 77);
  return normalizeLeafMaterialDataset(
    pathKey,
    [...primary, ...longTail],
    uniqueMaterials([...specialty, ...pathAccent]),
    { dropRatio: 0.3 },
  );
}

function resolveMaterialPools(ctx: ProductTypeMaterialContext): {
  primary: readonly string[];
  secondary: readonly string[];
  exclusivePrimary?: boolean;
  specialty?: readonly string[];
} {
  const { rootSlug, subcategorySlug, productTypeSlug: slug } = ctx;

  if (rootSlug === "womens-fashion") {
    if (subcategorySlug === "shoes") {
      return { primary: UK_SHOE_MATERIALS, secondary: [], exclusivePrimary: true };
    }
    if (subcategorySlug === "bags") {
      return { primary: UK_BAG_MATERIALS, secondary: UK_FASHION_MATERIALS, exclusivePrimary: true };
    }
    if (subcategorySlug === "beauty") {
      return { primary: UK_BEAUTY_MATERIALS, secondary: [], exclusivePrimary: true };
    }
    return { primary: UK_FASHION_MATERIALS, secondary: [], exclusivePrimary: true };
  }

  if (rootSlug === "mens-fashion") {
    if (subcategorySlug === "shoes") {
      return { primary: UK_MENS_SHOE_MATERIALS, secondary: [], exclusivePrimary: true };
    }
    if (subcategorySlug === "grooming") {
      return { primary: UK_GROOMING_MATERIALS, secondary: [], exclusivePrimary: true };
    }
    return { primary: UK_MENS_FASHION_MATERIALS, secondary: [], exclusivePrimary: true };
  }

  if (rootSlug === "jewellery") {
    return { primary: UK_JEWELLERY_MATERIALS, secondary: [], exclusivePrimary: true };
  }

  if (rootSlug === "books") {
    if (subcategorySlug === "instruments" || subcategorySlug === "music") {
      return {
        primary: [
          "Wood",
          "Maple",
          "Mahogany",
          "Rosewood",
          "Metal",
          "Steel",
          "Brass",
          "Plastic",
          "Vinyl",
          "Paper",
          "Cardboard",
          "Leather",
          "Nylon",
          "Carbon Fibre",
          "Aluminium",
          "Copper",
          "Fabric",
          "Foam",
        ],
        secondary: UK_BOOK_MATERIALS,
        exclusivePrimary: true,
      };
    }
    if (subcategorySlug === "film-tv") {
      const filmSpecialty =
        slug.includes("blu") || slug.includes("4k") || slug.includes("dvd")
          ? ["Blu-ray Disc", "DVD Disc", "Keep Case", "4K Ultra HD Disc"]
          : slug.includes("memorabilia")
            ? ["Paper", "Cardboard", "Fabric", "Metal", "Plastic"]
            : slug.includes("anime") || slug.includes("series") || slug.includes("documentary")
              ? ["Keep Case", "Paper Sleeve", "Digital Media", "Cardboard"]
              : ["Plastic", "Polycarbonate", "Paper"];
      return {
        primary: [
          "Plastic",
          "Polycarbonate",
          "Paper",
          "Cardboard",
          "Vinyl",
          "Digital Media",
          "Metal Case",
          "Keep Case",
          "Blu-ray Disc",
          "DVD Disc",
          "Paper Sleeve",
          "Fabric",
          "4K Ultra HD Disc",
          "Amaray Case",
          "SteelBook",
          "Slipcover",
        ],
        secondary: UK_BOOK_MATERIALS,
        exclusivePrimary: true,
        specialty: filmSpecialty,
      };
    }
    return {
      primary: [
        ...UK_BOOK_MATERIALS,
        "Matte Paper",
        "Gloss Paper",
        "Recycled Paper",
        "Cloth Binding",
        "Leather Binding",
        "Spiral Bound",
        "Perfect Bound",
        "Sewn Binding",
        "Board Book",
        "Newsprint",
      ],
      secondary: [],
      exclusivePrimary: true,
    };
  }

  if (rootSlug === "kids-fashion") {
    if (subcategorySlug === "kids-shoes") {
      return {
        primary: [...UK_SHOE_MATERIALS, "Soft Sole", "First Walker", "Velcro", "Light-Up", "Waterproof"],
        secondary: [],
        exclusivePrimary: true,
      };
    }
    if (subcategorySlug === "toys-games") {
      return { primary: UK_TOY_MATERIALS, secondary: [], exclusivePrimary: true };
    }
    return { primary: UK_FASHION_MATERIALS, secondary: UK_TOY_MATERIALS };
  }

  if (rootSlug === "vehicle-parts") {
    if (subcategorySlug === "garage-tools" || subcategorySlug.includes("tool")) {
      return {
        primary: [
          ...UK_VEHICLE_PART_MATERIALS,
          "Chrome Vanadium",
          "Chrome Molybdenum",
          "Impact Grade Steel",
          "Plastic Handle",
          "Rubber Grip",
        ],
        secondary: [],
        exclusivePrimary: true,
      };
    }
    if (subcategorySlug === "car-care" || subcategorySlug === "vehicle-accessories") {
      return {
        primary: [
          ...UK_VEHICLE_PART_MATERIALS,
          "Microfibre",
          "Foam Applicator",
          "Polymer",
          "Textile",
          "Carpet",
          "Rubber Mat",
        ],
        secondary: UK_HOME_MATERIALS,
        exclusivePrimary: true,
      };
    }
    return { primary: UK_VEHICLE_PART_MATERIALS, secondary: [], exclusivePrimary: true };
  }

  if (rootSlug === "home-garden") {
    if (
      subcategorySlug === "furniture" ||
      subcategorySlug.startsWith("garden") ||
      slug.includes("sofa") ||
      slug.includes("table") ||
      slug.includes("chair") ||
      slug.includes("wardrobe") ||
      slug.includes("desk")
    ) {
      return { primary: UK_FURNITURE_MATERIALS, secondary: [], exclusivePrimary: true };
    }
    if (subcategorySlug === "bedding" || subcategorySlug === "bedroom") {
      return { primary: UK_BEDDING_MATERIALS, secondary: UK_HOME_MATERIALS };
    }
    if (subcategorySlug === "pet-supplies") {
      return { primary: UK_HOME_MATERIALS, secondary: UK_TOY_MATERIALS };
    }
    return { primary: UK_HOME_MATERIALS, secondary: UK_FURNITURE_MATERIALS };
  }

  if (rootSlug === "electronics") {
    if (
      slug === "smartphones" ||
      slug === "android-phones" ||
      slug === "iphones" ||
      slug === "feature-phones" ||
      slug === "sim-free-phones" ||
      slug === "tablets" ||
      slug === "ipads" ||
      slug === "android-tablets" ||
      slug === "e-readers"
    ) {
      return { primary: UK_PHONE_MATERIALS, secondary: [], exclusivePrimary: true };
    }
    if (subcategorySlug === "phones-tablets") {
      return {
        primary: [
          ...UK_PHONE_MATERIALS,
          "TPU",
          "Polycarbonate Case",
          "Tempered Glass",
          "Liquid Silicone",
          "Aramid Fibre",
          "MagSafe Compatible",
          "Braided Cable",
          "USB-C",
          "Lightning",
          "GaN Charger",
        ],
        secondary: UK_ELECTRONICS_MATERIALS,
        exclusivePrimary: true,
      };
    }
    return { primary: UK_ELECTRONICS_MATERIALS, secondary: [], exclusivePrimary: true };
  }

  if (rootSlug === "sports") {
    return { primary: UK_SPORTS_MATERIALS, secondary: UK_FASHION_MATERIALS };
  }

  if (rootSlug === "collectibles") {
    return { primary: UK_TOY_MATERIALS, secondary: UK_JEWELLERY_MATERIALS };
  }

  if (slug.includes("pillow") || subcategorySlug === "pillows-cushions") {
    return { primary: UK_TRAVEL_PILLOW_MATERIALS, secondary: UK_BEDDING_MATERIALS };
  }

  return { primary: UK_HOME_MATERIALS, secondary: UK_FASHION_MATERIALS };
}

export function buildDedicatedMaterialDatabase(
  ctx: ProductTypeMaterialContext,
): readonly string[] {
  const pathKey = `${ctx.rootSlug}/${ctx.subcategorySlug}/${ctx.productTypeSlug}`;

  const leafOverride = resolveLeafMaterialOverride(
    ctx.rootSlug,
    ctx.subcategorySlug,
    ctx.productTypeSlug,
  );
  if (leafOverride && leafOverride.length > 0) {
    const pathAccent = takeRotated(leafOverride, pathKey, Math.min(3, leafOverride.length), 77);
    const slugSpecialty: Record<string, readonly string[]> = {
      pillows: ["Cotton", "Egyptian Cotton", "Percale"],
      "body-pillows": ["Memory Foam", "Polyester", "Microfibre"],
      "decorative-cushions": ["Velvet", "Bouclé", "Linen"],
      cushions: ["Chenille", "Cotton", "Embroidery"],
      "seat-cushions": ["Foam", "Memory Foam", "Outdoor Fabric"],
      "lumbar-cushions": ["Memory Foam", "Mesh", "Gel Foam"],
      "floor-cushions": ["Cotton", "Foam", "Canvas"],
      "children-s-pillows": ["Cotton", "Polyester", "Hypoallergenic Fill"],
      "outdoor-cushions": ["Outdoor Fabric", "Quick-Dry Foam", "Olefin"],
    };
    const anchors = leafOverride.filter((m) =>
      [
        "Memory Foam",
        "Velour",
        "Gel Foam",
        "Cotton",
        "Polyester",
        "EPS Microbeads",
        "Down",
        "Feather",
        "Foam",
        "Bamboo",
      ].includes(m),
    );
    return normalizeLeafMaterialDataset(
      pathKey,
      leafOverride,
      uniqueMaterials([
        ...(slugSpecialty[ctx.productTypeSlug] ?? []),
        ...anchors,
        ...pathAccent,
      ]),
      { dropRatio: 0.12 },
    );
  }

  const pools = resolveMaterialPools(ctx);
  return dedicateFromPools(pathKey, pools.primary, pools.secondary, {
    exclusivePrimary: pools.exclusivePrimary,
    specialty: pools.specialty,
  });
}

let cachedDb: ReadonlyMap<string, readonly string[]> | null = null;
let cachedSlugIndex: ReadonlyMap<string, readonly string[]> | null = null;
let cachedStats: CategoryMaterialDatabaseStats | null = null;

function pathKeyOf(ctx: ProductTypeMaterialContext): string {
  return `${ctx.rootSlug}/${ctx.subcategorySlug}/${ctx.productTypeSlug}`;
}

function buildCache(): void {
  const byPath = new Map<string, readonly string[]>();
  const bySlug = new Map<string, readonly string[]>();
  const slugOwners = new Map<string, number>();
  const names = new Set<string>();
  let total = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const sector of CATALOG_SECTORS) {
    for (const dept of sector.departments) {
      for (const [name, slug] of dept.items ?? []) {
        const ctx: ProductTypeMaterialContext = {
          rootSlug: sector.slug,
          subcategorySlug: dept.slug,
          productTypeSlug: slug,
          productTypeName: name,
        };
        const materials = buildDedicatedMaterialDatabase(ctx);
        const key = pathKeyOf(ctx);
        byPath.set(key, materials);
        slugOwners.set(slug, (slugOwners.get(slug) ?? 0) + 1);
        bySlug.set(slug, materials);
        total += materials.length;
        min = Math.min(min, materials.length);
        max = Math.max(max, materials.length);
        for (const material of materials) names.add(material);
      }
    }
  }

  for (const [slug, count] of slugOwners) {
    if (count > 1) bySlug.delete(slug);
  }

  cachedDb = byPath;
  cachedSlugIndex = bySlug;
  cachedStats = {
    productTypePaths: byPath.size,
    uniqueMaterialNames: names.size,
    totalMaterialEntries: total,
    averageMaterialsPerCategory:
      byPath.size === 0 ? 0 : Math.round((total / byPath.size) * 10) / 10,
    minMaterialsPerCategory: Number.isFinite(min) ? min : 0,
    maxMaterialsPerCategory: max,
  };
  syncCanonicalMaterialRegistry(byPath);
}

function ensureCache(): void {
  if (!cachedDb || !cachedSlugIndex || !cachedStats) buildCache();
}

export function resetProductTypeMaterialDatabaseCacheForTests(): void {
  cachedDb = null;
  cachedSlugIndex = null;
  cachedStats = null;
  resetCanonicalMaterialRegistryCacheForTests();
}

export function getCategoryMaterialDatabaseStats(): CategoryMaterialDatabaseStats {
  ensureCache();
  return cachedStats!;
}

export function getMaterialsForProductTypePath(
  ctx: ProductTypeMaterialContext,
): readonly string[] {
  ensureCache();
  return cachedDb!.get(pathKeyOf(ctx)) ?? buildDedicatedMaterialDatabase(ctx);
}

export function getMaterialsForProductType(
  productTypeSlug: string,
  context?: Partial<Pick<ProductTypeMaterialContext, "rootSlug" | "subcategorySlug">>,
): readonly string[] {
  ensureCache();
  if (context?.rootSlug && context.subcategorySlug) {
    return getMaterialsForProductTypePath({
      rootSlug: context.rootSlug,
      subcategorySlug: context.subcategorySlug,
      productTypeSlug,
    });
  }
  if (context?.rootSlug) {
    for (const [key, materials] of cachedDb!) {
      if (key.startsWith(`${context.rootSlug}/`) && key.endsWith(`/${productTypeSlug}`)) {
        return materials;
      }
    }
  }
  const bySlug = cachedSlugIndex!.get(productTypeSlug);
  if (bySlug) return bySlug;
  return buildDedicatedMaterialDatabase({
    rootSlug: "home-garden",
    subcategorySlug: "decor",
    productTypeSlug,
  });
}

/** Cross-root Material DB fingerprints must not collide. */
export function assertCrossCategoryMaterialSeparation(): {
  ok: boolean;
  collisions: string[];
} {
  ensureCache();
  const fingerprintToPaths = new Map<string, string[]>();
  for (const [path, materials] of cachedDb!) {
    const fp = materials.join("|");
    const list = fingerprintToPaths.get(fp) ?? [];
    list.push(path);
    fingerprintToPaths.set(fp, list);
  }
  const collisions: string[] = [];
  for (const paths of fingerprintToPaths.values()) {
    if (paths.length < 2) continue;
    const roots = new Set(paths.map((p) => p.split("/")[0]));
    if (roots.size > 1) collisions.push(paths.join(" == "));
  }
  return { ok: collisions.length === 0, collisions };
}

/** Every leaf path must own a unique Material fingerprint (no sibling parent clones). */
export function assertLeafMaterialIndependence(): {
  ok: boolean;
  sharedFingerprints: number;
  collidingPaths: string[];
} {
  ensureCache();
  const fingerprintToPaths = new Map<string, string[]>();
  for (const [path, materials] of cachedDb!) {
    const fp = materials.join("|");
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
  return { ok: collidingPaths.length === 0, sharedFingerprints, collidingPaths };
}

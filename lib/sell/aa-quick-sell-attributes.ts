/**
 * ROVEXO Sell v1.0 — Canonical Dynamic Attribute Engine (taxonomy-driven).
 *
 * Extensible: any ATTRIBUTE_DEFS id may appear in maps.
 * Never dumps global Material/Colour/Size onto every category.
 *
 * SellPage order:
 *   Photos → Title → Description → Category → Dynamic Attributes → Price → Parcel → Publish
 */

import type { FlatCategoryPath } from "@/lib/categories/types";

/**
 * Canonical quick-sell attribute id list (Condition included when taxonomy requires it).
 * Not a closed enum — unknown ids pass through if ATTRIBUTE_DEFS has them.
 */
export type SellAttributeId = string;

/**
 * Top-level category slug → ordered attribute ids.
 * Owner freeze examples drive these sets.
 */
const BY_CATEGORY: Record<string, readonly SellAttributeId[]> = {
  // Phones — Condition, Colour, Storage, Network (no Material)
  phones: ["condition", "colour", "storage", "network"],
  // Electronics root — light set
  electronics: ["condition", "brand", "colour"],
  // Computers / Laptops
  computers: ["brand", "condition", "storage", "ram", "colour"],
  gaming: ["brand", "condition", "platform", "colour"],
  // Fashion / T-shirts — Material (recommended)
  "mens-fashion": ["brand", "condition", "size", "colour", "material"],
  "womens-fashion": ["brand", "condition", "size", "colour", "material"],
  "kids-fashion": ["brand", "condition", "size", "colour", "material"],
  // Shoes — Brand, Condition, Size, Colour, Material
  shoes: ["brand", "condition", "size", "colour", "material"],
  sports: ["brand", "condition", "size", "colour", "material"],
  // Home
  "home-garden": ["brand", "condition", "colour", "material"],
  diy: ["brand", "condition", "colour", "material"],
  tools: ["brand", "condition", "colour", "material"],
  baby: ["brand", "condition", "size", "colour", "material"],
  jewellery: ["brand", "condition", "material", "colour"],
  beauty: ["brand", "condition", "colour"],
  health: ["brand", "condition"],
  pets: ["brand", "condition", "colour", "material"],
  vehicles: ["brand", "condition", "model", "colour"],
  // Car Parts — Compatibility, Brand, Condition, Colour (NO Material)
  autoparts: ["compatibility", "brand", "condition", "colour"],
  // Camping
  camping: ["brand", "condition", "colour", "material"],
  property: ["condition"],
  services: [],
};

/** Leaf / department overrides (checked leaf → root before category map). */
const BY_LEAF: Record<string, readonly SellAttributeId[]> = {
  // Phones leaves
  smartphones: ["condition", "colour", "storage", "network"],
  // Laptops
  laptops: ["brand", "condition", "storage", "ram", "colour"],
  "gaming-laptops": ["brand", "condition", "storage", "ram", "colour"],
  "business-laptops": ["brand", "condition", "storage", "ram", "colour"],
  chromebooks: ["brand", "condition", "storage", "ram", "colour"],
  macbooks: ["brand", "condition", "storage", "ram", "colour"],
  desktops: ["brand", "condition", "storage", "ram", "colour"],
  "computer-accessories": ["brand", "condition", "colour"],
  components: ["brand", "condition"],
  // Furniture
  furniture: ["brand", "condition", "material", "colour"],
  "home-textiles": ["brand", "condition", "material", "colour"],
  // Bedding / pillows
  bedding: ["brand", "condition", "material", "colour"],
  pillows: ["brand", "condition", "material", "colour"],
  "baby-pillow": ["brand", "condition", "material", "colour"],
  "baby-bedding": ["brand", "condition", "material", "colour"],
  duvets: ["brand", "condition", "material", "colour"],
  mattresses: ["brand", "condition", "material", "colour"],
  // Fashion
  "t-shirts": ["brand", "condition", "size", "colour", "material"],
  tops: ["brand", "condition", "size", "colour", "material"],
  shirts: ["brand", "condition", "size", "colour", "material"],
  dresses: ["brand", "condition", "size", "colour", "material"],
  "baby-clothing": ["brand", "condition", "size", "colour", "material"],
  // Camping > Sleeping Bags — Season Rating + Length
  "sleeping-bags": ["brand", "condition", "colour", "material", "seasonRating", "length"],
  "camping-sleeping": ["brand", "condition", "colour", "material", "seasonRating", "length"],
  // Consoles — colour yes, no material
  consoles: ["brand", "condition", "platform", "colour"],
  playstation: ["brand", "condition", "platform", "colour"],
  xbox: ["brand", "condition", "platform", "colour"],
  nintendo: ["brand", "condition", "platform", "colour"],
};

const DEFAULT_IDS: readonly SellAttributeId[] = ["brand", "condition"];

function pathSlugs(categoryPath: FlatCategoryPath): string[] {
  const fromSegments = [...categoryPath.segments].map((s) => s.slug).reverse();
  const explicit = [
    categoryPath.childCategorySlug,
    categoryPath.subcategorySlug,
    categoryPath.categorySlug,
  ].filter((s): s is string => Boolean(s));
  const ordered: string[] = [];
  for (const slug of [...explicit, ...fromSegments]) {
    if (slug && !ordered.includes(slug)) ordered.push(slug);
  }
  return ordered;
}

/**
 * Resolve taxonomy-driven attribute ids for the selected category path.
 * Walks leaf → subcategory → main category.
 */
export function resolveAaQuickSellAttributeIds(
  categoryPath: FlatCategoryPath | null,
): SellAttributeId[] {
  if (!categoryPath?.categorySlug) return [];

  for (const slug of pathSlugs(categoryPath)) {
    const leaf = BY_LEAF[slug];
    if (leaf) return [...leaf];
  }

  const configured = BY_CATEGORY[categoryPath.categorySlug];
  return [...(configured ?? DEFAULT_IDS)];
}

/** @deprecated — Brand is no longer a fixed pre-Condition slot. */
export function isAaBrandAttribute(id: string): boolean {
  return id === "brand";
}

/** @deprecated — All non-condition attrs are dynamic; Condition is taxonomy-ordered too. */
export function isAaDynamicAfterCondition(id: string): boolean {
  return id !== "brand" && id !== "condition";
}

/** @deprecated */
export function isAaBeforeCondition(id: string): boolean {
  return id === "brand";
}

/** @deprecated */
export function isAaAfterCondition(id: string): boolean {
  return isAaDynamicAfterCondition(id);
}

/** True when taxonomy includes Condition for this path. */
export function categorySupportsCondition(categoryPath: FlatCategoryPath | null): boolean {
  return resolveAaQuickSellAttributeIds(categoryPath).includes("condition");
}

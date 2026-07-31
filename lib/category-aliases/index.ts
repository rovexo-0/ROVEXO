/**
 * ROVEXO Category Aliases — canonical synonym and keyword mapping.
 */

export {
  CATEGORY_SEARCH_SYNONYMS,
  CATEGORY_SEGMENT_ALIASES,
  expandSearchSynonyms,
} from "@/lib/categories/search-synonyms";

export { EXTENDED_MARKETPLACE_SYNONYMS } from "@/lib/categories/enterprise/marketplace-synonyms";

export { TITLE_SYNONYMS } from "@/lib/sell/title-category-rules";

/** Hidden aliases for category matching — not shown in UI. */
export const CATEGORY_HIDDEN_ALIASES: Record<string, readonly string[]> = {
  pillows: ["cushion", "headrest", "bolster", "throw pillow"],
  "memory-foam-pillow": ["memory foam", "viscoelastic", "tempur style"],
  "travel-pillow": ["neck pillow", "plane pillow", "car pillow", "BCOZZY"],
  smartphones: ["mobile phone", "cell phone", "iphone", "android phone"],
  trainers: ["sneakers", "tennis shoes", "athletic shoes", "kicks", "air max"],
  camping: ["sleeping bag", "sleeping bags", "sleepingbag", "camp bed", "tent"],
  sofas: ["couch", "settee", "chesterfield"],
  duvets: ["comforter", "quilt", "doona"],
};

/** Keyword mapping for deterministic category detection. */
export const CATEGORY_KEYWORD_MAP: Record<string, readonly string[]> = {
  "home-garden/bedding/pillows": [
    "pillow",
    "cushion",
    "memory foam",
    "tempur",
    "orthopaedic",
    "neck pillow",
    "travel pillow",
    "pregnancy pillow",
    "body pillow",
    "wedge pillow",
  ],
  "electronics/phones-tablets/smartphones": [
    "iphone",
    "samsung galaxy",
    "pixel",
    "smartphone",
    "mobile phone",
    "android",
  ],
  "mens-fashion/shoes/trainers": [
    "nike",
    "air max",
    "air force",
    "trainers",
    "sneakers",
    "running shoes",
  ],
  "sports/outdoor-sports/camping": [
    "camping",
    "sleeping bag",
    "sleepingbag",
    "tent",
    "camp bed",
  ],
  "mens-fashion/clothing/coats-and-jackets": [
    "jacket",
    "coat",
    "parka",
    "bomber",
    "puffer",
    "gilet",
  ],
};

export function getAliasesForSlug(slug: string): readonly string[] {
  return CATEGORY_HIDDEN_ALIASES[slug] ?? [];
}

export function getKeywordsForPath(path: string): readonly string[] {
  return CATEGORY_KEYWORD_MAP[path] ?? [];
}

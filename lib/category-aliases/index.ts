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
  "android-phones": ["android phone", "android smartphone", "galaxy phone", "pixel phone"],
  iphones: ["iphone", "apple phone", "apple iphone"],
  trainers: ["sneakers", "tennis shoes", "athletic shoes", "kicks", "air max"],
  /** Leaf aliases — Catalog Master pillows / camping (not fashion Bags). */
  "sleeping-bags": [
    "sleeping bag",
    "sleeping bags",
    "sleepingbag",
    "sleeping-bag",
    "sleeping-bags",
    "camp sleeping bag",
  ],
  tents: ["tent", "tents"],
  "camping-tents": ["camping tent", "camping tents", "family tent", "dome tent", "pop up tent"],
  "memory-foam-pillows": ["memory foam pillow", "memory foam pillows", "viscoelastic pillow", "tempur style pillow"],
  "orthopedic-pillows": ["orthopedic pillow", "orthopaedic pillow", "ortho pillow"],
  "pregnancy-pillows": ["pregnancy pillow", "pregnancy pillows"],
  "maternity-pillows": ["maternity pillow", "maternity pillows"],
  "travel-pillows": ["travel pillow", "plane pillow", "car pillow"],
  "neck-pillows": ["neck pillow", "neck support pillow"],
  sofas: ["couch", "settee", "chesterfield"],
  duvets: ["comforter", "quilt", "doona"],
};

/** Keyword mapping for deterministic category detection — Catalog Master path keys only. */
export const CATEGORY_KEYWORD_MAP: Record<string, readonly string[]> = {
  "home-garden/pillows-cushions/memory-foam-pillows": [
    "memory foam pillow",
    "memory foam",
    "viscoelastic",
    "tempur pillow",
  ],
  "home-garden/pillows-cushions/orthopedic-pillows": [
    "orthopedic pillow",
    "orthopaedic pillow",
  ],
  "home-garden/pillows-cushions/pregnancy-pillows": [
    "pregnancy pillow",
    "pregnancy pillows",
  ],
  "home-garden/pillows-cushions/maternity-pillows": [
    "maternity pillow",
    "maternity pillows",
  ],
  "home-garden/pillows-cushions/travel-pillows": ["travel pillow", "plane pillow"],
  "home-garden/pillows-cushions/neck-pillows": ["neck pillow"],
  "home-garden/bedding/pillows": ["pillow", "pillows", "cushion pillow"],
  "electronics/phones-tablets/android-phones": [
    "android phone",
    "samsung galaxy",
    "pixel",
    "android smartphone",
    "smartphone",
    "mobile phone",
  ],
  "electronics/phones-tablets/iphones": ["iphone", "apple iphone"],
  "mens-fashion/shoes/trainers": [
    "nike",
    "air max",
    "air force",
    "trainers",
    "sneakers",
    "running shoes",
  ],
  "sports/camping/sleeping-bags": [
    "camping",
    "sleeping bag",
    "sleeping bags",
    "sleepingbag",
    "sleeping-bag",
    "camp bed",
  ],
  "sports/camping/camping-tents": ["camping tent", "camping tents", "family tent", "dome tent"],
  "sports/camping/tents": ["tent", "tents"],
  "mens-fashion/jackets/leather-jackets": ["leather jacket", "biker jacket"],
  "mens-fashion/jackets/bomber-jackets": ["bomber", "bomber jacket"],
  "mens-fashion/jackets/puffer-jackets": ["puffer", "puffer jacket", "down jacket"],
  "womens-fashion/jackets/leather-jackets": ["leather jacket", "biker jacket"],
};

export function getAliasesForSlug(slug: string): readonly string[] {
  return CATEGORY_HIDDEN_ALIASES[slug] ?? [];
}

export function getKeywordsForPath(path: string): readonly string[] {
  return CATEGORY_KEYWORD_MAP[path] ?? [];
}

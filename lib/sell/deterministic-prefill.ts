import type { FlatCategoryPath } from "@/lib/categories/types";
import { MARKETPLACE_BRANDS } from "@/lib/categories/enterprise/brands";
import type { SellListingDraft } from "@/features/sell/types";
import { normalizeListingText } from "@/lib/sell/suggest-category-from-title";
import { isSellQuickCondition } from "@/lib/sell/sell-condition-options";

export type DeterministicPrefillPatch = {
  brand?: string;
  color?: string;
  material?: string;
  size?: string;
  condition?: string;
  attributes?: Record<string, string>;
};

const STORAGE_PATTERN = /\b(\d+)\s*(gb|tb)\b/i;
const DIMENSION_PATTERN = /\b(\d+(?:\.\d+)?)\s*(cm|mm|m|in|inch|inches|")\b/i;
const MODEL_PATTERNS = [
  /\b(iphone\s*\d+(?:\s*pro)?(?:\s*max)?)\b/i,
  /\b(galaxy\s*s\d+(?:\s*ultra)?)\b/i,
  /\b(pixel\s*\d+(?:\s*pro)?)\b/i,
  /\b(macbook\s*(?:air|pro)?(?:\s*m\d)?)\b/i,
  /\b(ps5|playstation\s*5|xbox\s*series\s*[xs])\b/i,
];

const MATERIAL_KEYWORDS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\bmemory\s*foam\b/i, value: "Memory Foam" },
  { pattern: /\bgel\s*foam\b/i, value: "Gel Foam" },
  { pattern: /\blatex\b/i, value: "Latex" },
  { pattern: /\bcotton\b/i, value: "Cotton" },
  { pattern: /\bpolyester\b/i, value: "Polyester" },
  { pattern: /\bleather\b/i, value: "Leather" },
  { pattern: /\bwood(en)?\b/i, value: "Wood" },
  { pattern: /\bmetal\b/i, value: "Metal" },
  { pattern: /\bsilk\b/i, value: "Silk" },
  { pattern: /\bwool\b/i, value: "Wool" },
  { pattern: /\bdown\b/i, value: "Down" },
  { pattern: /\bbamboo\b/i, value: "Bamboo" },
];

const CONDITION_KEYWORDS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\bbrand\s*new\b|\bnew\s*\(sealed\)\b|\bsealed\b/i, value: "New" },
  { pattern: /\blike\s*new\b/i, value: "Like New" },
  { pattern: /\bvery\s*good\b/i, value: "Very Good" },
  { pattern: /\bexcellent\b/i, value: "Very Good" },
  { pattern: /\bfair\b/i, value: "Fair" },
  { pattern: /\bgood\b/i, value: "Good" },
];

export function suggestBrandFromText(title: string, description = ""): string | null {
  const corpus = normalizeListingText(`${title} ${description}`);
  if (!corpus.trim()) return null;
  return findBrand(corpus);
}

const COLOUR_WORDS = [
  "black",
  "white",
  "grey",
  "gray",
  "blue",
  "red",
  "green",
  "pink",
  "brown",
  "beige",
  "navy",
  "silver",
] as const;

function findColourWord(text: string): string | null {
  for (const word of COLOUR_WORDS) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
      return word === "gray" ? "Grey" : word.charAt(0).toUpperCase() + word.slice(1);
    }
  }
  return null;
}

export function suggestColourFromTitle(title: string): string | null {
  const corpus = normalizeListingText(title);
  return corpus.trim() ? findColourWord(corpus) : null;
}

export function suggestColourFromDescription(description: string): string | null {
  const corpus = normalizeListingText(description);
  return corpus.trim() ? findColourWord(corpus) : null;
}

export function suggestConditionFromText(title: string, description = ""): string | null {
  const corpus = normalizeListingText(`${title} ${description}`);
  if (!corpus.trim()) return null;
  const condition = findCondition(corpus);
  return condition && isSellQuickCondition(condition) ? condition : null;
}

function findBrand(text: string): string | null {
  for (const brand of MARKETPLACE_BRANDS) {
    const pattern = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(text)) return brand;
  }
  return null;
}

function findMaterial(text: string): string | null {
  for (const rule of MATERIAL_KEYWORDS) {
    if (rule.pattern.test(text)) return rule.value;
  }
  return null;
}

function findCondition(text: string): string | null {
  for (const rule of CONDITION_KEYWORDS) {
    if (rule.pattern.test(text)) {
      return isSellQuickCondition(rule.value) ? rule.value : null;
    }
  }
  return null;
}

function findModel(text: string): string | null {
  for (const pattern of MODEL_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/\s+/g, " ").trim();
  }
  return null;
}

function findStorage(text: string): string | null {
  const match = text.match(STORAGE_PATTERN);
  if (!match) return null;
  return `${match[1]}${match[2]!.toUpperCase()}`;
}

function findSize(text: string): string | null {
  const match = text.match(DIMENSION_PATTERN);
  if (!match) return null;
  return `${match[1]}${match[2]}`;
}

/** Deterministic prefill from title + description — never overwrites user values. */
export function buildDeterministicPrefill(
  draft: SellListingDraft,
  categoryPath: FlatCategoryPath | null = draft.categoryPath,
): DeterministicPrefillPatch {
  const corpus = normalizeListingText(`${draft.title} ${draft.description}`);
  if (!corpus.trim()) return {};

  const patch: DeterministicPrefillPatch = { attributes: { ...draft.attributes } };
  let changed = false;

  if (!draft.brand) {
    const brand = suggestBrandFromText(draft.title, draft.description);
    if (brand) {
      patch.brand = brand;
      changed = true;
    }
  }

  if (!draft.color) {
    const color =
      suggestColourFromTitle(draft.title) ?? suggestColourFromDescription(draft.description);
    if (color) {
      patch.color = color;
      changed = true;
    }
  }

  if (!draft.condition) {
    const condition = suggestConditionFromText(draft.title, draft.description);
    if (condition) {
      patch.condition = condition;
      changed = true;
    }
  }

  if (!draft.material) {
    const material = findMaterial(corpus);
    if (material) {
      patch.material = material;
      changed = true;
    }
  }

  if (!draft.size) {
    const size = findSize(corpus);
    if (size) {
      patch.size = size;
      changed = true;
    }
  }

  const model = findModel(corpus);
  if (model && !draft.attributes.model) {
    patch.attributes = { ...patch.attributes, model };
    changed = true;
  }

  const storage = findStorage(corpus);
  if (storage && !draft.attributes.storage) {
    patch.attributes = { ...patch.attributes, storage };
    changed = true;
  }

  if (!changed) {
    delete patch.attributes;
    return {};
  }

  if (patch.attributes && Object.keys(patch.attributes).length === 0) {
    delete patch.attributes;
  }

  void categoryPath;
  return patch;
}

/** Merge prefill patch into draft without overwriting non-empty fields. */
export function applyDeterministicPrefill(
  draft: SellListingDraft,
  patch: DeterministicPrefillPatch,
): Partial<SellListingDraft> {
  const result: Partial<SellListingDraft> = {};

  if (patch.brand && !draft.brand) result.brand = patch.brand;
  if (patch.color && !draft.color) result.color = patch.color;
  if (patch.material && !draft.material) result.material = patch.material;
  if (patch.size && !draft.size) result.size = patch.size;
  if (patch.condition && !draft.condition) result.condition = patch.condition;

  if (patch.attributes) {
    const attributes = { ...draft.attributes };
    let attrsChanged = false;
    for (const [key, value] of Object.entries(patch.attributes)) {
      if (!attributes[key] && value) {
        attributes[key] = value;
        attrsChanged = true;
      }
    }
    if (attrsChanged) result.attributes = attributes;
  }

  return result;
}

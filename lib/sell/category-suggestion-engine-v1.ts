/**
 * ROVEXO Category Suggestion Engine v1.0 — Catalog Master SSOT Edition.
 *
 * STATUS: OWNER APPROVED · DETERMINISTIC · NO AI · NO AUTO CATEGORY · FAIL CLOSED
 *
 * Runtime flow (ONE instance only):
 * Catalog Master (lib/catalog/tree.ts)
 *   → Runtime Catalog Builder
 *   → Leaf Index · Phrase Index · Synonym Index
 *   → Suggest Engine → Sell
 *
 * Never guesses below Owner confidence threshold.
 * Never uses generated taxonomy JSON, legacy keyword maps, or parallel trees.
 */

import { SUGGEST_SSOT_HARDENING_V1 } from "@/lib/catalog/suggest-ssot-hardening-v1";
import {
  getRuntimeCatalogIndex,
  normalizeCatalogText,
  resetRuntimeCatalogIndexForTests,
  tokenizeCatalogText,
  type RuntimeLeafEntry,
} from "@/lib/catalog/runtime-catalog-index-v1";
import { resolveCategoryPathBySlugs, toPathId } from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";

export const CATEGORY_SUGGESTION_ENGINE_V1 = {
  id: "category-suggestion-engine-v1",
  version: "1.0.0",
  status: "ACTIVE",
  ssot: SUGGEST_SSOT_HARDENING_V1.ssot,
  runtimeIndex: "lib/catalog/runtime-catalog-index-v1.ts",
  method: "deterministic_catalog_master_index",
  ownerConfidenceThreshold: SUGGEST_SSOT_HARDENING_V1.ownerConfidenceThreshold,
  noSuggestionMessage: SUGGEST_SSOT_HARDENING_V1.noSuggestionMessage,
  forbidden: [
    "ai",
    "machine_learning",
    "llm",
    "embeddings",
    "vector_search",
    "fuzzy_ai_matching",
    "keyword_patches",
    "special_cases",
    "auto_publish",
    "auto_category",
    "auto_select",
    "duplicate_taxonomy",
  ] as const,
  ranking: ["exact_product_type", "exact_alias", "exact_synonym"] as const,
} as const;

export type CategoryMatchRank =
  | "exact_product_type"
  | "exact_alias"
  | "exact_synonym"
  | "contains"
  | "keyword_score"
  | "path_confidence";

export type CategorySuggestion = {
  path: FlatCategoryPath;
  confidence: number;
  rank: CategoryMatchRank;
  /** Human path labels for UI (Category › Subcategory › Product Type). */
  labels: readonly string[];
};

export type CategorySuggestionResult = {
  suggestion: CategorySuggestion | null;
  /** True when a manual path is set and a higher-score suggestion exists. */
  betterSuggestionAvailable: boolean;
};

const RANK_PRIORITY: Record<CategoryMatchRank, number> = {
  exact_product_type: 6,
  exact_alias: 5,
  exact_synonym: 4,
  contains: 3,
  keyword_score: 2,
  path_confidence: 1,
};

const RANK_CONFIDENCE: Record<CategoryMatchRank, number> = {
  exact_product_type: 0.98,
  exact_alias: 0.96,
  exact_synonym: 0.94,
  contains: 0.88,
  keyword_score: 0.84,
  path_confidence: 0.72,
};

const MIN_QUERY_LENGTH = 3;

/** Catalog Master leaf noise: storage / capacity tokens must not block phrase explain. */
const STORAGE_OR_SKU_TOKEN = /^\d+(\.\d+)?(gb|tb|mb|kb|oz|ml|cm|mm|in|inch|kg|g)$/i;

/** Minimal irregular plurals for Catalog Master leaf names (not a keyword pack). */
const IRREGULAR_TOKEN_ALIASES: Readonly<Record<string, string>> = {
  mouse: "mice",
  mice: "mouse",
};

function expandTokenAliases(token: string): string[] {
  const alias = IRREGULAR_TOKEN_ALIASES[token];
  return alias ? [token, alias] : [token];
}

function wholeWordIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (needle.includes(" ")) return haystack.includes(needle);
  const pattern = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return pattern.test(haystack);
}

function canonicalize(
  path: FlatCategoryPath,
  confidence: number,
  rank: CategoryMatchRank,
): CategorySuggestion | null {
  const canonical = resolveCategoryPathBySlugs(path.segments.map((segment) => segment.slug));
  if (!canonical) return null;
  return {
    path: canonical,
    confidence,
    rank,
    labels: canonical.segments.map((segment) => segment.name),
  };
}

function passesOwnerConfidenceGate(suggestion: CategorySuggestion | null): CategorySuggestion | null {
  if (!suggestion) return null;
  if (suggestion.confidence < SUGGEST_SSOT_HARDENING_V1.ownerConfidenceThreshold) {
    return null;
  }
  return suggestion;
}

/**
 * Fail closed: a short Catalog Master phrase must not absorb unrelated query words.
 * Allows model noise only (digits, storage/SKU, tokens length ≤ 3) — never typo dictionaries.
 */
function phraseExplainsQuery(phrase: string, queryTokens: ReadonlySet<string>): boolean {
  const phraseTokens = tokenizeCatalogText(phrase);
  if (phraseTokens.length === 0) return false;

  const queryHas = (token: string) =>
    expandTokenAliases(token).some((alias) => queryTokens.has(alias));

  if (phraseTokens.length >= 2) {
    return phraseTokens.every((token) => queryHas(token));
  }
  const leafToken = phraseTokens[0]!;
  for (const token of queryTokens) {
    if (expandTokenAliases(token).includes(leafToken)) continue;
    if (/^\d+$/.test(token)) continue;
    if (STORAGE_OR_SKU_TOKEN.test(token)) continue;
    if (token.length <= 3) continue;
    return false;
  }
  return queryHas(leafToken);
}

function expandQueryVariants(normalized: string): string[] {
  const tokens = tokenizeCatalogText(normalized);
  const variants = new Set<string>([normalized]);
  for (let index = 0; index < tokens.length; index += 1) {
    const aliases = expandTokenAliases(tokens[index]!);
    if (aliases.length < 2) continue;
    for (const alias of aliases) {
      if (alias === tokens[index]) continue;
      const next = [...tokens];
      next[index] = alias;
      variants.add(next.join(" "));
    }
  }
  return [...variants];
}

/**
 * Match Catalog Master leaf phrases (derived from tree.ts leaf names only).
 * Longest phrase wins — deterministic, no keyword patches.
 */
function matchPhraseIndex(normalized: string): CategorySuggestion | null {
  const { phraseIndex } = getRuntimeCatalogIndex();
  let bestLeaf: RuntimeLeafEntry | null = null;
  let bestPhraseLen = 0;

  for (const variant of expandQueryVariants(normalized)) {
    const queryTokens = new Set(tokenizeCatalogText(variant));
    for (const [phrase, leaf] of phraseIndex) {
      if (phrase.length < bestPhraseLen) continue;
      if (!(variant === phrase || wholeWordIncludes(variant, phrase))) continue;
      if (!phraseExplainsQuery(phrase, queryTokens)) continue;
      if (phrase.length > bestPhraseLen) {
        bestPhraseLen = phrase.length;
        bestLeaf = leaf;
      }
    }
  }

  if (!bestLeaf) return null;
  return canonicalize(bestLeaf.path, RANK_CONFIDENCE.exact_product_type, "exact_product_type");
}

/**
 * Full leaf-token coverage from Catalog Master synonym index.
 * Every Catalog Master leaf token must appear in the query.
 * Single-token leaves only when the query is that token alone (never "… pillow" → Pillows).
 */
function matchSynonymIndex(normalized: string): CategorySuggestion | null {
  const queryTokens = new Set(tokenizeCatalogText(normalized));
  if (queryTokens.size === 0) return null;

  const { synonymIndex, leaves } = getRuntimeCatalogIndex();
  const candidates = new Set<RuntimeLeafEntry>();

  for (const token of queryTokens) {
    const bucket = synonymIndex.get(token);
    if (!bucket) continue;
    for (const leaf of bucket) candidates.add(leaf);
  }

  // Stable fallback: Catalog Master leaf order when no shared synonym token.
  const pool = candidates.size > 0 ? candidates : leaves;

  let best: CategorySuggestion | null = null;
  let bestTokenCount = 0;

  for (const leaf of pool) {
    if (leaf.tokens.length === 0) continue;
    if (leaf.tokens.length === 1 && queryTokens.size !== 1) continue;
    if (leaf.tokens.length === 1 && leaf.tokens[0]!.length < 5) continue;
    if (!leaf.tokens.every((token) => queryTokens.has(token))) continue;

    const candidate = canonicalize(
      leaf.path,
      RANK_CONFIDENCE.exact_product_type,
      "exact_product_type",
    );
    if (!candidate) continue;

    if (!best || leaf.tokens.length > bestTokenCount) {
      best = candidate;
      bestTokenCount = leaf.tokens.length;
    }
  }

  return best;
}

function pickBest(...candidates: Array<CategorySuggestion | null>): CategorySuggestion | null {
  let best: CategorySuggestion | null = null;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (
      !best ||
      RANK_PRIORITY[candidate.rank] > RANK_PRIORITY[best.rank] ||
      (candidate.rank === best.rank && candidate.confidence > best.confidence)
    ) {
      best = candidate;
    }
  }
  return best;
}

/** Clear warmed runtime index pointer (Catalog Master content change / tests). */
export function invalidateCategorySuggestionIndex(): void {
  resetRuntimeCatalogIndexForTests();
}

/**
 * Suggest the single highest-ranked Catalog Master path for title + description.
 * Never mutates selection — UI must call Apply.
 * Below Owner confidence threshold → null (no unrelated category).
 */
export function suggestCategory(
  title: string,
  description = "",
): CategorySuggestion | null {
  const combined = `${title} ${description}`.trim();
  if (normalizeCatalogText(combined).length < MIN_QUERY_LENGTH) return null;

  const normalized = normalizeCatalogText(combined);
  if (!normalized) return null;

  // Warm / reuse the ONE runtime Catalog Master index.
  getRuntimeCatalogIndex();

  const phrase = matchPhraseIndex(normalized);
  if (phrase && phrase.confidence >= SUGGEST_SSOT_HARDENING_V1.ownerConfidenceThreshold) {
    return phrase;
  }

  const synonym = matchSynonymIndex(normalized);
  return passesOwnerConfidenceGate(pickBest(phrase, synonym));
}

/**
 * Live monitor helper: recalculate suggestion; never overwrite manual category.
 */
export function resolveLiveCategorySuggestion(input: {
  title: string;
  description?: string;
  manualPath: FlatCategoryPath | null | undefined;
}): CategorySuggestionResult {
  const suggestion = suggestCategory(input.title, input.description ?? "");
  if (!suggestion) {
    return { suggestion: null, betterSuggestionAvailable: false };
  }

  if (!input.manualPath) {
    return { suggestion, betterSuggestionAvailable: false };
  }

  const same = toPathId(input.manualPath) === toPathId(suggestion.path);
  if (same) {
    return { suggestion: null, betterSuggestionAvailable: false };
  }

  return {
    suggestion,
    betterSuggestionAvailable: true,
  };
}

/** Confidence as integer percent for UI (e.g. 98). */
export function suggestionConfidencePercent(suggestion: CategorySuggestion): number {
  return Math.round(Math.min(0.99, Math.max(0, suggestion.confidence)) * 100);
}

/** Apply Suggestion may only populate these three taxonomy levels. */
export function applyCategorySuggestion(suggestion: CategorySuggestion): FlatCategoryPath {
  return suggestion.path;
}

/** Always false — Category Suggestion Engine never auto-selects. */
export function shouldAutoApplyCategorySuggestion(): false {
  return false;
}

export { SUGGEST_SSOT_HARDENING_V1 };

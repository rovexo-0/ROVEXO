/**
 * ROVEXO Category Suggestion Engine v1.0 — Catalog Master Edition.
 *
 * STATUS: OWNER APPROVED · RULE-BASED · NO AI · NO AUTO CATEGORY
 *
 * SSOT taxonomy: Catalog Master → getCategoryTree() / categoryTree.
 * Suggests Category → Subcategory → Product Type only.
 * Seller always confirms via Apply. Never auto-selects or overwrites.
 */

import {
  CATEGORY_HIDDEN_ALIASES,
  CATEGORY_KEYWORD_MAP,
  getAliasesForSlug,
  getKeywordsForPath,
} from "@/lib/category-aliases";
import { CATEGORY_SEARCH_SYNONYMS } from "@/lib/categories/search-synonyms";
import { collectLeafPaths } from "@/lib/categories/navigation";
import { resolveCategoryPathBySlugs, toPathId } from "@/lib/categories/queries";
import { categoryTree } from "@/lib/categories/tree";
import type { FlatCategoryPath } from "@/lib/categories/types";
import { flatPathFromSegments } from "@/lib/categories/types";
import { PRODUCT_TYPE_DATABASE } from "@/lib/product-types";
import {
  TITLE_CATEGORY_RULES,
  TITLE_SYNONYMS,
  resolveTitleCategoryPath,
} from "@/lib/sell/title-category-rules";

export const CATEGORY_SUGGESTION_ENGINE_V1 = {
  id: "category-suggestion-engine-v1",
  version: "1.0.0",
  status: "ACTIVE",
  ssot: "lib/catalog/tree.ts",
  method: "deterministic_rules",
  forbidden: [
    "ai",
    "machine_learning",
    "llm",
    "embeddings",
    "vector_search",
    "auto_publish",
    "auto_category",
    "auto_select",
  ] as const,
  ranking: [
    "exact_product_type",
    "exact_alias",
    "exact_synonym",
    "contains",
    "keyword_score",
    "path_confidence",
  ] as const,
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

const MIN_QUERY_LENGTH = 5;

/** Catalog Master–aligned high-precision phrases (deterministic, not AI). */
const CATALOG_PHRASE_RULES: ReadonlyArray<{
  patterns: readonly string[];
  slugs: readonly [string, string, string];
  rank: CategoryMatchRank;
}> = [
  {
    patterns: ["memory foam pillow", "foam pillow", "orthopaedic pillow", "orthopedic pillow"],
    slugs: ["home-garden", "bedding", "pillows"],
    rank: "exact_product_type",
  },
  {
    patterns: ["pillow"],
    slugs: ["home-garden", "bedding", "pillows"],
    rank: "contains",
  },
  {
    patterns: [
      "nike air max",
      "air max",
      "nike trainers",
      "nike sneakers",
      "nike dunk",
      "nike air force",
    ],
    slugs: ["mens-fashion", "shoes", "trainers"],
    rank: "exact_product_type",
  },
  {
    patterns: [
      "adidas ultraboost",
      "ultraboost",
      "adidas trainers",
      "adidas sneakers",
      "stan smith",
    ],
    slugs: ["mens-fashion", "shoes", "trainers"],
    rank: "exact_product_type",
  },
  {
    patterns: ["iphone", "smartphone", "mobile phone"],
    slugs: ["electronics", "phones-tablets", "smartphones"],
    rank: "exact_product_type",
  },
  {
    patterns: ["sleeping bag", "sleepingbag", "camping sleeping bag"],
    slugs: ["sports", "camping", "sleeping-bags"],
    rank: "exact_synonym",
  },
  {
    patterns: ["camping tent", "family tent", "tent"],
    slugs: ["sports", "camping", "tents"],
    rank: "exact_product_type",
  },
  {
    patterns: ["camping"],
    slugs: ["sports", "camping", "sleeping-bags"],
    rank: "exact_product_type",
  },
];

/** Prefer Men's Fashion trainers when menswear brand signals are present. */
const MENS_TRAINER_BRANDS = ["nike", "adidas", "puma", "reebok", "new balance", "jordan"] as const;

type IndexedLeaf = {
  path: FlatCategoryPath;
  pathKey: string;
  leafName: string;
  leafSlug: string;
  leafNorm: string;
  aliases: readonly string[];
  keywords: readonly string[];
  productTypeKeywords: readonly string[];
};

let leafIndex: IndexedLeaf[] | null = null;

function singularize(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (/(ses|xes|zes|ches|shes)$/.test(token)) return token.slice(0, -2);
  if (token.endsWith("ss")) return token;
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function normalizeText(input: string): string {
  let text = input.trim().toLowerCase().replace(/\s+/g, " ");
  for (const [abbrev, full] of Object.entries(TITLE_SYNONYMS)) {
    const pattern = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    text = text.replace(pattern, full);
  }
  // Compound synonym tokens (sleepingbag → camping)
  text = text.replace(/\bsleeping\s*bags?\b/g, " camping ");
  text = text.replace(/\bsleepingbag\b/g, " camping ");
  return text.replace(/\s+/g, " ").trim();
}

function tokenize(text: string): string[] {
  return text
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2)
    .map(singularize);
}

function wholeWordIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (needle.includes(" ")) return haystack.includes(needle);
  const pattern = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return pattern.test(haystack);
}

function buildLeafIndex(): IndexedLeaf[] {
  if (leafIndex) return leafIndex;

  const productBySlug = new Map<string, (typeof PRODUCT_TYPE_DATABASE)[number]>();
  for (const record of PRODUCT_TYPE_DATABASE) {
    productBySlug.set(record.slug, record);
  }

  leafIndex = collectLeafPaths(categoryTree)
    .filter(({ segments }) => !segments.some((segment) => segment.slug === "by-brand"))
    .map(({ segments }) => {
      const path = flatPathFromSegments(segments);
      const leaf = segments[segments.length - 1]!;
      const pathKey = segments.map((segment) => segment.slug).join("/");
      const product = productBySlug.get(leaf.slug);
      const aliases = [
        ...getAliasesForSlug(leaf.slug),
        ...(CATEGORY_HIDDEN_ALIASES[leaf.slug] ?? []),
      ];
      const keywords = [
        ...getKeywordsForPath(pathKey),
        ...(CATEGORY_KEYWORD_MAP[pathKey] ?? []),
        ...(product?.keywords ?? []),
      ];

      return {
        path,
        pathKey,
        leafName: leaf.name,
        leafSlug: leaf.slug,
        leafNorm: normalizeText(leaf.name),
        aliases: [...new Set(aliases.map((alias) => alias.toLowerCase()))],
        keywords: [...new Set(keywords.map((keyword) => keyword.toLowerCase()))],
        productTypeKeywords: product?.keywords.map((keyword) => keyword.toLowerCase()) ?? [],
      } satisfies IndexedLeaf;
    });

  return leafIndex;
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

function patternMatches(title: string, pattern: string): boolean {
  return pattern
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => title.includes(part));
}

function matchTitleRules(normalized: string): CategorySuggestion | null {
  let best: CategorySuggestion | null = null;

  for (const rule of TITLE_CATEGORY_RULES) {
    if (!rule.patterns.every((pattern) => patternMatches(normalized, pattern))) continue;
    const path = resolveTitleCategoryPath(rule.path);
    if (!path) continue;
    // High-confidence title rules rank above generic alias/contains scans.
    const rank: CategoryMatchRank =
      rule.confidence >= 0.95 ? "exact_alias" : "path_confidence";
    const candidate = canonicalize(path, Math.min(rule.confidence, 0.99), rank);
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

function matchPhraseRules(normalized: string): CategorySuggestion | null {
  let best: CategorySuggestion | null = null;

  for (const rule of CATALOG_PHRASE_RULES) {
    if (!rule.patterns.some((pattern) => normalized.includes(pattern))) continue;
    const path = resolveCategoryPathBySlugs([...rule.slugs]);
    if (!path) continue;
    const candidate = canonicalize(path, RANK_CONFIDENCE[rule.rank], rule.rank);
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

function matchCatalogLeaves(normalized: string): CategorySuggestion | null {
  const queryTokens = new Set(tokenize(normalized));
  const expandedTokens = new Set(queryTokens);
  for (const token of queryTokens) {
    const synonym = CATEGORY_SEARCH_SYNONYMS[token];
    if (synonym) {
      for (const extra of tokenize(normalizeText(synonym))) expandedTokens.add(extra);
    }
  }

  let best: CategorySuggestion | null = null;

  const consider = (candidate: CategorySuggestion | null) => {
    if (!candidate) return;
    if (
      !best ||
      RANK_PRIORITY[candidate.rank] > RANK_PRIORITY[best.rank] ||
      (candidate.rank === best.rank && candidate.confidence > best.confidence)
    ) {
      best = candidate;
    }
  };

  for (const leaf of buildLeafIndex()) {
    // 1. Exact product type name
    if (normalized === leaf.leafNorm) {
      consider(
        canonicalize(leaf.path, RANK_CONFIDENCE.exact_product_type, "exact_product_type"),
      );
    } else if (wholeWordIncludes(normalized, leaf.leafNorm) && leaf.leafNorm.length >= 4) {
      // Multi-word queries: only exact_product_type when the leaf phrase is present.
      consider(
        canonicalize(leaf.path, RANK_CONFIDENCE.exact_product_type, "exact_product_type"),
      );
    }

    // Singular leaf slug/token — only when query is short (avoids "fiction" stealing book titles)
    const leafToken = singularize(leaf.leafSlug);
    if (queryTokens.size <= 3 && queryTokens.has(leafToken)) {
      consider(
        canonicalize(leaf.path, RANK_CONFIDENCE.exact_product_type, "exact_product_type"),
      );
    }

    // 2. Exact alias
    for (const alias of leaf.aliases) {
      if (wholeWordIncludes(normalized, alias) || normalized === alias) {
        if (
          leaf.leafSlug === "trainers" &&
          leaf.path.categorySlug === "womens-fashion" &&
          MENS_TRAINER_BRANDS.some((brand) => wholeWordIncludes(normalized, brand))
        ) {
          continue;
        }
        consider(canonicalize(leaf.path, RANK_CONFIDENCE.exact_alias, "exact_alias"));
      }
    }

    // 3. Exact synonym — expanded query tokens vs leaf name/aliases (no nested synonym map)
    const leafTokens = new Set(tokenize(leaf.leafNorm));
    let synonymHit = false;
    for (const token of expandedTokens) {
      if (leafTokens.has(token) || leaf.aliases.some((alias) => singularize(alias) === token)) {
        synonymHit = true;
        break;
      }
    }
    if (synonymHit) {
      consider(canonicalize(leaf.path, RANK_CONFIDENCE.exact_synonym, "exact_synonym"));
    }

    // 4. Contains
    if (leaf.leafNorm.length >= 4 && normalized.includes(leaf.leafNorm)) {
      consider(canonicalize(leaf.path, RANK_CONFIDENCE.contains, "contains"));
    }

    // 5. Keyword score
    let keywordHits = 0;
    for (const keyword of leaf.keywords) {
      if (wholeWordIncludes(normalized, keyword) || normalized.includes(keyword)) {
        keywordHits += keyword.includes(" ") ? 2 : 1;
      }
    }
    if (keywordHits > 0) {
      const confidence = Math.min(0.9, RANK_CONFIDENCE.keyword_score + keywordHits * 0.02);
      consider(canonicalize(leaf.path, confidence, "keyword_score"));
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

/**
 * Suggest the single highest-ranked Catalog Master path for title + description.
 * Never mutates selection — UI must call Apply.
 */
export function suggestCategory(
  title: string,
  description = "",
): CategorySuggestion | null {
  const combined = `${title} ${description}`.trim();
  if (combined.replace(/\s+/g, " ").trim().length < MIN_QUERY_LENGTH) return null;

  const normalized = normalizeText(combined);
  if (!normalized) return null;

  // Warm index once; phrase + title rules short-circuit before full leaf scan.
  const phrase = matchPhraseRules(normalized);
  if (phrase && RANK_PRIORITY[phrase.rank] >= RANK_PRIORITY.exact_alias) {
    return phrase;
  }

  const titleRule = matchTitleRules(normalized);
  if (titleRule && titleRule.confidence >= 0.9) {
    return titleRule;
  }

  buildLeafIndex();
  return pickBest(phrase, titleRule, matchCatalogLeaves(normalized));
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

  // Manual selection kept — only signal a better alternative.
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

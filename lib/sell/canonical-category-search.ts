import { categoryTree } from "@/lib/categories/tree";
import { collectLeafPaths } from "@/lib/categories/navigation";
import { flatPathFromSegments, type FlatCategoryPath } from "@/lib/categories/types";
import { TITLE_SYNONYMS } from "@/lib/sell/title-category-rules";
import { CATEGORY_SEARCH_SYNONYMS } from "@/lib/categories/search-synonyms";

/**
 * Keyword/synonym search over the canonical marketplace tree.
 *
 * Every suggestion it returns is, by construction, a real path in
 * `categoryTree` — the same tree the picker, title rules and server validation
 * use — so anything it emits can always be published. It replaces the previous
 * `detectAiCategory` fallback, which searched a *different* taxonomy
 * (`lib/taxonomy`) and produced slugs that did not exist in the backend.
 *
 * It understands title + description together, singular/plural forms, common
 * UK marketplace terminology, and known misspellings (via TITLE_SYNONYMS), and
 * prefers the most specific (deepest) matching subcategory.
 */

export type CanonicalCategorySuggestion = {
  path: FlatCategoryPath;
  confidence: number;
};

/**
 * Marketplace/UK terminology re-exported from the shared synonym map.
 */
const CATEGORY_SYNONYMS = CATEGORY_SEARCH_SYNONYMS;

type IndexedLeaf = {
  path: FlatCategoryPath;
  depth: number;
  /** Singularised tokens from the leaf (deepest) segment name. */
  leafTokens: Set<string>;
  /** Singularised tokens from every non-root segment name. */
  branchTokens: Set<string>;
};

let indexCache: IndexedLeaf[] | null = null;

function singularize(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (/(ses|xes|zes|ches|shes)$/.test(token)) return token.slice(0, -2);
  if (token.endsWith("ss")) return token;
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2)
    .map(singularize);
}

function expandQueryTokens(text: string): Set<string> {
  const base = tokenize(text);
  const tokens = new Set<string>(base);
  for (const token of base) {
    const synonym = TITLE_SYNONYMS[token] ?? CATEGORY_SYNONYMS[token];
    if (synonym) {
      for (const extra of tokenize(synonym)) tokens.add(extra);
    }
  }
  return tokens;
}

function buildIndex(): IndexedLeaf[] {
  if (indexCache) return indexCache;

  const leaves = collectLeafPaths(categoryTree).filter(
    // "By Brand" chips (e.g. computers → laptops → by-brand → apple) are poor
    // listing categories and match on brand tokens too eagerly; the picker/AI
    // should suggest real product subcategories instead.
    ({ segments }) => !segments.some((segment) => segment.slug === "by-brand"),
  );
  indexCache = leaves.map(({ segments }) => {
    const leafName = segments[segments.length - 1]!.name;
    const branchTokens = new Set<string>();
    segments.slice(1).forEach((segment) => {
      tokenize(segment.name).forEach((token) => branchTokens.add(token));
    });

    return {
      path: flatPathFromSegments(segments),
      depth: segments.length,
      leafTokens: new Set(tokenize(leafName)),
      branchTokens,
    } satisfies IndexedLeaf;
  });

  return indexCache;
}

function scoreConfidence(leafMatches: number, branchMatches: number): number {
  if (leafMatches >= 2) return 0.86;
  if (leafMatches === 1 && branchMatches >= 2) return 0.84;
  if (leafMatches === 1 && branchMatches >= 1) return 0.82;
  if (leafMatches === 1) return 0.76;
  if (branchMatches >= 2) return 0.73;
  return 0.52; // single generic branch hit — possible-match band
}

/**
 * Search the canonical tree for the products described by `title`/`description`.
 * Results are sorted by confidence then specificity (deeper wins ties) and are
 * always valid canonical paths.
 */
export function searchCanonicalCategories(
  title: string,
  description = "",
): CanonicalCategorySuggestion[] {
  const query = expandQueryTokens(`${title} ${description}`.trim());
  if (query.size === 0) return [];

  const index = buildIndex();
  const scored: Array<{ path: FlatCategoryPath; confidence: number; leaf: number; depth: number }> = [];

  for (const entry of index) {
    let leafMatches = 0;
    let branchMatches = 0;
    for (const token of query) {
      if (entry.leafTokens.has(token)) leafMatches += 1;
      if (entry.branchTokens.has(token)) branchMatches += 1;
    }

    // Ignore matches that only hit the root vertical (too generic to be useful).
    if (branchMatches === 0 && leafMatches === 0) continue;

    const confidence = scoreConfidence(leafMatches, branchMatches);
    if (confidence < 0.5) continue;

    scored.push({ path: entry.path, confidence, leaf: leafMatches, depth: entry.depth });
  }

  scored.sort(
    (a, b) =>
      b.confidence - a.confidence || b.leaf - a.leaf || b.depth - a.depth,
  );

  return scored.slice(0, 5).map(({ path, confidence }) => ({ path, confidence }));
}

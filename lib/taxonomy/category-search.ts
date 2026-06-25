import { getCategoryById, getFlatTaxonomy } from "@/lib/taxonomy/category-index";
import { getKeywordMatches } from "@/lib/taxonomy/category-keywords";
import { getSynonymMatches } from "@/lib/taxonomy/category-synonyms";
import { normalizeSearchTerm, tokenize } from "@/lib/taxonomy/category-normalizer";
import type { TaxonomyCategoryNode } from "@/lib/taxonomy/category-tree";

export type CategorySearchHit = {
  token: string;
  source: string;
  score: number;
};

export type CategorySearchResult = {
  category: TaxonomyCategoryNode;
  score: number;
  hits: CategorySearchHit[];
};

export type CategorySearchOptions = {
  limit?: number;
  includeNonLeaf?: boolean;
};

const SOURCE_WEIGHTS: Record<string, number> = {
  name: 45,
  alias: 30,
  keyword: 24,
  brand: 32,
  model: 32,
  slug: 20,
  seo: 18,
  synonym: 16,
};

function scoreKeywordHit(entrySource: string, normalizedToken: string, normalizedPhrase: string): number {
  let score = SOURCE_WEIGHTS[entrySource] ?? 10;
  if (normalizedPhrase === normalizedToken) score += 12;
  if (normalizedPhrase.includes(normalizedToken) && normalizedPhrase !== normalizedToken) score += 6;
  return score;
}

function scoreSynonymHit(entrySource: string): number {
  return SOURCE_WEIGHTS[entrySource] ?? SOURCE_WEIGHTS.synonym;
}

export function searchCategories(query: string, options: CategorySearchOptions = {}): CategorySearchResult[] {
  const normalizedQuery = normalizeSearchTerm(query);
  const tokens = tokenize(normalizedQuery);
  const categoryMap = new Map<string, CategorySearchResult>();

  for (const token of tokens) {
    const keywordEntries = getKeywordMatches(token);
    const synonymEntries = getSynonymMatches(token);

    for (const entry of keywordEntries) {
      const category = getCategoryById(entry.categoryId);
      if (!category || (!options.includeNonLeaf && !category.isLeaf)) continue;
      const score = scoreKeywordHit(entry.source, token, entry.normalized);
      const result = categoryMap.get(category.id) ?? { category, score: 0, hits: [] };
      result.score += score + Math.floor(category.searchWeight / 10);
      result.hits.push({ token, source: entry.source, score });
      categoryMap.set(category.id, result);
    }

    for (const entry of synonymEntries) {
      const category = getCategoryById(entry.categoryId);
      if (!category || (!options.includeNonLeaf && !category.isLeaf)) continue;
      const score = scoreSynonymHit(entry.source);
      const result = categoryMap.get(category.id) ?? { category, score: 0, hits: [] };
      result.score += score + Math.floor(category.searchWeight / 15);
      result.hits.push({ token, source: `synonym:${entry.source}`, score });
      categoryMap.set(category.id, result);
    }
  }

  if (tokens.length === 0) {
    return [];
  }

  const results = Array.from(categoryMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.category.searchWeight !== a.category.searchWeight) return b.category.searchWeight - a.category.searchWeight;
    return b.category.priority - a.category.priority;
  });

  return options.limit ? results.slice(0, options.limit) : results;
}

export function searchTopCategories(query: string, limit = 10): TaxonomyCategoryNode[] {
  return searchCategories(query, { limit, includeNonLeaf: true }).map((result) => result.category);
}

export function searchLeafCategories(query: string, limit = 10): TaxonomyCategoryNode[] {
  return searchCategories(query, { limit, includeNonLeaf: false }).map((result) => result.category);
}

export function getAutocompleteTokens(): string[] {
  const categories = getFlatTaxonomy();
  const tokens = new Set<string>();

  for (const category of categories) {
    tokens.add(normalizeSearchTerm(category.name));
    tokens.add(normalizeSearchTerm(category.slug.replace(/-/g, " ")));
    for (const alias of category.aliases) tokens.add(normalizeSearchTerm(alias));
    for (const keyword of category.keywords) tokens.add(normalizeSearchTerm(keyword));
    for (const brand of category.brands) tokens.add(normalizeSearchTerm(brand));
    for (const model of category.models) tokens.add(normalizeSearchTerm(model));
  }

  return Array.from(tokens).filter(Boolean);
}

import { getFlatTaxonomy } from "@/lib/taxonomy/category-tree";
import { normalizeKeyword, tokenize } from "@/lib/taxonomy/category-normalizer";

export type KeywordSource = "name" | "alias" | "keyword" | "brand" | "model" | "slug";

export type KeywordEntry = {
  token: string;
  normalized: string;
  categoryId: string;
  categorySlug: string;
  categorySeoSlug: string;
  phrase: string;
  source: KeywordSource;
};

export type KeywordIndex = Map<string, KeywordEntry[]>;

function collectPhrases() {
  const entries: KeywordEntry[] = [];

  for (const category of getFlatTaxonomy()) {
    const record = (
      source: KeywordSource,
      phrase: string | undefined | null,
    ) => {
      if (!phrase || !phrase.trim()) return;
      const normalized = normalizeKeyword(phrase);
      const tokens = tokenize(normalized);
      for (const token of tokens) {
        entries.push({
          token,
          normalized,
          categoryId: category.id,
          categorySlug: category.slug,
          categorySeoSlug: category.seoSlug,
          phrase,
          source,
        });
      }
    };

    record("name", category.name);

    for (const alias of category.aliases ?? []) {
      record("alias", alias);
    }

    for (const keyword of category.keywords ?? []) {
      record("keyword", keyword);
    }

    for (const brand of category.brands ?? []) {
      record("brand", brand);
    }

    for (const model of category.models ?? []) {
      record("model", model);
    }

    record("slug", category.slug.replace(/-/g, " "));
  }

  return entries;
}

let keywordEntriesCache: KeywordEntry[] | null = null;

function getKeywordEntries(): KeywordEntry[] {
  if (keywordEntriesCache) return keywordEntriesCache;
  keywordEntriesCache = collectPhrases();
  return keywordEntriesCache;
}

let keywordIndexCache: KeywordIndex | null = null;

function getKeywordIndex(): KeywordIndex {
  if (keywordIndexCache) return keywordIndexCache;
  keywordIndexCache = getKeywordEntries().reduce((map, entry) => {
    const bucket = map.get(entry.token) ?? [];
    bucket.push(entry);
    map.set(entry.token, bucket);
    return map;
  }, new Map<string, KeywordEntry[]>());
  return keywordIndexCache;
}

export function getKeywordMatches(words: string | string[]): KeywordEntry[] {
  const tokens = Array.isArray(words) ? words : tokenize(words);
  const matches: KeywordEntry[] = [];

  for (const token of tokens) {
    const tokenMatches = getKeywordIndex().get(token);
    if (!tokenMatches) continue;
    matches.push(...tokenMatches);
  }

  return matches;
}

export function getCategoryKeywords(categoryId: string): string[] {
  const category = getFlatTaxonomy().find((node) => node.id === categoryId);
  if (!category) return [];

  return [category.name, ...(category.aliases ?? []), ...(category.keywords ?? []), ...(category.brands ?? []), ...(category.models ?? [])]
    .filter(Boolean)
    .map(normalizeKeyword);
}

export function getAllKeywordTokens(): string[] {
  return Array.from(getKeywordIndex().keys());
}

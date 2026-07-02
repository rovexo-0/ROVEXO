import { getFlatTaxonomy } from "@/lib/taxonomy/category-tree";
import {
  MAX_TOKEN_DOCUMENT_FREQUENCY,
  normalizeSearchTerm,
} from "@/lib/taxonomy/category-normalizer";

export type SynonymSource = "name" | "alias" | "keyword" | "brand" | "model" | "slug" | "seo";

export type SynonymEntry = {
  phrase: string;
  normalized: string;
  categoryId: string;
  categorySlug: string;
  categorySeoSlug: string;
  source: SynonymSource;
};

export type SynonymIndex = Map<string, SynonymEntry[]>;

const SYNONYM_ALIASES: Record<string, string[]> = {
  "iphone": ["apple phone", "ios phone", "iphone phone"],
  "travel pillow": ["airplane pillow", "flight pillow", "neck pillow", "travel cushion"],
  "jewellery": ["jewelry"],
  "colour": ["color"],
  "defence": ["defense"],
  "favourite": ["favorite"],
  "tyre": ["tire"],
  "organise": ["organize"],
  "organisation": ["organization"],
  "theatre": ["theater"],
};

function normalizeSynonymPhrase(phrase: string): string {
  return normalizeSearchTerm(phrase);
}

function collectSynonymEntries() {
  const entries: SynonymEntry[] = [];

  for (const category of getFlatTaxonomy()) {
    const record = (source: SynonymSource, phrase: string | undefined | null) => {
      if (!phrase || !phrase.trim()) return;
      const normalized = normalizeSynonymPhrase(phrase);
      entries.push({
        phrase,
        normalized,
        categoryId: category.id,
        categorySlug: category.slug,
        categorySeoSlug: category.seoSlug,
        source,
      });
    };

    record("name", category.name);
    for (const alias of category.aliases ?? []) record("alias", alias);
    for (const keyword of category.keywords ?? []) record("keyword", keyword);
    for (const brand of category.brands ?? []) record("brand", brand);
    for (const model of category.models ?? []) record("model", model);
    record("slug", category.slug.replace(/-/g, " "));
    record("seo", category.seoSlug.replace(/\//g, " "));
  }

  for (const [, synonyms] of Object.entries(SYNONYM_ALIASES)) {
    for (const synonym of synonyms) {
      entries.push({
        phrase: synonym,
        normalized: normalizeSynonymPhrase(synonym),
        categoryId: "ai:alias",
        categorySlug: "ai-synonym",
        categorySeoSlug: "ai-synonym",
        source: "alias",
      });
    }
  }

  return entries;
}

let synonymEntriesCache: SynonymEntry[] | null = null;

function getSynonymEntriesList(): SynonymEntry[] {
  if (synonymEntriesCache) return synonymEntriesCache;
  synonymEntriesCache = collectSynonymEntries();
  return synonymEntriesCache;
}

let synonymIndexCache: SynonymIndex | null = null;

function getSynonymIndex(): SynonymIndex {
  if (synonymIndexCache) return synonymIndexCache;
  synonymIndexCache = getSynonymEntriesList().reduce((map, entry) => {
    const bucket = map.get(entry.normalized) ?? [];
    bucket.push(entry);
    map.set(entry.normalized, bucket);
    return map;
  }, new Map<string, SynonymEntry[]>());
  return synonymIndexCache;
}

export function getSynonymEntries(term: string): SynonymEntry[] {
  const normalized = normalizeSynonymPhrase(term);
  return getSynonymIndex().get(normalized) ?? [];
}

/**
 * Token → entries inverted index. Every synonym phrase is split into its
 * component words so a query token can be matched in O(1), mirroring the
 * keyword index. Replaces the previous full-index substring scan that was
 * O(indexSize × tokens) and returned tens of thousands of false matches
 * (e.g. token "in" matched every phrase containing the substring "in").
 */
let synonymTokenIndexCache: Map<string, SynonymEntry[]> | null = null;

function getSynonymTokenIndex(): Map<string, SynonymEntry[]> {
  if (synonymTokenIndexCache) return synonymTokenIndexCache;

  const index = new Map<string, SynonymEntry[]>();
  for (const entry of getSynonymEntriesList()) {
    const tokens = entry.normalized.split(" ").filter(Boolean);
    const seen = new Set<string>();
    for (const token of tokens) {
      if (seen.has(token)) continue;
      seen.add(token);
      const bucket = index.get(token);
      if (bucket) {
        bucket.push(entry);
      } else {
        index.set(token, [entry]);
      }
    }
  }

  synonymTokenIndexCache = index;
  return index;
}

export function getSynonymMatches(term: string): SynonymEntry[] {
  const tokenIndex = getSynonymTokenIndex();
  const results = new Map<string, SynonymEntry>();

  for (const token of normalizeSynonymPhrase(term).split(" ").filter(Boolean)) {
    const bucket = tokenIndex.get(token);
    if (!bucket) continue;
    // Skip non-discriminating tokens that match a huge share of the taxonomy.
    if (bucket.length > MAX_TOKEN_DOCUMENT_FREQUENCY) continue;
    for (const entry of bucket) {
      results.set(`${entry.categoryId}:${entry.phrase}:${entry.source}`, entry);
    }
  }

  return Array.from(results.values());
}

export function getSynonymMap(): SynonymIndex {
  return getSynonymIndex();
}

export function getAllSynonymPhrases(): string[] {
  return Array.from(new Set(getSynonymEntriesList().map((entry) => entry.normalized)));
}

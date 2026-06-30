import { getFlatTaxonomy } from "@/lib/taxonomy/category-tree";
import { normalizeSearchTerm } from "@/lib/taxonomy/category-normalizer";

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

export function getSynonymMatches(term: string): SynonymEntry[] {
  const normalized = normalizeSynonymPhrase(term);
  const results = new Map<string, SynonymEntry>();

  for (const [key, entries] of getSynonymIndex().entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      for (const entry of entries) {
        results.set(`${entry.categoryId}:${entry.phrase}:${entry.source}`, entry);
      }
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

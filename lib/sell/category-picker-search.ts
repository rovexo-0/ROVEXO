import { categoryTree } from "@/lib/categories/tree";
import { collectLeafPaths } from "@/lib/categories/navigation";
import {
  formatCategoryPathLabel,
  flatPathFromSegments,
  type CategorySegment,
  type FlatCategoryPath,
} from "@/lib/categories/types";
import {
  CATEGORY_SEARCH_SYNONYMS,
  CATEGORY_SEGMENT_ALIASES,
  expandSearchSynonyms,
} from "@/lib/categories/search-synonyms";

/**
 * Manual, database-only category search over the canonical marketplace tree —
 * the exact same tree the picker, publish payload and server validation use, so
 * every result is guaranteed to be publishable.
 *
 * There is NO AI here. Matching is pure text: category/subcategory names,
 * singular/plural forms, UK/US spellings and the shared synonym map.
 * Results include Vinted-style hierarchical suggestions (root → branch → leaf).
 */

export type CategoryPickerResult = {
  path: FlatCategoryPath;
  /** Matched segment name shown as the primary label (root, branch or leaf). */
  matchName: string;
  /** Depth of the matched segment (1 = category, 2 = subcategory, 3 = product type). */
  matchDepth: number;
  /** Full breadcrumb, e.g. "Phones > Smartphones > Apple iPhone". */
  breadcrumb: string;
  /** @deprecated Use matchName — kept for callers expecting leafName. */
  leafName: string;
};

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

function expandTokens(tokens: string[]): Set<string> {
  const expanded = new Set<string>(tokens);
  for (const token of tokens) {
    for (const extra of expandSearchSynonyms(token)) expanded.add(singularize(extra));
    const alias = CATEGORY_SEARCH_SYNONYMS[token];
    if (alias) for (const extra of tokenize(alias)) expanded.add(extra);
  }
  return expanded;
}

function segmentSearchTokens(segment: CategorySegment): Set<string> {
  const tokens = new Set(tokenize(segment.name));
  tokenize(segment.slug.replace(/-/g, " ")).forEach((token) => tokens.add(token));
  for (const alias of CATEGORY_SEGMENT_ALIASES[segment.slug] ?? []) {
    tokenize(alias).forEach((token) => tokens.add(token));
  }
  return tokens;
}

type IndexedSegment = {
  path: FlatCategoryPath;
  matchName: string;
  matchDepth: number;
  segmentSlug: string;
  breadcrumb: string;
  tokens: Set<string>;
  nameLower: string;
};

let indexCache: IndexedSegment[] | null = null;

/** Clear the warmed search index (tests / hot reload). */
export function invalidateCategoryPickerIndex(): void {
  indexCache = null;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + cost);
      previous = temp;
    }
  }
  return row[b.length]!;
}

function fuzzyTokenMatches(queryToken: string, entryTokens: Set<string>): boolean {
  if (entryTokens.has(queryToken)) return true;
  if (queryToken.length < 3) return false;
  const maxDistance = queryToken.length <= 4 ? 1 : 2;
  for (const token of entryTokens) {
    if (Math.abs(token.length - queryToken.length) > maxDistance) continue;
    if (levenshtein(queryToken, token) <= maxDistance) return true;
  }
  return false;
}

function buildIndex(): IndexedSegment[] {
  if (indexCache) return indexCache;

  const leaves = collectLeafPaths(categoryTree).filter(
    ({ segments }) => !segments.some((segment) => segment.slug === "by-brand"),
  );

  const entries: IndexedSegment[] = [];

  for (const { segments } of leaves) {
    const path = flatPathFromSegments(segments);
    const breadcrumb = formatCategoryPathLabel(segments);

    segments.forEach((segment, index) => {
      entries.push({
        path,
        matchName: segment.name,
        matchDepth: index + 1,
        segmentSlug: segment.slug,
        breadcrumb,
        tokens: segmentSearchTokens(segment),
        nameLower: segment.name.toLowerCase(),
      });
    });
  }

  indexCache = entries;
  return indexCache;
}

/** Warm the search index off the keystroke path (idle / mount). */
export function warmCategoryPickerIndex(): void {
  buildIndex();
}

const RESULT_LIMIT = 40;

function scoreEntry(entry: IndexedSegment, trimmed: string, queryTokens: Set<string>): number {
  let score = 0;

  if (entry.nameLower === trimmed) score += 1000;
  else if (entry.nameLower.startsWith(trimmed)) score += 500;
  else if (entry.nameLower.includes(trimmed)) score += 220;

  for (const token of queryTokens) {
    if (entry.tokens.has(token)) score += 70;
    else if (fuzzyTokenMatches(token, entry.tokens)) score += 42;
  }

  // Prefer the most specific segment when the query is a short prefix.
  if (trimmed.length <= 4 && entry.matchDepth >= 3) score += 12;

  return score;
}

export function searchCategoryPicker(query: string): CategoryPickerResult[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const baseTokens = tokenize(trimmed);
  if (baseTokens.length === 0) return [];
  const queryTokens = expandTokens(baseTokens);

  const index = buildIndex();
  const scored = new Map<string, { entry: IndexedSegment; score: number }>();

  for (const entry of index) {
    const score = scoreEntry(entry, trimmed, queryTokens);
    if (score <= 0) continue;

    const key = `${entry.segmentSlug}:${entry.path.segments.map((segment) => segment.slug).join("/")}:${entry.matchDepth}`;
    const existing = scored.get(key);
    if (!existing || score > existing.score) {
      scored.set(key, { entry, score });
    }
  }

  const ranked = [...scored.values()].sort(
    (a, b) =>
      b.score - a.score ||
      a.entry.matchDepth - b.entry.matchDepth ||
      a.entry.matchName.localeCompare(b.entry.matchName),
  );

  const seenLevels = new Set<string>();
  const diverse: Array<{ entry: IndexedSegment; score: number }> = [];
  for (const item of ranked) {
    const levelKey = `${item.entry.matchDepth}:${item.entry.segmentSlug}`;
    if (seenLevels.has(levelKey)) continue;
    seenLevels.add(levelKey);
    diverse.push(item);
    if (diverse.length >= RESULT_LIMIT) break;
  }

  return diverse.map(({ entry }) => ({
    path: entry.path,
    matchName: entry.matchName,
    matchDepth: entry.matchDepth,
    breadcrumb: entry.breadcrumb,
    leafName: entry.matchName,
  }));
}

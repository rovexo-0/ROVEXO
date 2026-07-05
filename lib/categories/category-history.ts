/**
 * Per-user category selection history for Sell picker shortcuts.
 * Persists recent and frequent paths in localStorage — no API changes required.
 */

import { categoryTree } from "@/lib/categories/tree";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import { collectLeafPaths } from "@/lib/categories/navigation";
import { flatPathFromSegments, type FlatCategoryPath } from "@/lib/categories/types";

const STORAGE_KEY = "rovexo-category-history-v1";
const MAX_ENTRIES = 40;

type StoredEntry = {
  slugs: string[];
  usedAt: number;
  count: number;
};

type StoredHistory = {
  entries: StoredEntry[];
};

function readHistory(): StoredHistory {
  if (typeof window === "undefined") return { entries: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as StoredHistory;
    if (!Array.isArray(parsed.entries)) return { entries: [] };
    return parsed;
  } catch {
    return { entries: [] };
  }
}

function writeHistory(history: StoredHistory): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function resolveStoredCategoryPath(slugs: string[]): FlatCategoryPath | null {
  if (slugs.length < 2) return null;
  return resolveCategoryPathBySlugs(slugs);
}

export function recordCategorySelection(path: FlatCategoryPath): void {
  if (typeof window === "undefined") return;

  const slugs = path.segments.map((segment) => segment.slug);
  const history = readHistory();
  const key = slugs.join("/");
  const now = Date.now();

  const existing = history.entries.find((entry) => entry.slugs.join("/") === key);
  if (existing) {
    existing.usedAt = now;
    existing.count += 1;
  } else {
    history.entries.push({ slugs, usedAt: now, count: 1 });
  }

  history.entries.sort((a, b) => b.usedAt - a.usedAt);
  if (history.entries.length > MAX_ENTRIES) {
    history.entries = history.entries.slice(0, MAX_ENTRIES);
  }

  writeHistory(history);
}

function pathsFromEntries(entries: StoredEntry[]): FlatCategoryPath[] {
  const paths: FlatCategoryPath[] = [];
  for (const entry of entries) {
    const path = resolveStoredCategoryPath(entry.slugs);
    if (path) paths.push(path);
  }
  return paths;
}

export function getRecentCategoryPaths(limit = 6): FlatCategoryPath[] {
  const history = readHistory();
  return pathsFromEntries(history.entries.slice(0, limit));
}

export function getFrequentCategoryPaths(limit = 6): FlatCategoryPath[] {
  const history = readHistory();
  const ranked = [...history.entries].sort((a, b) => b.count - a.count || b.usedAt - a.usedAt);
  return pathsFromEntries(ranked.slice(0, limit));
}

/** Platform defaults — one representative leaf per top-level category. */
export function getPopularCategoryPaths(limit = 8): FlatCategoryPath[] {
  const paths: FlatCategoryPath[] = [];
  for (const root of categoryTree.slice(0, limit)) {
    const firstLeaf = collectLeafPaths([root])[0];
    if (firstLeaf) paths.push(flatPathFromSegments(firstLeaf.segments));
  }
  return paths;
}

const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Recently selected paths weighted by frequency within the last 7 days. */
export function getTrendingCategoryPaths(limit = 6): FlatCategoryPath[] {
  const history = readHistory();
  const now = Date.now();
  const ranked = [...history.entries]
    .filter((entry) => now - entry.usedAt <= TRENDING_WINDOW_MS)
    .sort(
      (a, b) =>
        b.count * 3 + b.usedAt - (a.count * 3 + a.usedAt) ||
        b.usedAt - a.usedAt,
    );
  return pathsFromEntries(ranked.slice(0, limit));
}

function pathKey(path: FlatCategoryPath): string {
  return path.segments.map((segment) => segment.slug).join("/");
}

/** Suggest related leaves from frequent roots, then fill with platform defaults. */
export function getRecommendedCategoryPaths(limit = 6): FlatCategoryPath[] {
  const frequent = getFrequentCategoryPaths(limit);
  const popular = getPopularCategoryPaths(limit);
  const recommended: FlatCategoryPath[] = [];
  const seen = new Set<string>();

  const pushUnique = (path: FlatCategoryPath) => {
    const key = pathKey(path);
    if (seen.has(key)) return;
    seen.add(key);
    recommended.push(path);
  };

  for (const path of frequent) pushUnique(path);

  for (const path of frequent) {
    if (recommended.length >= limit) break;
    const root = categoryTree.find((node) => node.slug === path.categorySlug);
    if (!root) continue;
    const leaves = collectLeafPaths([root]);
    for (const leaf of leaves) {
      if (recommended.length >= limit) break;
      pushUnique(flatPathFromSegments(leaf.segments));
    }
  }

  for (const path of popular) {
    if (recommended.length >= limit) break;
    pushUnique(path);
  }

  return recommended.slice(0, limit);
}

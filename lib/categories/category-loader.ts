import { getCategoryTree } from "@/lib/categories/queries";
import type { CategoryNode } from "@/lib/categories/types";

const CACHE_KEY = "rovexo:category-tree:v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RETRY_DELAY_MS = 400;

export type CategoryTreeSource = "cache" | "api" | "static";

export type CategoryLoadResult = {
  tree: CategoryNode[];
  source: CategoryTreeSource;
  recovered: boolean;
};

type CachedTreePayload = {
  tree: CategoryNode[];
  savedAt: number;
};

function readSessionCache(): CategoryNode[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw) as CachedTreePayload;
    if (!Array.isArray(payload.tree) || !payload.savedAt) return null;
    if (Date.now() - payload.savedAt > CACHE_TTL_MS) return null;

    return payload.tree;
  } catch {
    return null;
  }
}

export function writeCategoryTreeCache(tree: CategoryNode[]): void {
  if (typeof window === "undefined") return;

  try {
    const payload: CachedTreePayload = { tree, savedAt: Date.now() };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Storage may be unavailable — listing flow continues with static tree.
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchCategoryTreeFromApi(attempt: number): Promise<CategoryNode[]> {
  const response = await fetch("/api/categories/tree", {
    cache: "no-store",
    headers: attempt > 0 ? { "x-rovexo-category-retry": String(attempt) } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Category API failed (${response.status})`);
  }

  const payload = (await response.json()) as { tree?: CategoryNode[] };
  if (!payload.tree?.length) {
    throw new Error("Category API returned an empty tree");
  }

  return payload.tree;
}

export async function loadCategoriesWithRecovery(maxAttempts = 3): Promise<CategoryLoadResult> {
  const cached = readSessionCache();
  if (cached?.length) {
    return { tree: cached, source: "cache", recovered: false };
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const tree = await fetchCategoryTreeFromApi(attempt);
      writeCategoryTreeCache(tree);
      return { tree, source: "api", recovered: attempt > 0 };
    } catch {
      if (attempt < maxAttempts - 1) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  const tree = getCategoryTree();
  return { tree, source: "static", recovered: true };
}

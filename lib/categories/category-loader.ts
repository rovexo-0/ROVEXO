import { getCategoryTree } from "@/lib/categories/queries";
import { isCatalogMasterRootTree } from "@/lib/categories/is-catalog-master-tree";
import {
  getCatalogMasterCacheKey,
  CATALOG_MASTER_PROTECTION_V1,
} from "@/lib/catalog/catalog-master-protection-v1";
import type { CategoryNode } from "@/lib/categories/types";

/**
 * Absolute Law XXXI — only Catalog Master may be cached.
 * Cache key epoch changes when Catalog Master version/law changes → auto-invalidates legacy.
 * Legacy cache keys (v1, v2-catalog-master without epoch) are never read.
 */
const CACHE_KEY = getCatalogMasterCacheKey();
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
  epoch: string;
};

function catalogMasterStaticTree(): CategoryNode[] {
  return getCategoryTree();
}

function acceptCatalogTree(tree: CategoryNode[] | null | undefined): CategoryNode[] | null {
  if (!tree?.length) return null;
  return isCatalogMasterRootTree(tree) ? tree : null;
}

function readSessionCache(): CategoryNode[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw) as CachedTreePayload;
    if (!Array.isArray(payload.tree) || !payload.savedAt) return null;
    if (payload.epoch !== CATALOG_MASTER_PROTECTION_V1.cacheEpoch) return null;
    if (Date.now() - payload.savedAt > CACHE_TTL_MS) return null;

    return acceptCatalogTree(payload.tree);
  } catch {
    return null;
  }
}

export function writeCategoryTreeCache(tree: CategoryNode[]): void {
  if (typeof window === "undefined") return;
  if (!isCatalogMasterRootTree(tree)) return;

  try {
    // Purge any legacy category-tree session keys from older Catalog Master epochs.
    for (let i = window.sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = window.sessionStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith("rovexo:category-tree:") &&
        key !== CACHE_KEY
      ) {
        window.sessionStorage.removeItem(key);
      }
    }

    const payload: CachedTreePayload = {
      tree,
      savedAt: Date.now(),
      epoch: CATALOG_MASTER_PROTECTION_V1.cacheEpoch,
    };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Storage may be unavailable — listing flow continues with static Catalog Master.
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
  const tree = acceptCatalogTree(payload.tree);
  if (!tree) {
    // Law XXXI: never silently accept legacy — reject and recover via Catalog Master static.
    throw new Error("Category API returned a non-Catalog-Master tree");
  }

  return tree;
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

  // Fail closed to Catalog Master static — never to legacy taxonomy.
  const tree = catalogMasterStaticTree();
  return { tree, source: "static", recovered: true };
}

export const CATEGORY_TREE_CACHE_KEY = CACHE_KEY;

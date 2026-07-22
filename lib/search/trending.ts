import { getPopularSearches } from "@/lib/search/popular-searches";
import { withSearchCache } from "@/lib/search/cache";
import type { Product } from "@/lib/products/types";

function deriveTermFromProduct(product: Product): string | null {
  const candidate =
    product.brand?.trim() || product.title.trim().split(/\s+/).slice(0, 3).join(" ");
  if (!candidate || candidate.length < 2) return null;
  return candidate;
}

async function loadTrendingSearches(
  fallbackProducts: Product[],
  limit: number,
): Promise<string[]> {
  let popular: string[] = [];
  try {
    popular = await getPopularSearches(limit);
  } catch {
    popular = [];
  }

  const terms = new Set<string>(popular);
  if (terms.size < limit) {
    for (const product of fallbackProducts) {
      const term = deriveTermFromProduct(product);
      if (term) terms.add(term);
      if (terms.size >= limit) break;
    }
  }

  return [...terms].slice(0, limit);
}

/**
 * Trending searches — automatic from live marketplace signals only.
 * Cache fail-safe → database/popular loader. Never admin-edited.
 */
export async function getTrendingSearches(
  fallbackProducts: Product[] = [],
  limit = 8,
): Promise<string[]> {
  const fallbackKey = fallbackProducts
    .slice(0, 4)
    .map((product) => product.id)
    .join(",");

  return withSearchCache(
    "trending",
    `limit:${limit}:fb:${fallbackKey}`,
    () => loadTrendingSearches(fallbackProducts, limit),
    { ttlMs: 60_000, emptyOnError: [] },
  );
}

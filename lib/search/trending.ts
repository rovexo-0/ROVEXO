import { getPopularSearches } from "@/lib/search/popular-searches";
import type { Product } from "@/lib/products/types";

function deriveTermFromProduct(product: Product): string | null {
  const candidate =
    product.brand?.trim() || product.title.trim().split(/\s+/).slice(0, 3).join(" ");
  if (!candidate || candidate.length < 2) return null;
  return candidate;
}

/**
 * Trending searches sourced entirely from live marketplace signals — popular
 * listings first, then the freshest published listings as a real fallback.
 * Never returns hardcoded terms; if the marketplace is empty, so is trending.
 */
export async function getTrendingSearches(
  fallbackProducts: Product[] = [],
  limit = 8,
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

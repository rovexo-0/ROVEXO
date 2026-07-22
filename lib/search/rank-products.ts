import type { Product } from "@/lib/products/types";
import { SEARCH_ENGINE_V1 } from "@/lib/search/search-engine-v1";

/**
 * Deterministic Search Engine v1.0 ranking — no random, no admin weights.
 * Priority: Exact → Category → Title → Attribute → Brand → Store → Popular → Trending → Similar → Related
 */

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function scoreProductMatch(product: Product, query: string): number {
  const q = norm(query);
  if (!q) return 0;

  const title = norm(product.title);
  const brand = norm(product.brand);
  const condition = norm(product.condition);
  const seller = norm(product.sellerName);
  const sellerUser = norm(product.sellerUsername);
  const categories = (product.categoryBreadcrumbs ?? []).map((crumb) => norm(crumb.name));

  let score = 0;

  // 1 Exact match
  if (title === q || brand === q) score += 10_000;

  // 2 Category match
  if (categories.some((name) => name === q || name.includes(q))) score += 8_000;

  // 3 Title match
  if (title.startsWith(q)) score += 6_500;
  else if (title.includes(q)) score += 5_000;
  else {
    const words = q.split(/\s+/).filter(Boolean);
    const hitCount = words.filter((word) => title.includes(word)).length;
    if (hitCount > 0) score += 2_000 + hitCount * 400;
  }

  // 4 Attribute match (condition / listing attributes available on card)
  if (condition === q || condition.includes(q)) score += 3_500;

  // 5 Brand match
  if (brand && brand !== q) {
    if (brand.startsWith(q)) score += 3_000;
    else if (brand.includes(q)) score += 2_400;
  }

  // 6 Store / member match
  if (seller === q || sellerUser === q) score += 2_200;
  else if (seller.includes(q) || sellerUser.includes(q)) score += 1_600;

  // 7 Popular match (views + ratings — automatic signals)
  score += Math.min(800, Math.floor((product.views ?? 0) / 5));
  score += Math.min(400, Math.floor((product.rating ?? 0) * 40));
  score += Math.min(200, Math.floor((product.reviewCount ?? 0) * 8));

  // 8 Trending / promotion windows (automatic marketplace signals only)
  score += Math.min(300, Math.floor((product.promotionScore ?? 0) / 10));
  if (product.isFeatured || product.isBumped) score += 120;

  // 9 Similar / related — soft token overlap beyond primary title hits
  const tokens = new Set(title.split(/\s+/).filter((token) => token.length > 2));
  for (const word of q.split(/\s+/)) {
    if (word.length > 2 && tokens.has(word)) score += 80;
  }

  return score;
}

export function rankSearchProducts(products: Product[], query: string): Product[] {
  if (!query.trim() || products.length <= 1) return products;

  const scored = products.map((product, index) => ({
    product,
    index,
    score: scoreProductMatch(product, query),
  }));

  scored.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    // Stable tie-break — never random
    return left.index - right.index;
  });

  return scored.map((entry) => entry.product);
}

/** Guard: ranking priority contract matches freeze order. */
export function getSearchResultPriority(): readonly string[] {
  return SEARCH_ENGINE_V1.resultPriority;
}

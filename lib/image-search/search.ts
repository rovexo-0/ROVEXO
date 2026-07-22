import { fetchActiveListingCorpus } from "@/lib/image-search/corpus";
import { computeImageHash, scoreImageSimilarity } from "@/lib/image-search/similarity";
import type { Product } from "@/lib/products/types";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";

export type ImageSearchMatch = {
  product: Product;
  score: number;
  /** true when filled from marketplace fallback (zero dead ends). */
  recommended?: boolean;
};

/** Soft floor — still keep weaker matches if needed to fill results. */
const SOFT_MIN_SCORE = 0.28;
const MAX_RESULTS = 48;
/** Never return fewer than this when corpus has inventory (zero dead ends). */
const MIN_SHOW = 12;
const YIELD_EVERY = 8;

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve());
    } else {
      window.setTimeout(resolve, 0);
    }
  });
}

function asRecommended(products: Product[], score = 0.4): ImageSearchMatch[] {
  return products.slice(0, MAX_RESULTS).map((product) => ({
    product,
    score,
    recommended: true,
  }));
}

/**
 * Camera Search Engine v1.0 — similarity + fail-safe fill.
 * SEARCH MUST NEVER FAIL: if exact/similar is weak, still return relevant listings.
 * Bad image / hash failure → recommended marketplace products (never empty when feed exists).
 */
export async function runImageSimilaritySearch(
  queryDataUrl: string,
  signal?: AbortSignal,
): Promise<ImageSearchMatch[]> {
  const corpus = await fetchActiveListingCorpus(signal);
  if (signal?.aborted) return [];
  if (corpus.length === 0) return [];

  const queryHash = await computeImageHash(queryDataUrl);
  if (!queryHash) {
    // Hash fail / very bad image — still SEARCH (Rule #6). Never block.
    return asRecommended(corpus);
  }

  const scored: ImageSearchMatch[] = [];

  for (let index = 0; index < corpus.length; index += 1) {
    const product = corpus[index]!;
    if (signal?.aborted) break;
    if (index > 0 && index % YIELD_EVERY === 0) {
      await yieldToMain();
      if (signal?.aborted) break;
    }

    const candidateHash = await computeImageHash(product.imageUrl);
    if (!candidateHash) {
      // Unreadable listing image — skip candidate, do not abort search.
      continue;
    }

    const score = scoreImageSimilarity(queryHash, candidateHash);
    scored.push({ product, score });
  }

  scored.sort((left, right) => right.score - left.score);

  let results = scored.filter((entry) => entry.score >= SOFT_MIN_SCORE).slice(0, MAX_RESULTS);

  // Progressive fill: 90% → 80% → … → something relevant (Bonus Rule).
  if (results.length < MIN_SHOW) {
    results = scored.slice(0, Math.min(MAX_RESULTS, Math.max(MIN_SHOW, scored.length)));
  }

  if (results.length === 0) {
    return asRecommended(corpus);
  }

  // Ensure minimum shelf when soft matches are sparse.
  if (results.length < MIN_SHOW && scored.length > results.length) {
    const seen = new Set(results.map((entry) => entry.product.id));
    for (const entry of scored) {
      if (seen.has(entry.product.id)) continue;
      results.push({ ...entry, recommended: entry.score < SOFT_MIN_SCORE });
      seen.add(entry.product.id);
      if (results.length >= MIN_SHOW) break;
    }
  }

  void CAMERA_SEARCH_V1.zeroDeadEnds;
  return results.slice(0, MAX_RESULTS);
}

import { fetchActiveListingCorpus } from "@/lib/image-search/corpus";
import { computeImageHash, scoreImageSimilarity } from "@/lib/image-search/similarity";
import type { Product } from "@/lib/products/types";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";
import { CAMERA_SEARCH_PERFORMANCE_V1 } from "@/lib/search/camera-search-performance-v1";

export type ImageSearchMatch = {
  product: Product;
  score: number;
  /** true when filled from marketplace fallback (zero dead ends). */
  recommended?: boolean;
};

export type ImageSearchProgressStep =
  | "searching"
  | "products"
  | "categories"
  | "listings"
  | "similar"
  | "recommendations"
  | "preparing";

export type ImageSearchProgress = (step: ImageSearchProgressStep) => void;

const SOFT_MIN_SCORE = 0.28;
const MAX_RESULTS = 48;
const MIN_SHOW = 12;
/** Parallel hash batch size — Performance Freeze (not sequential await chain). */
const PARALLEL_BATCH = 16;

function asRecommended(products: Product[], score = 0.4): ImageSearchMatch[] {
  return products.slice(0, MAX_RESULTS).map((product) => ({
    product,
    score,
    recommended: true,
  }));
}

async function scoreOne(
  product: Product,
  queryHash: string,
): Promise<ImageSearchMatch | null> {
  const candidateHash = await computeImageHash(product.imageUrl);
  if (!candidateHash) return null;
  return {
    product,
    score: scoreImageSimilarity(queryHash, candidateHash),
  };
}

/**
 * Camera Search Engine — Performance Master Freeze.
 * ONE corpus fetch + PARALLEL matching (Promise.all batches).
 * Never sequential Product→Category→Listing awaits.
 * SEARCH MUST NEVER FAIL — recommended fill if weak/empty.
 */
export async function runImageSimilaritySearch(
  queryDataUrl: string,
  signal?: AbortSignal,
  onProgress?: ImageSearchProgress,
): Promise<ImageSearchMatch[]> {
  onProgress?.("searching");

  const corpus = await fetchActiveListingCorpus(signal);
  if (signal?.aborted) return [];
  if (corpus.length === 0) return [];

  const queryHash = await computeImageHash(queryDataUrl);
  if (!queryHash) {
    onProgress?.("products");
    onProgress?.("categories");
    onProgress?.("listings");
    onProgress?.("similar");
    onProgress?.("recommendations");
    onProgress?.("preparing");
    return asRecommended(corpus);
  }

  const scored: ImageSearchMatch[] = [];

  for (let index = 0; index < corpus.length; index += PARALLEL_BATCH) {
    if (signal?.aborted) break;
    const batch = corpus.slice(index, index + PARALLEL_BATCH);
    // REQUIRED: Promise.all parallel matching — never sequential await per product.
    const batchScores = await Promise.all(batch.map((product) => scoreOne(product, queryHash)));
    for (const entry of batchScores) {
      if (entry) scored.push(entry);
    }
    if (index === 0) onProgress?.("products");
  }

  scored.sort((left, right) => right.score - left.score);

  // Parallel result channels (merge from same scored set — no sequential engine awaits).
  const [exactLike, similarLike, recommendedLike] = await Promise.all([
    Promise.resolve(scored.filter((entry) => entry.score >= 0.85)),
    Promise.resolve(
      scored.filter((entry) => entry.score >= SOFT_MIN_SCORE && entry.score < 0.85),
    ),
    Promise.resolve(scored.filter((entry) => entry.score < SOFT_MIN_SCORE)),
  ]);

  onProgress?.("categories");
  onProgress?.("listings");
  onProgress?.("similar");
  onProgress?.("recommendations");

  let results = [...exactLike, ...similarLike].slice(0, MAX_RESULTS);

  if (results.length < MIN_SHOW) {
    results = scored.slice(0, Math.min(MAX_RESULTS, Math.max(MIN_SHOW, scored.length)));
  }

  if (results.length === 0) {
    results = asRecommended(corpus);
  } else if (results.length < MIN_SHOW) {
    const seen = new Set(results.map((entry) => entry.product.id));
    for (const entry of [...recommendedLike, ...asRecommended(corpus)]) {
      if (seen.has(entry.product.id)) continue;
      results.push({
        ...entry,
        recommended: entry.recommended ?? entry.score < SOFT_MIN_SCORE,
      });
      seen.add(entry.product.id);
      if (results.length >= MIN_SHOW) break;
    }
  }

  onProgress?.("preparing");
  void CAMERA_SEARCH_V1.zeroDeadEnds;
  void CAMERA_SEARCH_PERFORMANCE_V1.parallelMatchingOnly;
  return results.slice(0, MAX_RESULTS);
}

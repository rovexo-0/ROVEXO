import { fetchActiveListingCorpus } from "@/lib/image-search/corpus";
import { computeImageHash, scoreImageSimilarity } from "@/lib/image-search/similarity";
import type {
  CameraSearchFilters,
  CameraSearchResultsPayload,
} from "@/lib/image-search/results-store";
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
  | "validating"
  | "products"
  | "similar"
  | "preparing";

export type ImageSearchProgress = (step: ImageSearchProgressStep) => void;

const EXACT_SCORE = 0.85;
const SOFT_MIN_SCORE = 0.28;
const MAX_RESULTS = 48;
const MIN_SHOW = 12;
const PARALLEL_BATCH = 16;

function priceBucket(price: number): string {
  if (price < 25) return "Under £25";
  if (price < 50) return "£25–£50";
  if (price < 100) return "£50–£100";
  if (price < 250) return "£100–£250";
  return "£250+";
}

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

async function scoreCorpus(
  corpus: Product[],
  queryDataUrl: string | null,
  signal?: AbortSignal,
): Promise<ImageSearchMatch[]> {
  if (!queryDataUrl) return asRecommended(corpus);

  const queryHash = await computeImageHash(queryDataUrl);
  if (!queryHash) return asRecommended(corpus);

  const scored: ImageSearchMatch[] = [];
  for (let index = 0; index < corpus.length; index += PARALLEL_BATCH) {
    if (signal?.aborted) break;
    const batch = corpus.slice(index, index + PARALLEL_BATCH);
    const batchScores = await Promise.all(batch.map((product) => scoreOne(product, queryHash)));
    for (const entry of batchScores) {
      if (entry) scored.push(entry);
    }
  }
  scored.sort((left, right) => right.score - left.score);
  return scored;
}

/** APPROVED — parallel channel (never sequential await chain). */
export async function findExactProducts(scored: ImageSearchMatch[]): Promise<ImageSearchMatch[]> {
  return scored.filter((entry) => entry.score >= EXACT_SCORE && !entry.recommended);
}

/** APPROVED — parallel channel. */
export async function findSimilarProducts(scored: ImageSearchMatch[]): Promise<ImageSearchMatch[]> {
  return scored.filter(
    (entry) =>
      entry.score >= SOFT_MIN_SCORE && entry.score < EXACT_SCORE && !entry.recommended,
  );
}

/** APPROVED — parallel channel. */
export async function findRelevantCategories(scored: ImageSearchMatch[]): Promise<string[]> {
  const counts = new Map<string, number>();
  for (const { product } of scored) {
    for (const crumb of product.categoryBreadcrumbs ?? []) {
      const name = crumb.name?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);
}

/** APPROVED — parallel channel. */
export async function findRelevantFilters(
  scored: ImageSearchMatch[],
): Promise<CameraSearchFilters> {
  const brandCounts = new Map<string, number>();
  const priceCounts = new Map<string, number>();
  for (const { product } of scored) {
    const brand = product.brand?.trim();
    if (brand) brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
    const bucket = priceBucket(product.price);
    priceCounts.set(bucket, (priceCounts.get(bucket) ?? 0) + 1);
  }
  return {
    brands: [...brandCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([brand]) => brand),
    priceRanges: [...priceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([bucket]) => bucket),
  };
}

function mergeMatches(
  exact: ImageSearchMatch[],
  similar: ImageSearchMatch[],
  scored: ImageSearchMatch[],
  corpus: Product[],
): ImageSearchMatch[] {
  let results = [...exact, ...similar].slice(0, MAX_RESULTS);

  if (results.length < MIN_SHOW) {
    results = scored.slice(0, Math.min(MAX_RESULTS, Math.max(MIN_SHOW, scored.length)));
  }

  if (results.length === 0) {
    return asRecommended(corpus);
  }

  if (results.length < MIN_SHOW) {
    const seen = new Set(results.map((entry) => entry.product.id));
    for (const entry of [...scored, ...asRecommended(corpus)]) {
      if (seen.has(entry.product.id)) continue;
      results.push({
        ...entry,
        recommended: entry.recommended ?? entry.score < SOFT_MIN_SCORE,
      });
      seen.add(entry.product.id);
      if (results.length >= MIN_SHOW) break;
    }
  }

  return results.slice(0, MAX_RESULTS);
}

/**
 * Camera Search Master — ONE request + Promise.all channels.
 * FORBIDDEN: await exact → await similar → await categories → await filters.
 */
export async function runCameraSearchMaster(
  queryDataUrl: string | null,
  signal?: AbortSignal,
  onProgress?: ImageSearchProgress,
): Promise<CameraSearchResultsPayload> {
  onProgress?.("validating");

  // ONE corpus request only.
  const corpus = await fetchActiveListingCorpus(signal);
  if (signal?.aborted) {
    return {
      queryDataUrl,
      matches: [],
      categories: [],
      filters: { brands: [], priceRanges: [] },
      hasExactMatch: false,
      readyAt: Date.now(),
    };
  }

  const scored =
    corpus.length === 0 ? [] : await scoreCorpus(corpus, queryDataUrl, signal);

  onProgress?.("products");

  // REQUIRED: all channels in parallel.
  const [exactProducts, similarProducts, categories, filters] = await Promise.all([
    findExactProducts(scored),
    findSimilarProducts(scored),
    findRelevantCategories(scored),
    findRelevantFilters(scored),
  ]);

  onProgress?.("similar");

  const matches = mergeMatches(exactProducts, similarProducts, scored, corpus);
  onProgress?.("preparing");

  void CAMERA_SEARCH_V1.parallelMatchingOnly;
  void CAMERA_SEARCH_PERFORMANCE_V1.oneApiCall;

  return {
    queryDataUrl,
    matches,
    categories,
    filters,
    hasExactMatch: exactProducts.length > 0,
    readyAt: Date.now(),
  };
}

/**
 * @deprecated use runCameraSearchMaster — kept for lock-test name continuity.
 */
export async function runImageSimilaritySearch(
  queryDataUrl: string,
  signal?: AbortSignal,
  onProgress?: ImageSearchProgress,
): Promise<ImageSearchMatch[]> {
  const payload = await runCameraSearchMaster(queryDataUrl, signal, onProgress);
  return payload.matches;
}

import { fetchActiveListingCorpus } from "@/lib/image-search/corpus";
import { computeImageHash, scoreImageSimilarity } from "@/lib/image-search/similarity";
import type { Product } from "@/lib/products/types";

export type ImageSearchMatch = {
  product: Product;
  score: number;
};

const MIN_SCORE = 0.42;
const MAX_RESULTS = 48;

export async function runImageSimilaritySearch(
  queryDataUrl: string,
  signal?: AbortSignal,
): Promise<ImageSearchMatch[]> {
  const queryHash = await computeImageHash(queryDataUrl);
  if (!queryHash) return [];

  const corpus = await fetchActiveListingCorpus(signal);
  const matches: ImageSearchMatch[] = [];

  for (const product of corpus) {
    if (signal?.aborted) break;
    const candidateHash = await computeImageHash(product.imageUrl);
    if (!candidateHash) continue;

    const score = scoreImageSimilarity(queryHash, candidateHash);
    if (score < MIN_SCORE) continue;
    matches.push({ product, score });
  }

  return matches
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_RESULTS);
}

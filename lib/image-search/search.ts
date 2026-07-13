import { fetchActiveListingCorpus } from "@/lib/image-search/corpus";
import { computeImageHash, scoreImageSimilarity } from "@/lib/image-search/similarity";
import type { Product } from "@/lib/products/types";

export type ImageSearchMatch = {
  product: Product;
  score: number;
};

const MIN_SCORE = 0.42;
const MAX_RESULTS = 48;
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

export async function runImageSimilaritySearch(
  queryDataUrl: string,
  signal?: AbortSignal,
): Promise<ImageSearchMatch[]> {
  const queryHash = await computeImageHash(queryDataUrl);
  if (!queryHash) return [];

  const corpus = await fetchActiveListingCorpus(signal);
  const matches: ImageSearchMatch[] = [];

  for (let index = 0; index < corpus.length; index += 1) {
    const product = corpus[index]!;
    if (signal?.aborted) break;
    if (index > 0 && index % YIELD_EVERY === 0) {
      await yieldToMain();
      if (signal?.aborted) break;
    }

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

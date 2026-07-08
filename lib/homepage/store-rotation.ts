import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { resolveStoreBadge } from "@/lib/homepage/store-badges";

const STORE_PRIORITY = {
  premium: 4,
  featured: 3,
  verified: 2,
  new: 1,
  organic: 0,
} as const;

function storePriorityScore(section: ShowcaseSellerSection): number {
  const badge = resolveStoreBadge(section);
  if (!badge) return STORE_PRIORITY.organic;

  switch (badge.tone) {
    case "premium":
      return STORE_PRIORITY.premium;
    case "featured":
      return STORE_PRIORITY.featured;
    case "verified":
      return STORE_PRIORITY.verified;
    case "new":
      return STORE_PRIORITY.new;
    default:
      return STORE_PRIORITY.organic;
  }
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function shuffleWithinTier(
  sections: ShowcaseSellerSection[],
  seed: string,
): ShowcaseSellerSection[] {
  const buckets = new Map<number, ShowcaseSellerSection[]>();

  for (const section of sections) {
    const score = storePriorityScore(section);
    const bucket = buckets.get(score) ?? [];
    bucket.push(section);
    buckets.set(score, bucket);
  }

  const orderedScores = [...buckets.keys()].sort((a, b) => b - a);
  const result: ShowcaseSellerSection[] = [];

  for (const score of orderedScores) {
    const bucket = [...(buckets.get(score) ?? [])];
    if (score === STORE_PRIORITY.organic && bucket.length > 1) {
      const offset = hashSeed(seed) % bucket.length;
      for (let i = 0; i < bucket.length; i += 1) {
        result.push(bucket[(i + offset) % bucket.length]!);
      }
      continue;
    }

    if (bucket.length > 1 && score < STORE_PRIORITY.premium) {
      const offset = hashSeed(`${seed}:${score}`) % bucket.length;
      for (let i = 0; i < bucket.length; i += 1) {
        result.push(bucket[(i + offset) % bucket.length]!);
      }
      continue;
    }

    result.push(...bucket);
  }

  return result;
}

/** Rotate featured stores: Premium → Featured → Verified → random within tier. No duplicates. */
export function rotateShowcaseStores(
  sections: ShowcaseSellerSection[],
  seed = "rovexo-homepage",
): ShowcaseSellerSection[] {
  const unique = new Map<string, ShowcaseSellerSection>();
  for (const section of sections) {
    if (!unique.has(section.sellerId)) unique.set(section.sellerId, section);
  }

  const deduped = [...unique.values()].sort((left, right) => {
    const scoreDelta = storePriorityScore(right) - storePriorityScore(left);
    if (scoreDelta !== 0) return scoreDelta;
    return right.rating - left.rating;
  });

  return shuffleWithinTier(deduped, seed);
}

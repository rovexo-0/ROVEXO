import type { RatingDistribution, Review } from "@/lib/reviews/types";
import { SELLER_RATING_MAX, SELLER_RATING_MIN } from "@/lib/reviews/seller-rating-system-v1";

export function emptyRatingDistribution(): RatingDistribution {
  return { five: 0, four: 0, three: 0, two: 0, one: 0 };
}

/** Build 1–5 star histogram from review rows (order-backed seller ratings). */
export function buildRatingDistribution(
  ratings: ReadonlyArray<Pick<Review, "rating"> | { rating: number }>,
): RatingDistribution {
  const distribution = emptyRatingDistribution();

  for (const row of ratings) {
    const value = Math.round(Number(row.rating));
    if (value < SELLER_RATING_MIN || value > SELLER_RATING_MAX) continue;
    if (value === 5) distribution.five += 1;
    else if (value === 4) distribution.four += 1;
    else if (value === 3) distribution.three += 1;
    else if (value === 2) distribution.two += 1;
    else distribution.one += 1;
  }

  return distribution;
}

export function averageFromDistribution(distribution: RatingDistribution): number {
  const total =
    distribution.five +
    distribution.four +
    distribution.three +
    distribution.two +
    distribution.one;
  if (total <= 0) return 0;
  const sum =
    distribution.five * 5 +
    distribution.four * 4 +
    distribution.three * 3 +
    distribution.two * 2 +
    distribution.one * 1;
  return sum / total;
}

export function distributionCount(distribution: RatingDistribution): number {
  return (
    distribution.five +
    distribution.four +
    distribution.three +
    distribution.two +
    distribution.one
  );
}

/** Star ladder top → bottom for UI bars. */
export const RATING_DISTRIBUTION_LADDER = [
  { stars: 5 as const, key: "five" as const },
  { stars: 4 as const, key: "four" as const },
  { stars: 3 as const, key: "three" as const },
  { stars: 2 as const, key: "two" as const },
  { stars: 1 as const, key: "one" as const },
];

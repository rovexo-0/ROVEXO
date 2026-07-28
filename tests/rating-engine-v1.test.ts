import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  RATING_ENGINE_V1,
  computeAverageFromRatings,
  formatAverageRatingDisplay,
  formatRatingSummaryDisplay,
  isValidRating,
  ratingScaleLabel,
} from "@/lib/rating/rating-engine-v1";
import {
  buildRatingDistribution,
  distributionCount,
} from "@/lib/reviews/rating-distribution";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Rating Engine v1.0 — Absolute Blood Code", () => {
  it("locks one table · one API · one store · absolute law", () => {
    expect(RATING_ENGINE_V1.version).toBe("1.0");
    expect(RATING_ENGINE_V1.table).toBe("reviews");
    expect(RATING_ENGINE_V1.apiPath).toBe("/api/reviews");
    expect(RATING_ENGINE_V1.store).toBe("lib/reviews/store.ts");
    expect(RATING_ENGINE_V1.absoluteLaw).toBe("NO_COMPLETED_TRANSACTION_NO_RATING");
    expect(RATING_ENGINE_V1.requiredOrderStatus).toBe("completed");
    expect(RATING_ENGINE_V1.rules.orderBackedOnly).toBe(true);
    expect(RATING_ENGINE_V1.rules.duplicateBlocked).toBe(true);
    expect(RATING_ENGINE_V1.rules.selfRatingForbidden).toBe(true);
    expect(RATING_ENGINE_V1.rules.userDeleteForbidden).toBe(true);
    expect(RATING_ENGINE_V1.rules.countsFromValidRatingsOnly).toBe(true);
    expect(RATING_ENGINE_V1.directions.buyerRatesSeller).toBe("ACTIVE");
    expect(RATING_ENGINE_V1.directions.sellerRatesBuyer).toBe("ACTIVE");
    expect(RATING_ENGINE_V1.rules.sellerRatesBuyer).toBe(true);
    expect(RATING_ENGINE_V1.rules.maxRatingsPerOrder).toBe(2);
    expect(existsSync(join(process.cwd(), "lib/rating/rating-engine-v1.ts"))).toBe(true);
  });

  it("defines 1–5 scale labels", () => {
    expect(ratingScaleLabel(1)).toBe("Very Poor");
    expect(ratingScaleLabel(2)).toBe("Poor");
    expect(ratingScaleLabel(3)).toBe("Average");
    expect(ratingScaleLabel(4)).toBe("Good");
    expect(ratingScaleLabel(5)).toBe("Excellent");
    expect(ratingScaleLabel(0)).toBeNull();
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(3.5)).toBe(false);
  });

  it("calculates average + distribution from valid ratings only", () => {
    const rows = [{ rating: 5 }, { rating: 4 }, { rating: 5 }, { rating: 9 }];
    const distribution = buildRatingDistribution(rows);
    expect(distribution).toEqual({ five: 2, four: 1, three: 0, two: 0, one: 0 });
    expect(distributionCount(distribution)).toBe(3);
    const { average, total } = computeAverageFromRatings(rows);
    expect(total).toBe(3);
    expect(average).toBeCloseTo(14 / 3, 5);
    expect(formatAverageRatingDisplay(average)).toBe("4.7");
    expect(formatRatingSummaryDisplay(average, total)).toBe("4.7 (3 ratings)");
  });

  it("store eligibility enforces completed + payment + delivery + blocks", () => {
    const store = readSource("lib/reviews/store.ts");
    expect(store).toContain('from "@/lib/rating/rating-engine-v1"');
    expect(store).toContain("Refunded orders cannot be reviewed.");
    expect(store).toContain("Cancelled orders cannot be reviewed.");
    expect(store).toContain("dispute is active");
    expect(store).toContain("paid_at");
    expect(store).toContain("delivered_at");
    expect(store).toContain("Self-review is not allowed.");
    expect(store).toContain("You already reviewed this order.");
    expect(store).toContain("valid reviews rows only");
  });

  it("API uses Rating Engine validator + single store", () => {
    const api = readSource("app/api/reviews/route.ts");
    expect(api).toContain('from "@/lib/rating/rating-engine-v1"');
    expect(api).toContain("isValidRating");
    expect(api).toContain("createOrderReview");
    expect(api).toContain("requireApiAuth");
    expect(api).toContain("distribution");
  });

  it("forbids parallel rating engines / APIs", () => {
    expect(existsSync(join(process.cwd(), "app/api/ratings/route.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib/rating/rating-engine-v2.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib/reviews/store-v2.ts"))).toBe(false);
  });
});

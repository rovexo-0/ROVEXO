import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  averageFromDistribution,
  buildRatingDistribution,
  distributionCount,
  emptyRatingDistribution,
} from "@/lib/reviews/rating-distribution";
import {
  isValidSellerRating,
  SELLER_RATING_RULES,
  SELLER_RATING_SYSTEM_STATUS,
  SELLER_RATING_SYSTEM_VERSION,
} from "@/lib/reviews/seller-rating-system-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Seller Rating System v1.0", () => {
  it("locks SSOT + production status", () => {
    expect(SELLER_RATING_SYSTEM_VERSION).toBe("1.0");
    expect(SELLER_RATING_SYSTEM_STATUS).toBe("PRODUCTION");
    expect(SELLER_RATING_RULES.selfReviewForbidden).toBe(true);
    expect(SELLER_RATING_RULES.oneReviewPerOrder).toBe(false);
    expect(SELLER_RATING_RULES.oneReviewPerParticipant).toBe(true);
    expect(SELLER_RATING_RULES.maxReviewsPerOrder).toBe(2);
    expect(SELLER_RATING_RULES.buyerOnly).toBe(false);
    expect(SELLER_RATING_RULES.socialFollow).toBe("PERMANENTLY_REMOVED");
    expect(SELLER_RATING_RULES.verifiedPurchaseLabel).toBe("Verified purchase");
  });

  it("validates ratings 1–5 integers only", () => {
    expect(isValidSellerRating(1)).toBe(true);
    expect(isValidSellerRating(5)).toBe(true);
    expect(isValidSellerRating(0)).toBe(false);
    expect(isValidSellerRating(6)).toBe(false);
    expect(isValidSellerRating(3.5)).toBe(false);
    expect(isValidSellerRating("5")).toBe(false);
  });

  it("builds rating distribution histogram", () => {
    const distribution = buildRatingDistribution([
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 1 },
      { rating: 9 },
    ]);
    expect(distribution).toEqual({ five: 2, four: 1, three: 0, two: 0, one: 1 });
    expect(distributionCount(distribution)).toBe(4);
    expect(averageFromDistribution(distribution)).toBeCloseTo(3.75, 5);
    expect(emptyRatingDistribution()).toEqual({
      five: 0,
      four: 0,
      three: 0,
      two: 0,
      one: 0,
    });
  });

  it("hardens create_order_review against self-review in migration", () => {
    const migration = readSource(
      "supabase/migrations/20260726220000_seller_rating_self_review_block_v1.sql",
    );
    expect(migration).toContain("Self-review is not allowed");
    expect(migration).toContain("buyer_id is not distinct from v_order.seller_id");
  });

  it("eligibility + API + store block self-review and invalid ratings", () => {
    const store = readSource("lib/reviews/store.ts");
    const api = readSource("app/api/reviews/route.ts");
    expect(store).toContain("Self-review is not allowed.");
    expect(store).toContain("isValidRating");
    expect(store).toContain("verifiedPurchase:");
    expect(store).toContain("getSellerRatingSummary");
    expect(api).toContain("distribution");
    expect(api).toContain("isValidRating");
  });

  it("seller profile + product store surfaces show rating distribution / seller rating", () => {
    const viewProfile = readSource("features/profile/components/ViewProfilePage.tsx");
    const productStore = readSource("features/product-detail/ProductStoreSection.tsx");
    const repo = readSource("lib/products/repository.ts");

    expect(viewProfile).toContain("RATING_DISTRIBUTION_LADDER");
    expect(viewProfile).toContain("verifiedPurchaseLabel");
    expect(viewProfile).toContain("SELLER_RATING_RULES");
    expect(viewProfile).toContain("Rating");
    expect(viewProfile).toContain("rating: averageRating");
    expect(viewProfile).toContain("reviewCount,");
    expect(productStore).toContain("sellerRating");
    expect(repo).toContain("enrichProductDetailWithSellerRating");
    expect(repo).toContain("enrichProductsWithCanonicalSellerRating");
    expect(readSource("lib/listings/repository.ts")).toContain(
      "enrichProductsWithCanonicalSellerRating",
    );
    expect(readSource("lib/listings/repository.ts")).toContain("sellerId: row.seller_id");
  });

  it("keeps marketplace Follow (XLVI) without social-media FollowSellerButton", () => {
    expect(existsSync(join(process.cwd(), "app/api/follows/route.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "features/launch/components/FollowSellerButton.tsx"))).toBe(
      false,
    );
    const ssot = readSource("lib/reviews/seller-rating-system-v1.ts");
    expect(ssot).toContain("PERMANENTLY_REMOVED");
  });
});

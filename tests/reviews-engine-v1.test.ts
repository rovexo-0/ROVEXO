import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { REVIEWS_ENGINE_V1 } from "@/lib/reviews/reviews-engine-v1";
import { RATING_ENGINE_V1 } from "@/lib/rating/rating-engine-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Reviews Engine v1.0 — Absolute Blood Code", () => {
  it("locks one table · one API · one store · absolute law", () => {
    expect(REVIEWS_ENGINE_V1.version).toBe("1.0");
    expect(REVIEWS_ENGINE_V1.table).toBe("reviews");
    expect(REVIEWS_ENGINE_V1.apiPath).toBe("/api/reviews");
    expect(REVIEWS_ENGINE_V1.store).toBe("lib/reviews/store.ts");
    expect(REVIEWS_ENGINE_V1.absoluteLaw).toBe("NO_COMPLETED_TRANSACTION_NO_REVIEW");
    expect(REVIEWS_ENGINE_V1.rules.maxReviewsPerOrder).toBe(2);
    expect(REVIEWS_ENGINE_V1.rules.oneReviewPerParticipant).toBe(true);
    expect(REVIEWS_ENGINE_V1.rules.buyerReviewsSeller).toBe(true);
    expect(REVIEWS_ENGINE_V1.rules.sellerReviewsBuyer).toBe(true);
    expect(REVIEWS_ENGINE_V1.rules.verifiedPurchaseAutomatic).toBe(true);
    expect(REVIEWS_ENGINE_V1.rules.ratingWithoutTextValid).toBe(true);
    expect(REVIEWS_ENGINE_V1.rules.onePublicReplyFromReviewedUser).toBe(true);
    expect(REVIEWS_ENGINE_V1.rules.noReplyChains).toBe(true);
    expect(REVIEWS_ENGINE_V1.rules.userDeleteForbidden).toBe(true);
    expect(REVIEWS_ENGINE_V1.extends).toBe("lib/rating/rating-engine-v1.ts");
  });

  it("does not modify Rating Engine lock", () => {
    expect(RATING_ENGINE_V1.version).toBe("1.0");
    expect(RATING_ENGINE_V1.lock).toBe("lib/rating/rating-engine-v1.ts");
    const ratingLock = readSource("lib/rating/rating-engine-v1.ts");
    expect(ratingLock).toContain("ABSOLUTE BLOOD CODE");
    expect(ratingLock).toContain("NO_COMPLETED_TRANSACTION_NO_RATING");
  });

  it("ships dual-slot migration SSOT", () => {
    const path = "supabase/migrations/20260727010000_reviews_engine_v1_dual_slots.sql";
    expect(existsSync(join(process.cwd(), path))).toBe(true);
    const sql = readSource(path);
    expect(sql).toContain("reviews_order_reviewer_unique");
    expect(sql).toContain("Maximum two reviews per order");
    expect(sql).toContain("Only order participants can review");
    expect(sql).toContain("verified_purchase");
    expect(sql).toContain("reply_text");
    expect(sql).toContain("v_order.seller_id");
    expect(sql).toContain("v_order.buyer_id");
  });

  it("store supports dual participants · edit · reply · verified purchase", () => {
    const store = readSource("lib/reviews/store.ts");
    expect(store).toContain("Only order participants can leave a review.");
    expect(store).toContain("updateOrderReview");
    expect(store).toContain("replyToReview");
    expect(store).toContain("listOrderReviews");
    expect(store).toContain("verifiedPurchase: row.verified_purchase !== false");
    expect(store).toContain("Only the reviewed user may reply.");
    expect(store).toContain("A reply already exists for this review.");
    expect(store).toContain("You can only edit your own review.");
    expect(store).toContain("eq(\"reviewer_id\", reviewerId)");
  });

  it("API exposes create · edit · reply on one route", () => {
    const api = readSource("app/api/reviews/route.ts");
    expect(api).toContain('action ?? "create"');
    expect(api).toContain('action === "edit"');
    expect(api).toContain('action === "reply"');
    expect(api).toContain("listOrderReviews");
    expect(api).toContain("requireApiAuth");
    expect(existsSync(join(process.cwd(), "app/api/reviews-v2/route.ts"))).toBe(false);
  });

  it("forbids parallel Reviews engines", () => {
    expect(existsSync(join(process.cwd(), "lib/reviews/reviews-engine-v2.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib/reviews/store-v2.ts"))).toBe(false);
  });
});

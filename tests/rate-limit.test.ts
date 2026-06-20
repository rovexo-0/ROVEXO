import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/api/rate-limit";

describe("rate limiting", () => {
  it("allows requests under the limit", async () => {
    const key = `test-${Date.now()}`;
    expect((await checkRateLimit(key, 3, 60_000)).allowed).toBe(true);
    expect((await checkRateLimit(key, 3, 60_000)).allowed).toBe(true);
    expect((await checkRateLimit(key, 3, 60_000)).allowed).toBe(true);
  });

  it("blocks requests over the limit", async () => {
    const key = `test-block-${Date.now()}`;
    await checkRateLimit(key, 2, 60_000);
    await checkRateLimit(key, 2, 60_000);
    expect((await checkRateLimit(key, 2, 60_000)).allowed).toBe(false);
  });
});

describe("reviews exports", () => {
  it("exposes review store functions", async () => {
    const reviews = await import("@/lib/reviews/store");
    expect(reviews.createOrderReview).toBeTypeOf("function");
    expect(reviews.getReviewEligibility).toBeTypeOf("function");
    expect(reviews.listSellerReviews).toBeTypeOf("function");
  });
});

describe("stripe production helpers", () => {
  it("exposes refund and payout helpers", async () => {
    const refunds = await import("@/lib/stripe/refunds");
    const payouts = await import("@/lib/stripe/payouts");
    expect(refunds.createOrderStripeRefund).toBeTypeOf("function");
    expect(payouts.processStripeWithdrawal).toBeTypeOf("function");
  });
});

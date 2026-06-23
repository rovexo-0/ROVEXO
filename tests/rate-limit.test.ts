import { describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  getRateLimitStatus,
  recordRateLimitFailure,
  resetRateLimit,
} from "@/lib/api/rate-limit";
import {
  authRateLimitKey,
  checkAuthRateLimit,
  clearAuthRateLimit,
  getAuthRateLimitConfig,
  isAuthRateLimitDisabled,
  recordAuthRateLimitFailure,
} from "@/lib/auth/rate-limit";

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

  it("peeks without incrementing", async () => {
    const key = `test-peek-${Date.now()}`;
    await recordRateLimitFailure(key, 2, 60_000);
    expect((await getRateLimitStatus(key, 2, 60_000)).allowed).toBe(true);
    expect((await getRateLimitStatus(key, 2, 60_000)).allowed).toBe(true);
    await recordRateLimitFailure(key, 2, 60_000);
    expect((await getRateLimitStatus(key, 2, 60_000)).allowed).toBe(false);
  });

  it("resets the counter after successful auth", async () => {
    const key = `test-reset-${Date.now()}`;
    await recordRateLimitFailure(key, 2, 60_000);
    await recordRateLimitFailure(key, 2, 60_000);
    expect((await getRateLimitStatus(key, 2, 60_000)).allowed).toBe(false);

    await resetRateLimit(key);

    expect((await getRateLimitStatus(key, 2, 60_000)).allowed).toBe(true);
    expect((await recordRateLimitFailure(key, 2, 60_000)).allowed).toBe(true);
  });

  it("automatically resets memory buckets after the window expires", async () => {
    vi.useFakeTimers();
    const key = `test-expiry-${Date.now()}`;

    await recordRateLimitFailure(key, 2, 5_000);
    await recordRateLimitFailure(key, 2, 5_000);
    expect((await getRateLimitStatus(key, 2, 5_000)).allowed).toBe(false);

    vi.advanceTimersByTime(5_001);
    expect((await getRateLimitStatus(key, 2, 5_000)).allowed).toBe(true);

    vi.useRealTimers();
  });

  it("bypasses auth keys in development even when over limit", async () => {
    const key = `auth-login:dev-bypass-${Date.now()}`;
    await checkRateLimit(key, 1, 60_000);
    await checkRateLimit(key, 1, 60_000);
    expect((await checkRateLimit(key, 1, 60_000)).allowed).toBe(true);
    expect((await getRateLimitStatus(key, 1, 60_000)).allowed).toBe(true);
  });
});

describe("auth rate limiting", () => {
  it("is disabled in development", async () => {
    expect(process.env.NODE_ENV).not.toBe("production");
    expect(isAuthRateLimitDisabled()).toBe(true);

    const ip = `127.0.0.1-unlimited-${Date.now()}`;

    for (let attempt = 0; attempt < 100; attempt += 1) {
      expect((await checkAuthRateLimit("login", ip)).allowed).toBe(true);
      await recordAuthRateLimitFailure("login", ip);
    }

    expect((await checkAuthRateLimit("login", ip)).allowed).toBe(true);
    expect((await checkAuthRateLimit("register", ip)).allowed).toBe(true);
    expect((await checkAuthRateLimit("reset", ip)).allowed).toBe(true);
    expect((await checkAuthRateLimit("verify-resend", ip)).allowed).toBe(true);
  });

  it("documents production auth limits", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getAuthRateLimitConfig("login")).toEqual({ limit: 10, windowMs: 15 * 60_000 });
    expect(getAuthRateLimitConfig("register")).toEqual({ limit: 5, windowMs: 15 * 60_000 });
    expect(getAuthRateLimitConfig("reset")).toEqual({ limit: 5, windowMs: 15 * 60_000 });
    expect(getAuthRateLimitConfig("verify-resend")).toEqual({ limit: 5, windowMs: 15 * 60_000 });
    vi.unstubAllEnvs();
  });

  it("clears failed login attempts after success when limits are enabled", async () => {
    if (isAuthRateLimitDisabled()) {
      const ip = `127.0.0.1-test-${Date.now()}`;
      await clearAuthRateLimit("login", ip);
      expect((await checkAuthRateLimit("login", ip)).allowed).toBe(true);
      return;
    }

    const ip = `127.0.0.1-test-${Date.now()}`;
    const key = authRateLimitKey("login", ip);

    await recordAuthRateLimitFailure("login", ip);
    await recordAuthRateLimitFailure("login", ip);
    expect((await checkAuthRateLimit("login", ip)).allowed).toBe(true);

    await clearAuthRateLimit("login", ip);
    expect((await checkAuthRateLimit("login", ip)).allowed).toBe(true);

    await recordRateLimitFailure(key, 2, 60_000);
    await recordRateLimitFailure(key, 2, 60_000);
    expect((await getRateLimitStatus(key, 2, 60_000)).allowed).toBe(false);
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

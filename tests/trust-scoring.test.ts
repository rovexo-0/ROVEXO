import { describe, expect, it } from "vitest";
import { TRUST_DEFAULT_SCORE, TRUST_EVENT_DELTAS, TRUST_TIER_THRESHOLDS } from "@/lib/trust/constants";
import {
  buildTrustRecommendations,
  calculateTrustScoreFromFactors,
  clampTrustScore,
  levelForScore,
  progressToNextTier,
  tierForScore,
} from "@/lib/trust/scoring";
import type { TrustFactorSnapshot } from "@/lib/trust/types";

const baseFactors = (): TrustFactorSnapshot => ({
  completedSales: 0,
  completedPurchases: 0,
  cancelledOrders: 0,
  disputesLost: 0,
  disputesWon: 0,
  refundsIssued: 0,
  positiveReviews: 0,
  negativeReviews: 0,
  reportsReceived: 0,
  moderationPenalties: 0,
  verificationsApproved: 0,
  accountAgeDays: 0,
  profileCompletion: 0,
  onTimeShipments: 0,
  lateShipments: 0,
  responseRate: 0,
  repeatBuyers: 0,
  chargebacks: 0,
  suspensions: 0,
  warnings: 0,
  shippingReliability: null,
  emailVerified: false,
  phoneVerified: false,
});

describe("trust scoring", () => {
  it("clamps scores to 0–100", () => {
    expect(clampTrustScore(-5)).toBe(0);
    expect(clampTrustScore(50)).toBe(50);
    expect(clampTrustScore(150)).toBe(100);
  });

  it("maps scores to marketplace tiers", () => {
    expect(tierForScore(0)).toBe("bronze");
    expect(tierForScore(45)).toBe("silver");
    expect(tierForScore(65)).toBe("gold");
    expect(tierForScore(80)).toBe("platinum");
    expect(tierForScore(95)).toBe("diamond");
  });

  it("maps scores to verification levels", () => {
    expect(levelForScore(40)).toBe("basic");
    expect(levelForScore(60)).toBe("verified");
    expect(levelForScore(75)).toBe("premium");
    expect(levelForScore(90)).toBe("enterprise");
  });

  it("calculates progress toward the next tier", () => {
    const progress = progressToNextTier(50);
    expect(progress.current).toBe("silver");
    expect(progress.next).toBe("gold");
    expect(progress.percent).toBeGreaterThan(0);
    expect(progress.percent).toBeLessThanOrEqual(100);
  });

  it("starts new accounts at the neutral default", () => {
    expect(calculateTrustScoreFromFactors(baseFactors())).toBe(TRUST_DEFAULT_SCORE);
  });

  it("rewards completed sales and verifications", () => {
    const factors = {
      ...baseFactors(),
      completedSales: 20,
      verificationsApproved: 3,
      profileCompletion: 100,
    };
    expect(calculateTrustScoreFromFactors(factors)).toBeGreaterThan(TRUST_DEFAULT_SCORE);
  });

  it("penalizes disputes, chargebacks, and suspensions", () => {
    const factors = {
      ...baseFactors(),
      disputesLost: 3,
      chargebacks: 2,
      suspensions: 1,
    };
    expect(calculateTrustScoreFromFactors(factors)).toBeLessThan(TRUST_DEFAULT_SCORE);
  });

  it("builds actionable recommendations", () => {
    const factors = {
      ...baseFactors(),
      verificationsApproved: 0,
      profileCompletion: 20,
      negativeReviews: 2,
    };
    const recommendations = buildTrustRecommendations(factors, 45);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some((item) => item.includes("verification"))).toBe(true);
  });

  it("defines tier thresholds in descending order", () => {
    for (let index = 1; index < TRUST_TIER_THRESHOLDS.length; index += 1) {
      expect(TRUST_TIER_THRESHOLDS[index - 1].min).toBeGreaterThan(
        TRUST_TIER_THRESHOLDS[index].min,
      );
    }
  });

  it("exposes event deltas for automation hooks", () => {
    expect(TRUST_EVENT_DELTAS.order_completed_seller).toBeGreaterThan(0);
    expect(TRUST_EVENT_DELTAS.fraud_detected).toBeLessThan(0);
    expect(TRUST_EVENT_DELTAS.report_received).toBeLessThan(0);
  });
});

describe("trust anti-fraud", () => {
  it("blocks self-purchase detection synchronously", async () => {
    const { detectOrderTrustFraud } = await import("@/lib/trust/anti-fraud");
    const result = await detectOrderTrustFraud({
      buyerId: "user-1",
      sellerId: "user-1",
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("self_purchase");
  });

  it("blocks self-review detection synchronously", async () => {
    const { detectReviewFraud } = await import("@/lib/trust/anti-fraud");
    const result = await detectReviewFraud({
      orderId: "order-1",
      reviewerId: "user-1",
      revieweeId: "user-1",
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("self_review");
  });
});

describe("trust service exports", () => {
  it("exposes production trust APIs", async () => {
    const service = await import("@/lib/trust/service");
    expect(service.applyTrustImpact).toBeTypeOf("function");
    expect(service.recalculateTrustScore).toBeTypeOf("function");
    expect(service.getPublicTrustSummary).toBeTypeOf("function");
    expect(service.getTrustDashboardData).toBeTypeOf("function");
    expect(service.adminAdjustTrustScore).toBeTypeOf("function");
  });

  it("exposes event automation hooks", async () => {
    const events = await import("@/lib/trust/events");
    expect(events.onOrderCompleted).toBeTypeOf("function");
    expect(events.onOrderCancelled).toBeTypeOf("function");
    expect(events.onReviewSubmitted).toBeTypeOf("function");
    expect(events.onShipmentDelivered).toBeTypeOf("function");
    expect(events.onChargeback).toBeTypeOf("function");
    expect(events.onContentReportTargeted).toBeTypeOf("function");
    expect(events.onModerationDecision).toBeTypeOf("function");
  });

  it("defines partial refund and shipment deltas", () => {
    expect(TRUST_EVENT_DELTAS.order_refunded_partial_seller).toBeLessThan(0);
    expect(TRUST_EVENT_DELTAS.on_time_shipment).toBeGreaterThan(0);
    expect(TRUST_EVENT_DELTAS.late_shipment).toBeLessThan(0);
    expect(TRUST_EVENT_DELTAS.chargeback).toBeLessThan(0);
    expect(TRUST_EVENT_DELTAS.suspension).toBeLessThan(0);
  });
});

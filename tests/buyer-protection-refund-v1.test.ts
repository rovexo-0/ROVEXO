/**
 * Buyer Protection Fee / refund rule — pure math + architecture contracts.
 * No Stripe API · no DB writes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUYER_PROTECTION_FEE_REFUNDABLE_DEFAULT,
  buildOrderFinancialBreakdownPence,
  calculateRovexoRefundPence,
  derivedBuyerProtectionFeeRefundedPence,
  isBuyerProtectionFeeRefundAuthorized,
  policyMaxRefundablePence,
  resolveBuyerProtectionAwareRefundGbp,
  type BuyerProtectionRefundReason,
} from "@/lib/orders/buyer-protection-refund-v1";
import {
  calculateOrderTotals,
  PLATFORM_FEE_RATE,
  toPence,
} from "@/lib/orders/pricing";

const root = process.cwd();
function src(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

/** Spec fixture: Item £100 + Shipping £4 + Protection £6 = £110 */
function exampleBreakdown() {
  return buildOrderFinancialBreakdownPence({
    itemPriceGbp: 100,
    deliveryFeeGbp: 4,
    protectedFeeGbp: 6,
    totalGbp: 110,
  });
}

describe("Buyer Protection fee — checkout totals", () => {
  it("1 NORMAL PAYMENT: item + shipping + 5.5% protection = total", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.055);
    expect(BUYER_PROTECTION_FEE_REFUNDABLE_DEFAULT).toBe(false);
    const totals = calculateOrderTotals(100, 4);
    expect(totals.itemPrice).toBe(100);
    expect(totals.delivery).toBe(4);
    expect(totals.platformFee).toBe(5.5);
    expect(totals.total).toBe(109.5);
  });

  it("spec fixture £100 + £4 + £6 = £110 pence invariant", () => {
    const b = exampleBreakdown();
    expect(
      b.itemAmountPence + b.shippingAmountPence + b.buyerProtectionFeePence,
    ).toBe(b.totalAmountPence);
    expect(b.totalAmountPence).toBe(11_000);
  });
});

describe("Buyer Protection fee — refund calculation", () => {
  const reasonsExcludingFee: BuyerProtectionRefundReason[] = [
    "RETURN",
    "DAMAGE",
    "LOST",
    "ITEM_NOT_AS_DESCRIBED",
    "SELLER_CANCEL",
    "OTHER",
  ];

  it("2 RETURN: refund £104, protection £0", () => {
    const calculated = calculateRovexoRefundPence({
      breakdown: exampleBreakdown(),
      reason: "RETURN",
      maxRefundablePence: 11_000,
    });
    expect(calculated.ok).toBe(true);
    if (!calculated.ok) return;
    expect(calculated.refund.itemRefundAmountPence).toBe(10_000);
    expect(calculated.refund.shippingRefundAmountPence).toBe(400);
    expect(calculated.refund.buyerProtectionFeeRefundAmountPence).toBe(0);
    expect(calculated.refund.totalRefundAmountPence).toBe(10_400);
  });

  it("3–5 DAMAGE / LOST / NOT_AS_DESCRIBED / SELLER_CANCEL / OTHER: fee = 0", () => {
    for (const reason of reasonsExcludingFee) {
      expect(isBuyerProtectionFeeRefundAuthorized(reason)).toBe(false);
      const calculated = calculateRovexoRefundPence({
        breakdown: exampleBreakdown(),
        reason,
        maxRefundablePence: 11_000,
      });
      expect(calculated.ok).toBe(true);
      if (!calculated.ok) continue;
      expect(calculated.refund.buyerProtectionFeeRefundAmountPence).toBe(0);
      expect(calculated.refund.totalRefundAmountPence).toBe(10_400);
    }
  });

  it("5 PLATFORM_ERROR: may refund original Buyer Protection fee", () => {
    expect(isBuyerProtectionFeeRefundAuthorized("PLATFORM_ERROR")).toBe(true);
    const calculated = calculateRovexoRefundPence({
      breakdown: exampleBreakdown(),
      reason: "PLATFORM_ERROR",
      maxRefundablePence: 11_000,
    });
    expect(calculated.ok).toBe(true);
    if (!calculated.ok) return;
    expect(calculated.refund.buyerProtectionFeeRefundAmountPence).toBe(600);
    expect(calculated.refund.totalRefundAmountPence).toBe(11_000);
  });

  it("6 DUPLICATE: already refunded eligible → no remaining", () => {
    const first = calculateRovexoRefundPence({
      breakdown: exampleBreakdown(),
      reason: "RETURN",
      maxRefundablePence: 11_000,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = calculateRovexoRefundPence({
      breakdown: exampleBreakdown(),
      reason: "RETURN",
      alreadyRefundedPence: first.refund.totalRefundAmountPence,
      maxRefundablePence: 11_000,
    });
    expect(second.ok).toBe(false);
  });

  it("7 REFUND EXCEEDS PAYMENT rejected", () => {
    const over = resolveBuyerProtectionAwareRefundGbp({
      itemPriceGbp: 100,
      deliveryFeeGbp: 4,
      protectedFeeGbp: 6,
      totalGbp: 110,
      alreadyRefundedGbp: 0,
      maxRefundableGbp: 110,
      reason: "RETURN",
      amountGbp: 110.01,
    });
    expect(over.ok).toBe(false);
  });

  it("8 CURRENCY / MINOR UNITS: integer pence", () => {
    const b = exampleBreakdown();
    expect(Number.isInteger(b.itemAmountPence)).toBe(true);
    expect(Number.isInteger(b.buyerProtectionFeePence)).toBe(true);
    expect(toPence(6)).toBe(600);
  });

  it("policy ceiling excludes fee by default; PLATFORM_ERROR includes fee", () => {
    const b = exampleBreakdown();
    expect(policyMaxRefundablePence(b, "RETURN")).toBe(10_400);
    expect(policyMaxRefundablePence(b, "PLATFORM_ERROR")).toBe(11_000);
  });

  it("derived fee refunded from cumulative refunded_amount", () => {
    const b = exampleBreakdown();
    expect(derivedBuyerProtectionFeeRefundedPence(b, 10_400)).toBe(0);
    expect(derivedBuyerProtectionFeeRefundedPence(b, 11_000)).toBe(600);
  });

  it("fee-less orders remain fully refundable (backward compatible)", () => {
    const b = buildOrderFinancialBreakdownPence({
      itemPriceGbp: 10,
      deliveryFeeGbp: 0,
      protectedFeeGbp: 0,
      totalGbp: 10,
    });
    expect(policyMaxRefundablePence(b, "OTHER")).toBe(1_000);
    const calculated = calculateRovexoRefundPence({
      breakdown: b,
      reason: "OTHER",
      maxRefundablePence: 1_000,
    });
    expect(calculated.ok).toBe(true);
    if (!calculated.ok) return;
    expect(calculated.refund.totalRefundAmountPence).toBe(1_000);
  });
});

describe("Buyer Protection fee — architecture contracts", () => {
  it("9 INDIVIDUAL + BUSINESS share one refund engine", () => {
    const refunds = src("lib/stripe/refunds.ts");
    const cancel = src("lib/orders/cancel-order.server.ts");
    const lost = src("lib/resolution-engine/lost-parcel-guarantee-v1.ts");
    const resolution = src("lib/resolution-engine/refunds.ts");
    expect(refunds).toContain("resolveBuyerProtectionAwareRefundGbp");
    expect(refunds).toContain("reason?: BuyerProtectionRefundReason");
    expect(cancel).toContain('"SELLER_CANCEL"');
    expect(cancel).toContain('reason: "OTHER" | "SELLER_CANCEL"');
    expect(lost).toContain('reason: "LOST"');
    expect(resolution).toContain('reason: "OTHER"');
    expect(cancel).not.toContain("createBusinessStripeRefund");
    expect(lost).not.toContain("createBusinessStripeRefund");
  });

  it("10 STRIPE EXECUTION: no automatic PaymentIntent.amount refund", () => {
    const refunds = src("lib/stripe/refunds.ts");
    expect(refunds).toContain("resolveBuyerProtectionAwareRefundGbp");
    expect(refunds).toContain("never PaymentIntent.amount automatically");
    expect(refunds).not.toMatch(/stripe\.refunds\.create/);
  });

  it("seller compensation remains separate from Buyer Protection", () => {
    const lost = src("lib/resolution-engine/lost-parcel-guarantee-v1.ts");
    expect(lost).toContain("lost_parcel_guarantee_events");
    expect(lost).toContain("computeSellerGuaranteeNetGbp");
    expect(lost).toContain('reason: "LOST"');
  });

  it("historical fee field is orders.protected_fee (no duplicate columns)", () => {
    const bp = src("lib/orders/buyer-protection-refund-v1.ts");
    const refunds = src("lib/stripe/refunds.ts");
    expect(bp).toContain("protected_fee");
    expect(refunds).toContain("protected_fee");
    expect(bp).not.toContain("buyer_protection_fee_amount");
    expect(refunds).not.toContain("buyer_protection_fee_refunded_amount");
  });
});

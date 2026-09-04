/**
 * Phase 1H — Cancel / Refund zero-gap contracts (mocks only · no LIVE Stripe).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  accumulateRefundedGbp,
  isOrderFullyRefunded,
  refundableGbp,
  remainingRefundableGbp,
  resolveRefundIntentAmountGbp,
} from "@/lib/stripe/refund-math-v1";
import { PLATFORM_FEE_RATE } from "@/lib/orders/pricing";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { decideRelease } from "@/lib/commerce-engine/release-policy";
import {
  isRovexoWalletRefundCreditEligible,
  ROVEXO_WALLET_REFUND_METHOD,
} from "@/lib/wallet/security";

const root = process.cwd();
function src(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Phase 1H refund math (Buyer Protection integrity)", () => {
  it("1/22 Buyer Protection is 5.5% and is not deducted from seller", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.055);
    const { platformFee, sellerAmount } = calculateSellerNetAmount(100);
    expect(platformFee).toBe(5.5);
    expect(sellerAmount).toBe(100);
  });

  it("2–6 full / partial / remaining / over / zero", () => {
    const max = refundableGbp(100, 10_000);
    expect(max).toBe(100);
    expect(remainingRefundableGbp(max, 0)).toBe(100);
    expect(resolveRefundIntentAmountGbp({ remainingGbp: 100 }).ok).toBe(true);
    expect(resolveRefundIntentAmountGbp({ remainingGbp: 100, amountGbp: 30 })).toEqual({
      ok: true,
      amountGbp: 30,
    });
    const after30 = accumulateRefundedGbp(0, 30);
    expect(after30).toBe(30);
    const rem70 = remainingRefundableGbp(max, after30);
    expect(rem70).toBe(70);
    expect(resolveRefundIntentAmountGbp({ remainingGbp: rem70, amountGbp: 20 })).toEqual({
      ok: true,
      amountGbp: 20,
    });
    const after50 = accumulateRefundedGbp(after30, 20);
    expect(after50).toBe(50);
    const rem50 = remainingRefundableGbp(max, after50);
    expect(resolveRefundIntentAmountGbp({ remainingGbp: rem50, amountGbp: 50 })).toEqual({
      ok: true,
      amountGbp: 50,
    });
    const full = accumulateRefundedGbp(after50, 50);
    expect(isOrderFullyRefunded(full, 100)).toBe(true);
    expect(remainingRefundableGbp(max, full)).toBe(0);
    expect(resolveRefundIntentAmountGbp({ remainingGbp: 0, amountGbp: 1 }).ok).toBe(false);
    expect(resolveRefundIntentAmountGbp({ remainingGbp: 50, amountGbp: 0 }).ok).toBe(false);
    expect(resolveRefundIntentAmountGbp({ remainingGbp: 50, amountGbp: 50.01 }).ok).toBe(false);
  });

  it("22 refundable capped by capture (Buyer Protection included in total)", () => {
    /* Buyer paid £105.50 (100 + 5.5%); capture 10550p → refundable min(total, capture) */
    expect(refundableGbp(105.5, 10_550)).toBe(105.5);
    expect(refundableGbp(105.5, 10_000)).toBe(100);
  });
});

describe("Phase 1H source contracts — cancel / refund / release / lost parcel", () => {
  const refunds = src("lib/stripe/refunds.ts");
  const lifecycle = src("lib/orders/refund-lifecycle.server.ts");
  const cancel = src("lib/orders/cancel-order.server.ts");
  const sales = src("lib/wallet/sales.ts");
  const webhook = src("lib/stripe/webhook-handler.ts");
  const lost = src("lib/resolution-engine/lost-parcel-guarantee-v1.ts");
  const settlement = src("lib/commerce-engine/settlement.ts");

  it("7–11 idempotency / double-click / same-key / new intent keys", () => {
    expect(refunds).toContain("wallet-refund-");
    expect(refunds).toContain("idempotencyKey");
    expect(lifecycle).toContain("sameRefundId");
    expect(lifecycle).toContain("accumulateRefundedGbp");
    expect(sales).toContain("buildBuyerRefundIdempotencyKey");
    expect(src("lib/wallet/security.ts")).toContain("buyer-refund:");
  });

  it("12 cancel concurrency uses cancel_claim_key for buyer and seller", () => {
    expect(cancel).toContain("claimOrderCancellation");
    expect(cancel).toContain("cancel_claim_key");
    expect(cancel).toContain("cancelBuyerOrder");
    expect(cancel).toContain("cancelSellerOrder");
    const buyerIdx = cancel.indexOf("export async function cancelBuyerOrder");
    const sellerIdx = cancel.indexOf("export async function cancelSellerOrder");
    const claimFn = cancel.indexOf("async function claimOrderCancellation");
    expect(claimFn).toBeGreaterThan(0);
    expect(cancel.indexOf("claimOrderCancellation", buyerIdx)).toBeGreaterThan(buyerIdx);
    expect(cancel.indexOf("claimOrderCancellation", sellerIdx)).toBeGreaterThan(sellerIdx);
  });

  it("13–14 cancel + refund ordering; already refunded idempotent", () => {
    expect(cancel).toContain("refundCapturedPaymentOrZero");
    expect(cancel).toContain("createOrderStripeRefund");
    expect(cancel.indexOf("createOrderStripeRefund")).toBeLessThan(
      cancel.indexOf("cancelSendcloudParcels"),
    );
    expect(refunds).toContain("isOrderFullyRefunded");
  });

  it("15–16 refunded sale cannot release; partial remaining blocked by refund_present", () => {
    expect(
      decideRelease({
        status: "completed",
        deliveredAt: "2026-01-01T00:00:00.000Z",
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: false,
        saleRefunded: true,
      }),
    ).toBe("sale_refunded");
    expect(
      decideRelease({
        status: "completed",
        deliveredAt: "2026-01-01T00:00:00.000Z",
        hasRefund: true,
        hasOpenClaim: false,
        requireTimer: false,
        saleRefunded: false,
      }),
    ).toBe("refund_present");
    expect(settlement).toContain('sale.status === "refunded"');
    expect(settlement).toContain("releaseSaleToAvailable");
  });

  it("17–18 refund failure recovery + no stripe.refunds.create in order path", () => {
    expect(refunds).not.toContain("stripe.refunds.create");
    expect(lifecycle).toContain('mappedStatus === "failed"');
    expect(webhook).toContain("charge.refunded");
    expect(webhook).toContain("refund.created");
    expect(webhook).toContain("refund.updated");
    expect(webhook).toContain("syncStripeRefundFromCharge");
  });

  it("19–20 Individual / Business seller_context on seller clawback", () => {
    expect(sales).toContain("seller_context");
    expect(sales).toContain("normalizeSellerContext(order.seller_context)");
    expect(sales).toContain('ensureWallet(sellerId, sellerContext)');
  });

  it("21 lost parcel + refund duplicate protection", () => {
    expect(lost).toContain("lost-buyer-refund-");
    expect(lost).toContain("lost-guarantee-");
    expect(lost).toContain("createOrderStripeRefund");
    expect(lost).toContain("idempotency_key");
  });

  it("card refunds never wallet-credit (webhook re_*)", () => {
    expect(
      isRovexoWalletRefundCreditEligible({
        refundId: "re_abc",
        paymentMethod: ROVEXO_WALLET_REFUND_METHOD,
      }),
    ).toBe(false);
    expect(
      isRovexoWalletRefundCreditEligible({
        refundId: "wallet-refund-order-1-3000",
        paymentMethod: ROVEXO_WALLET_REFUND_METHOD,
      }),
    ).toBe(true);
  });

  it("concurrent refund CAS on refunded_amount", () => {
    expect(lifecycle).toContain('eq("refunded_amount", expectedAlready)');
    expect(lifecycle).toContain('is("refunded_amount", null)');
  });
});

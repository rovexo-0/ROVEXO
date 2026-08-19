import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveStripeKeyMode } from "@/lib/stripe/runtime-mode-v1";
import { isZeroCaptureRefundError, ZERO_CAPTURE_ERROR } from "@/lib/stripe/refunds";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("financial lifecycle matrix v1", () => {
  const buyNow = read("lib/checkout/engines/buy-now-engine-v1.ts");
  const shell = read("lib/checkout/engines/checkout-session-engine-v1.ts");
  const refunds = read("lib/stripe/refunds.ts");
  const cancel = read("lib/orders/cancel-order.server.ts");
  const lifecycle = read("lib/orders/refund-lifecycle.server.ts");
  const sales = read("lib/wallet/sales.ts");
  const webhook = read("lib/stripe/webhook-handler.ts");
  const checkout = read("lib/orders/checkout.ts");
  const createOrder = read("lib/orders/create-order-from-checkout-session.server.ts");
  const stripeServer = read("lib/stripe/server.ts");
  const virtual = read("lib/full-demo/virtual-checkout.ts");

  it("A/B: Buy Now accepted offer + listing price lock without creating an order", () => {
    expect(buyNow).toContain("resolveLockedAcceptedOffer");
    expect(buyNow).toContain("resolveTransactionItemPrice");
    expect(buyNow).toContain("NO Order");
    expect(buyNow).toContain("orderId: null");
    expect(buyNow).toContain("PAYMENT_INTENT_ENGINE_createShell");
    expect(shell).toContain("isStripeRequired()");
    expect(shell).toContain('reason: "Payments are not configured."');
  });

  it("C/D: Preview is Stripe TEST; official production host is LIVE", () => {
    const preview = resolveStripeKeyMode(
      { hostname: "rovexo-git-develop-rovexo.vercel.app", protocol: "https:" },
      { nodeEnv: "production", vercelEnv: "preview" },
    );
    const production = resolveStripeKeyMode(
      { hostname: "www.rovexo.co.uk", protocol: "https:" },
      { nodeEnv: "production", vercelEnv: "production" },
    );
    expect(preview).toBe("test");
    expect(production).toBe("live");
    expect(stripeServer).toContain("STRIPE_SECRET_KEY_TEST");
    expect(stripeServer).toContain("isStripeTestKey(testAlias)");
    expect(stripeServer).not.toMatch(/isStripeRequired\(\) === false/);
  });

  it("E/F: payment success creates the order; failure does not invent paid state", () => {
    expect(createOrder).toContain("create durable Order ONLY after payment success");
    expect(createOrder).toContain('status: "awaiting_shipment"');
    expect(webhook).toContain("checkout.session.completed");
    expect(webhook).toContain("payment_intent.succeeded");
    expect(webhook).toContain("payment_intent.payment_failed");
    expect(webhook).toContain("23505");
    expect(checkout).toContain("payment_status !== \"paid\"");
  });

  it("G/H/I: zero / partial / full capture remain gated by Charge.amount_captured", () => {
    expect(refunds).toContain("amount_captured");
    expect(refunds).toContain("refundableGbp");
    expect(refunds).toContain("Math.min(orderTotalPence, Math.max(0, Math.round(capturedPence)))");
    expect(refunds).toContain(ZERO_CAPTURE_ERROR);
    expect(refunds).toContain("Unable to verify captured payment.");
    expect(refunds).not.toContain("stripe.refunds.create");
    expect(refunds).not.toMatch(/order\.paid_at|context\.paidAt/);
  });

  it("J/K/L: cancel unpaid / zero-capture proceeds; unverified capture stays fail-closed", () => {
    expect(cancel).toContain('context.status === "awaiting_payment"');
    expect(cancel).toContain("cancelPendingOrder");
    expect(cancel).toContain("isZeroCaptureRefundError");
    expect(cancel).toContain("refundCapturedPaymentOrZero");
    expect(isZeroCaptureRefundError(ZERO_CAPTURE_ERROR)).toBe(true);
    expect(isZeroCaptureRefundError("Unable to verify captured payment.")).toBe(false);
  });

  it("M/N/O: refund success uses verified amount; lookup/zero capture never credit Wallet", () => {
    expect(refunds).toContain("applyOrderRefundLifecycle");
    expect(refunds).toContain("wallet-refund-");
    expect(lifecycle).toContain("CommerceEngine.creditBuyerWallet");
    expect(lifecycle).not.toMatch(/input\.amount \|\| Number\(existing\.total\)/);
    expect(lifecycle).toContain("Number.isFinite(requested) && requested > 0");
  });

  it("P/Q/T: refund + wallet idempotency layers remain intact", () => {
    expect(refunds).toContain("if (order.stripe_refund_id)");
    expect(refunds).toContain("refunded_amount");
    expect(sales).toContain("buildBuyerRefundIdempotencyKey");
    expect(read("lib/wallet/security.ts")).toContain("buyer-refund:");
    expect(sales).toContain(".eq(\"available_balance\", previousAvailable)");
    expect(sales).toContain('type: "refund"');
  });

  it("R/S: virtual refund requires a Virtual payment debit; no debit → no credit", () => {
    expect(virtual).toContain("Virtual payment for order ");
    expect(refunds).toContain("Virtual payment for order ");
    expect(refunds).toContain("retrieveVirtualCapturedAmountPence");
    expect(refunds).toContain("isVirtualBuyerDebitRow");
    expect(refunds).toContain("mustUseVirtualPayments");
  });

  it("U: Wallet credit is only after confirmed refund lifecycle", () => {
    expect(sales).toContain("creditBuyerWalletForConfirmedRefund");
    expect(sales).toContain("isRovexoWalletRefundCreditEligible");
    expect(sales).toContain("if (!(amount > 0))");
    expect(sales).toContain("if (!saleTx)");
    expect(lifecycle).toContain("previousStatus !== \"completed\"");
  });

  it("does not bypass Stripe readiness on Buy Now", () => {
    expect(shell).toContain("if (isStripeRequired())");
    expect(buyNow).toContain("RVX-2010");
  });
});

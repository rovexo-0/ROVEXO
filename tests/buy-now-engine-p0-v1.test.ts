import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUY_NOW_AUTO_CANCEL_MINUTES,
  CHECKOUT_GUARD,
  CHECKOUT_SESSION_TTL_SECONDS,
  FINANCIAL_AUDIT_ENGINE,
  IDEMPOTENCY_ENGINE_mint,
  TRANSACTION_ENGINE_fromOrderId,
  toBloodOrderStatus,
} from "@/lib/checkout/engines";
import { BUY_NOW_BLOOD_FIX_V1, runBuyNowGuard } from "@/lib/checkout/buy-now-guard-v1";
import { ORDER_CHECKOUT_RESERVATION_MINUTES } from "@/lib/orders/checkout";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Master Checkout Architecture — Buy Now engines (order AFTER payment)", () => {
  it("locks 120-second Checkout Session Absolute Law", () => {
    expect(CHECKOUT_SESSION_TTL_SECONDS).toBe(120);
    expect(ORDER_CHECKOUT_RESERVATION_MINUTES).toBe(2);
    expect(BUY_NOW_AUTO_CANCEL_MINUTES).toBe(15); // legacy drain only
    expect(toBloodOrderStatus("awaiting_payment")).toBe("PENDING_PAYMENT");
    expect(toBloodOrderStatus("awaiting_shipment")).toBe("ORDER_CONFIRMED");
  });

  it("auto-expire runs on Buy Now + checkout load (120s sessions)", () => {
    const engine = readSource("lib/checkout/engines/buy-now-engine-v1.ts");
    const loader = readSource("features/checkout/lib/load-checkout-page.ts");
    const autoCancel = readSource("lib/checkout/engines/auto-cancel-engine-v1.ts");
    const sessionEngine = readSource("lib/checkout/engines/checkout-session-engine-v1.ts");
    expect(engine).toContain("CHECKOUT_SESSION_ENGINE_expireAll");
    expect(loader).toContain("CHECKOUT_SESSION_ENGINE_expireAll");
    expect(autoCancel).toContain("CHECKOUT_SESSION_ENGINE_expireAll");
    expect(sessionEngine).toContain("CHECKOUT_SESSION_TTL_SECONDS");
  });

  it("Checkout Guard 16 fail-closed", () => {
    const pass = Object.fromEntries(
      BUY_NOW_BLOOD_FIX_V1.checkoutGuard16Checks.map((k) => [k, true]),
    ) as Record<(typeof BUY_NOW_BLOOD_FIX_V1.checkoutGuard16Checks)[number], boolean>;
    expect(CHECKOUT_GUARD(pass)).toBe("ALL_PASSED");
    expect(CHECKOUT_GUARD({ ...pass, orderID: false })).toBe("STOP");
  });

  it("Financial Audit rejects fee mismatch", () => {
    expect(
      FINANCIAL_AUDIT_ENGINE({ itemPrice: 100, shipping: 5, currency: "GBP", platformFee: 1 }),
    ).toMatchObject({ ok: false });
    expect(FINANCIAL_AUDIT_ENGINE({ itemPrice: 100, shipping: 5, currency: "GBP" })).toMatchObject({
      ok: true,
    });
  });

  it("Idempotency key is stable for same buyer+listing", () => {
    const a = IDEMPOTENCY_ENGINE_mint({ buyerId: "u1", productSlug: "phone" });
    const b = IDEMPOTENCY_ENGINE_mint({ buyerId: "u1", productSlug: "phone" });
    expect(a).toBe(b);
    expect(a.startsWith("bn_")).toBe(true);
    expect(TRANSACTION_ENGINE_fromOrderId("11111111-1111-1111-1111-111111111111")).toContain(
      "txn_",
    );
  });

  it("Buy Now creates Checkout Session only; Confirm & Pay requires cs", () => {
    const api = readSource("app/api/checkout/buy-now/route.ts");
    const loader = readSource("features/checkout/lib/load-checkout-page.ts");
    const ordersApi = readSource("app/api/orders/checkout/route.ts");
    const checkout = readSource("lib/orders/checkout.ts");
    const buyNow = readSource("lib/checkout/engines/buy-now-engine-v1.ts");
    const cleanup = readSource("lib/orders/cleanup.ts");

    expect(api).toContain("BUY_NOW_ENGINE");
    expect(buyNow).toContain("CHECKOUT_SESSION_ENGINE_create");
    expect(buyNow).toContain("orderId: null");
    expect(buyNow).not.toMatch(/orderID:\s*true/);
    expect(buyNow).not.toMatch(/transactionID:\s*true/);
    expect(buyNow).toContain("orderID: Boolean(sessionResult.session.public_id)");
    expect(buyNow).toContain("transactionID: Boolean(paymentIntent.id)");
    expect(loader).toContain("checkoutSessionId");
    expect(loader).toContain("CHECKOUT_SESSION_ENGINE");
    expect(ordersApi).toContain("checkoutSessionId");
    expect(checkout).toContain("finalizeCheckoutSessionPayment");
    expect(checkout).toContain("CHECKOUT_SESSION_TTL_SECONDS");
    expect(cleanup).toContain("AUTO_CANCEL_ENGINE_run");
  });

  it("forbids generic checkout errors on Confirm & Pay path", () => {
    const form = readSource("features/checkout/hooks/use-checkout-form.ts");
    const error = readSource("app/checkout/error.tsx");
    expect(form).not.toContain("Something went wrong");
    expect(form).not.toContain("You're offline");
    expect(error).toContain("RVX_UNCLASSIFIED");
  });

  it("Buy Now guard still STOP without order readiness inputs", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = runBuyNowGuard({
      listing: true,
      buyer: true,
      seller: true,
      price: true,
      shipping: true,
      currency: true,
      lock: true,
      order: false,
      transaction: true,
      paymentSession: true,
      financialAudit: true,
      idempotency: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("RVX-2008");
    info.mockRestore();
    err.mockRestore();
  });
});

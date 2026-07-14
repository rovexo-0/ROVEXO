import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("order checkout success redirect", () => {
  it("uses the canonical checkout success route for Stripe success_url", () => {
    const source = readFileSync("lib/orders/checkout.ts", "utf8");
    expect(source).toContain("/checkout/${product.slug}/success?order_id=");
    expect(source).toContain("session_id={CHECKOUT_SESSION_ID}");
    expect(source).toContain("orderSuccessUrl");
    expect(source).not.toContain("checkout/${product.slug}?${successQuery");
  });

  it("confirms Stripe payment on the checkout success page", () => {
    const success = readFileSync("app/checkout/[slug]/success/page.tsx", "utf8");
    expect(success).toContain("confirmOrderCheckoutSession");
    expect(success).toContain("session_id");
    expect(success).toContain("SUCCESS_ORDER_STATUSES");
    expect(success).toContain("CheckoutSuccessView");
  });

  it("propagates fulfillment failures from Stripe webhooks", () => {
    const webhook = readFileSync("lib/stripe/webhook-handler.ts", "utf8");
    expect(webhook).toContain("if (!result.success)");
    expect(webhook).toContain("completePaidOrderFulfillment");
    expect(webhook).toContain("payment_intent.succeeded");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("order checkout success redirect", () => {
  it("uses the canonical buyer order details route for Stripe success_url", () => {
    const source = readFileSync("lib/orders/checkout.ts", "utf8");
    expect(source).toContain("const orderSuccessUrl = `${baseUrl}/orders/${orderRow.id}?placed=1`");
    expect(source).toContain("success_url: `${orderSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`");
    expect(source).not.toContain("checkout/${product.slug}?${successQuery");
  });

  it("confirms Stripe payment on the order details page", () => {
    const page = readFileSync("app/orders/[id]/page.tsx", "utf8");
    const confirmation = readFileSync(
      "features/orders/components/OrderCheckoutConfirmation.tsx",
      "utf8",
    );

    expect(page).toContain("confirmOrderCheckoutSession");
    expect(page).toContain("session_id");
    expect(page).toContain("OrderCheckoutConfirmation");
    expect(confirmation).toContain("/api/orders/confirm");
    expect(confirmation).toContain("`/orders/${orderId}?placed=1`");
  });

  it("propagates fulfillment failures from Stripe webhooks", () => {
    const webhook = readFileSync("lib/stripe/webhook-handler.ts", "utf8");
    expect(webhook).toContain("if (!result.success)");
    expect(webhook).toContain("completePaidOrderFulfillment");
    expect(webhook).toContain("payment_intent.succeeded");
  });
});

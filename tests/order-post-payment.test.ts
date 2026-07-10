import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("order post-payment pipeline", () => {
  it("delegates Stripe fulfillment to the idempotent post-payment module", () => {
    const checkout = readFileSync("lib/orders/checkout.ts", "utf8");
    const postPayment = readFileSync("lib/orders/post-payment.server.ts", "utf8");

    expect(checkout).toContain("completePaidOrderFulfillment");
    expect(checkout).not.toContain("if (order.status !== \"awaiting_payment\")");
    expect(postPayment).toContain("export async function completePaidOrderFulfillment");
  });

  it("always runs escrow, shipping, and notifications for paid orders", () => {
    const source = readFileSync("lib/orders/post-payment.server.ts", "utf8");

    expect(source).toContain("openEscrowForOrder");
    expect(source).toContain("ensureOrderShippingPipeline");
    expect(source).toContain("notifyOrderPaid");
    expect(source).toContain("sellerHasSaleTransaction");
    expect(source).toContain("PAID_ORDER_STATUSES");
  });
});

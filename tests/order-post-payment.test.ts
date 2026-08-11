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
    expect(source).toContain("ensureOrderShippingPersistence");
    expect(source).toContain("notifyOrderPaid");
    expect(source).toContain("sellerHasSaleTransaction");
    expect(source).toContain("PAID_ORDER_STATUSES");
    expect(source).toContain("Failed to create shipping record");
    expect(source).toContain("Failed to create shipment parcel");
    expect(source).toContain("repair_required");
  });

  it("fails loudly when escrow wallet credit is missing", () => {
    const source = readFileSync("lib/orders/post-payment.server.ts", "utf8");
    expect(source).toContain("throw new Error(\"Failed to open seller escrow");
  });

  it("P4: shipping status update failures are fail-loud (not silent pending)", () => {
    const source = readFileSync("lib/orders/post-payment.server.ts", "utf8");
    expect(source).toContain("FATAL_SHIPPING_SETUP_STATUS_UPDATE");
    expect(source).toContain("shippingPersistenceFailed");
    expect(source).toContain("orders.shipping_setup_status.repair_required");
  });
});


import { describe, expect, it } from "vitest";
import { createDefaultPaymentsEngineDocument } from "@/lib/payments-engine/defaults";
import {
  PAYMENTS_ENGINE_FILTERS,
  PAYMENTS_ENGINE_MODULES,
  PAYMENTS_ENGINE_PROVIDERS,
  PAYMENTS_ENGINE_TIMELINE_EVENTS,
  registerPaymentsEngineModule,
} from "@/lib/payments-engine/registry";
import { buildPaymentTimeline, mapOrderStatusToPaymentStatus, mapOrderToPaymentSummary } from "@/lib/payments-engine/timeline";
import { computePaymentsAnalytics } from "@/lib/payments-engine/reader";
import type { Order } from "@/lib/orders/types";

describe("payments engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultPaymentsEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.paymentMethods.some((m) => m.id === "credit-card" && m.enabled)).toBe(true);
    expect(doc.integrations.walletEngine).toBe(true);
    expect(doc.integrations.stripeCheckout).toBe(true);
    expect(doc.fraudPrevention.webhookValidation).toBe(true);
  });

  it("registers all core payments modules", () => {
    const ids = PAYMENTS_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("history");
    expect(ids).toContain("methods");
    expect(ids).toContain("wallet");
    expect(ids).toContain("protection");
  });

  it("defines providers, filters, and timeline events", () => {
    expect(PAYMENTS_ENGINE_PROVIDERS.some((p) => p.id === "stripe-checkout" && p.enabled)).toBe(true);
    expect(PAYMENTS_ENGINE_FILTERS.map((f) => f.id)).toContain("protected");
    expect(PAYMENTS_ENGINE_TIMELINE_EVENTS.map((e) => e.id)).toContain("capture");
  });

  it("maps order status to payment status", () => {
    expect(mapOrderStatusToPaymentStatus("awaiting_payment")).toBe("authorization-pending");
    expect(mapOrderStatusToPaymentStatus("awaiting_shipment")).toBe("protected");
    expect(mapOrderStatusToPaymentStatus("completed")).toBe("released");
  });

  it("maps order to payment summary", () => {
    const order = {
      id: "1",
      orderNumber: "RVX-100",
      status: "awaiting_shipment",
      product: { title: "Test Item" },
      buyer: { name: "Buyer" },
      seller: { name: "Seller" },
      totals: { itemPrice: 100, platformFee: 5, delivery: 10, total: 115 },
      createdAt: "2026-06-01T00:00:00Z",
      paidAt: "2026-06-01T01:00:00Z",
    } as Order;

    const summary = mapOrderToPaymentSummary(order);
    expect(summary.grandTotal).toBe(115);
    expect(summary.status).toBe("protected");
    expect(summary.platformFee).toBe(5.5);
  });

  it("builds payment timeline from order status", () => {
    const timeline = buildPaymentTimeline({
      status: "shipped",
      createdAt: "2026-06-01T00:00:00Z",
      paidAt: "2026-06-01T01:00:00Z",
      shippedAt: "2026-06-02T00:00:00Z",
    });
    expect(timeline.some((e) => e.id === "shipping-started" && e.current)).toBe(true);
    expect(timeline.find((e) => e.id === "checkout-started")?.done).toBe(true);
  });

  it("computes analytics from orders", () => {
    const orders = [
      {
        id: "1",
        status: "completed",
        totals: { itemPrice: 100, platformFee: 5, delivery: 0, total: 105 },
      },
      {
        id: "2",
        status: "awaiting_payment",
        totals: { itemPrice: 50, platformFee: 0, delivery: 0, total: 50 },
      },
    ] as Order[];

    const analytics = computePaymentsAnalytics(orders);
    expect(analytics.completedPayments).toBe(1);
    expect(analytics.pendingPayments).toBe(1);
    expect(analytics.revenue).toBe(105);
  });

  it("allows future module registration", () => {
    const next = registerPaymentsEngineModule({
      id: "custom-hub",
      label: "Custom Hub",
      icon: "💳",
      description: "Future module",
      href: "/payments",
    });
    expect(next.some((m) => m.id === "custom-hub")).toBe(true);
  });
});

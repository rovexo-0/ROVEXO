import { describe, expect, it } from "vitest";
import { createDefaultOrdersEngineDocument } from "@/lib/orders-engine/defaults";
import {
  ORDERS_ENGINE_FILTERS,
  ORDERS_ENGINE_LIFECYCLE_STAGES,
  ORDERS_ENGINE_MODULES,
  ORDERS_ENGINE_TIMELINE_EVENTS,
  registerOrdersEngineModule,
} from "@/lib/orders-engine/registry";
import { buildOrderTimeline, mapOrderStatusToLifecycle } from "@/lib/orders-engine/timeline";
import { computeOrdersAnalytics } from "@/lib/orders-engine/reader";
import type { Order } from "@/lib/orders/types";

describe("orders engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultOrdersEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.orderTypes.some((t) => t.id === "marketplace" && t.enabled)).toBe(true);
    expect(doc.integrations.shippingEngine).toBe(true);
    expect(doc.integrations.buyerProtection).toBe(true);
  });

  it("registers all core orders modules", () => {
    const ids = ORDERS_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("buyer-dashboard");
    expect(ids).toContain("seller-dashboard");
    expect(ids).toContain("shipping");
    expect(ids).toContain("protection");
  });

  it("defines full lifecycle stages and timeline events", () => {
    expect(ORDERS_ENGINE_LIFECYCLE_STAGES).toContain("payment-pending");
    expect(ORDERS_ENGINE_LIFECYCLE_STAGES).toContain("completed");
    expect(ORDERS_ENGINE_TIMELINE_EVENTS.map((e) => e.id)).toContain("dispatched");
    expect(ORDERS_ENGINE_FILTERS.map((f) => f.id)).toContain("disputed");
  });

  it("maps order status to enterprise lifecycle", () => {
    expect(mapOrderStatusToLifecycle("awaiting_payment")).toBe("payment-pending");
    expect(mapOrderStatusToLifecycle("shipped")).toBe("in-transit");
    expect(mapOrderStatusToLifecycle("completed")).toBe("completed");
  });

  it("builds order timeline from order status", () => {
    const timeline = buildOrderTimeline({
      status: "shipped",
      createdAt: "2026-06-01T00:00:00Z",
      paidAt: "2026-06-01T01:00:00Z",
      shippedAt: "2026-06-02T00:00:00Z",
      hasTracking: true,
    });
    expect(timeline.some((e) => e.id === "tracking-updated" && e.current)).toBe(true);
    expect(timeline.find((e) => e.id === "created")?.done).toBe(true);
  });

  it("computes analytics from orders", () => {
    const orders = [
      {
        id: "1",
        status: "completed",
        createdAt: new Date().toISOString(),
        totals: { total: 100, platformFee: 5 },
      },
      {
        id: "2",
        status: "cancelled",
        createdAt: new Date().toISOString(),
        totals: { total: 50, platformFee: 0 },
      },
    ] as Order[];

    const analytics = computeOrdersAnalytics(orders);
    expect(analytics.completedOrders).toBe(1);
    expect(analytics.cancelledOrders).toBe(1);
    expect(analytics.revenue).toBe(100);
  });

  it("allows future module registration", () => {
    const next = registerOrdersEngineModule({
      id: "custom-hub",
      label: "Custom Hub",
      icon: "📦",
      description: "Future module",
      href: "/orders",
    });
    expect(next.some((m) => m.id === "custom-hub")).toBe(true);
  });
});

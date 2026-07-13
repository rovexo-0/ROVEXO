import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildSoldSummary,
  countOrdersByFilter,
  matchesOrdersHubStatusFilter,
} from "@/lib/orders/hub-summary";
import { getOrdersHubTimeline, getOrdersHubTimelineProgress } from "@/lib/orders/hub-timeline";
import type { Order } from "@/lib/orders/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function mockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord_1",
    orderNumber: "RX-1001",
    status: "shipped",
    product: {
      id: "p1",
      slug: "item",
      title: "Test Item",
      price: 40,
      imageUrl: "/placeholder-product.svg",
      condition: "New",
    },
    buyer: { id: "b1", name: "Buyer One" },
    seller: { id: "s1", name: "Seller One" },
    totals: { itemPrice: 40, platformFee: 0, delivery: 0, total: 40 },
    deliveryCarrier: "Royal Mail",
    createdAt: "2026-07-01T10:00:00.000Z",
    disputesDisabled: false,
    ...overrides,
  };
}

describe("Orders Hub v1.0 engineering spec", () => {
  it("locks engineering section tree and tokens", () => {
    const hub = readSource("features/orders/components/OrdersHubV1.tsx");
    const css = readSource("styles/rovexo/orders-hub-v1.css");
    const route = readSource("app/orders/page.tsx");

    expect(hub).toContain('data-orders-ui="v1.0-engineering-spec"');
    expect(hub).toContain("orders-v2__stats");
    expect(hub).toContain("orders-v2__chips");
    expect(hub).toContain("orders-v2__chip-count");
    expect(hub).toContain("Sell an Item");
    expect(hub).toContain("Browse Marketplace");
    expect(hub).toContain("memo(");
    expect(css).toContain("height: 80px");
    expect(css).toContain("height: 54px");
    expect(css).toContain("154px");
    expect(css).toContain("136px");
    expect(css).toContain("scroll-snap-type: x mandatory");
    expect(css).toContain("height: 215px");
    expect(css).toContain("110px");
    expect(css).toContain("height: 4px");
    expect(css).toContain("#7c3aed");
    expect(route).toContain("OrdersHubV1");
  });

  it("exposes live chip counts and sold stats", () => {
    const orders = [
      mockOrder({ id: "1", status: "awaiting_shipment" }),
      mockOrder({ id: "2", status: "shipped" }),
      mockOrder({ id: "3", status: "completed" }),
      mockOrder({ id: "4", status: "cancelled" }),
    ];
    const counts = countOrdersByFilter(orders);
    expect(counts.all).toBe(4);
    expect(counts.processing).toBe(1);
    expect(counts.shipping).toBe(1);
    expect(counts.completed).toBe(1);
    expect(counts.cancelled).toBe(1);
    expect(matchesOrdersHubStatusFilter(orders[1]!, "shipping")).toBe(true);

    const sold = buildSoldSummary([]);
    expect(sold.map((c) => c.title)).toEqual([
      "Total Sales",
      "Pending Payout",
      "Orders",
      "Positive Feedback",
    ]);
    expect(sold.find((c) => c.id === "feedback")?.value).toBe("100%");
  });

  it("builds timeline progress for Paid→Delivered", () => {
    const steps = getOrdersHubTimeline(mockOrder({ status: "shipped" }));
    expect(steps.map((s) => s.id)).toEqual(["paid", "packed", "shipped", "delivered"]);
    expect(getOrdersHubTimelineProgress(mockOrder({ status: "completed" }))).toBe(100);
  });
});

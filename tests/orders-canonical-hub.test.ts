import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildBoughtSummary,
  buildSoldSummary,
  matchesOrdersHubStatusFilter,
  sortOrdersHub,
} from "@/lib/orders/hub-summary";
import { getOrdersHubTimeline } from "@/lib/orders/hub-timeline";
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

describe("Orders Hub v1.0 canonical", () => {
  it("locks full mockup section tree in hub + css", () => {
    const hub = readSource("features/orders/components/OrdersHubV1.tsx");
    const css = readSource("styles/rovexo/orders-hub-v1.css");
    const route = readSource("app/orders/page.tsx");
    const indexCss = readSource("styles/rovexo/index.css");
    const legacy = readSource("styles/rovexo/account-settings-ui.css");

    expect(hub).toContain('data-orders-ui="v1.0-canonical-mockup"');
    expect(hub).toContain('data-orders-sections="header,tabs,summary,chips,list"');
    expect(hub).toContain("orders-v2__summary");
    expect(hub).toContain("orders-v2__filters");
    expect(hub).toContain("orders-v2__timeline");
    expect(hub).toContain("orders-v2__empty");
    expect(hub).toContain("Browse Marketplace");
    expect(hub).toContain("Sell an Item");
    expect(hub).toContain("/notifications");
    expect(css).toContain(".orders-v2__summary");
    expect(css).toContain("height: 92px");
    expect(css).toContain("height: 40px");
    expect(css).toContain("96px");
    expect(css).toContain("#7c3aed");
    expect(css).toContain("0 4px 20px rgba(17, 24, 39, 0.05)");
    expect(indexCss).toContain("orders-hub-v1.css");
    expect(route).toContain("OrdersHubV1");
    expect(route).toContain("OrdersHubSkeleton");
    expect(legacy).not.toContain(".orders-canonical-tabs");
  });

  it("maps status filters and sold summary cards", () => {
    const processing = mockOrder({ status: "awaiting_shipment" });
    const shipping = mockOrder({ status: "shipped" });
    const completed = mockOrder({ status: "completed" });
    const cancelled = mockOrder({ status: "cancelled" });

    expect(matchesOrdersHubStatusFilter(processing, "processing")).toBe(true);
    expect(matchesOrdersHubStatusFilter(shipping, "shipping")).toBe(true);
    expect(matchesOrdersHubStatusFilter(completed, "completed")).toBe(true);
    expect(matchesOrdersHubStatusFilter(cancelled, "cancelled")).toBe(true);

    const sold = buildSoldSummary([processing, shipping, completed, cancelled]);
    expect(sold.map((card) => card.title)).toEqual([
      "Total Sales",
      "Pending Payout",
      "Orders",
      "Positive Feedback",
    ]);

    const bought = buildBoughtSummary([processing, completed]);
    expect(bought.map((card) => card.title)).toEqual([
      "Total Spent",
      "In Progress",
      "Orders",
      "Completed",
    ]);
  });

  it("builds Paid → Packed → Shipped → Delivered timeline", () => {
    const steps = getOrdersHubTimeline(mockOrder({ status: "shipped" }));
    expect(steps.map((step) => step.id)).toEqual(["paid", "packed", "shipped", "delivered"]);
    expect(steps[0]?.state).toBe("complete");
    expect(steps[1]?.state).toBe("complete");
    expect(steps[2]?.state).toBe("current");
    expect(steps[3]?.state).toBe("future");
  });

  it("sorts newest first by default helper", () => {
    const older = mockOrder({ id: "a", createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = mockOrder({ id: "b", createdAt: "2026-06-01T00:00:00.000Z" });
    expect(sortOrdersHub([older, newer], "newest").map((o) => o.id)).toEqual(["b", "a"]);
  });

  it("redirects seller orders list to canonical hub", () => {
    const sellerList = readSource("app/seller/orders/page.tsx");
    expect(sellerList).toContain('permanentRedirect("/orders")');
  });
});

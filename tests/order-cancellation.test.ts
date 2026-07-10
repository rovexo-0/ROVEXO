import { describe, expect, it } from "vitest";
import {
  BUYER_CANCELLATION_REASON,
  evaluateBuyerCancellationEligibility,
  isBuyerCancellableOrderStatus,
} from "@/lib/orders/cancellation";
import { canPerformOrderAction } from "@/lib/orders/role";
import { buildOrderTimeline } from "@/lib/orders-engine/timeline";
import type { Order } from "@/lib/orders/types";

function baseOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderNumber: "RVX-1001",
    status: "awaiting_shipment",
    product: {
      id: "p1",
      slug: "item",
      title: "Test item",
      price: 50,
      imageUrl: "/placeholder-product.svg",
      condition: "new",
    },
    buyer: { id: "buyer-1", name: "Buyer" },
    seller: { id: "seller-1", name: "Seller" },
    totals: { itemPrice: 45, platformFee: 5, delivery: 5, total: 50 },
    deliveryCarrier: "Royal Mail",
    createdAt: "2026-07-01T10:00:00Z",
    paidAt: "2026-07-01T10:05:00Z",
    disputesDisabled: false,
    ...overrides,
  };
}

describe("order cancellation eligibility", () => {
  it("allows cancellation for awaiting payment and awaiting shipment", () => {
    expect(isBuyerCancellableOrderStatus("awaiting_payment")).toBe(true);
    expect(isBuyerCancellableOrderStatus("awaiting_shipment")).toBe(true);
    expect(isBuyerCancellableOrderStatus("shipped")).toBe(false);
  });

  it("blocks cancellation when a label is ready", () => {
    const result = evaluateBuyerCancellationEligibility({
      status: "awaiting_shipment",
      shippingRecordStatus: "preparing",
      parcelStatuses: [],
      hasReadyLabel: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/label/i);
  });

  it("blocks cancellation after shipment collection", () => {
    const result = evaluateBuyerCancellationEligibility({
      status: "awaiting_shipment",
      shippingRecordStatus: "collected",
      parcelStatuses: [],
      hasReadyLabel: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/collected|started/i);
  });

  it("allows legacy awaiting_shipment orders without labels", () => {
    const result = evaluateBuyerCancellationEligibility({
      status: "awaiting_shipment",
      shippingRecordStatus: null,
      parcelStatuses: [],
      hasReadyLabel: false,
    });
    expect(result.allowed).toBe(true);
  });

  it("stores canonical buyer cancellation reason", () => {
    expect(BUYER_CANCELLATION_REASON).toBe("Buyer Cancelled");
  });

  it("permits buyer cancel action only for cancellable statuses", () => {
    const buyerId = "buyer-1";
    const cancellable = baseOrder({ status: "awaiting_shipment" });
    const shipped = baseOrder({ status: "shipped" });

    expect(canPerformOrderAction("cancel", cancellable, buyerId)).toBe(true);
    expect(canPerformOrderAction("cancel", shipped, buyerId)).toBe(false);
  });
});

describe("cancelled order timeline", () => {
  it("marks paid, cancelled, refund initiated, and refund completed events", () => {
    const timeline = buildOrderTimeline({
      status: "cancelled",
      createdAt: "2026-07-01T10:00:00Z",
      paidAt: "2026-07-01T10:05:00Z",
      cancelledAt: "2026-07-01T11:00:00Z",
      refundCreatedAt: "2026-07-01T11:00:30Z",
      refundedAt: "2026-07-01T11:01:00Z",
    });

    expect(timeline.map((e) => e.id)).toEqual([
      "created",
      "paid",
      "cancelled",
      "refund-initiated",
      "refunded",
    ]);
    expect(timeline.find((e) => e.id === "created")?.done).toBe(true);
    expect(timeline.find((e) => e.id === "paid")?.done).toBe(true);
    expect(timeline.find((e) => e.id === "cancelled")?.done).toBe(true);
    expect(timeline.find((e) => e.id === "refund-initiated")?.done).toBe(true);
    expect(timeline.find((e) => e.id === "refunded")?.current).toBe(true);
    expect(timeline.find((e) => e.id === "refunded")?.timestamp).toBe("2026-07-01T11:01:00Z");
  });
});

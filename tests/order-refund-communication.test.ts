import { describe, expect, it } from "vitest";
import {
  buildOrderRefundView,
  formatRefundReference,
  getBuyerOrderListRefundLabel,
  getRefundBadge,
  mapStripeRefundStatus,
} from "@/lib/orders/refund-status";
import { buildOrderTimeline } from "@/lib/orders-engine/timeline";
import type { Order } from "@/lib/orders/types";

function baseOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderNumber: "RVX-1001",
    status: "cancelled",
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
    cancelledAt: "2026-07-01T11:00:00Z",
    disputesDisabled: false,
    ...overrides,
  };
}

describe("refund status helpers", () => {
  it("formats refund references as RF-XXXXXXXX", () => {
    expect(formatRefundReference("re_1A2B3C4D5E6F7G8H")).toMatch(/^RF-[A-Z0-9]{8}$/);
  });

  it("maps stripe refund statuses to lifecycle states", () => {
    expect(mapStripeRefundStatus("pending")).toBe("processing");
    expect(mapStripeRefundStatus("succeeded")).toBe("completed");
    expect(mapStripeRefundStatus("failed")).toBe("failed");
    expect(mapStripeRefundStatus(undefined)).toBe("initiated");
  });

  it("builds buyer refund view with badge tones", () => {
    const view = buildOrderRefundView(
      baseOrder({
        refundStatus: "processing",
        stripeRefundId: "re_test123456",
        refundReference: "RF-TEST1234",
        refundedAmount: 50,
        refundCreatedAt: "2026-07-01T11:00:30Z",
        refundPaymentMethod: "Visa ending 4242",
      }),
    );

    expect(view?.badgeLabel).toBe("Refund in progress");
    expect(view?.badgeTone).toBe("orange");
    expect(view?.statusEmoji).toBe("🟡");
    expect(view?.reference).toBe("RF-TEST1234");
    expect(view?.paymentMethod).toBe("Visa ending 4242");
  });

  it("shows refunded badge when refund completed", () => {
    const badge = getRefundBadge("completed");
    expect(badge.label).toBe("Refunded");
    expect(badge.tone).toBe("green");
    expect(getBuyerOrderListRefundLabel(
      baseOrder({
        refundStatus: "completed",
        refundCompletedAt: "2026-07-01T11:01:00Z",
        stripeRefundId: "re_done123",
      }),
    )).toBe("Refunded");
  });

  it("shows refund in progress on buyer order list", () => {
    expect(
      getBuyerOrderListRefundLabel(
        baseOrder({
          refundStatus: "initiated",
          stripeRefundId: "re_pending",
          refundCreatedAt: "2026-07-01T11:00:30Z",
        }),
      ),
    ).toBe("Refund in progress");
  });

  it("returns null when no refund activity exists", () => {
    expect(buildOrderRefundView(baseOrder({ refundStatus: undefined, stripeRefundId: undefined }))).toBeNull();
  });
});

describe("refund timeline communication", () => {
  it("shows refund initiated as current stage before completion", () => {
    const timeline = buildOrderTimeline({
      status: "cancelled",
      createdAt: "2026-07-01T10:00:00Z",
      paidAt: "2026-07-01T10:05:00Z",
      cancelledAt: "2026-07-01T11:00:00Z",
      refundCreatedAt: "2026-07-01T11:00:30Z",
    });

    expect(timeline.find((e) => e.id === "refund-initiated")?.current).toBe(true);
    expect(timeline.find((e) => e.id === "refunded")?.done).toBe(false);
  });
});

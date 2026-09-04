import { describe, expect, it } from "vitest";
import {
  BUYER_CANCELLATION_REASON,
  BUYER_CANCELLATION_REASON_OPTIONS,
  SELLER_CANCELLATION_REASON_OPTIONS,
  evaluateBuyerCancellationEligibility,
  evaluateSellerCancellationEligibility,
  isBuyerCancellableOrderStatus,
  isSellerCancellableOrderStatus,
  resolveBuyerCancellationReason,
  resolveSellerCancellationReason,
} from "@/lib/orders/cancellation";
import { getDeliveryStages } from "@/lib/orders/delivery";
import { canPerformOrderAction } from "@/lib/orders/role";
import { buildOrderTimeline } from "@/lib/orders-engine/timeline";
import type { Order } from "@/lib/orders/types";
import { readFileSync } from "node:fs";
import path from "node:path";

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

  it("resolves buyer cancellation reason options", () => {
    expect(resolveBuyerCancellationReason("changed_mind")).toBe("I changed my mind");
    expect(resolveBuyerCancellationReason("seller_too_long")).toBe(
      "Seller is taking too long to ship",
    );
    expect(resolveBuyerCancellationReason("unknown")).toBe(BUYER_CANCELLATION_REASON);
    expect(BUYER_CANCELLATION_REASON_OPTIONS).toHaveLength(5);
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

describe("delivery stages for View Order", () => {
  it("renders Awaiting Shipment → Shipped → In Transit → Delivered", () => {
    const stages = getDeliveryStages(baseOrder({ status: "awaiting_shipment" }));
    expect(stages.map((s) => s.label)).toEqual([
      "Awaiting Shipment",
      "Shipped",
      "In Transit",
      "Delivered",
    ]);
    expect(stages.find((s) => s.id === "placed")?.current).toBe(true);
    expect(stages.find((s) => s.id === "placed")?.description).toMatch(/preparing/i);
  });

  it("marks In Transit current when shipped with tracking", () => {
    const stages = getDeliveryStages(
      baseOrder({
        status: "shipped",
        shippedAt: "2026-07-02T10:00:00Z",
        trackingNumber: "EVRI123",
      }),
    );
    expect(stages.find((s) => s.id === "in_transit")?.current).toBe(true);
    expect(stages.find((s) => s.id === "shipped")?.done).toBe(true);
  });
});

describe("cancellation UI + inventory restore contracts", () => {
  it("BuyerCancelOrderCard never uses window.confirm and requires reason", () => {
    const src = readFileSync(
      path.join(process.cwd(), "features/orders/components/BuyerCancelOrderCard.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/\bwindow\.confirm\s*\(/);
    expect(src).toContain("cancellationReasonId");
    expect(src).toContain("Select a reason");
    expect(src).toContain("formatCurrency");
    expect(src).toContain("Cancel your purchase before the seller ships the item.");
    expect(src).toContain('data-order-detail-action="cancel"');
    expect(src).toContain("BanLineIcon");
  });

  it("Order Details action cards match IMAGE 2 layout contracts", () => {
    const actions = readFileSync(
      path.join(process.cwd(), "features/orders/components/OrderActionsCard.tsx"),
      "utf8",
    );
    const detail = readFileSync(
      path.join(process.cwd(), "features/orders/components/OrderDetailView.tsx"),
      "utf8",
    );
    const css = readFileSync(
      path.join(process.cwd(), "styles/rovexo/order-detail-action-cards-v1.css"),
      "utf8",
    );
    const hubView = readFileSync(
      path.join(process.cwd(), "lib/inbox/conversation-view.ts"),
      "utf8",
    );

    expect(actions).toContain('data-order-detail-action="messages"');
    expect(actions).toContain("Open Messages Hub");
    expect(detail).toContain('data-order-detail-actions="v1.0"');
    expect(detail).toMatch(
      /data-order-detail-actions="v1\.0"[\s\S]*OrderActionsCard[\s\S]*BuyerCancelOrderCard/,
    );
    expect(css).toContain("order-detail-action-card--messages");
    expect(css).toContain("order-detail-action-card--cancel");
    expect(hubView).toContain("no sticky duplicate");
  });

  it("cancelBuyerOrder restores inventory via canonical Inventory Engine helpers", () => {
    const src = readFileSync(
      path.join(process.cwd(), "lib/orders/cancel-order.server.ts"),
      "utf8",
    );
    expect(src).toContain("restoreInventoryAfterOrderCancellation");
    expect(src).toContain("healInventoryAfterCancelledOrder");
    expect(src).toContain("markOrderCancelled");
    expect(src).toContain("cancellationReasonId");
  });

  it("inventory restore skips deleted/inactive listings", () => {
    const src = readFileSync(path.join(process.cwd(), "lib/inventory/service.ts"), "utf8");
    expect(src).toContain("restoreInventoryAfterOrderCancellation");
    expect(src).toContain('product.status === "deleted"');
    expect(src).toContain('product.status === "paused"');
    expect(src).toContain("healInventoryAfterCancelledOrder");
    expect(src).toContain("restoreProductInventoryClaim");
  });
});

describe("seller cancellation eligibility", () => {
  it("allows awaiting_shipment without a label", () => {
    expect(isSellerCancellableOrderStatus("awaiting_shipment")).toBe(true);
    expect(isSellerCancellableOrderStatus("awaiting_payment")).toBe(false);
    const result = evaluateSellerCancellationEligibility({
      status: "awaiting_shipment",
      shippingRecordStatus: null,
      parcelStatuses: [],
    });
    expect(result.allowed).toBe(true);
  });

  it("allows cancellation when a label is ready but carrier has not collected", () => {
    const result = evaluateSellerCancellationEligibility({
      status: "awaiting_shipment",
      shippingRecordStatus: "preparing",
      parcelStatuses: ["preparing"],
    });
    expect(result.allowed).toBe(true);
  });

  it("rejects collected and later carrier statuses", () => {
    expect(
      evaluateSellerCancellationEligibility({
        status: "awaiting_shipment",
        shippingRecordStatus: "collected",
        parcelStatuses: [],
      }).allowed,
    ).toBe(false);
    expect(
      evaluateSellerCancellationEligibility({
        status: "awaiting_shipment",
        shippingRecordStatus: "in_transit",
        parcelStatuses: [],
      }).allowed,
    ).toBe(false);
  });

  it("rejects shipped, delivered, completed, cancelled, and refunded", () => {
    expect(evaluateSellerCancellationEligibility({
      status: "shipped",
      shippingRecordStatus: null,
      parcelStatuses: [],
    }).allowed).toBe(false);
    expect(evaluateSellerCancellationEligibility({
      status: "delivered",
      shippingRecordStatus: null,
      parcelStatuses: [],
    }).allowed).toBe(false);
    expect(evaluateSellerCancellationEligibility({
      status: "completed",
      shippingRecordStatus: null,
      parcelStatuses: [],
    }).allowed).toBe(false);
    expect(evaluateSellerCancellationEligibility({
      status: "cancelled",
      shippingRecordStatus: null,
      parcelStatuses: [],
    }).reason).toMatch(/already been cancelled/i);
    expect(evaluateSellerCancellationEligibility({
      status: "awaiting_shipment",
      shippingRecordStatus: null,
      parcelStatuses: [],
      alreadyRefunded: true,
    }).allowed).toBe(false);
  });

  it("resolves seller reasons and rejects invalid ids", () => {
    expect(resolveSellerCancellationReason("out_of_stock")).toBe("Out of stock");
    expect(resolveSellerCancellationReason("item_damaged")).toBe("Item damaged");
    expect(resolveSellerCancellationReason("item_no_longer_available")).toBe(
      "Item no longer available",
    );
    expect(resolveSellerCancellationReason("unable_to_proceed")).toBe("Unable to proceed");
    expect(resolveSellerCancellationReason("other")).toBe("Other");
    expect(resolveSellerCancellationReason("unknown")).toBeNull();
    expect(SELLER_CANCELLATION_REASON_OPTIONS).toHaveLength(5);
    expect(SELLER_CANCELLATION_REASON_OPTIONS.map((option) => option.label)).not.toContain(
      "Item cannot be located",
    );
    expect(SELLER_CANCELLATION_REASON_OPTIONS.map((option) => option.label)).not.toContain(
      "Unable to fulfil order",
    );
  });

  it("authorizes seller cancel on own awaiting_shipment order only", () => {
    const own = baseOrder({ status: "awaiting_shipment" });
    const shipped = baseOrder({ status: "shipped" });
    expect(canPerformOrderAction("cancel", own, "seller-1")).toBe(true);
    expect(canPerformOrderAction("cancel", own, "buyer-1")).toBe(true);
    expect(canPerformOrderAction("cancel", own, "seller-2")).toBe(false);
    expect(canPerformOrderAction("cancel", shipped, "seller-1")).toBe(false);
    expect(canPerformOrderAction("refund", own, "seller-1")).toBe(true);
  });
});

describe("seller cancellation timeline and buyer result", () => {
  it("exposes placed, paid, preparing, and cancelled-by-seller stages", () => {
    const stages = getDeliveryStages(
      baseOrder({
        status: "cancelled",
        cancellationReason: "Out of stock",
        cancelledAt: "2026-07-01T12:00:00Z",
        refundedAmount: 50,
      }),
    );
    expect(stages.map((s) => s.label)).toEqual([
      "Order placed",
      "Payment confirmed",
      "Preparing order",
      "Cancelled by seller",
    ]);
    expect(stages.find((s) => s.id === "cancelled")?.description).toBe("Reason: Out of stock");
  });
});

describe("seller cancellation contracts", () => {
  it("reuses existing refund, wallet, Sendcloud, and notification helpers", () => {
    const cancel = readFileSync(
      path.join(process.cwd(), "lib/orders/cancel-order.server.ts"),
      "utf8",
    );
    const store = readFileSync(path.join(process.cwd(), "lib/orders/store.ts"), "utf8");
    const api = readFileSync(path.join(process.cwd(), "app/api/orders/[id]/route.ts"), "utf8");
    const notify = readFileSync(
      path.join(process.cwd(), "lib/orders/notifications.ts"),
      "utf8",
    );
    const hub = readFileSync(
      path.join(process.cwd(), "features/inbox/components/ConversationHub.tsx"),
      "utf8",
    );
    const card = readFileSync(
      path.join(process.cwd(), "lib/inbox/transaction-status-card-v1.ts"),
      "utf8",
    );
    const detail = readFileSync(
      path.join(process.cwd(), "features/orders/components/OrderDetailView.tsx"),
      "utf8",
    );

    expect(cancel).toContain("export async function cancelSellerOrder");
    expect(cancel).toContain("createOrderStripeRefund");
    expect(cancel).toContain("CommerceEngine.refundSeller");
    expect(cancel).toContain("cancelSendcloudParcels");
    expect(cancel).toContain("notifyBuyerOrderCancelledBySeller");
    expect(cancel).toContain('reason: "seller_cancelled"');
    expect(store).toContain("cancelSellerOrder");
    expect(store).toContain("actorUserId === existing.seller.id");
    expect(api).toContain("requireCookieOrBearerApiAuth");
    expect(api).toContain("applyOrderAction(id, body.action, payload, auth.user.id)");
    expect(notify).toContain("Order cancelled by seller");
    expect(notify).toContain("Reason: ${input.reason}");
    expect(hub).toContain('actor="seller"');
    expect(hub).toContain('setSellerCancelOpen(true)');
    expect(hub).toContain('actionId === "print_label"');
    expect(store).toContain('throw new Error("Unauthorized.")');
    expect(store).toContain('error: "Forbidden."');
    expect(api).toContain("requireCookieOrBearerApiAuth");
    expect(card).toContain('label: "CREATE SHIPPING LABEL"');
    expect(card).toContain('label: "CANCEL ORDER"');
    expect(detail).toContain("Cancelled by seller");
    expect(detail).toContain("Refunded to Wallet");
    expect(store).toContain('if (action === "refund")');
    expect(cancel).toContain("export async function cancelBuyerOrder");
    expect(cancel).toContain("isZeroCaptureRefundError");
    expect(cancel).toContain("refundCapturedPaymentOrZero");
  });

  it("CREATE LABEL remains the seller primary action", () => {
    const card = readFileSync(
      path.join(process.cwd(), "lib/inbox/transaction-status-card-v1.ts"),
      "utf8",
    );
    expect(card).toContain('primaryAction: { id: "print_label", label: "CREATE SHIPPING LABEL" }');
  });
});

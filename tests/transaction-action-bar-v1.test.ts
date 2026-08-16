import { describe, expect, it } from "vitest";
import { buildConversationHubView } from "@/lib/inbox/conversation-view";
import {
  TRANSACTION_ACTION_BAR_MAX_BUTTONS,
  TRANSACTION_ACTION_BAR_VERSION,
} from "@/lib/inbox/transaction-action-bar-v1";
import type { Conversation } from "@/lib/messages/types";
import type { Order } from "@/lib/orders/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const buyerCounterparty = {
  id: "conv-1",
  participant: {
    id: "u1",
    name: "Alex Buyer",
    role: "buyer" as const,
    online: true,
  },
  product: {
    id: "p1",
    slug: "sony-headphones",
    title: "Sony WH-1000XM5 Wireless Headphones",
    price: 120,
    condition: "Good",
    imageUrl: "/placeholder-product.svg",
    status: "sold" as const,
    listingType: "fixed" as const,
    acceptOffers: true,
  },
  lastMessage: "Hi",
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
  pinned: false,
  archived: false,
  muted: false,
  blocked: false,
  messages: [],
} as Conversation;

function order(status: Order["status"], extra: Partial<Order> = {}): Order {
  return {
    id: "o1",
    orderNumber: "RX-1",
    status,
    product: buyerCounterparty.product,
    buyer: { id: "b", name: "Buyer" },
    seller: { id: "s", name: "Seller" },
    totals: { itemPrice: 120, platformFee: 6.6, delivery: 0, total: 126.6 },
    deliveryCarrier: "Royal Mail",
    trackingNumber: null,
    createdAt: new Date().toISOString(),
    shippedAt: null,
    disputesDisabled: false,
    ...extra,
  } as Order;
}

describe("Dynamic Transaction Action Bar MES v1.1", () => {
  it("exports Action Bar SSOT and wires ConversationHub", () => {
    expect(TRANSACTION_ACTION_BAR_VERSION).toBe("v1.1");
    expect(TRANSACTION_ACTION_BAR_MAX_BUTTONS).toBe(2);
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const bar = readSource("features/inbox/components/TransactionActionBar.tsx");
    expect(hub).toContain("TransactionActionBar");
    expect(bar).toContain('data-transaction-action-bar="v1.1"');
    expect(bar).toContain("TransactionHubBottomActions");
  });

  it("seller awaiting shipment — no bottom Get Shipping Label; labeled → drop-off panel", () => {
    const needLabel = buildConversationHubView({
      conversation: buyerCounterparty,
      order: order("awaiting_shipment"),
      hasShippingLabel: false,
    });
    expect(needLabel.viewerRole).toBe("seller");
    expect(needLabel.dynamicActions).toEqual([]);
    expect(needLabel.dynamicActions.some((a) => /Get Shipping Label/i.test(a.label))).toBe(false);
    expect(needLabel.actionBarPanel).toBeNull();

    const labeled = buildConversationHubView({
      conversation: buyerCounterparty,
      order: order("awaiting_shipment"),
      hasShippingLabel: true,
      activeShippingLabel: {
        carrier: "Royal Mail",
        serviceName: "Tracked 48",
      },
    });
    expect(labeled.dynamicActions).toEqual([]);
    expect(labeled.actionBarPanel?.title).toBe("Waiting for parcel drop-off");
    expect(labeled.actionBarPanel?.subtitle).toBeUndefined();
    expect(labeled.actionBarPanel?.meta).toBe("Royal Mail · Tracked 48");
    expect(labeled.productCardStatus).toBe("Sold");
  });

  it("buyer delivered delegates confirmation actions to the Dynamic Transaction Card", () => {
    const sellerCounterparty = {
      ...buyerCounterparty,
      participant: { ...buyerCounterparty.participant, role: "seller" as const, name: "Seller" },
    };
    const view = buildConversationHubView({
      conversation: sellerCounterparty,
      order: order("delivered"),
    });
    expect(view.viewerRole).toBe("buyer");
    expect(view.dynamicActions).toEqual([]);
    const statusCard = readSource("lib/inbox/transaction-status-card-v1.ts");
    expect(statusCard).toContain("Everything OK");
    expect(statusCard).toContain("I Have an Issue");
  });

  it("buyer Payment Successful — no sticky Order Details; VIEW ORDER opens details; cancel inside Order Details", () => {
    const sellerCounterparty = {
      ...buyerCounterparty,
      participant: { ...buyerCounterparty.participant, role: "seller" as const, name: "Seller" },
    };
    const view = buildConversationHubView({
      conversation: sellerCounterparty,
      order: order("awaiting_shipment"),
      hasShippingLabel: false,
    });
    expect(view.viewerRole).toBe("buyer");
    expect(view.dynamicActions).toEqual([]);
    expect(view.dynamicActions.some((a) => a.label === "Order Details")).toBe(false);

    const statusCard = readSource("lib/inbox/transaction-status-card-v1.ts");
    expect(statusCard).toContain('label: "VIEW ORDER"');
    expect(statusCard).not.toContain('label: "CANCEL ORDER"');

    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain('actionId === "view_order"');
    expect(hub).toContain("setOrderDetailsOpen(true)");
    expect(hub).toContain("OrderDetailView");
    expect(hub).toContain('data-order-details-sheet="v1.0"');
    expect(hub).not.toContain("router.push(view.orderDetailsHref)");
    expect(hub).not.toMatch(/\bwindow\.confirm\s*\(/);

    const actions = readSource("features/orders/components/OrderActionsCard.tsx");
    expect(actions).toContain('data-order-detail-action="messages"');
    expect(actions).toContain("Open Messages Hub");
    expect(actions).toContain("Continue the conversation with the seller.");
    expect(actions).toContain("ChatLineIcon");

    const cancelCard = readSource("features/orders/components/BuyerCancelOrderCard.tsx");
    expect(cancelCard).toContain('data-order-detail-action="cancel"');
    expect(cancelCard).toContain("Cancel your purchase before the seller ships the item.");
    expect(cancelCard).toContain("BanLineIcon");
    expect(cancelCard).toContain("BUYER_CANCELLATION_REASON_OPTIONS");
    expect(cancelCard).toContain("cancellationReasonId");
    expect(cancelCard).toContain("formatCurrency");
    expect(cancelCard).not.toMatch(/\bwindow\.confirm\s*\(/);
    expect(cancelCard).toContain('data-buyer-cancel-flow="v1.0"');

    const detail = readSource("features/orders/components/OrderDetailView.tsx");
    expect(detail).toContain('data-order-detail-actions="v1.0"');
    expect(detail).toContain("OrderActionsCard");
    expect(detail).toContain("BuyerCancelOrderCard");
  });

  it("never exceeds two sticky buttons", () => {
    const sellerCounterparty = {
      ...buyerCounterparty,
      participant: { ...buyerCounterparty.participant, role: "seller" as const },
    };
    for (const status of [
      "awaiting_payment",
      "awaiting_shipment",
      "shipped",
      "delivered",
      "issue_open",
      "completed",
    ] as const) {
      const view = buildConversationHubView({
        conversation: sellerCounterparty,
        order: order(status, status === "shipped" ? { trackingNumber: "AB1" } : {}),
        hasShippingLabel: true,
      });
      expect(view.dynamicActions.length).toBeLessThanOrEqual(TRANSACTION_ACTION_BAR_MAX_BUTTONS);
    }
  });
});

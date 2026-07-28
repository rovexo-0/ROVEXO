/**
 * COD SÂNGE — Messages Hub pre-freeze certification fixes.
 */
import { describe, expect, it } from "vitest";
import { buildConversationHubView } from "@/lib/inbox/conversation-view";
import {
  getMessagesLifecycleDemoBundle,
  getMessagesLifecycleDemoIds,
  isMessagesLifecycleDemoId,
  listMessagesLifecycleDemoInboxRows,
} from "@/lib/inbox/demo/messages-lifecycle-demo-fixtures-v1";
import { resolveTransactionStatusCard } from "@/lib/inbox/transaction-status-card-v1";
import type { Conversation } from "@/lib/messages/types";
import type { Order } from "@/lib/orders/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

const baseOrder = {
  id: "o1",
  orderNumber: "RX-1",
  status: "awaiting_shipment",
  product: {
    id: "p1",
    slug: "tent",
    title: "Tent",
    price: 31.5,
    imageUrl: "/placeholder-product.svg",
    condition: "Good",
  },
  buyer: { id: "b", name: "Buyer" },
  seller: { id: "s", name: "Seller" },
  totals: { itemPrice: 31.5, platformFee: 1.73, delivery: 0, total: 33.23 },
  deliveryCarrier: "Royal Mail",
  createdAt: new Date().toISOString(),
  paidAt: new Date().toISOString(),
  disputesDisabled: false,
} as Order;

describe("Messages pre-freeze — shipping role gates", () => {
  it("buyer LABEL_CREATED never exposes VIEW LABEL / print / download", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "buyer",
      order: baseOrder,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: { trackingNumber: "RM1", courierName: "Royal Mail", statusLabel: "Ready", latestScan: null, carrierUrl: null },
    });
    expect(card?.status).toBe("LABEL_CREATED");
    expect(card?.primaryAction?.id).not.toBe("view_label");
    expect(card?.primaryAction?.id).not.toBe("print_label");
    expect(card?.primaryAction?.id).not.toBe("download_label");
    expect(["track_parcel", "view_order"]).toContain(card?.primaryAction?.id);
    expect(card?.primaryAction?.label).not.toMatch(/LABEL/i);
  });

  it("seller LABEL_CREATED keeps PRINT LABEL", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: baseOrder,
      hasAcceptedOffer: true,
      hasShippingLabel: true,
      tracking: null,
    });
    expect(card?.primaryAction).toEqual({ id: "print_label", label: "PRINT LABEL" });
  });

  it("Hub gates View Label button and runOrderAction to seller", () => {
    const hub = read("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain('view.viewerRole === "seller"');
    expect(hub).toContain("Only the seller can open the shipping label.");
    expect(hub).toContain("Only the seller can manage shipping labels.");
  });
});

describe("Messages pre-freeze — timeline ↔ inbox preview sync", () => {
  it("surfaces Payment confirmed preview when message rows are empty", () => {
    const conversation = {
      id: "c1",
      participant: {
        id: "s1",
        name: "Seller",
        avatarUrl: null,
        role: "seller",
        online: false,
        lastSeen: null,
        rating: null,
        reviewCount: 0,
      },
      product: {
        id: "p1",
        slug: "tent",
        title: "Tent",
        price: 42,
        condition: "Good",
        imageUrl: "/placeholder-product.svg",
        status: "sold",
        listingType: "fixed",
        acceptOffers: true,
        locationCity: "London",
      },
      lastMessage: "Payment confirmed for order RVX-1.",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      pinned: false,
      archived: false,
      muted: false,
      blocked: false,
      messages: [],
    } as Conversation;

    const view = buildConversationHubView({
      conversation,
      order: baseOrder,
      offers: [],
      dispute: null,
      hasShippingLabel: false,
    });

    const texts = view.timeline
      .filter((item) => item.kind === "message")
      .map((item) => (item.kind === "message" ? item.message.content : ""));
    expect(texts.some((t) => t.includes("Payment confirmed"))).toBe(true);
    expect(view.timeline.length).toBeGreaterThan(0);
  });

  it("does not treat payment confirmed as logistics placeholder", () => {
    const source = read("lib/inbox/conversation-view.ts");
    expect(source).toContain("Seed-only logistics placeholders");
    expect(source).not.toMatch(/payment confirmed.*return true/i);
  });
});

describe("Messages pre-freeze — first paint / OUT OF STOCK", () => {
  it("Action Bar suppresses OUT OF STOCK until relatedReady", () => {
    const bar = read("features/inbox/components/TransactionActionBar.tsx");
    expect(bar).toContain("relatedReady");
    expect(bar).toContain("outOfStock={relatedReady && product.status === \"sold\" && !hasOrder}");
    expect(bar).toContain("if (!relatedReady && product.status === \"sold\")");
  });

  it("Hub waits on relatedReady skeleton before sticky chrome", () => {
    const hub = read("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("relatedReady");
    expect(hub).toContain("if (!relatedReady && !demoMode)");
  });
});

describe("Messages pre-freeze — lifecycle demo dataset", () => {
  it("covers every required buyer and seller scenario", () => {
    const ids = getMessagesLifecycleDemoIds();
    const required = [
      "buyer-no-order",
      "buyer-offer-sent",
      "buyer-offer-accepted",
      "buyer-checkout-ready",
      "buyer-payment-completed",
      "buyer-preparing-shipment",
      "buyer-label-created",
      "buyer-in-transit",
      "buyer-delivered",
      "buyer-completed",
      "buyer-issue-open",
      "buyer-review-submitted",
      "seller-offer-received",
      "seller-offer-accepted",
      "seller-preparing-shipment",
      "seller-label-created",
      "seller-waiting-confirmation",
      "seller-completed",
      "seller-issue-open",
    ] as const;

    for (const key of required) {
      const id = ids[key];
      expect(isMessagesLifecycleDemoId(id)).toBe(true);
      const bundle = getMessagesLifecycleDemoBundle(id);
      expect(bundle?.key).toBe(key);
      expect(bundle?.conversation.lastMessage.trim().length).toBeGreaterThan(0);
      expect(bundle?.conversation.messages.length).toBeGreaterThan(0);
    }

    expect(listMessagesLifecycleDemoInboxRows("buyer").length).toBe(12);
    expect(listMessagesLifecycleDemoInboxRows("seller").length).toBe(7);
  });
});

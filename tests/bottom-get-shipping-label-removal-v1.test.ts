/**
 * COD SÂNGE — bottom "Get Shipping Label" removed.
 * Top Transaction Status Card "CREATE SHIPPING LABEL" preserved.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildConversationHubView } from "@/lib/inbox/conversation-view";
import { resolveTransactionStatusCard } from "@/lib/inbox/transaction-status-card-v1";
import type { Conversation } from "@/lib/messages/types";
import type { Order } from "@/lib/orders/types";

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
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
    title: "Sony WH-1000XM5",
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

function awaitingOrder(): Order {
  return {
    id: "o1",
    orderNumber: "RX-1",
    status: "awaiting_shipment",
    product: buyerCounterparty.product,
    buyer: { id: "b", name: "Buyer" },
    seller: { id: "s", name: "Seller" },
    totals: { itemPrice: 120, platformFee: 6.6, delivery: 0, total: 126.6 },
    deliveryCarrier: "Royal Mail",
    createdAt: new Date().toISOString(),
    disputesDisabled: false,
  } as Order;
}

describe("bottom Get Shipping Label removal", () => {
  it("1. bottom Get Shipping Label CTA is not rendered via dynamicActions", () => {
    const view = buildConversationHubView({
      conversation: buyerCounterparty,
      order: awaitingOrder(),
      hasShippingLabel: false,
    });
    expect(view.viewerRole).toBe("seller");
    expect(view.dynamicActions).toEqual([]);
    expect(view.dynamicActions.some((a) => /Get Shipping Label/i.test(a.label))).toBe(false);
  });

  it("2. CREATE SHIPPING LABEL remains on Transaction Status Card", () => {
    const card = resolveTransactionStatusCard({
      viewerRole: "seller",
      order: awaitingOrder(),
      hasAcceptedOffer: true,
      hasShippingLabel: false,
      tracking: null,
    });
    expect(card?.primaryAction?.id).toBe("print_label");
    expect(card?.primaryAction?.label).toMatch(/CREATE SHIPPING LABEL/i);
  });

  it("3–4. CREATE SHIPPING LABEL action + shipping label API unchanged", () => {
    const hub = read("features/inbox/components/ConversationHub.tsx");
    const statusCard = read("lib/inbox/transaction-status-card-v1.ts");
    expect(statusCard).toContain('label: "CREATE SHIPPING LABEL"');
    expect(hub).toContain('actionId === "print_label"');
    expect(hub).toContain('fetch("/api/shipping/labels"');
  });

  it("5–6. no Sendcloud/label API removal · no duplicate bottom shipping-label CTA", () => {
    const view = read("lib/inbox/conversation-view.ts");
    expect(view).not.toContain('label: "Get Shipping Label"');
    expect(view).toContain("CREATE SHIPPING LABEL");
    expect(read("app/api/shipping/labels/route.ts").length).toBeGreaterThan(0);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONVERSATION_HUB_VERSION,
  CONVERSATION_ORDER_STATUS_STEPS,
  buildConversationHubView,
  buildOrderStatusSteps,
  mapOfferDbStatus,
} from "@/lib/inbox";
import type { Conversation } from "@/lib/messages/types";
import type { Order } from "@/lib/orders/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const sampleConversation = {
  id: "conv-1",
  participant: {
    id: "u1",
    name: "Alex Buyer",
    role: "buyer",
    online: true,
  },
  product: {
    id: "p1",
    slug: "vintage-lamp",
    title: "Vintage Lamp",
    price: 42,
    condition: "Good",
    imageUrl: "/placeholder-product.svg",
    status: "published",
    listingType: "fixed",
    acceptOffers: true,
  },
  lastMessage: "Hi",
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
  pinned: false,
  archived: false,
  muted: false,
  blocked: false,
  messages: [
    {
      id: "m1",
      senderRole: "buyer",
      kind: "text",
      content: "Hi",
      sentAt: new Date().toISOString(),
      status: "delivered",
      reactions: {},
    },
  ],
} as Conversation;

describe("Conversation Hub Sprint 3", () => {
  it("mounts ConversationHub with sprint-3 version markers", () => {
    const route = readSource("app/inbox/conversation/[conversationId]/page.tsx");
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");

    expect(route).toContain("ConversationHub");
    expect(hub).toContain("CONVERSATION_HUB_VERSION");
    expect(hub).toContain("uploadListingImage");
    expect(hub).toContain("signalTyping");
    expect(hub).toContain("refreshBadges");
    expect(css).toContain(".conv-hub");
  });

  it("uses Paid · Prep · Ship · Done · Paid compact rail labels", () => {
    expect(CONVERSATION_HUB_VERSION).toBe("v1.1-zoom-out");
    expect(CONVERSATION_ORDER_STATUS_STEPS).toEqual([
      "paid",
      "packed",
      "shipped",
      "delivered",
      "completed",
    ]);

    const shippedOrder = {
      id: "o1",
      orderNumber: "RX-1",
      status: "shipped",
      product: sampleConversation.product,
      buyer: { id: "b", name: "Buyer" },
      seller: { id: "s", name: "Seller" },
      totals: { itemPrice: 42, platformFee: 0, delivery: 0, total: 42 },
      deliveryCarrier: "Royal Mail",
      trackingNumber: "AB123",
      createdAt: new Date().toISOString(),
      shippedAt: new Date().toISOString(),
      disputesDisabled: false,
    } as Order;

    const view = buildConversationHubView({
      conversation: sampleConversation,
      order: shippedOrder,
    });

    expect(view.tracking?.trackingNumber).toBe("AB123");
    expect(view.statusSteps.find((step) => step.state === "current")?.id).toBe("shipped");
    expect(view.dynamicActions.some((action) => action.id === "confirm_shipment")).toBe(true);
  });

  it("maps offer database statuses and wires offer action API", () => {
    expect(mapOfferDbStatus("rejected")).toBe("declined");
    expect(mapOfferDbStatus("pending")).toBe("open");
    expect(readSource("app/api/offers/[id]/route.ts")).toContain('action: z.enum(["accept", "decline", "counter"])');
    expect(readSource("app/api/messages/[id]/route.ts")).toContain('kind?: "text" | "photo" | "emoji"');
  });

  it("builds product-progress rails without an order", () => {
    const soldSteps = buildOrderStatusSteps("sold");
    expect(soldSteps.at(-1)?.state).toBe("current");
    expect(soldSteps.slice(0, -1).every((step) => step.state === "complete")).toBe(true);
  });
});

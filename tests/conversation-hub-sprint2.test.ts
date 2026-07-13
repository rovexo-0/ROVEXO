import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONVERSATION_HUB_VERSION,
  CONVERSATION_ORDER_STATUS_STEPS,
  buildConversationHubView,
  buildOrderStatusSteps,
} from "@/lib/inbox";
import type { Conversation } from "@/lib/messages/types";

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

describe("Conversation Hub Sprint 2", () => {
  it("mounts ConversationHub on the canonical conversation route", () => {
    const route = readSource("app/inbox/conversation/[conversationId]/page.tsx");
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");
    const index = readSource("styles/rovexo/index.css");

    expect(route).toContain("ConversationHub");
    expect(route).toContain("fetchConversationById");
    expect(hub).toContain(`data-conversation-hub={CONVERSATION_HUB_VERSION}`);
    expect(hub).toContain("data-conversation-realtime");
    expect(css).toContain(".conv-hub");
    expect(index).toContain("./conversation-hub-v1.css");
  });

  it("builds hub view with order status rail and timeline messages", () => {
    expect(CONVERSATION_HUB_VERSION).toBe("v1.0-sprint-2");
    expect(CONVERSATION_ORDER_STATUS_STEPS).toEqual([
      "paid",
      "preparing",
      "dispatched",
      "in_transit",
      "delivered",
      "completed",
    ]);

    const view = buildConversationHubView({ conversation: sampleConversation });
    expect(view.product.title).toBe("Vintage Lamp");
    expect(view.timeline.some((item) => item.kind === "message")).toBe(true);
    expect(view.tracking).toBeNull();
    expect(view.dispute).toBeNull();
    expect(view.dynamicActions).toHaveLength(0);

    const soldSteps = buildOrderStatusSteps("sold");
    expect(soldSteps.every((step) => step.state === "complete" || step.state === "current")).toBe(true);
  });

  it("keeps offer and dispute controls presentation-ready without Sprint 3 backends", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("Open dispute");
    expect(hub).toContain("Accept");
    expect(hub).toContain("Counter");
    expect(hub).toContain("subscribeConversationRealtime");
    expect(hub).not.toContain("POST /api/disputes");
  });
});

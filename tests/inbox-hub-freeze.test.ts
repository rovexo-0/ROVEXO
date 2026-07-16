import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INBOX_HUB_CANONICAL_FROZEN,
  INBOX_HUB_CANONICAL_STATUS,
  INBOX_HUB_VISUAL_LOCK,
  INBOX_CONVERSATION_STATUS_RAIL,
  INBOX_CANONICAL_VERSION,
  CONVERSATION_HUB_VERSION,
  CONVERSATION_ORDER_STATUS_STEPS,
  buildConversationHubView,
} from "@/lib/inbox";
import type { Conversation } from "@/lib/messages/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Inbox Hub v1.0 — CANONICAL FREEZE", () => {
  it("marks Inbox Hub as canonical frozen", () => {
    expect(INBOX_HUB_CANONICAL_FROZEN).toBe(true);
    expect(INBOX_HUB_CANONICAL_STATUS).toBe("CANONICAL_FROZEN_v1.0");
    expect(INBOX_CANONICAL_VERSION).toBe("v1.0-frozen");
    expect(CONVERSATION_HUB_VERSION).toBe("v1.0-frozen");
  });

  it("locks DOM freeze markers on hub surfaces", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    const conversation = readSource("features/inbox/components/ConversationHub.tsx");
    expect(inbox).toContain('data-inbox-freeze="FROZEN"');
    expect(conversation).toContain('data-conversation-freeze="FROZEN"');
  });

  it("locks legacy routes as redirects into /inbox", () => {
    expect(readSource("app/messages/page.tsx")).toContain("INBOX_ROUTES.hub");
    expect(readSource("app/messages/[id]/page.tsx")).toContain("INBOX_ROUTES.conversation");
    expect(readSource("app/notifications/page.tsx")).toContain("INBOX_ROUTES.notificationsTab");
    expect(readSource("lib/homepage/canonical-nav.ts")).toContain('href: "/inbox"');
  });

  it("locks conversation status rail and visual constants", () => {
    expect([...CONVERSATION_ORDER_STATUS_STEPS]).toEqual([
      "paid",
      "packed",
      "shipped",
      "delivered",
      "completed",
    ]);
    expect([...INBOX_CONVERSATION_STATUS_RAIL]).toEqual([
      "Paid",
      "Prep",
      "Ship",
      "Done",
      "Paid",
    ]);
    expect(INBOX_HUB_VISUAL_LOCK.cardRadiusPx).toBe(16);
    expect(INBOX_HUB_VISUAL_LOCK.cardPaddingPx).toBe(14);
    expect(INBOX_HUB_VISUAL_LOCK.thumbSizePx).toBe(52);
    expect(INBOX_HUB_VISUAL_LOCK.headerHeightPx).toBe(56);
    expect(INBOX_HUB_VISUAL_LOCK.purple).toBe("#6d28d9");
  });

  it("does not fabricate tracking without a linked order", () => {
    const conversation = {
      id: "conv-1",
      participant: { id: "u1", name: "Alex", role: "buyer", online: true },
      product: {
        id: "p1",
        slug: "lamp",
        title: "Lamp",
        price: 10,
        condition: "Good",
        imageUrl: "/placeholder-product.svg",
        status: "sold",
        listingType: "fixed",
        acceptOffers: false,
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

    const view = buildConversationHubView({ conversation });
    expect(view.tracking).toBeNull();
    expect(view.timeline.every((item) => item.kind !== "system")).toBe(true);
  });

  it("preserves offer, tracking, dispute, review, and realtime contracts in-thread", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("/api/offers/");
    expect(hub).toContain("Open tracking");
    expect(hub).toContain("Copy tracking");
    expect(hub).toContain("Open dispute");
    expect(hub).toContain("Updates will appear in this transaction thread.");
    expect(hub).toContain("<OrderReviewCard");
    expect(hub).toContain("setReviewOpen(true)");
    expect(hub).not.toContain('router.push(`${view.orderDetailsHref}?review=1`)');
    expect(hub).toContain('searchParams.get("order") ?? searchParams.get("order_id")');
    expect(hub).toContain("matchingOrders.length === 1");
    expect(hub).toContain("subscribeConversationRealtime");
    expect(hub).toContain("signalTyping");
    expect(hub).toContain("refreshBadges");
    expect(readSource("app/api/offers/[id]/route.ts")).toContain("accept");
    expect(readSource("lib/inbox/conversation-realtime.ts")).toContain("ConversationRealtimeEvent");
  });

  it("publishes immutable freeze documentation", () => {
    const spec = readSource("docs/modules/inbox/MASTER_UI_SPECIFICATION.md");
    const freeze = readSource("docs/modules/inbox/UI_FREEZE.md");
    expect(spec).toContain("FROZEN");
    expect(spec).toContain("CANONICAL_FROZEN_v1.0");
    expect(freeze).toContain("STATUS");
    expect(freeze).toContain("FROZEN");
  });
});

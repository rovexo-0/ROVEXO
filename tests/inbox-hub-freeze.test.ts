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

describe("Inbox Hub v1.1 — UI LOCK", () => {
  it("marks Inbox Hub as canonical UI locked", () => {
    expect(INBOX_HUB_CANONICAL_FROZEN).toBe(true);
    expect(INBOX_HUB_CANONICAL_STATUS).toBe("CANONICAL_UI_LOCK_v1.1");
    expect(INBOX_CANONICAL_VERSION).toBe("v1.1-zoom-out");
    expect(CONVERSATION_HUB_VERSION).toBe("v1.1-zoom-out");
  });

  it("locks DOM freeze markers on hub surfaces", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    const conversation = readSource("features/inbox/components/ConversationHub.tsx");
    expect(inbox).toContain('data-inbox-freeze="FINAL-LOCK"');
    expect(inbox).toContain("UNREAD");
    expect(inbox).toContain("EARLIER");
    expect(inbox).toContain("Mark all read");
    expect(inbox).toContain("inbox-hub__notif-card--unread");
    expect(inbox).not.toContain("inbox-hub__search-badge");
    expect(inbox).not.toContain("SearchLineIcon");
    expect(conversation).toContain('data-conversation-freeze="FINAL-LOCK"');
    expect(conversation).toContain('data-conversation-hub-ui="v1.1-zoom-out"');
  });

  it("locks legacy routes as redirects into /inbox", () => {
    expect(readSource("app/messages/page.tsx")).toContain("INBOX_ROUTES.hub");
    expect(readSource("app/messages/[id]/page.tsx")).toContain("INBOX_ROUTES.conversation");
    expect(readSource("app/notifications/page.tsx")).toContain("INBOX_ROUTES.notificationsTab");
    expect(readSource("lib/homepage/canonical-nav.ts")).toContain('href: "/inbox"');
  });

  it("locks conversation status step ids and v1.1 visual constants", () => {
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
    expect(INBOX_HUB_VISUAL_LOCK.cardRadiusPx).toBe(0);
    expect(INBOX_HUB_VISUAL_LOCK.cardPaddingPx).toBe(5);
    expect(INBOX_HUB_VISUAL_LOCK.thumbSizePx).toBe(0);
    expect(INBOX_HUB_VISUAL_LOCK.headerHeightPx).toBe(40);
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
    expect(hub).toContain("View Tracking");
    expect(hub).toContain("View Label");
    expect(hub).toContain("View dispute");
    expect(hub).toContain("<OrderReviewCard");
    expect(hub).toContain("setReviewOpen(true)");
    expect(hub).toContain("PlatformFeeSheet");
    expect(hub).toContain("ReviewTeaserSheet");
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
    const freeze = readSource("docs/modules/inbox/TRANSACTION_HUB_UI_FREEZE.md");
    expect(spec).toContain("UI LOCK");
    expect(spec).toContain("v1.1");
    expect(freeze).toContain("UI LOCK");
    expect(freeze).toContain("v1.1");
  });
});

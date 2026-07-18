import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  INBOX_ROUTES,
  buildUnreadCounter,
  filterInboxConversations,
  parseInboxTab,
} from "@/lib/inbox";
import type { Conversation } from "@/lib/messages/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Inbox Hub Sprint 1 canonical foundation", () => {
  it("locks /inbox as the live hub route", () => {
    const route = readSource("app/inbox/page.tsx");
    const legacyMessages = readSource("app/messages/page.tsx");
    const legacyNotifications = readSource("app/notifications/page.tsx");
    const conversation = readSource("app/inbox/conversation/[conversationId]/page.tsx");
    const css = readSource("styles/rovexo/inbox-hub-v1.css");
    const index = readSource("styles/rovexo/index.css");

    expect(route).toContain("InboxPage");
    expect(route).toContain('dynamic = "force-dynamic"');
    expect(legacyMessages).toContain("INBOX_ROUTES.hub");
    expect(legacyNotifications).toContain("INBOX_ROUTES.notificationsTab");
    expect(conversation).toContain("ConversationHub");
    expect(css).toContain(".inbox-hub");
    expect(index).toContain("./inbox-hub-v1.css");
  });

  it("exposes canonical routes and unread counter", () => {
    expect(INBOX_ROUTES.hub).toBe("/inbox");
    expect(INBOX_ROUTES.conversation("abc")).toBe("/inbox/conversation/abc");
    expect(parseInboxTab("notifications")).toBe("notifications");
    expect(parseInboxTab(null)).toBe("messages");
    expect(buildUnreadCounter(2, 3)).toEqual({ messages: 2, notifications: 3, total: 5 });
  });

  it("filters conversations without duplicating store models", () => {
    const sample = [
      {
        id: "1",
        unreadCount: 2,
        archived: false,
        product: { id: "p1", acceptOffers: true },
      },
      {
        id: "2",
        unreadCount: 0,
        archived: true,
        product: { id: "p2", acceptOffers: false },
      },
    ] as Conversation[];

    expect(filterInboxConversations(sample, "unread")).toHaveLength(1);
    expect(filterInboxConversations(sample, "archived")).toHaveLength(1);
    expect(filterInboxConversations(sample, "offers")).toHaveLength(1);
  });

  it("points bottom nav Inbox at /inbox with combined badge", () => {
    const nav = readSource("components/ui/BottomNavigation.tsx");
    const canonical = readSource("lib/homepage/canonical-nav.ts");
    expect(nav).toContain("INBOX_ROUTES.hub");
    expect(nav).toContain("mobileBadges.messages");
    expect(nav).toContain("mobileBadges.notifications");
    expect(canonical).toContain('href: "/inbox"');
  });

  it("keeps ConversationHub as the only live conversation surface", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const route = readSource("app/inbox/conversation/[conversationId]/page.tsx");
    expect(hub).toContain("data-conversation-hub");
    expect(hub).toContain("TransactionHubBottomActions");
    expect(route).toContain("ConversationHub");
  });
});

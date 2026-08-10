import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildUnreadCounter, coerceUnreadCount } from "@/lib/inbox/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("COD SÂNGE — Messages notification badge unread sync", () => {
  it("coerceUnreadCount handles number / numeric string / null / NaN / Infinity / negative", () => {
    expect(coerceUnreadCount(3)).toBe(3);
    expect(coerceUnreadCount("2")).toBe(2);
    expect(coerceUnreadCount(null, 0)).toBe(0);
    expect(coerceUnreadCount(undefined, 4)).toBe(4);
    expect(coerceUnreadCount("x", 1)).toBe(1);
    expect(coerceUnreadCount(Number.NaN, 0)).toBe(0);
    expect(coerceUnreadCount(Number.POSITIVE_INFINITY, 0)).toBe(0);
    expect(coerceUnreadCount(-3, 0)).toBe(0);
  });

  it("buildUnreadCounter keeps Messages and Notifications separate", () => {
    const unread = buildUnreadCounter(2, 1);
    expect(unread.messages).toBe(2);
    expect(unread.notifications).toBe(1);
    expect(unread.total).toBe(3);
  });

  it("InboxPage patches unread from conversation RT + skips self-send bump", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    expect(inbox).toContain("coerceUnreadCount");
    expect(inbox).toContain("hasUnreadField");
    expect(inbox).toContain("isSelf");
    expect(inbox).toContain("mobileBadges.messages");
    /* Messages badge SSOT = conversation list; no Math.max(list, api) inflation. */
    expect(inbox).not.toContain("Math.max(messagesUnread");
    expect(inbox).toContain(
      "loadingMessages && conversations.length === 0 ? mobileBadges.messages : messagesUnread",
    );
  });

  it("appendMessage bumps recipient unread via participant client (admin only for profile/notify)", () => {
    const store = readSource("lib/messages/store.ts");
    expect(store).toContain("buyer_unread_count");
    expect(store).toContain("seller_unread_count");
    /* Unread update must use participant supabase — not admin authority for unread. */
    const bumpBlock = store.slice(
      store.indexOf("const isBuyer = input.senderRole === \"buyer\""),
      store.indexOf("const recipientId = isBuyer"),
    );
    expect(bumpBlock).toContain("await supabase");
    expect(bumpBlock).toContain("buyer_unread_count:");
    expect(bumpBlock).not.toContain("createAdminClient()");
  });

  it("RealtimeNotificationProvider clears badge TTL cache on refresh", () => {
    const provider = readSource(
      "features/notifications/components/RealtimeNotificationProvider.tsx",
    );
    expect(provider).toContain("clearInboxBadgeModuleCache()");
    expect(provider).toContain("fetchBadgeState");
  });

  it("Does not create duplicate unread engines / polling", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    expect(inbox).not.toContain("messagesUnreadCount2");
    expect(inbox).not.toContain("setInterval");
    expect(inbox).toContain("subscribeInboxRealtime");
  });

  it("Offer / Bundle / Deep-link engines untouched by badge fix", () => {
    const deep = readSource("lib/notifications/notification-deep-link-v1.ts");
    expect(deep).toContain("NOTIFICATION_DEEP_LINK_VERSION");
    const counter = readSource("lib/offers/counter-offer-engine-v1.ts");
    expect(counter).not.toContain("coerceUnreadCount");
    expect(counter).not.toContain("clearInboxBadgeModuleCache");
  });
});

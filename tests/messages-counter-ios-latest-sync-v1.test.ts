import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  bumpInboxConversationPreview,
  peekInboxConversationsCache,
  setInboxConversationsCache,
} from "@/lib/inbox/inbox-list-cache";
import type { Conversation } from "@/lib/messages/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function sampleConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conv-1",
    participant: {
      id: "u1",
      name: "seller",
      role: "seller",
      avatarUrl: "",
      lastSeenAt: new Date().toISOString(),
    },
    product: {
      id: "p1",
      slug: "item",
      title: "Item",
      price: 10,
      condition: "Good",
      imageUrl: "/placeholder-product.svg",
      status: "published",
      listingType: "fixed",
      acceptOffers: true,
    },
    messages: [],
    lastMessage: "old",
    lastMessageAt: "2026-01-01T00:00:00.000Z",
    unreadCount: 0,
    pinned: false,
    archived: false,
    blocked: false,
    ...overrides,
  };
}

describe("COD SÂNGE — Counter Offer iOS zoom + Messages latest sync", () => {
  it("A–E. Counter Offer input font-size >= 16px; message composer unchanged contract", () => {
    const css = readSource("styles/rovexo/conversation-hub-v1.css");
    const hubActions = readSource("features/transaction-hub/TransactionHubBottomActions.tsx");

    expect(hubActions).toContain("thub-v1__counter-input");
    expect(css).toMatch(/\.thub-v1__counter-input\s*\{[\s\S]*?font-size:\s*16px/);
    expect(css).toMatch(/\.conv-hub__counter-input\s*\{[\s\S]*?font-size:\s*16px/);
    /* Message composer keeps its own rule — not rewritten for Counter Offer. */
    expect(css).toContain(".conv-hub__composer-field");
    expect(css).not.toMatch(/maximum-scale\s*=\s*1/);
    expect(css).not.toMatch(/user-scalable\s*=\s*no/);
  });

  it("F–K. send message syncs Messages list via cache bump + inbox-sync", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    const cache = readSource("lib/inbox/inbox-list-cache.ts");

    expect(hub).toContain("syncMessagesListAfterSend");
    expect(hub).toContain('source: "message_sent"');
    expect(hub).toContain('source: "photo_sent"');
    expect(hub).toContain("bumpInboxConversationPreview");
    expect(hub).toContain('invalidateShareInflight("GET:/api/messages")');
    expect(hub).toContain('new CustomEvent("rovexo:inbox-sync"');
    expect(cache).toContain("bumpInboxConversationPreview");
    expect(inbox).toContain("onInboxSync");
    expect(inbox).toContain("hasLatestPreview");
    expect(inbox).toContain("lastMessage");
    expect(inbox).toContain("lastMessageAt");
    expect(inbox).toContain("refreshAll");
  });

  it("G–K. bumpInboxConversationPreview updates preview, timestamp, order", () => {
    const older = sampleConversation({
      id: "conv-old",
      lastMessage: "older thread",
      lastMessageAt: "2026-01-01T00:00:00.000Z",
    });
    const target = sampleConversation({
      id: "conv-1",
      lastMessage: "old",
      lastMessageAt: "2026-01-02T00:00:00.000Z",
    });
    setInboxConversationsCache([older, target]);

    const next = bumpInboxConversationPreview({
      conversationId: "conv-1",
      lastMessage: "Hello latest",
      lastMessageAt: "2026-08-09T21:00:00.000Z",
    });

    expect(next?.[0]?.id).toBe("conv-1");
    expect(next?.[0]?.lastMessage).toBe("Hello latest");
    expect(next?.[0]?.lastMessageAt).toBe("2026-08-09T21:00:00.000Z");
    expect(next?.[1]?.id).toBe("conv-old");
    expect(peekInboxConversationsCache()[0]?.lastMessage).toBe("Hello latest");
  });

  it("L–M. Notifications + unread remain on existing XLIII path (unchanged engines)", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    expect(hub).toContain("refreshBadges");
    expect(inbox).toContain("GET:/api/notifications");
    expect(inbox).toContain("unreadCount");
    expect(hub).not.toContain("setInterval");
    expect(inbox).not.toContain("setInterval(");
  });

  it("N–P. Offer / Counter / Bundle still dispatch inbox-sync; Offer Engine untouched", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("source: `offer_${action}`");
    expect(hub).toContain('invalidateShareInflight("GET:/api/messages")');
    const offerEngine = readSource("lib/offers/counter-offer-engine-v1.ts");
    expect(offerEngine).not.toContain("bumpInboxConversationPreview");
    expect(offerEngine).not.toContain("font-size: 16px");
  });

  it("Q. No PII / no new API / no polling in sync helper", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const start = hub.indexOf("function syncMessagesListAfterSend");
    const end = hub.indexOf("function formatCompactSystemWhen");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const syncBlock = hub.slice(start, end);
    expect(syncBlock).not.toMatch(/\bemail\b/i);
    expect(syncBlock).not.toMatch(/\baddress\b/i);
    expect(syncBlock).not.toContain("/api/bundle");
    expect(syncBlock).not.toContain("setInterval");
    expect(syncBlock).not.toContain("setTimeout");
  });

  it("R. Latest-message inbox-sync does not force duplicate refreshAll", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    expect(inbox).toContain("hasLatestPreview");
    expect(inbox).toContain(
      "/* Latest-message sync already patched list + cache — avoid duplicate full refresh. */",
    );
  });
});

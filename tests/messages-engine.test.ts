import { describe, expect, it } from "vitest";
import { createDefaultMessagesEngineDocument } from "@/lib/messages-engine/defaults";
import {
  MESSAGES_ENGINE_CONVERSATION_TYPES,
  MESSAGES_ENGINE_FILTERS,
  MESSAGES_ENGINE_MODULES,
  MESSAGES_ENGINE_SEARCH_SCOPES,
  registerMessagesEngineModule,
} from "@/lib/messages-engine/registry";
import {
  computeAverageResponseHours,
  computeResponseRate,
  mapConversationStatus,
  mapConversationToSummary,
  mapMessageStatus,
  matchesSummaryFilter,
} from "@/lib/messages-engine/timeline";
import { computeMessagesAnalytics } from "@/lib/messages-engine/reader";
import type { Conversation } from "@/lib/messages/types";

const sampleConversation = (overrides?: Partial<Conversation>): Conversation => ({
  id: "c1",
  participant: {
    id: "u2",
    name: "Jane Seller",
    avatarUrl: null,
    role: "seller",
    online: true,
  },
  product: {
    slug: "widget",
    title: "Premium Widget",
    price: 49.99,
    condition: "new",
    imageUrl: "/img.jpg",
    status: "published",
  },
  lastMessage: "Thanks for your order",
  lastMessageAt: "2026-06-01T12:00:00Z",
  unreadCount: 2,
  pinned: false,
  archived: false,
  muted: false,
  blocked: false,
  messages: [
    {
      id: "m1",
      senderRole: "buyer",
      kind: "text",
      content: "Is this available?",
      sentAt: "2026-06-01T10:00:00Z",
      status: "read",
      reactions: {},
    },
    {
      id: "m2",
      senderRole: "seller",
      kind: "text",
      content: "Yes, shipping today",
      sentAt: "2026-06-01T11:00:00Z",
      status: "delivered",
      reactions: {},
    },
  ],
  ...overrides,
});

describe("messages engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultMessagesEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.conversationTypes.some((t) => t.id === "buyer-seller" && t.enabled)).toBe(true);
    expect(doc.integrations.ordersEngine).toBe(true);
    expect(doc.integrations.protectionEngine).toBe(true);
    expect(doc.moderation.spamDetection).toBe(true);
    expect(doc.attachments.maxImageMb).toBeGreaterThan(0);
  });

  it("registers all core messages modules", () => {
    const ids = MESSAGES_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("dashboard");
    expect(ids).toContain("search");
    expect(ids).toContain("attachments");
    expect(ids).toContain("analytics");
  });

  it("defines conversation types, filters, and search scopes", () => {
    expect(MESSAGES_ENGINE_CONVERSATION_TYPES.map((t) => t.id)).toContain("dispute");
    expect(MESSAGES_ENGINE_FILTERS.map((f) => f.id)).toContain("unread");
    expect(MESSAGES_ENGINE_SEARCH_SCOPES.map((s) => s.id)).toContain("messages");
  });

  it("maps conversation to enterprise summary", () => {
    const summary = mapConversationToSummary(sampleConversation());
    expect(summary.conversationType).toBe("buyer-seller");
    expect(summary.enterpriseStatus).toBe("active");
    expect(summary.filterTags).toContain("unread");
  });

  it("maps conversation and message statuses", () => {
    expect(mapConversationStatus(sampleConversation({ blocked: true }))).toBe("blocked");
    expect(mapMessageStatus("delivered")).toBe("delivered");
  });

  it("matches summary filters", () => {
    const summary = mapConversationToSummary(sampleConversation());
    expect(matchesSummaryFilter(summary, "unread")).toBe(true);
    expect(matchesSummaryFilter(summary, "archived")).toBe(false);
  });

  it("computes analytics from conversations", () => {
    const analytics = computeMessagesAnalytics([
      sampleConversation(),
      sampleConversation({ id: "c2", unreadCount: 0, archived: true }),
    ]);
    expect(analytics.totalConversations).toBe(2);
    expect(analytics.unreadMessages).toBe(2);
    expect(analytics.activeConversations).toBe(1);
  });

  it("computes response metrics", () => {
    const conversations = [sampleConversation()];
    expect(computeAverageResponseHours(conversations)).toBeGreaterThan(0);
    expect(computeResponseRate(conversations, "seller")).toBeGreaterThan(0);
  });

  it("allows future module registration", () => {
    const next = registerMessagesEngineModule({
      id: "custom-hub",
      label: "Custom Hub",
      icon: "💬",
      description: "Future module",
      href: "/messages",
    });
    expect(next.some((m) => m.id === "custom-hub")).toBe(true);
  });
});

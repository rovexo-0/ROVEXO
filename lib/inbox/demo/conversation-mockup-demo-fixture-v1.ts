/**
 * DEVELOPMENT / DEMO ONLY — Conversation Hub mockup timeline fixture.
 *
 * STATUS: LOCAL DEV FIXTURE · NEVER WRITES TO DATABASE · NEVER PRODUCTION
 *
 * Purpose: Owner visual certification of the complete offer negotiation UI
 * (messages + offers + system accept + accepted bottom panel) without mutating
 * production conversations or live DB records.
 *
 * Official local URL (development only):
 *   http://localhost:3000/inbox/conversation/00000000-0000-4000-8000-00000000d001
 *
 * Remove / disable:
 *   - Delete this file + its test, OR
 *   - Leave as-is (production builds never serve this id — notFound)
 *
 * Real conversations continue to load dynamically from the DB/API unchanged.
 */

import type { ConversationOfferView } from "@/lib/inbox/conversation-view";
import type { Conversation } from "@/lib/messages/types";

/** Stable UUID reserved for the in-memory mockup demo (never a live row). */
export const CONVERSATION_MOCKUP_DEMO_ID = "00000000-0000-4000-8000-00000000d001";

export const CONVERSATION_MOCKUP_DEMO_PRODUCT_SLUG = "demo-mockup-family-tent-v1";

export const CONVERSATION_MOCKUP_DEMO_PRODUCT_ID = "00000000-0000-4000-8000-00000000d0f1";

export const CONVERSATION_MOCKUP_DEMO_BUYER_ID = "00000000-0000-4000-8000-00000000d0b1";

export const CONVERSATION_MOCKUP_DEMO_SELLER_ID = "00000000-0000-4000-8000-00000000d0s1";

/** Chronological base (UTC) — all events on one demo day for a clean timeline. */
const T0 = Date.parse("2026-07-25T14:00:00.000Z");

function at(offsetMinutes: number, offsetSeconds = 0): string {
  return new Date(T0 + offsetMinutes * 60_000 + offsetSeconds * 1_000).toISOString();
}

export function isConversationMockupDemoEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VITEST === "true";
}

export function isConversationMockupDemoId(id: string): boolean {
  return id === CONVERSATION_MOCKUP_DEMO_ID;
}

export type ConversationMockupDemoBundle = {
  conversation: Conversation;
  offers: ConversationOfferView[];
};

/**
 * Viewer = buyer. Participant = seller (Olimpia).
 * Timeline matches Owner mockup script exactly.
 */
export function getConversationMockupDemoBundle(): ConversationMockupDemoBundle {
  const offerBuyer30Id = "00000000-0000-4000-8000-00000000o030";
  const offerSeller3250Id = "00000000-0000-4000-8000-00000000o325";
  const offerAccepted3150Id = "00000000-0000-4000-8000-00000000o315";

  const conversation: Conversation = {
    id: CONVERSATION_MOCKUP_DEMO_ID,
    participant: {
      id: CONVERSATION_MOCKUP_DEMO_SELLER_ID,
      name: "Olimpia",
      avatarUrl: null,
      role: "seller",
      online: true,
      lastSeen: at(45),
      rating: 5,
      reviewCount: 12,
    },
    product: {
      id: CONVERSATION_MOCKUP_DEMO_PRODUCT_ID,
      slug: CONVERSATION_MOCKUP_DEMO_PRODUCT_SLUG,
      title: "Family Tent – 4 Person",
      price: 35,
      condition: "Like new",
      imageUrl: "/placeholder-product.svg",
      status: "published",
      listingType: "fixed",
      acceptOffers: true,
      locationCity: "London",
    },
    lastMessage: "Offer accepted!",
    lastMessageAt: at(44, 1),
    unreadCount: 0,
    pinned: false,
    archived: false,
    muted: false,
    blocked: false,
    messages: [
      {
        id: "demo-msg-1",
        senderRole: "buyer",
        kind: "text",
        content: "Hi! Is this still available?",
        sentAt: at(0),
        status: "read",
        reactions: {},
      },
      {
        id: "demo-msg-2",
        senderRole: "seller",
        kind: "text",
        content: "Yes, it's available.",
        sentAt: at(2),
        status: "read",
        reactions: {},
      },
      {
        id: "demo-msg-3",
        senderRole: "buyer",
        kind: "text",
        content: "Could you do £31?",
        sentAt: at(20),
        status: "read",
        reactions: {},
      },
      {
        id: "demo-msg-4",
        senderRole: "seller",
        kind: "text",
        content: "I can do £31.50",
        sentAt: at(28),
        status: "read",
        reactions: {},
      },
    ],
  };

  const offers: ConversationOfferView[] = [
    {
      id: offerBuyer30Id,
      amount: 30,
      currency: "GBP",
      state: "countered",
      fromRole: "buyer",
      createdAt: at(8),
      parentOfferId: null,
    },
    {
      id: offerSeller3250Id,
      amount: 32.5,
      currency: "GBP",
      state: "countered",
      fromRole: "seller",
      createdAt: at(14),
      parentOfferId: offerBuyer30Id,
    },
    {
      /* Buyer-side accepted card (LEFT) — final negotiated £31.50 matching mockup. */
      id: offerAccepted3150Id,
      amount: 31.5,
      currency: "GBP",
      state: "accepted",
      fromRole: "buyer",
      createdAt: at(44),
      parentOfferId: offerSeller3250Id,
    },
  ];

  return { conversation, offers };
}

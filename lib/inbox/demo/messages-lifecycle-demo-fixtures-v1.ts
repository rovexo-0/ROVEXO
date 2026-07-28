/**
 * LOCALHOST ONLY — Messages Hub lifecycle demo fixtures (COD SÂNGE pre-freeze).
 * Never writes to DB. Never served in production.
 *
 * Buyer/Seller visual certification URLs:
 *   /inbox/conversation/00000000-0000-4000-8000-00000000d1xx
 */

import type { ConversationOfferView, ConversationDisputeView } from "@/lib/inbox/conversation-view";
import type { Conversation } from "@/lib/messages/types";
import type { Order } from "@/lib/orders/types";

const DEMO_PREFIX = "00000000-0000-4000-8000-00000000d1";

export type MessagesLifecycleDemoKey =
  | "buyer-no-order"
  | "buyer-offer-sent"
  | "buyer-offer-accepted"
  | "buyer-checkout-ready"
  | "buyer-payment-completed"
  | "buyer-preparing-shipment"
  | "buyer-label-created"
  | "buyer-in-transit"
  | "buyer-delivered"
  | "buyer-completed"
  | "buyer-issue-open"
  | "buyer-review-submitted"
  | "seller-offer-received"
  | "seller-offer-accepted"
  | "seller-preparing-shipment"
  | "seller-label-created"
  | "seller-waiting-confirmation"
  | "seller-completed"
  | "seller-issue-open";

const DEMO_IDS: Record<MessagesLifecycleDemoKey, string> = {
  "buyer-no-order": `${DEMO_PREFIX}01`,
  "buyer-offer-sent": `${DEMO_PREFIX}02`,
  "buyer-offer-accepted": `${DEMO_PREFIX}03`,
  "buyer-checkout-ready": `${DEMO_PREFIX}04`,
  "buyer-payment-completed": `${DEMO_PREFIX}05`,
  "buyer-preparing-shipment": `${DEMO_PREFIX}06`,
  "buyer-label-created": `${DEMO_PREFIX}07`,
  "buyer-in-transit": `${DEMO_PREFIX}08`,
  "buyer-delivered": `${DEMO_PREFIX}09`,
  "buyer-completed": `${DEMO_PREFIX}0a`,
  "buyer-issue-open": `${DEMO_PREFIX}0b`,
  "buyer-review-submitted": `${DEMO_PREFIX}0c`,
  "seller-offer-received": `${DEMO_PREFIX}11`,
  "seller-offer-accepted": `${DEMO_PREFIX}12`,
  "seller-preparing-shipment": `${DEMO_PREFIX}13`,
  "seller-label-created": `${DEMO_PREFIX}14`,
  "seller-waiting-confirmation": `${DEMO_PREFIX}15`,
  "seller-completed": `${DEMO_PREFIX}16`,
  "seller-issue-open": `${DEMO_PREFIX}17`,
};

const PRODUCT_IMG = "/placeholder-product.svg";
const T0 = Date.parse("2026-07-26T12:00:00.000Z");

function at(mins: number): string {
  return new Date(T0 + mins * 60_000).toISOString();
}

export function isMessagesLifecycleDemoEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VITEST === "true";
}

export function isMessagesLifecycleDemoId(id: string): boolean {
  return Object.values(DEMO_IDS).includes(id);
}

export function getMessagesLifecycleDemoKey(id: string): MessagesLifecycleDemoKey | null {
  const entry = Object.entries(DEMO_IDS).find(([, value]) => value === id);
  return (entry?.[0] as MessagesLifecycleDemoKey | undefined) ?? null;
}

export type MessagesLifecycleDemoBundle = {
  key: MessagesLifecycleDemoKey;
  conversation: Conversation;
  offers: ConversationOfferView[];
  order: Order | null;
  dispute: ConversationDisputeView | null;
  hasShippingLabel: boolean;
  viewerRole: "buyer" | "seller";
};

function baseProduct(title: string, status: Conversation["product"]["status"] = "published") {
  return {
    id: `${DEMO_PREFIX}f1`,
    slug: "demo-lifecycle-family-tent",
    title,
    price: 42,
    condition: "Like New",
    imageUrl: PRODUCT_IMG,
    status,
    listingType: "fixed" as const,
    acceptOffers: true,
    locationCity: "London",
  };
}

function baseConversation(
  id: string,
  viewerRole: "buyer" | "seller",
  title: string,
  lastMessage: string,
  productStatus: Conversation["product"]["status"] = "published",
  messages: Conversation["messages"] = [],
): Conversation {
  const participantRole = viewerRole === "buyer" ? "seller" : "buyer";
  return {
    id,
    participant: {
      id: viewerRole === "buyer" ? `${DEMO_PREFIX}s1` : `${DEMO_PREFIX}b1`,
      name: viewerRole === "buyer" ? "Demo Seller" : "Demo Buyer",
      avatarUrl: null,
      role: participantRole,
      online: true,
      lastSeen: at(5),
      rating: 4.9,
      reviewCount: 42,
    },
    product: baseProduct(title, productStatus),
    lastMessage,
    lastMessageAt: at(30),
    unreadCount: 0,
    pinned: false,
    archived: false,
    muted: false,
    blocked: false,
    messages:
      messages.length > 0
        ? messages
        : [
            {
              id: `${id}-m1`,
              senderRole: "buyer",
              kind: "text",
              content: lastMessage || "Hi — interested in this item.",
              sentAt: at(10),
              status: "delivered",
              reactions: {},
            },
          ],
  };
}

function baseOrder(
  status: Order["status"],
  extras: Partial<Order> = {},
): Order {
  const createdAt = at(20);
  return {
    id: `${DEMO_PREFIX}ord`,
    orderNumber: "RVX-DEMO-01",
    status,
    product: {
      id: `${DEMO_PREFIX}f1`,
      slug: "demo-lifecycle-family-tent",
      title: "Demo Lifecycle Tent",
      price: 42,
      imageUrl: PRODUCT_IMG,
      condition: "Like New",
    },
    buyer: { id: `${DEMO_PREFIX}b1`, name: "Demo Buyer" },
    seller: { id: `${DEMO_PREFIX}s1`, name: "Demo Seller" },
    totals: { itemPrice: 42, platformFee: 2.31, delivery: 3.99, total: 48.3 },
    deliveryCarrier: "Royal Mail",
    trackingNumber: extras.trackingNumber,
    createdAt,
    paidAt: createdAt,
    shippedAt: extras.shippedAt,
    deliveredAt: extras.deliveredAt,
    completedAt: extras.completedAt,
    disputesDisabled: false,
    ...extras,
  } as Order;
}

function offer(
  id: string,
  amount: number,
  state: ConversationOfferView["state"],
  fromRole: "buyer" | "seller",
): ConversationOfferView {
  return {
    id,
    amount,
    currency: "GBP",
    state,
    fromRole,
    createdAt: at(15),
    parentOfferId: null,
  };
}

export function getMessagesLifecycleDemoBundle(id: string): MessagesLifecycleDemoBundle | null {
  const key = getMessagesLifecycleDemoKey(id);
  if (!key) return null;

  const sold = "sold" as const;

  switch (key) {
    case "buyer-no-order":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — No Order", "Is this still available?"),
        offers: [],
        order: null,
        dispute: null,
        hasShippingLabel: false,
      };
    case "buyer-offer-sent":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — Offer Sent", "Offer sent £35.00"),
        offers: [offer(`${id}-o1`, 35, "open", "buyer")],
        order: null,
        dispute: null,
        hasShippingLabel: false,
      };
    case "buyer-offer-accepted":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — Offer Accepted", "Offer accepted", sold),
        offers: [offer(`${id}-o1`, 35, "accepted", "buyer")],
        order: null,
        dispute: null,
        hasShippingLabel: false,
      };
    case "buyer-checkout-ready":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — Checkout Ready", "Ready to checkout", sold),
        offers: [offer(`${id}-o1`, 35, "accepted", "buyer")],
        order: null,
        dispute: null,
        hasShippingLabel: false,
      };
    case "buyer-payment-completed":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(
          id,
          "buyer",
          "Demo — Payment Completed",
          "Payment confirmed for order RVX-DEMO-01.",
          sold,
        ),
        offers: [offer(`${id}-o1`, 35, "accepted", "buyer")],
        order: baseOrder("awaiting_shipment"),
        dispute: null,
        hasShippingLabel: false,
      };
    case "buyer-preparing-shipment":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — Preparing Shipment", "Payment confirmed", sold),
        offers: [],
        order: baseOrder("awaiting_shipment"),
        dispute: null,
        hasShippingLabel: false,
      };
    case "buyer-label-created":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — Label Created", "Label created", sold),
        offers: [],
        order: baseOrder("awaiting_shipment", { trackingNumber: "RM123DEMOUK" }),
        dispute: null,
        hasShippingLabel: true,
      };
    case "buyer-in-transit":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — In Transit", "Parcel is on the way", sold),
        offers: [],
        order: baseOrder("shipped", {
          trackingNumber: "RM123DEMOUK",
          shippedAt: at(40),
        }),
        dispute: null,
        hasShippingLabel: true,
      };
    case "buyer-delivered":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — Delivered", "Parcel delivered", sold),
        offers: [],
        order: baseOrder("delivered", {
          trackingNumber: "RM123DEMOUK",
          shippedAt: at(40),
          deliveredAt: at(80),
        }),
        dispute: null,
        hasShippingLabel: true,
      };
    case "buyer-completed":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — Completed", "Everything OK", sold),
        offers: [],
        order: baseOrder("completed", {
          trackingNumber: "RM123DEMOUK",
          shippedAt: at(40),
          deliveredAt: at(80),
          completedAt: at(90),
        }),
        dispute: null,
        hasShippingLabel: true,
      };
    case "buyer-issue-open":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — Issue Open", "I have an issue", sold),
        offers: [],
        order: baseOrder("issue_open", {
          trackingNumber: "RM123DEMOUK",
          shippedAt: at(40),
          deliveredAt: at(80),
        }),
        dispute: {
          id: `${id}-d1`,
          status: "open",
          title: "Item not as described",
          updatedAt: at(85),
        },
        hasShippingLabel: true,
      };
    case "buyer-review-submitted":
      return {
        key,
        viewerRole: "buyer",
        conversation: baseConversation(id, "buyer", "Demo — Review Submitted", "Review submitted", sold),
        offers: [],
        order: baseOrder("completed", {
          trackingNumber: "RM123DEMOUK",
          shippedAt: at(40),
          deliveredAt: at(80),
          completedAt: at(90),
        }),
        dispute: null,
        hasShippingLabel: true,
      };
    case "seller-offer-received":
      return {
        key,
        viewerRole: "seller",
        conversation: baseConversation(id, "seller", "Demo — Offer Received", "New offer £35.00"),
        offers: [offer(`${id}-o1`, 35, "open", "buyer")],
        order: null,
        dispute: null,
        hasShippingLabel: false,
      };
    case "seller-offer-accepted":
      return {
        key,
        viewerRole: "seller",
        conversation: baseConversation(id, "seller", "Demo — Offer Accepted", "Offer accepted", sold),
        offers: [offer(`${id}-o1`, 35, "accepted", "buyer")],
        order: null,
        dispute: null,
        hasShippingLabel: false,
      };
    case "seller-preparing-shipment":
      return {
        key,
        viewerRole: "seller",
        conversation: baseConversation(id, "seller", "Demo — Preparing Shipment", "Payment received", sold),
        offers: [],
        order: baseOrder("awaiting_shipment"),
        dispute: null,
        hasShippingLabel: false,
      };
    case "seller-label-created":
      return {
        key,
        viewerRole: "seller",
        conversation: baseConversation(id, "seller", "Demo — Label Created", "Label ready", sold),
        offers: [],
        order: baseOrder("awaiting_shipment", { trackingNumber: "RM123DEMOUK" }),
        dispute: null,
        hasShippingLabel: true,
      };
    case "seller-waiting-confirmation":
      return {
        key,
        viewerRole: "seller",
        conversation: baseConversation(id, "seller", "Demo — Waiting Confirmation", "Delivered", sold),
        offers: [],
        order: baseOrder("delivered", {
          trackingNumber: "RM123DEMOUK",
          shippedAt: at(40),
          deliveredAt: at(80),
        }),
        dispute: null,
        hasShippingLabel: true,
      };
    case "seller-completed":
      return {
        key,
        viewerRole: "seller",
        conversation: baseConversation(id, "seller", "Demo — Sale Completed", "Sale completed", sold),
        offers: [],
        order: baseOrder("completed", {
          trackingNumber: "RM123DEMOUK",
          shippedAt: at(40),
          deliveredAt: at(80),
          completedAt: at(90),
        }),
        dispute: null,
        hasShippingLabel: true,
      };
    case "seller-issue-open":
      return {
        key,
        viewerRole: "seller",
        conversation: baseConversation(id, "seller", "Demo — Issue Open", "Issue opened", sold),
        offers: [],
        order: baseOrder("issue_open", {
          trackingNumber: "RM123DEMOUK",
          shippedAt: at(40),
          deliveredAt: at(80),
        }),
        dispute: {
          id: `${id}-d1`,
          status: "under_review",
          title: "Buyer reported an issue",
          updatedAt: at(85),
        },
        hasShippingLabel: true,
      };
    default:
      return null;
  }
}

/** Inbox list rows for localhost certification — prepended in development only. */
export function listMessagesLifecycleDemoInboxRows(
  viewerRole: "buyer" | "seller",
): Conversation[] {
  if (!isMessagesLifecycleDemoEnabled()) return [];
  const keys = (Object.keys(DEMO_IDS) as MessagesLifecycleDemoKey[]).filter((key) =>
    viewerRole === "buyer" ? key.startsWith("buyer-") : key.startsWith("seller-"),
  );
  return keys
    .map((key) => getMessagesLifecycleDemoBundle(DEMO_IDS[key]))
    .filter((bundle): bundle is MessagesLifecycleDemoBundle => Boolean(bundle))
    .map((bundle) => bundle.conversation);
}

export function getMessagesLifecycleDemoIds(): typeof DEMO_IDS {
  return DEMO_IDS;
}

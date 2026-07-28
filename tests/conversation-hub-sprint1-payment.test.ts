import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buyerPaysTotal,
  formatOfferHistoryLine,
  resolveSprint1PaymentUi,
  resolveSprint1ConversationStatus,
} from "@/lib/inbox/conversation-payment-sprint1";
import {
  CONVERSATION_HUB_SPRINT1_FREEZE,
  formatPayNowLabel,
} from "@/lib/inbox/conversation-hub-sprint1-freeze-v1";
import { buildConversationHubView } from "@/lib/inbox/conversation-view";
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
    price: 6.5,
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
  messages: [],
} as Conversation;

describe("Conversation Hub Sprint 1 — payment + role UI", () => {
  it("locks Sprint 1 freeze markers", () => {
    expect(CONVERSATION_HUB_SPRINT1_FREEZE.status).toBe("FROZEN");
    expect(CONVERSATION_HUB_SPRINT1_FREEZE.approved).toBe(true);
    expect(formatPayNowLabel(7.53)).toBe("BUY NOW • £7.53");
    expect(formatPayNowLabel(6.5)).toBe("BUY NOW • £6.50");
  });

  it("computes buyer total with platform fee (never listing-only)", () => {
    expect(buyerPaysTotal(6.5)).toBe(6.86);
    expect(buyerPaysTotal(6.5)).not.toBe(6.5);
  });

  it("formats offer history lines", () => {
    expect(formatOfferHistoryLine({ amount: 4.5, state: "declined" })).toBe("£4.50 Declined");
    expect(formatOfferHistoryLine({ amount: 5, state: "declined" })).toBe("£5.00 Declined");
    expect(formatOfferHistoryLine({ amount: 6.5, state: "accepted" })).toBe("£6.50 Accepted");
    expect(formatOfferHistoryLine({ amount: 6.5, state: "open" })).toBeNull();
  });

  it("buyer payment UI shows total buyer pays + BUY NOW • total", () => {
    const ui = resolveSprint1PaymentUi({
      viewerRole: "buyer",
      order: null,
      listingPrice: 6.5,
      acceptedOfferAmount: 6.5,
    });
    expect(ui.priceLabel).toBe("Item price");
    expect(ui.secondaryLabel).toBe("Total buyer pays");
    expect(ui.secondaryValue).toContain("incl.");
    expect(ui.showBuyerFeeInfo).toBe(true);
    expect(ui.buyerBreakdown).not.toBeNull();
    expect(ui.statusLabel).toBe("Awaiting payment");
    expect(ui.stickyLabel).toBe(formatPayNowLabel(buyerPaysTotal(6.5)));
    expect(ui.stickyLabel).toContain("•");
    expect(ui.stickyLabel).not.toBe("BUY NOW • £6.50");
    expect(ui.stickyDisabled).toBe(false);
  });

  it("seller payment UI never exposes buyer total or platform fee", () => {
    const ui = resolveSprint1PaymentUi({
      viewerRole: "seller",
      order: null,
      listingPrice: 6.5,
      acceptedOfferAmount: 6.5,
    });
    expect(ui.priceLabel).toBe("Selling price");
    expect(ui.secondaryLabel).toBe("You will receive");
    expect(ui.secondaryValue).toBe("£6.50");
    expect(ui.showBuyerFeeInfo).toBe(false);
    expect(ui.buyerBreakdown).toBeNull();
    expect(ui.statusLabel).toBe("Waiting buyer payment.");
    expect(ui.stickyLabel.toLowerCase()).toContain("waiting for payment");
    expect(ui.stickyDisabled).toBe(true);
    expect(ui.secondaryLabel.toLowerCase()).not.toContain("buyer");
    expect(ui.secondaryValue.toLowerCase()).not.toContain("incl");
  });

  it("maps paid statuses role-specifically", () => {
    expect(
      resolveSprint1ConversationStatus({
        viewerRole: "buyer",
        orderStatus: "awaiting_shipment",
        hasAcceptedOffer: true,
        hasOrder: true,
      }),
    ).toBe("Paid");
    expect(
      resolveSprint1ConversationStatus({
        viewerRole: "seller",
        orderStatus: "awaiting_shipment",
        hasAcceptedOffer: true,
        hasOrder: true,
      }),
    ).toBe("Buyer paid");
  });

  it("buildConversationHubView uses Sprint 1 awaiting-payment labels", () => {
    const order = {
      id: "o1",
      orderNumber: "RX-1",
      status: "awaiting_payment",
      product: sampleConversation.product,
      buyer: { id: "b", name: "Buyer" },
      seller: { id: "s", name: "Seller" },
      totals: { itemPrice: 6.5, platformFee: 0.36, delivery: 0, total: 6.86 },
      deliveryCarrier: "",
      trackingNumber: null,
      createdAt: new Date().toISOString(),
      disputesDisabled: false,
    } as unknown as Order;

    /* participant.role is the *other* party — buyer viewer talks to seller. */
    const buyerConversation = {
      ...sampleConversation,
      participant: { ...sampleConversation.participant, role: "seller" as const, name: "Seller" },
    };
    const buyerView = buildConversationHubView({
      conversation: buyerConversation,
      order,
      offers: [],
    });
    expect(buyerView.viewerRole).toBe("buyer");
    expect(buyerView.orderStatusLabel).toBe("Awaiting payment");
    expect(buyerView.dynamicActions[0]?.label.toLowerCase()).toContain("buy now");
    expect(buyerView.dynamicActions[0]?.label).toContain("•");
    expect(buyerView.dynamicActions[0]?.label).toContain("£6.86");
    expect(buyerView.dynamicActions[0]?.label).toBe(formatPayNowLabel(6.86));

    const sellerConversation = {
      ...sampleConversation,
      participant: { ...sampleConversation.participant, role: "buyer" as const, name: "Buyer" },
    };
    const sellerView = buildConversationHubView({
      conversation: sellerConversation,
      order,
      offers: [],
    });
    expect(sellerView.viewerRole).toBe("seller");
    expect(sellerView.orderStatusLabel).toBe("Waiting buyer payment.");
    expect(sellerView.dynamicActions).toHaveLength(0);
  });

  it("locks Canonical Negotiation surfaces in ConversationHub without duplicate action engines", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const actions = readSource("features/transaction-hub/TransactionHubBottomActions.tsx");
    const css = readSource("styles/rovexo/conversation-hub-v1.css");

    expect(hub).toContain("SafeImage");
    expect(hub).toContain("TransactionActionBar");
    expect(hub).toContain("conv-hub__product--compact");
    expect(hub).toContain("showBottomNav={false}");
    expect(hub).toContain("v2-canonical");
    expect(hub).toContain("executeBuyNow");
    expect(hub).toContain("buildBuyNowCheckoutHref");
    expect(hub).toContain("TransactionStatusCard");
    expect(actions).toContain("Offer Pending");
    expect(actions).toContain("Canonical Offer Accepted + BUY NOW = Transaction Status Card only");
    expect(actions).not.toContain("thub-v1__accept-card");
    expect(actions).toContain("Make Offer");
    expect(css).toContain("Composer is permanent bottom chrome");
    expect(css).toContain(".conv-hub__product--compact");
    expect(css).toContain(".conv-hub__header-centre--identity");
  });
});

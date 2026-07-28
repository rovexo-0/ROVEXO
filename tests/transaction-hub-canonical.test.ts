import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { resolveChatBottomActions } from "@/lib/transaction-hub/chat-actions";
import {
  CHAT_BOTTOM_ACTIONS,
  CHECKOUT_HUB_STEPS,
  TRANSACTION_HUB_COPY,
  TRANSACTION_HUB_ORDER_TIMELINE,
} from "@/lib/transaction-hub/canonical";
import {
  transactionHubCheckoutHref,
  transactionHubInboxHref,
  TRANSACTION_HUB_INBOX_PATH,
} from "@/lib/transaction-hub/inbox-routes";
import { resolveSmartNotificationHref } from "@/lib/notifications/routing";

const publishedProduct = {
  id: "prod-1",
  slug: "memory-foam-pillow",
  title: "Memory Foam Pillow",
  price: 24.99,
  condition: "Very Good",
  imageUrl: "/placeholder-product.svg",
  status: "published" as const,
  listingType: "fixed" as const,
  acceptOffers: true,
};

describe("transaction hub canonical", () => {
  it("defines chat action priority order", () => {
    expect(CHAT_BOTTOM_ACTIONS.buyNow.priority).toBe("primary");
    expect(CHAT_BOTTOM_ACTIONS.makeOffer.priority).toBe("secondary");
    expect(CHAT_BOTTOM_ACTIONS.addToCart.priority).toBe("tertiary");
  });

  it("defines checkout and order timeline steps", () => {
    expect(CHECKOUT_HUB_STEPS).toHaveLength(5);
    expect(TRANSACTION_HUB_ORDER_TIMELINE).toContain("order_placed");
    expect(TRANSACTION_HUB_ORDER_TIMELINE).toContain("completed");
    expect(TRANSACTION_HUB_COPY.addedToCart).toBe("Added to Cart");
  });

  it("resolves buyer chat actions for published fixed-price listings", () => {
    const actions = resolveChatBottomActions({
      viewerRole: "buyer",
      product: publishedProduct,
    });
    expect(actions).toEqual({
      buyNow: false,
      makeOffer: true,
      addToCart: true,
    });
  });

  it("enables Buy Now only after an accepted offer", () => {
    expect(
      resolveChatBottomActions({
        viewerRole: "buyer",
        product: publishedProduct,
        hasAcceptedOffer: true,
      }),
    ).toEqual({
      buyNow: true,
      makeOffer: false,
      addToCart: false,
    });
  });

  it("hides commerce actions for sellers and sold listings", () => {
    expect(
      resolveChatBottomActions({
        viewerRole: "seller",
        product: publishedProduct,
      }),
    ).toEqual({ buyNow: false, makeOffer: false, addToCart: false });

    expect(
      resolveChatBottomActions({
        viewerRole: "buyer",
        product: { ...publishedProduct, status: "sold" },
      }),
    ).toEqual({ buyNow: false, makeOffer: false, addToCart: false });
  });

  it("uses /inbox as canonical inbox", () => {
    expect(TRANSACTION_HUB_INBOX_PATH).toBe("/inbox");
    expect(transactionHubInboxHref("conv-1")).toBe("/inbox/conversation/conv-1");
    expect(transactionHubCheckoutHref("pillow", "conv-1")).toContain("/checkout/pillow");
    expect(transactionHubCheckoutHref("pillow", "conv-1")).toContain("returnTo=");
    expect(transactionHubCheckoutHref("pillow", "conv-1")).toContain("hub=chat");
  });

  it("routes message notifications to inbox conversation threads", () => {
    expect(resolveSmartNotificationHref("new_message", { conversationId: "c1" })).toBe(
      "/inbox/conversation/c1",
    );
  });
});

describe("transaction hub chat integration", () => {
  it("wires bottom actions into ConversationHub", () => {
    const chat = readFileSync(
      path.join(process.cwd(), "features/inbox/components/ConversationHub.tsx"),
      "utf8",
    );
    expect(chat).toContain("TransactionActionBar");
    expect(chat).toContain("data-conversation-hub");
  });

  it("exposes functional buyer actions without page navigation for cart", () => {
    const actions = readFileSync(
      path.join(process.cwd(), "features/transaction-hub/TransactionHubBottomActions.tsx"),
      "utf8",
    );
    const hub = readFileSync(
      path.join(process.cwd(), "features/inbox/components/ConversationHub.tsx"),
      "utf8",
    );
    expect(actions).toContain("Make Offer");
    expect(actions).toContain("Canonical Offer Accepted + BUY NOW = Transaction Status Card only");
    expect(hub).toContain("buildBuyNowCheckoutHref");
    expect(hub).toContain("executeBuyNow");
    expect(actions).not.toContain("CheckoutHubSheet");
    expect(hub).not.toContain('router.push("/cart")');
  });
});

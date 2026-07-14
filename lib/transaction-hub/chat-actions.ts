import type { ConversationProduct, SenderRole } from "@/lib/messages/types";
import { getTransactionCapabilities } from "@/lib/transaction-mode/capabilities";
import type { TransactionMode } from "@/lib/transaction-mode/types";
import { CHAT_BOTTOM_ACTIONS } from "@/lib/transaction-hub/canonical";

export type ChatBottomActionId = (typeof CHAT_BOTTOM_ACTIONS)[keyof typeof CHAT_BOTTOM_ACTIONS]["id"];

export type ResolvedChatBottomActions = {
  buyNow: boolean;
  makeOffer: boolean;
  addToCart: boolean;
};

export type ChatActionContext = {
  viewerRole: SenderRole;
  product: ConversationProduct;
  transactionMode?: TransactionMode;
  /** When an accepted offer is locked, keep Buy Now only (hide Make Offer / Add to Cart). */
  hasAcceptedOffer?: boolean;
};

function isListingAvailable(product: ConversationProduct): boolean {
  return product.status === "published";
}

function isFixedPrice(product: ConversationProduct): boolean {
  return product.listingType !== "auction";
}

/** Resolves which buyer bottom actions are available inside chat. */
export function resolveChatBottomActions(context: ChatActionContext): ResolvedChatBottomActions {
  const mode = context.transactionMode ?? "MARKETPLACE";
  const capabilities = getTransactionCapabilities(mode);

  if (context.viewerRole !== "buyer") {
    return { buyNow: false, makeOffer: false, addToCart: false };
  }

  const available = isListingAvailable(context.product);
  const fixedPrice = isFixedPrice(context.product);

  if (context.hasAcceptedOffer) {
    return {
      buyNow: available && fixedPrice && capabilities.buyNow,
      makeOffer: false,
      addToCart: false,
    };
  }

  return {
    buyNow: available && fixedPrice && capabilities.buyNow,
    makeOffer: available && context.product.acceptOffers,
    addToCart: available && fixedPrice && capabilities.addToCart,
  };
}

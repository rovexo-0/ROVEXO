/**
 * Inbox seller-context scope — not a second Inbox engine.
 * Buyer threads stay Individual. Seller threads follow order/checkout seller_context.
 * Unstamped seller threads default to Individual (legacy).
 */
import type { Conversation } from "@/lib/messages/types";
import { getViewerRole } from "@/lib/messages/types";
import {
  normalizeSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";

export type ConversationSellerContextHint = {
  conversationId: string;
  productId: string;
  sellerId: string;
  viewerIsBuyer: boolean;
};

export function resolveConversationSellerContext(input: {
  viewerIsBuyer: boolean;
  orderContext?: string | null;
  checkoutContext?: string | null;
}): SellerContext {
  if (input.viewerIsBuyer) return "individual";
  if (input.orderContext != null && input.orderContext !== "") {
    return normalizeSellerContext(input.orderContext);
  }
  if (input.checkoutContext != null && input.checkoutContext !== "") {
    return normalizeSellerContext(input.checkoutContext);
  }
  return "individual";
}

export function conversationMatchesActiveSellerContext(
  conversationContext: SellerContext,
  active: SellerContext,
): boolean {
  return normalizeSellerContext(conversationContext) === normalizeSellerContext(active);
}

export function filterConversationsForActiveSellerContext(
  conversations: Conversation[],
  viewerId: string,
  active: SellerContext,
  contextByConversationId: Map<string, SellerContext>,
): Conversation[] {
  const activeContext = normalizeSellerContext(active);
  return conversations.filter((conversation) => {
    const viewerRole = getViewerRole(conversation.participant);
    if (viewerRole === "buyer") {
      return activeContext === "individual";
    }
    const stamped =
      contextByConversationId.get(conversation.id) ??
      ("individual" as SellerContext);
    return conversationMatchesActiveSellerContext(stamped, activeContext);
  });
}

export function buildConversationScopeHints(
  rows: Array<{
    id: string;
    product_id: string;
    buyer_id: string;
    seller_id: string;
  }>,
  viewerId: string,
): ConversationSellerContextHint[] {
  return rows.map((row) => ({
    conversationId: row.id,
    productId: row.product_id,
    sellerId: row.seller_id,
    viewerIsBuyer: row.buyer_id === viewerId,
  }));
}

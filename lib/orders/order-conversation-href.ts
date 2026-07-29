/**
 * Order → Conversation routing SSOT (Phase I).
 * One Order = One Conversation. Prefer direct Hub URL; fall back to /inbox?order=.
 */

import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";

export type OrderConversationHrefInput = {
  orderId: string;
  conversationId?: string | null;
  focus?: "tracking";
};

/** Direct Conversation Hub URL when conversationId is known. */
export function buildOrderConversationHref(input: OrderConversationHrefInput): string {
  const orderId = input.orderId.trim();
  const conversationId = input.conversationId?.trim() || null;

  if (conversationId) {
    const qs = new URLSearchParams({ order: orderId });
    if (input.focus === "tracking") qs.set("focus", "tracking");
    return `${INBOX_ROUTES.conversation(conversationId)}?${qs.toString()}`;
  }

  const qs = new URLSearchParams({ order: orderId });
  if (input.focus === "tracking") qs.set("focus", "tracking");
  return `${INBOX_ROUTES.hub}?${qs.toString()}`;
}

/** Match conversation for an order product (buyer↔seller thread). */
export function matchConversationIdForOrder(input: {
  productId: string;
  productSlug?: string | null;
  conversations: Array<{
    id: string;
    product: { id: string; slug?: string | null };
  }>;
}): string | null {
  const productId = input.productId.trim();
  const slug = input.productSlug?.trim() || null;
  const match = input.conversations.find(
    (item) =>
      item.product.id === productId || (slug != null && item.product.slug === slug),
  );
  return match?.id ?? null;
}

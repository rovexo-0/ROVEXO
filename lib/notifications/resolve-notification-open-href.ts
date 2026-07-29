/**
 * Notification open destination — one navigation only.
 * Funds Pending → Transaction Conversation (never Wallet / Balance).
 */

import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";
import type { Conversation } from "@/lib/messages/types";
import type { Notification } from "@/lib/notifications/types";
import {
  extractOrderIdFromNotificationHref,
  extractOrderRefFromNotificationSubtitle,
  isFundsPendingNotificationFamily,
  isWalletHubNotificationHref,
  recoverNotificationHref,
} from "@/lib/notifications/routing";
import {
  buildOrderConversationHref,
  matchConversationIdForOrder,
} from "@/lib/orders/order-conversation-href";
import { getMessageHref } from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";

/**
 * Resolve the single href used when the user taps a notification.
 * Prefers a direct `/inbox/conversation/:id?order=` URL so Inbox never
 * performs a second hop — and Wallet/Balance never opens.
 */
export async function resolveNotificationOpenHref(
  notification: Notification,
): Promise<string> {
  const recovered = recoverNotificationHref(notification.href, {
    title: notification.title,
    subtitle: notification.subtitle,
    type: notification.type,
  });

  if (recovered.startsWith("/inbox/conversation/")) {
    return recovered;
  }

  /* Preserve explicit wallet transaction detail (Withdrawal completed). */
  if (
    recovered.startsWith("/wallet/transactions/") &&
    !isFundsPendingNotificationFamily(notification)
  ) {
    return recovered;
  }

  const orderRef =
    extractOrderIdFromNotificationHref(recovered) ??
    extractOrderIdFromNotificationHref(notification.href) ??
    (isFundsPendingNotificationFamily(notification) || notification.type === "payment"
      ? extractOrderRefFromNotificationSubtitle(notification.subtitle)
      : null);

  if (orderRef) {
    const conversationHref = await resolveConversationHrefForOrderRef(orderRef);
    if (conversationHref) return conversationHref;
    return getMessageHref(orderRef, "buyer");
  }

  if (
    isFundsPendingNotificationFamily(notification) ||
    isWalletHubNotificationHref(recovered)
  ) {
    return INBOX_ROUTES.hub;
  }

  return recovered;
}

async function resolveConversationHrefForOrderRef(orderRef: string): Promise<string | null> {
  try {
    const [ordersRes, messagesRes] = await Promise.all([
      fetch("/api/orders", { cache: "no-store" }),
      fetch("/api/messages", { cache: "no-store" }),
    ]);
    if (!ordersRes.ok || !messagesRes.ok) return null;

    const ordersPayload = (await ordersRes.json()) as { orders?: Order[] };
    const messagesPayload = (await messagesRes.json()) as { conversations?: Conversation[] };
    const order = (ordersPayload.orders ?? []).find(
      (item) => item.id === orderRef || item.orderNumber === orderRef,
    );
    if (!order) return null;

    const conversationId =
      order.conversationId ??
      matchConversationIdForOrder({
        productId: order.product.id,
        productSlug: order.product.slug,
        conversations: messagesPayload.conversations ?? [],
      });

    return buildOrderConversationHref({
      orderId: order.id,
      conversationId,
    });
  } catch {
    return null;
  }
}

/**
 * Notification open destination — one navigation only.
 * Funds Pending → Transaction Conversation (never Wallet / Balance).
 *
 * P0.2-F: Sync resolution for deterministic destinations (no dual API wait).
 * Order refs without conversationId use `/inbox?order=` — Inbox recovers the Hub.
 */

import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";
import type { Notification } from "@/lib/notifications/types";
import {
  extractOrderIdFromNotificationHref,
  extractOrderRefFromNotificationSubtitle,
  isFundsPendingNotificationFamily,
  isWalletHubNotificationHref,
  recoverNotificationHref,
} from "@/lib/notifications/routing";
import { getMessageHref } from "@/lib/orders/status";

/**
 * Synchronous open href — never awaits network.
 * Prefer direct `/inbox/conversation/:id` when already present on the notification.
 */
export function resolveNotificationOpenHrefSync(
  notification: Notification,
): string {
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
    /* Deterministic Inbox deep-link — Conversation Hub recovered client-side. */
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

/**
 * Resolve the single href used when the user taps a notification.
 * Sync-only (P0.2-F) — never blocks on /api/orders + /api/messages.
 */
export async function resolveNotificationOpenHref(
  notification: Notification,
): Promise<string> {
  return resolveNotificationOpenHrefSync(notification);
}

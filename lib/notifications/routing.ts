import type { SmartNotificationEventType } from "@/lib/notifications/events";
import type { NotificationType } from "@/lib/notifications/types";
import { PROFILE_RETURN_TO_PARAM } from "@/lib/account/profile-completion";

import { TRANSACTION_HUB_INBOX_PATH, transactionHubInboxHref } from "@/lib/transaction-hub/inbox-routes";

/** Canonical deep-link targets — Module 02B SSOT. */
export const NOTIFICATION_ROUTES = {
  inbox: TRANSACTION_HUB_INBOX_PATH,
  inboxThread: transactionHubInboxHref,
  orders: "/orders",
  order: (orderId: string) => `/orders/${orderId}`,
  orderTracking: (orderId: string) => `/orders/${orderId}?view=tracking`,
  offers: "/offers",
  offer: (offerId: string) => `/offers/${offerId}`,
  saved: "/saved",
  savedItem: (productId: string) => `/saved?highlight=${productId}`,
  reviews: "/account/reviews",
  followers: "/account/followers",
  listing: (slug: string) => `/product/${slug}`,
  wallet: "/wallet",
  walletTransactions: "/wallet/transactions",
  walletWithdrawal: (transactionId: string) => `/wallet/transactions/${transactionId}`,
  settings: "/account/settings",
  settingsAddresses: `/account/addresses?${PROFILE_RETURN_TO_PARAM}=/account`,
  settingsPayments: `/account/payment-methods?${PROFILE_RETURN_TO_PARAM}=/account`,
  settingsBank: `/account/settings/bank-account?${PROFILE_RETURN_TO_PARAM}=/account`,
} as const;

export type NotificationRouteContext = {
  orderId?: string;
  offerId?: string;
  productId?: string;
  productSlug?: string;
  transactionId?: string;
  conversationId?: string;
};

export function resolveSmartNotificationHref(
  eventType: SmartNotificationEventType,
  context: NotificationRouteContext = {},
): string {
  switch (eventType) {
    case "new_message":
      return context.conversationId
        ? NOTIFICATION_ROUTES.inboxThread(context.conversationId)
        : NOTIFICATION_ROUTES.inbox;
    case "new_offer":
      return context.offerId ? NOTIFICATION_ROUTES.offer(context.offerId) : NOTIFICATION_ROUTES.offers;
    case "new_order":
      return context.orderId ? NOTIFICATION_ROUTES.order(context.orderId) : NOTIFICATION_ROUTES.orders;
    case "order_shipped":
      return context.orderId
        ? NOTIFICATION_ROUTES.orderTracking(context.orderId)
        : NOTIFICATION_ROUTES.orders;
    case "order_delivered":
      return context.orderId ? NOTIFICATION_ROUTES.order(context.orderId) : NOTIFICATION_ROUTES.orders;
    case "listing_sold":
      return context.productId
        ? NOTIFICATION_ROUTES.savedItem(context.productId)
        : NOTIFICATION_ROUTES.saved;
    case "saved_search_match":
      return context.productSlug
        ? NOTIFICATION_ROUTES.listing(context.productSlug)
        : NOTIFICATION_ROUTES.saved;
    case "payment_received":
    case "payout":
      return context.transactionId
        ? NOTIFICATION_ROUTES.walletWithdrawal(context.transactionId)
        : NOTIFICATION_ROUTES.walletTransactions;
    case "refund":
      return context.orderId ? NOTIFICATION_ROUTES.order(context.orderId) : NOTIFICATION_ROUTES.orders;
    case "trust_verification":
      return NOTIFICATION_ROUTES.settings;
    case "support_reply":
      return NOTIFICATION_ROUTES.inbox;
    case "promotion":
    case "admin_announcement":
    case "business_lead":
    case "listing_expiring":
    default:
      return NOTIFICATION_ROUTES.settings;
  }
}

export function resolveCompletionGapHref(
  gap: "address" | "payment" | "bank",
  returnTo: string,
): string {
  const encoded = encodeURIComponent(returnTo);
  if (gap === "address") return `${NOTIFICATION_ROUTES.settingsAddresses.split("?")[0]}?${PROFILE_RETURN_TO_PARAM}=${encoded}`;
  if (gap === "payment") return `/account/payment-methods?${PROFILE_RETURN_TO_PARAM}=${encoded}`;
  return `/account/settings/bank-account?${PROFILE_RETURN_TO_PARAM}=${encoded}`;
}

export function resolveNotificationTypeHref(
  type: NotificationType,
  context: NotificationRouteContext = {},
): string {
  switch (type) {
    case "message":
      return context.conversationId
        ? NOTIFICATION_ROUTES.inboxThread(context.conversationId)
        : NOTIFICATION_ROUTES.inbox;
    case "order":
      return context.orderId ? NOTIFICATION_ROUTES.order(context.orderId) : NOTIFICATION_ROUTES.orders;
    case "offer":
      return context.offerId ? NOTIFICATION_ROUTES.offer(context.offerId) : NOTIFICATION_ROUTES.offers;
    case "review":
      return NOTIFICATION_ROUTES.reviews;
    case "follower":
      return NOTIFICATION_ROUTES.followers;
    case "payment":
      return context.transactionId
        ? NOTIFICATION_ROUTES.walletWithdrawal(context.transactionId)
        : NOTIFICATION_ROUTES.wallet;
    case "saved_item_sold":
    case "price_reduced":
      return context.productId
        ? NOTIFICATION_ROUTES.savedItem(context.productId)
        : NOTIFICATION_ROUTES.saved;
    case "saved_search_match":
      return context.productSlug
        ? NOTIFICATION_ROUTES.listing(context.productSlug)
        : NOTIFICATION_ROUTES.saved;
    default:
      return NOTIFICATION_ROUTES.settings;
  }
}

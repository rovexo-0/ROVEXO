import type { SmartNotificationEventType } from "@/lib/notifications/events";
import type { NotificationType } from "@/lib/notifications/types";
import { PROFILE_RETURN_TO_PARAM } from "@/lib/account/profile-completion";
import {
  getCanonicalNotificationByEventType,
  resolveCanonicalNotificationHref,
  type NotificationRouteContext,
} from "@/lib/notifications/catalog";

import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { getMessageHref, getOrderHubTrackHref } from "@/lib/orders/status";

import { TRANSACTION_HUB_INBOX_PATH, transactionHubInboxHref } from "@/lib/transaction-hub/inbox-routes";

/** Canonical deep-link targets — Module 02B SSOT (Transaction Conversation Hub). */
export const NOTIFICATION_ROUTES = {
  inbox: TRANSACTION_HUB_INBOX_PATH,
  inboxThread: transactionHubInboxHref,
  orders: "/orders",
  /** Order notifications open the Transaction Conversation Hub — never dead /orders/:id for sellers. */
  order: (orderId: string) => getMessageHref(orderId, "buyer"),
  orderTracking: (orderId: string) => getOrderHubTrackHref(orderId),
  offers: "/inbox?tab=messages&filter=offers",
  offer: (offerId: string) => `/inbox?tab=messages&filter=offers&offer=${encodeURIComponent(offerId)}`,
  saved: "/saved",
  savedItem: (productId: string) => `/saved?highlight=${productId}`,
  reviews: "/account/reviews",
  listing: (slug: string) => `/listing/${slug}`,
  wallet: WALLET_ROUTES.hub,
  walletTransactions: WALLET_ROUTES.transactions,
  walletWithdrawal: (transactionId: string) => `/wallet/transactions/${transactionId}`,
  settings: "/account/settings",
  settingsAddresses: `/account/addresses?${PROFILE_RETURN_TO_PARAM}=/account`,
  settingsPayments: `${WALLET_ROUTES.paymentMethods}?${PROFILE_RETURN_TO_PARAM}=/account`,
  settingsBank: `${WALLET_ROUTES.bankAccount}?${PROFILE_RETURN_TO_PARAM}=/account`,
} as const;

export type { NotificationRouteContext };

/** Wallet hub destinations — never open Balance from a notification deep link. */
const WALLET_HUB_PATHS = new Set([
  "/wallet",
  "/balance",
  "/seller/wallet",
  "/account/wallet",
  "/payments",
]);

export type RecoverNotificationHrefContext = {
  title?: string;
  subtitle?: string;
  type?: string;
};

export function isWalletHubNotificationHref(href: string): boolean {
  const pathOnly = (href ?? "").trim().split("?")[0]?.split("#")[0] ?? "";
  const normalized = pathOnly.replace(/\/+$/, "") || "/";
  return WALLET_HUB_PATHS.has(normalized);
}

/** Funds Pending / Funds released — Transaction Conversation only (never Wallet). */
export function isFundsPendingNotificationFamily(input: {
  title?: string;
}): boolean {
  const title = (input.title ?? "").trim().toLowerCase();
  if (!title) return false;
  return (
    title === "funds pending" ||
    title.startsWith("funds pending") ||
    title === "funds are now available" ||
    title.startsWith("funds are now available")
  );
}

export function extractOrderIdFromNotificationHref(href: string): string | null {
  const raw = (href ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw, "https://rovexo.local");
    return url.searchParams.get("order") || url.searchParams.get("order_id");
  } catch {
    const match = raw.match(/[?&]order(?:_id)?=([^&]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

/** Subtitle shape: "£12.00 from order #RVX-123 — waiting…" */
export function extractOrderRefFromNotificationSubtitle(subtitle?: string): string | null {
  if (!subtitle) return null;
  const match = subtitle.match(/order\s+#?([A-Za-z0-9_-]+)/i);
  return match?.[1] ?? null;
}

/**
 * Rewrite legacy / dead notification destinations to canonical Hub routes.
 * Does not invent IDs — only remaps known broken path shapes.
 * Funds Pending legacy `/wallet` → Inbox / order hub (never Balance).
 */
export function recoverNotificationHref(
  href: string,
  context?: RecoverNotificationHrefContext,
): string {
  const raw = (href ?? "").trim();
  if (!raw) return NOTIFICATION_ROUTES.inbox;

  const pathOnly = raw.split("?")[0]?.split("#")[0] ?? raw;
  const normalized = pathOnly.replace(/\/+$/, "") || "/";

  if (normalized.startsWith("/inbox/conversation/")) return raw;

  const trackingMatch = normalized.match(/^\/orders\/([^/]+)\/tracking$/);
  if (trackingMatch?.[1]) return getOrderHubTrackHref(trackingMatch[1]);

  const buyerOrderMatch = normalized.match(/^\/orders\/([^/]+)$/);
  if (buyerOrderMatch?.[1]) return getMessageHref(buyerOrderMatch[1], "buyer");

  const sellerOrderMatch = normalized.match(/^\/seller\/orders\/([^/]+)$/);
  if (sellerOrderMatch?.[1]) return getMessageHref(sellerOrderMatch[1], "seller");

  /* Legacy Funds Pending / payment hub links stored as Wallet — never open Balance. */
  if (WALLET_HUB_PATHS.has(normalized)) {
    const orderId = extractOrderIdFromNotificationHref(raw);
    if (orderId) return getMessageHref(orderId, "buyer");
    void context;
    return NOTIFICATION_ROUTES.inbox;
  }

  return raw;
}

export function resolveSmartNotificationHref(
  eventType: SmartNotificationEventType | string,
  context: NotificationRouteContext = {},
): string {
  const catalog = getCanonicalNotificationByEventType(eventType);
  if (catalog) {
    return resolveCanonicalNotificationHref(catalog.kind, context);
  }

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
      if (context.orderId) return NOTIFICATION_ROUTES.order(context.orderId);
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
  if (gap === "address") {
    return `${NOTIFICATION_ROUTES.settingsAddresses.split("?")[0]}?${PROFILE_RETURN_TO_PARAM}=${encoded}`;
  }
  if (gap === "payment") {
    return `${WALLET_ROUTES.paymentMethods}?${PROFILE_RETURN_TO_PARAM}=${encoded}`;
  }
  return `${WALLET_ROUTES.bankAccounts}?${PROFILE_RETURN_TO_PARAM}=${encoded}`;
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
    case "payment":
      if (context.orderId) return NOTIFICATION_ROUTES.order(context.orderId);
      return context.transactionId
        ? NOTIFICATION_ROUTES.walletWithdrawal(context.transactionId)
        : NOTIFICATION_ROUTES.inbox;
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

/**
 * ROVEXO Notifications v1.0 — canonical event catalog SSOT.
 * Maps to existing DB `notification_type` (no schema change).
 */

import type { NotificationType } from "@/lib/notifications/types";

export type NotificationAudience = "buyer" | "seller" | "marketplace";

export type NotificationRouteContext = {
  orderId?: string;
  offerId?: string;
  productId?: string;
  productSlug?: string;
  transactionId?: string;
  conversationId?: string;
};

export type NotificationChannel = "in_app" | "push" | "email";

export type NotificationControlKey =
  | "push"
  | "email"
  | "orders"
  | "offers"
  | "marketing"
  | "security";

export type NotificationEntityKind =
  | "order"
  | "offer"
  | "conversation"
  | "product"
  | "payout"
  | "account"
  | "policy"
  | "system";

export type CanonicalNotificationKind =
  /* Buyer */
  | "buyer.purchase_successful"
  | "buyer.payment_successful"
  | "buyer.order_confirmed"
  | "buyer.order_shipped"
  | "buyer.tracking_updated"
  | "buyer.delivered"
  | "buyer.refund_completed"
  | "buyer.offer_accepted"
  | "buyer.offer_declined"
  | "buyer.offer_expired"
  | "buyer.item_back_in_stock"
  | "buyer.favorite_price_changed"
  /* Seller */
  | "seller.new_order"
  | "seller.new_message"
  | "seller.offer_received"
  | "seller.offer_accepted"
  | "seller.offer_declined"
  | "seller.offer_expired"
  | "seller.shipping_deadline"
  | "seller.item_sold"
  | "seller.buyer_reported_issue"
  | "seller.refund_requested"
  | "seller.payout_completed"
  /* Marketplace */
  | "marketplace.account_verified"
  | "marketplace.business_verified"
  | "marketplace.promotional_campaign"
  | "marketplace.feature_announcement"
  | "marketplace.security_alert"
  | "marketplace.policy_update"
  | "marketplace.legal_update";

export type CanonicalNotificationDefinition = {
  kind: CanonicalNotificationKind;
  audience: NotificationAudience;
  title: string;
  description: string;
  actionLabel: string;
  entity: NotificationEntityKind;
  status: string;
  channels: readonly NotificationChannel[];
  control: NotificationControlKey;
  dbType: NotificationType;
  /** Stable smart-event id for emitSmartNotification / idempotency. */
  eventType: string;
};

function orderHref(ctx: NotificationRouteContext) {
  return ctx.orderId ? `/orders/${ctx.orderId}` : "/orders";
}

function trackingHref(ctx: NotificationRouteContext) {
  return ctx.orderId ? `/orders/${ctx.orderId}/tracking` : "/orders";
}

function offerHref(ctx: NotificationRouteContext) {
  return ctx.offerId
    ? `/inbox?tab=messages&filter=offers&offer=${encodeURIComponent(ctx.offerId)}`
    : "/inbox?tab=messages&filter=offers";
}

function conversationHref(ctx: NotificationRouteContext) {
  return ctx.conversationId ? `/inbox/conversation/${ctx.conversationId}` : "/inbox";
}

function productHref(ctx: NotificationRouteContext) {
  if (ctx.productSlug) return `/listing/${ctx.productSlug}`;
  if (ctx.productId) return `/saved?highlight=${ctx.productId}`;
  return "/saved";
}

function payoutHref(ctx: NotificationRouteContext) {
  return ctx.transactionId
    ? `/wallet/transactions/${ctx.transactionId}`
    : "/wallet/transactions";
}

const ALL_CHANNELS = ["in_app", "push", "email"] as const satisfies readonly NotificationChannel[];

export const CANONICAL_NOTIFICATION_CATALOG: readonly CanonicalNotificationDefinition[] = [
  // —— Buyer ——
  {
    kind: "buyer.purchase_successful",
    audience: "buyer",
    title: "Purchase successful",
    description: "Your purchase completed successfully.",
    actionLabel: "Open order details",
    entity: "order",
    status: "purchased",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "order",
    eventType: "purchase_successful",
  },
  {
    kind: "buyer.payment_successful",
    audience: "buyer",
    title: "Payment successful",
    description: "Your payment was received.",
    actionLabel: "Open order details",
    entity: "order",
    status: "paid",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "payment",
    eventType: "payment_successful",
  },
  {
    kind: "buyer.order_confirmed",
    audience: "buyer",
    title: "Order confirmed",
    description: "The seller confirmed your order.",
    actionLabel: "Open order details",
    entity: "order",
    status: "confirmed",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "order",
    eventType: "order_confirmed",
  },
  {
    kind: "buyer.order_shipped",
    audience: "buyer",
    title: "Order shipped",
    description: "Your order is on the way.",
    actionLabel: "Open tracking page",
    entity: "order",
    status: "shipped",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "order",
    eventType: "order_shipped",
  },
  {
    kind: "buyer.tracking_updated",
    audience: "buyer",
    title: "Tracking updated",
    description: "There is a new tracking update for your order.",
    actionLabel: "Open tracking page",
    entity: "order",
    status: "tracking_updated",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "order",
    eventType: "tracking_updated",
  },
  {
    kind: "buyer.delivered",
    audience: "buyer",
    title: "Delivered",
    description: "Your order was delivered.",
    actionLabel: "Open order details",
    entity: "order",
    status: "delivered",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "order",
    eventType: "order_delivered",
  },
  {
    kind: "buyer.refund_completed",
    audience: "buyer",
    title: "Refund completed",
    description: "Your refund has been completed.",
    actionLabel: "Open order details",
    entity: "order",
    status: "refunded",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "payment",
    eventType: "refund",
  },
  {
    kind: "buyer.offer_accepted",
    audience: "buyer",
    title: "Offer accepted",
    description: "Your offer was accepted. Complete checkout to buy.",
    actionLabel: "Open checkout",
    entity: "offer",
    status: "accepted",
    channels: ALL_CHANNELS,
    control: "offers",
    dbType: "offer",
    eventType: "offer_accepted",
  },
  {
    kind: "buyer.offer_declined",
    audience: "buyer",
    title: "Offer declined",
    description: "Your offer was declined.",
    actionLabel: "Open offer",
    entity: "offer",
    status: "declined",
    channels: ALL_CHANNELS,
    control: "offers",
    dbType: "offer",
    eventType: "offer_declined",
  },
  {
    kind: "buyer.offer_expired",
    audience: "buyer",
    title: "Offer expired",
    description: "Your offer has expired.",
    actionLabel: "Open offer",
    entity: "offer",
    status: "expired",
    channels: ALL_CHANNELS,
    control: "offers",
    dbType: "offer",
    eventType: "offer_expired",
  },
  {
    kind: "buyer.item_back_in_stock",
    audience: "buyer",
    title: "Item back in stock",
    description: "A saved item is available again.",
    actionLabel: "Open listing",
    entity: "product",
    status: "in_stock",
    channels: ALL_CHANNELS,
    control: "marketing",
    dbType: "saved_search_match",
    eventType: "item_back_in_stock",
  },
  {
    kind: "buyer.favorite_price_changed",
    audience: "buyer",
    title: "Favorite item price changed",
    description: "A saved item changed price.",
    actionLabel: "Open listing",
    entity: "product",
    status: "price_changed",
    channels: ALL_CHANNELS,
    control: "marketing",
    dbType: "price_reduced",
    eventType: "favorite_price_changed",
  },
  // —— Seller ——
  {
    kind: "seller.new_order",
    audience: "seller",
    title: "New order",
    description: "You received a new order.",
    actionLabel: "Open order details",
    entity: "order",
    status: "new",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "order",
    eventType: "new_order",
  },
  {
    kind: "seller.new_message",
    audience: "seller",
    title: "New message",
    description: "You have a new message.",
    actionLabel: "Open conversation",
    entity: "conversation",
    status: "unread",
    channels: ALL_CHANNELS,
    control: "offers",
    dbType: "message",
    eventType: "new_message",
  },
  {
    kind: "seller.offer_received",
    audience: "seller",
    title: "Offer received",
    description: "A buyer sent you an offer.",
    actionLabel: "Open offer",
    entity: "offer",
    status: "received",
    channels: ALL_CHANNELS,
    control: "offers",
    dbType: "offer",
    eventType: "new_offer",
  },
  {
    kind: "seller.offer_accepted",
    audience: "seller",
    title: "Offer accepted",
    description: "An offer was accepted.",
    actionLabel: "Open offer",
    entity: "offer",
    status: "accepted",
    channels: ALL_CHANNELS,
    control: "offers",
    dbType: "offer",
    eventType: "seller_offer_accepted",
  },
  {
    kind: "seller.offer_declined",
    audience: "seller",
    title: "Offer declined",
    description: "An offer was declined.",
    actionLabel: "Open offer",
    entity: "offer",
    status: "declined",
    channels: ALL_CHANNELS,
    control: "offers",
    dbType: "offer",
    eventType: "seller_offer_declined",
  },
  {
    kind: "seller.offer_expired",
    audience: "seller",
    title: "Offer expired",
    description: "An offer expired.",
    actionLabel: "Open offer",
    entity: "offer",
    status: "expired",
    channels: ALL_CHANNELS,
    control: "offers",
    dbType: "offer",
    eventType: "seller_offer_expired",
  },
  {
    kind: "seller.shipping_deadline",
    audience: "seller",
    title: "Shipping deadline reminder",
    description: "Ship this order before the deadline.",
    actionLabel: "Open order details",
    entity: "order",
    status: "deadline",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "order",
    eventType: "shipping_deadline",
  },
  {
    kind: "seller.item_sold",
    audience: "seller",
    title: "Item sold",
    description: "One of your listings sold.",
    actionLabel: "Open order details",
    entity: "order",
    status: "sold",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "saved_item_sold",
    eventType: "listing_sold",
  },
  {
    kind: "seller.buyer_reported_issue",
    audience: "seller",
    title: "Buyer reported issue",
    description: "A buyer reported an issue with an order.",
    actionLabel: "Open order details",
    entity: "order",
    status: "issue_reported",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "moderation",
    eventType: "buyer_reported_issue",
  },
  {
    kind: "seller.refund_requested",
    audience: "seller",
    title: "Refund requested",
    description: "A buyer requested a refund.",
    actionLabel: "Open order details",
    entity: "order",
    status: "refund_requested",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "payment",
    eventType: "refund_requested",
  },
  {
    kind: "seller.payout_completed",
    audience: "seller",
    title: "Payout completed",
    description: "Your payout was completed.",
    actionLabel: "Open wallet",
    entity: "payout",
    status: "completed",
    channels: ALL_CHANNELS,
    control: "orders",
    dbType: "payment",
    eventType: "payout",
  },
  // —— Marketplace ——
  {
    kind: "marketplace.account_verified",
    audience: "marketplace",
    title: "Account verified",
    description: "Your account verification is complete.",
    actionLabel: "Open account",
    entity: "account",
    status: "verified",
    channels: ALL_CHANNELS,
    control: "security",
    dbType: "system",
    eventType: "trust_verification",
  },
  {
    kind: "marketplace.business_verified",
    audience: "marketplace",
    title: "Business verified",
    description: "Your business verification is complete.",
    actionLabel: "Open account",
    entity: "account",
    status: "business_verified",
    channels: ALL_CHANNELS,
    control: "security",
    dbType: "system",
    eventType: "business_verified",
  },
  {
    kind: "marketplace.promotional_campaign",
    audience: "marketplace",
    title: "Promotional campaign",
    description: "A promotional campaign is available.",
    actionLabel: "View details",
    entity: "system",
    status: "campaign",
    channels: ALL_CHANNELS,
    control: "marketing",
    dbType: "system",
    eventType: "promotion",
  },
  {
    kind: "marketplace.feature_announcement",
    audience: "marketplace",
    title: "Feature announcement",
    description: "A new platform feature is available.",
    actionLabel: "View details",
    entity: "system",
    status: "announcement",
    channels: ALL_CHANNELS,
    control: "marketing",
    dbType: "system",
    eventType: "admin_announcement",
  },
  {
    kind: "marketplace.security_alert",
    audience: "marketplace",
    title: "Security alert",
    description: "Review an important security update.",
    actionLabel: "Open security",
    entity: "account",
    status: "security",
    channels: ALL_CHANNELS,
    control: "security",
    dbType: "system",
    eventType: "security_alert",
  },
  {
    kind: "marketplace.policy_update",
    audience: "marketplace",
    title: "Policy update",
    description: "Marketplace policies were updated.",
    actionLabel: "View policy",
    entity: "policy",
    status: "policy_updated",
    channels: ["in_app", "email"],
    control: "security",
    dbType: "system",
    eventType: "policy_update",
  },
  {
    kind: "marketplace.legal_update",
    audience: "marketplace",
    title: "Legal update",
    description: "Legal terms were updated.",
    actionLabel: "View legal",
    entity: "policy",
    status: "legal_updated",
    channels: ["in_app", "email"],
    control: "security",
    dbType: "system",
    eventType: "legal_update",
  },
] as const;

const byKind = new Map(
  CANONICAL_NOTIFICATION_CATALOG.map((entry) => [entry.kind, entry] as const),
);
const byEventType = new Map(
  CANONICAL_NOTIFICATION_CATALOG.map((entry) => [entry.eventType, entry] as const),
);

export function getCanonicalNotification(
  kind: CanonicalNotificationKind,
): CanonicalNotificationDefinition {
  const entry = byKind.get(kind);
  if (!entry) {
    throw new Error(`Unknown notification kind: ${kind}`);
  }
  return entry;
}

export function getCanonicalNotificationByEventType(
  eventType: string,
): CanonicalNotificationDefinition | undefined {
  return byEventType.get(eventType);
}

export function resolveCanonicalNotificationHref(
  kind: CanonicalNotificationKind,
  context: NotificationRouteContext = {},
): string {
  const def = getCanonicalNotification(kind);
  switch (def.entity) {
    case "order":
      return def.actionLabel.toLowerCase().includes("tracking")
        ? trackingHref(context)
        : orderHref(context);
    case "offer":
      if (def.kind === "buyer.offer_accepted") {
        if (context.productSlug && context.offerId) {
          return `/checkout/${encodeURIComponent(context.productSlug)}?offerId=${encodeURIComponent(context.offerId)}`;
        }
        // Legacy deep link — app/checkout/page.tsx resolves to slug + locked price.
        return context.offerId
          ? `/checkout?offerId=${encodeURIComponent(context.offerId)}`
          : "/inbox?tab=messages&filter=offers";
      }
      return offerHref(context);
    case "conversation":
      return conversationHref(context);
    case "product":
      return productHref(context);
    case "payout":
      return payoutHref(context);
    case "account":
      return def.control === "security" ? "/account/security" : "/account/settings";
    case "policy":
      return "/legal";
    default:
      return "/account/settings";
  }
}

export function resolveCanonicalActionLabel(
  kind: CanonicalNotificationKind,
): string {
  return getCanonicalNotification(kind).actionLabel;
}

export function listCanonicalKindsByAudience(
  audience: NotificationAudience,
): CanonicalNotificationKind[] {
  return CANONICAL_NOTIFICATION_CATALOG.filter((entry) => entry.audience === audience).map(
    (entry) => entry.kind,
  );
}

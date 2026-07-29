import type { DeliveryCarrier } from "@/lib/products/types";
import type { OrderStatus } from "@/lib/orders/types";
import {
  ordersV7ToneToBadgeVariant,
  resolveOrdersV7StatusFromStatus,
} from "@/lib/orders/orders-v7-status";
import { buildOrderConversationHref } from "@/lib/orders/order-conversation-href";

const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "In Progress",
  awaiting_shipment: "Awaiting Shipping",
  shipped: "In Progress",
  delivered: "Delivered",
  issue_open: "Dispute",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

/** Orders v7.0 Owner colour lock via shared tone mapping. */
export function getStatusBadgeVariant(
  status: OrderStatus,
): "default" | "primary" | "success" | "warning" | "danger" {
  const view = resolveOrdersV7StatusFromStatus(status);
  return ordersV7ToneToBadgeVariant(view.tone);
}

const TRACKING_BASE_URLS: Partial<Record<DeliveryCarrier, string>> = {
  "Royal Mail": "https://www.royalmail.com/track-your-item#/tracking-results/",
  Evri: "https://www.evri.com/track-a-parcel/",
  DPD: "https://www.dpd.co.uk/apps/tracking/?reference=",
  InPost: "https://inpost.co.uk/tracking/result?parcelCode=",
};

export function getTrackingUrl(carrier: DeliveryCarrier, trackingNumber: string): string {
  const base = TRACKING_BASE_URLS[carrier] ?? "https://www.google.com/search?q=";
  return `${base}${encodeURIComponent(trackingNumber)}`;
}

export function canTrackParcel(status: OrderStatus, trackingNumber?: string): boolean {
  return Boolean(trackingNumber) && (status === "shipped" || status === "delivered" || status === "completed");
}

export function canAddTracking(status: OrderStatus): boolean {
  return status === "awaiting_shipment";
}

export function canConfirmDelivery(status: OrderStatus, disputesDisabled: boolean): boolean {
  return status === "delivered" && !disputesDisabled;
}

export function isOrderClosed(order: { status: OrderStatus; disputesDisabled: boolean }): boolean {
  return order.status === "completed" || order.disputesDisabled;
}

export function getCounterpartyName(
  order: { buyer: { name: string }; seller: { name: string } },
  view: "buyer" | "seller",
): string {
  return view === "buyer" ? order.seller.name : order.buyer.name;
}

/**
 * Legacy name — never opens Order Details.
 * Always Conversation Hub (direct when conversationId known).
 */
export function getOrderDetailHref(orderId: string, view: "buyer" | "seller"): string {
  return getMessageHref(orderId, view);
}

/**
 * Order → Conversation Hub.
 * Prefer direct `/inbox/conversation/:id?order=` when conversationId is known.
 */
export function getMessageHref(
  orderId: string,
  view: "buyer" | "seller",
  conversationId?: string | null,
): string {
  void view;
  return buildOrderConversationHref({ orderId, conversationId });
}

/** Track parcel — Hub first; external carrier URL is secondary. */
export function getOrderHubTrackHref(
  orderId: string,
  conversationId?: string | null,
): string {
  return buildOrderConversationHref({
    orderId,
    conversationId,
    focus: "tracking",
  });
}

import type { DeliveryCarrier } from "@/lib/products/types";
import type { OrderStatus } from "@/lib/orders/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting Payment",
  awaiting_shipment: "Awaiting Shipment",
  shipped: "Shipped",
  delivered: "Delivered",
  issue_open: "Issue Open",
  completed: "Delivered",
  cancelled: "Cancelled",
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

export function getStatusBadgeVariant(
  status: OrderStatus,
): "default" | "primary" | "success" | "warning" | "danger" {
  switch (status) {
    case "awaiting_payment":
      return "warning";
    case "awaiting_shipment":
      return "default";
    case "shipped":
      return "primary";
    case "delivered":
    case "completed":
      return "success";
    case "issue_open":
      return "danger";
    case "cancelled":
      return "default";
    default:
      return "default";
  }
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

export function getOrderDetailHref(orderId: string, view: "buyer" | "seller"): string {
  return view === "buyer" ? `/orders/${orderId}` : `/seller/orders/${orderId}`;
}

export function getMessageHref(orderId: string, view: "buyer" | "seller"): string {
  const param = view === "buyer" ? "seller" : "buyer";
  return `/messages?order=${orderId}&with=${param}`;
}

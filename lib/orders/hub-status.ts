import { getBuyerOrderListRefundLabel } from "@/lib/orders/refund-status";
import type { Order, OrderStatus } from "@/lib/orders/types";

export type OrdersHubBadgeTone =
  | "delivered"
  | "shipping"
  | "processing"
  | "cancelled"
  | "completed";

export type OrdersHubBadge = {
  label: string;
  tone: OrdersHubBadgeTone;
};

const STATUS_BADGE: Record<OrderStatus, OrdersHubBadge> = {
  awaiting_payment: { label: "Processing", tone: "processing" },
  awaiting_shipment: { label: "Processing", tone: "processing" },
  shipped: { label: "Shipping", tone: "shipping" },
  delivered: { label: "Delivered", tone: "delivered" },
  issue_open: { label: "Processing", tone: "processing" },
  completed: { label: "Completed", tone: "completed" },
  cancelled: { label: "Cancelled", tone: "cancelled" },
};

export function getOrdersHubBadge(order: Order): OrdersHubBadge {
  const refundLabel = getBuyerOrderListRefundLabel(order);
  if (refundLabel === "Refunded") return { label: "Cancelled", tone: "cancelled" };
  if (refundLabel === "Refund in progress") return { label: "Processing", tone: "processing" };
  if (refundLabel === "Refund failed") return { label: "Processing", tone: "processing" };
  return STATUS_BADGE[order.status];
}

export function formatOrdersHubDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

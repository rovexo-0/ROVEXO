/**
 * Orders v7.0 — Owner Absolute Authority status colour lock.
 * Profile Master inheritance. Live order statuses only — no invented money.
 */

import { getBuyerOrderListRefundLabel } from "@/lib/orders/refund-status";
import type { Order, OrderStatus } from "@/lib/orders/types";

export const ORDERS_UI_VERSION = "v7.0" as const;
export const ORDERS_UI_DOM = "v7.0-orders-lock" as const;

/** Owner colour tones for Orders list + badges. */
export type OrdersV7Tone =
  | "green"
  | "purple"
  | "orange"
  | "red"
  | "yellow";

export type OrdersV7StatusView = {
  label: string;
  tone: OrdersV7Tone;
  cssClass: string;
};

/**
 * Completed / Delivered → GREEN
 * In Progress / Awaiting Shipping / Protection Hold → PURPLE
 * Refund → ORANGE
 * Cancelled → RED
 * Dispute → YELLOW
 *
 * Protection Hold = sold (`seller`) view while status is `delivered`
 * (buyer protection escrow before funds release / completed).
 */
export function resolveOrdersV7Status(
  order: Order,
  view: "buyer" | "seller" = "buyer",
): OrdersV7StatusView {
  const refundLabel = getBuyerOrderListRefundLabel(order);
  if (refundLabel === "Refunded" || refundLabel === "Refund in progress" || refundLabel === "Refund failed") {
    return {
      label: refundLabel === "Refunded" ? "Refund" : refundLabel,
      tone: "orange",
      cssClass: "orders-page__row--orange",
    };
  }

  if (view === "seller" && order.status === "delivered") {
    return {
      label: "Protection Hold",
      tone: "purple",
      cssClass: "orders-page__row--purple",
    };
  }

  return resolveOrdersV7StatusFromStatus(order.status);
}

export function resolveOrdersV7StatusFromStatus(status: OrderStatus): OrdersV7StatusView {
  switch (status) {
    case "completed":
      return { label: "Completed", tone: "green", cssClass: "orders-page__row--green" };
    case "delivered":
      return { label: "Delivered", tone: "green", cssClass: "orders-page__row--green" };
    case "awaiting_shipment":
      return { label: "Awaiting Shipping", tone: "purple", cssClass: "orders-page__row--purple" };
    case "shipped":
      return { label: "In Progress", tone: "purple", cssClass: "orders-page__row--purple" };
    case "awaiting_payment":
      return { label: "In Progress", tone: "purple", cssClass: "orders-page__row--purple" };
    case "issue_open":
      return { label: "Dispute", tone: "yellow", cssClass: "orders-page__row--yellow" };
    case "cancelled":
      return { label: "Cancelled", tone: "red", cssClass: "orders-page__row--red" };
    default:
      return { label: "In Progress", tone: "purple", cssClass: "orders-page__row--purple" };
  }
}

/** Map to shared Badge variants used on detail surfaces. */
export function ordersV7ToneToBadgeVariant(
  tone: OrdersV7Tone,
): "default" | "primary" | "success" | "warning" | "danger" {
  switch (tone) {
    case "green":
      return "success";
    case "purple":
      return "primary";
    case "orange":
      return "warning";
    case "red":
      return "danger";
    case "yellow":
      return "warning";
    default:
      return "default";
  }
}

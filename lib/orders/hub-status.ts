import { resolveOrdersV7Status } from "@/lib/orders/orders-v7-status";
import type { Order } from "@/lib/orders/types";

export type OrdersHubBadgeTone =
  | "delivered"
  | "shipping"
  | "processing"
  | "cancelled"
  | "completed"
  | "refund"
  | "dispute";

export type OrdersHubBadge = {
  label: string;
  tone: OrdersHubBadgeTone;
};

const TONE_MAP = {
  green: "completed",
  purple: "processing",
  orange: "refund",
  red: "cancelled",
  yellow: "dispute",
} as const satisfies Record<string, OrdersHubBadgeTone>;

/** Orders hub badge — delegates colour/label policy to Orders v7.0 lock. */
export function getOrdersHubBadge(
  order: Order,
  view: "buyer" | "seller" = "buyer",
): OrdersHubBadge {
  const resolved = resolveOrdersV7Status(order, view);
  return {
    label: resolved.label,
    tone: TONE_MAP[resolved.tone],
  };
}

export function formatOrdersHubDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

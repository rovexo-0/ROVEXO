import type { Order, OrderStatus } from "@/lib/orders/types";

export type OrdersHubTimelineStepId = "paid" | "packed" | "shipped" | "delivered";

export type OrdersHubTimelineStep = {
  id: OrdersHubTimelineStepId;
  label: string;
  state: "complete" | "current" | "future" | "cancelled";
  timestamp?: string;
};

const STEP_IDS: OrdersHubTimelineStepId[] = ["paid", "packed", "shipped", "delivered"];
const STEP_LABELS: Record<OrdersHubTimelineStepId, string> = {
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

function progressIndex(status: OrderStatus): number {
  switch (status) {
    case "cancelled":
      return -1;
    case "awaiting_payment":
      return 0;
    case "awaiting_shipment":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
    case "issue_open":
      return 3;
    case "completed":
      return 4;
    default:
      return 0;
  }
}

function stepTimestamp(order: Order, id: OrdersHubTimelineStepId): string | undefined {
  switch (id) {
    case "paid":
      return order.paidAt ?? order.createdAt;
    case "packed":
      return order.shippedAt ? order.paidAt ?? order.createdAt : undefined;
    case "shipped":
      return order.shippedAt;
    case "delivered":
      return order.deliveredAt ?? order.completedAt;
    default:
      return undefined;
  }
}

export function getOrdersHubTimeline(order: Order): OrdersHubTimelineStep[] {
  if (order.status === "cancelled") {
    return STEP_IDS.map((id) => ({
      id,
      label: STEP_LABELS[id],
      state: "cancelled" as const,
      timestamp: order.cancelledAt,
    }));
  }

  const progress = progressIndex(order.status);

  return STEP_IDS.map((id, index) => {
    let state: OrdersHubTimelineStep["state"] = "future";
    if (progress > index) state = "complete";
    else if (progress === index) state = "current";
    return {
      id,
      label: STEP_LABELS[id],
      state,
      timestamp: stepTimestamp(order, id),
    };
  });
}

/** 0–100 bar fill for progress track. */
export function getOrdersHubTimelineProgress(order: Order): number {
  if (order.status === "cancelled") return 0;
  const progress = progressIndex(order.status);
  if (progress <= 0) return 8;
  if (progress >= 4) return 100;
  return Math.min(100, (progress / 3) * 100);
}

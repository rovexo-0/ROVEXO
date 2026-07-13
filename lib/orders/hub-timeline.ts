import type { Order, OrderStatus } from "@/lib/orders/types";

export type OrdersHubTimelineStepId = "paid" | "packed" | "shipped" | "delivered";

export type OrdersHubTimelineStep = {
  id: OrdersHubTimelineStepId;
  label: string;
  state: "complete" | "current" | "future" | "cancelled";
};

const STEP_IDS: OrdersHubTimelineStepId[] = ["paid", "packed", "shipped", "delivered"];
const STEP_LABELS: Record<OrdersHubTimelineStepId, string> = {
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

/** Progress index: -1 cancelled/unpaid, 0..3 completed through step, 4 all done. */
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

export function getOrdersHubTimeline(order: Order): OrdersHubTimelineStep[] {
  if (order.status === "cancelled") {
    return STEP_IDS.map((id) => ({
      id,
      label: STEP_LABELS[id],
      state: "cancelled" as const,
    }));
  }

  const progress = progressIndex(order.status);

  return STEP_IDS.map((id, index) => {
    let state: OrdersHubTimelineStep["state"] = "future";
    if (progress > index) state = "complete";
    else if (progress === index) state = "current";
    return { id, label: STEP_LABELS[id], state };
  });
}

import type { DeliveryStage, Order, OrderStatus } from "@/lib/orders/types";

function stageIndex(id: DeliveryStage["id"]): number {
  return ["placed", "shipped", "delivered"].indexOf(id);
}

function statusProgress(status: OrderStatus): number {
  switch (status) {
    case "awaiting_payment":
      return -1;
    case "awaiting_shipment":
      return stageIndex("placed");
    case "shipped":
      return stageIndex("shipped");
    case "delivered":
    case "issue_open":
    case "completed":
      return stageIndex("delivered");
    default:
      return -1;
  }
}

export function getDeliveryStages(order: Order): DeliveryStage[] {
  const progress = statusProgress(order.status);

  if (progress < 0) {
    return [];
  }

  const stages: DeliveryStage["id"][] = ["placed", "shipped", "delivered"];
  const timestamps: Partial<Record<DeliveryStage["id"], string | undefined>> = {
    placed: order.paidAt ?? order.createdAt,
    shipped: order.shippedAt,
    delivered: order.deliveredAt ?? order.completedAt,
  };

  const labels: Record<DeliveryStage["id"], string> = {
    placed: "Awaiting Shipment",
    shipped: "Shipped",
    delivered: "Delivered",
  };

  return stages.map((id, index) => ({
    id,
    label: labels[id],
    timestamp: timestamps[id],
    done: index <= progress,
    current: index === progress,
  }));
}

// Re-export status helpers for backward compatibility
export {
  canConfirmDelivery,
  canTrackParcel,
  getOrderStatusLabel,
  isOrderClosed,
} from "@/lib/orders/status";

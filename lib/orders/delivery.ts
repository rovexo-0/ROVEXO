import type { DeliveryStage, Order, OrderStatus } from "@/lib/orders/types";

const STAGE_IDS: DeliveryStage["id"][] = ["placed", "shipped", "in_transit", "delivered"];

function stageIndex(id: DeliveryStage["id"]): number {
  return STAGE_IDS.indexOf(id);
}

/**
 * Progress from order + tracking fields only (no invented shipping states).
 * In Transit becomes current once the order is shipped and a tracking number exists.
 */
function statusProgress(order: Order): number {
  const status: OrderStatus = order.status;
  switch (status) {
    case "awaiting_payment":
    case "cancelled":
      return -1;
    case "awaiting_shipment":
      return stageIndex("placed");
    case "shipped":
      return order.trackingNumber?.trim()
        ? stageIndex("in_transit")
        : stageIndex("shipped");
    case "delivered":
    case "issue_open":
    case "completed":
      return stageIndex("delivered");
    default:
      return -1;
  }
}

export function getDeliveryStages(order: Order): DeliveryStage[] {
  const progress = statusProgress(order);

  if (progress < 0) {
    return [];
  }

  const timestamps: Partial<Record<DeliveryStage["id"], string | undefined>> = {
    placed: order.paidAt ?? order.createdAt,
    shipped: order.shippedAt,
    in_transit: order.shippedAt,
    delivered: order.deliveredAt ?? order.completedAt,
  };

  const labels: Record<DeliveryStage["id"], string> = {
    placed: "Awaiting Shipment",
    shipped: "Shipped",
    in_transit: "In Transit",
    delivered: "Delivered",
  };

  const descriptions: Partial<Record<DeliveryStage["id"], string>> = {
    placed: "Seller is preparing your item.",
  };

  return STAGE_IDS.map((id, index) => ({
    id,
    label: labels[id],
    description: descriptions[id],
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

import type { DeliveryStage, Order, OrderStatus } from "@/lib/orders/types";
import { isPersistedSellerCancellationReason } from "@/lib/orders/cancellation";

const STAGE_IDS = ["placed", "shipped", "in_transit", "delivered"] as const;
const SELLER_CANCELLED_STAGE_IDS = ["placed", "paid", "preparing", "cancelled"] as const;

function stageIndex(id: (typeof STAGE_IDS)[number]): number {
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
  if (order.status === "cancelled" && isPersistedSellerCancellationReason(order.cancellationReason)) {
    return SELLER_CANCELLED_STAGE_IDS.map((id, index) => ({
      id,
      label:
        id === "placed"
          ? "Order placed"
          : id === "paid"
            ? "Payment confirmed"
            : id === "preparing"
              ? "Preparing order"
              : "Cancelled by seller",
      description: id === "cancelled" ? `Reason: ${order.cancellationReason}` : undefined,
      timestamp:
        id === "placed"
          ? order.createdAt
          : id === "paid"
            ? order.paidAt
            : id === "cancelled"
              ? order.cancelledAt
              : order.paidAt,
      done: true,
      current: index === SELLER_CANCELLED_STAGE_IDS.length - 1,
    }));
  }

  const progress = statusProgress(order);

  if (progress < 0) {
    return [];
  }

  const timestamps: Partial<Record<(typeof STAGE_IDS)[number], string | undefined>> = {
    placed: order.paidAt ?? order.createdAt,
    shipped: order.shippedAt,
    in_transit: order.shippedAt,
    delivered: order.deliveredAt ?? order.completedAt,
  };

  const labels: Record<(typeof STAGE_IDS)[number], string> = {
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

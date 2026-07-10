import type { OrderStatus } from "@/lib/orders/types";
import type { ShippingStatus } from "@/lib/shipping/types";

/** Canonical cancellation reason stored on the order record. */
export const BUYER_CANCELLATION_REASON = "Buyer Cancelled";

const NON_CANCELLABLE_ORDER_STATUSES = new Set<OrderStatus>([
  "shipped",
  "delivered",
  "issue_open",
  "completed",
  "cancelled",
]);

const SHIPMENT_STARTED_STATUSES = new Set<ShippingStatus>([
  "collected",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
]);

export type BuyerCancellationEligibility = {
  allowed: boolean;
  reason?: string;
};

export function isBuyerCancellableOrderStatus(status: OrderStatus): boolean {
  return status === "awaiting_payment" || status === "awaiting_shipment";
}

export function evaluateBuyerCancellationEligibility(input: {
  status: OrderStatus;
  shippingRecordStatus: ShippingStatus | null;
  parcelStatuses: ShippingStatus[];
  hasReadyLabel: boolean;
}): BuyerCancellationEligibility {
  if (input.status === "cancelled") {
    return { allowed: false, reason: "This order has already been cancelled." };
  }

  if (NON_CANCELLABLE_ORDER_STATUSES.has(input.status)) {
    return { allowed: false, reason: "This order can no longer be cancelled." };
  }

  if (!isBuyerCancellableOrderStatus(input.status)) {
    return { allowed: false, reason: "This order can no longer be cancelled." };
  }

  if (input.hasReadyLabel) {
    return {
      allowed: false,
      reason: "A shipping label has already been generated for this order.",
    };
  }

  if (
    input.shippingRecordStatus &&
    SHIPMENT_STARTED_STATUSES.has(input.shippingRecordStatus)
  ) {
    return {
      allowed: false,
      reason: "Shipment has already started and cannot be cancelled.",
    };
  }

  if (input.parcelStatuses.some((status) => SHIPMENT_STARTED_STATUSES.has(status))) {
    return {
      allowed: false,
      reason: "Shipment has already been collected and cannot be cancelled.",
    };
  }

  return { allowed: true };
}

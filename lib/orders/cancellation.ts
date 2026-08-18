import type { OrderStatus } from "@/lib/orders/types";
import type { ShippingStatus } from "@/lib/shipping/types";

/** Canonical cancellation reason stored on the order record (fallback / legacy). */
export const BUYER_CANCELLATION_REASON = "Buyer Cancelled";

/**
 * Canonical buyer cancellation reasons (UI + API).
 * Stored value = label. Do not invent a parallel reason system.
 */
export const BUYER_CANCELLATION_REASON_OPTIONS = [
  { id: "changed_mind", label: "I changed my mind" },
  { id: "ordered_by_mistake", label: "Ordered by mistake" },
  { id: "found_another_item", label: "Found another item" },
  { id: "seller_too_long", label: "Seller is taking too long to ship" },
  { id: "other", label: "Other reason" },
] as const;

export type BuyerCancellationReasonId =
  (typeof BUYER_CANCELLATION_REASON_OPTIONS)[number]["id"];

export function resolveBuyerCancellationReason(
  reasonId: string | null | undefined,
): string {
  const match = BUYER_CANCELLATION_REASON_OPTIONS.find((option) => option.id === reasonId);
  return match?.label ?? BUYER_CANCELLATION_REASON;
}

/**
 * Canonical seller cancellation reasons (UI + API).
 * Stored value = label. Do not invent a parallel reason system.
 */
export const SELLER_CANCELLATION_REASON_OPTIONS = [
  { id: "out_of_stock", label: "Out of stock" },
  { id: "item_damaged", label: "Item damaged" },
  { id: "item_no_longer_available", label: "Item no longer available" },
  { id: "unable_to_proceed", label: "Unable to proceed" },
  { id: "other", label: "Other" },
] as const;

export type SellerCancellationReasonId =
  (typeof SELLER_CANCELLATION_REASON_OPTIONS)[number]["id"];

export function resolveSellerCancellationReason(
  reasonId: string | null | undefined,
): string | null {
  const match = SELLER_CANCELLATION_REASON_OPTIONS.find((option) => option.id === reasonId);
  return match?.label ?? null;
}

export function isPersistedSellerCancellationReason(
  reason: string | null | undefined,
): boolean {
  if (!reason) return false;
  return SELLER_CANCELLATION_REASON_OPTIONS.some((option) => option.label === reason);
}

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

const SHIPPING_STATUS_RANK: Record<ShippingStatus, number> = {
  preparing: 0,
  collected: 1,
  in_transit: 2,
  out_for_delivery: 3,
  delivered: 4,
  returned: 4,
  lost: 4,
  cancelled: -1,
  failed: -1,
};

/** Carrier handover SSOT: shipping_records.status >= collected. */
export function isShippingStatusAtLeastCollected(
  status: ShippingStatus | null | undefined,
): boolean {
  if (!status) return false;
  return SHIPPING_STATUS_RANK[status] >= SHIPPING_STATUS_RANK.collected;
}

export function isCarrierHandoverConfirmed(input: {
  shippingRecordStatus: ShippingStatus | null;
  parcelStatuses?: ShippingStatus[];
}): boolean {
  if (isShippingStatusAtLeastCollected(input.shippingRecordStatus)) {
    return true;
  }
  return (input.parcelStatuses ?? []).some((status) => isShippingStatusAtLeastCollected(status));
}

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

export type SellerCancellationEligibility = {
  allowed: boolean;
  reason?: string;
};

export function isSellerCancellableOrderStatus(status: OrderStatus): boolean {
  return status === "awaiting_shipment";
}

export function evaluateSellerCancellationEligibility(input: {
  status: OrderStatus;
  shippingRecordStatus: ShippingStatus | null;
  parcelStatuses: ShippingStatus[];
  alreadyRefunded?: boolean;
}): SellerCancellationEligibility {
  if (input.status === "cancelled") {
    return { allowed: false, reason: "This order has already been cancelled." };
  }

  if (input.status === "completed") {
    return { allowed: false, reason: "This order is already completed." };
  }

  if (input.status === "delivered") {
    return { allowed: false, reason: "This order has already been delivered." };
  }

  if (input.status === "shipped") {
    return { allowed: false, reason: "This order has already been shipped." };
  }

  if (!isSellerCancellableOrderStatus(input.status)) {
    return { allowed: false, reason: "This order can no longer be cancelled." };
  }

  if (input.alreadyRefunded) {
    return { allowed: false, reason: "This order has already been refunded." };
  }

  if (
    isCarrierHandoverConfirmed({
      shippingRecordStatus: input.shippingRecordStatus,
      parcelStatuses: input.parcelStatuses,
    })
  ) {
    return {
      allowed: false,
      reason: "The carrier has already collected this parcel.",
    };
  }

  return { allowed: true };
}

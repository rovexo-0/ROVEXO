import type { Order, OrderStatus } from "@/lib/orders/types";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { PAYMENTS_ENGINE_TIMELINE_EVENTS } from "@/lib/payments-engine/registry";
import type {
  PaymentsEngineFilterId,
  PaymentsEnginePaymentMethod,
  PaymentsEnginePaymentStatus,
  PaymentsEngineProtectionStatus,
  PaymentsEngineProviderId,
  PaymentsEngineSummary,
  PaymentsEngineTimelineEvent,
  PaymentsEngineTimelineEventId,
} from "@/lib/payments-engine/types";

export function mapOrderStatusToPaymentStatus(status: OrderStatus): PaymentsEnginePaymentStatus {
  const map: Record<OrderStatus, PaymentsEnginePaymentStatus> = {
    awaiting_payment: "authorization-pending",
    awaiting_shipment: "protected",
    shipped: "captured",
    delivered: "protected",
    issue_open: "disputed",
    completed: "released",
    cancelled: "cancelled",
  };
  return map[status];
}

export function mapOrderStatusToFilters(status: OrderStatus): PaymentsEngineFilterId[] {
  const map: Record<OrderStatus, PaymentsEngineFilterId[]> = {
    awaiting_payment: ["pending"],
    awaiting_shipment: ["captured", "protected"],
    shipped: ["captured", "protected"],
    delivered: ["protected"],
    issue_open: ["disputed"],
    completed: ["completed"],
    cancelled: ["cancelled"],
  };
  return map[status];
}

export function mapProtectionStatus(status: OrderStatus, protectedFee: number): PaymentsEngineProtectionStatus {
  if (protectedFee <= 0) return "protected";
  if (status === "issue_open") return "disputed";
  if (status === "completed") return "released";
  if (["awaiting_shipment", "shipped", "delivered"].includes(status)) return "active";
  return "protected";
}

export function mapOrderToPaymentSummary(order: Order, currency = "GBP"): PaymentsEngineSummary {
  const { platformFee } = calculateSellerNetAmount(order.totals.itemPrice);

  return {
    paymentId: order.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: mapOrderStatusToPaymentStatus(order.status),
    provider: "stripe-checkout",
    method: "credit-card",
    currency,
    subtotal: order.totals.itemPrice,
    shipping: order.totals.delivery,
    buyerProtectionFee: order.totals.protectedFee,
    platformFee,
    discount: 0,
    tax: 0,
    grandTotal: order.totals.total,
    buyerName: order.buyer.name,
    sellerName: order.seller.name,
    productTitle: order.product.title,
    createdAt: order.createdAt,
    completedAt: order.completedAt,
    protectionStatus: mapProtectionStatus(order.status, order.totals.protectedFee),
    filterTags: mapOrderStatusToFilters(order.status),
  };
}

type TimelineInput = {
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
};

function currentTimelineStage(input: TimelineInput): PaymentsEngineTimelineEventId {
  if (input.status === "cancelled") return "checkout-started";
  if (input.status === "awaiting_payment") return "checkout-started";
  if (input.status === "awaiting_shipment") return "protection-hold";
  if (input.status === "shipped") return "shipping-started";
  if (input.status === "delivered") return "delivered";
  if (input.status === "issue_open") return "protection-hold";
  if (input.status === "completed") return "completed";
  return "checkout-started";
}

const TIMELINE_ORDER: PaymentsEngineTimelineEventId[] = PAYMENTS_ENGINE_TIMELINE_EVENTS.map((e) => e.id);

export function buildPaymentTimeline(input: TimelineInput): PaymentsEngineTimelineEvent[] {
  const current = currentTimelineStage(input);
  const currentIndex = TIMELINE_ORDER.indexOf(current);

  const timestamps: Partial<Record<PaymentsEngineTimelineEventId, string | undefined>> = {
    "checkout-started": input.createdAt,
    authorization: input.paidAt,
    verification: input.paidAt,
    capture: input.paidAt,
    "protection-hold": input.paidAt,
    "shipping-started": input.shippedAt,
    delivered: input.deliveredAt,
    "buyer-confirmed": input.deliveredAt,
    "funds-released": input.completedAt,
    completed: input.completedAt,
  };

  return PAYMENTS_ENGINE_TIMELINE_EVENTS.map((event) => {
    const index = TIMELINE_ORDER.indexOf(event.id);
    return {
      id: event.id,
      label: event.label,
      timestamp: timestamps[event.id],
      done: index <= currentIndex,
      current: event.id === current,
    };
  });
}

export function matchesSummaryFilter(status: PaymentsEnginePaymentStatus, filter: PaymentsEngineFilterId): boolean {
  if (filter === "pending" && ["checkout-started", "authorization-pending", "authorized", "verification-pending"].includes(status)) return true;
  if (filter === "authorized" && status === "authorized") return true;
  if (filter === "captured" && status === "captured") return true;
  if (filter === "protected" && ["protected", "captured"].includes(status)) return true;
  if (filter === "completed" && ["released", "verified", "resolved"].includes(status)) return true;
  if (filter === "failed" && status === "failed") return true;
  if (filter === "refunded" && ["refunded", "partially-refunded", "refund-pending"].includes(status)) return true;
  if (filter === "cancelled" && status === "cancelled") return true;
  if (filter === "disputed" && status === "disputed") return true;
  return false;
}

export function matchesSearch(
  query: string,
  fields: { orderNumber?: string; productTitle?: string; buyerName?: string; sellerName?: string },
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [fields.orderNumber, fields.productTitle, fields.buyerName, fields.sellerName]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}

export function getPaymentDocuments(order: Order): { id: string; label: string; available: boolean }[] {
  return [
    { id: "receipt", label: "Receipt", available: Boolean(order.paidAt) },
    { id: "invoice", label: "Invoice", available: Boolean(order.paidAt) },
    { id: "summary", label: "Transaction Summary", available: Boolean(order.paidAt) },
    { id: "confirmation", label: "Payment Confirmation", available: Boolean(order.paidAt) },
    { id: "refund-receipt", label: "Refund Receipt", available: order.status === "cancelled" },
  ];
}

export const DEFAULT_PAYMENT_METHOD: PaymentsEnginePaymentMethod = "credit-card";
export const DEFAULT_PROVIDER: PaymentsEngineProviderId = "stripe-checkout";

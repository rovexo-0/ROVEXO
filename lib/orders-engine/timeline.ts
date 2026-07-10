import type { OrderStatus } from "@/lib/orders/types";
import { ORDERS_ENGINE_TIMELINE_EVENTS } from "@/lib/orders-engine/registry";
import type {
  OrdersEngineFilterId,
  OrdersEngineLifecycleStage,
  OrdersEngineProtectionStatus,
  OrdersEngineTimelineEvent,
  OrdersEngineTimelineEventId,
  OrdersEngineWalletStatus,
} from "@/lib/orders-engine/types";

export function mapOrderStatusToLifecycle(status: OrderStatus): OrdersEngineLifecycleStage {
  const map: Record<OrderStatus, OrdersEngineLifecycleStage> = {
    awaiting_payment: "payment-pending",
    awaiting_shipment: "order-created",
    shipped: "in-transit",
    delivered: "buyer-confirmation-pending",
    issue_open: "disputed",
    completed: "completed",
    cancelled: "cancelled",
  };
  return map[status];
}

export function mapOrderStatusToFilters(status: OrderStatus): OrdersEngineFilterId[] {
  const map: Record<OrderStatus, OrdersEngineFilterId[]> = {
    awaiting_payment: ["pending"],
    awaiting_shipment: ["paid", "processing"],
    shipped: ["shipped"],
    delivered: ["delivered"],
    issue_open: ["disputed"],
    completed: ["completed"],
    cancelled: ["cancelled"],
  };
  return map[status];
}

export function mapProtectionStatus(status: OrderStatus, platformFee: number): OrdersEngineProtectionStatus {
  if (platformFee <= 0) return "protected";
  if (status === "issue_open") return "disputed";
  if (status === "completed") return "released";
  if (status === "delivered") return "waiting-confirmation";
  if (["awaiting_shipment", "shipped"].includes(status)) return "active";
  return "protected";
}

export function mapWalletStatus(status: OrderStatus): OrdersEngineWalletStatus {
  if (status === "completed") return "withdraw-eligible";
  if (status === "delivered") return "protected";
  if (status === "shipped") return "pending";
  if (status === "awaiting_shipment") return "pending";
  return "pending";
}

type TimelineInput = {
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  hasTracking?: boolean;
};

function currentTimelineStage(input: TimelineInput): OrdersEngineTimelineEventId {
  if (input.status === "cancelled") return input.refundedAt ? "refunded" : "cancelled";
  if (input.status === "issue_open") return "disputed";
  if (input.status === "completed") return "completed";
  if (input.status === "delivered") return "confirmed";
  if (input.status === "shipped") return input.hasTracking ? "tracking-updated" : "dispatched";
  if (input.status === "awaiting_shipment") return "paid";
  if (input.status === "awaiting_payment") return "created";
  return "created";
}

const TIMELINE_ORDER: OrdersEngineTimelineEventId[] = ORDERS_ENGINE_TIMELINE_EVENTS.map((e) => e.id);

export function buildOrderTimeline(input: TimelineInput): OrdersEngineTimelineEvent[] {
  const current = currentTimelineStage(input);
  const currentIndex = TIMELINE_ORDER.indexOf(current);
  const isCancelledOrder = input.status === "cancelled";

  const timestamps: Partial<Record<OrdersEngineTimelineEventId, string | undefined>> = {
    created: input.createdAt,
    paid: input.paidAt,
    dispatched: input.shippedAt,
    "tracking-updated": input.hasTracking ? input.shippedAt : undefined,
    delivered: input.deliveredAt,
    confirmed: input.deliveredAt,
    completed: input.completedAt,
    cancelled: input.cancelledAt,
    refunded: input.refundedAt ?? input.cancelledAt,
  };

  function isEventDone(eventId: OrdersEngineTimelineEventId, index: number): boolean {
    if (isCancelledOrder) {
      if (eventId === "cancelled") return Boolean(input.cancelledAt);
      if (eventId === "refunded") return Boolean(input.refundedAt);
      if (eventId === "paid") return Boolean(input.paidAt);
      if (eventId === "created") return true;
      return false;
    }
    return index <= currentIndex;
  }

  return ORDERS_ENGINE_TIMELINE_EVENTS.map((event) => {
    const index = TIMELINE_ORDER.indexOf(event.id);
    return {
      id: event.id,
      label: event.label,
      timestamp: timestamps[event.id],
      done: isEventDone(event.id, index),
      current: event.id === current,
    };
  });
}

export function matchesFilter(status: OrderStatus, filter: OrdersEngineFilterId): boolean {
  return mapOrderStatusToFilters(status).includes(filter);
}

export function matchesSearch(query: string, fields: { orderNumber: string; productTitle: string; trackingNumber?: string; buyerName?: string; sellerName?: string }): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return true;
  return [fields.orderNumber, fields.productTitle, fields.trackingNumber, fields.buyerName, fields.sellerName]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}

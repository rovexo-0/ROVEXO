import type { Order } from "@/lib/orders/types";

export type OrderRefundStatus =
  | "none"
  | "cancellation_requested"
  | "initiated"
  | "processing"
  | "completed"
  | "failed";

export type RefundStatusBadgeTone = "grey" | "blue" | "orange" | "green" | "red";

export type OrderRefundView = {
  status: OrderRefundStatus;
  badgeLabel: string;
  badgeTone: RefundStatusBadgeTone;
  statusEmoji: string;
  amount: number;
  reference?: string;
  refundId?: string;
  initiatedAt?: string;
  completedAt?: string;
  paymentMethod: string;
  estimatedArrival?: string;
  lastUpdated?: string;
  failureReason?: string;
  bankProcessingNote: string;
};

const BANK_PROCESSING_NOTE =
  "Most refunds arrive within 3–5 business days. Some banks may take up to 10 business days.";

export function formatRefundReference(refundId: string): string {
  const token = refundId.replace(/^re_/, "").replace(/^dev-refund-/, "").slice(-8).toUpperCase();
  return `RF-${token.padStart(8, "0").slice(-8)}`;
}

export function estimateRefundArrival(fromIso: string): string {
  const date = new Date(fromIso);
  date.setDate(date.getDate() + 5);
  return date.toISOString();
}

export function mapStripeRefundStatus(status: string | null | undefined): OrderRefundStatus {
  switch (status) {
    case "succeeded":
      return "completed";
    case "pending":
      return "processing";
    case "failed":
    case "canceled":
      return "failed";
    case "requires_action":
      return "processing";
    default:
      return "initiated";
  }
}

export function getRefundBadge(status: OrderRefundStatus): {
  label: string;
  tone: RefundStatusBadgeTone;
  emoji: string;
} {
  switch (status) {
    case "cancellation_requested":
      return { label: "Pending", tone: "grey", emoji: "⚪" };
    case "initiated":
      return { label: "Refund initiated", tone: "blue", emoji: "🔵" };
    case "processing":
      return { label: "Refund in progress", tone: "orange", emoji: "🟡" };
    case "completed":
      return { label: "Refunded", tone: "green", emoji: "🟢" };
    case "failed":
      return { label: "Failed", tone: "red", emoji: "🔴" };
    default:
      return { label: "Pending", tone: "grey", emoji: "⚪" };
  }
}

export function buildOrderRefundView(order: Order): OrderRefundView | null {
  const status = order.refundStatus ?? "none";
  if (status === "none" && !order.stripeRefundId && !order.refundedAt) {
    return null;
  }

  const effectiveStatus =
    status === "none" && order.refundedAt ? "completed" : status;
  const badge = getRefundBadge(effectiveStatus);
  const amount = order.refundedAmount ?? order.totals.total;
  const initiatedAt = order.refundCreatedAt ?? order.cancelledAt;
  const completedAt = order.refundCompletedAt ?? order.refundedAt;

  return {
    status: effectiveStatus,
    badgeLabel: badge.label,
    badgeTone: badge.tone,
    statusEmoji: badge.emoji,
    amount,
    reference: order.refundReference ?? (order.stripeRefundId ? formatRefundReference(order.stripeRefundId) : undefined),
    refundId: order.stripeRefundId,
    initiatedAt,
    completedAt,
    paymentMethod: order.refundPaymentMethod ?? "Original payment method",
    estimatedArrival: order.refundEstimatedArrival,
    lastUpdated: order.refundLastUpdated,
    failureReason: order.refundFailureReason,
    bankProcessingNote: BANK_PROCESSING_NOTE,
  };
}

export function getBuyerOrderListRefundLabel(order: Order): string | null {
  const refund = buildOrderRefundView(order);
  if (!refund) return null;

  if (refund.status === "completed") return "Refunded";
  if (refund.status === "failed") return "Refund failed";
  if (["cancellation_requested", "initiated", "processing"].includes(refund.status)) {
    return "Refund in progress";
  }
  return null;
}

export function formatRefundDateTime(value?: string): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

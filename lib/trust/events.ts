import { TRUST_EVENT_DELTAS, type TrustEventKey } from "@/lib/trust/constants";
import { applyTrustImpact, recalculateTrustScore } from "@/lib/trust/service";
import { detectOrderTrustFraud, detectReviewFraud } from "@/lib/trust/anti-fraud";
import {
  onSellerDispatch,
  onSellerOrderCancelled,
  onSellerOrderCompleted,
  onSellerOrderRefunded,
  onSellerReview,
  onSellerValidatedReport,
} from "@/lib/seller-performance/events";

export async function onOrderCompleted(input: {
  orderId: string;
  buyerId: string;
  sellerId: string;
}): Promise<void> {
  const fraud = await detectOrderTrustFraud(input);
  if (fraud.blocked) {
    await applyTrustImpact({
      userId: input.sellerId,
      eventType: "fraud_detected",
      delta: TRUST_EVENT_DELTAS.fraud_detected,
      idempotencyKey: `fraud:order:${input.orderId}`,
      metadata: { orderId: input.orderId, reason: fraud.reason },
    });
    return;
  }

  await Promise.all([
    applyTrustImpact({
      userId: input.sellerId,
      eventType: "order_completed_seller",
      delta: TRUST_EVENT_DELTAS.order_completed_seller,
      idempotencyKey: `order:completed:seller:${input.orderId}`,
      metadata: { orderId: input.orderId },
    }),
    applyTrustImpact({
      userId: input.buyerId,
      eventType: "order_completed_buyer",
      delta: TRUST_EVENT_DELTAS.order_completed_buyer,
      idempotencyKey: `order:completed:buyer:${input.orderId}`,
      metadata: { orderId: input.orderId },
    }),
  ]);

  void onSellerOrderCompleted({
    orderId: input.orderId,
    sellerId: input.sellerId,
    buyerId: input.buyerId,
  });
}

export async function onOrderCancelled(input: {
  orderId: string;
  buyerId: string;
  sellerId: string;
  initiatedBy: "buyer" | "seller" | "system";
}): Promise<void> {
  const sellerDelta =
    input.initiatedBy === "seller"
      ? TRUST_EVENT_DELTAS.order_cancelled_seller
      : TRUST_EVENT_DELTAS.order_cancelled_buyer;

  await Promise.all([
    applyTrustImpact({
      userId: input.sellerId,
      eventType: "order_cancelled_seller",
      delta: sellerDelta,
      idempotencyKey: `order:cancelled:seller:${input.orderId}`,
      metadata: { orderId: input.orderId, initiatedBy: input.initiatedBy },
    }),
    applyTrustImpact({
      userId: input.buyerId,
      eventType: "order_cancelled_buyer",
      delta: TRUST_EVENT_DELTAS.order_cancelled_buyer,
      idempotencyKey: `order:cancelled:buyer:${input.orderId}`,
      metadata: { orderId: input.orderId, initiatedBy: input.initiatedBy },
    }),
  ]);

  void onSellerOrderCancelled({ orderId: input.orderId, sellerId: input.sellerId });
}

export async function onOrderRefunded(input: {
  orderId: string;
  buyerId: string;
  sellerId: string;
  partial?: boolean;
}): Promise<void> {
  const sellerEvent = input.partial ? "order_refunded_partial_seller" : "order_refunded_seller";
  const buyerEvent = input.partial ? "order_refunded_partial_buyer" : "order_refunded_buyer";
  const sellerDelta = TRUST_EVENT_DELTAS[sellerEvent];
  const buyerDelta = TRUST_EVENT_DELTAS[buyerEvent];

  await Promise.all([
    applyTrustImpact({
      userId: input.sellerId,
      eventType: sellerEvent,
      delta: sellerDelta,
      idempotencyKey: `order:refunded:seller:${input.orderId}${input.partial ? ":partial" : ""}`,
      metadata: { orderId: input.orderId, partial: Boolean(input.partial) },
    }),
    applyTrustImpact({
      userId: input.buyerId,
      eventType: buyerEvent,
      delta: buyerDelta,
      idempotencyKey: `order:refunded:buyer:${input.orderId}${input.partial ? ":partial" : ""}`,
      metadata: { orderId: input.orderId, partial: Boolean(input.partial) },
    }),
  ]);

  void onSellerOrderRefunded({ orderId: input.orderId, sellerId: input.sellerId });
}

export async function onShipmentDelivered(input: {
  orderId: string;
  sellerId: string;
  onTime: boolean;
}): Promise<void> {
  const eventType: TrustEventKey = input.onTime ? "on_time_shipment" : "late_shipment";
  await applyTrustImpact({
    userId: input.sellerId,
    eventType,
    delta: TRUST_EVENT_DELTAS[eventType],
    idempotencyKey: `shipment:${input.onTime ? "on-time" : "late"}:${input.orderId}`,
    metadata: { orderId: input.orderId, onTime: input.onTime },
  });

  void onSellerDispatch({
    orderId: input.orderId,
    sellerId: input.sellerId,
    late: !input.onTime,
  });
}

export async function onChargeback(input: {
  orderId: string;
  sellerId: string;
  disputeId: string;
}): Promise<void> {
  await applyTrustImpact({
    userId: input.sellerId,
    eventType: "chargeback",
    delta: TRUST_EVENT_DELTAS.chargeback,
    idempotencyKey: `chargeback:${input.disputeId}`,
    metadata: { orderId: input.orderId, disputeId: input.disputeId },
    reason: "Payment chargeback filed",
  });
}

export async function onAccountSuspended(input: {
  userId: string;
  reason: string;
  sourceId: string;
}): Promise<void> {
  await applyTrustImpact({
    userId: input.userId,
    eventType: "suspension",
    delta: TRUST_EVENT_DELTAS.suspension,
    idempotencyKey: `suspension:${input.sourceId}`,
    metadata: { reason: input.reason, sourceId: input.sourceId },
    reason: input.reason,
  });
}

export async function onReviewSubmitted(input: {
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
}): Promise<void> {
  const fraud = await detectReviewFraud(input);
  if (fraud.blocked) {
    await applyTrustImpact({
      userId: input.reviewerId,
      eventType: "fraud_detected",
      delta: TRUST_EVENT_DELTAS.fraud_detected,
      idempotencyKey: `fraud:review:${input.orderId}`,
      metadata: { orderId: input.orderId, reason: fraud.reason },
    });
    return;
  }

  const eventType: TrustEventKey = input.rating >= 4 ? "review_positive" : input.rating <= 2 ? "review_negative" : "review_positive";
  const delta = TRUST_EVENT_DELTAS[eventType] * (input.rating <= 2 ? 1 : input.rating >= 5 ? 1 : 0.5);

  await applyTrustImpact({
    userId: input.revieweeId,
    eventType,
    delta: Math.round(delta),
    idempotencyKey: `review:${input.orderId}`,
    metadata: { orderId: input.orderId, rating: input.rating },
  });

  void onSellerReview({
    orderId: input.orderId,
    revieweeId: input.revieweeId,
    reviewerId: input.reviewerId,
    rating: input.rating,
  });
}

export async function onModerationDecision(input: {
  sellerId: string;
  decision: "approved" | "warning" | "blocked";
  queueId: string;
}): Promise<void> {
  if (input.decision === "approved") return;

  const eventType: TrustEventKey =
    input.decision === "blocked" ? "suspension" : "moderation_warning";

  await applyTrustImpact({
    userId: input.sellerId,
    eventType,
    delta: TRUST_EVENT_DELTAS[eventType],
    idempotencyKey: `moderation:${input.queueId}:${input.decision}`,
    metadata: { queueId: input.queueId, decision: input.decision },
    reason:
      input.decision === "blocked"
        ? "Listing blocked by moderation"
        : "Moderation warning issued",
  });
}

export async function onProtectionResolved(input: {
  caseId: string;
  buyerId: string;
  sellerId: string;
  outcome: string;
}): Promise<void> {
  const sellerLost = ["refund_full", "refund_partial", "buyer_favour"].includes(input.outcome);
  const buyerLost = ["seller_favour", "return_rejected", "no_action"].includes(input.outcome);

  if (sellerLost) {
    const partial = input.outcome === "refund_partial";
    await applyTrustImpact({
      userId: input.sellerId,
      eventType: partial ? "order_refunded_partial_seller" : "dispute_lost_seller",
      delta: partial
        ? TRUST_EVENT_DELTAS.order_refunded_partial_seller
        : TRUST_EVENT_DELTAS.dispute_lost_seller,
      idempotencyKey: `protection:seller-lost:${input.caseId}`,
      metadata: { caseId: input.caseId, outcome: input.outcome },
      reason: partial ? "Partial refund issued" : "Dispute lost",
    });
  }

  if (buyerLost) {
    await applyTrustImpact({
      userId: input.buyerId,
      eventType: "dispute_lost_buyer",
      delta: TRUST_EVENT_DELTAS.dispute_lost_buyer,
      idempotencyKey: `protection:buyer-lost:${input.caseId}`,
      metadata: { caseId: input.caseId, outcome: input.outcome },
    });
  }

  if (input.outcome === "return_accepted") {
    await applyTrustImpact({
      userId: input.sellerId,
      eventType: "dispute_won_seller",
      delta: TRUST_EVENT_DELTAS.dispute_won_seller,
      idempotencyKey: `protection:return-accepted:${input.caseId}`,
      metadata: { caseId: input.caseId, outcome: input.outcome },
    });
  }
}

export async function onContentReportTargeted(input: {
  targetUserId: string;
  reportId: string;
}): Promise<void> {
  await applyTrustImpact({
    userId: input.targetUserId,
    eventType: "report_received",
    delta: TRUST_EVENT_DELTAS.report_received,
    idempotencyKey: `report:${input.reportId}`,
    metadata: { reportId: input.reportId },
  });

  void onSellerValidatedReport({
    sellerId: input.targetUserId,
    reportId: input.reportId,
  });
}

export { recalculateTrustScore };

import "server-only";

/**
 * ROVEXO Commerce Engine v1.0 — the single financial authority. *
 * Phase 1 (foundation): this module establishes the canonical authority surface
 * and the immutable ledger/audit primitives. Its settlement facade DELEGATES to
 * the existing, production wallet operations (lib/wallet/sales.ts) with NO change
 * to money-movement behavior, while additionally writing the escrow ledger and
 * audit trail. Live callers are migrated onto this facade in Phase 2.
 *
 * ARCHITECTURE RULE: no other module may modify wallet / escrow / refund /
 * shipping-payment / seller balance directly. Every financial operation must
 * pass through the Commerce Engine.
 */

import {
  creditSellerForOrder as walletCreditSellerForOrder,
  refundSellerForOrder as walletRefundSellerForOrder,
  calculateSellerNetAmount,
} from "@/lib/wallet/sales";
import { recordCommerceAudit } from "@/lib/commerce-engine/audit";
import { getOrderLedger, recordEscrowEvent, recordRefundEvent } from "@/lib/commerce-engine/ledger";
import {
  openEscrowForOrder,
  onOrderDelivered,
  holdForClaim,
  releaseHoldForClaim,
} from "@/lib/commerce-engine/escrow";
import { releaseEligibleOrders, releaseOrderNow } from "@/lib/commerce-engine/settlement";
import {
  reserveShippingForOrder,
  debitShippingReserveForLabel,
} from "@/lib/commerce-engine/shipping-reserve";
import {
  getOrderEscrowState,
  getSellerCommerceSummary,
  getAdminEscrowOverview,
} from "@/lib/commerce-engine/read-model";
import { emitCommerceEvent } from "@/lib/commerce-engine/events";

export type CreditSellerInput = {
  orderId: string;
  orderNumber: string;
  sellerId: string;
  productTitle: string;
  productImageUrl: string;
  itemPrice: number;
  stripePaymentIntentId?: string | null;
  correlationId?: string | null;
};

/**
 * Credit a seller for a completed order (escrow: money enters Pending).
 * Delegates to the existing wallet operation, then records the escrow ledger
 * entry + audit trail. Behavior of the underlying money movement is unchanged.
 */
async function creditSeller(input: CreditSellerInput): Promise<void> {
  await walletCreditSellerForOrder({
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    sellerId: input.sellerId,
    productTitle: input.productTitle,
    productImageUrl: input.productImageUrl,
    itemPrice: input.itemPrice,
    stripePaymentIntentId: input.stripePaymentIntentId,
  });

  const { platformFee, sellerAmount } = calculateSellerNetAmount(input.itemPrice);

  await recordEscrowEvent({
    orderId: input.orderId,
    sellerId: input.sellerId,
    eventType: "hold_created",
    toState: "pending",
    amount: sellerAmount,
    reason: "order_settlement",
    correlationId: input.correlationId ?? null,
    metadata: { platformFee, orderNumber: input.orderNumber },
  });

  await recordCommerceAudit({
    event: "escrow.credit_seller",
    orderId: input.orderId,
    userId: input.sellerId,
    rule: "credit_on_settlement",
    result: "pending",
    amount: sellerAmount,
    correlationId: input.correlationId ?? null,
    metadata: { platformFee, orderNumber: input.orderNumber },
  });
}

export type RefundSellerInput = {
  orderId: string;
  sellerId: string;
  buyerId?: string | null;
  refundType?: "full" | "partial" | "shipping";
  amount?: number;
  stripeRefundId?: string | null;
  reason?: string | null;
  actorId?: string | null;
  correlationId?: string | null;
};

/**
 * Reverse a seller's escrowed balance for a refunded order.
 * Delegates to the existing wallet operation, then records refund ledger + audit.
 */
async function refundSeller(input: RefundSellerInput): Promise<void> {
  await walletRefundSellerForOrder(input.orderId, input.sellerId);

  await recordRefundEvent({
    orderId: input.orderId,
    buyerId: input.buyerId ?? null,
    sellerId: input.sellerId,
    refundType: input.refundType ?? "full",
    amount: input.amount ?? 0,
    status: "completed",
    stripeRefundId: input.stripeRefundId ?? null,
    reason: input.reason ?? null,
    correlationId: input.correlationId ?? null,
  });

  await recordEscrowEvent({
    orderId: input.orderId,
    sellerId: input.sellerId,
    eventType: "refunded",
    toState: "refunded",
    amount: input.amount ?? 0,
    reason: input.reason ?? "refund",
    correlationId: input.correlationId ?? null,
  });

  await emitCommerceEvent({
    event: "REFUND_STARTED",
    orderId: input.orderId,
    userId: input.buyerId ?? null,
    amount: input.amount ?? 0,
    rule: "refund_reversal",
    metadata: { refundType: input.refundType ?? "full" },
  });

  await emitCommerceEvent({
    event: "REFUND_COMPLETED",
    orderId: input.orderId,
    userId: input.buyerId ?? null,
    amount: input.amount ?? 0,
    rule: "refund_reversal",
    result: "refunded",
    metadata: { refundType: input.refundType ?? "full", stripeRefundId: input.stripeRefundId ?? null },
  });

  await recordCommerceAudit({
    event: "refund.seller",
    orderId: input.orderId,
    userId: input.sellerId,
    actorId: input.actorId ?? null,
    rule: "refund_reversal",
    result: "completed",
    amount: input.amount ?? 0,
    correlationId: input.correlationId ?? null,
    metadata: { refundType: input.refundType ?? "full", stripeRefundId: input.stripeRefundId ?? null },
  });
}

/**
 * Auto-release worker body (spec §10): release escrow for orders that are
 * Delivered + 24h with no open dispute / refund / claim, via the gated
 * settlement engine (which reuses the certified Stripe Connect transfer).
 */
async function releaseEligiblePendingBalances(): Promise<number> {
  const released = await releaseEligibleOrders();
  if (released > 0) {
    await recordCommerceAudit({
      event: "escrow.release_batch",
      rule: "auto_release_delivered_24h",
      result: "released",
      amount: null,
      metadata: { releasedCount: released },
    });
  }
  return released;
}

/** The single financial authority surface. */
export const CommerceEngine = {
  // Settlement / escrow lifecycle
  creditSeller,
  refundSeller,
  openEscrow: openEscrowForOrder,
  onOrderDelivered,
  holdForClaim,
  releaseHoldForClaim,
  releaseOrderNow,
  releaseEligiblePendingBalances,
  releaseEligibleOrders,
  // Shipping reserve (internal ledger; Sendcloud untouched)
  reserveShipping: reserveShippingForOrder,
  debitShippingReserveForLabel,
  // Read models (dashboards)
  getOrderLedger,
  getOrderEscrowState,
  getSellerCommerceSummary,
  getAdminEscrowOverview,
  // Primitives
  emitCommerceEvent,
  recordCommerceAudit,
  recordEscrowEvent,
  recordRefundEvent,
} as const;

export {
  getOrderLedger,
  getOrderEscrowState,
  getSellerCommerceSummary,
  getAdminEscrowOverview,
  openEscrowForOrder,
  onOrderDelivered,
  holdForClaim,
  releaseHoldForClaim,
  releaseOrderNow,
  releaseEligibleOrders,
  reserveShippingForOrder,
  debitShippingReserveForLabel,
  emitCommerceEvent,
  recordCommerceAudit,
  recordEscrowEvent,
  recordRefundEvent,
};
export * from "@/lib/commerce-engine/types";
export type { CommerceEvent } from "@/lib/commerce-engine/events";

import "server-only";

/**
 * Commerce Engine — Escrow Overlay (Phase 2).
 *
 * Overlays a real escrow lifecycle on top of the existing (certified) wallet +
 * Stripe Connect rails WITHOUT changing how Stripe actually moves money:
 *
 *   payment succeeded → seller money enters PENDING (escrow), shipping reserved
 *   delivered         → delivered+24h release timer starts
 *   buyer claim       → escrow moves to ON_HOLD (payout blocked)
 *   release           → PENDING → AVAILABLE → Stripe Connect payout (settlement)
 *
 * Seller money ALWAYS starts as Pending. It is never Available on payment.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { creditSellerForOrder as walletCreditSellerForOrder } from "@/lib/wallet/sales";
import { recordEscrowEvent } from "@/lib/commerce-engine/ledger";
import { emitCommerceEvent } from "@/lib/commerce-engine/events";
import { reserveShippingForOrder } from "@/lib/commerce-engine/shipping-reserve";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";

export { DELIVERED_RELEASE_HOURS };

type SaleTxRef = { id: string; payout_available_at: string | null } | null;

async function findPendingSaleTx(orderNumber: string, sellerId: string): Promise<SaleTxRef> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("wallet_transactions")
    .select("id, payout_available_at, status, stripe_transfer_id")
    .eq("user_id", sellerId)
    .eq("order_number", orderNumber)
    .eq("type", "sale")
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, payout_available_at: data.payout_available_at ?? null };
}

/**
 * Open escrow immediately after a successful payment.
 * Seller amount → Pending. Buyer-paid shipping → Reserved Shipping Wallet.
 * Idempotent: safe to call more than once per order.
 */
export async function openEscrowForOrder(input: {
  orderId: string;
  orderNumber: string;
  sellerId: string;
  buyerId?: string | null;
  productTitle: string;
  productImageUrl: string;
  itemPrice: number;
  deliveryFee?: number;
  stripePaymentIntentId?: string | null;
  correlationId?: string | null;
}): Promise<void> {
  try {
    const before = await findPendingSaleTx(input.orderNumber, input.sellerId);

    // Credit the seller into PENDING via the existing (certified) wallet op.
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

    // Only record escrow ledger/events the first time (before did not exist).
    if (!before) {
      await recordEscrowEvent({
        orderId: input.orderId,
        sellerId: input.sellerId,
        eventType: "hold_created",
        toState: "pending",
        amount: sellerAmount,
        reason: "payment_received",
        correlationId: input.correlationId ?? null,
        metadata: { platformFee, orderNumber: input.orderNumber },
      });

      await emitCommerceEvent({
        event: "PAYMENT_CAPTURED",
        orderId: input.orderId,
        userId: input.buyerId ?? null,
        amount: input.itemPrice,
        rule: "checkout_paid",
        metadata: { platformFee, sellerAmount },
      });

      await emitCommerceEvent({
        event: "ESCROW_OPENED",
        orderId: input.orderId,
        userId: input.sellerId,
        amount: sellerAmount,
        rule: "escrow_hold",
        result: "pending",
      });

      await emitCommerceEvent({
        event: "PLATFORM_FEE_RESERVED",
        orderId: input.orderId,
        rule: "platform_fee_5_5",
        result: "reserved",
        amount: platformFee,
        metadata: { orderNumber: input.orderNumber },
      });
    }

    // Reserve buyer-paid shipping (idempotent).
    if ((input.deliveryFee ?? 0) > 0) {
      await reserveShippingForOrder({
        orderId: input.orderId,
        sellerId: input.sellerId,
        amount: input.deliveryFee ?? 0,
        correlationId: input.correlationId ?? null,
      });
    }
  } catch (error) {
    console.error(
      "[commerce-engine] openEscrowForOrder threw",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Delivery confirmed: start the delivered+24h auto-release timer.
 * Sets the sale transaction's release-eligibility time (defense-in-depth) and
 * records the delivery event. Actual payout happens via the settlement engine.
 */
export async function onOrderDelivered(input: {
  orderId: string;
  deliveredAt?: string | null;
  correlationId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, order_number, seller_id, delivered_at, status")
      .eq("id", input.orderId)
      .maybeSingle();
    if (!order) return;

    const deliveredAtIso = input.deliveredAt ?? order.delivered_at ?? new Date().toISOString();
    const releaseAt = new Date(new Date(deliveredAtIso).getTime() + DELIVERED_RELEASE_HOURS * 3600_000);

    // Only advance eligibility while there is NO active claim (order not disputed).
    if (order.status !== "issue_open" && order.status !== "cancelled") {
      await admin
        .from("wallet_transactions")
        .update({ payout_available_at: releaseAt.toISOString() })
        .eq("order_number", order.order_number)
        .eq("user_id", order.seller_id)
        .eq("type", "sale")
        .eq("status", "pending")
        .is("stripe_transfer_id", null);
    }

    await emitCommerceEvent({
      event: "DELIVERED",
      orderId: input.orderId,
      userId: order.seller_id,
      rule: "delivered_timer_started",
      metadata: { deliveredAt: deliveredAtIso, releaseEligibleAt: releaseAt.toISOString() },
    });
  } catch (error) {
    console.error(
      "[commerce-engine] onOrderDelivered threw",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * A buyer claim / dispute / return / refund request was opened.
 * Move escrow to ON_HOLD and block the payout timer. No payout while on hold.
 */
export async function holdForClaim(input: {
  orderId: string;
  reason?: string | null;
  claimType?: string | null;
  correlationId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, order_number, seller_id")
      .eq("id", input.orderId)
      .maybeSingle();
    if (!order) return;

    // Pull the sale out of any time-based eligibility (defense-in-depth).
    await admin
      .from("wallet_transactions")
      .update({ payout_available_at: null })
      .eq("order_number", order.order_number)
      .eq("user_id", order.seller_id)
      .eq("type", "sale")
      .eq("status", "pending")
      .is("stripe_transfer_id", null);

    await recordEscrowEvent({
      orderId: input.orderId,
      sellerId: order.seller_id,
      eventType: "moved_to_on_hold",
      fromState: "pending",
      toState: "on_hold",
      reason: input.reason ?? "claim_opened",
      correlationId: input.correlationId ?? null,
      metadata: { claimType: input.claimType ?? null },
    });

    await emitCommerceEvent({
      event: "REFUND_STARTED",
      orderId: input.orderId,
      userId: order.seller_id,
      rule: "escrow_hold_on_claim",
      result: "on_hold",
      metadata: { claimType: input.claimType ?? null, reason: input.reason ?? null },
    });
  } catch (error) {
    console.error(
      "[commerce-engine] holdForClaim threw",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * A claim was closed in the seller's favour (no refund): move funds back from
 * ON_HOLD to PENDING so the delivered+24h release can proceed.
 */
export async function releaseHoldForClaim(input: {
  orderId: string;
  correlationId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, order_number, seller_id, delivered_at, status")
      .eq("id", input.orderId)
      .maybeSingle();
    if (!order) return;

    const deliveredAtIso = order.delivered_at ?? null;
    const releaseAt = deliveredAtIso
      ? new Date(new Date(deliveredAtIso).getTime() + DELIVERED_RELEASE_HOURS * 3600_000).toISOString()
      : new Date().toISOString();

    await admin
      .from("wallet_transactions")
      .update({ payout_available_at: releaseAt })
      .eq("order_number", order.order_number)
      .eq("user_id", order.seller_id)
      .eq("type", "sale")
      .eq("status", "pending")
      .is("stripe_transfer_id", null);

    await recordEscrowEvent({
      orderId: input.orderId,
      sellerId: order.seller_id,
      eventType: "moved_to_available",
      fromState: "on_hold",
      toState: "pending",
      reason: "claim_closed_seller_favour",
      correlationId: input.correlationId ?? null,
    });

    await emitCommerceEvent({
      event: "SELLER_AVAILABLE",
      orderId: input.orderId,
      userId: order.seller_id,
      rule: "escrow_unhold",
      result: "pending",
    });
  } catch (error) {
    console.error(
      "[commerce-engine] releaseHoldForClaim threw",
      error instanceof Error ? error.message : String(error),
    );
  }
}

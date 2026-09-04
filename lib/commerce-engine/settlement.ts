import "server-only";

/**
 * Commerce Engine — Settlement / Release Engine (Stripe E2E Canonical).
 *
 * Release rule:
 *   Delivered + protection window (Individual 48h / Business 14d) → RELEASE to Available
 *   Buyer confirms delivery → RELEASE now
 *   Open claim / refund → BLOCKED
 *
 * Release MUST NOT create a Stripe Transfer.
 * Withdraw (seller-initiated) moves Available → Connect.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createCommerceAdminClient } from "@/lib/commerce-engine/db-client";
import { recordEscrowEvent } from "@/lib/commerce-engine/ledger";
import { recordCommerceAudit } from "@/lib/commerce-engine/audit";
import { emitCommerceEvent } from "@/lib/commerce-engine/events";
import { notifySellerFundsReleased } from "@/lib/transaction-hub/seller-wallet-notifications";
import {
  decideRelease,
  type ReleaseOutcome,
  type ReleaseReason,
} from "@/lib/commerce-engine/release-policy";
import { releaseSaleToAvailable } from "@/lib/wallet/sales";
import {
  normalizeSellerContext,
  protectionHoursForSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";

const OPEN_CASE_STATUSES = [
  "open",
  "awaiting_seller",
  "awaiting_buyer",
  "under_review",
  "appealed",
] as const;

type OrderRow = {
  id: string;
  status: string;
  delivered_at: string | null;
  seller_id: string;
  order_number: string;
  stripe_refund_id: string | null;
  seller_context?: string | null;
};

type PendingSale = {
  id: string;
  user_id: string;
  order_number: string | null;
  amount: number;
  description: string | null;
  status?: string | null;
  stripe_transfer_id?: string | null;
  seller_context?: string | null;
};

function parseOrderIdFromDescription(description: string | null): string | null {
  if (!description?.startsWith("order:")) return null;
  const rest = description.slice("order:".length);
  const orderId = rest.split("|")[0]?.trim();
  return orderId || null;
}

async function hasOpenClaim(orderId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("protection_cases")
    .select("id")
    .eq("order_id", orderId)
    .in("status", OPEN_CASE_STATUSES)
    .limit(1);
  return Boolean(data && data.length > 0);
}

async function hasBlockingRefund(order: OrderRow): Promise<boolean> {
  if (order.stripe_refund_id) return true;
  const commerce = createCommerceAdminClient();
  const { data } = await commerce
    .from("refund_events")
    .select("id")
    .eq("order_id", order.id)
    .in("status", ["pending", "processing", "completed"])
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

async function loadSellerSaleStatus(order: OrderRow): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("wallet_transactions")
    .select("status")
    .eq("user_id", order.seller_id)
    .eq("order_number", order.order_number)
    .eq("type", "sale")
    .maybeSingle();
  return data?.status ?? null;
}

function orderContext(order: OrderRow): SellerContext {
  return normalizeSellerContext(order.seller_context);
}

async function evaluateRelease(order: OrderRow, requireTimer: boolean): Promise<ReleaseReason> {
  if (order.status === "cancelled") return "cancelled";

  const [refund, claim, saleStatus] = await Promise.all([
    hasBlockingRefund(order),
    hasOpenClaim(order.id),
    loadSellerSaleStatus(order),
  ]);

  return decideRelease({
    status: order.status,
    deliveredAt: order.delivered_at,
    hasRefund: refund,
    hasOpenClaim: claim,
    saleRefunded: saleStatus === "refunded",
    sellerContext: orderContext(order),
    requireTimer,
  });
}

async function settleSale(sale: PendingSale, order: OrderRow, requireTimer: boolean): Promise<ReleaseOutcome> {
  if (sale.status === "refunded") {
    return { released: false, reason: "sale_refunded" };
  }
  if (sale.status === "completed") {
    return { released: true, reason: "released" };
  }

  const gate = await evaluateRelease(order, requireTimer);
  if (gate !== "released") {
    return { released: false, reason: gate };
  }

  const context = orderContext(order);
  const hours = protectionHoursForSellerContext(context);
  const amount = Number(sale.amount);

  await recordEscrowEvent({
    orderId: order.id,
    sellerId: sale.user_id,
    eventType: "moved_to_available",
    fromState: "pending",
    toState: "available",
    amount,
    reason: requireTimer ? `delivered_plus_${hours}h` : "buyer_confirmed",
  });

  if (requireTimer) {
    await emitCommerceEvent({
      event: "AUTO_RELEASE",
      orderId: order.id,
      userId: sale.user_id,
      amount,
      rule: `delivered_plus_${hours}h`,
      result: "available",
    });
  }
  await emitCommerceEvent({
    event: "SELLER_AVAILABLE",
    orderId: order.id,
    userId: sale.user_id,
    amount,
    rule: requireTimer ? `auto_release_delivered_${hours}h` : "buyer_confirm_release",
    result: "available",
  });

  const result = await releaseSaleToAvailable({
    saleTransactionId: sale.id,
    userId: sale.user_id,
    orderId: order.id,
    orderNumber: sale.order_number ?? order.order_number,
    amount,
    sellerContext: context,
  });

  if (!result.success) {
    await recordCommerceAudit({
      event: "escrow.release_failed",
      orderId: order.id,
      userId: sale.user_id,
      rule: "settlement",
      result: "available_credit_failed",
      amount,
      metadata: { error: result.error },
    });
    return { released: false, reason: "transfer_failed" };
  }

  await recordEscrowEvent({
    orderId: order.id,
    sellerId: sale.user_id,
    eventType: "hold_released",
    fromState: "available",
    toState: "released",
    amount,
    reason: "available_wallet_credit",
  });
  await emitCommerceEvent({
    event: "SELLER_PAID",
    orderId: order.id,
    userId: sale.user_id,
    amount,
    rule: "available_credit",
    result: "released",
    metadata: { mode: "available_not_transfer" },
  });
  await recordCommerceAudit({
    event: "escrow.released",
    orderId: order.id,
    userId: sale.user_id,
    rule: requireTimer ? "auto_release_after_delivery" : "buyer_confirm",
    result: "released_to_available",
    amount,
  });

  void notifySellerFundsReleased({
    sellerId: sale.user_id,
    orderId: order.id,
    orderNumber: sale.order_number ?? order.order_number,
    amount,
  });

  return { released: true, reason: "released" };
}

async function loadOrder(orderId: string): Promise<OrderRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("id, status, delivered_at, seller_id, order_number, stripe_refund_id, seller_context")
    .eq("id", orderId)
    .maybeSingle();
  return (data as OrderRow | null) ?? null;
}

export async function releaseEligibleOrders(limit = 100): Promise<number> {
  const admin = createAdminClient();
  const { data: pendingSales } = await admin
    .from("wallet_transactions")
    .select("id, user_id, order_number, amount, description, status, stripe_transfer_id, seller_context")
    .eq("type", "sale")
    .eq("status", "pending")
    .is("stripe_transfer_id", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!pendingSales?.length) return 0;

  let released = 0;
  for (const sale of pendingSales as PendingSale[]) {
    const orderId = parseOrderIdFromDescription(sale.description);
    if (!orderId) continue;
    const order = await loadOrder(orderId);
    if (!order) continue;
    const outcome = await settleSale(sale, order, true);
    if (outcome.released) released += 1;
  }

  return released;
}

export async function releaseOrderNow(orderId: string): Promise<ReleaseOutcome> {
  const order = await loadOrder(orderId);
  if (!order) return { released: false, reason: "order_missing" };

  const admin = createAdminClient();
  const { data: sale } = await admin
    .from("wallet_transactions")
    .select("id, user_id, order_number, amount, description, status, stripe_transfer_id, seller_context")
    .eq("user_id", order.seller_id)
    .eq("order_number", order.order_number)
    .eq("type", "sale")
    .maybeSingle();

  if (!sale) return { released: false, reason: "no_pending_sale" };
  if (sale?.status === "refunded") {
    return { released: false, reason: "sale_refunded" };
  }
  return settleSale(sale as PendingSale, order, false);
}

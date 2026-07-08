import "server-only";

/**
 * Commerce Engine — Settlement / Release Engine (Phase 2).
 *
 * The single authority that decides WHEN escrowed seller funds are released.
 * Release rule (spec §3, §4, §10):
 *
 *   Delivered  →  +24h  →  no dispute / refund / claim / return  →  RELEASE
 *   Buyer confirms delivery                                       →  RELEASE now
 *   Any open claim / refund                                       →  BLOCKED (on hold)
 *
 * It REUSES the certified Stripe Connect transfer (transferSalePayoutToConnect)
 * unchanged — it never modifies Stripe PaymentIntent / Connect / webhook / refund
 * code. It only gates eligibility and records the escrow ledger + events.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createCommerceAdminClient } from "@/lib/commerce-engine/db-client";
import { getConnectAccountStatus } from "@/lib/stripe/connect";
import { transferSalePayoutToConnect } from "@/lib/stripe/payouts";
import { recordEscrowEvent } from "@/lib/commerce-engine/ledger";
import { recordCommerceAudit } from "@/lib/commerce-engine/audit";
import { emitCommerceEvent } from "@/lib/commerce-engine/events";
import {
  decideRelease,
  type ReleaseOutcome,
  type ReleaseReason,
} from "@/lib/commerce-engine/release-policy";

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
};

type PendingSale = {
  id: string;
  user_id: string;
  order_number: string | null;
  amount: number;
  description: string | null;
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

/**
 * Evaluate whether an order's escrow may be released now (loads claim/refund
 * state, then applies the pure gate).
 */
async function evaluateRelease(order: OrderRow, requireTimer: boolean): Promise<ReleaseReason> {
  // Cheap terminal checks first (avoid I/O when already blocked/eligible-shape).
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "issue_open") return "claim_open";

  const [refund, claim] = await Promise.all([hasBlockingRefund(order), hasOpenClaim(order.id)]);

  return decideRelease({
    status: order.status,
    deliveredAt: order.delivered_at,
    hasRefund: refund,
    hasOpenClaim: claim,
    requireTimer,
  });
}

async function settleSale(sale: PendingSale, order: OrderRow, requireTimer: boolean): Promise<ReleaseOutcome> {
  const gate = await evaluateRelease(order, requireTimer);
  if (gate !== "released") {
    return { released: false, reason: gate };
  }

  const admin = createAdminClient();
  const { data: sellerProfile } = await admin
    .from("seller_profiles")
    .select("stripe_connect_account_id")
    .eq("id", sale.user_id)
    .maybeSingle();

  const connectAccountId = sellerProfile?.stripe_connect_account_id;
  if (!connectAccountId) {
    return { released: false, reason: "connect_not_ready" };
  }

  const connectStatus = await getConnectAccountStatus(sale.user_id);
  if (!connectStatus.connected || !connectStatus.payoutsEnabled) {
    return { released: false, reason: "connect_not_ready" };
  }

  const amount = Number(sale.amount);

  // Escrow state transition (ledger overlay): PENDING → AVAILABLE.
  await recordEscrowEvent({
    orderId: order.id,
    sellerId: sale.user_id,
    eventType: "moved_to_available",
    fromState: "pending",
    toState: "available",
    amount,
    reason: requireTimer ? "delivered_plus_24h" : "buyer_confirmed",
  });
  if (requireTimer) {
    await emitCommerceEvent({
      event: "AUTO_RELEASE",
      orderId: order.id,
      userId: sale.user_id,
      amount,
      rule: "delivered_plus_24h",
      result: "available",
    });
  }
  await emitCommerceEvent({
    event: "SELLER_AVAILABLE",
    orderId: order.id,
    userId: sale.user_id,
    amount,
    rule: requireTimer ? "auto_release_delivered_24h" : "buyer_confirm_release",
    result: "available",
  });

  // AVAILABLE → RELEASED via the certified Stripe Connect transfer (unchanged).
  const result = await transferSalePayoutToConnect({
    saleTransactionId: sale.id,
    userId: sale.user_id,
    orderId: order.id,
    orderNumber: sale.order_number ?? order.order_number,
    amount,
    connectAccountId,
  });

  if (!result.success) {
    await recordCommerceAudit({
      event: "escrow.release_failed",
      orderId: order.id,
      userId: sale.user_id,
      rule: "settlement",
      result: "transfer_failed",
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
    reason: "connect_transfer",
    metadata: { transferId: result.transferId },
  });
  await emitCommerceEvent({
    event: "SELLER_PAID",
    orderId: order.id,
    userId: sale.user_id,
    amount,
    rule: "connect_payout",
    result: "released",
    metadata: { transferId: result.transferId },
  });
  await recordCommerceAudit({
    event: "escrow.released",
    orderId: order.id,
    userId: sale.user_id,
    rule: requireTimer ? "auto_release_after_delivery" : "buyer_confirm",
    result: "released",
    amount,
    metadata: { transferId: result.transferId },
  });

  return { released: true, reason: "released" };
}

async function loadOrder(orderId: string): Promise<OrderRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("id, status, delivered_at, seller_id, order_number, stripe_refund_id")
    .eq("id", orderId)
    .maybeSingle();
  return (data as OrderRow | null) ?? null;
}

/**
 * Auto-release worker body (spec §10): find pending sales whose order is
 * Delivered + 24h with no open claim/refund and release them.
 * Returns the number of sales released.
 */
export async function releaseEligibleOrders(limit = 100): Promise<number> {
  const admin = createAdminClient();
  const { data: pendingSales } = await admin
    .from("wallet_transactions")
    .select("id, user_id, order_number, amount, description")
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

/**
 * Immediate release for a single order (buyer confirmed delivery — spec §3).
 */
export async function releaseOrderNow(orderId: string): Promise<ReleaseOutcome> {
  const order = await loadOrder(orderId);
  if (!order) return { released: false, reason: "order_missing" };

  const admin = createAdminClient();
  const { data: sale } = await admin
    .from("wallet_transactions")
    .select("id, user_id, order_number, amount, description")
    .eq("user_id", order.seller_id)
    .eq("order_number", order.order_number)
    .eq("type", "sale")
    .eq("status", "pending")
    .is("stripe_transfer_id", null)
    .maybeSingle();

  if (!sale) return { released: false, reason: "no_pending_sale" };

  return settleSale(sale as PendingSale, order, false);
}

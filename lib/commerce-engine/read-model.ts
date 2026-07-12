/**
 * Commerce Engine — read models (Phase 2).
 *
 * Derived, read-only views over the escrow ledger + wallet + shipping reserve
 * for the Buyer / Seller / Admin dashboards (spec §11). No money movement.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createCommerceAdminClient } from "@/lib/commerce-engine/db-client";
import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";
import type { EscrowEventRow, ShippingReserveRow } from "@/lib/commerce-engine/types";

export type OrderEscrowState = {
  orderId: string;
  state: "none" | "pending" | "on_hold" | "available" | "released" | "refunded";
  amount: number;
  releaseEligibleAt: string | null;
  shippingReserved: number;
  shippingSpent: number;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Current escrow state for a single order, derived from the immutable ledger. */
export async function getOrderEscrowState(orderId: string): Promise<OrderEscrowState> {
  const commerce = createCommerceAdminClient();
  const admin = createAdminClient();

  const [{ data: escrowData }, { data: reserveData }, { data: order }] = await Promise.all([
    commerce.from("escrow_events").select("*").eq("order_id", orderId).order("created_at", { ascending: true }),
    commerce.from("shipping_reserve").select("*").eq("order_id", orderId).maybeSingle(),
    admin.from("orders").select("delivered_at, status").eq("id", orderId).maybeSingle(),
  ]);

  const events = (escrowData as EscrowEventRow[] | null) ?? [];
  const reserve = (reserveData as ShippingReserveRow | null) ?? null;

  let state: OrderEscrowState["state"] = "none";
  let amount = 0;
  for (const ev of events) {
    if (ev.event_type === "hold_created") {
      state = "pending";
      amount = round(Number(ev.amount));
    } else if (ev.event_type === "moved_to_on_hold") {
      state = "on_hold";
    } else if (ev.event_type === "moved_to_available") {
      state = "available";
    } else if (ev.event_type === "hold_released") {
      state = "released";
    } else if (ev.event_type === "refunded") {
      state = "refunded";
    }
  }

  let releaseEligibleAt: string | null = null;
  if ((state === "pending" || state === "available") && order?.delivered_at) {
    releaseEligibleAt = new Date(
      new Date(order.delivered_at).getTime() + DELIVERED_RELEASE_HOURS * 3600_000,
    ).toISOString();
  }

  return {
    orderId,
    state,
    amount,
    releaseEligibleAt,
    shippingReserved: reserve ? round(Number(reserve.reserved_amount)) : 0,
    shippingSpent: reserve ? round(Number(reserve.spent_amount)) : 0,
  };
}

export type SellerCommerceSummary = {
  pending: number;
  available: number;
  paid: number;
  onHold: number;
  shippingReserved: number;
};

/** Seller wallet summary (spec §11): Pending / Available / Paid / Shipping Reserved. */
export async function getSellerCommerceSummary(sellerId: string): Promise<SellerCommerceSummary> {
  const admin = createAdminClient();
  const commerce = createCommerceAdminClient();

  const [{ data: wallet }, { data: sales }, { data: reserves }, { data: holds }] = await Promise.all([
    admin.from("wallets").select("pending_balance, available_balance").eq("user_id", sellerId).maybeSingle(),
    admin
      .from("wallet_transactions")
      .select("amount, stripe_transfer_id, status")
      .eq("user_id", sellerId)
      .eq("type", "sale"),
    commerce.from("shipping_reserve").select("reserved_amount, spent_amount, status").eq("seller_id", sellerId),
    commerce
      .from("escrow_events")
      .select("order_id, event_type, amount")
      .eq("seller_id", sellerId)
      .eq("event_type", "moved_to_on_hold"),
  ]);

  const salesRows = (sales as Array<{ amount: number; stripe_transfer_id: string | null; status: string }> | null) ?? [];
  const paid = round(
    salesRows
      .filter((s) => s.stripe_transfer_id && s.status === "completed")
      .reduce((sum, s) => sum + Number(s.amount), 0),
  );

  const reserveRows =
    (reserves as Array<{ reserved_amount: number; spent_amount: number; status: string }> | null) ?? [];
  const shippingReserved = round(
    reserveRows
      .filter((r) => r.status === "reserved" || r.status === "partially_spent")
      .reduce((sum, r) => sum + (Number(r.reserved_amount) - Number(r.spent_amount)), 0),
  );

  const onHold = round(
    ((holds as Array<{ amount: number }> | null) ?? []).reduce((sum, h) => sum + Number(h.amount), 0),
  );

  return {
    pending: round(Number(wallet?.pending_balance ?? 0)),
    available: round(Number(wallet?.available_balance ?? 0)),
    paid,
    onHold,
    shippingReserved,
  };
}

export type AdminEscrowOverview = {
  escrowPending: number;
  released: number;
  platformFeeReserved: number;
  platformFeeToday: number;
  platformFeeWeek: number;
  platformFeeMonth: number;
  shippingReserve: number;
  onHoldOrders: number;
  failedWithdrawals: number;
};

/** Platform-wide escrow overview for the Super Admin dashboard (spec §11). */
export async function getAdminEscrowOverview(): Promise<AdminEscrowOverview> {
  const admin = createAdminClient();
  const commerce = createCommerceAdminClient();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 3600_000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: sales },
    { data: paidOrders },
    { data: reserves },
    { data: issueOrders },
    { data: failedWithdrawals },
  ] = await Promise.all([
    admin.from("wallet_transactions").select("amount, stripe_transfer_id, status").eq("type", "sale"),
    admin.from("orders").select("platform_fee, paid_at").not("paid_at", "is", null),
    commerce.from("shipping_reserve").select("reserved_amount, spent_amount, status"),
    admin.from("orders").select("id").eq("status", "issue_open"),
    admin
      .from("wallet_transactions")
      .select("amount")
      .eq("type", "withdrawal")
      .eq("status", "failed"),
  ]);

  const salesRows = (sales as Array<{ amount: number; stripe_transfer_id: string | null; status: string }> | null) ?? [];
  const escrowPending = round(
    salesRows.filter((s) => s.status === "pending" && !s.stripe_transfer_id).reduce((sum, s) => sum + Number(s.amount), 0),
  );
  const released = round(
    salesRows.filter((s) => s.stripe_transfer_id && s.status === "completed").reduce((sum, s) => sum + Number(s.amount), 0),
  );

  const platformFeeReserved = round(
    ((paidOrders as Array<{ platform_fee: number | null }> | null) ?? []).reduce(
      (sum, o) => sum + Number(o.platform_fee ?? 0),
      0,
    ),
  );

  const paidOrderRows =
    (paidOrders as Array<{ platform_fee: number | null; paid_at: string | null }> | null) ?? [];

  const sumFeesSince = (since: string) =>
    round(
      paidOrderRows
        .filter((o) => o.paid_at && o.paid_at >= since)
        .reduce((sum, o) => sum + Number(o.platform_fee ?? 0), 0),
    );

  const platformFeeToday = sumFeesSince(startOfDay);
  const platformFeeWeek = sumFeesSince(startOfWeek);
  const platformFeeMonth = sumFeesSince(startOfMonth);

  const failedWithdrawalCount =
    ((failedWithdrawals as Array<{ amount: number }> | null) ?? []).length;

  const reserveRows =
    (reserves as Array<{ reserved_amount: number; spent_amount: number; status: string }> | null) ?? [];
  const shippingReserve = round(
    reserveRows
      .filter((r) => r.status === "reserved" || r.status === "partially_spent")
      .reduce((sum, r) => sum + (Number(r.reserved_amount) - Number(r.spent_amount)), 0),
  );

  const onHoldOrders = ((issueOrders as Array<{ id: string }> | null) ?? []).length;

  return {
    escrowPending,
    released,
    platformFeeReserved,
    platformFeeToday,
    platformFeeWeek,
    platformFeeMonth,
    shippingReserve,
    onHoldOrders,
    failedWithdrawals: failedWithdrawalCount,
  };
}

/**
 * Commerce Engine — Reserved Shipping Wallet (Phase 2).
 *
 * The Reserved Shipping Wallet is an INTERNAL ledger only. It is reconciled
 * against the (untouched) Sendcloud label path — this module never calls
 * Sendcloud and never modifies its API key / parcel creation flows.
 *
 * Flow:
 *   payment succeeds  → reserveShippingForOrder()   (buyer-paid delivery held)
 *   seller buys label → debitShippingReserveForLabel() (drawn down)
 */

import { createCommerceAdminClient } from "@/lib/commerce-engine/db-client";
import { emitCommerceEvent } from "@/lib/commerce-engine/events";
import type { ShippingReserveRow } from "@/lib/commerce-engine/types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

async function getReserve(orderId: string): Promise<ShippingReserveRow | null> {
  const admin = createCommerceAdminClient();
  const { data } = await admin.from("shipping_reserve").select("*").eq("order_id", orderId).maybeSingle();
  return (data as ShippingReserveRow | null) ?? null;
}

/**
 * Reserve the buyer-paid shipping amount for an order (idempotent per order).
 * Never mixed with seller money.
 */
export async function reserveShippingForOrder(input: {
  orderId: string;
  sellerId?: string | null;
  amount: number;
  provider?: string | null;
  correlationId?: string | null;
}): Promise<void> {
  const amount = roundMoney(Math.max(0, input.amount));
  try {
    const existing = await getReserve(input.orderId);
    if (existing) {
      return;
    }

    const admin = createCommerceAdminClient();
    const { error } = await admin.from("shipping_reserve").insert({
      order_id: input.orderId,
      seller_id: input.sellerId ?? null,
      reserved_amount: amount,
      spent_amount: 0,
      currency: "GBP",
      provider: input.provider ?? null,
      status: "reserved",
      correlation_id: input.correlationId ?? null,
      metadata: {},
    });

    if (error) {
      // Unique violation => another concurrent path already reserved. Safe to ignore.
      if (!/duplicate key|unique/i.test(error.message)) {
        console.error("[commerce-engine] shipping reserve failed", error.message);
      }
      return;
    }

    await admin.from("shipping_transactions").insert({
      order_id: input.orderId,
      direction: "reserve",
      amount,
      currency: "GBP",
      provider: input.provider ?? null,
      correlation_id: input.correlationId ?? null,
      metadata: {},
    });

    await emitCommerceEvent({
      event: "SHIPPING_RESERVED",
      orderId: input.orderId,
      userId: input.sellerId ?? null,
      amount,
      rule: "reserve_on_payment",
      metadata: { provider: input.provider ?? null },
    });
  } catch (error) {
    console.error(
      "[commerce-engine] reserveShippingForOrder threw",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Draw down the Reserved Shipping Wallet when a seller generates a label.
 * Records an immutable debit and advances the reserve status. Idempotency is
 * keyed on the label reference so a given label debits at most once.
 */
export async function debitShippingReserveForLabel(input: {
  orderId: string;
  /** Explicit label cost. When omitted, the remaining reserved balance is consumed. */
  amount?: number;
  provider?: string | null;
  carrier?: string | null;
  reference?: string | null;
  correlationId?: string | null;
}): Promise<void> {
  try {
    const reserve = await getReserve(input.orderId);
    if (!reserve) {
      return;
    }

    const remaining = roundMoney(Number(reserve.reserved_amount) - Number(reserve.spent_amount));
    const requested = input.amount != null ? roundMoney(Math.max(0, input.amount)) : remaining;
    const amount = Math.min(requested, remaining);
    if (amount <= 0) {
      return;
    }

    const admin = createCommerceAdminClient();

    if (input.reference) {
      const { data: existingDebit } = await admin
        .from("shipping_transactions")
        .select("id")
        .eq("order_id", input.orderId)
        .eq("direction", "debit")
        .eq("reference", input.reference)
        .maybeSingle();
      if (existingDebit) {
        return;
      }
    }

    const nextSpent = roundMoney(Number(reserve.spent_amount) + amount);
    const reserved = Number(reserve.reserved_amount);
    const status = nextSpent >= reserved ? "spent" : "partially_spent";

    await admin
      .from("shipping_reserve")
      .update({ spent_amount: nextSpent, status })
      .eq("id", reserve.id);

    await admin.from("shipping_transactions").insert({
      order_id: input.orderId,
      reserve_id: reserve.id,
      direction: "debit",
      amount,
      currency: "GBP",
      provider: input.provider ?? reserve.provider ?? null,
      carrier: input.carrier ?? null,
      reference: input.reference ?? null,
      correlation_id: input.correlationId ?? null,
      metadata: {},
    });

    await emitCommerceEvent({
      event: "LABEL_CREATED",
      orderId: input.orderId,
      userId: reserve.seller_id,
      amount,
      rule: "debit_shipping_reserve",
      metadata: { provider: input.provider ?? null, carrier: input.carrier ?? null, reference: input.reference ?? null },
    });
  } catch (error) {
    console.error(
      "[commerce-engine] debitShippingReserveForLabel threw",
      error instanceof Error ? error.message : String(error),
    );
  }
}

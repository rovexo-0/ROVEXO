/**
 * P0 — Idempotent repair for paid physical orders missing shipping_records.
 *
 * Reconstructs internal shipping state only:
 * shipping_records + selected quote association + addresses + internal parcel row.
 *
 * NEVER: charge buyer · refund · create Sendcloud parcel · generate label · mutate
 * unrelated orders. Callers must pass an explicit orderId (no production auto-sweep).
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getShippingRecord } from "@/lib/shipping/store";
import {
  isShippingSetupReady,
  type ShippingSetupStatus,
} from "@/lib/shipping/shipping-setup-status-v1";
import {
  ensureOrderShippingPersistence,
  markOrderShippingSetupStatus,
} from "@/lib/orders/post-payment.server";

export type RepairPaidOrderShippingResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      shippingSetupStatus: ShippingSetupStatus;
      shippingRecordId: string;
      selectedQuoteId: string | null;
      idempotent: boolean;
      sendcloudCalled: false;
      parcelCreatedExternally: false;
      labelCreated: false;
    }
  | {
      ok: false;
      orderId: string;
      orderNumber?: string;
      error: string;
      shippingSetupStatus?: ShippingSetupStatus;
      sendcloudCalled: false;
    };

/**
 * Returns true when a paid order is missing durable shipping persistence.
 * Read-only — never mutates.
 */
export async function needsPaidOrderShippingRepair(orderId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, shipping_setup_status, paid_at")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.paid_at) return false;
  if (order.status === "awaiting_payment" || order.status === "cancelled") return false;
  if (isShippingSetupReady(order.shipping_setup_status)) {
    const record = await getShippingRecord(orderId);
    return !record;
  }

  const record = await getShippingRecord(orderId);
  return !record;
}

/**
 * Idempotent repair for one paid order. Safe to call repeatedly.
 * Does not call Sendcloud. Does not generate labels. Does not refund.
 * Optional selectedShippingQuoteId lets Owner reconstruct sendcloud:<methodId>
 * for orphan paid orders that predate checkout persistence (never auto-applied).
 */
export async function repairPaidOrderShippingPersistence(
  orderId: string,
  options?: { selectedShippingQuoteId?: string | null },
): Promise<RepairPaidOrderShippingResult> {
  const admin = createAdminClient();
  const overrideQuoteId = options?.selectedShippingQuoteId?.trim() || null;

  if (overrideQuoteId) {
    await admin
      .from("orders")
      .update({ selected_shipping_quote_id: overrideQuoteId })
      .eq("id", orderId);
  }

  const { data: order } = await admin
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      buyer_id,
      seller_id,
      item_price,
      delivery_fee,
      delivery_carrier,
      shipping_address_id,
      selected_shipping_quote_id,
      shipping_setup_status,
      paid_at,
      order_items ( product_id, title, image_url, quantity, slug )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return {
      ok: false,
      orderId,
      error: "Order not found.",
      sendcloudCalled: false,
    };
  }

  if (!order.paid_at || order.status === "awaiting_payment" || order.status === "cancelled") {
    return {
      ok: false,
      orderId,
      orderNumber: order.order_number,
      error: "Order is not a paid physical shipment candidate.",
      sendcloudCalled: false,
    };
  }

  const before = await getShippingRecord(orderId);
  const alreadyReady =
    Boolean(before) &&
    isShippingSetupReady(order.shipping_setup_status) &&
    Boolean(before?.pricing?.selectedQuoteId || order.selected_shipping_quote_id == null);

  if (alreadyReady && before) {
    return {
      ok: true,
      orderId,
      orderNumber: order.order_number,
      shippingSetupStatus: "ready",
      shippingRecordId: before.id,
      selectedQuoteId: before.pricing?.selectedQuoteId ?? order.selected_shipping_quote_id ?? null,
      idempotent: true,
      sendcloudCalled: false,
      parcelCreatedExternally: false,
      labelCreated: false,
    };
  }

  try {
    const persisted = await ensureOrderShippingPersistence({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      item_price: Number(order.item_price),
      delivery_fee: order.delivery_fee == null ? null : Number(order.delivery_fee),
      delivery_carrier: order.delivery_carrier,
      shipping_address_id: order.shipping_address_id,
      selected_shipping_quote_id: order.selected_shipping_quote_id ?? null,
      order_items: order.order_items ?? [],
    }, { allowLiveQuoteEnrichment: false });

    await markOrderShippingSetupStatus(orderId, "ready");

    return {
      ok: true,
      orderId,
      orderNumber: order.order_number,
      shippingSetupStatus: "ready",
      shippingRecordId: persisted.recordId,
      selectedQuoteId: persisted.selectedQuoteId,
      idempotent: Boolean(before),
      sendcloudCalled: false,
      parcelCreatedExternally: false,
      labelCreated: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markOrderShippingSetupStatus(orderId, "repair_required");
    console.error("[orders/shipping-repair] repair failed", {
      orderId,
      orderNumber: order.order_number,
      failureStage: "repairPaidOrderShippingPersistence",
      message,
    });
    return {
      ok: false,
      orderId,
      orderNumber: order.order_number,
      error: message,
      shippingSetupStatus: "repair_required",
      sendcloudCalled: false,
    };
  }
}

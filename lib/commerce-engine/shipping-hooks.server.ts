/**
 * Commerce Engine — server-only shipping lifecycle hooks (Phase 2).
 *
 * Called from certified server paths (tracking sync, webhooks, order actions).
 * Never import this module from client-bundled shipping barrels.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { onOrderDelivered } from "@/lib/commerce-engine/escrow";
import { emitCommerceEvent } from "@/lib/commerce-engine/events";
import { onShippingStatusForResolution } from "@/lib/resolution-engine/hooks.server";
import type { ShippingStatus } from "@/lib/shipping/types";

const DISPATCH_STATUSES = new Set<ShippingStatus>(["collected", "in_transit", "out_for_delivery"]);

/**
 * React to a shipping-record status change: update the order when delivered and
 * emit the Commerce Engine audit events (spec §9).
 */
export async function onShippingRecordStatusChanged(input: {
  orderId: string;
  status: ShippingStatus;
  deliveredAt?: string;
}): Promise<void> {
  if (input.status === "delivered") {
    const deliveredAt = input.deliveredAt ?? new Date().toISOString();
    const admin = createAdminClient();
    await admin
      .from("orders")
      .update({ status: "delivered", delivered_at: deliveredAt })
      .eq("id", input.orderId);

    await onOrderDelivered({ orderId: input.orderId, deliveredAt });
    await onShippingStatusForResolution({
      orderId: input.orderId,
      status: "delivered",
      source: "shipping_hook",
    });
    return;
  }

  if (input.status === "out_for_delivery") {
    await emitCommerceEvent({
      event: "TRACKING_UPDATED",
      orderId: input.orderId,
      rule: "out_for_delivery",
      metadata: { status: input.status },
    });
    await onShippingStatusForResolution({
      orderId: input.orderId,
      status: "out_for_delivery",
      source: "shipping_hook",
    });
    return;
  }

  if (input.status === "lost" || input.status === "failed" || input.status === "returned" || input.status === "cancelled") {
    await onShippingStatusForResolution({
      orderId: input.orderId,
      status: input.status,
      source: "shipping_hook",
    });
    return;
  }

  if (DISPATCH_STATUSES.has(input.status)) {
    await emitCommerceEvent({
      event: "TRACKING_UPDATED",
      orderId: input.orderId,
      rule: "shipping_status_update",
      metadata: { status: input.status },
    });
  }
}

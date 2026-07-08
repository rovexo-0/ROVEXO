import "server-only";

import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { appendParcel2GoTrackingEvent, saveParcel2GoShipment } from "@/lib/shipping/parcel2go-store";
import { updateShippingRecordStatus } from "@/lib/shipping/store";
import { onShippingRecordStatusChanged } from "@/lib/commerce-engine/shipping-hooks.server";
import { parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";
import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import { isShippingError } from "@/src/services/shipping/errors";
import type { ShipmentStatus } from "@/src/services/shipping/types";

const STALE_SYNC_HOURS = 6;
const BATCH_LIMIT = 25;

type ActiveRecord = {
  order_id: string;
  parcel2go_order_id: string | null;
  tracking_number: string | null;
  last_tracking_sync_at: string | null;
};

function mapProviderStatusToRecordStatus(
  status: ShipmentStatus,
): "preparing" | "collected" | "in_transit" | "out_for_delivery" | "delivered" | "returned" | "cancelled" | "lost" | "failed" {
  switch (status) {
    case "dispatched":
      return "collected";
    case "in_transit":
      return "in_transit";
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "returned":
      return "returned";
    case "cancelled":
      return "cancelled";
    case "failed":
      return "failed";
  }
  return "preparing";
}

/**
 * PHASE 6 cron fallback: poll Parcel2Go tracking for active shipments that have
 * not been synced recently (or never synced via webhook).
 */
export async function syncParcel2GoTrackingBatch(): Promise<{
  scanned: number;
  synced: number;
  errors: number;
}> {
  if (!isParcel2GoConfigured()) {
    return { scanned: 0, synced: 0, errors: 0 };
  }

  const admin = createShippingAdminClient();
  const staleBefore = new Date(Date.now() - STALE_SYNC_HOURS * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("shipping_records")
    .select("order_id, parcel2go_order_id, tracking_number, last_tracking_sync_at")
    .eq("provider", "parcel2go")
    .not("tracking_number", "is", null)
    .in("status", ["preparing", "collected", "in_transit", "out_for_delivery"])
    .order("updated_at", { ascending: true })
    .limit(BATCH_LIMIT);

  const records = (data ?? []) as ActiveRecord[];
  let synced = 0;
  let errors = 0;

  for (const record of records) {
    if (record.last_tracking_sync_at && record.last_tracking_sync_at > staleBefore) {
      continue;
    }

    const reference = record.tracking_number ?? record.parcel2go_order_id;
    if (!reference) continue;

    try {
      const tracking = await parcel2GoProvider.getTracking({
        shipmentId: record.parcel2go_order_id ?? record.order_id,
        trackingNumber: record.tracking_number ?? undefined,
      });

      await saveParcel2GoShipment({
        orderId: record.order_id,
        shipment: {
          id: record.parcel2go_order_id ?? record.order_id,
          provider: "parcel2go",
          providerOrderId: record.parcel2go_order_id ?? record.order_id,
          status: tracking.status,
          trackingNumber: tracking.trackingNumber,
          carrier: tracking.carrier,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        trackingUrl: null,
      });

      await appendParcel2GoTrackingEvent({
        orderId: record.order_id,
        tracking,
        source: "parcel2go-cron",
      });

      const recordStatus = mapProviderStatusToRecordStatus(tracking.status);
      if (recordStatus !== "preparing") {
        await updateShippingRecordStatus({
          orderId: record.order_id,
          status: recordStatus,
          title: `Parcel2Go: ${tracking.status}`,
          description: tracking.events.at(-1)?.description ?? undefined,
        });
        await onShippingRecordStatusChanged({ orderId: record.order_id, status: recordStatus });
      }

      await admin
        .from("shipping_records")
        .update({ last_tracking_sync_at: new Date().toISOString() })
        .eq("order_id", record.order_id);

      synced += 1;
    } catch (error) {
      errors += 1;
      if (isShippingError(error)) {
        console.warn(`[shipping/parcel2go-cron] Tracking sync failed for ${record.order_id}: ${error.message}`);
      }
    }
  }

  return { scanned: records.length, synced, errors };
}

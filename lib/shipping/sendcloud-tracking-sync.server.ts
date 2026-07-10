import "server-only";

import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { updateShippingRecordStatus } from "@/lib/shipping/store";
import { onShippingRecordStatusChanged } from "@/lib/commerce-engine/shipping-hooks.server";
import { SendcloudService } from "@/lib/shipping/sendcloud/service";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import type { ShippingStatus } from "@/lib/shipping/types";

const STALE_SYNC_HOURS = 6;
const BATCH_LIMIT = 25;

type ActiveRecord = {
  order_id: string;
  tracking_number: string | null;
  last_tracking_sync_at: string | null;
};

/**
 * Cron fallback: poll Sendcloud tracking for active shipments that have
 * not been synced recently (or never synced via webhook).
 */
export async function syncSendcloudTrackingBatch(): Promise<{
  scanned: number;
  synced: number;
  errors: number;
}> {
  if (!isSendcloudConfigured()) {
    return { scanned: 0, synced: 0, errors: 0 };
  }

  const admin = createShippingAdminClient();
  const staleBefore = new Date(Date.now() - STALE_SYNC_HOURS * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("shipping_records")
    .select("order_id, tracking_number, last_tracking_sync_at")
    .eq("provider", "sendcloud")
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

    const trackingNumber = record.tracking_number;
    if (!trackingNumber) continue;

    try {
      const tracking = await SendcloudService.getTracking(trackingNumber);
      await updateShippingRecordStatus({
        orderId: record.order_id,
        status: tracking.status,
        title: `Tracking sync: ${tracking.status.replace(/_/g, " ")}`,
        description: tracking.events.at(-1)?.statusDetails ?? undefined,
      });
      await onShippingRecordStatusChanged({ orderId: record.order_id, status: tracking.status as ShippingStatus });

      await admin
        .from("shipping_records")
        .update({ last_tracking_sync_at: new Date().toISOString() })
        .eq("order_id", record.order_id);

      synced += 1;
    } catch {
      errors += 1;
    }
  }

  return { scanned: records.length, synced, errors };
}

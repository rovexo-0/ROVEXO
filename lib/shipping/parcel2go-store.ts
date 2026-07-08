import "server-only";

import { createShippingAdminClient } from "@/lib/shipping/db-client";
import type { Label, Shipment, TrackingStatus } from "@/src/services/shipping/types";

export async function saveParcel2GoShipment(input: {
  orderId: string;
  shipment: Shipment;
  serviceCode?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  idempotencyKey?: string | null;
}) {
  const admin = createShippingAdminClient();
  const pricePence =
    input.shipment.shippingPrice != null ? Math.round(input.shipment.shippingPrice * 100) : null;
  const insurancePence =
    input.shipment.insurancePrice != null ? Math.round(input.shipment.insurancePrice * 100) : null;

  const { data: existing } = await admin
    .from("shipping_records")
    .select("id")
    .eq("order_id", input.orderId)
    .maybeSingle();
  const existingRow = existing as { id?: string } | null;

  const payload = {
    provider: "parcel2go",
    carrier: input.shipment.carrier,
    tracking_number: input.shipment.trackingNumber,
    status: mapShipmentStatusToRecord(input.shipment.status),
    service_code: input.serviceCode ?? null,
    parcel2go_order_id: input.shipment.providerOrderId,
    parcel2go_order_line_id: input.shipment.orderLineId ?? null,
    parcel2go_order_line_hmac: input.shipment.orderLineIdHmac ?? null,
    parcel2go_reference: input.shipment.providerReference ?? null,
    parcel2go_idempotency_key: input.idempotencyKey ?? null,
    tracking_url: input.trackingUrl ?? null,
    shipping_price_pence: pricePence,
    insurance_price_pence: insurancePence,
    updated_at: new Date().toISOString(),
  };

  if (existingRow?.id) {
    await admin.from("shipping_records").update(payload).eq("id", existingRow.id);
    return existingRow.id;
  }

  const { data, error } = await admin
    .from("shipping_records")
    .insert({
      order_id: input.orderId,
      parcel_tier: "small_parcel",
      ...payload,
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
}

export async function saveParcel2GoLabel(input: {
  orderId: string;
  parcelId?: string | null;
  label: Label;
  storagePath?: string | null;
  parcel2GoReference?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
}) {
  const admin = createShippingAdminClient();
  const { data: record } = await admin
    .from("shipping_records")
    .select("id")
    .eq("order_id", input.orderId)
    .maybeSingle();
  const recordRow = record as { id?: string } | null;

  if (!recordRow?.id) return null;

  const payload = {
    shipping_record_id: recordRow.id,
    shipment_parcel_id: input.parcelId ?? null,
    provider: "parcel2go",
    tracking_number: input.label.trackingNumber,
    barcode: input.label.trackingNumber,
    qr_payload: input.label.trackingNumber,
    pdf_storage_path: input.storagePath ?? input.label.url,
    label_url: input.label.url,
    label_storage_path: input.storagePath ?? null,
    label_mime_type: input.mimeType ?? null,
    label_size_bytes: input.sizeBytes ?? null,
    parcel2go_reference: input.parcel2GoReference ?? null,
    carrier: input.label.carrier ?? "Courier",
    label_status: input.label.url ? "ready" : "pending",
    updated_at: new Date().toISOString(),
  };

  if (input.parcelId) {
    const { data: existing } = await admin
      .from("shipping_labels_v1")
      .select("id")
      .eq("shipment_parcel_id", input.parcelId)
      .maybeSingle();

    if ((existing as { id?: string } | null)?.id) {
      await admin.from("shipping_labels_v1").update(payload).eq("shipment_parcel_id", input.parcelId);
      return (existing as { id: string }).id;
    }
  } else {
    const { data: existing } = await admin
      .from("shipping_labels_v1")
      .select("id")
      .eq("shipping_record_id", recordRow.id)
      .maybeSingle();

    if ((existing as { id?: string } | null)?.id) {
      await admin.from("shipping_labels_v1").update(payload).eq("id", (existing as { id: string }).id);
      return (existing as { id: string }).id;
    }
  }

  const { data, error } = await admin
    .from("shipping_labels_v1")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
}

export async function appendParcel2GoTrackingEvent(input: {
  orderId: string;
  tracking: TrackingStatus;
  source?: string;
}) {
  const admin = createShippingAdminClient();
  const { data: record } = await admin
    .from("shipping_records")
    .select("id")
    .eq("order_id", input.orderId)
    .maybeSingle();
  const recordRow = record as { id?: string } | null;

  if (!recordRow?.id || input.tracking.events.length === 0) return;

  const latest = input.tracking.events.at(-1)!;
  await admin.from("shipping_tracking_events").insert({
    shipping_record_id: recordRow.id,
    status: mapShipmentStatusToRecord(input.tracking.status),
    title: latest.description,
    description: latest.description,
    location: latest.location,
    occurred_at: latest.occurredAt,
    source: input.source ?? "parcel2go",
  });
}

/**
 * Records a Parcel2Go webhook event. Returns `false` when the event is a
 * duplicate (same signature already recorded) so the caller can skip
 * re-processing — PHASE 2 duplicate-event protection.
 */
export async function saveParcel2GoWebhookEvent(input: {
  eventType: string;
  payload: Record<string, unknown>;
  correlationId: string;
  signature?: string | null;
  eventId?: string | null;
  eventTimestamp?: string | null;
  orderId?: string | null;
  orderLineId?: string | null;
  trackingNumber?: string | null;
}): Promise<{ inserted: boolean }> {
  const admin = createShippingAdminClient();

  if (input.signature) {
    const { data: existing } = await admin
      .from("parcel2go_webhook_events")
      .select("id")
      .eq("signature", input.signature)
      .maybeSingle();
    if ((existing as { id?: string } | null)?.id) {
      return { inserted: false };
    }
  }

  const { error } = await admin.from("parcel2go_webhook_events").insert({
    event_id: input.eventId ?? null,
    event_type: input.eventType,
    parcel2go_order_id: input.orderId ?? null,
    parcel2go_order_line_id: input.orderLineId ?? null,
    tracking_number: input.trackingNumber ?? null,
    signature: input.signature ?? null,
    event_timestamp: input.eventTimestamp ?? null,
    payload: input.payload,
    correlation_id: input.correlationId,
    processed: true,
  });

  // Unique index violation (23505) => concurrent duplicate; treat as no-op.
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") return { inserted: false };
    throw error;
  }

  return { inserted: true };
}

function mapShipmentStatusToRecord(
  status: Shipment["status"],
): "preparing" | "collected" | "in_transit" | "out_for_delivery" | "delivered" | "returned" | "cancelled" | "lost" | "failed" {
  switch (status) {
    case "draft":
    case "pending_payment":
    case "paid":
    case "label_ready":
      return "preparing";
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
    default:
      return "preparing";
  }
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import {
  estimateDeliveryDate,
  isValidTrackingNumber,
  type ShipmentStatus,
  type UkCarrier,
} from "@/lib/shipping/carriers";
import { mapLegacyShipmentStatus, mapToLegacyShipmentStatus } from "@/lib/shipping/status";
import { SHIPPING_RECORDS_SSOT_V1 } from "@/lib/shipping/shipping-records-ssot-v1";
import type { ShippingRecord, ShippingStatus } from "@/lib/shipping/types";

/**
 * Legacy compatibility view of a shipment.
 * Identity / carrier / status / tracking MUST derive from shipping_records when present.
 * order_shipments is historical fallback only — never a write SSOT.
 */
export type OrderShipment = {
  id: string;
  orderId: string;
  carrier: UkCarrier;
  trackingNumber: string | null;
  status: ShipmentStatus;
  dispatchAt: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  lastEvent: string;
  createdAt: string;
  /** True when this view was projected from shipping_records (canonical). */
  fromCanonical?: boolean;
};

type LegacyShipmentRow = {
  id: string;
  order_id: string;
  carrier: string;
  tracking_number: string | null;
  status: ShipmentStatus;
  dispatch_at: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  last_event: string;
  created_at: string;
};

type OrderTimingRow = {
  shipped_at: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  delivery_carrier: string | null;
  tracking_number: string | null;
};

function mapLegacyRow(row: LegacyShipmentRow): OrderShipment {
  return {
    id: row.id,
    orderId: row.order_id,
    carrier: row.carrier as UkCarrier,
    trackingNumber: row.tracking_number,
    status: row.status,
    dispatchAt: row.dispatch_at,
    estimatedDeliveryAt: row.estimated_delivery_at,
    deliveredAt: row.delivered_at,
    lastEvent: row.last_event,
    createdAt: row.created_at,
    fromCanonical: false,
  };
}

function orderShipmentFromCanonical(
  record: ShippingRecord,
  order: OrderTimingRow | null,
): OrderShipment {
  const lastEvent =
    record.trackingEvents.at(-1)?.title ??
    `Status: ${record.status.replace(/_/g, " ")}`;
  const carrier =
    (record.carrier as UkCarrier | null) ||
    (order?.delivery_carrier as UkCarrier | null) ||
    ("" as UkCarrier);

  return {
    id: record.id,
    orderId: record.orderId,
    carrier,
    trackingNumber: record.trackingNumber ?? order?.tracking_number ?? null,
    status: mapToLegacyShipmentStatus(record.status),
    dispatchAt: order?.shipped_at ?? record.updatedAt,
    estimatedDeliveryAt: order?.estimated_delivery_at ?? null,
    deliveredAt: order?.delivered_at ?? null,
    lastEvent,
    createdAt: record.createdAt,
    fromCanonical: true,
  };
}

async function readLegacyOrderShipment(orderId: string): Promise<OrderShipment | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("order_shipments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapLegacyRow(data as LegacyShipmentRow) : null;
}

async function readOrderTiming(orderId: string): Promise<OrderTimingRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("shipped_at, estimated_delivery_at, delivered_at, delivery_carrier, tracking_number")
    .eq("id", orderId)
    .maybeSingle();
  return (data as OrderTimingRow | null) ?? null;
}

/**
 * Compatibility read — prefers canonical shipping_records.
 * Falls back to historical order_shipments only when no canonical record exists.
 */
export async function getOrderShipment(orderId: string): Promise<OrderShipment | null> {
  void SHIPPING_RECORDS_SSOT_V1;
  const { getShippingRecord } = await import("@/lib/shipping/store");
  const record = await getShippingRecord(orderId);
  if (record) {
    const order = await readOrderTiming(orderId);
    return orderShipmentFromCanonical(record, order);
  }
  return readLegacyOrderShipment(orderId);
}

/**
 * LEGACY API — frozen write path.
 * Does NOT insert into order_shipments. Mutates shipping_records only (via attachShippingTracking).
 */
export async function createOrderShipment(input: {
  orderId: string;
  carrier: UkCarrier;
  trackingNumber?: string;
  dispatchDays?: number;
}): Promise<{ shipment: OrderShipment | null; error?: string }> {
  if (input.trackingNumber && !isValidTrackingNumber(input.carrier, input.trackingNumber)) {
    return { shipment: null, error: "Invalid tracking number format for selected carrier." };
  }

  if (!input.trackingNumber?.trim()) {
    // No tracking → ensure canonical record only (pending / preparing). Never insert legacy row.
    const { ensureShippingRecord } = await import("@/lib/shipping/store");
    await ensureShippingRecord({ orderId: input.orderId });
    const shipment = await getOrderShipment(input.orderId);
    return { shipment };
  }

  const { attachShippingTracking } = await import("@/lib/shipping/store");
  const result = await attachShippingTracking({
    orderId: input.orderId,
    carrier: input.carrier,
    trackingNumber: input.trackingNumber,
    dispatchDays: input.dispatchDays,
  });
  if (result.error) {
    return { shipment: null, error: result.error };
  }
  return { shipment: await getOrderShipment(input.orderId) };
}

/**
 * LEGACY API — frozen write path.
 * Resolves order from legacy row id (read-only) or treats id as shipping_records.id,
 * then updates canonical shipping_records. Never writes order_shipments.
 */
export async function updateShipmentStatus(input: {
  shipmentId: string;
  status: ShipmentStatus;
  lastEvent: string;
}): Promise<OrderShipment | null> {
  const admin = createAdminClient();
  const shippingAdmin = createShippingAdminClient();

  let orderId: string | null = null;

  const { data: canonical } = await shippingAdmin
    .from("shipping_records")
    .select("order_id")
    .eq("id", input.shipmentId)
    .maybeSingle();
  if (canonical && typeof (canonical as { order_id?: string }).order_id === "string") {
    orderId = (canonical as { order_id: string }).order_id;
  }

  if (!orderId) {
    const { data: legacy } = await admin
      .from("order_shipments")
      .select("order_id")
      .eq("id", input.shipmentId)
      .maybeSingle();
    orderId = (legacy as { order_id?: string } | null)?.order_id ?? null;
  }

  if (!orderId) return null;

  const canonicalStatus: ShippingStatus = mapLegacyShipmentStatus(input.status);
  const { updateShippingRecordStatus } = await import("@/lib/shipping/store");
  await updateShippingRecordStatus({
    orderId,
    status: canonicalStatus,
    title: input.lastEvent,
    description: input.lastEvent,
  });

  // Delivered order status is owned by commerce hook when status is delivered.
  if (canonicalStatus === "delivered") {
    const { onShippingRecordStatusChanged } = await import(
      "@/lib/commerce-engine/shipping-hooks.server"
    );
    await onShippingRecordStatusChanged({ orderId, status: "delivered" });
  }

  return getOrderShipment(orderId);
}

/** Test / audit helper — lists remaining intentional order_shipments write tokens (must stay empty of live writers). */
export function assertNoLiveOrderShipmentsWriters(source: string): boolean {
  const forbidden = [
    '.from("order_shipments")\n    .insert',
    '.from("order_shipments")\n    .update',
    ".from('order_shipments').insert",
    ".from('order_shipments').update",
  ];
  return !forbidden.some((token) => source.includes(token));
}

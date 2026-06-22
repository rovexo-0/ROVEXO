import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types/database";
import {
  estimateDeliveryDate,
  isValidTrackingNumber,
  type ShipmentStatus,
  type UkCarrier,
} from "@/lib/shipping/carriers";

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
};

type ShipmentRow = {
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

function mapShipment(row: ShipmentRow): OrderShipment {
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
  };
}

export async function getOrderShipment(orderId: string): Promise<OrderShipment | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("order_shipments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapShipment(data as ShipmentRow) : null;
}

export async function createOrderShipment(input: {
  orderId: string;
  carrier: UkCarrier;
  trackingNumber?: string;
  dispatchDays?: number;
}): Promise<{ shipment: OrderShipment | null; error?: string }> {
  if (input.trackingNumber && !isValidTrackingNumber(input.carrier, input.trackingNumber)) {
    return { shipment: null, error: "Invalid tracking number format for selected carrier." };
  }

  const admin = createAdminClient();
  const dispatchAt = new Date().toISOString();
  const estimated = estimateDeliveryDate(input.carrier, input.dispatchDays ?? 2);

  const { data, error } = await admin
    .from("order_shipments")
    .insert({
      order_id: input.orderId,
      carrier: input.carrier,
      tracking_number: input.trackingNumber ?? null,
      status: input.trackingNumber ? "dispatched" : "pending",
      dispatch_at: dispatchAt,
      estimated_delivery_at: estimated.toISOString(),
      last_event: input.trackingNumber ? "Tracking number added" : "Awaiting dispatch",
    })
    .select("*")
    .single();

  if (error || !data) {
    return { shipment: null, error: error?.message ?? "Failed to create shipment." };
  }

  await admin
    .from("orders")
    .update({
      tracking_number: input.trackingNumber ?? null,
      delivery_carrier: input.carrier,
      shipped_at: dispatchAt,
      status: "shipped",
      estimated_delivery_at: estimated.toISOString(),
    })
    .eq("id", input.orderId);

  return { shipment: mapShipment(data as ShipmentRow) };
}

export async function updateShipmentStatus(input: {
  shipmentId: string;
  status: ShipmentStatus;
  lastEvent: string;
}): Promise<OrderShipment | null> {
  const admin = createAdminClient();
  const updates: Database["public"]["Tables"]["order_shipments"]["Update"] = {
    status: input.status,
    last_event: input.lastEvent,
  };

  if (input.status === "delivered") {
    updates.delivered_at = new Date().toISOString();
  }

  const { data } = await admin
    .from("order_shipments")
    .update(updates)
    .eq("id", input.shipmentId)
    .select("*")
    .single();

  if (!data) return null;

  const shipment = mapShipment(data as ShipmentRow);

  if (input.status === "delivered") {
    await admin
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", shipment.orderId);
  }

  return shipment;
}

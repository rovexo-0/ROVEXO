import type { ShippingStatus } from "@/lib/shipping/types";

const SHIPPO_STATUS_MAP: Record<string, ShippingStatus> = {
  UNKNOWN: "in_transit",
  PRE_TRANSIT: "preparing",
  TRANSIT: "in_transit",
  DELIVERED: "delivered",
  RETURNED: "returned",
  FAILURE: "failed",
  DELIVERY_ATTEMPTED: "out_for_delivery",
};

export function mapShippoTrackingStatus(status: string | null | undefined): ShippingStatus {
  if (!status) return "in_transit";
  const normalized = status.trim().toUpperCase();
  return SHIPPO_STATUS_MAP[normalized] ?? "in_transit";
}

export function mapShippoCarrierToken(carrier: string): string {
  return carrier.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

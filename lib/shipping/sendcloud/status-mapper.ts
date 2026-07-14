import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ShippingStatus } from "@/lib/shipping/types";
import { mapSendcloudCarrierToUk } from "@/lib/shipping/sendcloud/carrier-aliases";

export function mapSendcloudCarrier(carrier: string): UkCarrier | string {
  return mapSendcloudCarrierToUk(carrier) ?? carrier;
}

/**
 * Map Sendcloud carrier messages → ROVEXO shipping lifecycle.
 * Sprint 2 surface states: Created, Label Generated, Collected, In Transit,
 * Delivered, Returned, Cancelled, Failed (mapped onto SHIPPING_STATUSES).
 */
export function mapSendcloudTrackingStatus(statusMessage: string | undefined): ShippingStatus {
  const normalized = (statusMessage ?? "").trim().toLowerCase();

  if (normalized.includes("delivered")) return "delivered";
  if (normalized.includes("out for delivery")) return "out_for_delivery";
  if (normalized.includes("transit") || normalized.includes("on the way") || normalized.includes("in transit")) {
    return "in_transit";
  }
  if (
    normalized.includes("collected") ||
    normalized.includes("announced") ||
    normalized.includes("ready to send") ||
    normalized.includes("picked up")
  ) {
    return "collected";
  }
  if (normalized.includes("return")) return "returned";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("fail") || normalized.includes("exception")) return "failed";
  if (normalized.includes("lost")) return "lost";
  // Created / Label Generated / awaiting pickup
  if (
    normalized.includes("created") ||
    normalized.includes("label") ||
    normalized.includes("preparing") ||
    normalized.includes("awaiting") ||
    !normalized
  ) {
    return "preparing";
  }

  return "in_transit";
}

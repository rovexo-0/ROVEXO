import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ShippingStatus } from "@/lib/shipping/types";
import { mapSendcloudCarrierToUk } from "@/lib/shipping/sendcloud/carrier-aliases";

export function mapSendcloudCarrier(carrier: string): UkCarrier | string {
  return mapSendcloudCarrierToUk(carrier) ?? carrier;
}

/**
 * Map Sendcloud carrier messages → ROVEXO shipping lifecycle.
 *
 * FAIL CLOSED: unrecognized / empty / null messages return `null`.
 * Callers must NOT advance order/shipment lifecycle on `null`
 * (preserve last known valid status / existing pending).
 * Only explicitly recognized statuses may advance lifecycle.
 */
export function mapSendcloudTrackingStatus(
  statusMessage: string | null | undefined,
): ShippingStatus | null {
  if (statusMessage == null) return null;
  const normalized = statusMessage.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("delivered")) return "delivered";
  if (normalized.includes("out for delivery")) return "out_for_delivery";
  if (
    normalized.includes("in transit") ||
    normalized.includes("transit") ||
    normalized.includes("on the way") ||
    normalized.includes("en route")
  ) {
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
  // Known pending / created / label-generated / awaiting pickup
  if (
    normalized.includes("created") ||
    normalized.includes("label") ||
    normalized.includes("preparing") ||
    normalized.includes("awaiting")
  ) {
    return "preparing";
  }

  // Unknown / unrecognized — never invent shipped / in_transit / delivered.
  return null;
}

/** True when the carrier message maps to an explicit lifecycle status. */
export function isRecognizedSendcloudTrackingStatus(
  statusMessage: string | null | undefined,
): boolean {
  return mapSendcloudTrackingStatus(statusMessage) != null;
}

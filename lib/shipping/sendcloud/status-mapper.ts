import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ShippingStatus } from "@/lib/shipping/types";
import { mapSendcloudCarrierToUk } from "@/lib/shipping/sendcloud/carrier-aliases";

export function mapSendcloudCarrier(carrier: string): UkCarrier | string {
  return mapSendcloudCarrierToUk(carrier) ?? carrier;
}

export function mapSendcloudTrackingStatus(statusMessage: string | undefined): ShippingStatus {
  const normalized = (statusMessage ?? "").trim().toLowerCase();

  if (normalized.includes("delivered")) return "delivered";
  if (normalized.includes("out for delivery")) return "out_for_delivery";
  if (normalized.includes("transit") || normalized.includes("on the way")) return "in_transit";
  if (normalized.includes("collected") || normalized.includes("announced") || normalized.includes("ready to send")) {
    return "collected";
  }
  if (normalized.includes("return")) return "returned";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("fail") || normalized.includes("exception")) return "failed";
  if (normalized.includes("lost")) return "lost";

  return "in_transit";
}

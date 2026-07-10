import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ShippingStatus } from "@/lib/shipping/types";

const SENDCLOUD_CARRIER_MAP: Record<string, UkCarrier> = {
  royal_mail: "Royal Mail",
  royalmail: "Royal Mail",
  postnl: "Royal Mail",
  hermes: "Evri",
  hermes_uk: "Evri",
  evri: "Evri",
  dpd: "DPD",
  dpd_uk: "DPD",
  ups: "UPS",
  fedex: "FedEx",
  parcelforce: "Parcelforce",
  inpost: "InPost",
};

export function mapSendcloudCarrier(carrier: string): UkCarrier | string {
  const key = carrier.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return SENDCLOUD_CARRIER_MAP[key] ?? carrier;
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

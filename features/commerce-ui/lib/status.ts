import type { ParcelStatus } from "@/features/commerce-ui/types";
import type { ShipmentStatus } from "@/lib/commerce/types";

export type StatusTone = "success" | "info" | "muted" | "warning" | "danger";

export type ParcelStatusMeta = {
  label: string;
  tone: StatusTone;
};

const PARCEL_STATUS_META: Record<ParcelStatus, ParcelStatusMeta> = {
  preparing: { label: "Preparing Shipment", tone: "muted" },
  in_transit: { label: "In Transit", tone: "success" },
  out_for_delivery: { label: "Out for Delivery", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  exception: { label: "Delivery Issue", tone: "warning" },
};

const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  order_confirmed: "Order Confirmed",
  preparing_shipment: "Preparing Shipment",
  labels_created: "Labels Created",
  collected: "Collected",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  returned: "Returned",
  cancelled: "Cancelled",
  lost: "Lost",
  damaged: "Damaged",
  claim_open: "Claim Open",
  claim_resolved: "Claim Resolved",
};

export function parcelStatusMeta(status: ParcelStatus): ParcelStatusMeta {
  return PARCEL_STATUS_META[status];
}

export function shipmentStatusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_LABELS[status];
}

export function mapShippingStatusToParcelStatus(status: ShipmentStatus): ParcelStatus {
  switch (status) {
    case "order_confirmed":
    case "preparing_shipment":
    case "labels_created":
      return "preparing";
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivered":
    case "claim_resolved":
      return "delivered";
    case "returned":
    case "cancelled":
    case "lost":
    case "damaged":
    case "claim_open":
      return "exception";
    case "collected":
    case "in_transit":
    default:
      return "in_transit";
  }
}

export type { ParcelStatus };

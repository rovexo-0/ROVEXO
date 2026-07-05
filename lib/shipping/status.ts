import type { ShipmentStatus } from "@/lib/shipping/carriers";
import { SHIPPING_STATUSES, type ShippingStatus } from "@/lib/shipping/types";

export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
  preparing: "Preparing",
  collected: "Collected",
  in_transit: "In Transit",
  out_for_delivery: "Out For Delivery",
  delivered: "Delivered",
  returned: "Returned",
  cancelled: "Cancelled",
  lost: "Lost",
  failed: "Failed",
};

export function shippingStatusLabel(status: ShippingStatus): string {
  return SHIPPING_STATUS_LABELS[status];
}

export function isShippingStatus(value: string): value is ShippingStatus {
  return (SHIPPING_STATUSES as readonly string[]).includes(value);
}

/** Map legacy DB `shipment_status` values to canonical shipping status. */
export function mapLegacyShipmentStatus(status: ShipmentStatus): ShippingStatus {
  const map: Record<ShipmentStatus, ShippingStatus> = {
    pending: "preparing",
    label_created: "preparing",
    dispatched: "collected",
    in_transit: "in_transit",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    failed: "failed",
  };
  return map[status];
}

/** Map canonical status back to legacy DB enum for `order_shipments`. */
export function mapToLegacyShipmentStatus(status: ShippingStatus): ShipmentStatus {
  const map: Record<ShippingStatus, ShipmentStatus> = {
    preparing: "pending",
    collected: "dispatched",
    in_transit: "in_transit",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    returned: "failed",
    cancelled: "failed",
    lost: "failed",
    failed: "failed",
  };
  return map[status];
}

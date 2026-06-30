export type UkCarrier =
  | "Royal Mail"
  | "Evri"
  | "DPD"
  | "UPS"
  | "FedEx"
  | "Parcelforce"
  | "InPost";

export type ShippingMethod = "collection_only" | "local_delivery" | "delivery_available";

export type ShipmentStatus =
  | "pending"
  | "label_created"
  | "dispatched"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed";

export type CarrierOption = {
  id: UkCarrier;
  label: string;
  trackingSupported: boolean;
  typicalDays: { min: number; max: number };
};

export const UK_CARRIERS: CarrierOption[] = [
  { id: "Royal Mail", label: "Royal Mail", trackingSupported: true, typicalDays: { min: 2, max: 4 } },
  { id: "Evri", label: "Evri", trackingSupported: true, typicalDays: { min: 2, max: 5 } },
  { id: "DPD", label: "DPD", trackingSupported: true, typicalDays: { min: 1, max: 3 } },
  { id: "UPS", label: "UPS", trackingSupported: true, typicalDays: { min: 1, max: 4 } },
  { id: "FedEx", label: "FedEx", trackingSupported: true, typicalDays: { min: 1, max: 4 } },
  { id: "Parcelforce", label: "Parcelforce", trackingSupported: true, typicalDays: { min: 1, max: 3 } },
  { id: "InPost", label: "InPost", trackingSupported: true, typicalDays: { min: 1, max: 3 } },
];

export const SHIPPING_METHODS: { id: ShippingMethod; label: string; description: string }[] = [
  { id: "collection_only", label: "Collection Only", description: "Buyer collects in person" },
  { id: "local_delivery", label: "Local Delivery", description: "Seller delivers locally" },
  { id: "delivery_available", label: "Delivery Available", description: "Shipped via courier" },
];

export function getCarrier(id: string): CarrierOption | undefined {
  return UK_CARRIERS.find((carrier) => carrier.id === id);
}

export function estimateDeliveryDate(
  carrier: UkCarrier,
  dispatchDays = 2,
  fromDate = new Date(),
): Date {
  const option = getCarrier(carrier);
  const days = dispatchDays + (option?.typicalDays.max ?? 3);
  const result = new Date(fromDate);
  result.setDate(result.getDate() + days);
  return result;
}

export function shipmentStatusLabel(status: ShipmentStatus): string {
  const labels: Record<ShipmentStatus, string> = {
    pending: "Pending dispatch",
    label_created: "Label created",
    dispatched: "Dispatched",
    in_transit: "In transit",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    failed: "Delivery failed",
  };
  return labels[status];
}

export function isValidTrackingNumber(carrier: UkCarrier, trackingNumber: string): boolean {
  const trimmed = trackingNumber.trim();
  if (trimmed.length < 6) return false;

  switch (carrier) {
    case "Royal Mail":
    case "Parcelforce":
      return /^[A-Z]{2}\d{9}GB$|^[A-Z0-9]{10,20}$/i.test(trimmed);
    case "DPD":
      return /^\d{10,14}$/.test(trimmed);
    case "Evri":
      return /^[A-Z0-9]{8,20}$/i.test(trimmed);
    case "UPS":
      return /^1Z[A-Z0-9]{16}$/i.test(trimmed);
    case "FedEx":
      return /^\d{12,22}$/.test(trimmed);
    case "InPost":
      return /^[A-Z0-9]{8,16}$/i.test(trimmed);
    default:
      return trimmed.length >= 6;
  }
}

export function allCarrierNames(): UkCarrier[] {
  return UK_CARRIERS.map((carrier) => carrier.id);
}

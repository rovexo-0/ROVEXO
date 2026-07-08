/**
 * ROVEXO Canonical Commerce Model
 *
 * Hierarchy: Order → Seller → Shipment → Parcel
 * Parcels are never attached directly to Order.
 */

export const SHIPMENT_STATUSES = [
  "order_confirmed",
  "preparing_shipment",
  "labels_created",
  "collected",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
  "cancelled",
  "lost",
  "damaged",
  "claim_open",
  "claim_resolved",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export type CommerceParcelModel = {
  parcelNumber: number;
  totalParcels: number;
  carrier: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelId: string | null;
  status: ShipmentStatus;
  estimatedDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  weightKg: number | null;
  dimensions: {
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
  } | null;
  shippingService: string | null;
  timeline: Array<{
    id: string;
    title: string;
    description?: string;
    occurredAt: string;
    current: boolean;
    done: boolean;
  }>;
};

export type CommerceShipmentModel = {
  id: string;
  orderId: string;
  sellerId: string;
  status: ShipmentStatus;
  parcels: CommerceParcelModel[];
  createdAt: string;
  updatedAt: string;
};

export type CommerceSellerOrderModel = {
  sellerId: string;
  sellerName: string;
  shipment: CommerceShipmentModel | null;
};

export type CommerceOrderModel = {
  orderId: string;
  orderNumber: string;
  sellers: CommerceSellerOrderModel[];
};

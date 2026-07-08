import { describe, expect, it } from "vitest";
import {
  getUiParcelsFromOrder,
  isShipmentReady,
  mapOrderToCommerceTotals,
  mapOrderToMeta,
  mapParcelModelToUi,
} from "@/lib/commerce/mappers";
import type { Order } from "@/lib/orders/types";
import type { ShippingRecord } from "@/lib/shipping/types";

const baseOrder: Order = {
  id: "order-1",
  orderNumber: "RVX-1001",
  status: "awaiting_shipment",
  product: {
    id: "prod-1",
    slug: "luxury-duvet",
    title: "Luxury Duvet",
    price: 375,
    imageUrl: "/placeholder-product.svg",
    condition: "new",
  },
  buyer: { id: "buyer-1", name: "Buyer" },
  seller: { id: "seller-1", name: "TechGear" },
  totals: {
    itemPrice: 375,
    platformFee: 20.63,
    delivery: 11.69,
    total: 407.32,
  },
  deliveryCarrier: "Evri",
  createdAt: "2025-05-02T08:41:00.000Z",
  paidAt: "2025-05-02T08:41:00.000Z",
  disputesDisabled: false,
};

const baseRecord: ShippingRecord = {
  id: "ship-1",
  orderId: "order-1",
  parcelTier: "medium_parcel",
  status: "preparing",
  carrier: "Evri",
  trackingNumber: null,
  collectionAddress: null,
  deliveryAddress: null,
  pricing: null,
  label: null,
  parcels: [],
  trackingEvents: [],
  createdAt: "2025-05-02T08:41:00.000Z",
  updatedAt: "2025-05-02T08:41:00.000Z",
};

describe("commerce canonical mappers", () => {
  it("maps checkout totals to products, shipping, platform fee and total only", () => {
    const totals = mapOrderToCommerceTotals(baseOrder.totals);
    expect(totals).toEqual({
      products: 375,
      shipping: 11.69,
      platformFee: 20.63,
      total: 407.32,
    });
    expect(totals.products + totals.shipping + totals.platformFee).toBeCloseTo(totals.total, 2);
  });

  it("shows preparing shipment before labels exist", () => {
    const parcels = getUiParcelsFromOrder(baseOrder, baseRecord);
    expect(parcels).toHaveLength(1);
    expect(parcels[0]?.status).toBe("preparing");
    expect(isShipmentReady(parcels)).toBe(false);
  });

  it("renders parcel cards as Parcel X of Y, never Label", () => {
    const parcels = getUiParcelsFromOrder(baseOrder, {
      ...baseRecord,
      status: "in_transit",
      trackingNumber: "H00A1B2C3D4E5F6",
      label: {
        trackingNumber: "H00A1B2C3D4E5F6",
        barcode: null,
        qrPayload: null,
        pdfUrl: null,
        carrier: "Evri",
        status: "ready",
      },
    });

    expect(parcels[0]?.index).toBe(1);
    expect(parcels[0]?.totalParcels).toBe(1);
    expect(isShipmentReady(parcels)).toBe(true);
    expect(mapParcelModelToUi({
      parcelNumber: 2,
      totalParcels: 3,
      carrier: "Evri",
      trackingNumber: "ABC",
      trackingUrl: null,
      labelId: "label-2",
      status: "in_transit",
      estimatedDelivery: "6 May 2025",
      createdAt: baseRecord.createdAt,
      updatedAt: baseRecord.updatedAt,
      weightKg: null,
      dimensions: null,
      shippingService: null,
      timeline: [],
    }).index).toBe(2);
  });

  it("maps order meta with paid status after payment", () => {
    const meta = mapOrderToMeta(baseOrder);
    expect(meta.paymentStatus).toBe("paid");
    expect(meta.orderNumber).toBe("RVX-1001"
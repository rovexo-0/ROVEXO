import { describe, expect, it } from "vitest";
import {
  buildSellerShipments,
  getUiParcelsFromOrder,
  isShipmentReady,
  mapOrderToCommerceTotals,
  mapOrderToMeta,
  mapParcelModelToUi,
  mapShipmentParcelsToUi,
} from "@/lib/commerce/mappers";
import { buildCanonicalShipmentTimeline } from "@/features/commerce-ui/lib/shipment-timeline";
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
    }, [{ id: "prod-1", title: "Luxury Duvet", quantity: 1, price: 375, imageUrl: null }], "parcel-2").index).toBe(2);
  });

  it("builds canonical shipment timeline with eight steps", () => {
    const timeline = buildCanonicalShipmentTimeline({
      currentStatus: "in_transit",
      parcelId: "p1",
      fallbackOccurredAt: baseRecord.createdAt,
    });
    expect(timeline.map((step) => step.title)).toEqual([
      "Order Confirmed",
      "Preparing Shipment",
      "Labels Created",
      "Collected",
      "In Transit",
      "Out for Delivery",
      "Delivered",
    ]);
    expect(timeline.find((step) => step.title === "In Transit")?.current).toBe(true);
  });

  it("groups parcels by seller without mixing", () => {
    const parcels = getUiParcelsFromOrder(baseOrder, {
      ...baseRecord,
      status: "in_transit",
      trackingNumber: "TRACK1",
      label: {
        trackingNumber: "TRACK1",
        barcode: null,
        qrPayload: null,
        pdfUrl: null,
        carrier: "Evri",
        status: "ready",
      },
    });
    const groups = buildSellerShipments(baseOrder, parcels, "/orders/order-1/tracking");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.sellerId).toBe("seller-1");
    expect(groups[0]?.parcels).toHaveLength(1);
    expect(groups[0]?.parcels[0]?.items[0]?.title).toBe("Luxury Duvet");
  });

  it("maps shipment parcels with product allocation", () => {
    const ui = mapShipmentParcelsToUi(baseOrder, baseRecord, [
      {
        id: "p1",
        shippingRecordId: "ship-1",
        parcelNumber: 1,
        totalParcels: 1,
        weightKg: 1,
        dimensions: null,
        carrier: "Evri",
        shippingService: "Standard",
        trackingNumber: "T1",
        trackingUrl: null,
        status: "in_transit",
        productItemIds: ["prod-1"],
        insuranceEnabled: false,
        insuranceValueGbp: null,
        operation: null,
        estimatedDeliveryAt: null,
        label: null,
        createdAt: baseRecord.createdAt,
        updatedAt: baseRecord.updatedAt,
      },
    ]);
    expect(ui[0]?.items).toHaveLength(1);
    expect(ui[0]?.items[0]?.id).toBe("prod-1");
  });

  it("maps order meta with paid status after payment", () => {
    const meta = mapOrderToMeta(baseOrder);
    expect(meta.paymentStatus).toBe("paid");
    expect(meta.orderNumber).toBe("RVX-1001");
  });
});

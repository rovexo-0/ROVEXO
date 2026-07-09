import { describe, expect, it } from "vitest";
import { mapShipmentParcelsToUi } from "@/lib/commerce/mappers";
import type { Order } from "@/lib/orders/types";
import type { ShipmentParcel, ShippingRecord } from "@/lib/shipping/types";

const order: Order = {
  id: "order-1",
  orderNumber: "RVX-2001",
  status: "awaiting_shipment",
  product: {
    id: "prod-1",
    slug: "item",
    title: "Test Item",
    price: 100,
    imageUrl: "/placeholder-product.svg",
    condition: "new",
  },
  buyer: { id: "buyer-1", name: "Buyer" },
  seller: { id: "seller-1", name: "Seller" },
  totals: { itemPrice: 100, platformFee: 5.5, delivery: 8, total: 113.5 },
  deliveryCarrier: "Evri",
  createdAt: "2025-05-02T08:41:00.000Z",
  paidAt: "2025-05-02T08:41:00.000Z",
  disputesDisabled: false,
};

const record: ShippingRecord = {
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

describe("shipment parcels canonical mapping", () => {
  it("renders Parcel X of Y for each shipment parcel", () => {
    const parcels: ShipmentParcel[] = [
      {
        id: "p1",
        shippingRecordId: "ship-1",
        parcelNumber: 1,
        totalParcels: 3,
        weightKg: 1.2,
        dimensions: { lengthCm: 30, widthCm: 20, heightCm: 10 },
        carrier: "Evri",
        shippingService: "Standard",
        trackingNumber: "TRACK001",
        trackingUrl: null,
        status: "in_transit",
        productItemIds: ["prod-1"],
        insuranceEnabled: false,
        insuranceValueGbp: null,
        operation: null,
        estimatedDeliveryAt: null,
        label: { id: "l1", pdfUrl: "/label.pdf", labelUrl: "/label.pdf", status: "ready" },
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      {
        id: "p2",
        shippingRecordId: "ship-1",
        parcelNumber: 2,
        totalParcels: 3,
        weightKg: 0.8,
        dimensions: null,
        carrier: "Evri",
        shippingService: "Standard",
        trackingNumber: null,
        trackingUrl: null,
        status: "preparing",
        productItemIds: ["prod-1"],
        insuranceEnabled: false,
        insuranceValueGbp: null,
        operation: null,
        estimatedDeliveryAt: null,
        label: null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    ];

    const ui = mapShipmentParcelsToUi(order, record, parcels);
    expect(ui).toHaveLength(2);
    expect(ui[0]?.index).toBe(1);
    expect(ui[0]?.totalParcels).toBe(3);
    expect(ui[0]?.items[0]?.id).toBe("prod-1");
    expect(ui[1]?.index).toBe(2);
    expect(ui.map((parcel) => parcel.index).join(",")).not.toMatch(/label/i);
  });
});

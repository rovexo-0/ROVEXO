import { describe, expect, it } from "vitest";

import {
  MULTIPLE_ELIGIBLE_PARCELS_FOR_LABEL,
  NO_ELIGIBLE_PARCEL_FOR_LABEL,
  isEligibleForNewLabel,
  isFailedHistoricalParcel,
  resolveShipmentParcelForLabel,
} from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";

const RECORD = "c039191c-45a5-49d2-a125-7e9155acf0e3";

function fakeParcel(
  overrides: Partial<ShipmentParcel> &
    Pick<ShipmentParcel, "id" | "shippingRecordId" | "parcelNumber">,
): ShipmentParcel {
  return {
    totalParcels: 1,
    weightKg: 2,
    dimensions: { lengthCm: 45, widthCm: 10, heightCm: 10 },
    carrier: null,
    shippingService: null,
    trackingNumber: null,
    trackingUrl: null,
    status: "preparing",
    productItemIds: [],
    insuranceEnabled: false,
    insuranceValueGbp: null,
    operation: null,
    estimatedDeliveryAt: null,
    label: null,
    providerParcelId: null,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
    ...overrides,
  };
}

const FAILED_4 = fakeParcel({
  id: "bed4f291-2e87-48e2-9435-e815fd6ef71e",
  shippingRecordId: RECORD,
  parcelNumber: 4,
  carrier: "Royal Mail",
  shippingService: "inpost_gb:lockertoaddress/dropoff",
  status: "collected",
  trackingNumber: null,
  label: null,
  providerParcelId: null,
});

const READY_1 = fakeParcel({
  id: "ready-1",
  shippingRecordId: RECORD,
  parcelNumber: 1,
  status: "collected",
  trackingNumber: "AB123456789GB",
  label: {
    id: "label-1",
    pdfUrl: "https://example.test/label.pdf",
    labelUrl: "https://example.test/label.pdf",
    status: "ready",
  },
  providerParcelId: 111,
});

describe("label parcel selection — recovery + regression", () => {
  it("B/F — collected leftover without tracking/label/provider is failed historical", () => {
    expect(isFailedHistoricalParcel(FAILED_4)).toBe(true);
    expect(isEligibleForNewLabel(FAILED_4)).toBe(false);
  });

  it("B/F — resolver never selects failed historical parcel-4", () => {
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD,
      loadedExplicitParcel: null,
      orderParcels: [FAILED_4],
    });
    expect(result).toEqual({
      status: "reject",
      error: NO_ELIGIBLE_PARCEL_FOR_LABEL,
    });
  });

  it("C — failed historical + preparing recovery parcel selects the preparing row", () => {
    const p5 = fakeParcel({
      id: "parcel-5",
      shippingRecordId: RECORD,
      parcelNumber: 5,
      carrier: "Royal Mail",
      shippingService: "royal_mailv2:tracked_24/size=s",
      status: "preparing",
    });
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD,
      loadedExplicitParcel: null,
      orderParcels: [FAILED_4, p5],
    });
    expect(result.status).toBe("use");
    expect(result.status === "use" && result.parcel.id).toBe("parcel-5");
    expect(result.status === "use" && result.parcel.parcelNumber).toBe(5);
  });

  it("D — normal single preparing parcel still selected", () => {
    const p1 = fakeParcel({
      id: "single-1",
      shippingRecordId: RECORD,
      parcelNumber: 1,
    });
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD,
      loadedExplicitParcel: null,
      orderParcels: [p1],
    });
    expect(result).toEqual({ status: "use", parcel: p1 });
  });

  it("D — empty list still creates (first parcel)", () => {
    expect(
      resolveShipmentParcelForLabel({
        shippingRecordId: RECORD,
        loadedExplicitParcel: null,
        orderParcels: [],
      }),
    ).toEqual({ status: "create" });
  });

  it("D — successful ready parcel remains selectable (idempotent reprint)", () => {
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD,
      loadedExplicitParcel: null,
      orderParcels: [READY_1],
    });
    expect(result).toEqual({ status: "use", parcel: READY_1 });
  });

  it("E — two preparing parcels is fail-closed ambiguity, not parcels[0]", () => {
    const a = fakeParcel({
      id: "a",
      shippingRecordId: RECORD,
      parcelNumber: 1,
    });
    const b = fakeParcel({
      id: "b",
      shippingRecordId: RECORD,
      parcelNumber: 6,
    });
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD,
      loadedExplicitParcel: null,
      orderParcels: [a, b],
    });
    expect(result).toEqual({
      status: "reject",
      error: MULTIPLE_ELIGIBLE_PARCELS_FOR_LABEL,
    });
  });

  it("C — P8.6 announced-without-tracking stays selectable (provider id)", () => {
    const announced = fakeParcel({
      id: "announced",
      shippingRecordId: RECORD,
      parcelNumber: 1,
      status: "collected",
      trackingNumber: null,
      providerParcelId: 699130991,
      label: {
        id: "pending-label",
        pdfUrl: null,
        labelUrl: null,
        status: "pending",
      },
    });
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD,
      loadedExplicitParcel: null,
      orderParcels: [announced],
    });
    expect(result).toEqual({ status: "use", parcel: announced });
  });

  it("status failed / void label excluded", () => {
    const failed = fakeParcel({
      id: "st-failed",
      shippingRecordId: RECORD,
      parcelNumber: 1,
      status: "failed",
    });
    const voided = fakeParcel({
      id: "voided",
      shippingRecordId: RECORD,
      parcelNumber: 2,
      status: "preparing",
      label: { id: "v", pdfUrl: null, labelUrl: null, status: "void" },
    });
    expect(isFailedHistoricalParcel(failed)).toBe(true);
    expect(isFailedHistoricalParcel(voided)).toBe(true);
  });
});

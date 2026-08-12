/**
 * P8.6 — Announce response parsing: shipmentId + parcelId success without sync tracking.
 * Do not invent tracking. Reuse existing GET /parcels hydrate + webhook path.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseSendcloudV3AnnounceShipmentResult } from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const SHIPMENT_ID = "d48daafb-9dfd-451a-b065-a2fe8f18013a";
const PARCEL_ID = 699130991;
const V3_CODE = "inpost_gb:lockertoaddress/dropoff";

const getSendcloudParcel = vi.fn();
const announceSendcloudShipmentV3 = vi.fn();

vi.mock("@/lib/shipping/env", () => ({
  isSendcloudConfigured: () => true,
}));

vi.mock("@/lib/shipping/sendcloud/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/shipping/sendcloud/client")>(
    "@/lib/shipping/sendcloud/client",
  );
  return {
    ...actual,
    announceSendcloudShipmentV3: (...args: unknown[]) => announceSendcloudShipmentV3(...args),
    getSendcloudParcel: (...args: unknown[]) => getSendcloudParcel(...args),
  };
});

describe("P8.6 announce response parsing", () => {
  beforeEach(() => {
    announceSendcloudShipmentV3.mockReset();
    getSendcloudParcel.mockReset();
  });

  it("1 — announce with shipmentId + parcelId + no tracking_number parses without inventing tracking", () => {
    const parsed = parseSendcloudV3AnnounceShipmentResult({
      data: {
        id: SHIPMENT_ID,
        parcels: [
          {
            id: PARCEL_ID,
            documents: [],
          },
        ],
        ship_with: {
          type: "shipping_option_code",
          properties: { shipping_option_code: V3_CODE, contract_id: 40353 },
        },
      },
    });
    expect(parsed.shipmentId).toBe(SHIPMENT_ID);
    expect(parsed.parcelId).toBe(PARCEL_ID);
    expect(parsed.trackingNumber).toBeNull();
    expect(parsed.pdfUrl).toBeNull();
    expect(parsed.serviceName).toBe(V3_CODE);
  });

  it("2 — announce with tracking_number + label document", () => {
    const parsed = parseSendcloudV3AnnounceShipmentResult({
      data: {
        id: SHIPMENT_ID,
        parcels: [
          {
            id: PARCEL_ID,
            tracking_number: "TRACK123",
            documents: [
              {
                type: "label",
                link: "https://panel.sendcloud.sc/api/v3/parcels/699130991/documents/label",
              },
            ],
          },
        ],
      },
    });
    expect(parsed.trackingNumber).toBe("TRACK123");
    expect(parsed.pdfUrl).toContain("/documents/label");
    expect(parsed.parcelId).toBe(PARCEL_ID);
  });

  it("3 — genuine announce failure remains fail-closed (no parcel id)", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: null,
      parcelId: null,
      trackingNumber: null,
      pdfUrl: null,
      carrierCode: null,
      serviceName: null,
      reusedExisting: false,
    });

    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    await expect(
      SendcloudService.generateLabel({
        quoteId: "sendcloud:27227",
        parcelTier: "small_parcel",
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        deliveryAddress: {
          role: "delivery",
          fullName: "Buyer",
          line1: "10 High Street",
          city: "London",
          postcode: "E1 6AN",
          country: "GB",
          phone: "07700900123",
          validated: true,
        },
        collectionAddress: {
          role: "collection",
          fullName: "Seller",
          line1: "1 Demo Street",
          city: "Walsall",
          postcode: "WS2 9RD",
          country: "GB",
          phone: "07700900456",
          validated: true,
        },
        orderNumber: "RVX8343A7C7",
        shippingOptionCode: V3_CODE,
        contractId: "40353",
        v2MethodId: 27227,
      }),
    ).rejects.toMatchObject({
      code: "label_failed",
      message: expect.stringContaining("without a provider parcel id"),
    });
  });

  it("3b — reuse existing provider parcel without tracking (no second announce)", async () => {
    getSendcloudParcel.mockResolvedValue({
      id: PARCEL_ID,
      tracking_number: null,
      documents: [],
      carrier: { code: "inpost_gb" },
      shipment: { id: 1, name: V3_CODE },
    });

    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: "sendcloud:27227",
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "10 High Street",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        phone: "07700900123",
        validated: true,
      },
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Demo Street",
        city: "Walsall",
        postcode: "WS2 9RD",
        country: "GB",
        phone: "07700900456",
        validated: true,
      },
      orderNumber: "RVX8343A7C7",
      shippingOptionCode: V3_CODE,
      contractId: "40353",
      v2MethodId: 27227,
      existingProviderParcelId: PARCEL_ID,
    });

    expect(result.parcelId).toBe(PARCEL_ID);
    expect(result.trackingNumber).toBeNull();
    expect(result.reusedExisting).toBe(true);
    expect(announceSendcloudShipmentV3).not.toHaveBeenCalled();
    expect(getSendcloudParcel).toHaveBeenCalledWith(PARCEL_ID);
  });

  it("4 — label response: announce without tracking succeeds; optional hydrate via GET parcel", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: SHIPMENT_ID,
      parcelId: PARCEL_ID,
      trackingNumber: null,
      pdfUrl: null,
      carrierCode: "inpost_gb",
      serviceName: V3_CODE,
      reusedExisting: false,
    });
    getSendcloudParcel.mockResolvedValue({
      id: PARCEL_ID,
      tracking_number: null,
      documents: [],
      carrier: { code: "inpost_gb" },
    });

    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: "sendcloud:27227",
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "10 High Street",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        phone: "07700900123",
        validated: true,
      },
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Demo Street",
        city: "Walsall",
        postcode: "WS2 9RD",
        country: "GB",
        phone: "07700900456",
        validated: true,
      },
      orderNumber: "RVX8343A7C7",
      shippingOptionCode: V3_CODE,
      contractId: "40353",
      v2MethodId: 27227,
    });

    expect(result.parcelId).toBe(PARCEL_ID);
    expect(result.shipmentId).toBe(SHIPMENT_ID);
    expect(result.trackingNumber).toBeNull();
    expect(result.pdfUrl).toBeNull();
    expect(getSendcloudParcel).toHaveBeenCalledWith(PARCEL_ID);
    expect(announceSendcloudShipmentV3).toHaveBeenCalledTimes(1);
  });

  it("4b — hydrate fills tracking + label URL from existing GET /parcels when announce omits them", async () => {
    announceSendcloudShipmentV3.mockResolvedValue({
      shipmentId: SHIPMENT_ID,
      parcelId: PARCEL_ID,
      trackingNumber: null,
      pdfUrl: null,
      carrierCode: null,
      serviceName: V3_CODE,
      reusedExisting: false,
    });
    getSendcloudParcel.mockResolvedValue({
      id: PARCEL_ID,
      tracking_number: "HYDRATEDTRACK",
      documents: [
        {
          type: "label",
          link: "https://panel.sendcloud.sc/api/v3/parcels/699130991/documents/label",
        },
      ],
      carrier: { code: "inpost_gb" },
    });

    const { SendcloudService } = await import("@/lib/shipping/sendcloud/service");
    const result = await SendcloudService.generateLabel({
      quoteId: "sendcloud:27227",
      parcelTier: "small_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      deliveryAddress: {
        role: "delivery",
        fullName: "Buyer",
        line1: "10 High Street",
        city: "London",
        postcode: "E1 6AN",
        country: "GB",
        phone: "07700900123",
        validated: true,
      },
      collectionAddress: {
        role: "collection",
        fullName: "Seller",
        line1: "1 Demo Street",
        city: "Walsall",
        postcode: "WS2 9RD",
        country: "GB",
        phone: "07700900456",
        validated: true,
      },
      orderNumber: "RVX8343A7C7",
      shippingOptionCode: V3_CODE,
      contractId: "40353",
      v2MethodId: 27227,
    });

    expect(result.trackingNumber).toBe("HYDRATEDTRACK");
    expect(result.pdfUrl).toContain("/documents/label");
  });

  it("5 — existing webhook/tracking path remains the async owner (no new poller)", () => {
    const service = read("lib/shipping/sendcloud/service.ts");
    const webhooks = read("lib/shipping/sendcloud/webhooks.ts");
    const adapter = read("lib/shipping/pricing/sendcloud-adapter.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");

    expect(service).toContain("getSendcloudParcel(parcelId)");
    expect(service).not.toMatch(/setInterval|while\s*\(.*tracking/);
    expect(service).not.toContain("Sendcloud shipment announced without a tracking number");
    expect(adapter).not.toContain(
      "Sendcloud returned no usable tracking number or label URL.",
    );
    expect(labelGen).toContain("announcePersisted");
    expect(webhooks).toContain("handleSendcloudWebhookEvent");
    expect(webhooks).toContain("findShippingRecordByTrackingNumber");
  });

  it("Order 2 untouched", () => {
    for (const rel of [
      "lib/shipping/sendcloud/service.ts",
      "lib/shipping/pricing/sendcloud-adapter.ts",
      "lib/shipping/label-generation.server.ts",
      "lib/shipping/sendcloud/v3-catalog-parsers-v1.ts",
    ]) {
      const src = read(rel);
      expect(src).not.toContain("50a8b313-1fd3-4104-8af5-725a84a3350e");
      expect(src).not.toContain("RVXC75CA5BB");
    }
  });
});

/**
 * P7.25 — Reuse canonical existing parcel for label generation.
 * Auto Single Parcel: parcels[0] / parcel_number=1. No Hub change. Order 2 untouched.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL,
  resolveCompleteParcelMeasurements,
} from "@/lib/shipping/parcels";
import { parcelSpecFromTier } from "@/lib/shipping/pricing/sendcloud-mappers";
import { resolveShipmentParcelForLabel } from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";
import type { ShippingAddress } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

function fakeParcel(
  overrides: Partial<ShipmentParcel> & Pick<ShipmentParcel, "id" | "shippingRecordId" | "parcelNumber">,
): ShipmentParcel {
  return {
    totalParcels: 1,
    weightKg: null,
    dimensions: null,
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
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
    ...overrides,
  };
}

const RECORD_A = "c039191c-45a5-49d2-a125-7e9155acf0e3";
const RECORD_B = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const PARCEL_1 = "25db6cb8-8593-4f94-9ec0-b57e3460b0d7";
const PARCEL_6 = "45f0586b-0d1e-4693-8f0b-70d5acbdc869";

describe("P7.25 resolveShipmentParcelForLabel", () => {
  it("T1: existing parcels → parcel_number=1 / parcels[0] reused", () => {
    const p1 = fakeParcel({ id: PARCEL_1, shippingRecordId: RECORD_A, parcelNumber: 1 });
    const p6 = fakeParcel({ id: PARCEL_6, shippingRecordId: RECORD_A, parcelNumber: 6 });
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD_A,
      loadedExplicitParcel: null,
      orderParcels: [p1, p6],
    });
    expect(result).toEqual({ status: "use", parcel: p1 });
    expect(result.status === "use" && result.parcel.id).toBe(PARCEL_1);
    expect(result.status === "use" && result.parcel.parcelNumber).toBe(1);
  });

  it("T2 contract: omit parcelId → list then reuse, create only when empty (source)", () => {
    const src = read("lib/shipping/label-generation.server.ts");
    expect(src).toContain("listShipmentParcelsForOrder");
    expect(src).toContain("resolveShipmentParcelForLabel");
    expect(src).toContain('status === "create"');
    // Must not blindly create before resolving existing parcels.
    const createIdx = src.indexOf("createShipmentParcel({ orderId, productItemIds: [] })");
    const resolveIdx = src.indexOf("resolveShipmentParcelForLabel");
    expect(resolveIdx).toBeGreaterThan(-1);
    expect(createIdx).toBeGreaterThan(resolveIdx);
  });

  it("T3: no existing parcels → create", () => {
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD_A,
      loadedExplicitParcel: null,
      orderParcels: [],
    });
    expect(result).toEqual({ status: "create" });
  });

  it("T4: explicit valid parcelId → reused", () => {
    const p6 = fakeParcel({ id: PARCEL_6, shippingRecordId: RECORD_A, parcelNumber: 6 });
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD_A,
      explicitParcelId: PARCEL_6,
      loadedExplicitParcel: p6,
      orderParcels: [],
    });
    expect(result).toEqual({ status: "use", parcel: p6 });
  });

  it("T5: explicit parcelId belonging to another shipping record → rejected", () => {
    const foreign = fakeParcel({
      id: PARCEL_6,
      shippingRecordId: RECORD_B,
      parcelNumber: 1,
    });
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD_A,
      explicitParcelId: PARCEL_6,
      loadedExplicitParcel: foreign,
      orderParcels: [],
    });
    expect(result).toEqual({
      status: "reject",
      error: "Parcel does not belong to this order.",
    });
  });

  it("T5b: explicit parcelId missing → rejected (no substitute create)", () => {
    const result = resolveShipmentParcelForLabel({
      shippingRecordId: RECORD_A,
      explicitParcelId: PARCEL_6,
      loadedExplicitParcel: null,
      orderParcels: [
        fakeParcel({ id: PARCEL_1, shippingRecordId: RECORD_A, parcelNumber: 1 }),
      ],
    });
    expect(result).toEqual({ status: "reject", error: "Parcel not found." });
  });

  it("T6: selected parcel missing measurements → fail closed (P7.21)", () => {
    expect(
      resolveCompleteParcelMeasurements({
        weightKg: null,
        dimensions: null,
      }),
    ).toBeNull();
    expect(PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL).toContain(
      "parcel weight and dimensions",
    );
  });

  it("T8: medium_parcel tier does NOT synthesize label dimensions via resolver", () => {
    const synthetic = parcelSpecFromTier("medium_parcel");
    expect(synthetic).toEqual({
      weightKg: 5,
      lengthCm: 61,
      widthCm: 46,
      heightCm: 46,
    });
    // Label path must not use that when parcel measurements are null.
    expect(
      resolveCompleteParcelMeasurements({
        weightKg: null,
        dimensions: { lengthCm: null, widthCm: null, heightCm: null },
      }),
    ).toBeNull();
  });

  it("T9: shipping_option_code preserved in label-generation wiring", () => {
    const src = read("lib/shipping/label-generation.server.ts");
    expect(src).toContain("shippingOptionCode: selectedQuote?.shippingOptionCode ?? null");
    expect(src).toContain("shipping_option_code is required");
  });

  it("T10: Order 2 remains untouched by this implementation", () => {
    const resolver = read("lib/shipping/resolve-shipment-parcel-for-label-v1.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(resolver).not.toContain("50a8b313-1fd3-4104-8af5-725a84a3350e");
    expect(labelGen).not.toContain("50a8b313-1fd3-4104-8af5-725a84a3350e");
    expect(labelGen).not.toContain("RVXC75CA5BB");
  });

  it("T11: idempotent usable-label behavior preserved in source", () => {
    const src = read("lib/shipping/label-generation.server.ts");
    expect(src).toContain('label?.status === "ready"');
    expect(src).toContain("idempotent: true");
  });
});

const generateLabel = vi.fn();

vi.mock("@/lib/shipping/env", () => ({
  isSendcloudConfigured: () => true,
  getSendcloudPublicKey: () => "pub",
  getSendcloudSecretKey: () => "sec",
  getSendcloudBaseUrl: () => "https://panel.sendcloud.sc/api/v2",
}));

vi.mock("@/lib/shipping/sendcloud/service", () => ({
  SendcloudService: {
    generateLabel: (...args: unknown[]) => generateLabel(...args),
    getQuotes: vi.fn(),
  },
}));

const delivery: ShippingAddress = {
  role: "delivery",
  fullName: "Buyer",
  line1: "10 Downing Street",
  city: "London",
  postcode: "SW1A 2AA",
  country: "GB",
  validated: true,
};

const collection: ShippingAddress = {
  role: "collection",
  fullName: "Seller",
  line1: "1 Seller Road",
  city: "Manchester",
  postcode: "M1 1AE",
  country: "GB",
  validated: true,
};

describe("P7.25 + P7.21 adapter measurement pass-through", () => {
  beforeEach(() => {
    generateLabel.mockReset();
  });

  it("T7: complete measurements → passed unchanged to Sendcloud adapter", async () => {
    generateLabel.mockResolvedValue({
      parcelId: 99,
      trackingNumber: "TRACK1",
      pdfUrl: "https://panel.sendcloud.sc/label/1.pdf",
      carrier: "InPost",
      serviceName: "InPost",
    });

    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const adapter = new SendcloudAdapter();
    await adapter.createLabel({
      quoteId: "sendcloud:27227",
      orderId: "7554fb35-6261-4b4b-96a5-aef0273d9b5b",
      orderNumber: "RVX8343A7C7",
      parcelTier: "medium_parcel",
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
      collectionAddress: collection,
      deliveryAddress: delivery,
      shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
      v2MethodId: 27227,
    });

    expect(generateLabel).toHaveBeenCalledWith(
      expect.objectContaining({
        weightKg: 2,
        lengthCm: 45,
        widthCm: 10,
        heightCm: 10,
        shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
      }),
    );
  });
});

describe("P7.25 ConversationHub unchanged", () => {
  it("Hub still posts orderId only (server reuses parcels[0])", () => {
    const hub = read("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain('body: JSON.stringify({ orderId: order.id })');
  });
});

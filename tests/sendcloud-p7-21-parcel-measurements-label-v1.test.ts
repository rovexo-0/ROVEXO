/**
 * P7.21 — Canonical shipment_parcels measurements → Sendcloud label announce.
 * No silent tier-max fallback. V3 shipping_option_code gate preserved. Order 2 untouched.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL,
  PARCEL_TIER_OPTIONS,
  resolveCompleteParcelMeasurements,
} from "@/lib/shipping/parcels";
import { parcelSpecFromTier } from "@/lib/shipping/pricing/sendcloud-mappers";
import type { ShippingAddress } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

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

describe("P7.21 parcel measurements → label generation", () => {
  beforeEach(() => {
    generateLabel.mockReset();
  });

  it("TEST 1+2: complete measurements reach adapter exactly; tier max NOT substituted", async () => {
    generateLabel.mockResolvedValue({
      parcelId: 99,
      trackingNumber: "TRACK1",
      pdfUrl: "https://panel.sendcloud.sc/label/1.pdf",
      carrier: "InPost",
      serviceName: "InPost Locker to Address",
    });

    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const adapter = new SendcloudAdapter();
    const result = await adapter.createLabel({
      quoteId: "sendcloud:27227",
      orderId: "7554fb35-6261-4b4b-96a5-aef0273d9b5b",
      orderNumber: "RVX8343A7C7",
      parcelTier: "medium_parcel",
      weightKg: 1.25,
      lengthCm: 40,
      widthCm: 30,
      heightCm: 12,
      collectionAddress: collection,
      deliveryAddress: delivery,
      shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
      v2MethodId: 27227,
    });

    expect(result.available).toBe(true);
    expect(generateLabel).toHaveBeenCalledTimes(1);
    const arg = generateLabel.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg.weightKg).toBe(1.25);
    expect(arg.lengthCm).toBe(40);
    expect(arg.widthCm).toBe(30);
    expect(arg.heightCm).toBe(12);
    expect(arg.shippingOptionCode).toBe("inpost_gb:lockertoaddress/dropoff");

    const medium = PARCEL_TIER_OPTIONS.find((o) => o.id === "medium_parcel")!;
    expect(arg.lengthCm).not.toBe(medium.maxDimensionsCm.length);
    expect(arg.widthCm).not.toBe(medium.maxDimensionsCm.width);
    expect(arg.heightCm).not.toBe(medium.maxDimensionsCm.height);
    expect(arg.weightKg).not.toBe(parcelSpecFromTier("medium_parcel").weightKg);
  });

  it("TEST 3+4: NULL measurements → fail closed before Sendcloud announce", async () => {
    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const adapter = new SendcloudAdapter();
    const result = await adapter.createLabel({
      quoteId: "sendcloud:27227",
      orderId: "7554fb35-6261-4b4b-96a5-aef0273d9b5b",
      orderNumber: "RVX8343A7C7",
      parcelTier: "medium_parcel",
      collectionAddress: collection,
      deliveryAddress: delivery,
      shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
      v2MethodId: 27227,
    });

    expect(result.available).toBe(false);
    expect(result.providerFailure?.kind).toBe("rovexo_validation");
    expect(result.providerFailure?.message).toBe(PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL);
    expect(result.providerFailure?.providerRequestAttempted).toBe(false);
    expect(generateLabel).not.toHaveBeenCalled();
  });

  it("TEST 5: shipping_option_code remains exact when measurements present", async () => {
    generateLabel.mockResolvedValue({
      parcelId: 1,
      trackingNumber: "T",
      pdfUrl: "https://panel.sendcloud.sc/label/x.pdf",
      carrier: "InPost",
      serviceName: "x",
    });

    const { SendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const adapter = new SendcloudAdapter();
    await adapter.createLabel({
      quoteId: "sendcloud:27227",
      orderId: "o1",
      orderNumber: "RVX8343A7C7",
      parcelTier: "medium_parcel",
      weightKg: 0.8,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      collectionAddress: collection,
      deliveryAddress: delivery,
      shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
      v2MethodId: 27227,
    });

    expect(generateLabel.mock.calls[0]![0]).toMatchObject({
      shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
    });
  });

  it("TEST 6+7: missing V3 shipping_option_code gate + Order 2 path unchanged in sources", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(labelGen).toContain("shipping_option_code is required");
    expect(labelGen).toContain("PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL");
    expect(labelGen).toContain("resolveCompleteParcelMeasurements");

    const service = read("lib/shipping/sendcloud/service.ts");
    expect(service).toContain("NO_V3_SHIPPING_OPTION_CODE");
    expect(service).toContain("PARCEL_MEASUREMENTS_REQUIRED");
    expect(service).not.toMatch(
      /generateLabel[\s\S]*parcelSpecFromTier\(input\.parcelTier/,
    );

    const order2 = read("lib/orders/rvxc75ca5bb-orphan-shipping-repair-v1.ts");
    expect(order2).toContain("50a8b313-1fd3-4104-8af5-725a84a3350e");
    expect(labelGen).not.toContain("50a8b313-1fd3-4104-8af5-725a84a3350e");
    expect(service).not.toContain("50a8b313-1fd3-4104-8af5-725a84a3350e");
  });

  it("TEST 8+9: resolver is single canonical helper; incomplete → null; complete → exact", () => {
    expect(
      resolveCompleteParcelMeasurements({
        weightKg: null,
        dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 },
      }),
    ).toBeNull();
    expect(
      resolveCompleteParcelMeasurements({
        weightKg: 1,
        dimensions: { lengthCm: null, widthCm: 10, heightCm: 10 },
      }),
    ).toBeNull();
    expect(
      resolveCompleteParcelMeasurements({
        weightKg: 1.5,
        dimensions: { lengthCm: 40, widthCm: 30, heightCm: 12 },
      }),
    ).toEqual({ weightKg: 1.5, lengthCm: 40, widthCm: 30, heightCm: 12 });

    // No second parcel model file.
    expect(() =>
      readFileSync(join(root, "lib/shipping/parcel-measurements-v2.ts"), "utf8"),
    ).toThrow();
  });

  it("pricing parcelSpecFromTier still available for quotes (tiers unchanged)", () => {
    const medium = parcelSpecFromTier("medium_parcel");
    expect(medium).toEqual({
      weightKg: 5,
      lengthCm: 61,
      widthCm: 46,
      heightCm: 46,
    });
    expect(PARCEL_TIER_OPTIONS.find((o) => o.id === "medium_parcel")?.maxWeightKg).toBe(10);
  });
});

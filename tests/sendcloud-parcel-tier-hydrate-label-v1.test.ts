/**
 * Canonical parcel_tier → shipment_parcels hydrate for label generation.
 * Closes the gap when post-payment created a parcel row without measurements.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL,
  parcelTierToDimensions,
  resolveCompleteParcelMeasurements,
  resolveLabelParcelMeasurements,
} from "@/lib/shipping/parcels";
import { parcelSpecFromTier } from "@/lib/shipping/pricing/sendcloud-mappers";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("parcel_tier hydrate → label measurements", () => {
  it("prefers persisted shipment_parcels measurements over tier", () => {
    expect(
      resolveLabelParcelMeasurements({
        weightKg: 0.8,
        dimensions: { lengthCm: 20, widthCm: 15, heightCm: 10 },
        parcelTier: "small_parcel",
      }),
    ).toEqual({ weightKg: 0.8, lengthCm: 20, widthCm: 15, heightCm: 10 });
  });

  it("hydrates from small_parcel SSOT when parcel row is null (ORDER_B path)", () => {
    const hydrated = resolveLabelParcelMeasurements({
      weightKg: null,
      dimensions: null,
      parcelTier: "small_parcel",
    });
    const tier = parcelTierToDimensions("small_parcel");
    const quoteSpec = parcelSpecFromTier("small_parcel");
    expect(hydrated).toEqual(tier);
    // Same weight/dims contract as checkout quotes (Evri 0–1kg band uses 1.0kg).
    expect(hydrated?.weightKg).toBe(quoteSpec.weightKg);
    expect(hydrated?.weightKg).toBe(1);
    expect(hydrated?.weightKg).toBeLessThanOrEqual(1.001);
    expect(hydrated).toEqual({
      weightKg: 1,
      lengthCm: 45,
      widthCm: 35,
      heightCm: 16,
    });
  });

  it("fail closed when parcel null and parcel_tier missing", () => {
    expect(
      resolveLabelParcelMeasurements({
        weightKg: null,
        dimensions: null,
        parcelTier: null,
      }),
    ).toBeNull();
    expect(PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL).toContain(
      "parcel weight and dimensions",
    );
  });

  it("resolveCompleteParcelMeasurements stays pure (no silent tier invent)", () => {
    expect(
      resolveCompleteParcelMeasurements({ weightKg: null, dimensions: null }),
    ).toBeNull();
  });

  it("label-generation wires hydrate + persist; adapter still fail-closed", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(labelGen).toContain("resolveLabelParcelMeasurements");
    expect(labelGen).toContain("updateShipmentParcel");
    expect(labelGen).toContain("parcelTierToDimensions");

    const adapter = read("lib/shipping/pricing/sendcloud-adapter.ts");
    expect(adapter).toContain("resolveCompleteParcelMeasurements");
    expect(adapter).toContain("PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL");
    expect(adapter).not.toContain("parcelTierToDimensions");

    const service = read("lib/shipping/sendcloud/service.ts");
    expect(service).not.toMatch(
      /generateLabel[\s\S]*parcelSpecFromTier\(input\.parcelTier/,
    );
  });

  it("post-payment seeds createShipmentParcel from parcel_tier", () => {
    const postPay = read("lib/orders/post-payment.server.ts");
    expect(postPay).toContain("parcelTierToDimensions");
    expect(postPay).toContain("weightKg: tierDims.weightKg");
  });
});

/**
 * Shipping V1.0 — Correct Parcel Size / Sendcloud SSOT.
 * ROVEXO tiers SMALL·MEDIUM·LARGE ≠ Sendcloud service names.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import {
  getDeliveryPrice,
  resolveCheckoutDeliveryOptionId,
  CHECKOUT_CARRIERS,
} from "@/lib/checkout/delivery";
import { mapProviderQuotesToCheckoutOptions } from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import {
  CANONICAL_PARCEL_SIZES_V1,
  SENDCLOUD_DERIVED_PARCEL_LIMITS_V1,
  canonicalParcelMeasurements,
  formatCanonicalMaxDimensionsLine,
  getCustomerFacingParcelSizes,
  getV1_0ParcelShippingDetailsBlocks,
} from "@/lib/shipping/canonical-parcel-size-v1";
import {
  V1_0_ACTIVE_CARRIERS,
  V1_0_HIDDEN_CARRIERS,
  isV1_0ActiveCarrier,
  resolveV1_0ActiveCarrier,
} from "@/lib/shipping/v1-0-carrier-whitelist-v1";
import {
  BUYER_SHIPPING_MARGIN_PENCE,
  toBuyerShippingPricePence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { resolveCarrierIconSrc, CARRIER_ICON_REGISTRY_V1 } from "@/lib/shipping/carrier-icons-v1";
import { PARCEL_SIZE_OPTIONS } from "@/features/sell/types";
import { PARCEL_CARD_PRESENTATION } from "@/features/sell/ui/sell-picker-presentation-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

function quote(
  overrides: Partial<ShippingQuote> &
    Pick<ShippingQuote, "id" | "carrier" | "serviceName" | "pricePence">,
): ShippingQuote {
  return {
    providerId: "sendcloud",
    currency: "GBP",
    estimatedDays: { min: 2, max: 3 },
    minWeightKg: 0,
    maxWeightKg: 30,
    ...overrides,
  };
}

describe("Correct Parcel Size / Sendcloud SSOT V1.0", () => {
  it("PARCEL_SIZE_OPTIONS = SMALL, MEDIUM, LARGE · EXTRA_LARGE removed", () => {
    expect(getCustomerFacingParcelSizes().map((d) => d.sellLabel)).toEqual([
      "SMALL",
      "MEDIUM",
      "LARGE",
    ]);
    expect(PARCEL_SIZE_OPTIONS.map((o) => o.label)).toEqual(["SMALL", "MEDIUM", "LARGE"]);
    expect(PARCEL_SIZE_OPTIONS.some((o) => /EXTRA/i.test(o.label))).toBe(false);
    expect(PARCEL_CARD_PRESENTATION.xl).toBeUndefined();
    expect(PARCEL_CARD_PRESENTATION.large?.title).toBe("LARGE");
    expect(CANONICAL_PARCEL_SIZES_V1).toHaveLength(3);
  });

  it("Sendcloud SSOT limits · no 45×10×10 · LARGE is UX tier not service name", () => {
    const small = CANONICAL_PARCEL_SIZES_V1.find((d) => d.id === "small")!;
    const medium = CANONICAL_PARCEL_SIZES_V1.find((d) => d.id === "medium")!;
    const large = CANONICAL_PARCEL_SIZES_V1.find((d) => d.id === "large")!;
    expect(small.sendcloudDerived && medium.sendcloudDerived && large.sendcloudDerived).toBe(true);
    expect(small.maxDimensionsCm).toEqual({ length: 45, width: 35, height: 16 });
    expect(medium.maxDimensionsCm).toEqual({ length: 61, width: 46, height: 46 });
    expect(large.maxWeightKg).toBe(SENDCLOUD_DERIVED_PARCEL_LIMITS_V1.large.maxWeightKg);
    expect(formatCanonicalMaxDimensionsLine(small)).toBe("Max dimensions: 45 × 35 × 16 cm");
    expect(formatCanonicalMaxDimensionsLine(small)).not.toMatch(/45 × 10 × 10/);
    expect(canonicalParcelMeasurements(small)).not.toEqual({
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
    });
    expect(large.sellLimitNote).toMatch(/not published by Sendcloud for EVRi/i);
    expect(SENDCLOUD_DERIVED_PARCEL_LIMITS_V1.large.widthHeightPublished).toBe(false);
  });

  it("carriers: RM+EVRi active · DPD/InPost customer-facing = 0", () => {
    expect([...V1_0_ACTIVE_CARRIERS]).toEqual(["Evri", "Royal Mail"]);
    expect([...CHECKOUT_CARRIERS]).toEqual(["Evri", "Royal Mail"]);
    expect([...V1_0_HIDDEN_CARRIERS].sort()).toEqual(["DPD", "InPost"]);
    expect(isV1_0ActiveCarrier("DPD")).toBe(false);
    expect(resolveV1_0ActiveCarrier("InPost")).toBeNull();
    expect(resolveCarrierIconSrc("Evri")).toBe(CARRIER_ICON_REGISTRY_V1.icons.Evri);
    expect(resolveCarrierIconSrc("Royal Mail")).toBe(CARRIER_ICON_REGISTRY_V1.icons["Royal Mail"]);
    expect(resolveCarrierIconSrc("DPD")).toBeNull();
    expect(resolveCarrierIconSrc("InPost")).toBeNull();
  });

  for (const size of ["small", "medium", "large"] as const) {
    it(`${size.toUpperCase()} × RM/EVRi — cheapest eligible · DPD hidden · +10p`, () => {
      const def = CANONICAL_PARCEL_SIZES_V1.find((d) => d.id === size)!;
      const parcel = canonicalParcelMeasurements(def);
      const options = mapProviderQuotesToCheckoutOptions(
        [
          quote({
            id: "e-hi",
            carrier: "Evri",
            serviceName: "EVRi High",
            pricePence: 400,
            maxWeightKg: 30,
          }),
          quote({
            id: "e-lo",
            carrier: "Evri",
            serviceName: "EVRi Low",
            pricePence: 305,
            maxWeightKg: 30,
          }),
          quote({
            id: "r-hi",
            carrier: "Royal Mail",
            serviceName: "Tracked 24",
            pricePence: 388,
            maxWeightKg: 30,
          }),
          quote({
            id: "r-lo",
            carrier: "Royal Mail",
            serviceName: "Tracked 48",
            pricePence: 304,
            maxWeightKg: 30,
          }),
          quote({
            id: "d",
            carrier: "DPD",
            serviceName: "Classic",
            pricePence: 50,
            maxWeightKg: 30,
          }),
        ],
        { parcel },
      );
      expect(options.map((o) => o.carrier)).toEqual(["Evri", "Royal Mail"]);
      expect(options.find((o) => o.carrier === "Evri")?.providerPricePence).toBe(305);
      expect(options.find((o) => o.carrier === "Evri")?.buyerPricePence).toBe(315);
      expect(options.find((o) => o.carrier === "Royal Mail")?.providerPricePence).toBe(304);
      expect(options.find((o) => o.carrier === "Royal Mail")?.buyerPricePence).toBe(314);
      expect(options.filter((o) => o.carrier === "DPD")).toHaveLength(0);
    });
  }

  it("ineligible cheapest skipped · weight envelope fail-closed", () => {
    const parcel = canonicalParcelMeasurements(
      CANONICAL_PARCEL_SIZES_V1.find((d) => d.id === "small")!,
    );
    const options = mapProviderQuotesToCheckoutOptions(
      [
        quote({
          id: "e-miss",
          carrier: "Evri",
          serviceName: "0-1kg",
          pricePence: 100,
          minWeightKg: 0,
          maxWeightKg: 1,
        }),
        quote({
          id: "e-ok",
          carrier: "Evri",
          serviceName: "1-2kg",
          pricePence: 305,
          minWeightKg: 1,
          maxWeightKg: 2,
        }),
      ],
      { parcel },
    );
    expect(options).toHaveLength(1);
    expect(options[0]!.id).toBe("e-ok");
    expect(options[0]!.buyerPricePence - options[0]!.providerPricePence).toBe(10);
  });

  it("buyer can select · order total updates · no forced Royal Mail · margin once", () => {
    expect(BUYER_SHIPPING_MARGIN_PENCE).toBe(10);
    expect(toBuyerShippingPricePence(304) - 304).toBe(10);
    const parcel = canonicalParcelMeasurements(
      CANONICAL_PARCEL_SIZES_V1.find((d) => d.id === "medium")!,
    );
    const options = mapProviderQuotesToCheckoutOptions(
      [
        quote({ id: "e", carrier: "Evri", serviceName: "Std", pricePence: 305 }),
        quote({ id: "r", carrier: "Royal Mail", serviceName: "T48", pricePence: 304 }),
      ],
      { parcel },
    );
    expect(resolveCheckoutDeliveryOptionId(options, "")).toBe("");
    const rm = options.find((o) => o.carrier === "Royal Mail")!;
    const evri = options.find((o) => o.carrier === "Evri")!;
    expect(resolveCheckoutDeliveryOptionId(options, evri.id)).toBe(evri.id);
    const a = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: rm }));
    const b = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: evri }));
    expect(a.delivery).toBe(rm.price);
    expect(b.delivery).toBe(evri.price);
    expect(a.total).not.toBe(b.total);
  });

  it("shipping details · no duplicate engines · no hardcoded mapper prices", () => {
    const details = getV1_0ParcelShippingDetailsBlocks();
    expect(details.map((b) => b.carrier)).toEqual(["EVRi", "Royal Mail"]);
    expect(existsSync("lib/shipping/pricing/buyer-shipping-price-v2.ts")).toBe(false);
    expect(existsSync("lib/shipping/canonical-parcel-size-v2.ts")).toBe(false);
    const mapper = readFileSync("lib/checkout/map-provider-quotes-to-checkout-v1.ts", "utf8");
    expect(mapper).toContain("toBuyerShippingPricePence");
    expect(mapper).not.toMatch(/price:\s*3\.15|price:\s*3\.14|price:\s*7\.08/);
    const ssot = readFileSync("lib/shipping/canonical-parcel-size-v1.ts", "utf8");
    expect(ssot).not.toMatch(/widthCm:\s*10,\s*\n\s*heightCm:\s*10/);
    expect(ssot).toContain("ROVEXO tier names are UX labels");
  });
});

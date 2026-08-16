/**
 * ROVEXO Parcel Size v1.0 — canonical measurements certification.
 * SMALL · MEDIUM · LARGE (UX tiers) · EXTRA LARGE removed from customer-facing.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CANONICAL_PARCEL_SIZES_V1,
  formatCanonicalMaxDimensionsLine,
  getV1_0ParcelShippingDetailsBlocks,
  resolveCanonicalParcelSize,
  canonicalParcelMeasurements,
} from "@/lib/shipping/canonical-parcel-size-v1";
import {
  parcelTierToDimensions,
  resolveListingParcelTier,
  resolveLabelParcelMeasurements,
} from "@/lib/shipping/parcels";
import { parcelSpecFromTier } from "@/lib/shipping/pricing/sendcloud-mappers";
import { PARCEL_SIZE_OPTIONS } from "@/features/sell/types";
import { PARCEL_CARD_PRESENTATION } from "@/features/sell/ui/sell-picker-presentation-v1";
import {
  BUYER_SHIPPING_MARGIN_PENCE,
  toBuyerShippingPricePence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { mapProviderQuotesToCheckoutOptions } from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import { getDeliveryPrice } from "@/lib/checkout/delivery";
import type { ShippingQuote } from "@/lib/shipping/types";

describe("Parcel Size v1.0 canonical SSOT", () => {
  it("1. customer-facing Parcel Sizes = SMALL MEDIUM LARGE", () => {
    expect(CANONICAL_PARCEL_SIZES_V1).toHaveLength(3);
    expect(CANONICAL_PARCEL_SIZES_V1.map((d) => d.sellLabel)).toEqual([
      "SMALL",
      "MEDIUM",
      "LARGE",
    ]);
    for (const def of CANONICAL_PARCEL_SIZES_V1) {
      expect(def.customerFacing).toBe(true);
      expect(def.ownerApproved).toBe(true);
      expect(def.sendcloudDerived).toBe(false);
      expect(def.weightKg).toBeGreaterThan(0);
      expect(def.lengthCm).toBeGreaterThan(0);
      expect(def.widthCm).toBeGreaterThan(0);
      expect(def.heightCm).toBeGreaterThan(0);
    }
  });

  it("2. Sell UI reads canonical Parcel Size data", () => {
    expect(PARCEL_SIZE_OPTIONS).toHaveLength(3);
    for (const option of PARCEL_SIZE_OPTIONS) {
      const def = resolveCanonicalParcelSize(option.id);
      expect(def).not.toBeNull();
      expect(option.description).toBe(def!.sellWeightLine);
      expect(option.label).toBe(def!.sellLabel);
      expect(PARCEL_CARD_PRESENTATION[option.id].maxDimensions).toBe(
        formatCanonicalMaxDimensionsLine(def!),
      );
      expect(PARCEL_CARD_PRESENTATION[option.id].title).toBe(def!.sellLabel);
    }
  });

  it("3–8. selected size persists exact weight/dims through quote/label hydrate", () => {
    for (const def of CANONICAL_PARCEL_SIZES_V1) {
      const tier = resolveListingParcelTier(def.id);
      expect(tier).toBe(def.tierId);
      expect(resolveListingParcelTier(def.tierId)).toBe(def.tierId);
      expect(resolveListingParcelTier(def.legacyId)).toBe(def.tierId);

      const dims = parcelTierToDimensions(def.tierId);
      expect(dims).toEqual(canonicalParcelMeasurements(def));

      const quoteSpec = parcelSpecFromTier(def.tierId);
      expect(quoteSpec).toEqual({
        weightKg: def.weightKg,
        lengthCm: def.lengthCm,
        widthCm: def.widthCm,
        heightCm: def.heightCm,
      });

      const hydrated = resolveLabelParcelMeasurements({
        weightKg: null,
        dimensions: null,
        parcelTier: def.tierId,
      });
      expect(hydrated).toEqual(dims);
    }
  });

  it("9–11. no generic medium fallback; missing size fails closed", () => {
    expect(resolveListingParcelTier(null)).toBeNull();
    expect(resolveListingParcelTier(undefined)).toBeNull();
    expect(resolveListingParcelTier("")).toBeNull();
    expect(resolveListingParcelTier("unknown-size")).toBeNull();
    expect(resolveCanonicalParcelSize("garbage")).toBeNull();

    const checkoutSrc = readFileSync("lib/checkout/shipping-quotes.server.ts", "utf8");
    expect(checkoutSrc).toContain("FAIL CLOSED");
    expect(checkoutSrc).not.toMatch(/CHECKOUT_PARCEL_TIER_FALLBACK/);

    const small = parcelTierToDimensions("small_parcel");
    expect(small).not.toEqual(parcelTierToDimensions("medium_parcel"));
  });

  it("12. Small uses Owner 0–1 kg band — never 2 kg / 45×10×10", () => {
    const small = resolveCanonicalParcelSize("small")!;
    expect(small.weightKg).toBe(1);
    expect(small.lengthCm).toBe(45);
    expect(small.widthCm).toBe(35);
    expect(small.heightCm).toBe(16);
    expect(parcelTierToDimensions("small_parcel")).toEqual({
      weightKg: 1,
      lengthCm: 45,
      widthCm: 35,
      heightCm: 16,
    });
    expect(parcelSpecFromTier("small_parcel")).not.toEqual({
      weightKg: 2,
      lengthCm: 45,
      widthCm: 10,
      heightCm: 10,
    });
  });

  it("16–17. DPD+InPost hidden in shipping details; technical foundation retained", () => {
    const details = getV1_0ParcelShippingDetailsBlocks();
    expect(details.map((b) => b.carrier)).toEqual(["EVRi", "Royal Mail"]);
    expect(JSON.stringify(details)).not.toMatch(/inpost|dpd/i);
    expect(existsSync(resolve("lib/shipping/sendcloud/inpost-label-engine-certification-v1.ts"))).toBe(
      true,
    );
    expect(existsSync(resolve("lib/shipping/sendcloud/dpd-label-engine-certification-v1.ts"))).toBe(
      true,
    );

    const sellParcel = readFileSync("features/sell/ui/SellParcelBlock.tsx", "utf8");
    expect(sellParcel).not.toMatch(/InPost|inpost/);
    expect(sellParcel).not.toContain("getV1_0ParcelShippingDetailsBlocks");
  });

  it("buyer margin +15p remains singular", () => {
    expect(BUYER_SHIPPING_MARGIN_PENCE).toBe(15);
    const q: ShippingQuote = {
      id: "t",
      providerId: "sendcloud",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
      pricePence: 304,
      currency: "GBP",
      estimatedDays: { min: 2, max: 3 },
    };
    const [opt] = mapProviderQuotesToCheckoutOptions([q]);
    expect(opt!.buyerPricePence).toBe(toBuyerShippingPricePence(304));
    expect(getDeliveryPrice({ selectedQuote: opt! })).toBe(opt!.price);
  });
});

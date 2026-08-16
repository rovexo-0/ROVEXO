/**
 * Owner-approved Parcel Size bands — Sell UI + Sendcloud representation + Checkout.
 * Does not mutate historical orders. Does not introduce direct carrier APIs.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  CANONICAL_PARCEL_SIZES_V1,
  OWNER_APPROVED_PARCEL_BANDS_V1,
  SENDCLOUD_DERIVED_PARCEL_LIMITS_V1,
  canonicalParcelMeasurements,
  formatCanonicalMaxDimensionsLine,
  formatCanonicalMaxWeightLine,
  resolveCanonicalParcelSize,
} from "@/lib/shipping/canonical-parcel-size-v1";
import {
  parcelSpecFromTier,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  parcelTierToDimensions,
  resolveLabelParcelMeasurements,
  resolveListingParcelTier,
} from "@/lib/shipping/parcels";
import {
  isQuoteWeightEligibleForParcel,
  mapProviderQuotesToCheckoutOptions,
} from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import { getDeliveryPrice } from "@/lib/checkout/delivery";
import { calculateOrderTotals, PLATFORM_FEE_RATE } from "@/lib/orders/pricing";
import { PARCEL_CARD_PRESENTATION } from "@/features/sell/ui/sell-picker-presentation-v1";
import { PARCEL_SIZE_OPTIONS } from "@/features/sell/types";
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

describe("Owner-approved Parcel Size bands v1", () => {
  it("TEST 1 — SMALL: 0–1 kg · 45×35×16", () => {
    const small = resolveCanonicalParcelSize("small")!;
    expect(small.id).toBe("small");
    expect(small.minWeightKg).toBe(0);
    expect(small.maxWeightKg).toBe(1);
    expect(small.weightKg).toBe(1);
    expect(small.maxDimensionsCm).toEqual({ length: 45, width: 35, height: 16 });
    expect(formatCanonicalMaxWeightLine(small)).toBe("Weight: 0–1 kg");
    expect(formatCanonicalMaxDimensionsLine(small)).toBe("Max dimensions: 45 × 35 × 16 cm");
    expect(OWNER_APPROVED_PARCEL_BANDS_V1.small.quoteWeightKg).toBe(1);
  });

  it("TEST 2 — MEDIUM: 1–2 kg · 61×46×46", () => {
    const medium = resolveCanonicalParcelSize("medium")!;
    expect(medium.id).toBe("medium");
    expect(medium.minWeightKg).toBe(1);
    expect(medium.maxWeightKg).toBe(2);
    expect(medium.weightKg).toBe(2);
    expect(medium.maxDimensionsCm).toEqual({ length: 61, width: 46, height: 46 });
    expect(formatCanonicalMaxWeightLine(medium)).toBe("Weight: 1–2 kg");
    expect(formatCanonicalMaxDimensionsLine(medium)).toBe("Max dimensions: 61 × 46 × 46 cm");
  });

  it("TEST 3 — LARGE: 2–15 kg · max length 120", () => {
    const large = resolveCanonicalParcelSize("large")!;
    expect(large.id).toBe("large");
    expect(large.minWeightKg).toBe(2);
    expect(large.maxWeightKg).toBe(15);
    expect(large.weightKg).toBe(15);
    expect(large.maxDimensionsCm.length).toBe(120);
    expect(formatCanonicalMaxWeightLine(large)).toBe("Weight: 2–15 kg");
    expect(formatCanonicalMaxDimensionsLine(large)).toBe("Max dimensions: Max length 120 cm");
  });

  it("TEST 4 — Medium must NOT generate 20 kg", () => {
    expect(parcelSpecFromTier("medium_parcel").weightKg).toBe(2);
    expect(parcelTierToDimensions("medium_parcel").weightKg).toBe(2);
    expect(canonicalParcelMeasurements(resolveCanonicalParcelSize("medium")!).weightKg).not.toBe(20);
    expect(SENDCLOUD_DERIVED_PARCEL_LIMITS_V1.medium.maxWeightKg).toBe(20.001);
    expect(resolveCanonicalParcelSize("medium")!.maxWeightKg).not.toBe(20.001);
  });

  it("TEST 5 — Large must NOT display 15.001 kg", () => {
    const large = resolveCanonicalParcelSize("large")!;
    expect(formatCanonicalMaxWeightLine(large)).not.toContain("15.001");
    expect(formatCanonicalMaxDimensionsLine(large)).not.toContain("15.001");
    expect(PARCEL_CARD_PRESENTATION.large.weight).not.toContain("15.001");
    expect(PARCEL_CARD_PRESENTATION.large.maxDimensions).not.toContain("15.001");
    expect(large.maxWeightKg).toBe(15);
  });

  it("TEST 6 — Parcel Size UI displays ONLY Weight + Max dimensions", () => {
    const ui = readFileSync("features/sell/ui/SellParcelBlock.tsx", "utf8");
    expect(ui).toContain("card.weight");
    expect(ui).toContain("card.maxDimensions");
    expect(ui).not.toMatch(/Packaging guide|PARCEL_PACKAGING_GUIDE/);
    expect(ui).not.toMatch(/Sendcloud|EVRi|Royal Mail|15\.001/i);

    for (const id of ["small", "medium", "large"] as const) {
      const card = PARCEL_CARD_PRESENTATION[id];
      expect(card.weight.startsWith("Weight:")).toBe(true);
      expect(card.maxDimensions.startsWith("Max dimensions:")).toBe(true);
      expect(card.weight + card.maxDimensions).not.toMatch(/Sendcloud|EVRi|Royal Mail|£|15\.001/i);
    }

    expect(PARCEL_SIZE_OPTIONS.map((o) => o.description)).toEqual([
      "Weight: 0–1 kg",
      "Weight: 1–2 kg",
      "Weight: 2–15 kg",
    ]);
  });

  it("TEST 7 — Checkout receives shipping quotes from corrected Parcel Size", () => {
    const checkout = readFileSync("lib/checkout/shipping-quotes.server.ts", "utf8");
    expect(checkout).toContain("canonicalParcelMeasurements");
    expect(checkout).toContain("resolveListingParcelTier");
    expect(checkout).toContain("FAIL CLOSED");

    const medium = canonicalParcelMeasurements(resolveCanonicalParcelSize("medium")!);
    expect(medium).toEqual({ weightKg: 2, lengthCm: 61, widthCm: 46, heightCm: 46 });

    const options = mapProviderQuotesToCheckoutOptions(
      [
        quote({ id: "sendcloud:1", carrier: "Evri", serviceName: "EVRi", pricePence: 305 }),
        quote({ id: "sendcloud:2", carrier: "Royal Mail", serviceName: "Tracked 48", pricePence: 304 }),
      ],
      { parcel: medium },
    );
    expect(options).toHaveLength(2);
    const selected = options.find((o) => o.carrier === "Royal Mail")!;
    const totals = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: selected }));
    expect(totals.delivery).toBe(selected.price);
    expect(PLATFORM_FEE_RATE).toBe(0.055);
    expect(totals.platformFee).toBe(0.55);
  });

  it("TEST 8 — EVRi is not excluded from Medium because of 20 kg", () => {
    const medium = canonicalParcelMeasurements(resolveCanonicalParcelSize("medium")!);
    expect(medium.weightKg).toBe(2);
    expect(
      isQuoteWeightEligibleForParcel(
        quote({
          id: "evri-15",
          carrier: "Evri",
          serviceName: "EVRi A2A",
          pricePence: 305,
          minWeightKg: 0,
          maxWeightKg: 15,
        }),
        medium,
      ),
    ).toBe(true);
    expect(
      isQuoteWeightEligibleForParcel(
        quote({
          id: "evri-20-only",
          carrier: "Evri",
          serviceName: "Would need 20kg",
          pricePence: 100,
          minWeightKg: 19,
          maxWeightKg: 20,
        }),
        medium,
      ),
    ).toBe(false);

    const options = mapProviderQuotesToCheckoutOptions(
      [
        quote({
          id: "evri-ok",
          carrier: "Evri",
          serviceName: "EVRi 0-15kg",
          pricePence: 305,
          minWeightKg: 0,
          maxWeightKg: 15,
        }),
      ],
      { parcel: medium },
    );
    expect(options.map((o) => o.carrier)).toEqual(["Evri"]);
  });

  it("TEST 9 — Royal Mail eligibility recalculated on corrected weights", () => {
    const small = canonicalParcelMeasurements(resolveCanonicalParcelSize("small")!);
    const medium = canonicalParcelMeasurements(resolveCanonicalParcelSize("medium")!);
    const large = canonicalParcelMeasurements(resolveCanonicalParcelSize("large")!);
    const rmSmall = quote({
      id: "rm-s",
      carrier: "Royal Mail",
      serviceName: "Royal Mail Tracked 48 - Small Parcel",
      pricePence: 304,
      minWeightKg: 0,
      maxWeightKg: 2.001,
    });
    expect(isQuoteWeightEligibleForParcel(rmSmall, small)).toBe(true);
    expect(isQuoteWeightEligibleForParcel(rmSmall, medium)).toBe(true);
    expect(isQuoteWeightEligibleForParcel(rmSmall, large)).toBe(false);
  });

  it("TEST 10 — Existing orders are not modified (no backfill migration)", () => {
    const migrations = readdirSync("supabase/migrations");
    expect(migrations.some((name) => /parcel_size_backfill|rewrite_shipment_parcels/i.test(name))).toBe(
      false,
    );
    const postPay = readFileSync("lib/orders/post-payment.server.ts", "utf8");
    expect(postPay).toContain("if (parcels.length === 0)");
    expect(postPay).toContain("parcelTierToDimensions");
    expect(postPay).not.toMatch(/update\([\s\S]*shipment_parcels[\s\S]*weight_kg/);
  });

  it("TEST 11 — Missing/invalid Parcel Size still FAILS CLOSED", () => {
    expect(resolveListingParcelTier(null)).toBeNull();
    expect(resolveListingParcelTier("")).toBeNull();
    expect(resolveListingParcelTier("unknown")).toBeNull();
    expect(resolveCanonicalParcelSize("xl")?.customerFacing).toBe(false);
    expect(CANONICAL_PARCEL_SIZES_V1.some((d) => d.id === "xl")).toBe(false);
    expect(resolveLabelParcelMeasurements({ weightKg: null, dimensions: null, parcelTier: null })).toBeNull();
  });

  it("TEST 12 — No direct carrier API · Sendcloud retained · quote===label SSOT", () => {
    const sendcloud = readFileSync("lib/shipping/sendcloud/service.ts", "utf8");
    expect(sendcloud).toContain("parcelSpecFromTier");
    expect(existsSync("lib/shipping/evri-direct-api.ts")).toBe(false);
    expect(existsSync("lib/shipping/royal-mail-direct-api.ts")).toBe(false);
    expect(existsSync("lib/shipping/canonical-parcel-size-v2.ts")).toBe(false);

    for (const def of CANONICAL_PARCEL_SIZES_V1) {
      const quoteSpec = parcelSpecFromTier(def.tierId);
      const labelHydrate = resolveLabelParcelMeasurements({
        weightKg: null,
        dimensions: null,
        parcelTier: def.tierId,
      });
      expect(quoteSpec).toEqual(canonicalParcelMeasurements(def));
      expect(labelHydrate).toEqual(quoteSpec);
    }

    const root = process.cwd();
    const shippingDir = join(root, "lib/shipping");
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
      });
    const sources = walk(shippingDir)
      .filter((path) => path.endsWith(".ts"))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    expect(sources).not.toMatch(/api\.evri\.com|api\.royalmail\.com|hermes-api/i);
  });
});

/**
 * Canonical Carrier Quote Selection V1.0 — TEST FIXTURES ONLY.
 * Fixture prices must never appear as production constants/defaults.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import {
  getDeliveryPrice,
  resolveCheckoutDeliveryOptionId,
} from "@/lib/checkout/delivery";
import {
  isCheckoutEligibleProviderQuote,
  isQuoteWeightEligibleForParcel,
  mapProviderQuotesToCheckoutOptions,
  selectBestQuoteForCarrier,
} from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import {
  CANONICAL_PARCEL_SIZES_V1,
  canonicalParcelMeasurements,
} from "@/lib/shipping/canonical-parcel-size-v1";
import {
  BUYER_SHIPPING_MARGIN_PENCE,
  toBuyerShippingPricePence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { resolveCarrierIconSrc, CARRIER_ICON_REGISTRY_V1 } from "@/lib/shipping/carrier-icons-v1";
import type { ParcelDimensions, ShippingQuote } from "@/lib/shipping/types";

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

function parcelFor(id: "small" | "medium" | "large"): ParcelDimensions {
  const def = CANONICAL_PARCEL_SIZES_V1.find((row) => row.id === id)!;
  return canonicalParcelMeasurements(def);
}

/** TEST-ONLY fixtures — not production prices. */
const FIXTURE = {
  evri: [
    { id: "evri-305", pricePence: 305, minWeightKg: 0, maxWeightKg: 30 },
    { id: "evri-345", pricePence: 345, minWeightKg: 0, maxWeightKg: 30 },
    { id: "evri-386", pricePence: 386, minWeightKg: 0, maxWeightKg: 30 },
  ],
  royalMail: [
    { id: "rm-304", pricePence: 304, minWeightKg: 0, maxWeightKg: 30 },
    { id: "rm-388", pricePence: 388, minWeightKg: 0, maxWeightKg: 30 },
    { id: "rm-473", pricePence: 473, minWeightKg: 0, maxWeightKg: 30 },
  ],
} as const;

function buildMatrixQuotes(): ShippingQuote[] {
  return [
    ...FIXTURE.evri.map((row) =>
      quote({
        id: row.id,
        carrier: "Evri",
        serviceName: `EVRi ${row.id}`,
        pricePence: row.pricePence,
        minWeightKg: row.minWeightKg,
        maxWeightKg: row.maxWeightKg,
      }),
    ),
    ...FIXTURE.royalMail.map((row) =>
      quote({
        id: row.id,
        carrier: "Royal Mail",
        serviceName: `Royal Mail ${row.id}`,
        pricePence: row.pricePence,
        minWeightKg: row.minWeightKg,
        maxWeightKg: row.maxWeightKg,
      }),
    ),
    quote({
      id: "dpd-698",
      carrier: "DPD",
      serviceName: "DPD Classic",
      pricePence: 698,
      minWeightKg: 0,
      maxWeightKg: 30,
    }),
    quote({
      id: "inpost-100",
      carrier: "InPost",
      serviceName: "Locker",
      pricePence: 100,
      minWeightKg: 0,
      maxWeightKg: 30,
    }),
  ];
}

describe("Canonical Carrier Quote Selection V1.0", () => {
  const sizes = ["small", "medium", "large"] as const;

  for (const size of sizes) {
    for (const carrier of ["Evri", "Royal Mail"] as const) {
      it(`${size.toUpperCase()}_${carrier.replace(/\s+/g, "_").toUpperCase()} — cheapest eligible +15p`, () => {
        const parcel = parcelFor(size);
        const options = mapProviderQuotesToCheckoutOptions(buildMatrixQuotes(), { parcel });
        const card = options.find((o) => o.carrier === carrier)!;
        expect(card).toBeTruthy();
        expect(options.filter((o) => o.carrier === carrier)).toHaveLength(1);
        expect(options.filter((o) => o.carrier === "DPD")).toHaveLength(0);

        const expectedProvider = carrier === "Evri" ? 305 : 304;
        expect(card.providerPricePence).toBe(expectedProvider);
        expect(card.buyerPricePence).toBe(expectedProvider + 15);
        expect(card.buyerPricePence - card.providerPricePence).toBe(15);
      });
    }
  }

  it("1–3. EVRi / Royal Mail multiple quotes → cheapest eligible · DPD hidden", () => {
    const options = mapProviderQuotesToCheckoutOptions(buildMatrixQuotes(), {
      parcel: parcelFor("small"),
    });
    expect(options.find((o) => o.carrier === "Evri")?.providerPricePence).toBe(305);
    expect(options.find((o) => o.carrier === "Evri")?.buyerPricePence).toBe(320);
    expect(options.find((o) => o.carrier === "Royal Mail")?.providerPricePence).toBe(304);
    expect(options.find((o) => o.carrier === "Royal Mail")?.buyerPricePence).toBe(319);
    expect(options.find((o) => o.carrier === "DPD")).toBeUndefined();
  });

  it("4–5. cheapest quote ineligible → next eligible (never force cheapest)", () => {
    const parcel = parcelFor("small"); // weightKg = 1 (Owner 0–1 kg band)
    const quotes = [
      quote({
        id: "evri-half",
        carrier: "Evri",
        serviceName: "EVRi 0–0.5kg",
        pricePence: 200,
        minWeightKg: 0,
        maxWeightKg: 0.5,
      }),
      quote({
        id: "evri-01kg",
        carrier: "Evri",
        serviceName: "EVRi 0–1kg",
        pricePence: 305,
        minWeightKg: 0,
        maxWeightKg: 1,
      }),
      quote({
        id: "evri-25kg",
        carrier: "Evri",
        serviceName: "EVRi 2–5kg",
        pricePence: 386,
        minWeightKg: 2,
        maxWeightKg: 5,
      }),
    ];

    expect(isQuoteWeightEligibleForParcel(quotes[0]!, parcel)).toBe(false);
    expect(isQuoteWeightEligibleForParcel(quotes[1]!, parcel)).toBe(true);
    expect(isQuoteWeightEligibleForParcel(quotes[2]!, parcel)).toBe(false);

    const best = selectBestQuoteForCarrier(quotes, { parcel });
    expect(best?.id).toBe("evri-01kg");
    expect(best?.pricePence).toBe(305);

    const [card] = mapProviderQuotesToCheckoutOptions(quotes, { parcel });
    expect(card?.providerPricePence).toBe(305);
    expect(card?.buyerPricePence).toBe(320);
  });

  it("6–7. +15p exactly once · double margin invariant", () => {
    expect(BUYER_SHIPPING_MARGIN_PENCE).toBe(15);
    for (const p of [305, 304, 698, 441]) {
      const buyer = toBuyerShippingPricePence(p);
      expect(buyer - p).toBe(15);
    }
    const [card] = mapProviderQuotesToCheckoutOptions(
      [quote({ id: "x", carrier: "Evri", serviceName: "S", pricePence: 305 })],
      { parcel: parcelFor("small") },
    );
    expect(card!.buyerPricePence - card!.providerPricePence).toBe(15);
    expect(card!.price).toBe(3.2);
  });

  it("8–9. one card per carrier · InPost/DPD = 0 · max 2 cards", () => {
    const options = mapProviderQuotesToCheckoutOptions(buildMatrixQuotes(), {
      parcel: parcelFor("medium"),
    });
    expect(options).toHaveLength(2);
    expect(options.filter((o) => o.carrier === "Evri")).toHaveLength(1);
    expect(options.filter((o) => o.carrier === "Royal Mail")).toHaveLength(1);
    expect(options.filter((o) => o.carrier === "DPD")).toHaveLength(0);
    expect(options.filter((o) => /inpost/i.test(String(o.carrier)))).toHaveLength(0);
  });

  it("10–11. buyer can select carrier · order total updates", () => {
    const options = mapProviderQuotesToCheckoutOptions(buildMatrixQuotes(), {
      parcel: parcelFor("large"),
    });
    expect(resolveCheckoutDeliveryOptionId(options, "")).toBe("");
    const evri = options.find((o) => o.carrier === "Evri")!;
    const rm = options.find((o) => o.carrier === "Royal Mail")!;
    expect(resolveCheckoutDeliveryOptionId(options, rm.id)).toBe(rm.id);
    const a = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: evri }));
    const b = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: rm }));
    expect(a.delivery).toBe(evri.price);
    expect(b.delivery).toBe(rm.price);
    expect(a.total).not.toBe(b.total);
  });

  it("12–16. parcel SSOT · icons · no hardcoded production prices · no duplicate engine", () => {
    expect(CANONICAL_PARCEL_SIZES_V1).toHaveLength(3);
    expect(CANONICAL_PARCEL_SIZES_V1.map((r) => r.sellLabel)).toEqual([
      "SMALL",
      "MEDIUM",
      "LARGE",
    ]);

    expect(resolveCarrierIconSrc("Evri")).toBe(CARRIER_ICON_REGISTRY_V1.icons.Evri);
    expect(resolveCarrierIconSrc("Royal Mail")).toBe(CARRIER_ICON_REGISTRY_V1.icons["Royal Mail"]);
    expect(resolveCarrierIconSrc("DPD")).toBeNull();
    expect(resolveCarrierIconSrc("InPost")).toBeNull();

    const mapper = readFileSync("lib/checkout/map-provider-quotes-to-checkout-v1.ts", "utf8");
    expect(mapper).toContain("toBuyerShippingPricePence");
    expect(mapper).not.toMatch(/price:\s*3\.15|price:\s*3\.14|price:\s*7\.08/);
    expect(existsSync("lib/shipping/pricing/buyer-shipping-price-v2.ts")).toBe(false);
    expect(existsSync("lib/shipping/canonical-parcel-size-v2.ts")).toBe(false);

    const quotesServer = readFileSync("lib/checkout/shipping-quotes.server.ts", "utf8");
    expect(quotesServer).toContain("canonicalParcelMeasurements");
    expect(quotesServer).toContain("mapProviderQuotesToCheckoutOptions(pricing.quotes, { parcel })");
  });

  it("fail closed — missing weight envelope with parcel context → ineligible", () => {
    const bare = quote({
      id: "no-env",
      carrier: "Evri",
      serviceName: "EVRi",
      pricePence: 100,
    });
    delete (bare as { minWeightKg?: number }).minWeightKg;
    delete (bare as { maxWeightKg?: number }).maxWeightKg;
    expect(isCheckoutEligibleProviderQuote(bare, { parcel: parcelFor("small") })).toBe(false);
    expect(mapProviderQuotesToCheckoutOptions([bare], { parcel: parcelFor("small") })).toHaveLength(
      0,
    );
  });

  it("fail closed — missing provider price / unknown carrier", () => {
    expect(
      mapProviderQuotesToCheckoutOptions(
        [quote({ id: "fedex", carrier: "FedEx", serviceName: "X", pricePence: 100 })],
        { parcel: parcelFor("small") },
      ),
    ).toHaveLength(0);
    expect(
      isCheckoutEligibleProviderQuote(
        quote({ id: "nan", carrier: "Evri", serviceName: "X", pricePence: Number.NaN }),
        { parcel: parcelFor("small") },
      ),
    ).toBe(false);
  });

  it("tie break — equal provider price → deterministic stable id", () => {
    const parcel = parcelFor("small");
    const a = quote({
      id: "evri-b",
      carrier: "Evri",
      serviceName: "A",
      pricePence: 305,
      estimatedDays: { min: 2, max: 3 },
    });
    const b = quote({
      id: "evri-a",
      carrier: "Evri",
      serviceName: "B",
      pricePence: 305,
      estimatedDays: { min: 2, max: 3 },
    });
    expect(selectBestQuoteForCarrier([a, b], { parcel })?.id).toBe("evri-a");
  });
});

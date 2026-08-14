/**
 * Checkout Carrier Selection V1.0 — certification fixtures (TEST ONLY prices).
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
  mapProviderQuotesToCheckoutOptions,
  selectBestQuoteForCarrier,
} from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import {
  BUYER_SHIPPING_MARGIN_PENCE,
  toBuyerShippingPricePence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { resolveCarrierIconSrc, CARRIER_ICON_REGISTRY_V1 } from "@/lib/shipping/carrier-icons-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

function quote(
  overrides: Partial<ShippingQuote> &
    Pick<ShippingQuote, "id" | "carrier" | "serviceName" | "pricePence">,
): ShippingQuote {
  return {
    providerId: "sendcloud",
    currency: "GBP",
    estimatedDays: { min: 2, max: 3 },
    ...overrides,
  };
}

describe("Checkout Carrier Selection V1.0", () => {
  const mandatoryFixture = [
    quote({ id: "evri-305", carrier: "Evri", serviceName: "EVRi Standard", pricePence: 305 }),
    quote({ id: "evri-345", carrier: "Evri", serviceName: "EVRi Mid", pricePence: 345 }),
    quote({ id: "evri-386", carrier: "Evri", serviceName: "EVRi High", pricePence: 386 }),
    quote({ id: "rm-304", carrier: "Royal Mail", serviceName: "Tracked 48 - Small Parcel", pricePence: 304 }),
    quote({ id: "rm-388", carrier: "Royal Mail", serviceName: "Tracked 24", pricePence: 388 }),
    quote({ id: "rm-473", carrier: "Royal Mail", serviceName: "Special Delivery", pricePence: 473 }),
    quote({ id: "dpd-698", carrier: "DPD", serviceName: "Classic", pricePence: 698 }),
    quote({ id: "inpost-100", carrier: "InPost", serviceName: "Locker", pricePence: 100 }),
  ];

  it("1–3. cheapest eligible per active carrier · DPD/InPost hidden", () => {
    const options = mapProviderQuotesToCheckoutOptions(mandatoryFixture);
    expect(options).toHaveLength(2);
    const evri = options.find((o) => o.carrier === "Evri")!;
    const rm = options.find((o) => o.carrier === "Royal Mail")!;
    expect(evri.providerPricePence).toBe(305);
    expect(evri.buyerPricePence).toBe(315);
    expect(rm.providerPricePence).toBe(304);
    expect(rm.buyerPricePence).toBe(314);
    expect(options.filter((o) => o.carrier === "DPD")).toHaveLength(0);
  });

  it("4. ineligible cheapest → next cheapest eligible", () => {
    const options = mapProviderQuotesToCheckoutOptions(
      [
        quote({
          id: "rm-sp-cheap",
          carrier: "Royal Mail",
          serviceName: "Local Collect",
          pricePence: 100,
          shippingOptionCode: "royal_mailv2:servicepoint24",
          minWeightKg: 0,
          maxWeightKg: 30,
        }),
        quote({
          id: "rm-ok",
          carrier: "Royal Mail",
          serviceName: "Tracked 48 - Small Parcel",
          pricePence: 304,
          shippingOptionCode: "royal_mailv2:tracked_48/size=s",
          minWeightKg: 0,
          maxWeightKg: 30,
        }),
        quote({
          id: "evri-weight-miss",
          carrier: "Evri",
          serviceName: "EVRi 0–1kg",
          pricePence: 50,
          minWeightKg: 0,
          maxWeightKg: 1,
        }),
        quote({
          id: "evri-weight-ok",
          carrier: "Evri",
          serviceName: "EVRi 1–2kg",
          pricePence: 305,
          minWeightKg: 1,
          maxWeightKg: 2,
        }),
      ],
      { parcel: { weightKg: 2, lengthCm: 45, widthCm: 35, heightCm: 16 } },
    );

    expect(isCheckoutEligibleProviderQuote(mandatoryFixture[0]!)).toBe(true);
    expect(options.find((o) => o.carrier === "Royal Mail")?.id).toBe("rm-ok");
    expect(options.find((o) => o.carrier === "Evri")?.id).toBe("evri-weight-ok");
  });

  it("5–6. two carriers · one card each · InPost/DPD absent", () => {
    const options = mapProviderQuotesToCheckoutOptions(mandatoryFixture);
    expect(options.map((o) => o.carrier)).toEqual(["Evri", "Royal Mail"]);
    expect(options.filter((o) => /inpost|dpd/i.test(String(o.carrier)))).toHaveLength(0);
  });

  it("7. +10p exactly once", () => {
    expect(BUYER_SHIPPING_MARGIN_PENCE).toBe(10);
    expect(toBuyerShippingPricePence(304)).toBe(314);
    const [rm] = mapProviderQuotesToCheckoutOptions([
      quote({ id: "x", carrier: "Royal Mail", serviceName: "Tracked 48", pricePence: 304 }),
    ]);
    expect(rm!.buyerPricePence).toBe(314);
    expect(getDeliveryPrice({ selectedQuote: rm! })).toBe(3.14);
  });

  it("8–9. carrier change updates total", () => {
    const options = mapProviderQuotesToCheckoutOptions(mandatoryFixture);
    const rm = options.find((o) => o.carrier === "Royal Mail")!;
    const evri = options.find((o) => o.carrier === "Evri")!;
    const rmTotals = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: rm }));
    const evriTotals = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: evri }));
    expect(rmTotals.total).not.toBe(evriTotals.total);
  });

  it("10–12. no hardcoded prices · no forced Royal Mail", () => {
    const mapper = readFileSync("lib/checkout/map-provider-quotes-to-checkout-v1.ts", "utf8");
    expect(mapper).toContain("toBuyerShippingPricePence");
    expect(mapper).not.toMatch(/3\.14|3\.15|7\.08|price:\s*3\./);
    expect(existsSync("lib/shipping/pricing/buyer-shipping-price-v2.ts")).toBe(false);
    const options = mapProviderQuotesToCheckoutOptions(mandatoryFixture);
    expect(resolveCheckoutDeliveryOptionId(options, "")).toBe("");
  });

  it("13–16. icons · parcel SSOT · no generic truck", () => {
    expect(resolveCarrierIconSrc("Evri")).toBe(CARRIER_ICON_REGISTRY_V1.icons.Evri);
    expect(resolveCarrierIconSrc("Royal Mail")).toBe(CARRIER_ICON_REGISTRY_V1.icons["Royal Mail"]);
    expect(resolveCarrierIconSrc("DPD")).toBeNull();
    const iconUi = readFileSync("components/shipping/CarrierIcon.tsx", "utf8");
    expect(iconUi).toContain("<img");
    expect(iconUi).not.toMatch(/TruckLineIcon|🚚/);
  });

  it("missing price / unknown carrier fail closed", () => {
    expect(
      selectBestQuoteForCarrier([
        quote({ id: "bad", carrier: "Royal Mail", serviceName: "X", pricePence: Number.NaN }),
        quote({ id: "ok", carrier: "Royal Mail", serviceName: "Tracked 48", pricePence: 304 }),
      ])?.id,
    ).toBe("ok");
    expect(
      mapProviderQuotesToCheckoutOptions([
        quote({ id: "fedex", carrier: "FedEx", serviceName: "Express", pricePence: 100 }),
      ]),
    ).toHaveLength(0);
  });
});

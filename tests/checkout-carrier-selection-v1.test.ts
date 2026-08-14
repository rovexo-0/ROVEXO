/**
 * Checkout Carrier Selection v1.0 — EVRi + Royal Mail buyer choice.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import {
  getDeliveryPrice,
  pickDefaultShippingQuote,
  resolveCheckoutDeliveryOptionId,
} from "@/lib/checkout/delivery";
import { mapProviderQuotesToCheckoutOptions } from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import type { CheckoutCarrierQuote } from "@/lib/checkout/types";
import { resolveCarrierIconSrc, CARRIER_ICON_REGISTRY_V1 } from "@/lib/shipping/carrier-icons-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

function quote(
  overrides: Partial<ShippingQuote> &
    Pick<ShippingQuote, "id" | "carrier" | "serviceName" | "pricePence">,
): ShippingQuote {
  return {
    providerId: "sendcloud",
    currency: "GBP",
    estimatedDays: { min: 1, max: 2 },
    ...overrides,
  };
}

function optionsFrom(...rows: Array<Parameters<typeof quote>[0]>): CheckoutCarrierQuote[] {
  return mapProviderQuotesToCheckoutOptions(rows.map((row) => quote(row)));
}

describe("Checkout Carrier Selection v1.0", () => {
  const multi = optionsFrom(
    { id: "sendcloud:rm", carrier: "Royal Mail", serviceName: "Tracked 48 – Small Parcel", pricePence: 304 },
    { id: "sendcloud:evri", carrier: "Evri", serviceName: "Standard", pricePence: 200 },
    { id: "sendcloud:dpd", carrier: "DPD", serviceName: "Classic", pricePence: 50 },
  );

  it("TEST 1 — multiple eligible carriers displayed (DPD hidden)", () => {
    expect(multi.map((o) => o.carrier).sort()).toEqual(["Evri", "Royal Mail"]);
    expect(multi).toHaveLength(2);
  });

  it("TEST 2 — Royal Mail is NOT automatically forced when multiple exist", () => {
    expect(resolveCheckoutDeliveryOptionId(multi, "")).toBe("");
    expect(pickDefaultShippingQuote(multi)).toBeNull();
  });

  it("TEST 3–5 — buyer can select EVRi or Royal Mail", () => {
    const evri = multi.find((o) => o.carrier === "Evri")!;
    const rm = multi.find((o) => o.carrier === "Royal Mail")!;
    expect(resolveCheckoutDeliveryOptionId(multi, evri.id)).toBe(evri.id);
    expect(resolveCheckoutDeliveryOptionId(multi, rm.id)).toBe(rm.id);
  });

  it("TEST 6–7 — shipping price and order total update with selected carrier", () => {
    const rm = multi.find((o) => o.carrier === "Royal Mail")!;
    const evri = multi.find((o) => o.carrier === "Evri")!;
    const itemPrice = 10;
    const rmDelivery = getDeliveryPrice({ selectedQuote: rm });
    const evriDelivery = getDeliveryPrice({ selectedQuote: evri });
    expect(rmDelivery).toBe(rm.price);
    expect(evriDelivery).toBe(evri.price);
    expect(rmDelivery).not.toBe(evriDelivery);
    const rmTotals = calculateOrderTotals(itemPrice, rmDelivery);
    const evriTotals = calculateOrderTotals(itemPrice, evriDelivery);
    expect(rmTotals.total).not.toBe(evriTotals.total);
  });

  it("TEST 8–10 — single eligible option may be auto-selected", () => {
    const onlyRm = optionsFrom({
      id: "sendcloud:rm-only",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
      pricePence: 304,
    });
    const onlyEvri = optionsFrom({
      id: "sendcloud:evri-only",
      carrier: "Evri",
      serviceName: "Standard",
      pricePence: 200,
    });
    expect(resolveCheckoutDeliveryOptionId(onlyRm, "")).toBe("sendcloud:rm-only");
    expect(resolveCheckoutDeliveryOptionId(onlyEvri, "")).toBe("sendcloud:evri-only");
  });

  it("TEST 11 — InPost + DPD in provider data are not displayed", () => {
    const mapped = mapProviderQuotesToCheckoutOptions([
      quote({ id: "1", carrier: "InPost", serviceName: "Locker", pricePence: 99 }),
      quote({ id: "2", carrier: "Royal Mail", serviceName: "Tracked 48", pricePence: 304 }),
      quote({ id: "3", carrier: "DPD", serviceName: "Classic", pricePence: 388 }),
      quote({ id: "4", carrier: "Evri", serviceName: "Standard", pricePence: 200 }),
    ]);
    expect(mapped.every((o) => o.carrier !== "InPost" && o.carrier !== "DPD")).toBe(true);
    expect(mapped.map((o) => o.carrier).sort()).toEqual(["Evri", "Royal Mail"]);
  });

  it("TEST 12 — canonical carrier icons", () => {
    expect(resolveCarrierIconSrc("Royal Mail")).toBe(CARRIER_ICON_REGISTRY_V1.icons["Royal Mail"]);
    expect(resolveCarrierIconSrc("Evri")).toBe(CARRIER_ICON_REGISTRY_V1.icons.Evri);
    expect(resolveCarrierIconSrc("DPD")).toBeNull();
  });

  it("TEST 13 — no eligible carriers → empty selection", () => {
    expect(resolveCheckoutDeliveryOptionId([], "sendcloud:any")).toBe("");
    expect(pickDefaultShippingQuote([])).toBeNull();
  });

  it("TEST 16–18 — no hardcoded prices · no duplicate engines", () => {
    const wizard = readFileSync("features/checkout/components/CheckoutWizardV1.tsx", "utf8");
    expect(wizard).not.toMatch(/£2\.10|£3\.14|£3\.98/);
    expect(wizard).toContain("CarrierIcon");
    expect(existsSync("lib/shipping/pricing/buyer-shipping-price-v1.ts")).toBe(true);
    expect(existsSync("lib/shipping/pricing/buyer-shipping-price-v2.ts")).toBe(false);
  });

  it("TEST 20 — InPost customer-facing references remain zero in Checkout wizard/delivery UI", () => {
    const wizard = readFileSync("features/checkout/components/CheckoutWizardV1.tsx", "utf8");
    const delivery = readFileSync("features/checkout/components/CheckoutDeliverySection.tsx", "utf8");
    expect(wizard).not.toMatch(/InPost|inpost/);
    expect(delivery).not.toMatch(/InPost|inpost/);
  });
});

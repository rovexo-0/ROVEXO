/**
 * Checkout Carrier Grouping v1.0 — one card per active carrier · best quote.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import {
  getDeliveryPrice,
  resolveCheckoutDeliveryOptionId,
} from "@/lib/checkout/delivery";
import {
  groupCheckoutQuotesByCarrier,
  mapProviderQuotesToCheckoutOptions,
  selectBestQuoteForCarrier,
} from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import { resolveCarrierIconSrc, CARRIER_ICON_REGISTRY_V1 } from "@/lib/shipping/carrier-icons-v1";
import {
  resolveV1_0CarrierGroupCode,
  V1_0_CARRIER_GROUP_CODE,
} from "@/lib/shipping/v1-0-carrier-whitelist-v1";
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

function many(carrier: string, count: number, basePence: number): ShippingQuote[] {
  return Array.from({ length: count }, (_, i) =>
    quote({
      id: `sendcloud:${carrier.replace(/\s+/g, "").toLowerCase()}:${i}`,
      carrier,
      serviceName: `${carrier} Service ${i + 1}`,
      pricePence: basePence + i * 10,
      estimatedDays: { min: 1 + (i % 4), max: 2 + (i % 4) },
    }),
  );
}

describe("Checkout Carrier Grouping v1.0", () => {
  it("groups many provider quotes into one card per active carrier · DPD/InPost = 0", () => {
    const quotes = [
      ...many("Royal Mail", 10, 300),
      ...many("DPD", 20, 700),
      ...many("Evri", 10, 400),
      ...many("InPost", 12, 100),
    ];
    const options = mapProviderQuotesToCheckoutOptions(quotes);
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.carrier)).toEqual(["Evri", "Royal Mail"]);
    expect(options.every((o) => o.carrier !== "InPost" && o.carrier !== "DPD")).toBe(true);

    const groups = groupCheckoutQuotesByCarrier(quotes);
    expect(groups.get("Royal Mail")).toHaveLength(10);
    expect(groups.get("Evri")).toHaveLength(10);
    expect(groups.has("DPD" as never)).toBe(false);
  });

  it("selects lowest provider price for EVRi", () => {
    const options = mapProviderQuotesToCheckoutOptions([
      quote({ id: "e-a", carrier: "Evri", serviceName: "A", pricePence: 2000 }),
      quote({ id: "e-b", carrier: "Evri", serviceName: "B", pricePence: 305 }),
      quote({ id: "e-c", carrier: "Evri", serviceName: "C", pricePence: 1000 }),
    ]);
    expect(options).toHaveLength(1);
    expect(options[0]!.carrier).toBe("Evri");
    expect(options[0]!.providerPricePence).toBe(305);
    expect(options[0]!.buyerPricePence).toBe(315);
  });

  it("equal provider price → shorter delivery · then deterministic id", () => {
    const slower = quote({
      id: "rm-z",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
      pricePence: 304,
      estimatedDays: { min: 3, max: 5 },
    });
    const faster = quote({
      id: "rm-a",
      carrier: "Royal Mail",
      serviceName: "Tracked 24",
      pricePence: 304,
      estimatedDays: { min: 1, max: 2 },
    });
    const best = selectBestQuoteForCarrier([slower, faster]);
    expect(best?.id).toBe("rm-a");
  });

  it("group codes · icons · buyer selection", () => {
    expect(V1_0_CARRIER_GROUP_CODE.Evri).toBe("EVRI");
    expect(V1_0_CARRIER_GROUP_CODE["Royal Mail"]).toBe("ROYAL_MAIL");
    expect(resolveV1_0CarrierGroupCode("DPD")).toBeNull();
    expect(resolveCarrierIconSrc("Evri")).toBe(CARRIER_ICON_REGISTRY_V1.icons.Evri);
    expect(resolveCarrierIconSrc("Royal Mail")).toBe(CARRIER_ICON_REGISTRY_V1.icons["Royal Mail"]);
    expect(resolveCarrierIconSrc("DPD")).toBeNull();

    const options = mapProviderQuotesToCheckoutOptions([
      ...many("Royal Mail", 3, 300),
      ...many("Evri", 3, 400),
      ...many("DPD", 3, 698),
    ]);
    expect(resolveCheckoutDeliveryOptionId(options, "")).toBe("");
    const rm = options.find((o) => o.carrier === "Royal Mail")!;
    const evri = options.find((o) => o.carrier === "Evri")!;
    expect(resolveCheckoutDeliveryOptionId(options, evri.id)).toBe(evri.id);
    const a = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: rm }));
    const b = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: evri }));
    expect(a.total).not.toBe(b.total);
    expect(existsSync("lib/checkout/map-provider-quotes-to-checkout-v1.ts")).toBe(true);
    expect(readFileSync("lib/shipping/v1-0-carrier-whitelist-v1.ts", "utf8")).toContain(
      "DEFERRED_V1_1",
    );
  });
});

/**
 * ROVEXO v1.0 — carrier cleanup + checkout buyer pricing (+15p) + icons.
 * ACTIVE: EVRi · Royal Mail · HIDDEN: DPD · InPost
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { CHECKOUT_CARRIERS, getDeliveryPrice } from "@/lib/checkout/delivery";
import { mapProviderQuotesToCheckoutOptions } from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import {
  BUYER_SHIPPING_MARGIN_PENCE,
  toBuyerShippingPricePence,
  penceToGbpMajor,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { resolveCarrierIconSrc, CARRIER_ICON_REGISTRY_V1 } from "@/lib/shipping/carrier-icons-v1";
import {
  V1_0_ACTIVE_CARRIERS,
  V1_0_HIDDEN_CARRIERS,
  filterV1_0CustomerFacingQuotes,
  isV1_0ActiveCarrier,
  isV1_0HiddenCarrier,
  formatV1_0CarrierDisplayName,
} from "@/lib/shipping/v1-0-carrier-whitelist-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

function quote(
  overrides: Partial<ShippingQuote> & Pick<ShippingQuote, "id" | "carrier" | "serviceName" | "pricePence">,
): ShippingQuote {
  return {
    providerId: "sendcloud",
    currency: "GBP",
    estimatedDays: { min: 1, max: 2 },
    ...overrides,
  };
}

describe("v1.0 carrier whitelist", () => {
  it("keeps EVRi + Royal Mail active · DPD hidden", () => {
    expect([...V1_0_ACTIVE_CARRIERS]).toEqual(["Evri", "Royal Mail"]);
    expect(CHECKOUT_CARRIERS).toEqual(["Evri", "Royal Mail"]);
    expect(isV1_0ActiveCarrier("Evri")).toBe(true);
    expect(isV1_0ActiveCarrier("Royal Mail")).toBe(true);
    expect(isV1_0ActiveCarrier("DPD")).toBe(false);
    expect(isV1_0HiddenCarrier("DPD")).toBe(true);
  });

  it("hides InPost + DPD from v1.0 customer-facing lists", () => {
    expect([...V1_0_HIDDEN_CARRIERS].sort()).toEqual(["DPD", "InPost"]);
    expect(isV1_0HiddenCarrier("InPost")).toBe(true);
    expect(isV1_0ActiveCarrier("InPost")).toBe(false);
    expect(CHECKOUT_CARRIERS).not.toContain("InPost");
    expect(CHECKOUT_CARRIERS).not.toContain("DPD");
  });

  it("cannot resurface InPost/DPD via fallback / mixed quote lists", () => {
    const mixed = [
      quote({ id: "sendcloud:1", carrier: "Evri", serviceName: "A2A", pricePence: 200 }),
      quote({ id: "sendcloud:2", carrier: "InPost", serviceName: "Locker", pricePence: 100 }),
      quote({ id: "sendcloud:3", carrier: "Royal Mail", serviceName: "Tracked 48", pricePence: 304 }),
      quote({ id: "sendcloud:4", carrier: "FedEx", serviceName: "Express", pricePence: 900 }),
      quote({ id: "sendcloud:5", carrier: "DPD", serviceName: "Classic", pricePence: 388 }),
    ];
    const filtered = filterV1_0CustomerFacingQuotes(mixed);
    expect(filtered.every((q) => q.carrier !== "InPost")).toBe(true);
    expect(filtered.every((q) => q.carrier !== "DPD")).toBe(true);
    expect(filtered.map((q) => q.carrier).sort()).toEqual(["Evri", "Royal Mail"]);

    const options = mapProviderQuotesToCheckoutOptions(mixed);
    expect(options.every((o) => o.carrier !== "InPost")).toBe(true);
    expect(options.every((o) => o.carrier !== "DPD")).toBe(true);
    expect(options.map((o) => o.carrier)).toEqual(["Evri", "Royal Mail"]);
  });
});

describe("v1.0 buyer shipping price (integer pence)", () => {
  it("uses +15 pence margin and integer pence only", () => {
    expect(BUYER_SHIPPING_MARGIN_PENCE).toBe(15);
    expect(toBuyerShippingPricePence(200)).toBe(215);
    expect(toBuyerShippingPricePence(304)).toBe(319);
    expect(toBuyerShippingPricePence(388)).toBe(403);
    expect(penceToGbpMajor(215)).toBe(2.15);
    expect(penceToGbpMajor(319)).toBe(3.19);
    expect(penceToGbpMajor(403)).toBe(4.03);

    const src = readFileSync("lib/shipping/pricing/buyer-shipping-price-v1.ts", "utf8");
    expect(src).not.toMatch(/\*\s*0\.\d+/);
    expect(src).toContain("Math.trunc");
  });

  it("maps provider quotes to buyer prices without hardcoding display amounts", () => {
    const options = mapProviderQuotesToCheckoutOptions([
      quote({ id: "sendcloud:a", carrier: "Royal Mail", serviceName: "Tracked 24", pricePence: 200 }),
      quote({ id: "sendcloud:b", carrier: "Royal Mail", serviceName: "Tracked 48", pricePence: 304 }),
      quote({ id: "sendcloud:c", carrier: "Evri", serviceName: "Standard", pricePence: 388 }),
      quote({ id: "sendcloud:d", carrier: "DPD", serviceName: "Classic", pricePence: 50 }),
    ]);
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.carrier)).toEqual(["Evri", "Royal Mail"]);
    expect(options.find((o) => o.carrier === "Royal Mail")!.price).toBe(2.15);
    expect(options.find((o) => o.carrier === "Evri")!.price).toBe(4.03);

    const shippingQuotesSrc = readFileSync("lib/checkout/map-provider-quotes-to-checkout-v1.ts", "utf8");
    expect(shippingQuotesSrc).not.toMatch(/2\.10|3\.14|3\.98/);
    expect(shippingQuotesSrc).toContain("toBuyerShippingPricePence");
    expect(shippingQuotesSrc).toContain("selectBestQuoteForCarrier");
  });

  it("keeps checkout display price equal to getDeliveryPrice / order bridge", () => {
    const [option] = mapProviderQuotesToCheckoutOptions([
      quote({ id: "sendcloud:x", carrier: "Evri", serviceName: "Standard", pricePence: 200 }),
    ]);
    expect(option).toBeDefined();
    const delivery = getDeliveryPrice({
      selectedQuote: option!,
      listingShippingPrice: 9.99,
    });
    expect(delivery).toBe(option!.price);
    expect(delivery).toBe(2.15);
    expect(Math.round((delivery ?? 0) * 100)).toBe(option!.buyerPricePence);
  });
});

describe("v1.0 carrier icons", () => {
  it("resolves Royal Mail + EVRi icons · DPD/InPost not customer-facing", () => {
    expect(resolveCarrierIconSrc("Royal Mail")).toBe(CARRIER_ICON_REGISTRY_V1.icons["Royal Mail"]);
    expect(resolveCarrierIconSrc("Evri")).toBe(CARRIER_ICON_REGISTRY_V1.icons.Evri);
    expect(resolveCarrierIconSrc("DPD")).toBeNull();
    expect(resolveCarrierIconSrc("InPost")).toBeNull();

    for (const src of Object.values(CARRIER_ICON_REGISTRY_V1.icons)) {
      expect(existsSync(resolve(process.cwd(), `public${src}`))).toBe(true);
    }

    const ui = readFileSync("features/checkout/components/CheckoutDeliverySection.tsx", "utf8");
    expect(ui).toContain("CarrierIcon");
    expect(ui).not.toMatch(/Truck|🚚/);
  });

  it("formats EVRi display name", () => {
    expect(formatV1_0CarrierDisplayName("Evri")).toBe("EVRi");
    expect(formatV1_0CarrierDisplayName("Royal Mail")).toBe("Royal Mail");
  });
});

describe("v1.0 regressions — engine singularity", () => {
  it("does not create a second pricing or shipping engine", () => {
    expect(existsSync("lib/shipping/pricing/buyer-shipping-price-v1.ts")).toBe(true);
    expect(existsSync("lib/shipping/pricing/buyer-shipping-price-v2.ts")).toBe(false);
    expect(existsSync("lib/shipping/v1-0-carrier-whitelist-v2.ts")).toBe(false);
    const service = readFileSync("lib/shipping/sendcloud/service.ts", "utf8");
    expect(service).toContain("announceSendcloudShipmentV3");
    expect(service).toContain("generateLabel");
  });

  it("retains DPD + InPost technical foundations", () => {
    expect(existsSync("lib/shipping/sendcloud/dpd-label-engine-certification-v1.ts")).toBe(true);
    expect(existsSync("lib/shipping/sendcloud/inpost-label-engine-certification-v1.ts")).toBe(true);
  });
});

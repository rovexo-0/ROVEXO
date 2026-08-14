/**
 * Checkout carrier price + icon audit certification v1.0.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import { getDeliveryPrice } from "@/lib/checkout/delivery";
import { mapProviderQuotesToCheckoutOptions } from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import {
  BUYER_SHIPPING_MARGIN_PENCE,
  penceToGbpMajor,
  toBuyerShippingPricePence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { CARRIER_ICON_REGISTRY_V1, resolveCarrierIconSrc } from "@/lib/shipping/carrier-icons-v1";
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

describe("Checkout carrier price + icon audit v1.0", () => {
  it("margin is exactly +10p · no double margin · fixture proofs", () => {
    expect(BUYER_SHIPPING_MARGIN_PENCE).toBe(10);
    expect(toBuyerShippingPricePence(200)).toBe(210);
    expect(penceToGbpMajor(210)).toBe(2.1);
    expect(toBuyerShippingPricePence(304)).toBe(314);
    expect(penceToGbpMajor(314)).toBe(3.14);
    expect(toBuyerShippingPricePence(698)).toBe(708);
    expect(penceToGbpMajor(708)).toBe(7.08);
    expect(toBuyerShippingPricePence(388)).toBe(398);
    expect(penceToGbpMajor(398)).toBe(3.98);
    // applying once only
    expect(toBuyerShippingPricePence(toBuyerShippingPricePence(200) - 10)).toBe(210);
  });

  it("multi-quote → one card · cheapest provider · buyer = provider + 10 · DPD/InPost hidden", () => {
    const options = mapProviderQuotesToCheckoutOptions([
      quote({ id: "rm-a", carrier: "Royal Mail", serviceName: "Tracked 48", pricePence: 304 }),
      quote({ id: "rm-b", carrier: "Royal Mail", serviceName: "Tracked 24", pricePence: 448 }),
      quote({ id: "rm-c", carrier: "Royal Mail", serviceName: "Special Delivery", pricePence: 531 }),
      quote({ id: "dpd-a", carrier: "DPD", serviceName: "Classic", pricePence: 698 }),
      quote({ id: "dpd-b", carrier: "DPD", serviceName: "Express", pricePence: 1451 }),
      quote({ id: "dpd-c", carrier: "DPD", serviceName: "Next Day", pricePence: 1893 }),
      quote({ id: "evri-a", carrier: "Evri", serviceName: "Standard", pricePence: 441 }),
      quote({ id: "evri-b", carrier: "Evri", serviceName: "Next Day", pricePence: 483 }),
      quote({ id: "evri-c", carrier: "Evri", serviceName: "Premium", pricePence: 504 }),
      quote({ id: "inpost-a", carrier: "InPost", serviceName: "Locker", pricePence: 100 }),
    ]);

    expect(options).toHaveLength(2);
    expect(options.filter((o) => o.carrier === "InPost")).toHaveLength(0);
    expect(options.filter((o) => o.carrier === "DPD")).toHaveLength(0);

    const rm = options.find((o) => o.carrier === "Royal Mail")!;
    const evri = options.find((o) => o.carrier === "Evri")!;

    expect(rm.providerPricePence).toBe(304);
    expect(rm.buyerPricePence).toBe(314);
    expect(rm.price).toBe(3.14);
    expect(rm.serviceName).toBe("Tracked 48");
    expect(rm.id).toBe("rm-a");

    expect(evri.providerPricePence).toBe(441);
    expect(evri.buyerPricePence).toBe(451);
    expect(evri.price).toBe(4.51);
    expect(evri.serviceName).toBe("Standard");

    expect(getDeliveryPrice({ selectedQuote: evri })).toBe(4.51);
    expect(calculateOrderTotals(10, 4.51).delivery).toBe(4.51);
    expect(calculateOrderTotals(10, 3.14).total).not.toBe(calculateOrderTotals(10, 4.51).total);
  });

  it("canonical brand icon assets exist and are not placeholder/truck", () => {
    expect(Object.keys(CARRIER_ICON_REGISTRY_V1.icons).sort()).toEqual(["Evri", "Royal Mail"]);
    for (const [carrier, src] of Object.entries(CARRIER_ICON_REGISTRY_V1.icons)) {
      expect(resolveCarrierIconSrc(carrier)).toBe(src);
      const abs = resolve(process.cwd(), `public${src}`);
      expect(existsSync(abs), abs).toBe(true);
      const svg = readFileSync(abs, "utf8");
      expect(svg).toMatch(/<svg[\s>]/i);
      expect(svg).not.toMatch(/Truck|parcel icon|generic/i);
      expect(svg.length).toBeGreaterThan(400);
    }

    const rm = readFileSync("public/icons/carriers/royal-mail.svg", "utf8");
    const evri = readFileSync("public/icons/carriers/evri.svg", "utf8");
    expect(rm).toMatch(/Royal Mail/i);
    expect(evri).toMatch(/Evri|EVRi/i);
    expect(resolveCarrierIconSrc("DPD")).toBeNull();
    expect(resolveCarrierIconSrc("InPost")).toBeNull();
    // Technical assets retained (not customer-facing)
    expect(existsSync("public/icons/carriers/dpd.svg")).toBe(true);
  });

  it("CarrierIcon renders registry SVG via plain img · not SafeImage/next/image", () => {
    const ui = readFileSync("components/shipping/CarrierIcon.tsx", "utf8");
    expect(ui).toContain("resolveCarrierIconSrc");
    expect(ui).toContain("<img");
    expect(ui).not.toContain("SafeImage");
    expect(ui).not.toContain('from "next/image"');
    expect(ui).not.toMatch(/TruckLineIcon|🚚/);

    const wizard = readFileSync("features/checkout/components/CheckoutWizardV1.tsx", "utf8");
    expect(wizard).toContain("CarrierIcon");
    expect(wizard).not.toMatch(/InPost|inpost/);
  });

  it("price path does not invent hardcoded buyer display amounts in mapper", () => {
    const mapper = readFileSync("lib/checkout/map-provider-quotes-to-checkout-v1.ts", "utf8");
    expect(mapper).toContain("toBuyerShippingPricePence");
    expect(mapper).toContain("selectBestQuoteForCarrier");
    expect(mapper).not.toMatch(/2\.10|3\.14|4\.51|7\.08/);
    expect(existsSync("lib/shipping/pricing/buyer-shipping-price-v2.ts")).toBe(false);
    expect(existsSync("lib/shipping/canonical-parcel-size-v1.ts")).toBe(true);
  });
});

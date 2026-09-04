/**
 * Buyer shipping markup v2 — provider + £0.15 once.
 * Internal label platform fee removed from production write/read.
 * No DB mutation. No Sendcloud/Stripe mutation.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { getDeliveryPrice } from "@/lib/checkout/delivery";
import { mapProviderQuotesToCheckoutOptions } from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import { calculateOrderTotals, PLATFORM_FEE_RATE } from "@/lib/orders/pricing";
import {
  CANONICAL_PARCEL_SIZES_V1,
  canonicalParcelMeasurements,
} from "@/lib/shipping/canonical-parcel-size-v1";
import {
  BUYER_SHIPPING_MARGIN_PENCE,
  toBuyerShippingPricePence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { generateShippingLabel } from "@/lib/shipping/labels/service.server";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
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

function parcel(id: "small" | "medium" | "large") {
  return canonicalParcelMeasurements(CANONICAL_PARCEL_SIZES_V1.find((d) => d.id === id)!);
}

describe("Buyer shipping markup v2 + internal label fee removed", () => {
  it("1–3. Sendcloud £X → buyer £X + £0.15 exactly once · £0.10 gone", () => {
    expect(BUYER_SHIPPING_MARGIN_PENCE).toBe(15);
    // Margin is per label — never multiplies by item quantity.
    expect(toBuyerShippingPricePence(305)).toBe(320);
    expect(toBuyerShippingPricePence(304)).toBe(319);
    expect(toBuyerShippingPricePence(toBuyerShippingPricePence(305) - 15)).toBe(320);

    const src = readFileSync("lib/shipping/pricing/buyer-shipping-price-v1.ts", "utf8");
    expect(src).toContain("BUYER_SHIPPING_MARGIN_PENCE = 15");
    expect(src).toContain("per_label_not_per_item");
    expect(src).not.toMatch(/BUYER_SHIPPING_MARGIN_PENCE\s*=\s*10\b/);
  });

  it("4–5. INTERNAL_LABEL_PLATFORM_FEE_PENCE gone · label generation writes 0", async () => {
    expect(existsSync("lib/shipping/labels/fee.ts")).toBe(false);
    const labelService = readFileSync("lib/shipping/labels/service.server.ts", "utf8");
    expect(labelService).not.toContain("applyInternalLabelFee");
    expect(labelService).not.toContain("INTERNAL_LABEL_PLATFORM_FEE_PENCE");
    expect(labelService).toContain("internalPlatformFeePence: 0");

    const attach = readFileSync("lib/shipping/parcels-repository.ts", "utf8");
    expect(attach).not.toMatch(/internal_platform_fee_pence\s*:/);

    const result = await generateShippingLabel({
      quoteId: "quote-markup-v2",
      orderId: "order-markup-v2",
      orderNumber: "RVXMARKUP",
      parcelTier: "medium_parcel",
      collectionAddress: {
        role: "collection",
        fullName: "Jane Seller",
        line1: "10 Downing Street",
        city: "London",
        postcode: "SW1A 2AA",
        country: "United Kingdom",
        validated: false,
      },
      deliveryAddress: {
        role: "delivery",
        fullName: "John Buyer",
        line1: "1 Test Street",
        city: "London",
        postcode: "E1 6AN",
        country: "United Kingdom",
        validated: false,
      },
    });
    expect(result.internalPlatformFeePence).toBe(0);
  });

  it("6–8. seller payout unchanged · 5.5% item-only · Total Pay includes +£0.15", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.055);
    const { platformFee, sellerAmount } = calculateSellerNetAmount(10);
    expect(sellerAmount).toBe(10);
    expect(platformFee).toBe(0.55);

    const [rm] = mapProviderQuotesToCheckoutOptions([
      quote({ id: "rm", carrier: "Royal Mail", serviceName: "Tracked 48", pricePence: 304 }),
    ]);
    expect(rm!.providerPricePence).toBe(304);
    expect(rm!.buyerPricePence).toBe(319);
    expect(getDeliveryPrice({ selectedQuote: rm! })).toBe(3.19);

    const totals = calculateOrderTotals(10, getDeliveryPrice({ selectedQuote: rm! }));
    expect(totals.itemPrice).toBe(10);
    expect(totals.platformFee).toBe(0.55);
    expect(totals.delivery).toBe(3.19);
    expect(totals.total).toBe(13.74);
  });

  it("9–13. Small / Medium / Large · Evri / Royal Mail each get +15p once", () => {
    for (const size of ["small", "medium", "large"] as const) {
      const options = mapProviderQuotesToCheckoutOptions(
        [
          quote({ id: `${size}-e`, carrier: "Evri", serviceName: "Std", pricePence: 305 }),
          quote({ id: `${size}-r`, carrier: "Royal Mail", serviceName: "T48", pricePence: 304 }),
        ],
        { parcel: parcel(size) },
      );
      const evri = options.find((o) => o.carrier === "Evri")!;
      const rm = options.find((o) => o.carrier === "Royal Mail")!;
      expect(evri.providerPricePence).toBe(305);
      expect(evri.buyerPricePence).toBe(320);
      expect(rm.providerPricePence).toBe(304);
      expect(rm.buyerPricePence).toBe(319);
      expect(evri.buyerPricePence - evri.providerPricePence).toBe(15);
      expect(rm.buyerPricePence - rm.providerPricePence).toBe(15);
    }
  });

  it("14–16. no historical label rewrite · no Sendcloud price mutation · no Stripe mutation", () => {
    const attach = readFileSync("lib/shipping/parcels-repository.ts", "utf8");
    expect(attach).not.toMatch(/internal_platform_fee_pence\s*:/);
    expect(attach).not.toMatch(/\.update\([\s\S]*internal_platform_fee_pence/);

    const mapper = readFileSync("lib/shipping/pricing/sendcloud-mappers.ts", "utf8");
    expect(mapper).toContain("pricePence: Math.round(price * 100)");
    expect(mapper).not.toContain("toBuyerShippingPricePence");
    expect(mapper).not.toContain("BUYER_SHIPPING_MARGIN_PENCE");

    const stripePayouts = readFileSync("lib/stripe/payouts.ts", "utf8");
    expect(stripePayouts).not.toContain("BUYER_SHIPPING_MARGIN_PENCE");
    expect(stripePayouts).not.toContain("INTERNAL_LABEL_PLATFORM_FEE");
    expect(existsSync("lib/shipping/labels/fee.ts")).toBe(false);
  });
});

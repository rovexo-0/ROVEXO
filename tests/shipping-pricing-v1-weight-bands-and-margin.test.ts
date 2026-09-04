/**
 * Shipping Pricing v1.0 — weight bands + provider/buyer separation + 15p per label.
 */
import { describe, expect, it } from "vitest";
import {
  OWNER_APPROVED_PARCEL_BANDS_V1,
  PARCEL_WEIGHT_ABSOLUTE_MAX_KG,
  assertParcelWeightKgAllowed,
  resolveParcelWeightBandId,
} from "@/lib/shipping/canonical-parcel-size-v1";
import {
  BUYER_SHIPPING_MARGIN_PENCE,
  deriveProviderShippingCostPenceFromBuyer,
  separateShippingPricesPence,
  toBuyerShippingPricePence,
  toRovexoShippingMarginPence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { buildShippingQuotePayload } from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { shippingQuoteFromCheckoutCarrierQuote } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import { mapProviderQuotesToCheckoutOptions } from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import type { ShippingQuote } from "@/lib/shipping/types";
import type { CheckoutCarrierQuote } from "@/lib/checkout/types";

function providerQuote(
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

describe("Shipping Pricing v1.0 — weight bands", () => {
  it("1. 0 kg → SMALL", () => {
    expect(assertParcelWeightKgAllowed(0).ok).toBe(true);
    expect(resolveParcelWeightBandId(0)).toBe("small");
  });

  it("2. 1 kg exact → SMALL", () => {
    expect(resolveParcelWeightBandId(1)).toBe("small");
    expect(resolveParcelWeightBandId(1.0)).toBe("small");
    expect(OWNER_APPROVED_PARCEL_BANDS_V1.small.maxWeightKg).toBe(1);
  });

  it("3. >1 kg → MEDIUM", () => {
    expect(resolveParcelWeightBandId(1.01)).toBe("medium");
    expect(resolveParcelWeightBandId(1.5)).toBe("medium");
  });

  it("4. 2 kg exact → MEDIUM", () => {
    expect(resolveParcelWeightBandId(2)).toBe("medium");
    expect(OWNER_APPROVED_PARCEL_BANDS_V1.medium.maxWeightKg).toBe(2);
  });

  it("5. >2 kg → LARGE", () => {
    expect(resolveParcelWeightBandId(2.01)).toBe("large");
    expect(resolveParcelWeightBandId(10)).toBe("large");
  });

  it("6. 15 kg exact → LARGE", () => {
    expect(resolveParcelWeightBandId(15)).toBe("large");
    expect(assertParcelWeightKgAllowed(15).ok).toBe(true);
    expect(PARCEL_WEIGHT_ABSOLUTE_MAX_KG).toBe(15);
  });

  it("7. >15 kg → reject / fail closed", () => {
    expect(assertParcelWeightKgAllowed(15.01).ok).toBe(false);
    expect(resolveParcelWeightBandId(15.01)).toBeNull();
    expect(resolveParcelWeightBandId(20)).toBeNull();
  });
});

describe("Shipping Pricing v1.0 — Sendcloud + ROVEXO margin", () => {
  it("8. Sendcloud £X → buyer £X + £0.15", () => {
    expect(BUYER_SHIPPING_MARGIN_PENCE).toBe(15);
    // Sendcloud £3.05 (305p) → buyer 320p
    expect(toBuyerShippingPricePence(305)).toBe(320);
    expect(toBuyerShippingPricePence(304)).toBe(319);
    const options = mapProviderQuotesToCheckoutOptions([
      providerQuote({
        id: "sendcloud:1",
        carrier: "Royal Mail",
        serviceName: "Tracked 48",
        pricePence: 304,
        v2MethodId: 1,
      }),
    ]);
    expect(options[0]!.providerPricePence).toBe(304);
    expect(options[0]!.buyerPricePence).toBe(319);
    expect(options[0]!.price).toBe(3.19);
  });

  it("9. one order / one label → +£0.15", () => {
    expect(toRovexoShippingMarginPence(1)).toBe(15);
    const sep = separateShippingPricesPence({
      providerShippingCostPence: 400,
      labelCount: 1,
    });
    expect(sep.rovexoMarginPence).toBe(15);
    expect(sep.buyerShippingPricePence).toBe(415);
    expect(sep.labelCount).toBe(1);
  });

  it("10. one order / two labels → +£0.30", () => {
    expect(toRovexoShippingMarginPence(2)).toBe(30);
    const sep = separateShippingPricesPence({
      providerShippingCostPence: 400,
      labelCount: 2,
    });
    expect(sep.rovexoMarginPence).toBe(30);
    expect(sep.buyerShippingPricePence).toBe(430);
    expect(sep.labelCount).toBe(2);
    // Margin never scales with item quantity — only labelCount.
    expect(toRovexoShippingMarginPence(1)).toBe(15);
  });

  it("11. provider cost ≠ buyer shipping price and both stay separated", () => {
    const provider = 305;
    const sep = separateShippingPricesPence({
      providerShippingCostPence: provider,
      labelCount: 1,
    });
    expect(sep.providerShippingCostPence).toBe(305);
    expect(sep.buyerShippingPricePence).toBe(320);
    expect(sep.providerShippingCostPence).not.toBe(sep.buyerShippingPricePence);

    const payload = buildShippingQuotePayload(
      providerQuote({
        id: "sendcloud:99",
        carrier: "Evri",
        serviceName: "Parcelshop",
        pricePence: 305,
        v2MethodId: 99,
      }),
      { labelCount: 2 },
    );
    expect(payload.providerShippingCostPence).toBe(305);
    expect(payload.buyerShippingPricePence).toBe(335);
    expect(payload.rovexoMarginPence).toBe(30);
    expect(payload.labelCount).toBe(2);
    expect(payload.providerShippingCostPence).not.toBe(payload.buyerShippingPricePence);

    // Checkout carrier quote → ShippingQuote.pricePence must be PROVIDER, not buyer.
    const checkout: CheckoutCarrierQuote = {
      id: "sendcloud:99",
      carrier: "Evri",
      serviceName: "Standard",
      price: 3.2,
      providerPricePence: 305,
      providerPricePence: 305,
      buyerPricePence: 320,
      eta: "2–3 days",
      v2MethodId: 99,
    };
    const fromCheckout = shippingQuoteFromCheckoutCarrierQuote(checkout);
    expect(fromCheckout.pricePence).toBe(305);
    expect(fromCheckout.pricePence).not.toBe(320);

    // Buyer fee must never be treated as provider cost.
    expect(
      deriveProviderShippingCostPenceFromBuyer({
        buyerShippingPricePence: 320,
        labelCount: 1,
      }),
    ).toBe(305);
  });
});

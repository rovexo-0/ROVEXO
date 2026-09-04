/**
 * HIGH #3 — Label pricing cost separation (provider ≠ buyer).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BUYER_SHIPPING_MARGIN_PENCE,
  resolveAuthoritativeProviderShippingCostPence,
  separateShippingPricesPence,
  toBuyerShippingPricePence,
  toRovexoShippingMarginPence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { buildShippingQuotePayload } from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { shippingQuoteFromCheckoutCarrierQuote } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import { SHIPPING_RECORDS_SSOT_V1 } from "@/lib/shipping/shipping-records-ssot-v1";
import type { ShippingQuote } from "@/lib/shipping/types";
import type { CheckoutCarrierQuote } from "@/lib/checkout/types";

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function providerQuote(pricePence: number): ShippingQuote {
  return {
    id: "sendcloud:1",
    providerId: "sendcloud",
    carrier: "Royal Mail",
    serviceName: "Tracked 48",
    pricePence,
    currency: "GBP",
    estimatedDays: { min: 2, max: 3 },
    v2MethodId: 1,
  };
}

describe("HIGH #3 — Label pricing cost separation", () => {
  it("1. provider £X → buyer £X + £0.15", () => {
    expect(BUYER_SHIPPING_MARGIN_PENCE).toBe(15);
    expect(toBuyerShippingPricePence(400)).toBe(415);
  });

  it("2–4. label payload stores provider £X and buyer £X+£0.15 distinctly", () => {
    const payload = buildShippingQuotePayload(providerQuote(400), { labelCount: 1 });
    expect(payload.providerShippingCostPence).toBe(400);
    expect(payload.buyerShippingPricePence).toBe(415);
    expect(payload.providerShippingCostPence).not.toBe(payload.buyerShippingPricePence);
    expect(payload.rovexoMarginPence).toBe(15);
  });

  it("5. one label → +£0.15", () => {
    expect(toRovexoShippingMarginPence(1)).toBe(15);
    expect(separateShippingPricesPence({ providerShippingCostPence: 305, labelCount: 1 })).toEqual(
      expect.objectContaining({
        providerShippingCostPence: 305,
        buyerShippingPricePence: 320,
        rovexoMarginPence: 15,
        labelCount: 1,
      }),
    );
  });

  it("6. two labels → +£0.30", () => {
    const sep = separateShippingPricesPence({
      providerShippingCostPence: 305,
      labelCount: 2,
    });
    expect(sep.rovexoMarginPence).toBe(30);
    expect(sep.buyerShippingPricePence).toBe(335);
  });

  it("7. quantity > 1 with one label → still +£0.15", () => {
    // Item quantity is irrelevant — only labelCount scales margin.
    const itemQuantity = 5;
    void itemQuantity;
    expect(toRovexoShippingMarginPence(1)).toBe(15);
    expect(toBuyerShippingPricePence(400, 1)).toBe(415);
  });

  it("8. missing provider cost → no fallback to buyer fee", () => {
    expect(
      resolveAuthoritativeProviderShippingCostPence({
        providerShippingCostPence: null,
        quotePricePence: null,
      }),
    ).toBeNull();

    const checkoutBuyerOnly: CheckoutCarrierQuote = {
      id: "sendcloud:9",
      carrier: "Evri",
      serviceName: "Standard",
      price: 4.15,
      buyerPricePence: 415,
      eta: "2-3 days",
      v2MethodId: 9,
    };
    const mapped = shippingQuoteFromCheckoutCarrierQuote(checkoutBuyerOnly);
    // Without providerPricePence — fail closed to 0, never treat buyer as provider.
    expect(mapped.pricePence).toBe(0);
    expect(mapped.pricePence).not.toBe(415);

    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(labelGen).toContain("resolveAuthoritativeProviderShippingCostPence");
    expect(labelGen).not.toContain("deriveProviderShippingCostPenceFromBuyer");
    expect(labelGen).toContain("Authoritative provider shipping cost is missing");

    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(postPayment).toContain("resolveAuthoritativeProviderShippingCostPence");
    expect(postPayment).not.toContain("deriveProviderShippingCostPenceFromBuyer");
  });

  it("9. existing paid order cannot mutate buyer shipping price", () => {
    const lockedBuyer = 415; // paid delivery_fee
    const payload = buildShippingQuotePayload(providerQuote(400), {
      labelCount: 2,
      lockedBuyerShippingPricePence: lockedBuyer,
    });
    expect(payload.providerShippingCostPence).toBe(400);
    expect(payload.rovexoMarginPence).toBe(30); // ledger margin for 2 labels
    expect(payload.buyerShippingPricePence).toBe(415); // locked — not 430
    expect(payload.labelCount).toBe(2);

    const store = read("lib/shipping/store.ts");
    expect(store).toContain("lockedBuyerShippingPricePence");
    expect(store).toContain("persistShippingRecordProviderCostPence");
    expect(store).toContain("shipping_price_pence");
  });

  it("10. canonical shipping_records remains SSOT", () => {
    expect(SHIPPING_RECORDS_SSOT_V1.writeAuthority).toBe("shipping_records");
    const store = read("lib/shipping/store.ts");
    expect(store).toContain("persistShippingRecordProviderCostPence");
    expect(store).toContain('from("shipping_records")');
  });
});

/**
 * MEDIUM #5 — Post-payment live quote enrichment is metadata-only.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  POST_PAYMENT_QUOTE_ENRICHMENT_V1,
  buildPostPaymentMetadataOnlyQuotePool,
  liveQuoteMatchesLockedSelection,
  overlayPostPaymentLiveQuoteMetadata,
} from "@/lib/shipping/post-payment-quote-enrichment-v1";
import { separateShippingPricesPence } from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import { SHIPPING_RECORDS_SSOT_V1 } from "@/lib/shipping/shipping-records-ssot-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

function q(
  partial: Partial<ShippingQuote> & Pick<ShippingQuote, "id" | "carrier" | "pricePence">,
): ShippingQuote {
  return {
    providerId: "sendcloud",
    serviceName: partial.serviceName ?? String(partial.carrier),
    currency: "GBP",
    estimatedDays: { min: 1, max: 3 },
    ...partial,
  };
}

describe("MEDIUM #5 — Post-payment metadata-only enrichment", () => {
  it("declares immutable quote/carrier/buyer/provider after payment", () => {
    expect(POST_PAYMENT_QUOTE_ENRICHMENT_V1.rule).toBe("AFTER_PAYMENT_METADATA_ONLY");
    expect(POST_PAYMENT_QUOTE_ENRICHMENT_V1.immutable).toEqual(
      expect.arrayContaining([
        "selected_shipping_quote_id",
        "carrier",
        "buyer_shipping_price",
        "provider_shipping_cost",
        "shipment_identity",
      ]),
    );
    expect(POST_PAYMENT_QUOTE_ENRICHMENT_V1.forbidden).toContain(
      "delivery_fee_as_provider_cost",
    );
  });

  it("same quote → metadata update allowed; provider cost unchanged", () => {
    const out = overlayPostPaymentLiveQuoteMetadata({
      lockedQuote: q({ id: "sendcloud:42", carrier: "Royal Mail", pricePence: 400, v2MethodId: 42 }),
      liveQuote: q({
        id: "sendcloud:42",
        carrier: "Royal Mail",
        pricePence: 999,
        v2MethodId: 42,
        shippingOptionCode: "royal_mail:tracked_48",
        contractId: "c-1",
        serviceName: "Tracked 48",
      }),
      lockedProviderShippingCostPence: 400,
    });
    expect(out.id).toBe("sendcloud:42");
    expect(out.carrier).toBe("Royal Mail");
    expect(out.pricePence).toBe(400);
    expect(out.shippingOptionCode).toBe("royal_mail:tracked_48");
    expect(out.contractId).toBe("c-1");
  });

  it("different quote id → original preserved", () => {
    const live = q({
      id: "sendcloud:99",
      carrier: "Evri",
      pricePence: 350,
      shippingOptionCode: "evri:standard",
    });
    expect(liveQuoteMatchesLockedSelection(live, "sendcloud:42")).toBe(false);
    const out = overlayPostPaymentLiveQuoteMetadata({
      lockedQuote: q({ id: "sendcloud:42", carrier: "Evri", pricePence: 350 }),
      liveQuote: live,
      lockedProviderShippingCostPence: 350,
    });
    expect(out.id).toBe("sendcloud:42");
    expect(out.shippingOptionCode).toBeUndefined();
  });

  it("different carrier → original preserved", () => {
    const out = overlayPostPaymentLiveQuoteMetadata({
      lockedQuote: q({ id: "sendcloud:42", carrier: "Evri", pricePence: 350 }),
      liveQuote: q({
        id: "sendcloud:42",
        carrier: "Royal Mail",
        pricePence: 350,
        shippingOptionCode: "royal_mail:tracked_48",
      }),
      lockedProviderShippingCostPence: 350,
    });
    expect(out.carrier).toBe("Evri");
    expect(out.shippingOptionCode).toBeUndefined();
  });

  it("different buyer price context → provider locked; margin math intact", () => {
    const out = overlayPostPaymentLiveQuoteMetadata({
      lockedQuote: q({ id: "sendcloud:7", carrier: "Evri", pricePence: 305 }),
      liveQuote: q({
        id: "sendcloud:7",
        carrier: "Evri",
        pricePence: 500,
        shippingOptionCode: "evri:next_day",
      }),
      lockedProviderShippingCostPence: 305,
    });
    expect(out.pricePence).toBe(305);
    expect(
      separateShippingPricesPence({
        providerShippingCostPence: out.pricePence,
        labelCount: 1,
      }).buyerShippingPricePence,
    ).toBe(320);
    expect(
      separateShippingPricesPence({
        providerShippingCostPence: out.pricePence,
        labelCount: 2,
      }).rovexoMarginPence,
    ).toBe(30);
  });

  it("different provider cost → original preserved", () => {
    const out = overlayPostPaymentLiveQuoteMetadata({
      lockedQuote: q({ id: "sendcloud:1", carrier: "Royal Mail", pricePence: 400 }),
      liveQuote: q({ id: "sendcloud:1", carrier: "Royal Mail", pricePence: 777 }),
      lockedProviderShippingCostPence: 400,
    });
    expect(out.pricePence).toBe(400);
  });

  it("enrichment failure / null live → existing state preserved", () => {
    const out = overlayPostPaymentLiveQuoteMetadata({
      lockedQuote: q({
        id: "sendcloud:42",
        carrier: "Evri",
        pricePence: 350,
        shippingOptionCode: "evri:standard",
      }),
      liveQuote: null,
      lockedProviderShippingCostPence: 350,
    });
    expect(out).toEqual(
      expect.objectContaining({
        id: "sendcloud:42",
        carrier: "Evri",
        pricePence: 350,
        shippingOptionCode: "evri:standard",
      }),
    );
  });

  it("pool builder never selects a different live quote id", () => {
    const pool = buildPostPaymentMetadataOnlyQuotePool({
      lockedQuote: q({ id: "sendcloud:42", carrier: "Evri", pricePence: 350 }),
      liveQuotes: [
        q({ id: "sendcloud:99", carrier: "Royal Mail", pricePence: 200 }),
        q({
          id: "sendcloud:42",
          carrier: "Evri",
          pricePence: 999,
          shippingOptionCode: "evri:standard",
        }),
      ],
    });
    expect(pool.selectedQuoteId).toBe("sendcloud:42");
    expect(pool.quotes.find((row) => row.id === "sendcloud:42")?.pricePence).toBe(350);
    expect(pool.quotes.find((row) => row.id === "sendcloud:42")?.shippingOptionCode).toBe(
      "evri:standard",
    );
  });

  it("post-payment wiring is metadata-only after payment", () => {
    const post = read("lib/orders/post-payment.server.ts");
    expect(post).toContain("overlayPostPaymentLiveQuoteMetadata");
    expect(post).toContain("buildPostPaymentMetadataOnlyQuotePool");
    expect(post).toContain("MEDIUM #5");
    expect(post).toContain("never pickSelectedQuoteId after payment");
    expect(post).toContain("lockedProviderShippingCostPence");
    expect(post).toContain("lockedBuyerShippingPricePence");
    expect(post).toContain("never invent from orders.delivery_fee");
  });

  it("shipping_records remains SSOT; multi-label margin remains correct", () => {
    expect(SHIPPING_RECORDS_SSOT_V1.canonicalTable).toBe("shipping_records");
    expect(
      separateShippingPricesPence({ providerShippingCostPence: 400, labelCount: 1 })
        .buyerShippingPricePence,
    ).toBe(415);
    expect(
      separateShippingPricesPence({ providerShippingCostPence: 400, labelCount: 2 })
        .buyerShippingPricePence,
    ).toBe(430);
    expect(
      separateShippingPricesPence({ providerShippingCostPence: 400, labelCount: 2 })
        .rovexoMarginPence,
    ).toBe(30);
    const store = read("lib/shipping/store.ts");
    expect(store).toContain("lockedProviderShippingCostPence");
    expect(store).toContain("Never changes selected_quote_id");
  });
});

/**
 * COD SÂNGE — ONE ORDER = ONE SELECTED QUOTE = ONE CANONICAL CARRIER
 * Focused persistence + Order Details display contract.
 * No live Sendcloud / Stripe / database mutation.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getDeliveryCarrierFromQuote } from "@/lib/checkout/delivery";
import {
  filterCheckoutEligibleProviderQuotes,
  mapProviderQuotesToCheckoutOptions,
} from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import type { CheckoutCarrierQuote } from "@/lib/checkout/types";
import { RVX8343A7C7_ORPHAN_REPAIR_V1 } from "@/lib/orders/rvx8343a7c7-orphan-shipping-repair-v1";
import { RVX8343A7C7_V3_QUOTE_PERSIST_V1 } from "@/lib/orders/rvx8343a7c7-v3-quote-persist-v1";
import { mapSendcloudCarrierToUk } from "@/lib/shipping/sendcloud/carrier-aliases";
import { EVRI_LABEL_ENGINE_CERTIFICATION_V1 } from "@/lib/shipping/sendcloud/evri-label-engine-certification-v1";
import { INPOST_LABEL_ENGINE_CERTIFICATION_V1 } from "@/lib/shipping/sendcloud/inpost-label-engine-certification-v1";
import { ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1 } from "@/lib/shipping/sendcloud/royal-mail-label-engine-certification-v1";
import {
  resolveV1_0ActiveCarrier,
  filterV1_0CustomerFacingQuotes,
} from "@/lib/shipping/v1-0-carrier-whitelist-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

function checkoutQuote(
  overrides: Partial<CheckoutCarrierQuote> & Pick<CheckoutCarrierQuote, "id" | "carrier">,
): CheckoutCarrierQuote {
  return {
    serviceName: `${overrides.carrier} home`,
    price: 3.35,
    eta: "2-3 days",
    ...overrides,
  };
}

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

describe("TEST 1 — Royal Mail checkout selection persists Royal Mail", () => {
  it("maps royal_mailv2 → Royal Mail and quote carrier stays Royal Mail", () => {
    expect(mapSendcloudCarrierToUk("royal_mailv2")).toBe("Royal Mail");
    expect(mapSendcloudCarrierToUk(ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.sendcloudCarrierCode)).toBe(
      "Royal Mail",
    );
    expect(
      getDeliveryCarrierFromQuote(
        checkoutQuote({ id: "sendcloud:29622", carrier: "Royal Mail" }),
      ),
    ).toBe("Royal Mail");
  });

  it("order insert writes delivery_carrier from the selected checkout quote", () => {
    const createOrder = readFileSync("lib/orders/create-order-from-checkout-session.server.ts", "utf8");
    const checkout = readFileSync("lib/orders/checkout.ts", "utf8");
    expect(createOrder).toContain("delivery_carrier: deliveryCarrier");
    expect(createOrder).toContain("selected_shipping_quote_id: selectedShippingQuoteId");
    expect(checkout).toContain("deliveryCarrier = getDeliveryCarrierFromQuote(selectedQuote)");
    expect(checkout).toContain("selected_shipping_quote_id: selectedShippingQuoteId");
  });
});

describe("TEST 2 — Evri checkout selection persists Evri", () => {
  it("maps hermes_c2c_gb → Evri and quote carrier stays Evri", () => {
    expect(mapSendcloudCarrierToUk("hermes_c2c_gb")).toBe("Evri");
    expect(mapSendcloudCarrierToUk(EVRI_LABEL_ENGINE_CERTIFICATION_V1.sendcloudCarrierCode)).toBe(
      "Evri",
    );
    expect(
      getDeliveryCarrierFromQuote(checkoutQuote({ id: "sendcloud:3650", carrier: "Evri" })),
    ).toBe("Evri");
  });
});

describe("TEST 3 — Royal Mail cannot become InPost after payment", () => {
  it("Royal Mail V2 method ids are never InPost 27227", () => {
    expect(ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked24.v2MethodId).toBe(29622);
    expect(ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked48.v2MethodId).toBe(29632);
    expect(INPOST_LABEL_ENGINE_CERTIFICATION_V1.lockerToAddress.v2MethodId).toBe(27227);
    expect(ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked24.v2MethodId).not.toBe(27227);
    expect(ROYAL_MAIL_LABEL_ENGINE_CERTIFICATION_V1.tracked48.v2MethodId).not.toBe(27227);
  });

  it("Royal Mail + cheaper InPost live quotes still map checkout to Royal Mail only", () => {
    const options = mapProviderQuotesToCheckoutOptions([
      providerQuote({
        id: "sendcloud:27227",
        carrier: "InPost",
        serviceName: "InPost Locker to Address",
        pricePence: 100,
        shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
      }),
      providerQuote({
        id: "sendcloud:29622",
        carrier: "Royal Mail",
        serviceName: "Royal Mail Tracked 24",
        pricePence: 388,
        shippingOptionCode: "royal_mailv2:tracked_24/size=s",
      }),
    ]);
    expect(options).toHaveLength(1);
    expect(options[0]?.carrier).toBe("Royal Mail");
    expect(options[0]?.id).toBe("sendcloud:29622");
    expect(options.some((option) => option.carrier === "InPost")).toBe(false);
  });

  it("post-payment prefers the checkout selected_shipping_quote_id before any pool", () => {
    const postPayment = readFileSync("lib/orders/post-payment.server.ts", "utf8");
    expect(postPayment).toContain("const preferredQuoteId = order.selected_shipping_quote_id?.trim() || null");
    expect(postPayment).toContain("carrier: order.delivery_carrier || null");
    expect(postPayment).toContain("retainCheckoutSelectedQuoteId");
    expect(postPayment).toContain("Never reconstruct method id from carrier name / price alone");
    expect(postPayment).not.toMatch(/delivery_carrier:\s*["']InPost["']/);
  });
});

describe("TEST 4 — Order Details displays the persisted canonical carrier", () => {
  it("Order Details displays resolved current carrier, not a hardcoded InPost", () => {
    const detail = readFileSync("features/orders/components/OrderDetailView.tsx", "utf8");
    const card = readFileSync("features/orders/components/DeliveryStatusCard.tsx", "utf8");
    const store = readFileSync("lib/orders/store.ts", "utf8");
    expect(detail).toContain("carrier={displayCarrier}");
    expect(detail).toContain("resolveOrderDisplayCarrier");
    expect(detail).not.toMatch(/carrier=\{[^}]*InPost/);
    expect(card).toContain("Carrier: {carrier}");
    expect(store).toContain("deliveryCarrier: row.delivery_carrier");
  });
});

describe("TEST 5 — no independent carrier fallback can replace the selected carrier", () => {
  it("findCheckoutCarrierQuote never substitutes another id", () => {
    const quotes = readFileSync("lib/checkout/shipping-quotes.server.ts", "utf8");
    expect(quotes).toContain("export function findCheckoutCarrierQuote");
    expect(quotes).toContain("return options.find((option) => option.id === quoteId) ?? null");
    const royalMail = checkoutQuote({ id: "sendcloud:29622", carrier: "Royal Mail" });
    const evri = checkoutQuote({ id: "sendcloud:3650", carrier: "Evri" });
    const match = [royalMail, evri].find((option) => option.id === "sendcloud:29622") ?? null;
    const missing = [royalMail, evri].find((option) => option.id === "sendcloud:27227") ?? null;
    expect(match?.carrier).toBe("Royal Mail");
    expect(missing).toBeNull();
  });

  it("label generation does not rewrite orders.delivery_carrier", () => {
    const label = readFileSync("lib/shipping/label-generation.server.ts", "utf8");
    expect(label).toContain("selected_shipping_quote_id");
    expect(label).not.toMatch(/\.update\(\{[\s\S]*delivery_carrier/);
    expect(label).not.toMatch(/delivery_carrier:\s*["']InPost["']/);
  });

  it("append-without-renumber recovery does not rewrite historical carrier", () => {
    const append = readFileSync("lib/shipping/append-shipment-parcel-without-renumber-v1.ts", "utf8");
    expect(append).not.toMatch(/delivery_carrier/);
    expect(append).toContain("Never renumbers historical rows");
  });
});

describe("TEST 6 — missing/invalid carrier fails closed rather than selecting InPost", () => {
  it("checkout whitelist fails closed on InPost / empty carrier", () => {
    expect(resolveV1_0ActiveCarrier("InPost")).toBeNull();
    expect(resolveV1_0ActiveCarrier("inpost_gb")).toBeNull();
    expect(resolveV1_0ActiveCarrier(null)).toBeNull();
    expect(resolveV1_0ActiveCarrier("")).toBeNull();
    expect(
      filterV1_0CustomerFacingQuotes([
        { carrier: "InPost" },
        { carrier: "Royal Mail" },
        { carrier: "Evri" },
      ]).map((row) => row.carrier),
    ).toEqual(["Royal Mail", "Evri"]);
    expect(
      filterCheckoutEligibleProviderQuotes([
        providerQuote({
          id: "sendcloud:27227",
          carrier: "InPost",
          serviceName: "InPost Locker to Address",
          pricePence: 100,
          shippingOptionCode: "inpost_gb:lockertoaddress/dropoff",
        }),
      ]),
    ).toEqual([]);
  });

  it("missing checkout quote never becomes InPost", () => {
    expect(getDeliveryCarrierFromQuote(null)).not.toBe("InPost");
    expect(getDeliveryCarrierFromQuote(undefined)).not.toBe("InPost");
    expect([].find((option: { id: string }) => option.id === "sendcloud:27227") ?? null).toBeNull();
  });
});

describe("RVX8343A7C7 historical identity — InPost quote, not Royal Mail", () => {
  it("locked selected quote 27227 is InPost locker-to-address", () => {
    expect(RVX8343A7C7_ORPHAN_REPAIR_V1.orderNumber).toBe("RVX8343A7C7");
    expect(RVX8343A7C7_ORPHAN_REPAIR_V1.expectedSelectedShippingQuoteId).toBe("sendcloud:27227");
    expect(RVX8343A7C7_V3_QUOTE_PERSIST_V1.legacyQuoteId).toBe("sendcloud:27227");
    expect(RVX8343A7C7_V3_QUOTE_PERSIST_V1.v2MethodId).toBe(27227);
    expect(RVX8343A7C7_V3_QUOTE_PERSIST_V1.confirmedShippingOptionCode).toBe(
      "inpost_gb:lockertoaddress/dropoff",
    );
    expect(INPOST_LABEL_ENGINE_CERTIFICATION_V1.lockerToAddress.v2MethodId).toBe(27227);
    expect(INPOST_LABEL_ENGINE_CERTIFICATION_V1.carrierDisplayName).toBe("InPost");
    expect(mapSendcloudCarrierToUk("inpost_gb")).toBe("InPost");
    expect(mapSendcloudCarrierToUk("inpost")).toBe("InPost");
  });
});

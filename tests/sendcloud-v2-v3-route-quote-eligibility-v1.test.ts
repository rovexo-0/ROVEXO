/**
 * Checkout eligibility: V2 methods whose confirmed V3 identity is unavailable
 * for the live route must not be offered / selected / persisted.
 * Reuses the existing catalog + quote contract — no second mapping engine.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { mapSendcloudMethodToQuote } from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  isRouteProvenSendcloudQuote,
  retainCheckoutSelectedQuoteId,
  selectedSendcloudQuoteNeedsV3Discovery,
} from "@/lib/shipping/selected-shipping-quote-contract-v1";
import {
  applyRouteAwareSelectionsToQuoteMetadata,
  isConfirmedSendcloudV3ShippingOptionCode,
  selectRouteAwareV3OptionForCompatMapping,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { clearSendcloudV3CatalogCacheForTests } from "@/lib/shipping/sendcloud/v3-catalog-cache-v1";
import type { SendcloudShippingMethod } from "@/lib/shipping/sendcloud/types";
import type { ShippingQuote } from "@/lib/shipping/types";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const sendcloudV3Request = vi.fn();

vi.mock("@/lib/shipping/sendcloud/client", () => ({
  sendcloudV3Request: (...args: unknown[]) => sendcloudV3Request(...args),
}));

const METHOD_29631 = 29631;
const LETTER_CODE = "royal_mailv2:tracked_48/letter";
const PARCEL_CODE = "royal_mailv2:tracked_48/size=s";
const ROUTE_PROVEN_METHOD = 3650;

function method(id: number, name = "Royal Mail"): SendcloudShippingMethod {
  return {
    id,
    name,
    carrier: "royal_mail",
    min_weight: "0.001",
    max_weight: "2",
    service_point_input: "none",
    countries: [
      {
        id: 1,
        name: "United Kingdom",
        price: 2.38,
        iso_2: "GB",
        iso_3: "GBR",
        lead_time_hours: 48,
      },
    ],
  };
}

function v2Quote(methodId: number, overrides: Partial<ShippingQuote> = {}): ShippingQuote {
  return {
    id: `sendcloud:${methodId}`,
    providerId: "sendcloud",
    carrier: "Royal Mail",
    serviceName: "Royal Mail",
    pricePence: 238,
    currency: "GBP",
    estimatedDays: { min: 1, max: 3 },
    v2MethodId: methodId,
    quoteApiVersion: "v2",
    ...overrides,
  };
}

describe("Sendcloud V2→V3 route quote eligibility", () => {
  afterEach(() => {
    sendcloudV3Request.mockReset();
    clearSendcloudV3CatalogCacheForTests();
  });

  it("1 — 29631 letter identity unavailable on small_parcel → quote not eligible", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_29631,
      compatShippingOptionCode: LETTER_CODE,
      availableOptions: [{ shippingOptionCode: PARCEL_CODE, contractId: "1" }],
    });
    expect(selection.status).toBe("COMPAT_IDENTITY_FOUND_BUT_ROUTE_UNAVAILABLE");
    expect(selection.shippingOptionCode).toBeNull();

    const gated = applyRouteAwareSelectionsToQuoteMetadata(
      new Map([[METHOD_29631, { v2MethodId: METHOD_29631, shippingOptionCode: LETTER_CODE }]]),
      new Map([[METHOD_29631, selection]]),
    );
    const quote = mapSendcloudMethodToQuote(method(METHOD_29631), gated.get(METHOD_29631));
    expect(quote?.id).toBe("sendcloud:29631");
    expect(quote?.shippingOptionCode).toBeUndefined();
    expect(isRouteProvenSendcloudQuote(quote)).toBe(false);
    expect([quote].filter(isRouteProvenSendcloudQuote)).toEqual([]);
  });

  it("2 — confirmed V3 counterpart available on the exact route remains eligible", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: ROUTE_PROVEN_METHOD,
      compatShippingOptionCode: PARCEL_CODE,
      availableOptions: [{ shippingOptionCode: PARCEL_CODE, contractId: "40353" }],
    });
    expect(selection.status).toBe("ROUTE_AWARE_SELECTED");
    expect(selection.shippingOptionCode).toBe(PARCEL_CODE);

    const gated = applyRouteAwareSelectionsToQuoteMetadata(
      new Map([
        [ROUTE_PROVEN_METHOD, { v2MethodId: ROUTE_PROVEN_METHOD, shippingOptionCode: PARCEL_CODE }],
      ]),
      new Map([[ROUTE_PROVEN_METHOD, selection]]),
    );
    const quote = mapSendcloudMethodToQuote(method(ROUTE_PROVEN_METHOD), gated.get(ROUTE_PROVEN_METHOD));
    expect(isRouteProvenSendcloudQuote(quote)).toBe(true);
    expect(quote?.id).toBe(`sendcloud:${ROUTE_PROVEN_METHOD}`);
    expect(quote?.shippingOptionCode).toBe(PARCEL_CODE);
    expect(quote?.contractId).toBe("40353");
  });

  it("3 — eligibility is per-quote identity, never quotes[0]", () => {
    const letter = v2Quote(METHOD_29631);
    const parcel = v2Quote(ROUTE_PROVEN_METHOD, {
      shippingOptionCode: PARCEL_CODE,
      quoteApiVersion: "v2+v3",
    });
    const offered = [letter, parcel].filter(isRouteProvenSendcloudQuote);
    expect(offered).toHaveLength(1);
    expect(offered[0]?.id).toBe(`sendcloud:${ROUTE_PROVEN_METHOD}`);
    expect(offered[0]?.id).not.toBe(letter.id);

    const getQuotes = read("lib/shipping/sendcloud/service.ts");
    const start = getQuotes.indexOf("async getQuotes(");
    const end = getQuotes.indexOf("async generateLabel(");
    const fn = getQuotes.slice(start, end);
    expect(fn).toContain("isRouteProvenSendcloudQuote");
    expect(fn).not.toContain("quotes[0]");
  });

  it("4 — never fabricates shippingOptionCode from sendcloud:N / method id", () => {
    expect(isConfirmedSendcloudV3ShippingOptionCode("sendcloud:29631", METHOD_29631)).toBe(false);
    expect(isConfirmedSendcloudV3ShippingOptionCode("29631", METHOD_29631)).toBe(false);
    expect(isConfirmedSendcloudV3ShippingOptionCode(LETTER_CODE, METHOD_29631)).toBe(true);

    const invented = v2Quote(METHOD_29631, { shippingOptionCode: "sendcloud:29631" });
    expect(isRouteProvenSendcloudQuote(invented)).toBe(false);
    expect(selectedSendcloudQuoteNeedsV3Discovery(invented)).toBe(true);
  });

  it("5 — valid quote keeps selected_shipping_quote_id identity", () => {
    const valid = v2Quote(ROUTE_PROVEN_METHOD, {
      shippingOptionCode: PARCEL_CODE,
      quoteApiVersion: "v2+v3",
    });
    expect(retainCheckoutSelectedQuoteId([valid], `sendcloud:${ROUTE_PROVEN_METHOD}`)).toBe(
      `sendcloud:${ROUTE_PROVEN_METHOD}`,
    );
    expect(isRouteProvenSendcloudQuote(valid)).toBe(true);
  });

  it("6 — label generation still fail-closes on legacy V2-only selected quotes", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(labelGen).toContain("shipping_option_code is required");
    expect(labelGen).toContain("legacy sendcloud:N alone cannot create labels");
    expect(labelGen).toContain("discoverConfirmedV3MetadataForV2Method");

    const legacy = v2Quote(METHOD_29631);
    expect(selectedSendcloudQuoteNeedsV3Discovery(legacy)).toBe(true);
    expect(isRouteProvenSendcloudQuote(legacy)).toBe(false);
  });

  it("7 — seller/buyer cancel surfaces are untouched by this eligibility filter", () => {
    const helper = "isRouteProvenSendcloudQuote";
    expect(read("lib/shipping/sendcloud/service.ts")).toContain(helper);
    expect(read("lib/orders/cancellation.ts")).not.toContain(helper);
    expect(read("lib/shipping/sendcloud/service.ts")).not.toMatch(/cancelSellerOrder|cancelBuyerOrder/);
  });

  it("live catalog: 29631 letter counterpart is stripped when absent from small_parcel route", async () => {
    sendcloudV3Request.mockImplementation(async (path: string) => {
      if (String(path).includes("compat")) {
        return { data: { "29631": LETTER_CODE } };
      }
      return {
        data: [{ code: PARCEL_CODE, contract: { id: "1" } }],
      };
    });

    const { discoverConfirmedV3MetadataForV2Method, buildLiveCheckoutSendcloudV3Route } =
      await import("@/lib/shipping/sendcloud/v3-catalog-v1");
    const meta = await discoverConfirmedV3MetadataForV2Method({
      v2MethodId: METHOD_29631,
      route: buildLiveCheckoutSendcloudV3Route({
        fromCountryCode: "United Kingdom",
        toCountryCode: "United Kingdom",
        fromPostalCode: "WS2 9RD",
        toPostalCode: "WS2 9RD",
        parcelTier: "small_parcel",
      }),
    });
    expect(meta).toBeNull();

    const quote = mapSendcloudMethodToQuote(method(METHOD_29631), meta);
    expect(isRouteProvenSendcloudQuote(quote)).toBe(false);
    expect(sendcloudV3Request.mock.calls.some((call) => String(call[0]).includes("announce"))).toBe(
      false,
    );
  });
});

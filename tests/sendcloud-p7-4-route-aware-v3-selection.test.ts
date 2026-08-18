/**
 * P7.4 — Route-aware V3 shipping option selection gate.
 * Compat identity ≠ announce-ready. Exact match only. No carrier substitutes.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  applyRouteAwareSelectionsToQuoteMetadata,
  buildShippingQuotePayload,
  extractSendcloudV3RouteAwareOptionIdentities,
  selectRouteAwareV3OptionForCompatMapping,
  shippingQuoteFromPayloadRow,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { mapSendcloudMethodToQuote } from "@/lib/shipping/pricing/sendcloud-mappers";
import type { SendcloudV3QuoteMetadata } from "@/lib/shipping/sendcloud/types";

const COMPAT_INPOST = "inpost_gb:lockertoaddress/dropoff";
const METHOD_27227 = 27227;

const EVRI = {
  shippingOptionCode: "hermes_c2c_gb:a2a/pickup",
  contractId: "38704",
};
const DPD = {
  shippingOptionCode: "dpd:standard",
  contractId: "22",
};
const ROYAL_MAIL = {
  shippingOptionCode: "royal_mail:tracked_48:large_letter",
  contractId: "33",
};
const INPOST_WITH_CONTRACT = {
  shippingOptionCode: COMPAT_INPOST,
  contractId: "77",
};
const INPOST_NO_CONTRACT = {
  shippingOptionCode: COMPAT_INPOST,
  contractId: null,
};

function method27227() {
  return {
    id: METHOD_27227,
    name: "InPost Locker to Address",
    carrier: "inpost_gb",
    min_weight: "0.001",
    max_weight: "20.000",
    service_point_input: "none" as const,
    countries: [
      {
        id: 1,
        name: "United Kingdom",
        price: 3.49,
        iso_2: "GB",
        iso_3: "GBR",
        lead_time_hours: 48,
      },
    ],
  };
}

describe("P7.4 selectRouteAwareV3OptionForCompatMapping", () => {
  it("TEST 1: compat InPost absent from route-aware options → reject, no code", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_27227,
      compatShippingOptionCode: COMPAT_INPOST,
      availableOptions: [EVRI, DPD, ROYAL_MAIL],
    });
    expect(selection.status).toBe("COMPAT_IDENTITY_FOUND_BUT_ROUTE_UNAVAILABLE");
    expect(selection.compatShippingOptionCode).toBe(COMPAT_INPOST);
    expect(selection.shippingOptionCode).toBeNull();
    expect(selection.contractId).toBeNull();
  });

  it("TEST 2: exact InPost present → select exact code + contract", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_27227,
      compatShippingOptionCode: COMPAT_INPOST,
      availableOptions: [EVRI, INPOST_WITH_CONTRACT, ROYAL_MAIL],
    });
    expect(selection.status).toBe("ROUTE_AWARE_SELECTED");
    expect(selection.shippingOptionCode).toBe(COMPAT_INPOST);
    expect(selection.contractId).toBe("77");
  });

  it("TEST 3: InPost absent but other carriers present → never substitute", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_27227,
      compatShippingOptionCode: COMPAT_INPOST,
      availableOptions: [EVRI, DPD, ROYAL_MAIL],
    });
    expect(selection.shippingOptionCode).toBeNull();
    expect([EVRI.shippingOptionCode, DPD.shippingOptionCode, ROYAL_MAIL.shippingOptionCode]).not.toContain(
      selection.shippingOptionCode,
    );
    expect(selection.status).toBe("COMPAT_IDENTITY_FOUND_BUT_ROUTE_UNAVAILABLE");
  });

  it("TEST 5: exact match with null contract_id → remains null", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_27227,
      compatShippingOptionCode: COMPAT_INPOST,
      availableOptions: [INPOST_NO_CONTRACT],
    });
    expect(selection.status).toBe("ROUTE_AWARE_SELECTED");
    expect(selection.shippingOptionCode).toBe(COMPAT_INPOST);
    expect(selection.contractId).toBeNull();
  });

  it("catalog unavailable → strip V3 codes fail-closed", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_27227,
      compatShippingOptionCode: COMPAT_INPOST,
      availableOptions: [INPOST_WITH_CONTRACT],
      catalogUnavailable: true,
    });
    expect(selection.status).toBe("ROUTE_CATALOG_UNAVAILABLE");
    expect(selection.shippingOptionCode).toBeNull();
    expect(selection.contractId).toBeNull();
  });
});

describe("P7.4 applyRouteAwareSelectionsToQuoteMetadata + persist/hydrate", () => {
  it("TEST 1: unavailable InPost stripped from quote metadata / payload", () => {
    const compatMeta = new Map<number, SendcloudV3QuoteMetadata>([
      [METHOD_27227, { v2MethodId: METHOD_27227, shippingOptionCode: COMPAT_INPOST }],
    ]);
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_27227,
      compatShippingOptionCode: COMPAT_INPOST,
      availableOptions: [EVRI, DPD],
    });
    const gated = applyRouteAwareSelectionsToQuoteMetadata(
      compatMeta,
      new Map([[METHOD_27227, selection]]),
    );
    expect(gated.get(METHOD_27227)?.shippingOptionCode).toBeUndefined();

    const quote = mapSendcloudMethodToQuote(method27227(), gated.get(METHOD_27227));
    expect(quote).not.toBeNull();
    expect(quote!.shippingOptionCode).toBeUndefined();
    expect(quote!.v2MethodId).toBe(METHOD_27227);
    expect(quote!.quoteApiVersion).toBe("v2");

    const payload = buildShippingQuotePayload(quote!);
    expect(payload.shippingOptionCode).toBeUndefined();
    expect(payload.contractId).toBeUndefined();
  });

  it("TEST 2+4: selected InPost + contract_id survives quote → payload → hydrate", () => {
    const compatMeta = new Map<number, SendcloudV3QuoteMetadata>([
      [METHOD_27227, { v2MethodId: METHOD_27227, shippingOptionCode: COMPAT_INPOST }],
    ]);
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_27227,
      compatShippingOptionCode: COMPAT_INPOST,
      availableOptions: [INPOST_WITH_CONTRACT],
    });
    const gated = applyRouteAwareSelectionsToQuoteMetadata(
      compatMeta,
      new Map([[METHOD_27227, selection]]),
    );
    expect(gated.get(METHOD_27227)).toMatchObject({
      shippingOptionCode: COMPAT_INPOST,
      contractId: "77",
    });

    const quote = mapSendcloudMethodToQuote(method27227(), gated.get(METHOD_27227));
    expect(quote!.shippingOptionCode).toBe(COMPAT_INPOST);
    expect(quote!.contractId).toBe("77");
    expect(quote!.quoteApiVersion).toBe("v2+v3");

    const payload = buildShippingQuotePayload(quote!);
    expect(payload.shippingOptionCode).toBe(COMPAT_INPOST);
    expect(payload.contractId).toBe("77");

    const hydrated = shippingQuoteFromPayloadRow({
      id: "row-uuid",
      providerId: "sendcloud",
      carrier: "InPost",
      serviceName: "InPost Locker to Address",
      pricePence: 349,
      currency: "GBP",
      estimatedDaysMin: 2,
      estimatedDaysMax: 3,
      recommended: null,
      expiresAt: null,
      quotePayload: payload,
    });
    expect(hydrated.shippingOptionCode).toBe(COMPAT_INPOST);
    expect(hydrated.contractId).toBe("77");
    expect(hydrated.v2MethodId).toBe(METHOD_27227);
  });

  it("TEST 5: no contract_id → payload omits contractId", () => {
    const selection = selectRouteAwareV3OptionForCompatMapping({
      v2MethodId: METHOD_27227,
      compatShippingOptionCode: COMPAT_INPOST,
      availableOptions: [INPOST_NO_CONTRACT],
    });
    const gated = applyRouteAwareSelectionsToQuoteMetadata(
      new Map([[METHOD_27227, { v2MethodId: METHOD_27227, shippingOptionCode: COMPAT_INPOST }]]),
      new Map([[METHOD_27227, selection]]),
    );
    const quote = mapSendcloudMethodToQuote(method27227(), gated.get(METHOD_27227));
    expect(quote!.shippingOptionCode).toBe(COMPAT_INPOST);
    expect(quote!.contractId).toBeUndefined();
    const payload = buildShippingQuotePayload(quote!);
    expect(payload.contractId).toBeUndefined();
  });
});

describe("P7.4 extractSendcloudV3RouteAwareOptionIdentities", () => {
  it("parses codes and contract ids without inventing", () => {
    const ids = extractSendcloudV3RouteAwareOptionIdentities({
      data: [
        {
          code: COMPAT_INPOST,
          contract: { id: 77 },
        },
        {
          code: "hermes_c2c_gb:a2a/pickup",
          contract: null,
        },
        {
          code: "29631",
        },
      ],
    });
    expect(ids).toEqual([
      { shippingOptionCode: COMPAT_INPOST, contractId: "77" },
      { shippingOptionCode: "hermes_c2c_gb:a2a/pickup", contractId: null },
    ]);
  });
});

describe("P7.4 canonical wiring (source)", () => {
  it("getQuotes gates compat metadata via route-aware catalog", () => {
    const service = readFileSync("lib/shipping/sendcloud/service.ts", "utf8");
    const getQuotesStart = service.indexOf("async getQuotes(");
    const generateLabelStart = service.indexOf("async generateLabel(");
    const getQuotesFn = service.slice(getQuotesStart, generateLabelStart);
    expect(getQuotesFn).toContain("gateSendcloudV3MetadataByRouteAvailability");
    expect(getQuotesFn).toContain("resolveSendcloudV3MetadataForMethods");
    expect(getQuotesFn).toContain("COMPAT_IDENTITY_FOUND_BUT_ROUTE_UNAVAILABLE");
    expect(getQuotesFn).toContain("isRouteProvenSendcloudQuote");
    expect(getQuotesFn).not.toContain("announceSendcloudShipmentV3");
  });

  it("does not modify P6.2 surgical persist or announce path for this gate", () => {
    const persist = readFileSync(
      "lib/shipping/persist-rvx8343a7c7-v3-shipping-option.server.ts",
      "utf8",
    );
    const announceService = readFileSync("lib/shipping/sendcloud/service.ts", "utf8");
    expect(persist).toContain("confirmedShippingOptionCode");
    expect(persist).not.toContain("gateSendcloudV3MetadataByRouteAvailability");
    expect(announceService).toContain("announceSendcloudShipmentV3");
  });
});

/**
 * P7.35 — Persisted quote_payload.shippingOptionCode (+ contractId) must survive
 * hydrate → selectedQuote → generateShippingLabelForOrder handoff.
 * Order 1 lock: inpost_gb:lockertoaddress/dropoff · contractId 40353.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  coerceShippingQuotePayload,
  shippingQuoteFromPayloadRow,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { resolveSelectedShippingQuoteForLabel } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const ORDER_1_QUOTE_ROW_ID = "dc98f660-71d3-4712-a176-763263409ee3";
const LEGACY_QUOTE_ID = "sendcloud:27227";
const V3_CODE = "inpost_gb:lockertoaddress/dropoff";
const CONTRACT_ID = "40353";

const ORDER_1_PAYLOAD = {
  externalQuoteId: LEGACY_QUOTE_ID,
  v2MethodId: 27227,
  shippingOptionCode: V3_CODE,
  contractId: CONTRACT_ID,
  quoteApiVersion: "v2+v3" as const,
};

function hydrateOrder1Quote(
  payload: unknown = ORDER_1_PAYLOAD,
  rowId = ORDER_1_QUOTE_ROW_ID,
): ShippingQuote {
  return shippingQuoteFromPayloadRow({
    id: rowId,
    providerId: "sendcloud",
    carrier: "InPost",
    serviceName: "InPost Locker to Address",
    pricePence: 320,
    currency: "GBP",
    estimatedDaysMin: 2,
    estimatedDaysMax: 2,
    recommended: null,
    expiresAt: null,
    quotePayload: payload,
  });
}

describe("P7.35 quote_payload → selectedQuote shippingOptionCode retention", () => {
  it("hydrates exact V3 code + contractId from persisted camelCase payload", () => {
    const selectedQuote = hydrateOrder1Quote();
    expect(selectedQuote.id).toBe(LEGACY_QUOTE_ID);
    expect(selectedQuote.shippingOptionCode).toBe(V3_CODE);
    expect(selectedQuote.contractId).toBe(CONTRACT_ID);
    expect(selectedQuote.v2MethodId).toBe(27227);
  });

  it("does not drop numeric JSON contractId (40353)", () => {
    const selectedQuote = hydrateOrder1Quote({
      ...ORDER_1_PAYLOAD,
      contractId: 40353,
    });
    expect(selectedQuote.shippingOptionCode).toBe(V3_CODE);
    expect(selectedQuote.contractId).toBe(CONTRACT_ID);
  });

  it("hydrates from JSON-string quote_payload storage shape", () => {
    const selectedQuote = hydrateOrder1Quote(JSON.stringify(ORDER_1_PAYLOAD));
    expect(selectedQuote.shippingOptionCode).toBe(V3_CODE);
    expect(selectedQuote.contractId).toBe(CONTRACT_ID);
  });

  it("coerceShippingQuotePayload reads snake_case aliases without inventing codes", () => {
    const coerced = coerceShippingQuotePayload({
      external_quote_id: LEGACY_QUOTE_ID,
      v2_method_id: 27227,
      shipping_option_code: V3_CODE,
      contract_id: 40353,
      quote_api_version: "v2+v3",
    });
    expect(coerced?.shippingOptionCode).toBe(V3_CODE);
    expect(coerced?.contractId).toBe(CONTRACT_ID);
    const selectedQuote = hydrateOrder1Quote(coerced);
    expect(selectedQuote.shippingOptionCode).toBe(V3_CODE);
    expect(selectedQuote.contractId).toBe(CONTRACT_ID);
  });

  it("resolveSelectedShippingQuoteForLabel keeps V3 when selected_quote_id is row UUID", () => {
    const withV3 = hydrateOrder1Quote();
    const withoutV3: ShippingQuote = {
      id: "sendcloud:99999",
      providerId: "sendcloud",
      carrier: "Other",
      serviceName: "Other",
      pricePence: 100,
      currency: "GBP",
      estimatedDays: { min: 1, max: 2 },
      v2MethodId: 99999,
      quoteApiVersion: "v2",
    };
    // Newest-first array (as store orders created_at desc) — non-V3 first.
    const selected = resolveSelectedShippingQuoteForLabel(
      [withoutV3, withV3],
      ORDER_1_QUOTE_ROW_ID,
    );
    expect(selected?.id).toBe(LEGACY_QUOTE_ID);
    expect(selected?.shippingOptionCode).toBe(V3_CODE);
    expect(selected?.contractId).toBe(CONTRACT_ID);
  });

  it("exact selectedQuoteId=sendcloud:27227 still wins", () => {
    const withV3 = hydrateOrder1Quote();
    const selected = resolveSelectedShippingQuoteForLabel(
      [withV3],
      LEGACY_QUOTE_ID,
    );
    expect(selected?.shippingOptionCode).toBe(V3_CODE);
    expect(selected?.contractId).toBe(CONTRACT_ID);
  });

  it("generateShippingLabelForOrder hands off selectedQuote.shippingOptionCode + contractId", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const store = read("lib/shipping/store.ts");
    expect(labelGen).toContain("resolveSelectedShippingQuoteForLabel");
    expect(labelGen).toContain(
      "shippingOptionCode: selectedQuote?.shippingOptionCode ?? null",
    );
    expect(labelGen).toContain("contractId: selectedQuote?.contractId ?? null");
    expect(store).toContain("shippingQuoteFromPayloadRow");
    // Must not require browser to send shipping_option_code.
    const route = read("app/api/shipping/labels/route.ts");
    expect(route).not.toMatch(/shipping_option_code/);
    expect(route).toContain("orderId: z.string().uuid()");
  });

  it("Order 2 untouched — production P7.35 path does not hardcode Order 2 ids", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const contractFn = read("lib/shipping/selected-shipping-quote-contract-v1.ts");
    const coerceSrc = read("lib/shipping/sendcloud/v3-catalog-parsers-v1.ts");
    for (const src of [labelGen, contractFn]) {
      expect(src).not.toMatch(/RVXC75CA5BB/);
      expect(src).not.toMatch(/sendcloud:29631/);
    }
    // New coerce helper must not invent a substitute option code string.
    expect(coerceSrc).not.toMatch(/inpost_gb:lockertoaddress\/dropoff/);
  });
});

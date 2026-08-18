import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildLegacyBridgeShippingQuote,
  resolveSelectedShippingQuoteForLabel,
  retainCheckoutSelectedQuoteId,
} from "@/lib/shipping/selected-shipping-quote-contract-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const SELECTED = "sendcloud:29632";
const ROW_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function matchingQuote(): ShippingQuote {
  return {
    id: SELECTED,
    quoteRowId: ROW_ID,
    providerId: "sendcloud",
    carrier: "Royal Mail",
    serviceName: "Royal Mail Tracked 48 - Small Parcel",
    pricePence: 304,
    currency: "GBP",
    estimatedDays: { min: 2, max: 2 },
    v2MethodId: 29632,
    quoteApiVersion: "v2",
  };
}

function otherQuote(): ShippingQuote {
  return {
    id: "sendcloud:11111",
    quoteRowId: "ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb",
    providerId: "sendcloud",
    carrier: "Other",
    serviceName: "Other",
    pricePence: 100,
    currency: "GBP",
    estimatedDays: { min: 1, max: 2 },
    v2MethodId: 11111,
    quoteApiVersion: "v2",
  };
}

describe("shipping quote resolution hydration v1", () => {
  it("A — selected quote ID + matching shipping_quotes row → RESOLVE PASS", () => {
    const selected = resolveSelectedShippingQuoteForLabel([matchingQuote()], SELECTED);
    expect(selected?.id).toBe(SELECTED);
    expect(selected?.v2MethodId).toBe(29632);
  });

  it("B — selected quote ID + matching quoteRowId → RESOLVE PASS", () => {
    const selected = resolveSelectedShippingQuoteForLabel([matchingQuote()], ROW_ID);
    expect(selected?.id).toBe(SELECTED);
    expect(selected?.quoteRowId).toBe(ROW_ID);
  });

  it("C — sendcloud:N + matching v2MethodId → RESOLVE PASS", () => {
    const byMethodOnly: ShippingQuote = {
      ...matchingQuote(),
      id: "internal-unrelated",
      quoteRowId: undefined,
    };
    const selected = resolveSelectedShippingQuoteForLabel([byMethodOnly], SELECTED);
    expect(selected?.v2MethodId).toBe(29632);
  });

  it("D — selected quote ID + no matching quote → FAIL CLOSED", () => {
    expect(resolveSelectedShippingQuoteForLabel([otherQuote()], SELECTED)).toBeNull();
    expect(retainCheckoutSelectedQuoteId([otherQuote()], SELECTED)).toBe(SELECTED);
  });

  it("E — empty quotes → FAIL CLOSED", () => {
    expect(resolveSelectedShippingQuoteForLabel([], SELECTED)).toBeNull();
    expect(resolveSelectedShippingQuoteForLabel(null, SELECTED)).toBeNull();
  });

  it("F — no first-list fallback; retain keeps checkout identity", () => {
    expect(resolveSelectedShippingQuoteForLabel([otherQuote()], SELECTED)).not.toBe(
      otherQuote(),
    );
    expect(resolveSelectedShippingQuoteForLabel([otherQuote()], SELECTED)).toBeNull();
    expect(retainCheckoutSelectedQuoteId([otherQuote()], SELECTED)).toBe(SELECTED);
    expect(retainCheckoutSelectedQuoteId([matchingQuote()], SELECTED)).toBe(SELECTED);
    const resolveSrc = read("lib/shipping/selected-shipping-quote-contract-v1.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const fn = resolveSrc.slice(
      resolveSrc.indexOf("export function resolveSelectedShippingQuoteForLabel"),
      resolveSrc.indexOf("export function retainCheckoutSelectedQuoteId"),
    );
    expect(fn).not.toContain("quotes[0]");
    expect(labelGen).not.toMatch(
      /selectedQuoteId\s*\?\?\s*record\?\.pricing\?\.quotes\[0\]/,
    );
  });

  it("G — Royal Mail selected quote resolves through the generic resolver", () => {
    const hydrated = buildLegacyBridgeShippingQuote({
      quoteId: SELECTED,
      carrier: "Royal Mail",
      serviceName: "Royal Mail",
      pricePence: 253,
    });
    expect(hydrated.shippingOptionCode).toBeUndefined();
    expect(resolveSelectedShippingQuoteForLabel([hydrated], SELECTED)?.id).toBe(SELECTED);
    expect(retainCheckoutSelectedQuoteId([otherQuote(), hydrated], SELECTED)).toBe(SELECTED);
  });

  it("label generation hydrates missing quotes through existing shipping_quotes path", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(labelGen).toContain("buildLegacyBridgeShippingQuote");
    expect(labelGen).toContain("appendAndSelectShippingQuoteWithoutReplacing");
    expect(labelGen).toContain("resolveSelectedShippingQuoteForLabel");
    expect(labelGen).toContain(
      "Selected shipping quote could not be resolved for this order.",
    );
    expect(postPayment).toContain("retainCheckoutSelectedQuoteId");
    expect(postPayment).toContain("resolveSelectedShippingQuoteForLabel");
    expect(postPayment).not.toContain(
      "refreshed?.pricing?.selectedQuoteId !== checkoutQuote.id",
    );
    expect(postPayment).not.toMatch(/Never reconstruct method id from carrier name \/ price alone[\s\S]{0,80}quotes\.find\(\(quote\) => quote\.id === preferredQuoteId\)/);
  });
});

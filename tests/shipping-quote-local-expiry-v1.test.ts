/**
 * MEDIUM #6 — Local shipping quote expiry before label generation.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  LOCAL_QUOTE_EXPIRED_LABEL_MESSAGE,
  SHIPPING_QUOTE_LOCAL_EXPIRY_V1,
  evaluateShippingQuoteLocalExpiry,
  isShippingQuoteLocallyExpiredForLabel,
  parseShippingQuoteExpiresAtMs,
} from "@/lib/shipping/shipping-quote-local-expiry-v1";
import { resolveSelectedShippingQuoteForLabel } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import { separateShippingPricesPence } from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const NOW = Date.parse("2026-09-01T12:00:00.000Z");

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

describe("MEDIUM #6 — Local shipping quote expiry", () => {
  it("declares local expires_at fail-closed before provider label", () => {
    expect(SHIPPING_QUOTE_LOCAL_EXPIRY_V1.rule).toBe("LOCAL_EXPIRES_AT_BEFORE_LABEL");
    expect(SHIPPING_QUOTE_LOCAL_EXPIRY_V1.boundary).toBe("expires_at_lte_now_is_expired");
    expect(SHIPPING_QUOTE_LOCAL_EXPIRY_V1.missingExpiresAt).toBe(
      "do_not_invent_allow_existing_fail_safe",
    );
    expect([...SHIPPING_QUOTE_LOCAL_EXPIRY_V1.forbidden]).toEqual(
      expect.arrayContaining([
        "auto_replace_selected_quote",
        "quotes_zero_fallback",
        "price_fallback",
        "mutate_persisted_expires_at",
        "provider_call_when_locally_expired",
      ]),
    );
  });

  it("valid quote (expiresAt in the future) → label path allowed", () => {
    const result = evaluateShippingQuoteLocalExpiry({
      expiresAt: "2026-09-01T12:00:00.001Z",
      nowMs: NOW,
    });
    expect(result.status).toBe("not_expired");
    expect(
      isShippingQuoteLocallyExpiredForLabel({
        expiresAt: "2026-09-01T12:00:00.001Z",
        nowMs: NOW,
      }),
    ).toBe(false);
  });

  it("quote expired exactly at boundary → rejected", () => {
    const boundary = "2026-09-01T12:00:00.000Z";
    expect(parseShippingQuoteExpiresAtMs(boundary)).toBe(NOW);
    expect(
      evaluateShippingQuoteLocalExpiry({ expiresAt: boundary, nowMs: NOW }).status,
    ).toBe("expired");
    expect(
      isShippingQuoteLocallyExpiredForLabel({ expiresAt: boundary, nowMs: NOW }),
    ).toBe(true);
  });

  it("quote expired in the past → rejected", () => {
    expect(
      isShippingQuoteLocallyExpiredForLabel({
        expiresAt: "2026-09-01T11:59:59.999Z",
        nowMs: NOW,
      }),
    ).toBe(true);
  });

  it("timezone-safe: offset timestamps compare as canonical instants", () => {
    const withOffset = "2026-09-01T13:00:00.000+01:00";
    expect(parseShippingQuoteExpiresAtMs(withOffset)).toBe(NOW);
    expect(
      isShippingQuoteLocallyExpiredForLabel({ expiresAt: withOffset, nowMs: NOW }),
    ).toBe(true);
    expect(
      isShippingQuoteLocallyExpiredForLabel({
        expiresAt: "2026-09-01T13:00:00.001+01:00",
        nowMs: NOW,
      }),
    ).toBe(false);
  });

  it("missing expiresAt → existing fail-safe (do not invent; allow)", () => {
    expect(evaluateShippingQuoteLocalExpiry({ expiresAt: null, nowMs: NOW }).status).toBe(
      "not_expired",
    );
    expect(
      evaluateShippingQuoteLocalExpiry({ expiresAt: undefined, nowMs: NOW }).status,
    ).toBe("not_expired");
    expect(evaluateShippingQuoteLocalExpiry({ expiresAt: "  ", nowMs: NOW }).status).toBe(
      "not_expired",
    );
    expect(isShippingQuoteLocallyExpiredForLabel({ expiresAt: null, nowMs: NOW })).toBe(
      false,
    );
  });

  it("invalid expiresAt → fail closed (no invented expiry, no provider call)", () => {
    expect(
      evaluateShippingQuoteLocalExpiry({
        expiresAt: "not-a-timestamp",
        nowMs: NOW,
      }).status,
    ).toBe("invalid_expires_at");
    expect(
      isShippingQuoteLocallyExpiredForLabel({
        expiresAt: "not-a-timestamp",
        nowMs: NOW,
      }),
    ).toBe(true);
  });

  it("expired quote cannot be auto-replaced; selected quote identity stays locked", () => {
    const locked = q({
      id: "sendcloud:42",
      carrier: "Evri",
      pricePence: 350,
      expiresAt: "2026-09-01T11:00:00.000Z",
    });
    const other = q({
      id: "sendcloud:99",
      carrier: "Royal Mail",
      pricePence: 200,
      expiresAt: "2026-09-02T12:00:00.000Z",
    });
    const resolved = resolveSelectedShippingQuoteForLabel([other, locked], "sendcloud:42");
    expect(resolved?.id).toBe("sendcloud:42");
    expect(resolved?.carrier).toBe("Evri");
    expect(resolved?.pricePence).toBe(350);
    expect(resolveSelectedShippingQuoteForLabel([other], "sendcloud:42")).toBeNull();
  });

  it("buyer price and provider cost remain locked (separation intact)", () => {
    const locked = q({ id: "sendcloud:7", carrier: "Evri", pricePence: 305 });
    const sep = separateShippingPricesPence({
      providerShippingCostPence: locked.pricePence,
      labelCount: 1,
    });
    expect(sep.providerShippingCostPence).toBe(305);
    expect(sep.buyerShippingPricePence).toBeGreaterThan(305);
    expect(sep.buyerShippingPricePence).not.toBe(sep.providerShippingCostPence);
  });

  it("label-generation wires local expiry BEFORE generateOrderShippingLabel", () => {
    const src = read("lib/shipping/label-generation.server.ts");
    expect(src).toContain("shipping-quote-local-expiry-v1");
    expect(src).toContain("isShippingQuoteLocallyExpiredForLabel");
    expect(src).toContain("LOCAL_QUOTE_EXPIRED_LABEL_MESSAGE");

    const guardIdx = src.indexOf("isShippingQuoteLocallyExpiredForLabel");
    const providerIdx = src.indexOf("await generateOrderShippingLabel");
    expect(guardIdx).toBeGreaterThan(0);
    expect(providerIdx).toBeGreaterThan(guardIdx);
    expect(src).toContain(
      "return rovexoValidationFailure(LOCAL_QUOTE_EXPIRED_LABEL_MESSAGE)",
    );
    expect(src).toContain("idempotent: true");
    expect(src).not.toMatch(/expiresAt[\s\S]{0,200}quotes\[0\]/);
  });

  it("store payload update does not mutate persisted expires_at", () => {
    const store = read("lib/shipping/store.ts");
    const start = store.indexOf(
      "export async function updateShippingQuotePayloadWithoutReplacing",
    );
    expect(start).toBeGreaterThan(0);
    const updateFn = store.slice(start, start + 2800);
    expect(updateFn).toContain("quote_payload");
    expect(updateFn).not.toMatch(/expires_at\s*:/);
  });

  it("provider quote_expired remains failure-safe (no invalid order state promotion)", () => {
    const adapter = read("lib/shipping/pricing/sendcloud-adapter.ts");
    expect(adapter).toContain('"quote_expired"');
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(labelGen).toContain("ok: false");
    expect(labelGen).toContain("providerFailure");
    expect(LOCAL_QUOTE_EXPIRED_LABEL_MESSAGE).toMatch(/not replaced automatically/i);
  });

  it("V2/V3 controlled label path still enters canonical generateShippingLabelForOrder", () => {
    const controlled = read("lib/shipping/generate-label-rvx8343a7c7.server.ts");
    expect(controlled).toContain("generateShippingLabelForOrder");
  });
});

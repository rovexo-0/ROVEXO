/**
 * MEDIUM #6 extension — ROVEXO seller shipping deadline (3 calendar days from paid_at).
 * Independent from certified Sendcloud local expires_at protection.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  SELLER_SHIPPING_DEADLINE_EXPIRED_LABEL_MESSAGE,
  SELLER_SHIPPING_DEADLINE_V1,
  computeSellerShippingDeadlineMs,
  evaluateSellerShippingDeadline,
  isSellerShippingDeadlineExpiredForLabel,
  parsePaymentConfirmedAtMs,
} from "@/lib/shipping/seller-shipping-deadline-v1";
import {
  evaluateShippingQuoteLocalExpiry,
  isShippingQuoteLocallyExpiredForLabel,
} from "@/lib/shipping/shipping-quote-local-expiry-v1";
import { resolveSelectedShippingQuoteForLabel } from "@/lib/shipping/selected-shipping-quote-contract-v1";
import { separateShippingPricesPence } from "@/lib/shipping/pricing/buyer-shipping-price-v1";
import type { ShippingQuote } from "@/lib/shipping/types";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const PAID_AT = "2026-09-01T12:00:00.000Z";
const PAID_MS = Date.parse(PAID_AT);
const DAY_MS = 24 * 60 * 60 * 1000;

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

describe("MEDIUM #6 — Seller shipping deadline = 3 calendar days", () => {
  it("declares 3 calendar days from paid_at with fail-closed boundary", () => {
    expect(SELLER_SHIPPING_DEADLINE_V1.calendarDays).toBe(3);
    expect(SELLER_SHIPPING_DEADLINE_V1.durationMs).toBe(3 * DAY_MS);
    expect(SELLER_SHIPPING_DEADLINE_V1.startField).toBe("orders.paid_at");
    expect(SELLER_SHIPPING_DEADLINE_V1.boundary).toBe("deadline_ms_lte_now_is_expired");
    expect(SELLER_SHIPPING_DEADLINE_V1.recoveryStatus).toBe("repair_required");
    expect([...SELLER_SHIPPING_DEADLINE_V1.forbidden]).toEqual(
      expect.arrayContaining([
        "auto_cancel_order",
        "auto_replace_selected_quote",
        "auto_replace_carrier",
        "auto_replace_buyer_shipping_price",
        "auto_generate_new_quote",
        "provider_call_when_deadline_expired",
      ]),
    );
  });

  it("DAY_1: payment + 1 day → label allowed", () => {
    const nowMs = PAID_MS + 1 * DAY_MS;
    expect(evaluateSellerShippingDeadline({ paidAt: PAID_AT, nowMs }).status).toBe(
      "within_deadline",
    );
    expect(isSellerShippingDeadlineExpiredForLabel({ paidAt: PAID_AT, nowMs })).toBe(
      false,
    );
  });

  it("DAY_2: payment + 2 days → label allowed", () => {
    const nowMs = PAID_MS + 2 * DAY_MS;
    expect(evaluateSellerShippingDeadline({ paidAt: PAID_AT, nowMs }).status).toBe(
      "within_deadline",
    );
    expect(isSellerShippingDeadlineExpiredForLabel({ paidAt: PAID_AT, nowMs })).toBe(
      false,
    );
  });

  it("DAY_3_BOUNDARY: exact deadline instant → expired (canonical fail-closed)", () => {
    const deadlineMs = computeSellerShippingDeadlineMs(PAID_MS);
    expect(deadlineMs).toBe(PAID_MS + 3 * DAY_MS);
    expect(parsePaymentConfirmedAtMs(PAID_AT)).toBe(PAID_MS);
    expect(
      evaluateSellerShippingDeadline({ paidAt: PAID_AT, nowMs: deadlineMs }).status,
    ).toBe("expired");
    expect(
      isSellerShippingDeadlineExpiredForLabel({ paidAt: PAID_AT, nowMs: deadlineMs }),
    ).toBe(true);
  });

  it("OVER_3_DAYS: payment + 3 days + 1ms → seller label blocked", () => {
    const nowMs = PAID_MS + 3 * DAY_MS + 1;
    expect(isSellerShippingDeadlineExpiredForLabel({ paidAt: PAID_AT, nowMs })).toBe(
      true,
    );
  });

  it("quote expires before 3 days → blocked by quote gate (deadline still open)", () => {
    const nowMs = PAID_MS + 1 * DAY_MS;
    expect(isSellerShippingDeadlineExpiredForLabel({ paidAt: PAID_AT, nowMs })).toBe(
      false,
    );
    expect(
      isShippingQuoteLocallyExpiredForLabel({
        expiresAt: new Date(PAID_MS + 12 * 60 * 60 * 1000).toISOString(),
        nowMs,
      }),
    ).toBe(true);
  });

  it("quote valid but seller deadline expired → blocked by seller deadline", () => {
    const nowMs = PAID_MS + 4 * DAY_MS;
    expect(
      isShippingQuoteLocallyExpiredForLabel({
        expiresAt: new Date(PAID_MS + 10 * DAY_MS).toISOString(),
        nowMs,
      }),
    ).toBe(false);
    expect(isSellerShippingDeadlineExpiredForLabel({ paidAt: PAID_AT, nowMs })).toBe(
      true,
    );
  });

  it("both valid → label allowed", () => {
    const nowMs = PAID_MS + 1 * DAY_MS;
    expect(isSellerShippingDeadlineExpiredForLabel({ paidAt: PAID_AT, nowMs })).toBe(
      false,
    );
    expect(
      evaluateShippingQuoteLocalExpiry({
        expiresAt: new Date(PAID_MS + 2 * DAY_MS).toISOString(),
        nowMs,
      }).status,
    ).toBe("not_expired");
  });

  it("missing paid_at → fail closed (do not invent)", () => {
    expect(evaluateSellerShippingDeadline({ paidAt: null, nowMs: PAID_MS }).status).toBe(
      "missing_paid_at",
    );
    expect(isSellerShippingDeadlineExpiredForLabel({ paidAt: null, nowMs: PAID_MS })).toBe(
      true,
    );
  });

  it("timezone-safe paid_at offset compares as canonical instant", () => {
    const paidOffset = "2026-09-01T13:00:00.000+01:00";
    expect(parsePaymentConfirmedAtMs(paidOffset)).toBe(PAID_MS);
    const deadlineMs = computeSellerShippingDeadlineMs(PAID_MS);
    expect(
      isSellerShippingDeadlineExpiredForLabel({
        paidAt: paidOffset,
        nowMs: deadlineMs,
      }),
    ).toBe(true);
  });

  it("expired deadline → no auto quote/carrier replacement; quote id + buyer price locked", () => {
    const locked = q({
      id: "sendcloud:42",
      carrier: "Evri",
      pricePence: 350,
      expiresAt: new Date(PAID_MS + 10 * DAY_MS).toISOString(),
    });
    const other = q({
      id: "sendcloud:99",
      carrier: "Royal Mail",
      pricePence: 200,
    });
    const resolved = resolveSelectedShippingQuoteForLabel([other, locked], "sendcloud:42");
    expect(resolved?.id).toBe("sendcloud:42");
    expect(resolved?.carrier).toBe("Evri");
    expect(resolved?.pricePence).toBe(350);
    expect(resolveSelectedShippingQuoteForLabel([other], "sendcloud:42")).toBeNull();

    const sep = separateShippingPricesPence({
      providerShippingCostPence: locked.pricePence,
      labelCount: 1,
    });
    expect(sep.providerShippingCostPence).toBe(350);
    expect(sep.buyerShippingPricePence).toBeGreaterThan(350);
  });

  it("label-generation wires seller deadline BEFORE provider call; keeps local expires_at", () => {
    const src = read("lib/shipping/label-generation.server.ts");
    expect(src).toContain("shipping-quote-local-expiry-v1");
    expect(src).toContain("seller-shipping-deadline-v1");
    expect(src).toContain("isShippingQuoteLocallyExpiredForLabel");
    expect(src).toContain("isSellerShippingDeadlineExpiredForLabel");
    expect(src).toContain("paid_at");
    expect(src).toContain("SELLER_SHIPPING_DEADLINE_EXPIRED_LABEL_MESSAGE");
    expect(src).toContain("LOCAL_QUOTE_EXPIRED_LABEL_MESSAGE");

    const quoteIdx = src.indexOf("isShippingQuoteLocallyExpiredForLabel");
    const deadlineIdx = src.indexOf("isSellerShippingDeadlineExpiredForLabel({");
    const providerIdx = src.indexOf("await generateOrderShippingLabel");
    expect(quoteIdx).toBeGreaterThan(0);
    expect(deadlineIdx).toBeGreaterThan(quoteIdx);
    expect(providerIdx).toBeGreaterThan(deadlineIdx);

    expect(src).toContain("hasReusableProviderParcel");
    expect(src).toContain("idempotent: true");
    expect(src).toContain("SELLER_SHIPPING_DEADLINE_V1.recoveryStatus");
    expect(src).toContain("shipping_setup_status");
    expect(src).not.toMatch(
      /isSellerShippingDeadlineExpiredForLabel[\s\S]{0,400}quotes\[0\]/,
    );
  });

  it("recovery flow remains compatible (repair_required status + repair module)", () => {
    expect(SELLER_SHIPPING_DEADLINE_V1.recoveryStatus).toBe("repair_required");
    const setup = read("lib/shipping/shipping-setup-status-v1.ts");
    expect(setup).toContain('"repair_required"');
    const repair = read("lib/orders/repair-paid-order-shipping.server.ts");
    expect(repair).toContain("repairPaidOrderShippingPersistence");
    expect(repair).toContain("shipping_setup_status");
    expect(SELLER_SHIPPING_DEADLINE_EXPIRED_LABEL_MESSAGE).toMatch(/recovery\/review/i);
  });
});

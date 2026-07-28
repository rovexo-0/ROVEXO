import { describe, expect, it } from "vitest";
import {
  BUY_NOW_RVX_CODES,
  formatBuyNowUserError,
  GUARD16_TO_RVX,
  resolveCheckoutGuard16FailureCode,
  RVX_UNCLASSIFIED,
  type CheckoutGuard16Check,
} from "@/lib/checkout/buy-now-guard-v1";
import { mapOrderCheckoutErrorToRvx } from "@/lib/checkout/map-order-checkout-error-v1";

describe("Absolute Error Classification Law v1.0", () => {
  it("maps each guard16 failure to its canonical RVX — never collapses to RVX-2011", () => {
    const allPass = Object.fromEntries(
      (Object.keys(GUARD16_TO_RVX) as CheckoutGuard16Check[]).map((key) => [key, true]),
    ) as Record<CheckoutGuard16Check, boolean>;

    expect(resolveCheckoutGuard16FailureCode({ ...allPass, financialAudit: false })).toBe(
      "RVX-2011",
    );
    expect(resolveCheckoutGuard16FailureCode({ ...allPass, paymentSession: false })).toBe(
      "RVX-2010",
    );
    expect(resolveCheckoutGuard16FailureCode({ ...allPass, orderID: false })).toBe("RVX-2008");
    expect(resolveCheckoutGuard16FailureCode({ ...allPass, listingLock: false })).toBe("RVX-2007");
  });

  it("never maps unknown / empty errors to RVX-2010 or RVX-2011", () => {
    expect(mapOrderCheckoutErrorToRvx("").code).toBe(RVX_UNCLASSIFIED);
    expect(mapOrderCheckoutErrorToRvx("boom unexpected").code).toBe(RVX_UNCLASSIFIED);
    expect(mapOrderCheckoutErrorToRvx("Something went wrong.").code).toBe(RVX_UNCLASSIFIED);
    expect(mapOrderCheckoutErrorToRvx("financial audit failed").code).toBe("RVX-2011");
    expect(mapOrderCheckoutErrorToRvx("payment session failed").code).toBe("RVX-2010");
    expect(mapOrderCheckoutErrorToRvx("Unable to create order.").code).toBe("RVX-2008");
  });

  it("keeps one user message per canonical RVX code", () => {
    for (const code of Object.keys(BUY_NOW_RVX_CODES) as (keyof typeof BUY_NOW_RVX_CODES)[]) {
      expect(formatBuyNowUserError(code)).toBe(`${code}\n${BUY_NOW_RVX_CODES[code]}`);
    }
    expect(formatBuyNowUserError(RVX_UNCLASSIFIED)).toContain(RVX_UNCLASSIFIED);
  });
});

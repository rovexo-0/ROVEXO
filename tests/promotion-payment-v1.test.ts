/**
 * Promote payment fail-closed + wallet/card path — unit checks.
 */

import { describe, expect, it } from "vitest";
import {
  PROMOTION_PAYMENT_SAFE,
  sanitizePromotionCheckoutError,
  toPromotionPaymentSafeError,
} from "@/lib/promotions/payment-safe";
import { resolvePromotionSuccessContent } from "@/lib/promotions/success-copy";
import { STORE_SHOWCASE_USER_COPY } from "@/lib/promote/constants";
import {
  PROMOTE_PAYMENT_CONTINUE_LABEL,
  PROMOTE_PAYMENT_FREEZE_RULES,
  PROMOTE_PAYMENT_METHODS,
  PROMOTE_PAYMENT_NO_METHOD_COPY,
  getPromotePaymentFreezeSnapshot,
} from "@/lib/promotions/promote-payment-freeze-v1";
import { formatDefaultCardLabel } from "@/lib/promotions/payment-format";
import { resolveActivationCopy } from "@/lib/promotions/notifications";

describe("promotion payment safe errors", () => {
  it("never leaks seller checkout technical copy", () => {
    expect(sanitizePromotionCheckoutError("Unable to start seller promotion checkout.")).toBe(
      PROMOTION_PAYMENT_SAFE.processFailed,
    );
    expect(sanitizePromotionCheckoutError("Stripe API error: card_declined")).toBe(
      PROMOTION_PAYMENT_SAFE.processFailed,
    );
    expect(toPromotionPaymentSafeError("payment")).toBe(PROMOTION_PAYMENT_SAFE.paymentFailed);
  });

  it("keeps product gate messages", () => {
    expect(
      sanitizePromotionCheckoutError("Store Showcase is disabled while Holiday Mode is on."),
    ).toMatch(/Holiday Mode/i);
    expect(sanitizePromotionCheckoutError("Insufficient wallet balance.")).toMatch(/wallet/i);
  });
});

describe("store showcase checkout copy", () => {
  it("lists only the three promote benefits", () => {
    expect([...STORE_SHOWCASE_USER_COPY.promotes]).toEqual([
      "Entire Store Visibility",
      "Featured Exposure",
      "Automatic Expiration",
    ]);
  });
});

describe("promotion success copy", () => {
  it("returns store showcase success with expiry", () => {
    const content = resolvePromotionSuccessContent("store_featured");
    expect(content.title).toMatch(/Store Showcase/i);
    expect(content.body).toMatch(/now live/i);
    expect(content.expiresLabel).toBe("7 Days");
  });
});

describe("promote payment freeze v1", () => {
  it("locks wallet + default card only and CONTINUE CTA", () => {
    const snap = getPromotePaymentFreezeSnapshot();
    expect(snap.methods).toEqual([...PROMOTE_PAYMENT_METHODS]);
    expect(PROMOTE_PAYMENT_CONTINUE_LABEL).toBe("Continue");
    expect(PROMOTE_PAYMENT_FREEZE_RULES.noRefunds).toBe(true);
    expect(PROMOTE_PAYMENT_FREEZE_RULES.noCancellation).toBe(true);
    expect(PROMOTE_PAYMENT_FREEZE_RULES.timerStartsImmediately).toBe(true);
    expect(PROMOTE_PAYMENT_NO_METHOD_COPY).toMatch(/No payment method available/i);
  });

  it("formats default card as Brand •••• last4", () => {
    expect(formatDefaultCardLabel({ brand: "visa", last4: "8456" })).toBe("Visa •••• 8456");
  });

  it("builds store showcase activation notification copy", () => {
    const copy = resolveActivationCopy({
      kind: "store_featured",
      durationLabel: "7 Days",
      endsAt: "2026-07-28T12:00:00.000Z",
    });
    expect(copy.title).toBe("Promotion activated.");
    expect(copy.subtitle).toMatch(/Store Showcase/i);
    expect(copy.detail).toMatch(/Duration: 7 Days/);
    expect(copy.detail).toMatch(/Expires:/);
  });
});

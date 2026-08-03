import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUY_NOW_BLOOD_FIX_V1,
  BUY_NOW_RVX_CODES,
  formatBuyNowUserError,
  isForbiddenBuyNowGenericError,
  resolveCheckoutGuard16,
  runBuyNowGuard,
} from "@/lib/checkout/buy-now-guard-v1";
import { ABSOLUTE_FINANCIAL_LAW_V1 } from "@/lib/supreme-blood-code-xxiv-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function allPass() {
  return {
    listing: true,
    buyer: true,
    seller: true,
    price: true,
    shipping: true,
    currency: true,
    lock: true,
    order: true,
    transaction: true,
    paymentSession: true,
    financialAudit: true,
    idempotency: true,
  };
}

describe("Buy Now BLOOD FIX v1.0 / Root Cause Detection", () => {
  it("locks 16 checkout guard checks + Buy Now sequence", () => {
    expect(BUY_NOW_BLOOD_FIX_V1.checkoutGuard16Checks).toHaveLength(16);
    expect(BUY_NOW_BLOOD_FIX_V1.buyNowSequence).toHaveLength(12);
    expect(BUY_NOW_BLOOD_FIX_V1.forbiddenBlindRedirect).toBe(true);
    expect(Object.keys(BUY_NOW_RVX_CODES)).toHaveLength(12);
    expect(ABSOLUTE_FINANCIAL_LAW_V1.rootCauseDetectionMode.active).toBe(true);
    expect(ABSOLUTE_FINANCIAL_LAW_V1.rootCauseDetectionMode.checkoutGuardChecks).toBe(16);
  });

  it("STOP on first failed gate — no SUCCESS", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const result = runBuyNowGuard({ ...allPass(), order: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("RVX-2008");
      expect(result.userFacing).toBe("RVX-2008\nWe couldn't start your order. Please try again.");
      expect(result.failedStep).toBe("order");
    }
    spy.mockRestore();
    info.mockRestore();
  });

  it("PASS only when every Buy Now check is true", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    expect(runBuyNowGuard(allPass()).ok).toBe(true);
    info.mockRestore();
  });

  it("forbids generic Something went wrong copy", () => {
    expect(isForbiddenBuyNowGenericError("Something went wrong.")).toBe(true);
    expect(isForbiddenBuyNowGenericError("Something went wrong. Check your connection")).toBe(
      true,
    );
    expect(formatBuyNowUserError("RVX-2010")).toBe(
      "RVX-2010\nPayment isn't ready yet. Please try again.",
    );
    expect(formatBuyNowUserError("RVX-2003")).toBe(
      "RVX-2003\nThis seller can't accept orders right now.",
    );
    expect(formatBuyNowUserError("RVX-2011")).toBe(
      "RVX-2011\nTotals don't match. Please try again.",
    );
  });

  it("Checkout Guard 16 fail-closed", () => {
    const pass = Object.fromEntries(
      BUY_NOW_BLOOD_FIX_V1.checkoutGuard16Checks.map((k) => [k, true]),
    ) as Record<(typeof BUY_NOW_BLOOD_FIX_V1.checkoutGuard16Checks)[number], boolean>;
    expect(resolveCheckoutGuard16(pass)).toBe("ALL_PASSED");
    expect(resolveCheckoutGuard16({ ...pass, financialAudit: false })).toBe("STOP");
  });

  it("Product Buy Now is guard-gated — no blind router.push", () => {
    const product = readSource("features/product-detail/ProductDetailPage.tsx");
    const conversationHub = readSource("features/inbox/components/ConversationHub.tsx");
    const form = readSource("features/checkout/hooks/use-checkout-form.ts");
    const error = readSource("app/(platform)/checkout/error.tsx");

    expect(product).toContain("executeBuyNow");
    expect(product).toContain("buildBuyNowCheckoutHref");
    expect(product).not.toContain("/cart");
    expect(product).not.toContain("addToCart");
    expect(conversationHub).toContain("executeBuyNow");
    expect(conversationHub).toContain("buildBuyNowCheckoutHref");
    expect(error).toContain("RVX_UNCLASSIFIED");
    expect(error).not.toContain("FailClosedPanel");
    expect(form).not.toContain("Something went wrong");
    expect(form).not.toContain("You're offline");
    expect(readSource("features/checkout/lib/load-checkout-page.ts")).toContain("orderId");
    expect(readSource("features/checkout/lib/load-checkout-page.ts")).toContain(
      "CHECKOUT_SESSION_ENGINE_getByPublicId",
    );
    expect(readSource("features/checkout/lib/load-checkout-page.ts")).not.toContain("notFound(");
    expect(readSource("app/api/orders/checkout/route.ts")).toContain("mapOrderCheckoutErrorToRvx");
    expect(readSource("app/api/orders/checkout/route.ts")).not.toContain("Unable to start checkout.");
    expect(readSource("lib/orders/checkout.ts")).toContain("finalizePendingOrderCheckoutSession");
    expect(readSource("app/api/checkout/buy-now/route.ts")).toContain("BUY_NOW_ENGINE");
    expect(readSource("app/api/checkout/buy-now/route.ts")).toContain("RVX_UNCLASSIFIED");
    expect(readSource("app/api/checkout/buy-now/route.ts")).not.toContain(
      'FINANCIAL_LOGGER("FINANCIAL AUDIT FAILED")',
    );
  });
});

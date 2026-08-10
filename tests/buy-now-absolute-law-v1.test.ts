import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  BUY_NOW_ABSOLUTE_LAW_V1,
  BUY_NOW_ABSOLUTE_LAW_V2,
  assertBuyNowCheckoutPath,
  isForbiddenBuyNowCartPath,
  amountsMatch,
  isUserVisibleValidationJargon,
} from "@/lib/checkout/buy-now-absolute-law-v1";
import {
  BUY_NOW_RVX_CODES,
  BUY_NOW_PUBLIC_MESSAGES,
  formatBuyNowUserError,
  toBuyNowPublicMessage,
  containsForbiddenBuyNowUiLeak,
} from "@/lib/checkout/buy-now-guard-v1";
import { buildBuyNowCheckoutHref } from "@/features/checkout/hooks/use-buy-now-navigation";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Buy Now Absolute Law — Buy Now ≠ Cart", () => {
  it("locks equation and forbidden destinations", () => {
    expect(BUY_NOW_ABSOLUTE_LAW_V1.version).toBe("7.1");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.bloodCode).toBe("v7.1");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.rovexoVersion).toBe("v1.0");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.userSingularity).toBe("THERE_IS_ONLY_USER_ACCOUNT");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.selfPurchaseSsot).toContain("self-purchase-absolute-law-v1");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.mustVerifyBeforeLock).toContain("currentUserNotListingOwner");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.mustVerifyBeforeLock).not.toContain("sellerNotSelfPurchase");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.priority).toBe(1);
    expect(BUY_NOW_ABSOLUTE_LAW_V1.status).toBe("FINALIZATION_LOCKED");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.absoluteLaw).toBe(
      "NOTHING_HIGHER_PRIORITY_THAN_BUY_NOW_CHECKOUT_PAYMENT_SUCCESS_ORDER",
    );
    expect(BUY_NOW_ABSOLUTE_LAW_V1.ownerLaw).toBe("BUY_NOW_IS_PRIORITY_1_OWNER_LAW");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.finalizationLaw).toBe(
      "NOT_COMPLETE_UNTIL_100_PERCENT_REAL_E2E_ON_LOCALHOST_3000",
    );
    expect(BUY_NOW_ABSOLUTE_LAW_V1.priorityOneObjective).toBe(
      "BUY_NOW_CHECKOUT_PAYMENT_SUCCESS_ORDER",
    );
    expect(BUY_NOW_ABSOLUTE_LAW_V1.priorityOneChain).toEqual([
      "BUY_NOW",
      "CHECKOUT",
      "PAYMENT",
      "SUCCESS",
      "ORDER",
    ]);
    expect(BUY_NOW_ABSOLUTE_LAW_V2).toBe(BUY_NOW_ABSOLUTE_LAW_V1);
    expect(BUY_NOW_ABSOLUTE_LAW_V1.equation).toBe("BUY_NOW !== ADD_TO_CART");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.userEquation).toBe("BUY_NOW = CHECKOUT");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.defaultStatusUntilOwnerPass).toBe("IN_DEVELOPMENT");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.absoluteEquations).toContain("NO_BUYER = NO_CHECKOUT");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.absoluteEquations).toContain("ONE_STEP_FAILS = NO_PASS");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.sellerPhase).toContain("NOT_HOLIDAY_MODE");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.buyerPhase).toContain("NOT_SELLER");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.checkoutPhase).toContain("PLATFORM_FEE_VERIFIED");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.paymentPhase).toContain("THREE_D_SECURE");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.orderPhase).toContain("LOCK_LISTING");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.postPaymentPhase).toContain("TRACKING_CREATED");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.statusRequiredForCompletion).toContain("BUILD_PASS");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.statusRequiredForCompletion).toContain("TRACKING_PASS");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.statusRequiredForCompletion).toContain("OWNER_PASS");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.onlyAllowedPath).toContain("SELF_PURCHASE_CHECK");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.onlyAllowedPath).toContain("ORDER_CREATED");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.zeroSkipForbidden).toContain("FORCE_CHECKOUT");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.zeroSkipForbidden).toContain("FORCE_SUCCESS");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.zeroSkipForbidden).toContain("DISABLING_BUYER_GATE");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.zeroSkipForbidden).toContain("FAKE_STRIPE");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.sellerValidationMustOpenCheckoutWhen).toContain(
      "SELLER_IS_NOT_BUYER",
    );
    expect(BUY_NOW_ABSOLUTE_LAW_V1.developmentLockBlocked).toContain("Deploy");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.allowedDevelopmentOnly).toContain("BUY_NOW");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.successPath).toEqual([
      "BUY_NOW",
      "CHECKOUT",
      "PAYMENT",
      "SUCCESS",
      "ORDER_CREATED",
      "PASS",
    ]);
    expect(BUY_NOW_ABSOLUTE_LAW_V1.failurePath).toEqual([
      "BUY_NOW",
      "PUBLIC_ERROR",
      "RETRY_OR_OK",
      "LISTING_PAGE",
      "PASS",
    ]);
    expect(BUY_NOW_ABSOLUTE_LAW_V1.publicErrorUx.actionContext).toBe(true);
    expect(BUY_NOW_ABSOLUTE_LAW_V1.publicErrorUx.retryWhenSafe).toBe(true);
    expect(BUY_NOW_ABSOLUTE_LAW_V1.publicErrorUx.dialog).toBe("BuyNowPublicErrorDialog");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.e2eQuotas.totalRequired).toBe(140);
    expect(BUY_NOW_ABSOLUTE_LAW_V1.forbiddenCursorDeclarations).toContain("100% COMPLETE");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.finalLaw).toContain("BUY_NOW_IS_LAW");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.developmentOnly).toBe("http://localhost:3000");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.mustOpen).toBe("/checkout");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.forbiddenDestinations).toContain("/cart");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.checkoutCopy.cta).toBe("Buy Now");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.checkoutCopy.fee).toBe("Platform Fee");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.sellerValidationRvx).toBe("RVX-2003");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.officialStatusBoard.checkout).toBe("WAITING");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.officialStatusBoard.selfPurchaseProtection).toBe("PASS");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.officialStatusBoard.reserved).toBe("PASS");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.officialStatusBoard.inventory).toBe("PASS");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.officialStatusBoard.sqlMigration).toBe("BLOCKER");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.officialStatusBoard.realE2e).toBe("WAITING");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.officialStatusBoard.payment).toBe("WAITING");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.measurableTests).toHaveLength(10);
    expect(BUY_NOW_ABSOLUTE_LAW_V1.onlyAcceptedSuccessPath[0]).toBe("ALT_BUYER_ACCOUNT");
    expect(BUY_NOW_ABSOLUTE_LAW_V1.onlyAcceptedSuccessPath).toContain("CHECKOUT_OPENS");
    expect(amountsMatch(1.1, 1.1)).toBe(true);
    expect(amountsMatch(1.1, 1.2)).toBe(false);
  });

  it("RVX user copy hides validation jargon", () => {
    for (const message of Object.values(BUY_NOW_RVX_CODES)) {
      expect(isUserVisibleValidationJargon(message)).toBe(false);
    }
    expect(formatBuyNowUserError("RVX-2003")).toBe(
      "RVX-2003\nThis seller can't accept orders right now.",
    );
  });

  it("public UI never shows RVX — dialog supports action context + Retry + OK", () => {
    expect(toBuyNowPublicMessage("RVX-2001")).toBe(BUY_NOW_PUBLIC_MESSAGES.itemUnavailable);
    expect(toBuyNowPublicMessage("RVX-2002")).toBe(BUY_NOW_PUBLIC_MESSAGES.signInRequired);
    expect(toBuyNowPublicMessage("RVX-2003")).toBe(BUY_NOW_PUBLIC_MESSAGES.sellerUnavailable);
    expect(toBuyNowPublicMessage("RVX-2010")).toBe(BUY_NOW_PUBLIC_MESSAGES.tryAgain);
    expect(containsForbiddenBuyNowUiLeak(toBuyNowPublicMessage("RVX-2003"))).toBe(false);
    expect(containsForbiddenBuyNowUiLeak("RVX-2003\nSeller validation failed.")).toBe(true);
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const dialog = readSource("features/checkout/components/BuyNowPublicErrorDialog.tsx");
    const blocked = readSource("features/checkout/components/CheckoutGuardBlocked.tsx");
    const nav = readSource("features/checkout/hooks/use-buy-now-navigation.ts");
    const checkout = readSource("features/checkout/components/CheckoutPage.tsx");
    expect(page).toContain("BuyNowPublicErrorDialog");
    expect(dialog).toContain("actionContext");
    expect(dialog).toContain("onRetry");
    expect(dialog).toContain("bn-public-error__retry");
    expect(checkout).toContain('actionContext="Checkout"');
    expect(blocked).toContain("toBuyNowPublicMessage");
    expect(blocked).not.toContain("Checkout blocked");
    expect(nav).toContain("toBuyNowPublicMessage");
    expect(nav).not.toContain("formatBuyNowUserError");
  });

  it("rejects cart paths and accepts /checkout only", () => {
    expect(isForbiddenBuyNowCartPath("/cart")).toBe(true);
    expect(isForbiddenBuyNowCartPath("/basket")).toBe(true);
    expect(assertBuyNowCheckoutPath("/checkout/rocket-dog")).toBe(true);
    expect(assertBuyNowCheckoutPath("/cart")).toBe(false);
    expect(
      buildBuyNowCheckoutHref("rocket-dog", "/checkout/rocket-dog?orderId=1"),
    ).toBe("/checkout/rocket-dog?orderId=1");
    expect(() => buildBuyNowCheckoutHref("rocket-dog", "/cart")).toThrow(/cart/i);
    expect(() => buildBuyNowCheckoutHref("rocket-dog", "/orders")).toThrow(/checkout/i);
  });

  it("Product Buy Now flow has zero cart dependencies", () => {
    const hook = readSource("features/product-detail/use-product-action-bar.ts");
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    const nav = readSource("features/checkout/hooks/use-buy-now-navigation.ts");
    const api = readSource("app/api/checkout/buy-now/route.ts");
    const engine = readSource("lib/checkout/engines/buy-now-engine-v1.ts");
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    const price = readSource("features/checkout/components/CheckoutPriceSummary.tsx");

    expect(hook).not.toContain("cart-engine");
    expect(hook).not.toContain("addToCart");
    expect(hook).not.toContain("canAddToCart");
    expect(hook).not.toContain("/cart");
    expect(page).not.toContain("canAddToCart");
    expect(page).not.toContain("addToCart");
    expect(page).toContain("executeBuyNow");
    expect(page).toContain("buildBuyNowCheckoutHref");
    expect(nav).toContain("/api/checkout/buy-now");
    expect(nav).toContain("must never open cart");
    expect(api).toContain("BUY_NOW_ENGINE");
    expect(api).not.toContain("/cart");
    expect(engine).toContain("account_status");
    expect(engine).toContain("BUY_NOW_ABSOLUTE_LAW_V2");
    expect(engine).toContain("amountsMatch");
    expect(engine).toContain("LISTING_UNLOCK_ENGINE");
    expect(engine).toContain("isAccountActive");
    // CHECKOUT_UI_v1.0 frozen CTA — TOTAL PAY (not product-page "Buy Now", not "Pay Securely")
    expect(wizard).toContain("TOTAL PAY");
    expect(wizard).not.toContain("Pay Securely");
    expect(price).toContain("Platform Fee");
    expect(price).not.toMatch(/Buyer Protection/i);
  });
});

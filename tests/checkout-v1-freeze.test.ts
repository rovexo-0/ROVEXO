import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  CHECKOUT_CANONICAL_FROZEN,
  CHECKOUT_CANONICAL_STATUS,
  CHECKOUT_LOCKED_SECTIONS,
  CHECKOUT_MASTER_FREEZE_COPY,
  CHECKOUT_SPEC_VERSION,
  CHECKOUT_UI_FREEZE_NAME,
  CHECKOUT_UI_FROZEN,
  CHECKOUT_UI_OWNER_APPROVED,
  CHECKOUT_UI_V1_FREEZE,
  CHECKOUT_VISUAL_LOCK,
} from "@/lib/checkout/freeze";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Checkout UI Freeze — CHECKOUT_UI_v1.0", () => {
  it("locks Owner-approved UI freeze constants", () => {
    expect(CHECKOUT_UI_FROZEN).toBe(true);
    expect(CHECKOUT_UI_OWNER_APPROVED).toBe(true);
    expect(CHECKOUT_UI_FREEZE_NAME).toBe("CHECKOUT_UI_v1.0");
    expect(CHECKOUT_UI_V1_FREEZE.status).toBe("FROZEN");
    expect(CHECKOUT_UI_V1_FREEZE.approvedAt).toBe("2026-07-25");
    expect(CHECKOUT_CANONICAL_FROZEN).toBe(true);
    expect(CHECKOUT_CANONICAL_STATUS).toBe("ABSOLUTE_FINAL_v1.0");
    expect(CHECKOUT_SPEC_VERSION).toBe("1.0");
    expect(CHECKOUT_VISUAL_LOCK.maxWidthPx).toBe("100%");
    expect(CHECKOUT_VISUAL_LOCK.ctaHeightPx).toBe(48);
    expect(CHECKOUT_VISUAL_LOCK.cardRadiusPx).toBe(10);
    expect(CHECKOUT_VISUAL_LOCK.sectionGapPx).toBe(10);
    expect(CHECKOUT_VISUAL_LOCK.headerHeightPx).toBe(52);
    expect(CHECKOUT_MASTER_FREEZE_COPY.cta).toBe("TOTAL PAY");
    expect(CHECKOUT_MASTER_FREEZE_COPY.feeLabel).toBe("Platform Fee");
    expect(CHECKOUT_LOCKED_SECTIONS).toEqual([
      "Product",
      "Address",
      "Delivery option",
      "Delivery details",
      "Phone",
      "Payment",
      "Price summary",
      "TOTAL PAY",
      "Secure Checkout",
    ]);
  });

  it("stamps CHECKOUT_UI_v1.0 DOM on confirm-only wizard", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    const page = readSource("features/checkout/components/CheckoutPage.tsx");
    const header = readSource("features/checkout/components/CheckoutPageHeader.tsx");
    const success = readSource("app/checkout/[slug]/success/page.tsx");
    const css = readSource("styles/rovexo/checkout-v1.css");
    const price = readSource("features/checkout/components/CheckoutPriceSummary.tsx");
    expect(wizard).toContain('data-checkout-freeze="CHECKOUT_UI_v1.0"');
    expect(wizard).toContain('data-checkout-ui="v1.0"');
    expect(wizard).toContain('data-checkout-version="v1.0"');
    expect(wizard).toContain('data-blood-checkout-compact="1.0"');
    expect(wizard).toMatch(/TOTAL PAY \$\{/);
    expect(wizard).not.toContain("Pay Securely");
    expect(wizard).not.toContain("Continue to Payment");
    expect(wizard).not.toMatch(/Buyer Protection/i);
    expect(price).not.toContain("Total to pay");
    expect(price).not.toContain("ckt-v1__price-total");
    expect(css).not.toContain(".ckt-v1__price-total");
    expect(css).toContain("--ckt-radius: 10px");
    expect(css).toContain("--ckt-gap: 10px");
    expect(css).toContain("min-height: 44px");
    expect(success).toContain("SUCCESS_ORDER_STATUSES");
    expect(page).toContain("showBottomNav={false}");
    expect(header).not.toContain("preferHistory");
    expect(existsSync(path.join(process.cwd(), "features/checkout/components/CheckoutDeliveryStepV1.tsx"))).toBe(
      false,
    );
    expect(existsSync(path.join(process.cwd(), "features/checkout/components/CheckoutPaymentStepV1.tsx"))).toBe(
      false,
    );
    expect(existsSync(path.join(process.cwd(), "features/checkout/components/CheckoutReviewStepV1.tsx"))).toBe(
      false,
    );
  });

  it("keeps Buy Now entry on listing checkout without cart intermediate", () => {
    const product = readSource("features/product-detail/ProductDetailPage.tsx");
    const conversationHub = readSource("features/inbox/components/ConversationHub.tsx");
    const bottomActions = readSource("features/transaction-hub/TransactionHubBottomActions.tsx");
    expect(product).toContain("buildBuyNowCheckoutHref");
    expect(product).toContain("use-buy-now-navigation");
    expect(product).not.toContain("CheckoutHubSheet");
    expect(conversationHub).toContain("executeBuyNow");
    expect(bottomActions).not.toContain("CheckoutHubSheet");
  });

  it("keeps Wallet + Sendcloud + post-pay wiring", () => {
    const hook = readSource("features/checkout/hooks/use-checkout-form.ts");
    const loader = readSource("features/checkout/lib/load-checkout-page.ts");
    const post = readSource("lib/orders/post-payment.server.ts");
    expect(hook).toContain("paymentMethodId");
    expect(loader).toContain("isSendcloudConfigured");
    expect(post).toContain("ensureOrderConversation");
    expect(post).toContain("generateShippingLabelForOrder");
    expect(existsSync(path.join(process.cwd(), "app/api/webhooks/sendcloud/route.ts"))).toBe(true);
  });

  it("redirects legacy address/payment/review URLs to single checkout", () => {
    for (const step of ["address", "payment", "review"] as const) {
      const src = readSource(`app/checkout/[slug]/${step}/page.tsx`);
      expect(src).toContain("redirect");
      expect(src).toMatch(/\/checkout\/\$\{/);
    }
  });

  it("declares UI not-included engines outside freeze", () => {
    expect(CHECKOUT_UI_V1_FREEZE.notIncluded).toContain("Payment Completion");
    expect(CHECKOUT_UI_V1_FREEZE.notIncluded).toContain("Order Engine");
    expect(CHECKOUT_UI_V1_FREEZE.notIncluded).toContain("Backend Logic");
  });
});

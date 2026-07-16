import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  CHECKOUT_CANONICAL_FROZEN,
  CHECKOUT_CANONICAL_STATUS,
  CHECKOUT_SPEC_VERSION,
  CHECKOUT_VISUAL_LOCK,
} from "@/lib/checkout/freeze";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Checkout v1.0 — CANONICAL FREEZE", () => {
  it("locks freeze constants", () => {
    expect(CHECKOUT_CANONICAL_FROZEN).toBe(true);
    expect(CHECKOUT_CANONICAL_STATUS).toBe("CANONICAL_FROZEN_v1.0");
    expect(CHECKOUT_SPEC_VERSION).toBe("1.0");
    expect(CHECKOUT_VISUAL_LOCK.maxWidthPx).toBe(430);
    expect(CHECKOUT_VISUAL_LOCK.ctaHeightPx).toBe(56);
  });

  it("marks frozen DOM on wizard and success", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    const page = readSource("features/checkout/components/CheckoutPage.tsx");
    const header = readSource("features/checkout/components/CheckoutPageHeader.tsx");
    const success = readSource("app/checkout/[slug]/success/page.tsx");
    expect(wizard).toContain('data-checkout-freeze="FROZEN"');
    expect(wizard).toContain('data-checkout-version="v1.0"');
    expect(success).toContain('data-checkout-freeze="FROZEN"');
    expect(success).toContain("SUCCESS_ORDER_STATUSES");
    expect(page).toContain("showBottomNav={false}");
    expect(header).not.toContain("preferHistory");
  });

  it("keeps Buy Now on listing checkout without cart intermediate", () => {
    const product = readSource("features/product-detail/ProductDetailPage.tsx");
    const hub = readSource("features/transaction-hub/TransactionHubBottomActions.tsx");
    expect(product).toContain("`/checkout/${product.slug}`");
    expect(product).not.toContain("CheckoutHubSheet");
    expect(hub).toContain("/checkout/");
    expect(hub).not.toContain("CheckoutHubSheet");
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

  it("documents freeze SSOT", () => {
    const spec = readSource("docs/modules/checkout/MASTER_UI_SPECIFICATION.md");
    const freeze = readSource("docs/modules/checkout/UI_FREEZE.md");
    const rule = readSource(".cursor/rules/checkout-v1-freeze.mdc");
    expect(spec).toContain("FROZEN");
    expect(spec).toContain("CANONICAL_FROZEN_v1.0");
    expect(freeze).toContain("FROZEN");
    expect(rule).toContain("CANONICAL | FROZEN");
  });
});

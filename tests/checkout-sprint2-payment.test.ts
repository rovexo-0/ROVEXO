import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { mapSendcloudTrackingStatus } from "@/lib/shipping/sendcloud/status-mapper";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("checkout sprint 2 — payment + sendcloud", () => {
  it("opens Buy Now on full-page checkout without cart", () => {
    const product = readSource("features/product-detail/ProductDetailPage.tsx");
    const hub = readSource("features/transaction-hub/TransactionHubBottomActions.tsx");

    expect(product).toContain("`/checkout/${product.slug}`");
    expect(product).not.toContain("CheckoutHubSheet");
    expect(hub).toContain("/checkout/");
    expect(hub).toContain("conversationId");
    expect(hub).not.toContain("CheckoutHubSheet");
  });

  it("wires wallet paymentMethodId into order checkout", () => {
    const hook = readSource("features/checkout/hooks/use-checkout-form.ts");
    const checkout = readSource("lib/orders/checkout.ts");
    const route = readSource("app/api/orders/checkout/route.ts");

    expect(hook).toContain("paymentMethodId");
    expect(hook).toContain("/api/payment-methods");
    expect(checkout).toContain("paymentMethodId");
    expect(route).toContain("paymentMethodId");
  });

  it("runs post-pay inbox + Sendcloud label pipeline", () => {
    const post = readSource("lib/orders/post-payment.server.ts");
    expect(post).toContain("ensureOrderConversation");
    expect(post).toContain("generateShippingLabelForOrder");
    expect(post).toContain("isSendcloudConfigured");
    expect(existsSync(path.join(process.cwd(), "lib/orders/ensure-order-conversation.ts"))).toBe(
      true,
    );
    expect(existsSync(path.join(process.cwd(), "app/api/webhooks/sendcloud/route.ts"))).toBe(true);
  });

  it("lands paid sessions on checkout success route", () => {
    const checkout = readSource("lib/orders/checkout.ts");
    const success = readSource("app/checkout/[slug]/success/page.tsx");
    const view = readSource("features/checkout/components/CheckoutSuccessView.tsx");

    expect(checkout).toContain("/checkout/${product.slug}/success?order_id=");
    expect(success).toContain("confirmOrderCheckoutSession");
    expect(success).toContain("CheckoutSuccessView");
    expect(view).toContain("View Order");
    expect(view).toContain("Open Conversation");
    expect(view).toContain("Continue Shopping");
  });

  it("maps Sendcloud lifecycle states onto shipping statuses", () => {
    expect(mapSendcloudTrackingStatus("Created")).toBe("preparing");
    expect(mapSendcloudTrackingStatus("Label Generated")).toBe("preparing");
    expect(mapSendcloudTrackingStatus("Collected")).toBe("collected");
    expect(mapSendcloudTrackingStatus("In Transit")).toBe("in_transit");
    expect(mapSendcloudTrackingStatus("Delivered")).toBe("delivered");
    expect(mapSendcloudTrackingStatus("Returned")).toBe("returned");
    expect(mapSendcloudTrackingStatus("Cancelled")).toBe("cancelled");
    expect(mapSendcloudTrackingStatus("Failed")).toBe("failed");
  });

  it("marks sprint 2 on the checkout shell", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    expect(wizard).toContain('data-checkout-sprint="2-payment"');
    expect(wizard).toContain('data-checkout-version="v1.0"');
  });
});

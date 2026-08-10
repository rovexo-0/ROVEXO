import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { PLATFORM_INTEGRATION_P0_SECURITY_CERTIFICATION_V1 as cert } from "@/lib/platform-integration/p0-security-integration-certification-v1";
import { adminUpdateOrderStatus } from "@/lib/admin/queries";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Platform Integration P0 — Security & Integration Certification", () => {
  it("locks shipping ownership assert and gated routes", () => {
    expect(cert.shippingOwnership.assert).toContain("assert-order-shipping-access");
    expect(cert.shippingOwnership.gatedRoutes).toEqual(
      expect.arrayContaining([
        "GET /api/shipping/labels",
        "GET /api/shipping?orderId=",
        "POST /api/shipping/quotes",
      ]),
    );

    const assertSrc = readSource("lib/shipping/assert-order-shipping-access.server.ts");
    expect(assertSrc).toContain("assertOrderShippingParticipant");
    expect(assertSrc).toContain("assertOrderShippingSeller");
    expect(assertSrc).toContain("buyer_id");
    expect(assertSrc).toContain("seller_id");

    const labelsSrc = readSource("app/api/shipping/labels/route.ts");
    expect(labelsSrc).toContain("assertOrderShippingSeller");
    expect(labelsSrc).not.toContain("assertOrderShippingParticipant");

    for (const path of ["app/api/shipping/route.ts", "app/api/shipping/quotes/route.ts"]) {
      const src = readSource(path);
      expect(src).toContain("assertOrderShippingParticipant");
    }
  });

  it("fail-closes admin raw order status mutation", async () => {
    expect(cert.adminStatus.policy).toBe("FAIL_CLOSED_NO_RAW_STATUS_MUTATION");

    const queries = readSource("lib/admin/queries.ts");
    expect(queries).toContain("admin.order_status_mutation_rejected");
    expect(queries).not.toMatch(/\.from\("orders"\)\.update\(\{\s*status\s*\}\)/);

    const route = readSource("app/api/admin/orders/[id]/route.ts");
    expect(route).toContain("403");
    expect(route).toContain("adminUpdateOrderStatus");

    const result = await adminUpdateOrderStatus(
      "00000000-0000-4000-8000-000000000001",
      "completed",
      "actor-test",
    );
    expect(result.ok).toBe(false);
    expect(result.code).toBe("RVX_ADMIN_STATUS_FORBIDDEN");
  });

  it("certifies checkout singularity (Buy Now → Confirm & Pay)", () => {
    expect(cert.checkoutAuthority.startMutation.api).toBe("POST /api/checkout/buy-now");
    expect(cert.checkoutAuthority.payMutation.api).toBe("POST /api/orders/checkout");

    const buyNow = readSource("app/api/checkout/buy-now/route.ts");
    expect(buyNow).toContain("BUY_NOW_ENGINE");

    const confirmPay = readSource("app/api/orders/checkout/route.ts");
    expect(confirmPay).toContain("createOrderCheckoutSession");
    expect(confirmPay).toContain("checkoutSessionId");
    expect(confirmPay).toContain("Checkout session required");

    const store = readSource("lib/orders/store.ts");
    expect(store).toMatch(/export async function createOrder[\s\S]*return null;/);
  });

  it("preserves Shipping vs Orders authority split", () => {
    expect(cert.shippingAuthority.shippingOwns).toEqual(
      expect.arrayContaining(["shipping labels", "tracking"]),
    );
    expect(cert.shippingAuthority.ordersOwns).toEqual(
      expect.arrayContaining(["order lifecycle", "payment state", "escrow state"]),
    );
  });
});

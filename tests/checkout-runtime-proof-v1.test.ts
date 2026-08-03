import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CHECKOUT_CERTIFICATION_BLOCKERS_RC1_V1 } from "@/lib/checkout/checkout-certification-blockers-rc1-v1";
import { resolveBloodXxiiiPermanentFreeze } from "@/lib/supreme-blood-code-xxiii-v1";
import { PAYMENT_INTENT_ENGINE_createShell } from "@/lib/checkout/engines/checkout-session-engine-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Checkout runtime proof + blockers (Blood XXIII Agent 1)", () => {
  it("Blocker 1 — Owner flags closed after Owner PASS (no artificial PASS)", () => {
    expect(CHECKOUT_CERTIFICATION_BLOCKERS_RC1_V1.blocker1OwnerFlags.artificialPassForbidden).toBe(
      true,
    );
    expect(CHECKOUT_CERTIFICATION_BLOCKERS_RC1_V1.blocker1OwnerFlags.status).toBe(
      "OWNER_PASS_CLOSED",
    );
    expect(
      resolveBloodXxiiiPermanentFreeze({
        verifiedAllPass: true,
        auditedAllPass: true,
        automaticCertificationPass: true,
        ownerCertificationPass: false,
        noRegressionPass: true,
        complete100: true,
      }),
    ).toBe("NOT_READY");
    expect(
      resolveBloodXxiiiPermanentFreeze({
        verifiedAllPass: true,
        auditedAllPass: true,
        automaticCertificationPass: true,
        ownerCertificationPass: true,
        noRegressionPass: true,
        complete100: true,
      }),
    ).toBe("PERMANENT_FREEZE");
  });

  it("Blocker 4 — Confirm & Pay uses sync submitting lock + idempotency", () => {
    const form = readSource("features/checkout/hooks/use-checkout-form.ts");
    expect(form).toContain("submittingLockRef");
    expect(form).toContain("submittingLockRef.current");
    expect(form).toContain("Idempotency-Key");
    expect(form).toContain("rvx_bn_idem_");
    const checkout = readSource("lib/orders/checkout.ts");
    expect(checkout).toContain('session.status === "paid"');
    expect(checkout).toContain("Payment session expired");
    expect(checkout).toContain("idempotencyKey: `cs-checkout-${session.public_id}`");
  });

  it("Blocker 5 — Buy Now shell is intentional; Stripe PI at Confirm & Pay", () => {
    expect(CHECKOUT_CERTIFICATION_BLOCKERS_RC1_V1.blocker5StripePaymentIntent.intentionalRc1Shell).toBe(
      true,
    );
    const shell = PAYMENT_INTENT_ENGINE_createShell({
      checkoutSessionPublicId: "cs_test_public_id_123",
    });
    expect("ok" in shell && shell.ok === false ? false : true).toBe(true);
    if (!("ok" in shell && shell.ok === false)) {
      expect(shell.id).toMatch(/^pi_(pending|virtual|dev)_/);
      expect(shell.checkoutSessionId).toBe("cs_test_public_id_123");
    }
    const ordersCheckout = readSource("lib/orders/checkout.ts");
    expect(ordersCheckout).toContain("checkout.sessions.create");
    expect(ordersCheckout).toContain("payment_intent_data");
  });

  it("Blocker 2 — Playwright certification spec exists", () => {
    const e2e = readSource("e2e/checkout-blood-xxiii-certification.spec.ts");
    expect(e2e).toContain("Buy Now creates checkout session");
    expect(e2e).toContain("Duplicate Confirm & Pay");
    expect(e2e).toContain("done-ready");
    expect(e2e).toContain("/inbox/conversation/");
  });
});

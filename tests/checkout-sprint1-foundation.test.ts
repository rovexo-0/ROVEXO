import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Checkout Sprint 1 foundation SSOT", () => {
  it("keeps one checkout URL; address/payment routes redirect", () => {
    expect(existsSync(join(process.cwd(), "app/(platform)/checkout/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/(platform)/checkout/[slug]/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/(platform)/checkout/[slug]/address/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/(platform)/checkout/[slug]/payment/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/(platform)/checkout/[slug]/review/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/(platform)/checkout/[slug]/success/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/(platform)/checkout/success/page.tsx"))).toBe(true);
    const address = readSource("app/(platform)/checkout/[slug]/address/page.tsx");
    const payment = readSource("app/(platform)/checkout/[slug]/payment/page.tsx");
    const review = readSource("app/(platform)/checkout/[slug]/review/page.tsx");
    expect(address).toContain("redirect");
    expect(payment).toContain("redirect");
    expect(review).toContain("redirect");
  });

  it("keeps CHECKOUT_UI_v1.0 markers and confirm-only shell", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    const header = readSource("features/checkout/components/CheckoutPageHeader.tsx");
    const css = readSource("styles/rovexo/checkout-v1.css");
    const spec = readSource("docs/modules/checkout/UI_FREEZE.md");

    expect(wizard).toContain('data-checkout-sprint="3-qa"');
    expect(wizard).toContain('data-checkout-freeze="CHECKOUT_UI_v1.0"');
    expect(wizard).toContain('data-checkout-ui="v1.0"');
    expect(wizard).toMatch(/TOTAL PAY \$\{/);
    expect(wizard).not.toContain("Pay Securely");
    expect(header).toContain("ckt-v1__header");
    expect(header).not.toContain("CanonicalPageHeader");
    expect(css).toContain("--ckt-max: 100%");
    expect(css).toContain("--ckt-radius: 10px");
    expect(css).toContain("--ckt-gap: 10px");
    expect(css).toContain("height: 48px");
    expect(spec).toContain("CHECKOUT_UI_v1.0");
    expect(spec).toContain("FROZEN");
    expect(wizard).not.toContain("Parcel2Go");
    expect(wizard).not.toContain("Shippo");
  });
});

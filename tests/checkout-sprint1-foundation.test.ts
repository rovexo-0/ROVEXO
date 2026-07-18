import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Checkout Sprint 1 foundation SSOT", () => {
  it("keeps one checkout URL; address/payment routes redirect", () => {
    expect(existsSync(join(process.cwd(), "app/checkout/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/checkout/[slug]/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/checkout/[slug]/address/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/checkout/[slug]/payment/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/checkout/[slug]/review/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/checkout/[slug]/success/page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/checkout/success/page.tsx"))).toBe(true);
    const address = readSource("app/checkout/[slug]/address/page.tsx");
    const payment = readSource("app/checkout/[slug]/payment/page.tsx");
    const review = readSource("app/checkout/[slug]/review/page.tsx");
    expect(address).toContain("redirect");
    expect(payment).toContain("redirect");
    expect(review).toContain("redirect");
  });

  it("keeps foundation markers and back-only header", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    const header = readSource("features/checkout/components/CheckoutPageHeader.tsx");
    const css = readSource("styles/rovexo/checkout-v1.css");
    const spec = readSource("docs/modules/checkout/MASTER_UI_SPECIFICATION.md");

    expect(wizard).toContain('data-checkout-sprint="3-qa"');
    expect(wizard).toContain('data-checkout-freeze="ABSOLUTE-FINAL"');
    expect(wizard).toContain("Confirm & Pay");
    expect(header).toContain("ckt-v1__header");
    expect(header).not.toContain("CanonicalPageHeader");
    expect(header).not.toContain("title=");
    expect(css).toContain("--ckt-max: 100%");
    expect(css).toContain("height: 56px");
    expect(spec).toContain("FROZEN");
    expect(wizard).not.toContain("Parcel2Go");
    expect(wizard).not.toContain("Shippo");
  });
});

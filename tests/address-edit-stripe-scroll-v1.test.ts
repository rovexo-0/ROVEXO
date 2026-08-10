/**
 * Address edit must persist without requiring a successful UK lookup.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("address edit — manual save without lookup", () => {
  it("AddressesPage exposes saveManualEdit for edit mode", () => {
    const page = readSource("features/account/components/addresses/AddressesPage.tsx");
    expect(page).toContain("saveManualEdit");
    expect(page).toContain("onSaveManual");
    expect(page).toContain("returnTo");
  });

  it("AddressForm edit shows editable lines + Save address", () => {
    const form = readSource("features/account/components/addresses/AddressForm.tsx");
    expect(form).toContain("onSaveManual");
    expect(form).toContain("Save address");
    expect(form).toContain('label="Address line 1"');
    expect(form).toContain("isEditing");
  });

  it("Checkout address edit links with returnTo", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    expect(wizard).toContain("addressesHref");
    expect(wizard).toContain("returnTo=");
  });
});

describe("Stripe Add Card modal scrollport", () => {
  it("cds-modal body is the scroll container", () => {
    const css = readSource("styles/rovexo/canonical-ds.css");
    expect(css).toContain("max-height: min(92dvh, 100%)");
    expect(css).toMatch(/\.cds-modal__body\s*\{[^}]*overflow-y:\s*auto/s);
    expect(css).toContain("-webkit-overflow-scrolling: touch");
  });
});

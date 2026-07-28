import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MY_ACCOUNT_PRIMARY_BUTTON,
  MY_ACCOUNT_PRIMARY_BUTTON_FORBIDDEN,
  MY_ACCOUNT_PRIMARY_BUTTON_STATUS,
  MY_ACCOUNT_PRIMARY_CTA_LABELS,
  MY_ACCOUNT_PRIMARY_GRADIENT,
  myAccountPrimaryButtonSnapshot,
} from "@/lib/design-system/my-account-primary-button-v1";
import { MY_ACCOUNT_V1_BUTTON } from "@/lib/design-system/my-account-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("My Account Primary Button — Global Button Recovery v1.0", () => {
  it("locks official purple gradient + 56/16/100% via recovery tokens", () => {
    expect(MY_ACCOUNT_PRIMARY_BUTTON_STATUS).toContain("GLOBAL BUTTON RECOVERY");
    expect(MY_ACCOUNT_PRIMARY_GRADIENT).toBe(
      "linear-gradient(135deg, #a855f7 0%, #9333ea 48%, #7c3aed 100%)",
    );
    expect(MY_ACCOUNT_PRIMARY_BUTTON.heightPx).toBe(56);
    expect(MY_ACCOUNT_PRIMARY_BUTTON.radiusPx).toBe(16);
    expect(MY_ACCOUNT_PRIMARY_BUTTON.width).toBe("100%");
    expect(MY_ACCOUNT_PRIMARY_BUTTON.fontSizePx).toBe(16);
    expect(MY_ACCOUNT_V1_BUTTON.primaryColourLock).toBe(true);
    expect(MY_ACCOUNT_V1_BUTTON.primaryGradient).toBe(MY_ACCOUNT_PRIMARY_GRADIENT);
    expect(MY_ACCOUNT_PRIMARY_CTA_LABELS).toContain("Add Address");
    expect(MY_ACCOUNT_PRIMARY_CTA_LABELS).toContain("Add Card");
    expect(MY_ACCOUNT_PRIMARY_BUTTON_FORBIDDEN).toContain("20px height");
    expect(MY_ACCOUNT_PRIMARY_BUTTON_FORBIDDEN).not.toContain("56px height");
    expect(myAccountPrimaryButtonSnapshot().locks.onePrimaryButtonSystem).toBe(true);
  });

  it("ships Global primary CSS via index (My Account file delegates)", () => {
    const index = readSource("styles/rovexo/index.css");
    const global = readSource("styles/rovexo/primary-button-v1.css");
    expect(index).toContain("primary-button-v1.css");
    expect(index).toContain("my-account-primary-button-v1.css");
    expect(global).toContain(MY_ACCOUNT_PRIMARY_GRADIENT);
    expect(global).toContain("--rx-primary-height: 56px");
    expect(global).toContain(".cds-button--primary");
    expect(global).not.toMatch(/background:\s*#2563eb/);
    expect(global).not.toMatch(/background:\s*#000/);
  });

  it("wires Addresses CTAs to primary lock + Save Address label", () => {
    const page = readSource("features/account/components/addresses/AddressesPage.tsx");
    const form = readSource("features/account/components/addresses/AddressForm.tsx");
    expect(page).toContain("MY_ACCOUNT_PRIMARY_BUTTON_DOM");
    expect(page).toContain("addCtaLabelForScope");
    expect(page).toContain("CanonicalButton");
    expect(form).toContain("Save Address");
    expect(form).toContain("MY_ACCOUNT_PRIMARY_BUTTON_DOM");
  });

  it("keeps PremiumButton primary gradient as colour SSOT peer (Visit/Follow family)", () => {
    const premium = readSource("components/ui/PremiumButton.module.css");
    expect(premium).toContain("linear-gradient(135deg, #a855f7 0%, #9333ea 48%, #7c3aed 100%)");
  });
});

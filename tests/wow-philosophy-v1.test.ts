import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  UK_ACTIVE_MARKET,
  UK_DEFAULT_CURRENCY,
  isActiveUkMarketCurrency,
} from "@/lib/i18n/uk-first";
import { PARCEL_SIZE_OPTIONS } from "@/features/sell/types";
import { ACTIVE_SUPPORTED_COUNTRIES } from "@/lib/account/countries";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

/**
 * WOW Philosophy Freeze — ROVEXO v1.0 Absolute Final.
 * WOW = simple · standard · fast · trusted · mobile-first · UK-first · zero confusion.
 * WOW ≠ premium · luxury · glass · 3D · marketing effects.
 */
describe("WOW Philosophy Freeze v1.0", () => {
  it("defines WOW as simple/standard/fast — not premium/luxury", () => {
    expect(UK_ACTIVE_MARKET.currency).toBe("GBP");
    expect(isActiveUkMarketCurrency("EUR")).toBe(false);
    expect(UK_DEFAULT_CURRENCY).toBe("GBP");
    expect(ACTIVE_SUPPORTED_COUNTRIES).toHaveLength(1);
  });

  it("keeps glass/glow tokens neutralized (no marketing glass UI)", () => {
    const utilities = read("styles/rovexo/utilities.css");
    expect(utilities).toContain("--ds-glass-bg: #ffffff");
    expect(utilities).toContain("--ds-glass-blur: 0");
    expect(utilities).toContain("--ds-glow-primary: none");
    expect(utilities).not.toMatch(/backdrop-filter:\s*blur\(/);
  });

  it("phone-width freeze locks 100% consumer width language", () => {
    expect(existsSync(join(process.cwd(), "styles/rovexo/phone-width-v1-freeze.css"))).toBe(true);
    const freeze = read("styles/rovexo/phone-width-v1-freeze.css");
    expect(freeze).toMatch(/16px|100%/);
  });

  it("parcel freeze has exactly four standard sizes", () => {
    expect(PARCEL_SIZE_OPTIONS.map((o) => o.label)).toEqual([
      "SMALL",
      "MEDIUM",
      "LARGE",
      "EXTRA LARGE",
    ]);
  });

  it("consumer icons are line-based (no Fluency 3D asset paths in DashboardIcon3D)", () => {
    const icons = read("components/icons/DashboardIcon3D.tsx");
    expect(icons).toMatch(/RvxLineIcons|AccountIcon/);
    expect(icons).not.toContain("getFluency3DAssetPath");
    expect(icons).toMatch(/line icons only|Absolute Final/i);
  });

  it("messages redirects to inbox (Transaction Hub — zero legacy chat chrome entry)", () => {
    const messages = read("app/(platform)/messages/page.tsx");
    expect(messages).toContain("redirect");
    expect(messages).toMatch(/inbox/i);
  });

  it("checkout uses the frozen checkout UI and total-pay CTA", () => {
    const checkout = read("features/checkout/components/CheckoutWizardV1.tsx");
    expect(checkout).toContain('data-checkout-freeze="CHECKOUT_UI_v1.0"');
    expect(checkout).toContain("TOTAL PAY");
  });
});

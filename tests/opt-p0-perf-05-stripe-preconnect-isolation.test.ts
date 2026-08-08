/**
 * OPT-P0-PERF-05 — Stripe js.stripe.com preconnect route-scoping.
 * Head resource-hint placement only — Stripe runtime/logic untouched.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const STRIPE_PRECONNECT = 'rel="preconnect" href="https://js.stripe.com"';
const ROOT_LAYOUT = "app/layout.tsx";
const PAYMENT_METHODS_LAYOUT = "app/(platform)/wallet/payment-methods/layout.tsx";
const PAYMENT_METHODS_PAGE = "app/(platform)/wallet/payment-methods/page.tsx";
const CARD_SETUP = "features/account/components/CardSetupSheet.tsx";
const PLATFORM_LAYOUT = "app/(platform)/layout.tsx";
const HOMEPAGE = "app/(platform)/page.tsx";

describe("OPT-P0-PERF-05 Stripe preconnect isolation", () => {
  it("1: root app/layout.tsx no longer contains Stripe preconnect", () => {
    const root = readSource(ROOT_LAYOUT);
    expect(root).not.toContain('href="https://js.stripe.com"');
    expect(root).not.toMatch(/rel=["']preconnect["'][^>]*js\.stripe\.com/);
    expect(root).toContain("OPT-P0-PERF-05");
    /* Supabase preconnect must remain. */
    expect(root).toContain("preconnect");
    expect(root).toContain("supabaseOrigin");
  });

  it("2: Homepage / platform layout do not declare Stripe preconnect", () => {
    expect(readSource(HOMEPAGE)).not.toContain("js.stripe.com");
    expect(readSource(PLATFORM_LAYOUT)).not.toContain("js.stripe.com");
  });

  it("3: canonical Stripe.js owner layout emits Stripe preconnect", () => {
    expect(existsSync(join(process.cwd(), PAYMENT_METHODS_LAYOUT))).toBe(true);
    const layout = readSource(PAYMENT_METHODS_LAYOUT);
    expect(layout).toContain(STRIPE_PRECONNECT);
    expect(layout.match(/href="https:\/\/js\.stripe\.com"/g)?.length).toBe(1);
  });

  it("4: no duplicate Stripe preconnect owners outside payment-methods layout", () => {
    const root = readSource(ROOT_LAYOUT);
    const platform = readSource(PLATFORM_LAYOUT);
    const auth = readSource("app/(auth)/layout.tsx");
    expect(root).not.toContain('href="https://js.stripe.com"');
    expect(platform).not.toContain('href="https://js.stripe.com"');
    expect(auth).not.toContain('href="https://js.stripe.com"');
    /* Sole preconnect declaration lives in payment-methods layout. */
    expect(readSource(PAYMENT_METHODS_LAYOUT)).toContain('href="https://js.stripe.com"');
  });

  it("5: Stripe runtime loadStripe path remains unchanged", () => {
    const card = readSource(CARD_SETUP);
    expect(card).toContain('from "@stripe/stripe-js"');
    expect(card).toContain("loadStripe");
    expect(card).toContain("getStripePublishableKey");
    expect(existsSync(join(process.cwd(), PAYMENT_METHODS_PAGE))).toBe(true);
    expect(readSource(PAYMENT_METHODS_PAGE)).toContain("WalletPaymentMethodsPage");
    expect(readSource("features/wallet/components/WalletPaymentMethodsPage.tsx")).toContain(
      "CardSetupSheet",
    );
  });
});

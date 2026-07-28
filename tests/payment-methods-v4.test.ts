import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatPaymentBrandLabel,
  formatPaymentBrandTitle,
  formatSavedCardExpiry,
  formatSavedCardMask,
} from "@/lib/payments/format";
import { detectWalletPayments } from "@/lib/payments/wallet-detection";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Payment Methods v5.0 — Absolute Authority + Fail Closed v2 empty", () => {
  it("locks Profile inheritance and Empty/Success states (no UI FailClosedPanel)", () => {
    const page = readSource("features/wallet/components/WalletPaymentMethodsPage.tsx");
    expect(page).toContain('PAYMENT_METHODS_UI_VERSION = "v5.0"');
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("CanonicalMenuRow");
    expect(page).toContain("WalletHelpHeaderAction");
    expect(page).toContain('data-profile-master="v7.0"');
    expect(page).toContain('data-design-master="profile"');
    expect(page).toContain('data-full-width-surface="payments"');
    expect(page).toContain('data-fail-closed="v2-empty-only"');
    expect(page).toContain("No payment methods added yet.");
    expect(page).toContain("Your payment methods are secured by Stripe.");
    expect(page).toContain("Add Card");
    expect(page).toContain("Add New Card");
    expect(page).toContain("Billing Address");
    expect(page).toContain("Default Payment Method");
    expect(page).toContain("Not configured yet.");
    expect(page).toContain("Available at checkout.");
    expect(page).toContain("DEFAULT CARD");
    expect(page).toContain("create_setup_intent");
    expect(page).not.toContain("FailClosedPanel");
    expect(page).not.toContain("FAIL_CLOSED_USER_MESSAGE");
    expect(page).not.toContain("Something went wrong");
    expect(page).not.toContain("payload.error");
    expect(page).not.toContain("HTTP ${");
    expect(page).not.toContain("loadFailed");
    expect(page).not.toContain("pm-v4__card");
  });

  it("hides unavailable Apple Pay / Google Pay (no unavailable copy)", () => {
    const page = readSource("features/wallet/components/WalletPaymentMethodsPage.tsx");
    expect(page).toContain("applePay ?");
    expect(page).toContain("googlePay ?");
    expect(page).not.toContain("Not available on this device");
    expect(page).not.toMatch(/\bUnavailable\b/);
  });

  it("route error soft-renders Empty State without Retry/Home FailClosedPanel", () => {
    const errorPage = readSource("app/wallet/payment-methods/error.tsx");
    expect(errorPage).toContain("No payment methods added yet.");
    expect(errorPage).toContain("Add Card");
    expect(errorPage).toContain("AccountCanonicalShell");
    expect(errorPage).not.toContain("FailClosedPanel");
    expect(errorPage).not.toContain("Something went wrong");
    expect(errorPage).not.toContain("error.message");
  });

  it("ships Full Width CSS without parallel design cages", () => {
    const css = readSource("styles/rovexo/payment-methods-v4.css");
    expect(css).toContain("max-width: none");
    expect(css).toContain(".pm-profile");
    expect(css).toContain(".pm-profile__empty");
    expect(css).not.toContain(".pm-v4__card");
    expect(css).not.toMatch(/max-width:\s*(480|600|768|800|1000|1200)px/);
  });

  it("formats live card masks and expiry without inventing PAN data", () => {
    expect(formatSavedCardMask({ last4: "4538" })).toBe("**** **** **** 4538");
    expect(formatSavedCardExpiry({ expMonth: 8, expYear: 2029 })).toBe("Expires 08/2029");
    expect(formatPaymentBrandTitle("visa")).toBe("VISA");
    expect(formatPaymentBrandTitle("mastercard")).toBe("MasterCard");
    expect(formatPaymentBrandLabel("visa")).toBe("Visa");
  });

  it("wallet detection returns boolean flags only", () => {
    const detected = detectWalletPayments();
    expect(typeof detected.applePay).toBe("boolean");
    expect(typeof detected.googlePay).toBe("boolean");
  });
});

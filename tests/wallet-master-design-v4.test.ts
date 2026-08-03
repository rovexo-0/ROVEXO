import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROFILE_ICON_SIZE_PX } from "@/lib/account-center/profile-icon-system-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Wallet Master Design System Contract v4.0 — Profile inheritance", () => {
  it("Balance hub reuses Wallet Production UI with Balance title and full width", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const css = readSource("styles/rovexo/wallet-hub-v1.css");
    const fullWidth = readSource("styles/rovexo/full-width-engine-v1.css");
    expect(hub).toContain("AccountCanonicalShell");
    expect(hub).toContain("BALANCE_PAGE_NAME");
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("WalletInsights");
    expect(hub).toContain('data-wallet-ssot="docs/modules/wallet/wallet-v1-canonical-mockup.png"');
    expect(hub).not.toContain('title="Wallet"');
    expect(hub).not.toContain("balance-v1__available");
    expect(css).toContain("wallet-v2__hero");
    expect(fullWidth).toContain("min-width: 100% !important");
    expect(PROFILE_ICON_SIZE_PX).toBe(24);
  });

  it("Payment Methods and Bank Accounts share Profile chrome", () => {
    const payments = readSource("features/wallet/components/WalletPaymentMethodsPage.tsx");
    const banks = readSource("features/wallet/components/WalletBankAccountsPage.tsx");
    expect(payments).toContain("WalletHelpHeaderAction");
    expect(banks).toContain("WalletHelpHeaderAction");
    expect(payments).toContain('data-design-master="profile"');
    expect(banks).toContain('data-design-master="profile"');
    expect(payments).toContain("CanonicalMenuRow");
    expect(banks).toContain("CanonicalMenuRow");
  });

  it("wallet child routes fail-closed via AccountCanonicalShell + FailClosedPanel", () => {
    const routes = [
      "app/(platform)/wallet/error.tsx",
      "app/(platform)/wallet/transactions/error.tsx",
      "app/(platform)/wallet/pending/error.tsx",
      "app/(platform)/wallet/processing/error.tsx",
      "app/(platform)/wallet/locked/error.tsx",
    ];
    for (const route of routes) {
      const src = readSource(route);
      expect(src).toContain("FailClosedPanel");
      expect(src).toContain("AccountCanonicalShell");
      expect(src).not.toContain("error.message");
    }
    // Payment Methods + Bank Accounts v5 — Fail Closed v2: soft Empty State, never Retry panel
    const pmError = readSource("app/(platform)/wallet/payment-methods/error.tsx");
    expect(pmError).toContain("AccountCanonicalShell");
    expect(pmError).toContain("No payment methods added yet.");
    expect(pmError).not.toContain("FailClosedPanel");
    const baError = readSource("app/(platform)/wallet/bank-accounts/error.tsx");
    expect(baError).toContain("AccountCanonicalShell");
    expect(baError).toContain("Add Bank Account");
    expect(baError).not.toContain("FailClosedPanel");
    expect(readSource("app/(platform)/wallet/loading.tsx")).toContain("AccountCanonicalShell");
    expect(readSource("app/(platform)/wallet/loading.tsx")).not.toContain("BetaAppShell");
  });
});

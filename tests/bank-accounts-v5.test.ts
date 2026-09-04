import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bank Accounts v5.1 — Profile Master inheritance", () => {
  it("locks Profile inheritance + CanonicalMenuRow + Stripe Connect for Personal and Business", () => {
    const page = readSource("features/wallet/components/WalletBankAccountsPage.tsx");
    expect(page).toContain('BANK_ACCOUNTS_UI_VERSION = "v5.1"');
    expect(page).toContain("AccountCanonicalShell");
    expect(page).toContain("CanonicalMenuRow");
    expect(page).toContain('@/features/wallet/components/WalletProfileChrome');
    expect(page).toContain("WalletBankAccountsIcon");
    expect(page).toContain('data-profile-master="v7.0"');
    expect(page).toContain('data-design-master="profile"');
    expect(page).toContain('data-full-width-surface="bank-accounts"');
    expect(page).toContain("Your Accounts");
    expect(page).toContain("Individual Account");
    expect(page).toContain("Business Account");
    expect(page).toContain("How payouts work");
    expect(page).toContain("/api/wallet/connect");
    expect(page).toContain('intent: "manage"');
    expect(page).toContain('openStripeConnectManagement("individual"');
    expect(page).toContain('openStripeConnectManagement("business"');
    expect(page).toContain("Manage on Stripe");
    expect(page).toContain("Change bank account");
    expect(page).toContain("Your bank details are securely managed by Stripe.");
    expect(page).not.toContain("Payouts are encrypted and processed securely.");
    expect(page).not.toContain("BankAccountForm");
    expect(page).toContain("FAIL_CLOSED_USER_MESSAGE");
    expect(page).not.toContain("ba-v5__account");
    expect(page).not.toContain("PCI DSS");
  });

  it("ships Full Width CSS without parallel design system cages", () => {
    const css = readSource("styles/rovexo/bank-accounts-v5.css");
    expect(css).toContain("max-width: none");
    expect(css).toContain(".ba-profile");
    expect(css).not.toContain(".ba-v5__account");
    expect(css).not.toMatch(/max-width:\s*(600|700|900|1000|1200)px/);
    // Page-scoped import only — must not pollute global index.css (R0).
    expect(readSource("features/wallet/components/WalletBankAccountsPage.tsx")).toContain(
      'import "@/styles/rovexo/bank-accounts-v5.css"',
    );
    expect(readSource("styles/rovexo/index.css")).not.toContain("bank-accounts-v5.css");
  });

  it("keeps UK bank validation SSOT available for legacy encrypted rows (not new UI collection)", () => {
    const bank = readSource("lib/wallet/bank-account.ts");
    expect(bank).toContain("isValidSortCode");
    expect(bank).toContain("isValidAccountNumber");
    expect(bank).toContain("UK");
  });

  it("retains BankAccountForm module for legacy data management without mounting on Bank Accounts page", () => {
    const form = readSource("features/wallet/components/BankAccountForm.tsx");
    const css = readSource("styles/rovexo/bank-accounts-v5.css");
    const page = readSource("features/wallet/components/WalletBankAccountsPage.tsx");
    expect(form).toContain("ba-id-card");
    expect(form).toContain("Connected");
    expect(form).toContain("Edit");
    expect(css).toContain(".ba-id-card");
    expect(css).toContain("#22c55e");
    expect(css).toContain("#9333ea");
    expect(page).not.toContain("BankAccountForm");
  });
});

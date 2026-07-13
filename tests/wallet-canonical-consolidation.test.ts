import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Wallet canonical consolidation v1.0", () => {
  it("defines canonical wallet routes", () => {
    expect(WALLET_ROUTES.hub).toBe("/wallet");
    expect(WALLET_ROUTES.paymentMethods).toBe("/wallet/payment-methods");
    expect(WALLET_ROUTES.bankAccount).toBe("/wallet/bank-account");
    expect(WALLET_ROUTES.withdraw).toBe("/wallet/withdraw");
    expect(WALLET_ROUTES.transactions).toBe("/wallet/transactions");
    expect(WALLET_ROUTES.payouts).toBe("/wallet/payouts");
  });

  it("hosts payment methods only under wallet", () => {
    const page = readSource("features/wallet/components/WalletPaymentMethodsPage.tsx");
    const accountRedirect = readSource("app/account/payment-methods/page.tsx");

    expect(page).toContain("CardSetupSheet");
    expect(page).toContain('data-wallet-payment-methods={WALLET_CANONICAL_VERSION}');
    expect(page).toContain("Add Card");
    expect(accountRedirect).toContain("redirect");
    expect(accountRedirect).toContain("WALLET_ROUTES.paymentMethods");
  });

  it("hosts bank account only under wallet", () => {
    const page = readSource("features/wallet/components/WalletBankAccountPage.tsx");
    const settingsRedirect = readSource("app/account/settings/bank-account/page.tsx");

    expect(page).toContain("BankAccountModalLazy");
    expect(settingsRedirect).toContain("WALLET_ROUTES.bankAccount");
  });

  it("references wallet from settings, checkout, and profile completion", () => {
    expect(readSource("lib/account-center/settings-menu.ts")).toContain(WALLET_ROUTES.paymentMethods);
    expect(readSource("features/checkout/components/CheckoutPaymentStepV1.tsx")).toContain(
      WALLET_ROUTES.paymentMethods,
    );
    expect(readSource("lib/account/profile-completion.ts")).toContain(WALLET_ROUTES.paymentMethods);
    expect(readSource("lib/account/profile-completion.ts")).toContain(WALLET_ROUTES.bankAccount);
  });

  it("does not leave duplicate add-card UI outside wallet payment methods", () => {
    const paymentMethods = readSource("features/wallet/components/WalletPaymentMethodsPage.tsx");
    const checkout = readSource("features/checkout/components/CheckoutPaymentStepV1.tsx");
    const settings = readSource("features/account-module/components/SettingsV1.tsx");

    expect(paymentMethods).toContain("create_setup_intent");
    expect(checkout).not.toContain("create_setup_intent");
    expect(checkout).not.toContain("CardSetupSheet");
    expect(settings).not.toContain("BankAccountForm");
    expect(settings).not.toContain("CardSetupSheet");
  });

  it("enhances wallet hub with canonical quick actions", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");

    expect(hub).toContain("data-wallet-canonical={WALLET_CANONICAL_VERSION}");
    expect(hub).toContain("WALLET_ROUTES.paymentMethods");
    expect(hub).toContain("WALLET_ROUTES.bankAccount");
    expect(hub).toContain("WALLET_ROUTES.payouts");
    expect(hub).toContain('aria-label="Quick actions"');
  });

  it("routes seller dashboard wallet shortcut to /wallet", () => {
    const dashboard = readSource("features/seller/dashboard/components/SellerDashboardPage.tsx");
    expect(dashboard).toContain('href: "/wallet"');
    expect(dashboard).not.toContain('href: "/seller/wallet"');
  });
});

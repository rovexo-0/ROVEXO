import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Wallet canonical redesign v1.0", () => {
  it("defines canonical wallet routes", () => {
    expect(WALLET_ROUTES.hub).toBe("/wallet");
    expect(WALLET_ROUTES.paymentMethods).toBe("/wallet/payment-methods");
    expect(WALLET_ROUTES.bankAccount).toBe("/wallet/bank-account");
    expect(WALLET_ROUTES.withdraw).toBe("/wallet/withdraw");
    expect(WALLET_ROUTES.transactions).toBe("/wallet/transactions");
    expect(WALLET_ROUTES.payouts).toBe("/wallet/payouts");
  });

  it("renders approved seller wallet redesign surfaces", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const css = readSource("styles/rovexo/wallet-hub-v1.css");

    expect(hub).toContain('data-wallet-ui="v1.0-redesign"');
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("Available Balance");
    expect(hub).toContain("Pending");
    expect(hub).toContain("Paid Out");
    expect(hub).toContain("Add Bank");
    expect(hub).toContain("Connect Bank Account");
    expect(hub).toContain("WALLET_ROUTES.paymentMethods");
    expect(hub).not.toContain("platformFeeBuyerOnly");
    expect(hub).not.toContain("Platform Fee");
    expect(css).toContain("--wallet-radius: 20px");
    expect(css).toContain("--wallet-gap: 24px");
    expect(css).toContain("linear-gradient");
  });

  it("lazy-loads insights and transactions sections", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    expect(hub).toContain('import("@/features/wallet/components/WalletInsights")');
    expect(hub).toContain('import("@/features/wallet/components/WalletRecentTransactions")');
  });

  it("redirects buyers away from seller wallet hub", () => {
    const page = readSource("app/wallet/page.tsx");
    expect(page).toContain("!profile.isSeller");
    expect(page).toContain("WALLET_ROUTES.paymentMethods");
  });

  it("hosts payment methods only under wallet", () => {
    const page = readSource("features/wallet/components/WalletPaymentMethodsPage.tsx");
    const accountRedirect = readSource("app/account/payment-methods/page.tsx");

    expect(page).toContain("CardSetupSheet");
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

  it("settings and checkout reference wallet payment methods only", () => {
    expect(readSource("lib/account-center/settings-menu.ts")).toContain(WALLET_ROUTES.paymentMethods);
    expect(readSource("features/checkout/components/CheckoutPaymentStepV1.tsx")).toContain(
      WALLET_ROUTES.paymentMethods,
    );
    expect(readSource("features/account-module/components/SettingsV1.tsx")).not.toContain("CardSetupSheet");
  });

  it("routes seller dashboard wallet shortcut to /wallet", () => {
    const dashboard = readSource("features/seller/dashboard/components/SellerDashboardPage.tsx");
    expect(dashboard).toContain('href: "/wallet"');
    expect(dashboard).not.toContain('href: "/seller/wallet"');
  });
});

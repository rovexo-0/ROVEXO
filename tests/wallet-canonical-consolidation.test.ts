import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Wallet premium final UI v1.0", () => {
  it("defines canonical wallet routes", () => {
    expect(WALLET_ROUTES.hub).toBe("/wallet");
    expect(WALLET_ROUTES.paymentMethods).toBe("/wallet/payment-methods");
    expect(WALLET_ROUTES.bankAccount).toBe("/wallet/bank-account");
    expect(WALLET_ROUTES.withdraw).toBe("/wallet/withdraw");
    expect(WALLET_ROUTES.transactions).toBe("/wallet/transactions");
    expect(WALLET_ROUTES.payouts).toBe("/wallet/payouts");
  });

  it("renders approved premium seller wallet surfaces", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const css = readSource("styles/rovexo/wallet-hub-v1.css");
    const bank = readSource("features/wallet/components/WalletConnectedBank.tsx");
    const txns = readSource("features/wallet/components/WalletRecentTransactions.tsx");

    expect(hub).toContain('data-wallet-ui="v1.0-final"');
    expect(hub).toContain('data-wallet-visual="canonical-light"');
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("Verified Wallet");
    expect(hub).toContain("Available Balance");
    expect(hub).toContain("Lifetime Withdrawn");
    expect(hub).toContain('label="Bank Account"');
    expect(hub).toContain('href="/help"');
    expect(hub).toContain("HeadsetLineIcon");
    expect(hub).not.toContain("platformFeeBuyerOnly");
    expect(hub).not.toContain("Platform Fee");
    expect(hub).not.toContain("WalletDesktop");
    expect(hub).not.toContain("WalletMobile");
    expect(bank).toContain("Connect Bank Account");
    expect(bank).toContain("Change Bank");
    expect(bank).toContain("Edit Bank");
    expect(bank).toContain("Remove Bank");
    expect(bank).toContain('method: "DELETE"');
    expect(txns).toContain("View All");
    expect(txns).toContain("Withdrawals");
    expect(txns).toContain('role="tablist"');
    expect(txns).toContain("IntersectionObserver");
    expect(css).toContain("--wallet-radius: 20px");
    expect(css).toContain("--wallet-gap: 24px");
    expect(css).toContain("linear-gradient");
    expect(css).toContain("padding: 24px");
    expect(css).toContain("200ms");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("color-scheme: only light");
    expect(css).toContain("repeat(2, minmax(0, 1fr))");
  });

  it("keeps one light Wallet design across breakpoints (no dark/desktop theme)", () => {
    const css = readSource("styles/rovexo/wallet-hub-v1.css");
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const page = readSource("features/wallet/components/WalletPage.tsx");

    expect(page).toContain("WalletHubV1");
    expect(hub).not.toMatch(/matchMedia|useMediaQuery|isDesktop|isMobile/);
    expect(css).not.toContain("prefers-color-scheme: dark");
    expect(css).not.toContain('[data-theme="dark"] .wallet-v2');
    expect(css).not.toContain("background: #18181b");
    expect(css).not.toMatch(/\.wallet-v2__metrics\s*\{[^}]*repeat\(4/);
    expect(css).toMatch(/width:\s*min\(100%,\s*720px\)/);
  });

  it("lazy-loads insights, transactions, and connected bank", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    expect(hub).toContain('import("@/features/wallet/components/WalletInsights")');
    expect(hub).toContain('import("@/features/wallet/components/WalletRecentTransactions")');
    expect(hub).toContain('import("@/features/wallet/components/WalletConnectedBank")');
  });

  it("redirects buyers away from seller wallet hub", () => {
    const page = readSource("app/wallet/page.tsx");
    expect(page).toContain("!profile.isSeller");
    expect(page).toContain("WALLET_ROUTES.paymentMethods");
  });

  it("hosts payment methods only under wallet", () => {
    const page = readSource("features/wallet/components/WalletPaymentMethodsPage.tsx");
    const accountRedirect = readSource("app/account/payment-methods/page.tsx");
    const settingsBankRedirect = readSource("app/account/settings/bank-account/page.tsx");
    const settingsPmRedirect = readSource("app/account/settings/payment-methods/page.tsx");

    expect(page).toContain("CardSetupSheet");
    expect(page).toContain("Add Card");
    expect(accountRedirect).toContain("WALLET_ROUTES.paymentMethods");
    expect(settingsBankRedirect).toContain("WALLET_ROUTES.bankAccount");
    expect(settingsPmRedirect).toContain("WALLET_ROUTES.paymentMethods");
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

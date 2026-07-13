import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Wallet v1.0 canonical mockup SSOT", () => {
  it("defines canonical wallet routes", () => {
    expect(WALLET_ROUTES.hub).toBe("/wallet");
    expect(WALLET_ROUTES.paymentMethods).toBe("/wallet/payment-methods");
    expect(WALLET_ROUTES.bankAccount).toBe("/wallet/bank-account");
    expect(WALLET_ROUTES.withdraw).toBe("/wallet/withdraw");
    expect(WALLET_ROUTES.transactions).toBe("/wallet/transactions");
    expect(WALLET_ROUTES.payouts).toBe("/wallet/payouts");
  });

  it("matches approved mockup structure and copy", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const css = readSource("styles/rovexo/wallet-hub-v1.css");
    const bank = readSource("features/wallet/components/WalletConnectedBank.tsx");
    const txns = readSource("features/wallet/components/WalletRecentTransactions.tsx");
    const insights = readSource("features/wallet/components/WalletInsights.tsx");

    expect(hub).toContain('data-wallet-ui="v1.0-canonical-mockup"');
    expect(hub).toContain('data-wallet-final-spec="v1.0-visual-qa-lock"');
    expect(hub).toContain('data-wallet-freeze="pending-visual-qa"');
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("Available Balance");
    expect(hub).toContain("wallet-v2__status-pill");
    expect(hub).toContain("Paid Out");
    expect(hub).toContain('label="Add Bank"');
    expect(hub).toContain("Quick Actions");
    expect(hub).not.toContain("Lifetime Withdrawn");
    expect(hub).not.toContain("Verified Wallet");
    expect(hub).not.toContain("Platform Fee");
    expect(hub).not.toContain("wallet-statements");
    expect(hub).not.toContain("WalletDesktop");
    expect(hub).not.toContain("WalletMobile");

    expect(insights).toContain("Insights");
    expect(insights).toContain("View all");
    expect(insights).toContain("This Month");
    expect(insights).toContain("Next Payout");
    expect(insights).toContain("No upcoming payout when you have pending funds.");
    expect(insights).toContain("Estimated payout");

    expect(bank).toContain("Connect Bank Account");
    expect(bank).toContain("No bank account connected");
    expect(bank).toContain("Change Bank");
    expect(bank).toContain("Remove Bank");
    expect(bank).not.toContain("Edit Bank");

    expect(txns).toContain("View all");
    expect(txns).toContain("No transactions yet");
    expect(txns).toContain("IntersectionObserver");

    expect(css).toContain("color-scheme: only light");
    expect(css).toContain("max-width: 390px");
    expect(css).toContain("max-width: 720px");
    expect(css).toContain("--wallet-radius-hero: 24px");
    expect(css).toContain("--wallet-radius-card: 18px");
    expect(css).toContain("--wallet-radius-btn: 14px");
    expect(css).toContain("--wallet-pad-x: 12px");
    expect(css).toContain("height: 170px");
    expect(css).toContain("height: 128px");
    expect(css).toContain("height: 92px");
    expect(css).toContain("height: 118px");
    expect(css).toContain("height: 52px");
    expect(css).toContain("height: 36px");
    expect(css).toContain("border-radius: 18px");
    expect(css).toContain("padding: 0 16px");
    expect(css).toContain("min-height: 64px");
    expect(css).toContain("justify-content: flex-start");
    expect(css).toContain("margin: 0 0 12px");
    expect(css).not.toContain("prefers-color-scheme: dark");
    expect(css).not.toContain("background: #18181b");
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
    expect(accountRedirect).toContain("permanentRedirect");
    expect(accountRedirect).toContain("WALLET_ROUTES.paymentMethods");
    expect(settingsBankRedirect).toContain("permanentRedirect");
    expect(settingsBankRedirect).toContain("WALLET_ROUTES.bankAccount");
    expect(settingsPmRedirect).toContain("permanentRedirect");
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

  it("keeps a single hub component across breakpoints", () => {
    const page = readSource("features/wallet/components/WalletPage.tsx");
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    expect(page).toContain("WalletHubV1");
    expect(hub).not.toMatch(/matchMedia|useMediaQuery|isDesktop|isMobile/);
  });
});

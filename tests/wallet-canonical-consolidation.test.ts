import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import {
  buildBusinessWalletMenuSections,
  buildPersonalWalletMenuSections,
} from "@/lib/account-center/wallet-menus";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Wallet Compact Premium SSOT — max 2 wallets", () => {
  it("defines canonical wallet routes", () => {
    expect(WALLET_ROUTES.hub).toBe("/wallet");
    expect(WALLET_ROUTES.paymentMethods).toBe("/wallet/payment-methods");
    expect(WALLET_ROUTES.bankAccount).toBe("/wallet/bank-account");
    expect(WALLET_ROUTES.withdraw).toBe("/wallet/withdraw");
    expect(WALLET_ROUTES.transactions).toBe("/wallet/transactions");
    expect(WALLET_ROUTES.payouts).toBe("/wallet/payouts");
  });

  it("matches Personal Wallet Compact Premium structure", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const css = readSource("styles/rovexo/wallet-hub-v1.css");
    const page = readSource("app/wallet/page.tsx");
    const business = readSource("app/business/wallet/page.tsx");

    expect(hub).toContain('data-wallet-ui="compact-premium"');
    expect(hub).toContain('data-wallet-hub-version="v2.0-master"');
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("PersonalWalletMenuSections");
    expect(hub).toContain("BusinessWalletMenuSections");
    expect(hub).not.toContain("wallet-v2__balance-card");
    expect(hub).not.toContain("Platform Fee");
    expect(hub).not.toContain("WalletDesktop");
    expect(hub).not.toContain("WalletMobile");

    expect(page).toContain('variant="personal"');
    expect(page).not.toContain("WALLET_ROUTES.paymentMethods");
    expect(business).toContain('variant="business"');
    expect(business).not.toContain('redirect("/wallet")');

    expect(css).toContain("wallet-v2__hero--compact");
    expect(css).toContain("--wallet-radius-hero: 24px");
  });

  it("exposes only Personal + Business wallet menus", () => {
    expect(buildPersonalWalletMenuSections().flatMap((s) => s.items).length).toBe(7);
    expect(buildBusinessWalletMenuSections().flatMap((s) => s.items).length).toBe(6);
  });

  it("keeps statement export on detail pages", () => {
    const detail = readSource("features/wallet/components/MonthlyStatementDetail.tsx");
    expect(detail).toContain("Download CSV");
    expect(detail).toContain("Download PDF");
  });
});

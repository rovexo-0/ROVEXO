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

describe("Wallet Master Menu SSOT — max 2 wallets", () => {
  it("defines canonical wallet routes", () => {
    expect(WALLET_ROUTES.hub).toBe("/wallet");
    expect(WALLET_ROUTES.paymentMethods).toBe("/wallet/payment-methods");
    expect(WALLET_ROUTES.bankAccount).toBe("/wallet/bank-account");
    expect(WALLET_ROUTES.withdraw).toBe("/wallet/withdraw");
    expect(WALLET_ROUTES.transactions).toBe("/wallet/transactions");
    expect(WALLET_ROUTES.payouts).toBe("/wallet/payouts");
  });

  it("matches Wallet Master Menu structure", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const page = readSource("app/wallet/page.tsx");
    const business = readSource("app/business/wallet/page.tsx");

    expect(hub).toContain('data-wallet-hub-version="v3.0-standard"');
    expect(hub).toContain("Available");
    expect(hub).toContain("Pending");
    expect(hub).toContain("Withdraw");
    expect(hub).toContain("PersonalWalletMenuSections");
    expect(hub).not.toContain("wallet-v2__hero");
    expect(hub).not.toContain("Payout History");
    expect(page).toContain('variant="personal"');
    expect(business).toContain('variant="business"');
  });

  it("exposes bank destinations only below balance rows", () => {
    expect(buildPersonalWalletMenuSections().flatMap((s) => s.items).map((i) => i.title)).toEqual([
      "Transactions",
      "Personal Bank",
      "Business Bank",
    ]);
    expect(buildBusinessWalletMenuSections().flatMap((s) => s.items).length).toBe(3);
  });

  it("keeps statement export on detail pages", () => {
    const detail = readSource("features/wallet/components/MonthlyStatementDetail.tsx");
    expect(detail).toContain("Download CSV");
    expect(detail).toContain("Download PDF");
  });
});

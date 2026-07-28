import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BALANCE_FINAL_FREEZE_V1_1,
  BALANCE_MASTER_FREEZE_V1,
} from "@/lib/wallet/balance-master-freeze-v1";
import { BALANCE_PAGE_NAME } from "@/lib/wallet/balance-hub-v1";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Balance Senior Audit — Wallet Production reuse", () => {
  it("locks Balance title on /wallet reusing Wallet Financial Engine (Blood XIII)", () => {
    expect(BALANCE_FINAL_FREEZE_V1_1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(BALANCE_FINAL_FREEZE_V1_1.visibleTitle).toBe("Balance");
    expect(BALANCE_FINAL_FREEZE_V1_1.canonicalRoute).toBe("/wallet");
    expect(BALANCE_MASTER_FREEZE_V1.canonicalRoute).toBe("/wallet");
    expect(BALANCE_PAGE_NAME).toBe("Balance");
    expect(WALLET_ROUTES.hub).toBe("/wallet");
    expect(BALANCE_FINAL_FREEZE_V1_1.reuseOnly.walletImplementation).toBe(true);
    expect(BALANCE_FINAL_FREEZE_V1_1.financialRule.noFinancialCodeChanges).toBe(true);
  });

  it("Wallet hub is the thin WalletPage entry; legacy /balance redirects", () => {
    const walletRoute = readSource("app/wallet/page.tsx");
    const balanceRoute = readSource("app/balance/page.tsx");
    const walletPage = readSource("features/wallet/components/WalletPage.tsx");
    const menu = readSource("lib/account-center/canonical-menu.ts");
    const config = readSource("next.config.ts");

    expect(walletRoute).toContain('from "@/features/wallet/components/WalletPage"');
    expect(walletRoute).toContain("<WalletPage");
    expect(walletRoute).toContain('title: "Balance | ROVEXO"');
    expect(balanceRoute).toContain('redirect(`/wallet${suffix}`)');
    expect(walletPage).toContain("WalletHubV1");
    expect(menu).toContain('title: "Balance"');
    expect(config).toContain('source: "/balance", destination: "/wallet"');
  });

  it("restores Wallet Production UI (wallet-v2) with Balance title only", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const insights = readSource("features/wallet/components/WalletInsights.tsx");
    const txns = readSource("features/wallet/components/WalletRecentTransactions.tsx");
    const bank = readSource("features/wallet/components/WalletConnectedBank.tsx");

    expect(hub).toContain("BALANCE_PAGE_NAME");
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("Available Balance");
    expect(hub).toContain("Withdraw");
    expect(hub).toContain("Bank Account");
    expect(hub).toContain("Add Bank");
    expect(hub).toContain("Transactions");
    expect(hub).toContain("Payment Methods");
    expect(hub).toContain("WalletInsights");
    expect(hub).toContain("WalletRecentTransactions");
    expect(hub).toContain("WalletConnectedBank");
    expect(hub).toContain('data-wallet-ssot="docs/modules/wallet/wallet-v1-canonical-mockup.png"');
    expect(hub).not.toContain('title="Wallet"');
    expect(hub).not.toContain("balance-v1__available");
    expect(hub).not.toContain("CanonicalMenuRow");

    expect(insights).toContain("Insights");
    expect(insights).toContain("This Month");
    expect(insights).toContain("Next Payout");
    expect(insights).toContain("View all");

    expect(txns).toContain("No transactions yet");
    expect(txns).toContain("View all");

    expect(bank).toContain("Connect Bank Account");
  });

  it("fixes Full Width Engine conflict so Wallet Production owns padding + 100% width", () => {
    const productionCss = readSource("styles/rovexo/wallet-hub-v1.css");
    const fullWidth = readSource("styles/rovexo/full-width-engine-v1.css");

    expect(productionCss).toContain(".wallet-v2 {");
    expect(productionCss).toContain("wallet-v2__hero");
    expect(productionCss).toContain("--wallet-purple-start");
    expect(productionCss).toContain("wallet-v1-canonical-mockup.png");

    expect(fullWidth).toContain("Wallet Production conflict fix");
    expect(fullWidth).toContain(
      '[data-full-width-engine="v1.0"] .cds-layout__content--account-canonical:has(.wallet-v2)',
    );
    expect(fullWidth).toContain("padding-left: 0 !important");
    expect(fullWidth).toContain("padding-right: 0 !important");
    expect(fullWidth).toContain("[data-full-width-engine=\"v1.0\"] .wallet-v2");
    expect(fullWidth).toContain("min-width: 100% !important");
    expect(fullWidth).toContain("max-width: 100% !important");
  });

  it("forbids parallel Balance / Wallet systems", () => {
    expect(BALANCE_FINAL_FREEZE_V1_1.forbidden).toContain("Balance v2");
    expect(BALANCE_FINAL_FREEZE_V1_1.forbidden).toContain("Wallet v2");
    expect(BALANCE_FINAL_FREEZE_V1_1.forbidden).toContain("duplicate Wallet logic");
    expect(BALANCE_FINAL_FREEZE_V1_1.forbiddenUserLabels).toContain("Wallet");
  });
});

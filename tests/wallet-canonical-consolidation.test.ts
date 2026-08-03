import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import {
  pendingOrderTransactions,
  processingWithdrawalTransactions,
} from "@/lib/wallet/balance-buckets";
import type { WalletTransaction } from "@/lib/wallet/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Wallet Master Menu SSOT — Balance hub v1.1", () => {
  it("defines canonical wallet routes with Balance hub", () => {
    expect(WALLET_ROUTES.hub).toBe("/wallet");
    expect(WALLET_ROUTES.paymentMethods).toBe("/wallet/payment-methods");
    expect(WALLET_ROUTES.bankAccounts).toBe("/wallet/bank-accounts");
    expect(WALLET_ROUTES.bankAccount).toBe("/wallet/bank-account");
    expect(WALLET_ROUTES.pending).toBe("/wallet/pending");
    expect(WALLET_ROUTES.processing).toBe("/wallet/processing");
    expect(WALLET_ROUTES.locked).toBe("/wallet/locked");
    expect(WALLET_ROUTES.withdraw).toBe("/wallet/withdraw");
    expect(WALLET_ROUTES.transactions).toBe("/wallet/transactions");
    expect(WALLET_ROUTES.payouts).toBe("/wallet/payouts");
  });

  it("matches Balance hub structure on Wallet engine components", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const page = readSource("app/(platform)/wallet/page.tsx");
    const business = readSource("app/(platform)/business/wallet/page.tsx");

    expect(hub).toContain('data-wallet-hub-version="v1.0-canonical"');
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("Available Balance");
    expect(hub).toContain("Withdraw");
    expect(hub).toContain("BALANCE_PAGE_NAME");
    expect(hub).toContain("WalletInsights");
    expect(hub).toContain("WalletRecentTransactions");
    expect(hub).not.toContain("balance-v1__available");
    expect(hub).not.toContain('title="Wallet"');
    expect(page).toContain('variant="personal"');
    expect(business).toContain('variant="business"');
  });

  it("derives pending/processing buckets from real ledger types only", () => {
    const sample: WalletTransaction[] = [
      {
        id: "1",
        orderNumber: "A1",
        productTitle: "Sale hold",
        productImageUrl: "",
        amount: 10,
        status: "pending",
        type: "sale",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        orderNumber: "",
        productTitle: "Withdrawal",
        productImageUrl: "",
        amount: -5,
        status: "pending",
        type: "withdrawal",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "3",
        orderNumber: "B2",
        productTitle: "Completed sale",
        productImageUrl: "",
        amount: 20,
        status: "completed",
        type: "sale",
        createdAt: "2026-01-03T00:00:00.000Z",
      },
    ];
    expect(pendingOrderTransactions(sample).map((t) => t.id)).toEqual(["1"]);
    expect(processingWithdrawalTransactions(sample).map((t) => t.id)).toEqual(["2"]);
  });

  it("keeps statement export on detail pages", () => {
    const detail = readSource("features/wallet/components/MonthlyStatementDetail.tsx");
    expect(detail).toContain("Download CSV");
    expect(detail).toContain("Download PDF");
  });

  it("legacy bank-account route redirects to bank-accounts hub", () => {
    const legacy = readSource("app/(platform)/wallet/bank-account/page.tsx");
    expect(legacy).toContain("WALLET_ROUTES.bankAccounts");
    expect(legacy).toContain("redirect");
  });
});

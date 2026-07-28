import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_MONEY_STATES,
  formatAvailableBalanceLabel,
  resolveTransactionMoneyState,
  resolveWalletBalanceView,
} from "@/lib/wallet/money-states";
import { canDebitAvailable, roundWalletMoney } from "@/lib/wallet/security";
import { evaluateWalletCertificationLocal } from "@/lib/wallet/certification";
import type { WalletData, WalletTransaction } from "@/lib/wallet/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function sampleWallet(partial?: Partial<WalletData>): WalletData {
  return {
    availableBalance: 100,
    pendingBalance: 20,
    pendingAvailableAt: new Date().toISOString(),
    lockedBalance: 5,
    paidOutBalance: 0,
    pendingOrderCount: 0,
    withdrawalSummary: {
      processingTotal: 15,
      processingCount: 1,
      completedTotal: 0,
      completedCount: 0,
    },
    monthSummary: {
      revenue: { value: 0, changePercent: 0 },
      withdrawn: { value: 0, changePercent: 0 },
      fees: { value: 0, changePercent: 0 },
    },
    transactions: [],
    withdrawMethods: [],
    connectStatus: { connected: false, payoutsEnabled: false },
    ...partial,
  };
}

describe("Balance + money state validations", () => {
  it("forbids unknown money states in the canonical list", () => {
    expect(CANONICAL_MONEY_STATES).toEqual([
      "PENDING",
      "LOCKED",
      "VALIDATING",
      "PROCESSING",
      "AVAILABLE",
      "WITHDRAWING",
      "REFUNDING",
      "COMPLETED",
      "FAILED",
      "ROLLED_BACK",
    ]);
  });

  it("Available is withdrawable-only and never mixes pending/processing/locked", () => {
    const view = resolveWalletBalanceView(sampleWallet());
    expect(view.available).toBe(100);
    expect(view.pending).toBe(20);
    expect(view.processing).toBe(15);
    expect(view.locked).toBe(5);
    expect(view.available).not.toBe(view.pending + view.processing);
  });

  it("profile Balance label is Available only", () => {
    expect(formatAvailableBalanceLabel(10)).toMatch(/Available$/);
    expect(formatAvailableBalanceLabel(10)).not.toMatch(/Pending|Locked|Processing/i);
  });

  it("maps withdrawal ledger statuses to WITHDRAWING / COMPLETED / ROLLED_BACK", () => {
    const base: Omit<WalletTransaction, "status"> = {
      id: "1",
      orderNumber: "WD-1",
      productTitle: "Withdrawal",
      productImageUrl: "",
      amount: -10,
      type: "withdrawal",
      createdAt: new Date().toISOString(),
    };
    expect(resolveTransactionMoneyState({ ...base, status: "pending" })).toBe("WITHDRAWING");
    expect(resolveTransactionMoneyState({ ...base, status: "completed" })).toBe("COMPLETED");
    expect(resolveTransactionMoneyState({ ...base, status: "failed" })).toBe("ROLLED_BACK");
  });

  it("blocks overdraft and non-positive debits", () => {
    expect(canDebitAvailable(10, 10.01)).toBe(false);
    expect(canDebitAvailable(10, 0)).toBe(false);
    expect(canDebitAvailable(10, 10)).toBe(true);
    expect(roundWalletMoney(10.005)).toBe(10.01);
  });
});

describe("Withdraw payout rail + migration validations", () => {
  it("ships Connect withdraw transfer rail with metadata and reverse-before-restore", () => {
    const rail = readSource("lib/stripe/withdraw-payout.ts");
    expect(rail).toContain("initiateWithdrawalPayout");
    expect(rail).toContain("assertWithdrawalRailReady");
    expect(rail).toContain("reverseWithdrawalTransfer");
    expect(rail).toContain("walletTransactionId");
    expect(rail).toContain("purpose: \"wallet_withdrawal\"");
    expect(rail).toContain("mustUseVirtualWallet");

    const store = readSource("lib/wallet/store.ts");
    expect(store).toContain("initiateWithdrawalPayout");
    expect(store).toContain("assertWithdrawalRailReady");
    expect(store).toContain("reverseWithdrawalTransfer");
    expect(store).toContain("confirm_failed_after_transfer");
    expect(store).toContain("do not invent Available credit");
  });

  it("completes wallet_security_certification_v1 migration contracts", () => {
    const migration = readSource(
      "supabase/migrations/20260719120000_wallet_security_certification_v1.sql",
    );
    expect(migration).toContain("stripe_webhook_events");
    expect(migration).toContain("wallet_transactions_idempotency_key_uidx");
    expect(migration).toContain("wallet_transactions_sale_order_uidx");
    expect(migration).toContain("wallet_transactions_refund_order_uidx");
    expect(migration).toContain("wallet_transactions_withdrawal_status_idx");
    expect(migration).toContain("revoke select (sort_code, account_number)");
    expect(migration).toContain("locked_balance");
    expect(migration).toContain("stripe_webhook_events_processed_at_idx");
  });

  it("keeps Production certification fail-closed without Owner secrets / live apply", () => {
    const report = evaluateWalletCertificationLocal();
    expect(["100%", "INCOMPLETE"]).toContain(report.implementation);
    expect(report.certification).toBe(report.implementation === "100%" ? "PASS" : "FAIL");
    expect(report.production).toBe("OWNER_ACTION_REQUIRED");
    expect(report.productionCertified).toBe(false);
    expect(report.readyForImplementation).toBe(report.implementation === "100%");
    expect(report.readyForCommit).toBe(false);
    expect(report.readyForPush).toBe(false);
    expect(report.readyForDeploy).toBe(false);
    expect(report.readyForProduction).toBe(false);
    expect(report.blockers.length).toBeGreaterThan(0);
    expect(report.gates.some((g) => g.id === "migration_applied_live" && g.status === "OWNER_ACTION_REQUIRED")).toBe(
      true,
    );
  });
});

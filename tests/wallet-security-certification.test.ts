import { describe, expect, it } from "vitest";
import {
  buildRefundIdempotencyKey,
  buildSaleIdempotencyKey,
  buildWithdrawIdempotencyKey,
  canDebitAvailable,
  roundWalletMoney,
} from "@/lib/wallet/security";
import { summarizeWalletWithdrawals } from "@/lib/transaction-hub/seller-wallet";
import type { WalletTransaction } from "@/lib/wallet/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Wallet Security Certification v1.0 — primitives", () => {
  it("rounds money safely", () => {
    expect(roundWalletMoney(10.005)).toBe(10.01);
    expect(roundWalletMoney(1.1 + 2.2)).toBe(3.3);
  });

  it("blocks non-positive and overdraft debits", () => {
    expect(canDebitAvailable(100, 0)).toBe(false);
    expect(canDebitAvailable(100, -1)).toBe(false);
    expect(canDebitAvailable(50, 50.01)).toBe(false);
    expect(canDebitAvailable(50, 50)).toBe(true);
    expect(canDebitAvailable(0, 1)).toBe(false);
  });

  it("builds stable idempotency keys", () => {
    const a = buildWithdrawIdempotencyKey({
      userId: "u1",
      methodId: "m1",
      amount: 10,
      clientKey: "abc",
    });
    const b = buildWithdrawIdempotencyKey({
      userId: "u1",
      methodId: "m1",
      amount: 10.0,
      clientKey: "abc",
    });
    expect(a).toBe(b);
    expect(buildSaleIdempotencyKey("ORD-1", "seller")).toContain("sale:");
    expect(buildRefundIdempotencyKey("ord", "seller")).toContain("refund:");
  });

  it("counts only pending withdrawals as processing (failed = rolled back)", () => {
    const txs: WalletTransaction[] = [
      {
        id: "1",
        orderNumber: "WD-1",
        productTitle: "Withdrawal",
        productImageUrl: "",
        amount: -10,
        status: "pending",
        type: "withdrawal",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        orderNumber: "WD-2",
        productTitle: "Withdrawal",
        productImageUrl: "",
        amount: -20,
        status: "failed",
        type: "withdrawal",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        orderNumber: "WD-3",
        productTitle: "Withdrawal",
        productImageUrl: "",
        amount: -5,
        status: "completed",
        type: "withdrawal",
        createdAt: new Date().toISOString(),
      },
    ];
    const summary = summarizeWalletWithdrawals(txs);
    expect(summary.processingCount).toBe(1);
    expect(summary.processingTotal).toBe(10);
    expect(summary.completedCount).toBe(1);
    expect(summary.completedTotal).toBe(5);
  });

  it("ships additive security migration and fail-closed encrypt", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/20260719120000_wallet_security_certification_v1.sql"),
      "utf8",
    );
    expect(migration).toContain("stripe_webhook_events");
    expect(migration).toContain("wallet_transactions_idempotency_key_uidx");
    expect(migration).toContain("wallet_transactions_sale_order_uidx");
    expect(migration).toContain("revoke select (sort_code, account_number)");
    expect(migration).toContain("locked_balance");

    const crypto = readFileSync(join(process.cwd(), "lib/wallet/crypto.ts"), "utf8");
    expect(crypto).toContain("FAIL CLOSED");
    expect(crypto).toContain("Refusing plaintext");

    const store = readFileSync(join(process.cwd(), "lib/wallet/store.ts"), "utf8");
    expect(store).toContain(".gte(\"available_balance\", amount)");
    expect(store).toContain('status: "pending"');
    expect(store).toContain("idempotency_key");
    expect(store).toContain("isStripeConfigured");
    expect(store).toContain("confirmWithdrawalCompleted");
    expect(store).toContain("rollbackWithdrawal");
    expect(store).toContain("initiateWithdrawalPayout");
    expect(store).toContain("assertWithdrawalRailReady");

    const rail = readFileSync(join(process.cwd(), "lib/stripe/withdraw-payout.ts"), "utf8");
    expect(rail).toContain("walletTransactionId");
    expect(rail).toContain("reverseWithdrawalTransfer");

    const sales = readFileSync(join(process.cwd(), "lib/wallet/sales.ts"), "utf8");
    expect(sales).toContain("createReversal");
    expect(sales).toContain("buildRefundIdempotencyKey");
    expect(sales).toContain("23505");
    expect(sales).toContain("do not invent money movement");
    expect(sales).toContain("isWalletMoneyEnvReady");
    expect(sales).toContain("MISSING_REQUIRED_SECRET");

    const webhook = readFileSync(join(process.cwd(), "lib/stripe/webhook-handler.ts"), "utf8");
    expect(webhook).toContain("stripe_webhook_events");
    expect(webhook).toContain("23505");
    expect(webhook).toContain("confirmWithdrawalCompleted");
    expect(webhook).toContain("rollbackWithdrawal");
    expect(webhook).toContain("walletTransactionId");
    expect(webhook).toContain("missing walletTransactionId/userId metadata");

    const hub = readFileSync(
      join(process.cwd(), "features/wallet/components/WalletHubV1.tsx"),
      "utf8",
    );
    // Owner-approved Wallet Production labels (canonical hub — do not assert legacy copy).
    expect(hub).toContain("Available Balance");
    expect(hub).toContain('title="Pending"');
    expect(hub).toContain('title="Available"');
    expect(hub).toContain('title="Processing"');
    expect(hub).toContain('title="Paid Out"');
    expect(hub).toContain("Withdraw");
    expect(hub).toContain("WALLET_ROUTES.withdraw");
    expect(hub).not.toMatch(/title=\"[^\"]*(Escrow|Protected)[^\"]*\"/);

    const money = readFileSync(join(process.cwd(), "lib/wallet/money-states.ts"), "utf8");
    expect(money).toContain("resolveWalletBalanceView");
    expect(money).toContain("formatAvailableBalanceLabel");
  });

  it("resolves Available-only profile label and balance view", async () => {
    const { formatAvailableBalanceLabel, resolveWalletBalanceView } = await import(
      "@/lib/wallet/money-states"
    );
    const view = resolveWalletBalanceView({
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
    });
    expect(view.available).toBe(100);
    expect(view.pending).toBe(20);
    expect(view.processing).toBe(15);
    expect(view.locked).toBe(5);
    expect(formatAvailableBalanceLabel(1245.5)).toContain("Available");
  });
});

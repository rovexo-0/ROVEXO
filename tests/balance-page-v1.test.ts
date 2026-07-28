import { describe, expect, it } from "vitest";
import {
  BALANCE_PAGE_NAME,
  BALANCE_UI_VERSION,
  buildBalanceHubView,
  formatOrderCountLabel,
  formatWithdrawalCountLabel,
  resolveBalanceAvailableState,
  resolveBalanceWithdrawState,
} from "@/lib/wallet/balance-hub-v1";
import type { WalletData } from "@/lib/wallet/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function mockWallet(partial: Partial<WalletData>): WalletData {
  return {
    availableBalance: 0,
    pendingBalance: 0,
    pendingAvailableAt: new Date().toISOString(),
    lockedBalance: 0,
    paidOutBalance: 0,
    pendingOrderCount: 0,
    withdrawalSummary: {
      processingTotal: 0,
      processingCount: 0,
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

describe("Balance page — Wallet Production presentation", () => {
  it("locks canonical page name Balance over Wallet Production UI", () => {
    expect(BALANCE_PAGE_NAME).toBe("Balance");
    expect(BALANCE_UI_VERSION).toBe("v1.0");
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    expect(hub).toContain("BALANCE_PAGE_NAME");
    expect(hub).toContain("Available Balance");
    expect(hub).toContain("wallet-v2__hero");
    expect(hub).toContain("WalletInsights");
    expect(hub).toContain("WalletRecentTransactions");
    expect(hub).toContain("WalletConnectedBank");
    expect(hub).not.toContain('title="Wallet"');
    expect(hub).not.toContain("balance-v1__available");
  });

  it("keeps withdraw gate on available funds via engine helper", () => {
    expect(resolveBalanceWithdrawState(mockWallet({ availableBalance: 152.35 })).canWithdraw).toBe(
      true,
    );
    expect(resolveBalanceWithdrawState(mockWallet({ availableBalance: 0 })).canWithdraw).toBe(false);
  });

  it("maps Available card states per money engine", () => {
    expect(resolveBalanceAvailableState(mockWallet({ availableBalance: 152.35 })).state).toBe(
      "available",
    );
    expect(resolveBalanceAvailableState(mockWallet({ availableBalance: 0 })).state).toBe("zero");
  });

  it("builds hub view from live wallet data only", () => {
    const view = buildBalanceHubView(
      mockWallet({
        availableBalance: 152.35,
        pendingBalance: 54.3,
        lockedBalance: 8,
        pendingOrderCount: 2,
        withdrawalSummary: {
          processingTotal: 12.75,
          processingCount: 1,
          completedTotal: 0,
          completedCount: 0,
        },
      }),
    );
    expect(view.available).toBe(152.35);
    expect(view.pending).toBe(54.3);
    expect(view.processing).toBe(12.75);
    expect(view.locked).toBe(8);
    expect(view.pendingOrderCount).toBe(2);
    expect(formatOrderCountLabel(2)).toBe("2 Orders");
    expect(formatWithdrawalCountLabel(1)).toBe("1 Withdrawal");
  });

  it("ships Wallet Production CSS with Full Width Engine conflict fix", () => {
    const css = readSource("styles/rovexo/wallet-hub-v1.css");
    const fullWidth = readSource("styles/rovexo/full-width-engine-v1.css");
    expect(css).toContain(".wallet-v2");
    expect(css).toContain("wallet-v2__hero");
    expect(css).toContain("wallet-v1-canonical-mockup.png");
    expect(fullWidth).toContain("Wallet Production conflict fix");
    expect(fullWidth).toContain("min-width: 100% !important");
  });
});

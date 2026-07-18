import { describe, expect, it } from "vitest";
import { createDefaultWalletEngineDocument } from "@/lib/wallet-engine/defaults";
import {
  WALLET_ENGINE_BALANCE_TYPES,
  WALLET_ENGINE_FILTERS,
  WALLET_ENGINE_MODULES,
  WALLET_ENGINE_PAYOUT_METHODS,
  registerWalletEngineModule,
} from "@/lib/wallet-engine/registry";
import { buildWalletTimeline, mapTransactionType, mapWalletDataToBalances } from "@/lib/wallet-engine/timeline";
import { computeWalletAnalytics } from "@/lib/wallet-engine/reader";
import type { WalletData } from "@/lib/wallet/types";

describe("wallet engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultWalletEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    // Final Master Order: only Personal + Business wallets are enabled.
    expect(doc.walletTypes.some((t) => t.id === "buyer" && t.enabled)).toBe(true);
    expect(doc.walletTypes.some((t) => t.id === "business" && t.enabled)).toBe(true);
    expect(doc.walletTypes.some((t) => t.id === "seller" && t.enabled)).toBe(false);
    expect(doc.walletTypes.some((t) => t.id === "platform" && t.enabled)).toBe(false);
    expect(doc.integrations.ordersEngine).toBe(true);
    expect(doc.integrations.buyerProtection).toBe(true);
    expect(doc.holdPeriodHours).toBe(24);
    expect(doc.platformFeeRate).toBe(0.055);
  });

  it("registers all core wallet modules", () => {
    const ids = WALLET_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("seller-wallet");
    expect(ids).toContain("buyer-wallet");
    expect(ids).toContain("transactions");
    expect(ids).toContain("protection");
  });

  it("defines balance types, filters, and payout methods", () => {
    expect(WALLET_ENGINE_BALANCE_TYPES).toContain("withdrawable");
    expect(WALLET_ENGINE_FILTERS.map((f) => f.id)).toContain("protected");
    expect(WALLET_ENGINE_PAYOUT_METHODS.some((m) => m.id === "stripe-connect" && m.enabled)).toBe(true);
  });

  it("maps transaction types from ledger", () => {
    expect(mapTransactionType("sale")).toBe("sale");
    expect(mapTransactionType("refund")).toBe("refund");
    expect(mapTransactionType("fee")).toBe("buyer-protection-fee");
  });

  it("maps wallet data to enterprise balances", () => {
    const data: WalletData = {
      availableBalance: 10,
      pendingBalance: 50,
      pendingAvailableAt: new Date().toISOString(),
      paidOutBalance: 100,
      withdrawalSummary: {
        processingTotal: 0,
        processingCount: 0,
        completedTotal: 0,
        completedCount: 0,
      },
      monthSummary: {
        revenue: { value: 200, changePercent: 0 },
        withdrawn: { value: 80, changePercent: 0 },
        fees: { value: 10, changePercent: 0 },
      },
      transactions: [],
      withdrawMethods: [],
      connectStatus: { connected: true, payoutsEnabled: true },
    };

    const balances = mapWalletDataToBalances(data);
    expect(balances.pending).toBe(50);
    expect(balances.withdrawable).toBe(50);
    expect(balances.completed).toBe(100);
  });

  it("builds wallet timeline from transaction status", () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const timeline = buildWalletTimeline({
      status: "pending",
      type: "sale",
      createdAt: "2026-06-01T00:00:00Z",
      payoutAvailableAt: futureDate,
    });
    expect(timeline.some((e) => e.id === "protected" && e.current)).toBe(true);
    expect(timeline.find((e) => e.id === "created")?.done).toBe(true);
  });

  it("computes analytics from wallet data", () => {
    const data: WalletData = {
      availableBalance: 10,
      pendingBalance: 50,
      pendingAvailableAt: new Date().toISOString(),
      paidOutBalance: 100,
      withdrawalSummary: {
        processingTotal: 0,
        processingCount: 0,
        completedTotal: 0,
        completedCount: 0,
      },
      monthSummary: {
        revenue: { value: 200, changePercent: 0 },
        withdrawn: { value: 80, changePercent: 0 },
        fees: { value: 10, changePercent: 0 },
      },
      transactions: [
        {
          id: "1",
          orderNumber: "RVX-1",
          productTitle: "Test",
          productImageUrl: "",
          amount: 100,
          status: "completed",
          type: "sale",
          createdAt: new Date().toISOString(),
        },
      ],
      withdrawMethods: [],
      connectStatus: { connected: true, payoutsEnabled: true },
    };

    const analytics = computeWalletAnalytics(data);
    expect(analytics.walletBalance).toBe(160);
    expect(analytics.revenue).toBe(100);
    expect(analytics.pendingFunds).toBe(50);
  });

  it("allows future module registration", () => {
    const next = registerWalletEngineModule({
      id: "custom-hub",
      label: "Custom Hub",
      icon: "💰",
      description: "Future module",
      href: "/wallet",
    });
    expect(next.some((m) => m.id === "custom-hub")).toBe(true);
  });
});

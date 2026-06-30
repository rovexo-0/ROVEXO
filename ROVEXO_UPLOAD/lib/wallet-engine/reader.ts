import { getWalletData, getWalletTransactionById, listWalletTransactions } from "@/lib/wallet/store";
import { PENDING_HOLD_HOURS } from "@/lib/wallet/sales";
import { readLiveWalletEngineDocument, getWalletEngineSnapshotForAdmin } from "@/lib/wallet-engine/engine";
import { WALLET_ENGINE_MODULES } from "@/lib/wallet-engine/registry";
import {
  buildWalletTimeline,
  mapProtectionStatus,
  mapTransactionToSummary,
  mapWalletDataToBalances,
  mapWalletDataToEarnings,
  matchesSearch,
  matchesSummaryFilter,
} from "@/lib/wallet-engine/timeline";
import type {
  WalletEngineAnalytics,
  WalletEngineContext,
  WalletEngineFilterId,
  WalletEngineSnapshot,
  WalletEngineTransactionContext,
  WalletEngineWalletType,
} from "@/lib/wallet-engine/types";
import type { WalletData } from "@/lib/wallet/types";

export async function getPublicWalletEngineConfig() {
  return readLiveWalletEngineDocument();
}

export async function getWalletEngineSnapshot(): Promise<WalletEngineSnapshot> {
  const { draft, live, history } = await getWalletEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: WALLET_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

export async function getWalletEngineContext(
  userId: string,
  walletType: WalletEngineWalletType = "seller",
): Promise<WalletEngineContext> {
  const [data, config] = await Promise.all([getWalletData(userId), readLiveWalletEngineDocument()]);
  const currency = config.currency;

  return {
    walletType,
    balances: mapWalletDataToBalances(data, currency),
    earnings: mapWalletDataToEarnings(data, currency),
    protectionStatus: mapProtectionStatus(data),
    connectEnabled: data.connectStatus.connected,
    payoutsEnabled: data.connectStatus.payoutsEnabled,
    transactions: data.transactions.map((tx) => mapTransactionToSummary(tx, currency)),
  };
}

export async function getWalletEngineTransactionContext(
  userId: string,
  transactionId: string,
): Promise<WalletEngineTransactionContext | null> {
  const [tx, config] = await Promise.all([
    getWalletTransactionById(userId, transactionId),
    readLiveWalletEngineDocument(),
  ]);
  if (!tx) return null;

  const summary = mapTransactionToSummary(tx, config.currency);
  const timeline = buildWalletTimeline({
    status: tx.status,
    type: tx.type,
    createdAt: tx.createdAt,
    payoutAvailableAt: tx.payoutAvailableAt,
    stripeTransferId: tx.stripeTransferId,
  });

  return {
    summary,
    timeline,
    ordersIntegrated: config.integrations.ordersEngine,
    shippingIntegrated: config.integrations.shippingEngine,
  };
}

export async function listWalletEngineSummaries(
  userId: string,
  options?: { filter?: WalletEngineFilterId; query?: string },
) {
  const [transactions, config] = await Promise.all([listWalletTransactions(userId), readLiveWalletEngineDocument()]);

  return transactions
    .map((tx) => mapTransactionToSummary(tx, config.currency))
    .filter((summary) =>
      options?.filter ? matchesSummaryFilter(summary.status, options.filter) : true,
    )
    .filter((summary) =>
      options?.query
        ? matchesSearch(options.query, {
            orderNumber: summary.orderNumber,
            productTitle: summary.productTitle,
            description: summary.description,
          })
        : true,
    );
}

export function computeWalletAnalytics(data: WalletData, configHoldHours = PENDING_HOLD_HOURS): WalletEngineAnalytics {
  const sales = data.transactions.filter((tx) => tx.type === "sale");
  const refunds = data.transactions.filter((tx) => tx.type === "refund");
  const withdrawals = data.transactions.filter((tx) => tx.type === "withdrawal");
  const fees = data.transactions.filter((tx) => tx.type === "fee");

  return {
    walletBalance: data.pendingBalance + data.availableBalance + data.paidOutBalance,
    revenue: sales.reduce((sum, tx) => sum + tx.amount, 0),
    pendingFunds: data.pendingBalance,
    protectedFunds: data.pendingBalance,
    availableFunds: data.availableBalance,
    withdrawals: Math.abs(withdrawals.reduce((sum, tx) => sum + tx.amount, 0)),
    refunds: Math.abs(refunds.reduce((sum, tx) => sum + tx.amount, 0)),
    averagePayoutTimeHours: configHoldHours,
    monthlyRevenue: data.monthSummary.revenue.value,
    platformRevenue: Math.abs(fees.reduce((sum, tx) => sum + tx.amount, 0)),
  };
}

export async function getWalletEngineAnalyticsForUser(userId: string): Promise<WalletEngineAnalytics> {
  const [data, config] = await Promise.all([getWalletData(userId), readLiveWalletEngineDocument()]);
  return computeWalletAnalytics(data, config.holdPeriodHours);
}

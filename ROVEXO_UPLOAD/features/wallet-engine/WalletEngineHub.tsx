"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MonthSummaryGrid } from "@/features/wallet/components/MonthSummaryGrid";
import { PayoutSetupSection } from "@/features/wallet/components/PayoutSetupSection";
import { PayoutStatusCard } from "@/features/wallet/components/PayoutStatusCard";
import { PendingBalanceCard } from "@/features/wallet/components/PendingBalanceCard";
import { RecentTransactionsSection } from "@/features/wallet/components/RecentTransactionsSection";
import { WalletHeader } from "@/features/wallet/components/WalletHeader";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/wallet/utils";
import { WALLET_ENGINE_FILTERS } from "@/lib/wallet-engine/registry";
import type {
  WalletEngineAnalytics,
  WalletEngineContext,
  WalletEngineDocument,
  WalletEngineFilterId,
  WalletEngineModule,
} from "@/lib/wallet-engine/types";
import type { WalletData } from "@/lib/wallet/types";
import type { UserProfile } from "@/lib/profile/types";

type WalletEngineHubProps = {
  profile: UserProfile;
  data: WalletData;
  config: WalletEngineDocument;
  context: WalletEngineContext;
  modules: WalletEngineModule[];
  analytics: WalletEngineAnalytics;
  backHref?: string;
  connectMessage?: string;
};

export function WalletEngineHub({
  profile,
  data,
  config,
  context,
  modules,
  analytics,
  backHref = "/seller/dashboard",
  connectMessage,
}: WalletEngineHubProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WalletEngineFilterId | "all">("all");
  const [tab, setTab] = useState<"wallet" | "transactions" | "analytics">("wallet");

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.transactions.filter((tx) => {
      const matchesQuery =
        !q ||
        tx.orderNumber.toLowerCase().includes(q) ||
        tx.productTitle.toLowerCase().includes(q) ||
        (tx.description?.toLowerCase().includes(q) ?? false);
      if (!matchesQuery) return false;
      if (filter === "all") return true;
      if (filter === "pending") return tx.status === "pending";
      if (filter === "completed") return tx.status === "completed";
      if (filter === "failed") return tx.status === "failed";
      if (filter === "refunded") return tx.status === "refunded";
      if (filter === "processing") return tx.type === "withdrawal" && tx.status === "pending";
      if (filter === "protected") return tx.status === "pending" && tx.type === "sale";
      if (filter === "available") return tx.status === "completed" && tx.type === "sale";
      return true;
    });
  }, [data.transactions, query, filter]);

  return (
    <>
      <WalletHeader backHref={backHref} unreadNotifications={profile.unreadNotifications} />

      <main className="we-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <header className="we-hub__intro">
          <p className="we-hub__eyebrow">Wallet Engine</p>
          <p className="text-sm text-text-secondary">
            {config.marketplaceVersion} · {config.primaryCountry} · {config.currency}
          </p>
          <p className="text-sm text-text-muted">
            {context.protectionStatus.replace(/-/g, " ")} · Hold {config.holdPeriodHours}h · Fee{" "}
            {(config.platformFeeRate * 100).toFixed(0)}%
          </p>
        </header>

        {connectMessage ? (
          <p className="rounded-ds-lg border border-primary/20 bg-primary/5 px-ds-4 py-ds-3 text-sm text-text-primary">
            {connectMessage}
          </p>
        ) : null}

        <div className="we-hub__tabs">
          <button type="button" className={cn("we-hub__tab", tab === "wallet" && "we-hub__tab--active")} onClick={() => setTab("wallet")}>
            Wallet
          </button>
          <button type="button" className={cn("we-hub__tab", tab === "transactions" && "we-hub__tab--active")} onClick={() => setTab("transactions")}>
            Transactions
          </button>
          <button type="button" className={cn("we-hub__tab", tab === "analytics" && "we-hub__tab--active")} onClick={() => setTab("analytics")}>
            Analytics
          </button>
        </div>

        {tab === "analytics" ? (
          <section className="we-panel">
            <div className="we-analytics-grid">
              <MetricCard label="Wallet balance" value={formatCurrency(analytics.walletBalance)} />
              <MetricCard label="Revenue" value={formatCurrency(analytics.revenue)} />
              <MetricCard label="Pending" value={formatCurrency(analytics.pendingFunds)} />
              <MetricCard label="Protected" value={formatCurrency(analytics.protectedFunds)} />
              <MetricCard label="Available" value={formatCurrency(analytics.availableFunds)} />
              <MetricCard label="Withdrawals" value={formatCurrency(analytics.withdrawals)} />
              <MetricCard label="Refunds" value={formatCurrency(analytics.refunds)} />
              <MetricCard label="Avg payout" value={`${analytics.averagePayoutTimeHours}h`} />
            </div>
          </section>
        ) : tab === "transactions" ? (
          <>
            <input
              className="we-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transaction ID, order, product…"
            />
            <div className="we-chip-row">
              <button type="button" className={cn("we-chip", filter === "all" && "we-chip--active")} onClick={() => setFilter("all")}>
                All
              </button>
              {WALLET_ENGINE_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn("we-chip", filter === item.id && "we-chip--active")}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <RecentTransactionsSection transactions={filteredTransactions} />
          </>
        ) : (
          <>
            <section className="we-panel">
              <h2 className="we-panel__title">Balances</h2>
              <div className="we-balance-grid">
                <BalanceChip label="Pending" value={context.balances.pending} />
                <BalanceChip label="Protected" value={context.balances.protected} />
                <BalanceChip label="Available" value={context.balances.available} />
                <BalanceChip label="Withdrawable" value={context.balances.withdrawable} />
                <BalanceChip label="Completed" value={context.balances.completed} />
                <BalanceChip label="Refunds" value={context.balances.refund} />
              </div>
            </section>

            <PayoutStatusCard paidOutBalance={data.paidOutBalance} payoutsEnabled={data.connectStatus.payoutsEnabled} />
            <PendingBalanceCard balance={data.pendingBalance} availableAt={data.pendingAvailableAt} />
            <MonthSummaryGrid revenue={data.monthSummary.revenue} withdrawn={data.monthSummary.withdrawn} fees={data.monthSummary.fees} />
            <RecentTransactionsSection transactions={data.transactions.slice(0, 5)} />
            <PayoutSetupSection connectStatus={data.connectStatus} />
          </>
        )}

        <section className="we-panel">
          <h2 className="we-panel__title">Integrations</h2>
          <div className="we-module-grid">
            {modules.slice(5).map((module) => (
              <Link key={module.id} href={module.href} className="we-module-card">
                <span>{module.icon}</span>
                <span className="font-semibold">{module.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="we-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="we-metric-card__value">{value}</p>
    </div>
  );
}

function BalanceChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="we-balance-chip">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="font-semibold">{formatCurrency(value)}</p>
    </div>
  );
}

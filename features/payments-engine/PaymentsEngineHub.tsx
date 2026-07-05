"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/wallet/utils";
import { PAYMENTS_ENGINE_FILTERS } from "@/lib/payments-engine/registry";
import type {
  PaymentsEngineAnalytics,
  PaymentsEngineContext,
  PaymentsEngineDocument,
  PaymentsEngineFilterId,
  PaymentsEngineModule,
  PaymentsEngineSummary,
} from "@/lib/payments-engine/types";

type PaymentsEngineHubProps = {
  config: PaymentsEngineDocument;
  context: PaymentsEngineContext;
  modules: PaymentsEngineModule[];
  summaries: PaymentsEngineSummary[];
  analytics: PaymentsEngineAnalytics;
};

export function PaymentsEngineHub({
  config,
  context,
  modules,
  summaries,
  analytics,
}: PaymentsEngineHubProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PaymentsEngineFilterId | "all">("all");
  const [tab, setTab] = useState<"overview" | "history" | "analytics">("overview");

  const filteredSummaries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summaries.filter((payment) => {
      const matchesQuery =
        !q ||
        payment.orderNumber.toLowerCase().includes(q) ||
        payment.productTitle.toLowerCase().includes(q) ||
        payment.buyerName.toLowerCase().includes(q) ||
        payment.sellerName.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (filter === "all") return true;
      return payment.filterTags.includes(filter);
    });
  }, [summaries, query, filter]);

  return (
    <BetaAppShell bottomNavTab="account">
      <BetaPageHeader title="Payments" backHref="/account" />

      <main className="pe-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <header className="pe-hub__intro">
          <p className="pe-hub__eyebrow">Payments Engine</p>
          <p className="text-sm text-text-secondary">
            {config.marketplaceVersion} · {config.primaryCountry} · {config.currency}
          </p>
          <p className="text-sm text-text-muted">
            {context.stripeConfigured ? "Payments active" : "Payments setup pending"} · {context.savedMethodsCount} saved methods ·{" "}
            {context.protectionStatus.replace(/-/g, " ")}
          </p>
        </header>

        <div className="pe-hub__tabs">
          <button type="button" className={cn("pe-hub__tab", tab === "overview" && "pe-hub__tab--active")} onClick={() => setTab("overview")}>
            Overview
          </button>
          <button type="button" className={cn("pe-hub__tab", tab === "history" && "pe-hub__tab--active")} onClick={() => setTab("history")}>
            History
          </button>
          <button type="button" className={cn("pe-hub__tab", tab === "analytics" && "pe-hub__tab--active")} onClick={() => setTab("analytics")}>
            Analytics
          </button>
        </div>

        {tab === "analytics" ? (
          <section className="pe-panel">
            <div className="pe-analytics-grid">
              <MetricCard label="Revenue" value={formatCurrency(analytics.revenue)} />
              <MetricCard label="Completed" value={analytics.completedPayments} />
              <MetricCard label="Pending" value={analytics.pendingPayments} />
              <MetricCard label="Failed" value={analytics.failedPayments} />
              <MetricCard label="Avg transaction" value={formatCurrency(analytics.averageTransaction)} />
              <MetricCard label="Platform fees" value={formatCurrency(analytics.platformFees)} />
              <MetricCard label="Protection fees" value={formatCurrency(analytics.buyerProtectionFees)} />
              <MetricCard label="Refund rate" value={`${(analytics.refundRate * 100).toFixed(1)}%`} />
            </div>
          </section>
        ) : tab === "history" ? (
          <>
            <input
              className="pe-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search payment ID, order, product…"
            />
            <div className="pe-chip-row">
              <button type="button" className={cn("pe-chip", filter === "all" && "pe-chip--active")} onClick={() => setFilter("all")}>
                All
              </button>
              {PAYMENTS_ENGINE_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn("pe-chip", filter === item.id && "pe-chip--active")}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <PaymentList payments={filteredSummaries} />
          </>
        ) : (
          <>
            <section className="pe-panel">
              <h2 className="pe-panel__title">Payment Flow</h2>
              <p className="text-sm text-text-secondary mb-ds-3">
                Checkout → Authorization → Verification → Capture → Wallet → Protection → Orders → Shipping → Payout
              </p>
              <div className="pe-chip-row">
                {config.paymentMethods.filter((m) => m.enabled).slice(0, 5).map((method) => (
                  <span key={method.id} className="pe-chip pe-chip--active">{method.label}</span>
                ))}
              </div>
            </section>
            <PaymentList payments={context.recentPayments} title="Recent payments" />
          </>
        )}

        <section className="pe-panel">
          <h2 className="pe-panel__title">Integrations</h2>
          <div className="pe-module-grid">
            {modules.slice(4).map((module) => (
              <Link key={module.id} href={module.href} className="pe-module-card">
                <span>{module.icon}</span>
                <span className="font-semibold">{module.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </BetaAppShell>
  );
}

function PaymentList({ payments, title = "Payments" }: { payments: PaymentsEngineSummary[]; title?: string }) {
  return (
    <section className="pe-panel">
      <h2 className="pe-panel__title">{title}</h2>
      <div className="pe-list">
        {payments.length === 0 ? <p className="text-sm text-text-muted">No payments found.</p> : null}
        {payments.map((payment) => (
          <Link key={payment.paymentId} href={`/orders/${payment.orderId}`} className="pe-list__row pe-list__row--link">
            <div>
              <p className="font-semibold">{payment.productTitle}</p>
              <p className="text-sm text-text-secondary">
                {payment.orderNumber} · {payment.status.replace(/-/g, " ")}
              </p>
            </div>
            <span className="font-semibold">{formatCurrency(payment.grandTotal)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pe-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="pe-metric-card__value">{value}</p>
    </div>
  );
}

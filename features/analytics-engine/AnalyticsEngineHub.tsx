"use client";

import Link from "next/link";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { useState } from "react";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/wallet/utils";
import type {
  AnalyticsEngineAnalytics,
  AnalyticsEngineContext,
  AnalyticsEngineDocument,
  AnalyticsEngineModule,
} from "@/lib/analytics-engine/types";

type AnalyticsEngineHubProps = {
  config: AnalyticsEngineDocument;
  context: AnalyticsEngineContext;
  modules: AnalyticsEngineModule[];
  analytics: AnalyticsEngineAnalytics;
};

type HubTab = "dashboard" | "financial" | "live" | "modules" | "export";

export function AnalyticsEngineHub({ config, context, modules, analytics }: AnalyticsEngineHubProps) {
  const [tab, setTab] = useState<HubTab>("dashboard");

  return (
    <BetaAppShell bottomNavTab="account">
      <BetaPageHeader title="Analytics" backHref="/account" />

      <HubPageMain className="ae-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 ">
        <header className="ae-hub__intro">
          <p className="ae-hub__eyebrow">Analytics Engine</p>
          <p className="text-sm text-text-secondary">
            {config.marketplaceVersion} · {config.primaryCountry} · {config.currency} · {context.rangeLabel}
          </p>
          <p className="text-sm text-text-muted">
            Marketplace health {context.live.marketplaceHealth}% · {analytics.ordersTotal} orders this period
          </p>
        </header>

        <div className="ae-hub__tabs">
          {(
            [
              { id: "dashboard", label: "Dashboard" },
              { id: "financial", label: "Financial" },
              { id: "live", label: "Live" },
              { id: "modules", label: "Modules" },
              { id: "export", label: "Export" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("ae-hub__tab", tab === item.id && "ae-hub__tab--active")}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "financial" ? (
          <section className="ae-panel">
            <h2 className="ae-panel__title">Financial Analytics</h2>
            <div className="ae-analytics-grid">
              <MetricCard label="Gross revenue" value={formatCurrency(context.financial.grossRevenue)} />
              <MetricCard label="Net revenue" value={formatCurrency(context.financial.netRevenue)} />
              <MetricCard label="Platform fees" value={formatCurrency(context.financial.platformFees)} />
              <MetricCard label="Platform fees" value={formatCurrency(context.financial.buyerProtectionRevenue)} />
              <MetricCard label="Refunds" value={formatCurrency(context.financial.refunds)} />
              <MetricCard label="Withdrawals" value={formatCurrency(context.financial.withdrawals)} />
              <MetricCard label="Seller earnings" value={formatCurrency(context.financial.sellerEarnings)} />
              <MetricCard label="Avg order value" value={formatCurrency(context.financial.averageOrderValue)} />
              <MetricCard label="Conversion" value={`${(context.financial.conversionRate * 100).toFixed(1)}%`} />
            </div>
          </section>
        ) : tab === "live" ? (
          <>
            <section className="ae-live-banner">
              <p className="font-semibold">Live marketplace intelligence</p>
              <p className="text-sm text-text-secondary mt-ds-1">
                Health score {context.live.marketplaceHealth}% · Orders today {context.live.ordersToday}
              </p>
            </section>
            <section className="ae-panel">
              <div className="ae-analytics-grid">
                <MetricCard label="Revenue" value={formatCurrency(context.live.revenue)} />
                <MetricCard label="Orders today" value={context.live.ordersToday} />
                <MetricCard label="Orders this week" value={context.live.ordersThisWeek} />
                <MetricCard label="Orders this month" value={context.live.ordersThisMonth} />
                <MetricCard label="Active users" value={context.live.activeUsers} />
                <MetricCard label="Online users" value={context.live.onlineUsers} />
                <MetricCard label="Messages" value={context.live.messages} />
                <MetricCard label="Notifications" value={context.live.notifications} />
                <MetricCard label="Disputes" value={context.live.disputes} />
                <MetricCard label="Returns" value={context.live.returns} />
                <MetricCard label="Withdrawals" value={context.live.withdrawals} />
              </div>
            </section>
            <section className="ae-panel">
              <h2 className="ae-panel__title">Live Charts</h2>
              <div className="ae-chip-row">
                {config.liveCharts.filter((c) => c.enabled).map((chart) => (
                  <span key={chart.id} className="ae-chip ae-chip--active">{chart.label}</span>
                ))}
              </div>
            </section>
          </>
        ) : tab === "modules" ? (
          <section className="ae-panel">
            <h2 className="ae-panel__title">Analytics Modules</h2>
            <div className="ae-module-grid">
              {modules.map((module) => (
                <Link key={module.id} href={module.href} className="ae-module-card">
                  <ModuleIcon href={module.href} id={module.id} />
                  <div>
                    <p className="font-semibold">{module.label}</p>
                    <p className="text-xs text-text-secondary">{module.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : tab === "export" ? (
          <>
            <section className="ae-panel">
              <h2 className="ae-panel__title">Export Center</h2>
              <div className="ae-chip-row">
                {config.exportFormats.filter((f) => f.enabled).map((format) => (
                  <span key={format.id} className="ae-chip ae-chip--active">{format.label}</span>
                ))}
              </div>
              <p className="text-sm text-text-muted mt-ds-3">
                Report periods: {config.reportPeriods.filter((p) => p.enabled).map((p) => p.label).join(", ")}
              </p>
            </section>
            <section className="ae-panel">
              <h2 className="ae-panel__title">Google Analytics</h2>
              <div className="ae-chip-row">
                {config.googleAnalytics.ga4Enabled ? <span className="ae-chip ae-chip--active">GA4</span> : null}
                {config.googleAnalytics.gtmEnabled ? <span className="ae-chip ae-chip--active">GTM</span> : null}
                {config.googleAnalytics.searchConsoleEnabled ? (
                  <span className="ae-chip ae-chip--active">Search Console</span>
                ) : null}
              </div>
              <p className="text-xs text-text-muted mt-ds-2">Measurement ID: {config.googleAnalytics.measurementId}</p>
            </section>
          </>
        ) : (
          <>
            <section className="ae-panel">
              <h2 className="ae-panel__title">Marketplace Overview</h2>
              <div className="ae-analytics-grid">
                <MetricCard label="Orders" value={analytics.ordersTotal} />
                <MetricCard label="Revenue" value={formatCurrency(analytics.revenueTotal)} />
                <MetricCard label="Messages" value={analytics.messagesTotal} />
                <MetricCard label="Notifications" value={analytics.notificationsTotal} />
                <MetricCard label="Open cases" value={analytics.protectionOpenCases} />
                <MetricCard label="Wallet balance" value={formatCurrency(analytics.walletBalance)} />
                <MetricCard label="Failed payments" value={analytics.failedPayments} />
                <MetricCard label="Avg order value" value={formatCurrency(analytics.averageOrderValue)} />
              </div>
            </section>
            <section className="ae-panel">
              <h2 className="ae-panel__title">Engine Integrations</h2>
              <div className="ae-module-grid">
                {modules.slice(2, 10).map((module) => (
                  <Link key={module.id} href={module.href} className="ae-module-card">
                    <ModuleIcon href={module.href} id={module.id} />
                    <span className="font-semibold">{module.label}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="ae-panel">
              <h2 className="ae-panel__title">Monitoring</h2>
              <div className="ae-stats-grid">
                <StatChip label="API monitoring" value={Object.values(config.apiMonitoring).filter(Boolean).length} />
                <StatChip label="Performance" value={Object.values(config.performanceMonitoring).filter(Boolean).length} />
                <StatChip label="Live metrics" value={config.liveMetrics.filter((m) => m.enabled).length} />
              </div>
            </section>
          </>
        )}
      </HubPageMain>
    </BetaAppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ae-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="ae-metric-card__value">{value}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="ae-stat-chip">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

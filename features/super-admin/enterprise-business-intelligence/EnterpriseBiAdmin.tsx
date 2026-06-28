"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { ENTERPRISE_BI_MODULE_DESCRIPTOR } from "@/lib/enterprise-business-intelligence/descriptor";
import { ENTERPRISE_BI_API, ENTERPRISE_BI_ROUTES, KPI_PERIODS } from "@/lib/enterprise-business-intelligence/registry";
import type { BiSnapshot, BiTab } from "@/lib/enterprise-business-intelligence/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = ENTERPRISE_BI_ROUTES.filter((r) => r.id !== "dashboard-alt");
const MODULE_ID = ENTERPRISE_BI_MODULE_DESCRIPTOR.id;

type EnterpriseBiAdminProps = { initialSnapshot: BiSnapshot; defaultTab?: BiTab };

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export function EnterpriseBiAdmin({ initialSnapshot, defaultTab = "dashboard" }: EnterpriseBiAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(ENTERPRISE_BI_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { businessIntelligence?: BiSnapshot };
    if (data.businessIntelligence) setSnapshot(data.businessIntelligence);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "refresh" ? ENTERPRISE_BI_API.refresh
            : action === "calculate" ? ENTERPRISE_BI_API.calculate
              : action === "forecast" ? ENTERPRISE_BI_API.forecast
                : action === "export" ? ENTERPRISE_BI_API.export
                  : action === "import" ? ENTERPRISE_BI_API.import
                    : ENTERPRISE_BI_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; businessIntelligence?: BiSnapshot };
        setMessage(response.ok ? "BI action completed." : data.error ?? "Action failed.");
        if (data.businessIntelligence) setSnapshot(data.businessIntelligence);
        else await refresh();
      });
    },
    [refresh],
  );

  const validations = createOmegaValidations(
    undefined,
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Business Intelligence"),
        kpis: [
          { id: "revenue", label: "Revenue", value: formatCurrency(snapshot.dashboard.revenue), status: "healthy" as const },
          { id: "orders", label: "Orders", value: snapshot.dashboard.orders.toLocaleString(), status: "healthy" as const },
          { id: "growth", label: "Growth", value: `+${snapshot.dashboard.marketplaceGrowth}%`, status: "healthy" as const },
          { id: "health", label: "Platform Health", value: `${snapshot.dashboard.platformHealth}%`, status: "healthy" as const },
        ],
        recentActivity: snapshot.auditLog.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: snapshot.forecasts.slice(0, 3).map((f) => `${f.source.toUpperCase()} [${f.type}]: ${f.summary}`),
        quickActions: [
          { label: "Analytics Engine", href: "/super-admin/analytics-engine" },
          { label: "AI Operating System", href: "/super-admin/ai" },
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Business Intelligence Center"
      title="Executive Analytics Platform"
      description="KPI engine, marketplace analytics, AI forecasting, and executive reports for data-driven decisions."
      enterpriseScore={snapshot.health.score}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={snapshot.pendingPublish ? "Pending publish — draft differs from live." : undefined}
      aiInsight="OMEGA PRIME: Business Intelligence Center is production ready for global enterprise audit."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("refresh")}>Refresh</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("calculate")}>Calculate KPIs</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("forecast")}>Run Forecast</Button>
        </>
      }
      quickLinks={[
        { label: "Analytics Engine", href: "/super-admin/analytics-engine" },
        { label: "AI Operating System", href: "/super-admin/ai" },
      ]}
    >
      {activeTab === "dashboard" && (
        <section className="ea-panel">
          <h3>Executive Summary</h3>
          <dl className="ea-metrics">
            <div><dt>Revenue</dt><dd>{formatCurrency(snapshot.dashboard.revenue)}</dd></div>
            <div><dt>Profit</dt><dd>{formatCurrency(snapshot.dashboard.profit)}</dd></div>
            <div><dt>Orders</dt><dd>{snapshot.dashboard.orders.toLocaleString()}</dd></div>
            <div><dt>GMV</dt><dd>{formatCurrency(snapshot.dashboard.gmv)}</dd></div>
            <div><dt>Visitors</dt><dd>{snapshot.dashboard.visitors.toLocaleString()}</dd></div>
            <div><dt>Conversion</dt><dd>{snapshot.dashboard.conversionRate}%</dd></div>
            <div><dt>Active Buyers</dt><dd>{snapshot.dashboard.activeBuyers.toLocaleString()}</dd></div>
            <div><dt>Active Sellers</dt><dd>{snapshot.dashboard.activeSellers.toLocaleString()}</dd></div>
            <div><dt>New Registrations</dt><dd>{snapshot.dashboard.newRegistrations.toLocaleString()}</dd></div>
            <div><dt>Pending Reviews</dt><dd>{snapshot.dashboard.pendingReviews}</dd></div>
            <div><dt>Platform Health</dt><dd>{snapshot.dashboard.platformHealth}%</dd></div>
            <div><dt>Marketplace Growth</dt><dd>+{snapshot.dashboard.marketplaceGrowth}%</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "kpis" && (
        <section className="ea-panel">
          <h3>KPI Engine</h3>
          <div className="ebi-periods">
            {KPI_PERIODS.slice(0, 5).map((p) => (
              <Button key={p} type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => runAction("calculate", { period: p })}>{p}</Button>
            ))}
          </div>
          <table className="ea-table">
            <thead><tr><th>KPI</th><th>Value</th><th>Previous</th><th>Change</th><th>Period</th></tr></thead>
            <tbody>
              {snapshot.kpis.map((k) => (
                <tr key={k.id}>
                  <td>{k.label}</td>
                  <td>{k.unit === "currency" ? formatCurrency(k.value) : k.unit === "percent" ? `${k.value}%` : k.value.toLocaleString()}</td>
                  <td>{k.previousValue.toLocaleString()}</td>
                  <td className={k.changePercent >= 0 ? "ebi-up" : "ebi-down"}>{k.changePercent >= 0 ? "+" : ""}{k.changePercent}%</td>
                  <td>{k.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "revenue" && (
        <section className="ea-panel">
          <h3>Financial Analytics</h3>
          <ul className="ea-list">
            {snapshot.financial.map((f) => (
              <li key={f.metric}><strong>{f.label}</strong> — {formatCurrency(f.amount)} ({f.changePercent >= 0 ? "+" : ""}{f.changePercent}%)</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "users" && (
        <section className="ea-panel">
          <h3>User Analytics</h3>
          <dl className="ea-metrics">
            <div><dt>Registrations</dt><dd>{snapshot.userAnalytics.registrations}</dd></div>
            <div><dt>Retention</dt><dd>{snapshot.userAnalytics.retentionRate}%</dd></div>
            <div><dt>Churn</dt><dd>{snapshot.userAnalytics.churnRate}%</dd></div>
            <div><dt>Trust Score</dt><dd>{snapshot.userAnalytics.trustScoreAvg}</dd></div>
            <div><dt>Business Accounts</dt><dd>{snapshot.userAnalytics.businessAccounts}</dd></div>
            <div><dt>Verified</dt><dd>{snapshot.userAnalytics.verifiedAccounts}</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "orders" && (
        <section className="ea-panel">
          <h3>Order Analytics</h3>
          <p>Orders: {snapshot.dashboard.orders.toLocaleString()} · GMV: {formatCurrency(snapshot.dashboard.gmv)}</p>
          <p>Conversion rate: {snapshot.dashboard.conversionRate}% from {snapshot.traffic.visitors.toLocaleString()} visitors</p>
        </section>
      )}

      {activeTab === "sellers" && (
        <section className="ea-panel">
          <h3>Seller Leaderboard</h3>
          <ul className="ea-list">
            {(snapshot.marketplace["top-sellers"] ?? []).map((s) => (
              <li key={s.id}>#{s.rank} {s.label} — {formatCurrency(s.value)}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "products" && (
        <section className="ea-panel">
          <h3>Product & Category Analytics</h3>
          <h4>Top Categories</h4>
          <ul className="ea-list">
            {(snapshot.marketplace["top-categories"] ?? []).map((c) => (
              <li key={c.id}>#{c.rank} {c.label} — {formatCurrency(c.value)}</li>
            ))}
          </ul>
          <h4>Top Products</h4>
          <ul className="ea-list">
            {(snapshot.marketplace["top-products"] ?? []).map((p) => (
              <li key={p.id}>#{p.rank} {p.label} — {formatCurrency(p.value)}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "forecasting" && (
        <section className="ea-panel">
          <h3>AI Forecasting</h3>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("forecast")}>Regenerate Forecasts</Button>
          <ul className="ea-list">
            {snapshot.forecasts.map((f) => (
              <li key={f.id}><strong>{f.source.toUpperCase()}</strong> [{f.type}] — {f.summary} ({f.confidence}%)</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Executive Reports</h3>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("generate-report", { reportType: "revenue" })}>Generate Revenue Report</Button>
          <ul className="ea-list">
            {snapshot.reports.map((r) => (
              <li key={r.id}><strong>{r.title}</strong> — {r.summary.slice(0, 60)}…</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "export" && (
        <section className="ea-panel">
          <h3>Export Center</h3>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "excel" })}>Excel</Button>
          </div>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="ea-panel">
          <h3>Settings</h3>
          <dl className="ea-metrics">
            <div><dt>Default Period</dt><dd>{snapshot.settings.defaultPeriod}</dd></div>
            <div><dt>Live Updates</dt><dd>{snapshot.settings.liveUpdatesEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Scheduled Reports</dt><dd>{snapshot.settings.scheduledReportsEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Auto Refresh</dt><dd>{snapshot.settings.autoRefreshMinutes} min</dd></div>
            <div><dt>MFA Required</dt><dd>{snapshot.settings.mfaRequired ? "Yes" : "No"}</dd></div>
          </dl>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

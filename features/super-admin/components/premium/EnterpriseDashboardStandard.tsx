"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SuperAdminPremiumCard } from "@/features/super-admin/components/premium/SuperAdminPremiumCard";
import { SuperAdminPremiumTable } from "@/features/super-admin/components/premium/SuperAdminPremiumTable";
import type { EnterpriseDashboardStandardData } from "@/lib/super-admin/premium/dashboard-standard";

type EnterpriseDashboardStandardProps = {
  data: EnterpriseDashboardStandardData;
};

export function EnterpriseDashboardStandard({ data }: EnterpriseDashboardStandardProps) {
  const maxChart = Math.max(...(data.chartValues ?? []), 1);

  return (
    <div className="ea-dashboard">
      {data.kpis && data.kpis.length > 0 ? (
        <section className="ea-dashboard__section">
          <h3 className="ea-dashboard__heading">Live KPIs</h3>
          <div className="ea-grid">
            {data.kpis.map((kpi) => (
              <SuperAdminPremiumCard
                key={kpi.id}
                label={kpi.label}
                value={`${kpi.value}${kpi.unit ? ` ${kpi.unit}` : ""}`}
                status={kpi.status}
              />
            ))}
          </div>
        </section>
      ) : null}

      {data.chartValues && data.chartValues.length > 0 ? (
        <section className="ea-panel">
          <h3 className="ea-panel__title">{data.chartLabel ?? "Trend"}</h3>
          <div className="ea-chart" aria-hidden>
            {data.chartValues.map((value, index) => (
              <div
                key={index}
                className="ea-chart__bar"
                style={{ height: `${Math.max(8, (value / maxChart) * 100)}%` }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {data.aiInsights && data.aiInsights.length > 0 ? (
        <section className="ea-panel">
          <h3 className="ea-panel__title">AI Insights</h3>
          <ul className="ea-list">
            {data.aiInsights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.alerts && data.alerts.length > 0 ? (
        <section className="ea-dashboard__section">
          <h3 className="ea-dashboard__heading">Alerts</h3>
          <div className="ea-alerts">
            {data.alerts.map((alert) => (
              <div key={alert.id} className={`ea-alert ea-alert--${alert.level}`}>
                {alert.message}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.pendingActions && data.pendingActions.length > 0 ? (
        <section className="ea-panel">
          <h3 className="ea-panel__title">Pending Actions</h3>
          <ul className="ea-list">
            {data.pendingActions.map((action) => (
              <li key={action.id}>
                {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.recentActivity && data.recentActivity.length > 0 ? (
        <section className="ea-dashboard__section">
          <h3 className="ea-dashboard__heading">Recent Activity</h3>
          <SuperAdminPremiumTable
            rows={data.recentActivity}
            rowKey={(row) => row.id}
            columns={[
              { key: "action", header: "Action", render: (row) => row.action },
              { key: "actor", header: "Actor", render: (row) => row.actor },
              { key: "time", header: "Time", render: (row) => new Date(row.timestamp).toLocaleString() },
            ]}
          />
        </section>
      ) : null}

      {data.timeline && data.timeline.length > 0 ? (
        <section className="ea-panel">
          <h3 className="ea-panel__title">Timeline</h3>
          <ol className="ea-timeline">
            {data.timeline.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {data.auditSummary && data.auditSummary.length > 0 ? (
        <section className="ea-panel">
          <h3 className="ea-panel__title">Audit Summary</h3>
          <ul className="ea-list">
            {data.auditSummary.map((entry) => (
              <li key={entry.id}>
                {entry.action} — {new Date(entry.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.quickActions && data.quickActions.length > 0 ? (
        <section className="ea-dashboard__section">
          <h3 className="ea-dashboard__heading">Quick Actions</h3>
          <div className="ea-admin__actions">
            {data.quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button type="button" variant="secondary">{action.label}</Button>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

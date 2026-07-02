"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { SuperAdminPremiumCard } from "@/features/super-admin/components/premium/SuperAdminPremiumCard";
import { SuperAdminPremiumTable } from "@/features/super-admin/components/premium/SuperAdminPremiumTable";
import { SuperAdminStatusBadge } from "@/features/super-admin/components/premium/SuperAdminPremiumCard";
import type {
  PremiumActivityItem,
  PremiumAlert,
  PremiumKpiCard,
} from "@/lib/super-admin/premium/types";

type SuperAdminPremiumDashboardProps = {
  kpis: PremiumKpiCard[];
  chartValues?: number[];
  chartLabel?: string;
  quickActions?: Array<{ label: string; href: string }>;
  recentActivity?: PremiumActivityItem[];
  alerts?: PremiumAlert[];
  health?: { score: number; status: "healthy" | "warning" | "critical"; message: string };
  toolbar?: ReactNode;
  children?: ReactNode;
};

export function SuperAdminPremiumDashboard({
  kpis,
  chartValues = [],
  chartLabel = "7-day trend",
  quickActions = [],
  recentActivity = [],
  alerts = [],
  health,
  toolbar,
  children,
}: SuperAdminPremiumDashboardProps) {
  const maxChart = Math.max(...chartValues, 1);

  return (
    <div className="sa-premium-dashboard">
      {toolbar}
      {health ? (
        <div className="sa-premium-page-header">
          <div>
            <p className="sa-premium-page-header__desc">{health.message}</p>
          </div>
          <div className="sa-premium-page-header__meta">
            <SuperAdminStatusBadge label={health.status} status={health.status} />
            <span className="sa-premium-card__value">{health.score}%</span>
          </div>
        </div>
      ) : null}

      {alerts.length > 0 ? (
        <section>
          <h2 className="sa-premium-dashboard__section-title">Alerts</h2>
          <div className="space-y-ds-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={`sa-premium-alert sa-premium-alert--${alert.level}`}>
                {alert.message}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="sa-premium-dashboard__section-title">Live KPIs</h2>
        <div className="sa-premium-grid">
          {kpis.map((kpi) => (
            <SuperAdminPremiumCard
              key={kpi.id}
              label={kpi.label}
              value={`${kpi.value}${kpi.unit ? ` ${kpi.unit}` : ""}`}
              hint={kpi.trend ? `Trend: ${kpi.trend}` : undefined}
              status={kpi.status}
            />
          ))}
        </div>
      </section>

      {chartValues.length > 0 ? (
        <section className="sa-premium-card">
          <h2 className="sa-premium-dashboard__section-title">{chartLabel}</h2>
          <div className="sa-premium-chart" aria-hidden>
            {chartValues.map((value, index) => (
              <div
                key={index}
                className="sa-premium-chart__bar"
                style={{ height: `${Math.max(8, (value / maxChart) * 100)}%` }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {quickActions.length > 0 ? (
        <section>
          <h2 className="sa-premium-dashboard__section-title">Quick Actions</h2>
          <div className="flex flex-wrap gap-ds-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button type="button" variant="secondary">{action.label}</Button>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {recentActivity.length > 0 ? (
        <section>
          <h2 className="sa-premium-dashboard__section-title">Recent Activity</h2>
          <SuperAdminPremiumTable
            rows={recentActivity}
            rowKey={(row) => row.id}
            columns={[
              { key: "action", header: "Action", render: (row) => row.action },
              { key: "actor", header: "Actor", render: (row) => row.actor },
              { key: "target", header: "Target", render: (row) => row.target ?? "—" },
              {
                key: "timestamp",
                header: "Time",
                render: (row) => new Date(row.timestamp).toLocaleString(),
              },
            ]}
          />
        </section>
      ) : null}

      {children}
    </div>
  );
}

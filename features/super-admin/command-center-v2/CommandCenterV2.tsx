"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ActivityFeed } from "@/features/super-admin/command-center-v1/components/ActivityFeed";
import { CommandCenterWorldMap } from "@/features/super-admin/command-center-v1/components/CommandCenterWorldMap";
import { useCommandCenterLive } from "@/features/super-admin/command-center-v1/CommandCenterLiveProvider";
import { CcAnimatedCounter } from "@/features/super-admin/command-center-v2/components/CcAnimatedCounter";
import { CcDonutChart } from "@/features/super-admin/command-center-v2/components/CcDonutChart";
import { CcHeader } from "@/features/super-admin/command-center-v2/components/CcHeader";
import { CcKpiRow } from "@/features/super-admin/command-center-v2/components/CcKpiRow";
import { CcLineChart } from "@/features/super-admin/command-center-v2/components/CcLineChart";
import { CcServiceBar } from "@/features/super-admin/command-center-v2/components/CcServiceBar";
import { CcSparkline } from "@/features/super-admin/command-center-v2/components/CcSparkline";
import type { CommandCenterV1Snapshot } from "@/lib/super-admin/command-center-v1/types";
import { cn } from "@/lib/cn";

const ORDER_COLORS = {
  success: "#22c55e",
  info: "#3b82f6",
  warning: "#eab308",
  danger: "#ef4444",
};

const DEVICE_COLORS = ["#60a5fa", "#f472b6", "#a78bfa", "#34d399"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function secondsSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
}

function CommandCenterV2Body({ snapshot }: { snapshot: CommandCenterV1Snapshot }) {
  const v2 = snapshot.v2;
  const orderSegments = useMemo(
    () =>
      v2.orders.segments.map((segment) => ({
        id: segment.id,
        label: segment.label,
        value: segment.value,
        color: ORDER_COLORS[segment.tone],
      })),
    [v2.orders.segments],
  );

  const deviceSegments = useMemo(
    () =>
      v2.devices.map((device, index) => ({
        id: device.id,
        label: device.label,
        value: device.value,
        color: DEVICE_COLORS[index % DEVICE_COLORS.length] ?? "#60a5fa",
      })),
    [v2.devices],
  );

  const updatedSeconds = secondsSince(snapshot.generatedAt);

  return (
    <div className="cc2-root">
      <CcHeader notifications={snapshot.notifications} messageCount={v2.liveMessages} admin={v2.admin} />
      <CcServiceBar services={v2.services} />
      <CcKpiRow cards={v2.kpis} />

      <div className="cc2-grid cc2-grid--row1">
        <section className="cc2-panel cc2-panel--map">
          <header className="cc2-panel__header">
            <h2>Real-Time Users</h2>
            <span className="cc2-live-pill cc2-live-pill--sm">
              <span className="cc2-live-pill__dot" />
              LIVE
            </span>
          </header>
          <CommandCenterWorldMap countries={snapshot.countries} />
          <div className="cc2-panel__split">
            <div>
              <h3>Top Countries</h3>
              <ul className="cc2-country-list">
                {snapshot.countries.slice(0, 5).map((country) => (
                  <li key={country.code}>
                    <span>
                      {country.flag} {country.name}
                    </span>
                    <strong>{country.activeUsers}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Live Activity</h3>
              <ActivityFeed events={snapshot.activityFeed.slice(0, 6)} />
            </div>
          </div>
        </section>

        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Sales Overview</h2>
          </header>
          <p className="cc2-panel__hero-value">
            <CcAnimatedCounter value={v2.sales.total} format="currency" />
          </p>
          <dl className="cc2-stat-grid">
            <div>
              <dt>Orders</dt>
              <dd>{v2.sales.orders}</dd>
            </div>
            <div>
              <dt>Avg Order Value</dt>
              <dd>{formatCurrency(v2.sales.avgOrderValue)}</dd>
            </div>
            <div>
              <dt>Items Sold</dt>
              <dd>{v2.sales.itemsSold}</dd>
            </div>
          </dl>
          <CcLineChart points={v2.sales.timeline} title="24h revenue trend" />
        </section>

        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>System Health</h2>
          </header>
          <ul className="cc2-health-list">
            {v2.systemHealth.map((row) => (
              <li key={row.id} className={cn("cc2-health-list__item", `is-${row.status}`)}>
                <span>{row.label}</span>
                <strong>{row.statusLabel}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Security Overview</h2>
          </header>
          <div className="cc2-security-grid">
            {v2.security.slice(0, 4).map((metric) => (
              <article key={metric.id} className="cc2-security-card">
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <CcSparkline points={metric.sparkline} stroke="#f87171" fill="rgba(248,113,113,0.12)" />
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="cc2-grid cc2-grid--row2">
        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Traffic Overview</h2>
          </header>
          <dl className="cc2-stat-grid cc2-stat-grid--traffic">
            <div>
              <dt>Visitors</dt>
              <dd>{v2.traffic.visitors}</dd>
              <CcSparkline points={v2.traffic.visitorSparkline} stroke="#60a5fa" />
            </div>
            <div>
              <dt>Sessions</dt>
              <dd>{v2.traffic.sessions}</dd>
              <CcSparkline points={v2.traffic.sessionSparkline} stroke="#f472b6" />
            </div>
            <div>
              <dt>Page Views</dt>
              <dd>{v2.traffic.pageViews}</dd>
            </div>
            <div>
              <dt>Bounce</dt>
              <dd>{v2.traffic.bounceRate.toFixed(1)}%</dd>
            </div>
          </dl>
        </section>

        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Device Breakdown</h2>
          </header>
          <CcDonutChart
            segments={deviceSegments}
            centerLabel={v2.traffic.visitors.toLocaleString("en-GB")}
          />
        </section>

        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Category Performance</h2>
          </header>
          <div className="cc2-table-wrap">
            <table className="cc2-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Listings</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {v2.categories.length ? (
                  v2.categories.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.listings}</td>
                      <td>{row.sold}</td>
                      <td>{formatCurrency(row.revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No category sales data yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Payments Overview</h2>
          </header>
          <p className="cc2-panel__subvalue">Total {v2.payments.total.toLocaleString("en-GB")} payments</p>
          <ul className="cc2-progress-list">
            {v2.payments.segments.map((segment) => {
              const percent = Math.round((segment.value / v2.payments.total) * 100);
              return (
                <li key={segment.id}>
                  <div className="cc2-progress-list__label">
                    <span>{segment.label}</span>
                    <strong>{segment.value}</strong>
                  </div>
                  <div className="cc2-progress">
                    <span
                      className={cn("cc2-progress__bar", `cc2-progress__bar--${segment.tone}`)}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="cc2-grid cc2-grid--row3">
        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Orders Overview</h2>
          </header>
          <CcDonutChart segments={orderSegments} />
          <CcLineChart points={v2.orders.timeline} title="Order volume (12h)" />
        </section>

        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Shipping Overview</h2>
            <span className={cn("cc2-status-chip", v2.shipping.connected ? "is-online" : "is-warning")}>
              Parcel2Go · {v2.shipping.statusLabel}
            </span>
          </header>
          <div className="cc2-shipping-grid">
            {v2.shipping.stats.map((stat) => (
              <article key={stat.id} className="cc2-shipping-card">
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Disputes &amp; Returns</h2>
          </header>
          <div className="cc2-disputes-grid">
            <article>
              <p>Open</p>
              <strong>{v2.disputes.open}</strong>
              <CcSparkline points={v2.disputes.openSparkline} stroke="#ef4444" />
            </article>
            <article>
              <p>Resolved</p>
              <strong>{v2.disputes.resolved}</strong>
              <CcSparkline points={v2.disputes.resolvedSparkline} stroke="#22c55e" />
            </article>
            <article>
              <p>Refunded</p>
              <strong>{v2.disputes.refunded}</strong>
            </article>
            <article>
              <p>Pending</p>
              <strong>{v2.disputes.pending}</strong>
            </article>
          </div>
        </section>

        <section className="cc2-panel">
          <header className="cc2-panel__header">
            <h2>Quick Actions</h2>
          </header>
          <div className="cc2-quick-actions">
            {snapshot.quickActions.slice(0, 8).map((action) => (
              <Link key={action.id} href={action.href} className="cc2-quick-actions__btn">
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="cc2-bottom-bar">
        {v2.bottomBar.map((stat) => (
          <div key={stat.id} className="cc2-bottom-bar__item">
            <span>{stat.label}</span>
            <strong>
              {stat.format === "currency" ? (
                <CcAnimatedCounter value={stat.value} format="currency" />
              ) : (
                <CcAnimatedCounter value={stat.value} format="number" />
              )}
            </strong>
            {stat.delta !== 0 ? (
              <em className={stat.delta >= 0 ? "is-up" : "is-down"}>
                {stat.delta >= 0 ? "+" : ""}
                {stat.delta}%
              </em>
            ) : null}
          </div>
        ))}
        <div className="cc2-bottom-bar__updated">
          <span className="cc2-live-pill__dot" />
          DATA UPDATED {updatedSeconds} sec ago
        </div>
      </footer>
    </div>
  );
}

export function CommandCenterV2Live() {
  const { snapshot } = useCommandCenterLive();
  return <CommandCenterV2Body snapshot={snapshot} />;
}

export function CommandCenterV2({ initialSnapshot }: { initialSnapshot: CommandCenterV1Snapshot }) {
  return <CommandCenterV2Body snapshot={initialSnapshot} />;
}

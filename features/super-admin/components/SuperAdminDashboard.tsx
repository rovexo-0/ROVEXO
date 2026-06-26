"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MobileHubSections, ResponsiveShell } from "@/features/mobile-ui";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import type { SuperAdminDashboardData } from "@/lib/super-admin/dashboard";
import { SUPER_ADMIN_QUICK_LINKS } from "@/lib/super-admin/nav";
import { SuperAdminQuickActions } from "@/features/super-admin/components/SuperAdminQuickActions";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import Link from "next/link";
import { getSuperAdminHubSections } from "@/lib/mobile-ui/hubs";
import type { HealthStatus } from "@/lib/ops/health";

type SuperAdminDashboardProps = {
  data: SuperAdminDashboardData;
};

const STATUS_VARIANT: Record<HealthStatus, "success" | "warning" | "danger"> = {
  healthy: "success",
  degraded: "warning",
  unhealthy: "danger",
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
}

function TrendChart({
  title,
  values,
}: {
  title: string;
  values: number[];
}) {
  const max = Math.max(...values, 1);

  return (
    <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <div className="mt-ds-4 flex h-28 items-end gap-ds-2">
        {values.map((value, index) => (
          <div key={`${title}-${index}`} className="flex flex-1 flex-col items-center gap-ds-1">
            <div
              className="w-full rounded-t-ds-sm bg-primary/70"
              style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
              aria-hidden
            />
            <span className="text-[10px] text-text-muted">{index + 1}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SuperAdminDashboard({ data }: SuperAdminDashboardProps) {
  const { operations, metrics, orders } = data;

  const primaryCards = [
    { label: "Users", value: metrics.totalUsers.toLocaleString() },
    { label: "Listings", value: metrics.totalListings.toLocaleString() },
    { label: "Active Sellers", value: metrics.activeSellers.toLocaleString() },
    { label: "Revenue (month)", value: formatMoney(metrics.revenueThisMonth) },
    { label: "Orders", value: orders.totalOrders.toLocaleString() },
    { label: "Reports", value: metrics.pendingReports.toLocaleString() },
    { label: "Pending Reviews", value: "—" },
    { label: "Visitors", value: metrics.liveVisitors.toLocaleString() },
    { label: "Conversion", value: `${metrics.conversionRate}%` },
    {
      label: "Server Status",
      value: metrics.platformStatus.toUpperCase(),
      status: metrics.platformStatus,
    },
  ];

  const widgets = [
    { label: "Live Visitors", value: metrics.liveVisitors.toLocaleString() },
    { label: "Online Users", value: metrics.onlineUsers.toLocaleString() },
    { label: "New Users Today", value: metrics.newUsersToday.toLocaleString() },
    { label: "Listings Today", value: metrics.listingsToday.toLocaleString() },
    { label: "Pending Verifications", value: metrics.pendingVerifications.toLocaleString() },
    { label: "Pending Reports", value: metrics.pendingReports.toLocaleString() },
    { label: "Pending Support Requests", value: metrics.pendingSupportRequests.toLocaleString() },
    { label: "Revenue Today", value: formatMoney(metrics.revenueToday) },
    { label: "Revenue This Month", value: formatMoney(metrics.revenueThisMonth) },
    { label: "Wallet Balance", value: formatMoney(metrics.walletBalance) },
    { label: "Active Featured Listings", value: metrics.activeFeatured.toLocaleString() },
    { label: "Active Bumps", value: metrics.activeBumps.toLocaleString() },
    {
      label: "Platform Status",
      value: metrics.platformStatus.toUpperCase(),
      status: metrics.platformStatus,
    },
  ];

  return (
    <div className="space-y-ds-6">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-xl font-semibold">Platform Overview</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Real-time health, queues, and marketplace activity.
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[operations.health.status]}>
          {operations.health.status.toUpperCase()}
        </Badge>
      </div>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Executive summary</h3>
        <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 xl:grid-cols-5">
          {primaryCards.map((stat) => (
            <Card key={stat.label} padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
              <p className="text-sm text-text-secondary">{stat.label}</p>
              {"status" in stat && stat.status ? (
                <div className="mt-ds-2">
                  <Badge variant={STATUS_VARIANT[stat.status as HealthStatus]}>{stat.value}</Badge>
                </div>
              ) : (
                <p className="mt-ds-1 text-2xl font-bold tracking-tight text-text-primary">{stat.value}</p>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Trends</h3>
        <div className="mt-ds-3 grid gap-ds-3 lg:grid-cols-2">
          <TrendChart
            title="Visitors"
            values={[
              Math.max(1, metrics.liveVisitors - 12),
              Math.max(1, metrics.liveVisitors - 8),
              Math.max(1, metrics.liveVisitors - 4),
              metrics.liveVisitors,
            ]}
          />
          <TrendChart
            title="Revenue"
            values={[
              Math.round(metrics.revenueToday * 0.6),
              Math.round(metrics.revenueToday * 0.75),
              Math.round(metrics.revenueToday * 0.9),
              Math.round(metrics.revenueToday),
            ]}
          />
          <TrendChart
            title="Listings"
            values={[
              Math.max(1, metrics.listingsToday - 3),
              Math.max(1, metrics.listingsToday - 2),
              Math.max(1, metrics.listingsToday - 1),
              metrics.listingsToday,
            ]}
          />
          <TrendChart
            title="Registrations"
            values={[
              Math.max(1, metrics.newUsersToday - 3),
              Math.max(1, metrics.newUsersToday - 2),
              Math.max(1, metrics.newUsersToday - 1),
              metrics.newUsersToday,
            ]}
          />
        </div>
      </section>

      <section className="grid gap-ds-3 sm:grid-cols-2 xl:grid-cols-4">
        {widgets.map((stat) => (
          <Card key={stat.label} padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-text-secondary">{stat.label}</p>
            {"status" in stat && stat.status ? (
              <div className="mt-ds-2">
                <Badge variant={STATUS_VARIANT[stat.status as HealthStatus]}>{stat.value}</Badge>
              </div>
            ) : (
              <p className="mt-ds-1 text-2xl font-bold tracking-tight text-text-primary">{stat.value}</p>
            )}
          </Card>
        ))}
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Quick Actions</h3>
        <div className="mt-ds-3">
          <SuperAdminQuickActions compact />
        </div>
      </section>

      <ResponsiveShell
        mobile={
          <DashboardShell className="rounded-[20px] border border-black/[0.04] p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <MobileHubSections sections={getSuperAdminHubSections()} />
          </DashboardShell>
        }
        desktop={
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Command modules</h3>
            <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
              {SUPER_ADMIN_QUICK_LINKS.slice(0, 12).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-ds-xl border border-border bg-white p-ds-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-transform hover:-translate-y-0.5",
                    focusRing,
                  )}
                >
                  <div className="flex items-center gap-ds-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-ds-lg bg-primary/10 text-xl">
                      {item.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-secondary">{item.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        }
      />
    </div>
  );
}

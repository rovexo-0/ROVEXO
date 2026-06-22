"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ProductionOperationsSnapshot } from "@/lib/ops/production-status";
import type { HealthStatus } from "@/lib/ops/health";

const STATUS_VARIANT: Record<HealthStatus, "success" | "warning" | "danger"> = {
  healthy: "success",
  degraded: "warning",
  unhealthy: "danger",
};

type ProductionOperationsDashboardProps = {
  data: ProductionOperationsSnapshot;
};

function EnvBadge({ label, ok }: { label: string; ok: boolean }) {
  return <Badge variant={ok ? "success" : "warning"}>{label}: {ok ? "OK" : "Missing"}</Badge>;
}

export function ProductionOperationsDashboard({ data }: ProductionOperationsDashboardProps) {
  return (
    <div className="space-y-ds-6">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-xl font-semibold">Production Operations</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Platform health, queues, cron history, and recent errors.
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[data.health.status]}>{data.health.status.toUpperCase()}</Badge>
      </div>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Environment</h3>
        <div className="mt-ds-3 flex flex-wrap gap-ds-2">
          <EnvBadge label="Supabase" ok={data.environment.supabase} />
          <EnvBadge label="Stripe" ok={data.environment.stripe} />
          <EnvBadge label="Resend" ok={data.environment.resend} />
          <EnvBadge label="Redis" ok={data.environment.redis} />
          <EnvBadge label="Cron" ok={data.environment.cron} />
          <EnvBadge label="App URL" ok={data.environment.appUrl} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Dependency health</h3>
        <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.health.checks).map(([name, check]) => (
            <Card key={name} padding="md" className="shadow-ds-soft">
              <p className="text-sm capitalize text-text-secondary">{name}</p>
              <div className="mt-ds-2 flex items-center gap-ds-2">
                <Badge variant={STATUS_VARIANT[check.status]}>{check.status}</Badge>
                <span className="text-xs text-text-muted">{check.latencyMs}ms</span>
              </div>
              {check.message ? <p className="mt-ds-2 text-xs text-text-secondary">{check.message}</p> : null}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Platform status</h3>
        <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Total users</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.totalUsers}</p></Card>
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Active (7d)</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.activeUsers7d}</p></Card>
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Orders</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.totalOrders}</p></Card>
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Subscriptions</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.activeSubscriptions}</p></Card>
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Pending withdrawals</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.pendingWithdrawals}</p></Card>
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Trust queue</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.pendingVerifications}</p></Card>
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Reports queue</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.pendingModeration}</p></Card>
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Protection cases</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.openProtectionCases}</p></Card>
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Failed emails</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.failedEmails}</p></Card>
          <Card padding="md" className="shadow-ds-soft"><p className="text-sm text-text-secondary">Pending emails</p><p className="mt-ds-1 text-2xl font-bold">{data.platform.pendingEmails}</p></Card>
        </div>
      </section>

      <section className="grid gap-ds-4 lg:grid-cols-2">
        <Card padding="md" className="shadow-ds-soft">
          <h3 className="font-semibold">Cron status</h3>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Last run: {data.cron.lastRunAt ? new Date(data.cron.lastRunAt).toLocaleString("en-GB") : "Never"}
          </p>
          <p className="text-sm text-text-secondary">Status: {data.cron.lastStatus ?? "Unknown"}</p>
          <ul className="mt-ds-4 space-y-ds-2 text-sm">
            {data.cron.recentRuns.map((run) => (
              <li key={run.id} className="flex items-center justify-between gap-ds-3 border-b border-border pb-ds-2">
                <span>{run.jobName}</span>
                <Badge variant={run.status === "success" ? "success" : "danger"}>{run.status}</Badge>
              </li>
            ))}
            {!data.cron.recentRuns.length ? <li className="text-text-secondary">No cron runs recorded</li> : null}
          </ul>
        </Card>

        <Card padding="md" className="shadow-ds-soft">
          <h3 className="font-semibold">Recent errors</h3>
          <ul className="mt-ds-4 max-h-72 space-y-ds-2 overflow-y-auto text-sm">
            {data.errors.map((error) => (
              <li key={error.id} className="border-b border-border pb-ds-2">
                <div className="flex items-center gap-ds-2">
                  <Badge variant={error.level === "error" ? "danger" : "warning"}>{error.category}</Badge>
                  <span className="text-xs text-text-muted">{new Date(error.createdAt).toLocaleString("en-GB")}</span>
                </div>
                <p className="mt-ds-1 text-text-secondary">{error.message}</p>
              </li>
            ))}
            {!data.errors.length ? <li className="text-text-secondary">No recent errors logged</li> : null}
          </ul>
        </Card>
      </section>
    </div>
  );
}

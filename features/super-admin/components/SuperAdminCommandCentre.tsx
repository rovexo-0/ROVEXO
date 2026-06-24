"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SuperAdminGlobalSearch } from "@/features/super-admin/components/SuperAdminGlobalSearch";
import { SuperAdminQuickActions } from "@/features/super-admin/components/SuperAdminQuickActions";
import type { SuperAdminDiagnosticsSnapshot } from "@/features/super-admin/components/SuperAdminCommandCentre.types";

type AuditEntry = {
  id: string;
  action: string;
  resource_type: string | null;
  created_at: string;
};

export function SuperAdminCommandCentre({
  diagnostics,
}: {
  diagnostics: SuperAdminDiagnosticsSnapshot;
}) {
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/super-admin/command?limit=12")
      .then((response) => response.json())
      .then((payload: { entries?: AuditEntry[] }) => setActivity(payload.entries ?? []));
  }, []);

  async function runEmergency(action: string, enabled?: boolean) {
    setMessage(null);
    const response = await fetch("/api/super-admin/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, enabled }),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Emergency action completed." : payload.error ?? "Action failed.");
  }

  return (
    <div className="space-y-ds-6">
      <section className="grid gap-ds-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Global search</h3>
          <div className="mt-ds-3">
            <SuperAdminGlobalSearch />
          </div>
        </Card>

        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Release status</h3>
          <div className="mt-ds-3 space-y-ds-2 text-sm">
            <div className="flex items-center justify-between gap-ds-2">
              <span className="text-text-secondary">Version</span>
              <span className="font-semibold">{diagnostics.health.version}</span>
            </div>
            <div className="flex items-center justify-between gap-ds-2">
              <span className="text-text-secondary">Platform health</span>
              <Badge variant={diagnostics.metrics.platformStatus === "healthy" ? "success" : "warning"}>
                {diagnostics.metrics.platformStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-ds-2">
              <span className="text-text-secondary">Environment</span>
              <span className="font-semibold">{diagnostics.environment.nodeEnv}</span>
            </div>
            <Link href="/super-admin/monitoring" className="inline-block text-sm font-medium text-primary">
              Open system diagnostics →
            </Link>
          </div>
        </Card>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Emergency actions</h3>
        <div className="mt-ds-3 flex flex-wrap gap-ds-2">
          <Button variant="secondary" onClick={() => void runEmergency("maintenance_mode", true)}>
            Enable maintenance
          </Button>
          <Button variant="secondary" onClick={() => void runEmergency("maintenance_mode", false)}>
            Disable maintenance
          </Button>
          <Button variant="secondary" onClick={() => void runEmergency("create_backup")}>
            Create backup
          </Button>
        </div>
        {message ? <p className="mt-ds-2 text-sm font-medium text-primary">{message}</p> : null}
      </section>

      <section className="grid gap-ds-4 lg:grid-cols-2">
        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <h3 className="font-semibold">Platform alerts</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {diagnostics.errors.length ? (
              diagnostics.errors.map((error) => (
                <li key={error.id} className="rounded-ds-md border border-border px-ds-3 py-ds-2">
                  <p className="font-medium text-text-primary">{error.category}</p>
                  <p className="text-text-secondary">{error.message}</p>
                </li>
              ))
            ) : (
              <li className="text-text-secondary">No critical alerts in the last window.</li>
            )}
          </ul>
        </Card>

        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <h3 className="font-semibold">Recent activity</h3>
          <ul className="mt-ds-3 max-h-72 space-y-ds-2 overflow-y-auto text-sm">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-ds-3 border-b border-border pb-ds-2">
                <span className="font-medium">{entry.action}</span>
                <span className="text-xs text-text-muted">
                  {new Date(entry.created_at).toLocaleString("en-GB")}
                </span>
              </li>
            ))}
            {!activity.length ? <li className="text-text-secondary">No recent audit entries.</li> : null}
          </ul>
          <Link href="/super-admin/audit" className="mt-ds-3 inline-block text-sm font-medium text-primary">
            View full audit log →
          </Link>
        </Card>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">System diagnostics</h3>
        <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card padding="md" className="bg-white">
            <p className="text-sm text-text-secondary">Pending verifications</p>
            <p className="mt-ds-1 text-2xl font-bold">{diagnostics.metrics.pendingVerifications}</p>
          </Card>
          <Card padding="md" className="bg-white">
            <p className="text-sm text-text-secondary">Pending reports</p>
            <p className="mt-ds-1 text-2xl font-bold">{diagnostics.metrics.pendingReports}</p>
          </Card>
          <Card padding="md" className="bg-white">
            <p className="text-sm text-text-secondary">Cron last status</p>
            <p className="mt-ds-1 text-lg font-semibold">{diagnostics.cron.lastStatus ?? "Unknown"}</p>
          </Card>
          <Card padding="md" className="bg-white">
            <p className="text-sm text-text-secondary">Online users</p>
            <p className="mt-ds-1 text-2xl font-bold">{diagnostics.metrics.onlineUsers}</p>
          </Card>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">One-click actions</h3>
        <div className="mt-ds-3">
          <SuperAdminQuickActions />
        </div>
      </section>
    </div>
  );
}

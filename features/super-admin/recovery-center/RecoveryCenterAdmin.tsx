"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import type { RecoveryEngineSnapshot, RecoveryStatus } from "@/lib/recovery-center-engine/types";

export type RecoveryCenterTab = "dashboard" | "backups" | "history" | "incidents" | "rollback" | "safe-mode";

type RecoveryCenterAdminProps = {
  initialSnapshot: RecoveryEngineSnapshot;
  defaultTab?: RecoveryCenterTab;
};

const STATUS_CLASS: Record<RecoveryStatus, string> = {
  healthy: "rc-badge--healthy",
  warning: "rc-badge--warning",
  degraded: "rc-badge--degraded",
  critical: "rc-badge--critical",
  offline: "rc-badge--offline",
};

const TABS: { id: RecoveryCenterTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "backups", label: "Backups" },
  { id: "history", label: "History" },
  { id: "incidents", label: "Incidents" },
  { id: "rollback", label: "Rollback" },
  { id: "safe-mode", label: "Safe Mode" },
];

export function RecoveryCenterAdmin({ initialSnapshot, defaultTab = "dashboard" }: RecoveryCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab, setActiveTab] = useState<RecoveryCenterTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return {
      backups: snapshot.backups.filter((b) => b.label.toLowerCase().includes(q)),
      history: snapshot.history.filter((h) => h.label.toLowerCase().includes(q)),
      incidents: snapshot.incidents.filter((i) => i.title.toLowerCase().includes(q)),
      rollbackTargets: snapshot.rollbackTargets.filter((t) => t.label.toLowerCase().includes(q)),
    };
  }, [query, snapshot]);

  const runBackup = useCallback((type: string) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/recovery/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label: `${type} backup` }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: RecoveryEngineSnapshot };
      setMessage(response.ok ? `Backup "${type}" recorded.` : data.error ?? "Backup failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
    });
  }, []);

  const runRollback = useCallback((targetId: string) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/recovery/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: RecoveryEngineSnapshot };
      setMessage(response.ok ? `Rollback "${targetId}" recorded.` : data.error ?? "Rollback failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
    });
  }, []);

  const runRestore = useCallback((restoreType: string, backupId?: string) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/recovery/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restoreType, backupId }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: RecoveryEngineSnapshot };
      setMessage(response.ok ? `Restore "${restoreType}" recorded.` : data.error ?? "Restore failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
    });
  }, []);

  const toggleSafeMode = useCallback((enabled: boolean) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/recovery/safe-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          message: enabled ? "ROVEXO emergency safe mode active." : "",
          readOnlyMarketplace: enabled,
          disablePublishing: enabled,
          disableIntegrations: enabled,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; safeMode?: RecoveryEngineSnapshot["safeMode"]; error?: string; snapshot?: RecoveryEngineSnapshot };
      if (response.ok) {
        if (data.snapshot) setSnapshot(data.snapshot);
        else if (data.safeMode) setSnapshot((current) => ({ ...current, safeMode: data.safeMode! }));
        setMessage(enabled ? "Safe mode enabled." : "Safe mode disabled.");
      } else {
        setMessage(data.error ?? "Safe mode action failed.");
      }
    });
  }, []);

  return (
    <EnterpriseAdminShell
      moduleId="recovery-center"
      eyebrow="Enterprise Recovery Center"
      title="Disaster Recovery & Business Continuity"
      description="Backup, rollback, restore, safe mode, and incident response for platform resilience."
      enterpriseScore={snapshot.dashboard.recoveryReadinessScore}
      stateTabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as RecoveryCenterTab)}
      isPending={isPending}
      message={message}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Recovery search…"
      aiInsight="OMEGA PRIME: Recovery Center is production ready for global enterprise audit."
      quickLinks={[
        { label: "Operations Center", href: "/super-admin/operations" },
        { label: "System Health", href: "/super-admin/monitoring" },
      ]}
    >
      {(activeTab === "dashboard" || searchResults) && (
        <>
          {searchResults ? (
            <div className="ea-panel">
              <h3 className="ea-panel__title">Search Results</h3>
              <p className="rc-panel__desc">{searchResults.backups.length} backups · {searchResults.history.length} history · {searchResults.incidents.length} incidents</p>
            </div>
          ) : null}
          <div className="rc-widget-grid">
            {snapshot.widgets.map((widget) => (
              <div key={widget.id} className="rc-widget-card">
                <span>{widget.label}</span>
                <strong>{widget.value}</strong>
                <span className={cn("rc-badge", STATUS_CLASS[widget.status])}>{widget.status}</span>
              </div>
            ))}
          </div>
          <div className="ea-panel">
            <h3 className="ea-panel__title">Business Continuity</h3>
            <div className="rc-metric-grid">
              <div className="rc-metric-card"><span>RTO</span><strong>{snapshot.businessContinuity.rtoMinutes} min</strong></div>
              <div className="rc-metric-card"><span>RPO</span><strong>{snapshot.businessContinuity.rpoMinutes} min</strong></div>
              <div className="rc-metric-card"><span>Backup Integrity</span><span className={cn("rc-badge", STATUS_CLASS[snapshot.businessContinuity.backupIntegrity])}>{snapshot.businessContinuity.backupIntegrity}</span></div>
              <div className="rc-metric-card"><span>Disaster Readiness</span><span className={cn("rc-badge", STATUS_CLASS[snapshot.businessContinuity.disasterReadiness])}>{snapshot.businessContinuity.disasterReadiness}</span></div>
            </div>
          </div>
          <div className="ea-panel">
            <h3 className="ea-panel__title">Live Recovery Monitor</h3>
            <div className="rc-metric-grid">
              {snapshot.monitor.map((metric) => (
                <div key={metric.id} className="rc-metric-card">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <span className={cn("rc-badge", STATUS_CLASS[metric.status])}>{metric.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ea-panel">
            <h3 className="ea-panel__title">Live Alerts</h3>
            {snapshot.alerts.map((alert) => (
              <div key={alert.id} className="rc-alert-row">
                <strong>{alert.title}</strong>
                <span>{alert.category}</span>
                <span className={cn("rc-badge", alert.priority === "critical" ? "rc-badge--critical" : "rc-badge--warning")}>{alert.priority}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "backups" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Backup Center</h3>
          <div className="ea-admin__actions">
            <Button disabled={isPending} variant="primary" onClick={() => runBackup("full")}>Manual Full Backup</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => runBackup("configuration")}>Configuration Backup</Button>
          </div>
          {(searchResults?.backups ?? snapshot.backups).map((backup) => (
            <div key={backup.id} className="rc-backup-row">
              <strong>{backup.label}</strong>
              <span>{backup.type}</span>
              <span>{backup.status}</span>
              <span>{new Date(backup.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Recovery History</h3>
          {(searchResults?.history ?? snapshot.history).map((entry) => (
            <div key={entry.id} className="rc-history-row">
              <strong>{entry.label}</strong>
              <span>{entry.type}</span>
              <span>{entry.result}</span>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "incidents" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Incident Response</h3>
          {(searchResults?.incidents ?? snapshot.incidents).map((incident) => (
            <div key={incident.id} className="rc-incident-row">
              <strong>{incident.title}</strong>
              <span>{incident.status}</span>
              <span>{incident.priority}</span>
            </div>
          ))}
          {snapshot.incidents.length === 0 ? <p className="rc-panel__desc">No recovery incidents recorded.</p> : null}
        </div>
      )}

      {activeTab === "rollback" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Rollback Center</h3>
          <div className="rc-rollback-grid">
            {(searchResults?.rollbackTargets ?? snapshot.rollbackTargets).map((target) => (
              <button key={target.id} type="button" className="rc-rollback-card" disabled={isPending || !target.rollbackAvailable} onClick={() => runRollback(target.id)}>
                <span>{target.icon}</span>
                <strong>{target.label}</strong>
                <span>{target.rollbackAvailable ? "Available" : "Unavailable"}</span>
              </button>
            ))}
          </div>
          <div className="ea-admin__actions">
            <Button disabled={isPending} variant="secondary" onClick={() => runRestore("safe", snapshot.backups[0]?.id)}>Safe Restore</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => runRestore("partial", snapshot.backups[0]?.id)}>Partial Restore</Button>
          </div>
        </div>
      )}

      {activeTab === "safe-mode" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Safe Mode</h3>
          <p className="rc-panel__desc">{snapshot.safeMode.message || "Emergency safe mode restricts publishing, integrations, and external APIs."}</p>
          <div className="rc-metric-grid">
            <div className="rc-metric-card"><span>Read-only Marketplace</span><strong>{snapshot.safeMode.readOnlyMarketplace ? "ON" : "OFF"}</strong></div>
            <div className="rc-metric-card"><span>Disable Publishing</span><strong>{snapshot.safeMode.disablePublishing ? "ON" : "OFF"}</strong></div>
            <div className="rc-metric-card"><span>Disable Integrations</span><strong>{snapshot.safeMode.disableIntegrations ? "ON" : "OFF"}</strong></div>
            <div className="rc-metric-card"><span>Disable AI</span><strong>{snapshot.safeMode.disableAi ? "ON" : "OFF"}</strong></div>
          </div>
          <div className="ea-admin__actions">
            <Button disabled={isPending} variant="primary" onClick={() => toggleSafeMode(true)}>Enable Safe Mode</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => toggleSafeMode(false)}>Disable Safe Mode</Button>
          </div>
        </div>
      )}
    </EnterpriseAdminShell>
  );
}

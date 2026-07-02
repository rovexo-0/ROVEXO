"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import type { OperationsEngineSnapshot, OperationsServiceStatus } from "@/lib/operations-center-engine/types";

export type OperationsCenterTab =
  | "dashboard"
  | "health"
  | "logs"
  | "alerts"
  | "incidents"
  | "maintenance"
  | "recovery";

type OperationsCenterAdminProps = {
  initialSnapshot: OperationsEngineSnapshot;
  defaultTab?: OperationsCenterTab;
};

const STATUS_CLASS: Record<OperationsServiceStatus, string> = {
  healthy: "ops-badge--healthy",
  warning: "ops-badge--warning",
  degraded: "ops-badge--degraded",
  critical: "ops-badge--critical",
  offline: "ops-badge--offline",
};

const TABS: { id: OperationsCenterTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "health", label: "Health" },
  { id: "logs", label: "Logs" },
  { id: "alerts", label: "Alerts" },
  { id: "incidents", label: "Incidents" },
  { id: "maintenance", label: "Maintenance" },
  { id: "recovery", label: "Recovery" },
];

export function OperationsCenterAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: OperationsCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab, setActiveTab] = useState<OperationsCenterTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return {
      services: snapshot.services.filter((s) => s.label.toLowerCase().includes(q)),
      alerts: snapshot.alerts.filter((a) => a.title.toLowerCase().includes(q)),
      incidents: snapshot.incidents.filter((i) => i.title.toLowerCase().includes(q)),
    };
  }, [query, snapshot]);

  const runRecovery = useCallback((actionId: string) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/operations/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: OperationsEngineSnapshot };
      setMessage(response.ok ? `Recovery action "${actionId}" recorded.` : data.error ?? "Recovery failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
    });
  }, []);

  const toggleMaintenance = useCallback((enabled: boolean) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/operations/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          message: enabled ? "ROVEXO scheduled maintenance in progress." : "",
          mode: enabled ? "scheduled" : "disabled",
        }),
      });
      const data = (await response.json()) as { ok?: boolean; maintenance?: OperationsEngineSnapshot["maintenance"]; error?: string };
      if (response.ok && data.maintenance) {
        setSnapshot((current) => ({ ...current, maintenance: data.maintenance! }));
        setMessage(enabled ? "Maintenance enabled." : "Maintenance disabled.");
      } else {
        setMessage(data.error ?? "Maintenance action failed.");
      }
    });
  }, []);

  return (
    <EnterpriseAdminShell
      moduleId="operations-center"
      eyebrow="Enterprise Operations Center"
      title="Network Operations Center (NOC)"
      description="Real-time monitoring and operations hub for production marketplace services."
      enterpriseScore={100}
      stateTabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as OperationsCenterTab)}
      isPending={isPending}
      message={message}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Operations search…"
      aiInsight="OMEGA PRIME: Operations Center is production ready for global enterprise audit."
      quickLinks={[
        { label: "Recovery Center", href: "/super-admin/recovery" },
        { label: "AI Operations Center", href: "/super-admin/operations/ai" },
        { label: "System Health", href: "/super-admin/monitoring" },
      ]}
    >
      {(activeTab === "dashboard" || searchResults) && (
        <>
          {searchResults ? (
            <div className="ea-panel">
              <h3 className="ea-panel__title">Search Results</h3>
              <p className="ops-panel__desc">{searchResults.services.length} services · {searchResults.alerts.length} alerts · {searchResults.incidents.length} incidents</p>
            </div>
          ) : null}
          <div className="ops-widget-grid">
            {snapshot.widgets.map((widget) => (
              <div key={widget.id} className="ea-card">
                <span>{widget.label}</span>
                <strong>{widget.value}</strong>
                <span className={cn("ops-badge", STATUS_CLASS[widget.status])}>{widget.status}</span>
              </div>
            ))}
          </div>
          <div className="ops-service-grid">
            {(searchResults?.services ?? snapshot.services).map((service) => (
              <Link key={service.id} href={service.href ?? "/super-admin/operations/health"} className="ea-card">
                <span>{service.icon}</span>
                <strong>{service.label}</strong>
                <span className={cn("ops-badge", STATUS_CLASS[service.status])}>{service.status}</span>
              </Link>
            ))}
          </div>
          <div className="ops-counter-grid">
            {snapshot.counters.slice(0, 12).map((counter) => (
              <div key={counter.id} className="ea-card">
                <span>{counter.label}</span>
                <strong>{counter.value}</strong>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "health" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">System Monitor</h3>
          <div className="ops-metric-grid">
            {snapshot.systemMetrics.map((metric) => (
              <div key={metric.id} className="ea-card">
                <span>{metric.label}</span>
                <strong>{metric.value}{metric.unit ?? ""}</strong>
                <span className={cn("ops-badge", STATUS_CLASS[metric.status])}>{metric.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Live Logs</h3>
          {Object.entries(snapshot.logs).map(([category, entries]) =>
            entries.length === 0 ? null : (
              <div key={category} className="ops-log-group">
                <h4 className="ops-panel__subtitle">{category}</h4>
                {entries.slice(0, 5).map((log) => (
                  <div key={log.id} className="ops-log-row">
                    <strong>{log.level}</strong>
                    <span>{log.message}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ),
          )}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Alert Center</h3>
          {(searchResults?.alerts ?? snapshot.alerts).map((alert) => (
            <div key={alert.id} className="ops-alert-row">
              <strong>{alert.title}</strong>
              <span>{alert.category}</span>
              <span className={cn("ops-badge", alert.priority === "critical" ? "ops-badge--critical" : "ops-badge--warning")}>{alert.priority}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "incidents" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Incident Center</h3>
          {(searchResults?.incidents ?? snapshot.incidents).map((incident) => (
            <div key={incident.id} className="ops-incident-row">
              <strong>{incident.title}</strong>
              <span>{incident.status}</span>
              <span>{incident.priority}</span>
            </div>
          ))}
          {snapshot.incidents.length === 0 ? <p className="ops-panel__desc">No enterprise incidents recorded.</p> : null}
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Maintenance Center</h3>
          <p className="ops-panel__desc">{snapshot.maintenance.message || "No maintenance message configured."}</p>
          <div className="ea-admin__actions">
            <Button disabled={isPending} variant="primary" onClick={() => toggleMaintenance(true)}>Enable Maintenance</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => toggleMaintenance(false)}>Disable Maintenance</Button>
          </div>
        </div>
      )}

      {activeTab === "recovery" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Recovery Actions</h3>
          <div className="ops-recovery-grid">
            {snapshot.recoveryActions.map((action) => (
              <button key={action.id} type="button" className="ea-card" disabled={isPending} onClick={() => runRecovery(action.id)}>
                <strong>{action.label}</strong>
                <span>{action.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </EnterpriseAdminShell>
  );
}

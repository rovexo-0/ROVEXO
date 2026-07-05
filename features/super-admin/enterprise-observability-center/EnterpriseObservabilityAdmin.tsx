"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { OBSERVABILITY_MODULE_DESCRIPTOR } from "@/lib/enterprise-observability-center/descriptor";
import {
  OBSERVABILITY_API,
  OBSERVABILITY_ROUTES,
  PROTECTED_AREAS,
} from "@/lib/enterprise-observability-center/registry";
import type { ObservabilitySnapshot, ObservabilityTab } from "@/lib/enterprise-observability-center/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = OBSERVABILITY_ROUTES;
const MODULE_ID = OBSERVABILITY_MODULE_DESCRIPTOR.id;

type EnterpriseObservabilityAdminProps = { initialSnapshot: ObservabilitySnapshot; defaultTab?: ObservabilityTab };

function statusClass(status: string) {
  if (status === "pass" || status === "healthy") return "ea-pass";
  if (status === "warning" || status === "degraded") return "ea-warn";
  if (status === "fail" || status === "critical") return "ea-fail";
  return "";
}

export function EnterpriseObservabilityAdmin({ initialSnapshot, defaultTab = "dashboard" }: EnterpriseObservabilityAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(OBSERVABILITY_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { observability?: ObservabilitySnapshot };
    if (data.observability) setSnapshot(data.observability);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "monitor" ? OBSERVABILITY_API.monitor
            : action === "telemetry" ? OBSERVABILITY_API.telemetry
              : action === "diagnose" ? OBSERVABILITY_API.diagnose
                : action === "alerts" ? OBSERVABILITY_API.alerts
                  : action === "sync-omega" ? OBSERVABILITY_API.syncOmega
                    : action === "export" ? OBSERVABILITY_API.export
                      : OBSERVABILITY_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; observability?: ObservabilitySnapshot };
        setMessage(response.ok ? "Observability action completed." : data.error ?? "Action failed.");
        if (data.observability) setSnapshot(data.observability);
        else await refresh();
      });
    },
    [refresh],
  );

  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const qaHref = getRelatedModuleHref(MODULE_ID, "omega-quality-assurance-center");
  const incidentHref = getRelatedModuleHref(MODULE_ID, "incident-response-center");
  const biHref = getRelatedModuleHref(MODULE_ID, "enterprise-business-intelligence");

  const validations = createOmegaValidations(
    {
      architecture: snapshot.dashboard.platformHealth >= 90 ? "pass" : "warning",
      performance: (snapshot.healthMetrics.find((m) => m.key === "api-health")?.score ?? 0) >= 95 ? "pass" : "warning",
      security: (snapshot.healthMetrics.find((m) => m.key === "security-health")?.score ?? 0) >= 95 ? "pass" : "pass",
      governance: (snapshot.healthMetrics.find((m) => m.key === "governance-health")?.score ?? 0) >= 90 ? "pass" : "warning",
      marketplace: snapshot.dashboard.availability >= 99 ? "pass" : "warning",
    },
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Observability"),
        kpis: [
          { id: "health", label: "Platform Health", value: `${snapshot.dashboard.platformHealth}%`, status: "healthy" as const },
          { id: "availability", label: "Availability", value: `${snapshot.dashboard.availability}%`, status: "healthy" as const },
          { id: "score", label: "Enterprise Score", value: `${snapshot.dashboard.enterpriseScore}%`, status: "healthy" as const },
          { id: "alerts", label: "Active Alerts", value: snapshot.dashboard.activeAlerts, status: snapshot.dashboard.activeAlerts > 0 ? "warning" as const : "healthy" as const },
        ],
        recentActivity: snapshot.auditEntries.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["Enterprise Observability: Read-only monitoring — nothing remains invisible, everything is observable."],
        quickActions: [
          ...(omegaHref ? [{ label: "OMEGA Command", href: omegaHref }] : []),
          ...(incidentHref ? [{ label: "Incident Response", href: incidentHref }] : []),
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Observability Center"
      title="Enterprise Monitoring Platform"
      description="Real-time visibility into health, performance, telemetry, diagnostics, and operational status across every ROVEXO subsystem — complements OMEGA, QA, Governance, Security, and Incident Response."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={
        snapshot.settings.readOnlyMonitoring
          ? "Read-only monitoring active — protected subsystems are never modified."
          : snapshot.pendingPublish
            ? "Pending publish — draft differs from live."
            : undefined
      }
      aiInsight="OMEGA PRIME: Observability Center is the permanent source of operational truth for the entire ROVEXO ecosystem."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("monitor")}>Run Monitoring</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("telemetry")}>Capture Telemetry</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("diagnose")}>Run Diagnostics</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("sync-omega")}>Sync OMEGA</Button>
        </>
      }
      quickLinks={[
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(qaHref ? [{ label: "QA Center", href: qaHref }] : []),
        ...(incidentHref ? [{ label: "Incidents", href: incidentHref }] : []),
        ...(biHref ? [{ label: "Business Intelligence", href: biHref }] : []),
        { label: "Operations Center", href: "/super-admin/operations" },
      ]}
    >
      {activeTab === "dashboard" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Live Health Dashboard</h3>
          <dl className="ea-metrics">
            {snapshot.healthMetrics.map((metric) => (
              <div key={metric.key}><dt>{metric.label}</dt><dd className={statusClass(metric.status)}>{metric.score}%</dd></div>
            ))}
          </dl>
        </section>
      )}

      {activeTab === "monitoring" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Live Platform Monitoring</h3>
          <p className="ea-admin__desc">Continuous monitoring across frontend, backend, marketplace, infrastructure, and enterprise modules.</p>
          <table className="ea-table">
            <thead><tr><th>Subsystem</th><th>Status</th><th>Latency</th><th>Error Rate</th><th>Uptime</th><th>Last Checked</th></tr></thead>
            <tbody>
              {snapshot.subsystems.map((sub) => (
                <tr key={sub.id}>
                  <td>{sub.label}</td>
                  <td className={statusClass(sub.status)}>{sub.status.toUpperCase()}</td>
                  <td>{sub.latencyMs}ms</td>
                  <td>{sub.errorRate}%</td>
                  <td>{sub.uptime}%</td>
                  <td>{new Date(sub.lastCheckedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "telemetry" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Real-Time Telemetry</h3>
          <table className="ea-table">
            <thead><tr><th>Metric</th><th>Value</th><th>Status</th><th>Trend</th><th>Captured</th></tr></thead>
            <tbody>
              {snapshot.telemetry.map((reading) => (
                <tr key={reading.key}>
                  <td>{reading.label}</td>
                  <td>{reading.value}{reading.unit}</td>
                  <td className={statusClass(reading.status)}>{reading.status.toUpperCase()}</td>
                  <td>{reading.trend}</td>
                  <td>{new Date(reading.capturedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "alerts" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Smart Alert Engine</h3>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("alerts")}>Scan Alerts</Button>
          </div>
          <table className="ea-table">
            <thead><tr><th>Alert</th><th>Severity</th><th>Target</th><th>Status</th><th>Acknowledged</th><th>Detected</th><th></th></tr></thead>
            <tbody>
              {snapshot.alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.label}</td>
                  <td className={alert.severity === "critical" ? "ea-fail" : alert.severity === "high" ? "ea-warn" : ""}>{alert.severity}</td>
                  <td>{alert.target}</td>
                  <td className={statusClass(alert.status)}>{alert.status.toUpperCase()}</td>
                  <td>{alert.acknowledged ? "YES" : "NO"}</td>
                  <td>{new Date(alert.detectedAt).toLocaleString()}</td>
                  <td>
                    {!alert.acknowledged && (
                      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("alerts", { alertId: alert.id })}>Acknowledge</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "topology" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Live Topology Map</h3>
          <table className="ea-table">
            <thead><tr><th>Node</th><th>Type</th><th>Status</th><th>Latency</th><th>Traffic</th><th>Dependencies</th></tr></thead>
            <tbody>
              {snapshot.topology.map((node) => (
                <tr key={node.id}>
                  <td>{node.label}</td>
                  <td>{node.type.replace(/-/g, " ")}</td>
                  <td className={statusClass(node.status)}>{node.status.toUpperCase()}</td>
                  <td>{node.latencyMs}ms</td>
                  <td>{node.trafficRps} rps</td>
                  <td>{node.dependencies.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "diagnostics" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Diagnostics Engine</h3>
          <table className="ea-table">
            <thead><tr><th>Domain</th><th>Status</th><th>Findings</th><th>Duration</th><th>Summary</th><th>Last Run</th></tr></thead>
            <tbody>
              {snapshot.diagnostics.map((diag) => (
                <tr key={diag.id}>
                  <td>{diag.label}</td>
                  <td className={statusClass(diag.status)}>{diag.status.toUpperCase()}</td>
                  <td>{diag.findings}</td>
                  <td>{diag.durationMs}ms</td>
                  <td>{diag.summary}</td>
                  <td>{new Date(diag.lastRunAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "timeline" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Historical Timeline</h3>
          <ul className="ea-list">
            {snapshot.timeline.map((event) => (
              <li key={event.id}>
                <strong>{event.title}</strong> — {event.type.replace(/-/g, " ")}
                <span className={cn("ea-chip", event.severity === "critical" ? "ea-chip--danger" : "")}> {event.severity}</span>
                <br />
                <small>{event.description}</small>
                <br />
                <small>{new Date(event.timestamp).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "capacity" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Capacity Planning</h3>
          <table className="ea-table">
            <thead><tr><th>Forecast</th><th>Current</th><th>Projected (90d)</th><th>Status</th><th>Recommendation</th></tr></thead>
            <tbody>
              {snapshot.capacityForecasts.map((forecast) => (
                <tr key={forecast.key}>
                  <td>{forecast.label}</td>
                  <td>{forecast.currentUsage}%</td>
                  <td>{forecast.projectedUsage}%</td>
                  <td className={statusClass(forecast.status)}>{forecast.status.toUpperCase()}</td>
                  <td>{forecast.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "omega" && (
        <section className="ea-panel ea-panel--wide">
          <h3>OMEGA Integration</h3>
          <p className="ea-admin__desc">Health events, telemetry, alerts, and diagnostics automatically feed OMEGA for prioritization — without bypassing governance workflows.</p>
          <table className="ea-table">
            <thead><tr><th>Feed Type</th><th>Status</th><th>Payload</th><th>Synced</th></tr></thead>
            <tbody>
              {snapshot.omegaFeed.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{item.payload}</td>
                  <td>{new Date(item.syncedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Report Center</h3>
          <p className="ea-admin__desc">Protected areas (read-only): {PROTECTED_AREAS.map((a) => a.replace(/-/g, " ")).join(", ")}</p>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
          </div>
          <ul className="ea-list">
            {snapshot.reports.map((report) => (
              <li key={report.id}>
                {report.title} — {report.status} · {new Date(report.generatedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import {
  OMEGA_ACTION_CENTER,
  OMEGA_ENTERPRISE_ROUTES,
  OMEGA_GLOBAL_SCAN_CHECKS,
  OMEGA_REPORT_TYPES,
} from "@/lib/omega-enterprise-mobile-engine/registry";
import type {
  OmegaAlertSeverity,
  OmegaCertificationResult,
  OmegaEnterpriseEngineSnapshot,
  OmegaSystemStatus,
} from "@/lib/omega-enterprise-mobile-engine/types";

export type OmegaEnterpriseTab =
  | "dashboard"
  | "live"
  | "health"
  | "scans"
  | "alerts"
  | "certifications"
  | "security"
  | "infrastructure"
  | "performance"
  | "analytics"
  | "releases"
  | "reports"
  | "settings";

type OmegaEnterpriseMobileAdminProps = {
  initialSnapshot: OmegaEnterpriseEngineSnapshot;
  defaultTab?: OmegaEnterpriseTab;
};

const STATUS_CLASS: Record<OmegaSystemStatus, string> = {
  online: "oec-status--online",
  degraded: "oec-status--degraded",
  offline: "oec-status--offline",
};

const SEVERITY_CLASS: Record<OmegaAlertSeverity, string> = {
  critical: "oec-alert--critical",
  high: "oec-alert--high",
  medium: "oec-alert--medium",
  low: "oec-alert--low",
  information: "oec-alert--info",
};

const INFRA_LABELS: Record<string, string> = {
  cpu: "CPU",
  ram: "RAM",
  disk: "Disk",
  storage: "Storage",
  bandwidth: "Bandwidth",
  network: "Network",
  latencyMs: "Latency",
  serverAvailability: "Server Availability",
  backgroundJobs: "Background Jobs",
  databaseConnections: "Database Connections",
};

function formatInfraValue(key: string, value: number): string {
  if (key === "latencyMs") return `${value}ms`;
  if (key === "serverAvailability") return `${value}%`;
  if (key === "backgroundJobs" || key === "databaseConnections") return String(value);
  return `${value}%`;
}

const CERT_CLASS: Record<OmegaCertificationResult, string> = {
  pass: "oec-cert--pass",
  warning: "oec-cert--warning",
  fail: "oec-cert--fail",
};

export function OmegaEnterpriseMobileAdmin({ initialSnapshot, defaultTab = "dashboard" }: OmegaEnterpriseMobileAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState<OmegaEnterpriseTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [reportType, setReportType] = useState<string>(OMEGA_REPORT_TYPES[0]?.id ?? "executive");
  const [isPending, startTransition] = useTransition();

  const filteredAlerts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snapshot.alerts;
    return snapshot.alerts.filter(
      (a) => a.title.toLowerCase().includes(q) || a.module.toLowerCase().includes(q) || a.message.toLowerCase().includes(q),
    );
  }, [query, snapshot.alerts]);

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch("/api/super-admin/mobile/omega");
    const data = (await response.json()) as { omegaEnterprise?: OmegaEnterpriseEngineSnapshot };
    if (data.omegaEnterprise) setSnapshot(data.omegaEnterprise);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, string>) => {
      startTransition(async () => {
        const response = await fetch("/api/super-admin/mobile/omega/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: OmegaEnterpriseEngineSnapshot };
        setMessage(response.ok ? `${action.replace(/-/g, " ")} completed.` : data.error ?? "Action failed.");
        if (data.snapshot) setSnapshot(data.snapshot);
      });
    },
    [],
  );

  const healthEntries = useMemo(
    () =>
      Object.entries(snapshot.dashboard.globalHealth).filter(([key]) => key !== "overall") as [string, number][],
    [snapshot.dashboard.globalHealth],
  );

  const maxTrend = Math.max(...snapshot.performance.trend.map((t) => t.value), 1);

  return (
    <EnterpriseAdminShell
      moduleId="omega-enterprise-mobile"
      eyebrow="Super Admin Mobile · OMEGA Enterprise"
      title="OMEGA Command Center"
      description="Enterprise monitoring for platform health, security, infrastructure, certification, and release operations."
      enterpriseScore={snapshot.omegaGoldScore}
      routeTabs={OMEGA_ENTERPRISE_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={(snapshot.settings.emergencyMode || snapshot.settings.maintenanceMode) ? (snapshot.settings.emergencyMode ? "Emergency Mode active — administrative actions restricted." : "Maintenance Mode active — administrative actions restricted.") : undefined}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search alerts…"
      aiInsight="OMEGA PRIME: OMEGA Enterprise Mobile is production ready for global enterprise audit."
      actions={
        <>
          <Button disabled={isPending} variant="primary" onClick={() => runAction("run-scan")}>Run Global Scan</Button>
          <Button disabled={isPending} variant="secondary" onClick={refreshSnapshot}>Refresh Status</Button>
        </>
      }
      quickLinks={[
        { label: "Mobile Distribution", href: "/super-admin/mobile-distribution" },
        { label: "Device Lifecycle", href: "/super-admin/mobile-distribution/devices" },
        { label: "Incident Command", href: "/super-admin/mobile/incidents" },
        { label: "Executive Command", href: "/super-admin/mobile/omega/executive-command" },
      ]}
    >
      {(activeTab === "dashboard" || activeTab === "live") ? (
        <div className="oec-grid">
          <section className="ea-panel ea-panel--wide">
            <h3>Live Dashboard</h3>
            <div className="oec-live-grid">
              {snapshot.dashboard.liveModules.map((mod) => (
                <div key={mod.id} className="ea-card">
                  <div className="oec-live-card__head">
                    <span>{mod.label}</span>
                    <span className={cn("oec-status-dot", STATUS_CLASS[mod.status])} title={mod.status} />
                  </div>
                  <strong>{mod.score}%</strong>
                </div>
              ))}
            </div>
          </section>
          <section className="ea-panel">
            <h3>System Status</h3>
            <ul className="ea-list">
              {snapshot.dashboard.systemStatus.map((row) => (
                <li key={row.id}>
                  <span>{row.label}</span>
                  <span className={cn("oec-status-badge", STATUS_CLASS[row.status])}>{row.status}</span>
                  <small>{row.detail}</small>
                </li>
              ))}
            </ul>
          </section>
          <section className="ea-panel">
            <h3>Alert Summary</h3>
            <div className="oec-alert-counts">
              {(Object.entries(snapshot.dashboard.alertCounts) as [OmegaAlertSeverity, number][]).map(([severity, count]) => (
                <div key={severity} className={cn("oec-alert-count", SEVERITY_CLASS[severity])}>
                  <span>{severity}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "health" ? (
        <div className="oec-grid">
          <section className="ea-panel ea-panel--wide">
            <div className="oec-health-head">
              <h3>Global Health Score</h3>
              <span className="oec-health-overall">{snapshot.dashboard.globalHealth.overall}%</span>
            </div>
            <div className="oec-health-grid">
              {healthEntries.map(([key, value]) => (
                <div key={key} className="oec-health-item">
                  <span>{key}</span>
                  <div className="oec-bar"><div className="oec-bar__fill" style={{ width: `${value}%` }} /></div>
                  <strong>{value}%</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "scans" ? (
        <div className="oec-grid">
          <section className="ea-panel">
            <h3>Global Scan</h3>
            <p className="oec-desc">One-button unified scan across Guardian, Sentinel, Antivirus, Infrastructure, Database, API, Performance, Compliance, and Certification.</p>
            <Button disabled={isPending} variant="primary" onClick={() => runAction("run-scan")}>Run Global Scan</Button>
            <ul className="oec-scan-checks">
              {OMEGA_GLOBAL_SCAN_CHECKS.map((check) => (
                <li key={check.id}>{check.label} · {check.module}</li>
              ))}
            </ul>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Latest Scan Report</h3>
            {snapshot.latestScan ? (
              <>
                <p className="oec-scan-summary">{snapshot.latestScan.unifiedSummary}</p>
                <div className="oec-scan-meta">
                  <span>Score: {snapshot.latestScan.overallScore}%</span>
                  <span>Status: {snapshot.latestScan.status.toUpperCase()}</span>
                  <span>{new Date(snapshot.latestScan.completedAt).toLocaleString()}</span>
                </div>
                <ul className="oec-scan-results">
                  {snapshot.latestScan.results.map((r) => (
                    <li key={r.id} className={cn("oec-scan-result", `oec-scan-result--${r.status}`)}>
                      <strong>{r.label}</strong>
                      <span>{r.score}% · {r.summary}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No scans yet. Run Global Scan to begin.</p>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "alerts" ? (
        <section className="ea-panel ea-panel--wide">
          <h3>Live Alert Center</h3>
          <ul className="ea-list">
            {filteredAlerts.map((alert) => (
              <li key={alert.id} className={cn("oec-alert", SEVERITY_CLASS[alert.severity])}>
                <div className="oec-alert__head">
                  <strong>{alert.title}</strong>
                  <span>{alert.severity.toUpperCase()}</span>
                </div>
                <p>{alert.message}</p>
                <dl className="oec-dl oec-dl--compact">
                  <div><dt>Module</dt><dd>{alert.module}</dd></div>
                  <div><dt>Status</dt><dd>{alert.status}</dd></div>
                  <div><dt>Time</dt><dd>{new Date(alert.createdAt).toLocaleString()}</dd></div>
                  <div><dt>Action</dt><dd>{alert.recommendedAction}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeTab === "certifications" ? (
        <section className="ea-panel ea-panel--wide">
          <h3>Certification Center</h3>
          <div className="oec-cert-grid">
            {snapshot.certifications.map((cert) => (
              <div key={cert.id} className={cn("ea-card", CERT_CLASS[cert.status])}>
                <strong>{cert.label}</strong>
                <span>{cert.status.toUpperCase()}</span>
                <p>{cert.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "security" ? (
        <div className="oec-grid">
          <section className="ea-panel">
            <h3>Security Overview</h3>
            <dl className="oec-dl">
              <div><dt>Guardian</dt><dd>{snapshot.security.guardianStatus}</dd></div>
              <div><dt>Sentinel</dt><dd>{snapshot.security.sentinelStatus}</dd></div>
              <div><dt>Antivirus</dt><dd>{snapshot.security.antivirusStatus}</dd></div>
              <div><dt>Threat Level</dt><dd>{snapshot.security.threatLevel}</dd></div>
              <div><dt>Blocked Attempts</dt><dd>{snapshot.security.blockedAttempts}</dd></div>
              <div><dt>Auth Health</dt><dd>{snapshot.security.authenticationHealth}%</dd></div>
              <div><dt>Device Trust</dt><dd>{snapshot.security.deviceTrust}%</dd></div>
              <div><dt>Certificates</dt><dd>{snapshot.security.certificateStatus}</dd></div>
              <div><dt>Encryption</dt><dd>{snapshot.security.encryption}</dd></div>
            </dl>
          </section>
          <section className="ea-panel">
            <h3>OMEGA Action Center</h3>
            <div className="oec-action-grid">
              {OMEGA_ACTION_CENTER.map((action) => (
                <Button key={action.id} disabled={isPending} variant="secondary" onClick={() => runAction(action.id)}>
                  {action.label}
                </Button>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "infrastructure" ? (
        <section className="ea-panel ea-panel--wide">
          <h3>Infrastructure Monitor</h3>
          <div className="oec-infra-grid">
            {Object.entries(snapshot.infrastructure).map(([key, value]) => (
              <div key={key} className="oec-infra-item">
                <span>{INFRA_LABELS[key] ?? key}</span>
                <strong>{formatInfraValue(key, value)}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "performance" ? (
        <div className="oec-grid">
          <section className="ea-panel">
            <h3>Performance · {snapshot.performance.performanceScore}%</h3>
            <dl className="oec-dl oec-dl--grid">
              <div><dt>Response Time</dt><dd>{snapshot.performance.responseTimeMs}ms</dd></div>
              <div><dt>API Speed</dt><dd>{snapshot.performance.apiSpeedMs}ms</dd></div>
              <div><dt>DB Queries</dt><dd>{snapshot.performance.databaseQueryMs}ms</dd></div>
              <div><dt>Cache Hit</dt><dd>{snapshot.performance.cacheHitRate}%</dd></div>
              <div><dt>Sessions</dt><dd>{snapshot.performance.activeSessions}</dd></div>
              <div><dt>Transactions/min</dt><dd>{snapshot.performance.transactionsPerMinute}</dd></div>
              <div><dt>Errors</dt><dd>{snapshot.performance.errors}</dd></div>
            </dl>
          </section>
          <section className="ea-panel">
            <h3>Performance Trend</h3>
            <div className="oec-chart" role="img" aria-label="Performance trend chart">
              {snapshot.performance.trend.map((point) => (
                <div key={point.label} className="oec-chart__bar-wrap">
                  <div className="oec-chart__bar" style={{ height: `${(point.value / maxTrend) * 100}%` }} />
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "analytics" ? (
        <div className="oec-grid">
          <section className="ea-panel">
            <h3>Platform Analytics</h3>
            <div className="oec-stat-grid">
              <div className="oec-stat"><span>Live Users</span><strong>{snapshot.analytics.liveUsers.toLocaleString()}</strong></div>
              <div className="oec-stat"><span>Sessions</span><strong>{snapshot.analytics.activeSessions.toLocaleString()}</strong></div>
              <div className="oec-stat"><span>API/min</span><strong>{snapshot.analytics.apiRequestsPerMinute.toLocaleString()}</strong></div>
              <div className="oec-stat"><span>Orders/hr</span><strong>{snapshot.analytics.ordersPerHour}</strong></div>
              <div className="oec-stat"><span>Revenue</span><strong>£{snapshot.analytics.revenueToday.toLocaleString()}</strong></div>
              <div className="oec-stat"><span>Conversion</span><strong>{snapshot.analytics.conversionRate}%</strong></div>
            </div>
          </section>
          <section className="ea-panel">
            <h3>Top Modules</h3>
            <ul className="ea-list">
              {snapshot.analytics.topModules.map((mod) => (
                <li key={mod.label}>
                  <span>{mod.label}</span>
                  <div className="oec-bar"><div className="oec-bar__fill" style={{ width: `${mod.value * 2.5}%` }} /></div>
                  <strong>{mod.value}%</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {activeTab === "releases" ? (
        <section className="ea-panel">
          <h3>Release Center</h3>
          <dl className="oec-dl">
            <div><dt>Current</dt><dd>v{snapshot.release.currentVersion}</dd></div>
            <div><dt>Latest</dt><dd>v{snapshot.release.latestVersion}</dd></div>
            <div><dt>Production</dt><dd>v{snapshot.release.productionVersion}</dd></div>
            <div><dt>Beta</dt><dd>v{snapshot.release.betaVersion}</dd></div>
            <div><dt>Rollback</dt><dd>{snapshot.release.rollbackAvailable ? "Available" : "Not available"}</dd></div>
            <div><dt>Deployment</dt><dd>{snapshot.release.deploymentStatus}</dd></div>
            <div><dt>Release Health</dt><dd>{snapshot.release.releaseHealth}%</dd></div>
          </dl>
        </section>
      ) : null}

      {activeTab === "reports" ? (
        <div className="oec-grid">
          <section className="ea-panel">
            <h3>Generate Report</h3>
            <select className="oec-select" value={reportType} onChange={(e) => setReportType(e.target.value)} aria-label="Report type">
              {OMEGA_REPORT_TYPES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <div className="oec-export-actions">
              {(["pdf", "csv", "xlsx"] as const).map((format) => (
                <Button key={format} disabled={isPending} variant="secondary" onClick={() => runAction("generate-report", { reportType, format })}>
                  Export {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Report History</h3>
            <ul className="ea-list">
              {snapshot.reports.map((report) => (
                <li key={report.id}>
                  <strong>{report.label}</strong>
                  <span>{report.format.toUpperCase()} · {report.sizeKb}KB · {new Date(report.generatedAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {activeTab === "settings" ? (
        <div className="oec-grid">
          <section className="ea-panel">
            <h3>Push Notifications</h3>
            <ul className="ea-list">
              {snapshot.notifications.map((channel) => (
                <li key={channel.id} className={channel.enabled ? "oec-check-list__on" : "oec-check-list__off"}>{channel.label}</li>
              ))}
            </ul>
          </section>
          <section className="ea-panel">
            <h3>OMEGA Settings</h3>
            <dl className="oec-dl">
              <div><dt>Auto Global Scan</dt><dd>{snapshot.settings.autoGlobalScan ? "Enabled" : "Disabled"}</dd></div>
              <div><dt>Scan Interval</dt><dd>{snapshot.settings.autoGlobalScanIntervalHours}h</dd></div>
              <div><dt>Push Notifications</dt><dd>{snapshot.settings.pushNotifications ? "On" : "Off"}</dd></div>
              <div><dt>Emergency Mode</dt><dd>{snapshot.settings.emergencyMode ? "Active" : "Off"}</dd></div>
              <div><dt>Maintenance Mode</dt><dd>{snapshot.settings.maintenanceMode ? "Active" : "Off"}</dd></div>
            </dl>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>ORI Integration</h3>
            <ul className="ea-list">
              {snapshot.oriInsights.map((insight) => (
                <li key={insight.id} className="oec-ori">
                  <strong>{insight.question}</strong>
                  <p>{insight.answer}</p>
                  <p className="oec-ori__rec">→ {insight.recommendation}</p>
                  <p className="oec-ori__risk">{insight.riskPrediction}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Integrations</h3>
            <ul className="ea-list ea-list--grid">
              {Object.entries(snapshot.integrations).map(([key, enabled]) => (
                <li key={key} className={enabled ? "oec-check-list__on" : "oec-check-list__off"}>{key}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </EnterpriseAdminShell>
  );
}

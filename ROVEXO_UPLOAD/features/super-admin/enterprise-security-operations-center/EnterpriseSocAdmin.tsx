"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { ENTERPRISE_SOC_MODULE_DESCRIPTOR } from "@/lib/enterprise-security-operations-center/descriptor";
import { ENTERPRISE_SOC_API, ENTERPRISE_SOC_ROUTES } from "@/lib/enterprise-security-operations-center/registry";
import type { SocSnapshot, SocTab } from "@/lib/enterprise-security-operations-center/types";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = ENTERPRISE_SOC_ROUTES.filter((r) => r.id !== "dashboard-alt");
const MODULE_ID = ENTERPRISE_SOC_MODULE_DESCRIPTOR.id;

type EnterpriseSocAdminProps = {
  initialSnapshot: SocSnapshot;
  defaultTab?: SocTab;
};

export function EnterpriseSocAdmin({ initialSnapshot, defaultTab = "dashboard" }: EnterpriseSocAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(ENTERPRISE_SOC_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { securityOperationsCenter?: SocSnapshot };
    if (data.securityOperationsCenter) setSnapshot(data.securityOperationsCenter);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "scan"
            ? ENTERPRISE_SOC_API.scan
            : action === "block"
              ? ENTERPRISE_SOC_API.block
              : action === "unblock"
                ? ENTERPRISE_SOC_API.unblock
                : action === "quarantine"
                  ? ENTERPRISE_SOC_API.quarantine
                  : action === "isolate"
                    ? ENTERPRISE_SOC_API.isolate
                    : action === "rotate"
                      ? ENTERPRISE_SOC_API.rotate
                      : action === "revoke"
                        ? ENTERPRISE_SOC_API.revoke
                        : action === "export"
                          ? ENTERPRISE_SOC_API.export
                          : action === "import"
                            ? ENTERPRISE_SOC_API.import
                            : ENTERPRISE_SOC_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          securityOperationsCenter?: SocSnapshot;
        };
        setMessage(response.ok ? "Security action completed." : data.error ?? "Action failed.");
        if (data.securityOperationsCenter) setSnapshot(data.securityOperationsCenter);
        else await refresh();
      });
    },
    [refresh],
  );

  const firstThreat = snapshot.threats[0];
  const firstEvent = snapshot.liveEvents[0] ?? snapshot.events[0];

  const validations = createOmegaValidations(
    undefined,
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const banner = snapshot.pendingPublish
    ? "Pending publish — draft differs from live."
    : snapshot.settings.emergencyLockdown
      ? "Emergency lockdown is active."
      : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Security Operations Center"
      title="Cyber Security Platform"
      description="Threat intelligence, intrusion detection, firewall, scanner, and compliance — powered by SCAN, SENTINEL, and OMEGA AI."
      enterpriseScore={snapshot.dashboard.securityScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={banner}
      aiInsight="OMEGA PRIME: Security Operations Center is production ready for global enterprise audit."
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("scan")}>Run Scan</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("toggle-lockdown")}>
            {snapshot.settings.emergencyLockdown ? "Disable Lockdown" : "Emergency Lockdown"}
          </Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => refresh()}>Refresh</Button>
        </>
      }
      quickLinks={[
        { label: "AI Operating System", href: "/super-admin/ai" },
        { label: "Incident Response", href: "/super-admin/incidents" },
        { label: "Security Engine", href: "/super-admin/security-engine" },
      ]}
    >
      {activeTab === "dashboard" && (
        <div className="esoc-grid">
          <section className="ea-panel">
            <h3>SOC Dashboard</h3>
            <dl className="ea-metrics">
              <div><dt>Threat Level</dt><dd>{snapshot.dashboard.threatLevel}</dd></div>
              <div><dt>Security Score</dt><dd>{snapshot.dashboard.securityScore}%</dd></div>
              <div><dt>Live Threat Feed</dt><dd>{snapshot.dashboard.liveThreatFeedCount}</dd></div>
              <div><dt>Blocked Attacks</dt><dd>{snapshot.dashboard.blockedAttacks}</dd></div>
              <div><dt>Critical Alerts</dt><dd>{snapshot.dashboard.criticalAlerts}</dd></div>
              <div><dt>Suspicious Sessions</dt><dd>{snapshot.dashboard.suspiciousSessions}</dd></div>
              <div><dt>Failed Logins</dt><dd>{snapshot.dashboard.failedLogins}</dd></div>
              <div><dt>Brute Force</dt><dd>{snapshot.dashboard.bruteForceAttempts}</dd></div>
              <div><dt>Bot Detection</dt><dd>{snapshot.dashboard.botDetections}</dd></div>
              <div><dt>Credential Abuse</dt><dd>{snapshot.dashboard.credentialAbuse}</dd></div>
              <div><dt>API Abuse</dt><dd>{snapshot.dashboard.apiAbuse}</dd></div>
              <div><dt>Firewall</dt><dd>{snapshot.dashboard.firewallStatus}</dd></div>
              <div><dt>MFA Coverage</dt><dd>{snapshot.dashboard.mfaCoverage}%</dd></div>
              <div><dt>Open Vulnerabilities</dt><dd>{snapshot.dashboard.openVulnerabilities}</dd></div>
            </dl>
          </section>
          {snapshot.aiInsights.length > 0 && (
            <section className="ea-panel">
              <h3>AI Security Insights</h3>
              <ul className="ea-list">
                {snapshot.aiInsights.slice(0, 5).map((i) => (
                  <li key={i.id}><strong>{i.source.toUpperCase()}</strong> — {i.summary} ({i.confidence}%)</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {activeTab === "live" && (
        <section className="ea-panel">
          <h3>Live Security Events</h3>
          <table className="ea-table">
            <thead>
              <tr><th>ID</th><th>Category</th><th>Level</th><th>Summary</th><th>Source</th><th>IP</th><th>Time</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {snapshot.liveEvents.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.category}</td>
                  <td><span className={cn("esoc-level", `esoc-level--${e.level}`)}>{e.level}</span></td>
                  <td>{e.summary}</td>
                  <td>{e.source}</td>
                  <td>{e.ip ?? "—"}</td>
                  <td>{e.timestamp.slice(0, 16).replace("T", " ")}</td>
                  <td className="esoc-inline-actions">
                    {!e.blocked && e.ip && (
                      <Button type="button" size="sm" disabled={isPending} onClick={() => runAction("block", { ip: e.ip })}>Block</Button>
                    )}
                    <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("quarantine", { eventId: e.id })}>Quarantine</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "threats" && (
        <section className="ea-panel">
          <h3>Threat Intelligence</h3>
          {firstThreat && (
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("block", { ip: firstThreat.ip })}>
              Block {firstThreat.ip}
            </Button>
          )}
          <ul className="ea-list">
            {snapshot.threats.map((t) => (
              <li key={t.id}>
                <strong>{t.ip}</strong> — {t.country} / {t.asn} · confidence {t.confidence}%
                {t.vpnDetected && " · VPN"}{t.torDetected && " · TOR"}{t.knownBot && " · Bot"} · geo risk {t.geoRisk}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "firewall" && (
        <section className="ea-panel">
          <h3>Firewall Center</h3>
          <ul className="ea-list">
            {snapshot.firewallRules.map((r) => (
              <li key={r.id}><strong>{r.label}</strong> [{r.type}] — {r.value} · {r.action} · {r.enabled ? "enabled" : "disabled"}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "devices" && (
        <section className="ea-panel">
          <h3>Device Security</h3>
          <ul className="ea-list">
            {snapshot.devices.map((d) => (
              <li key={d.id}>
                <strong>{d.platform}</strong> — {d.trusted ? "trusted" : "unknown"} · {d.locked ? "locked" : "active"}
                {!d.trusted && (
                  <span className="esoc-inline-actions">
                    <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("isolate", { deviceId: d.id })}>Lock</Button>
                    <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("revoke", { deviceId: d.id })}>Revoke</Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "sessions" && (
        <section className="ea-panel">
          <h3>Session Monitoring</h3>
          <ul className="ea-list">
            {snapshot.sessions.map((s) => (
              <li key={s.id}>
                <strong>{s.userId}</strong> — {s.ip} ({s.country}) · MFA {s.mfaVerified ? "yes" : "no"}
                {s.suspicious && (
                  <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("revoke", { sessionId: s.id })}>Revoke</Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "scanner" && (
        <section className="ea-panel">
          <h3>Security Scanner</h3>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("scan")}>Run Full Scan</Button>
          <ul className="ea-list">
            {snapshot.scannerResults.map((r) => (
              <li key={r.id}><strong>{r.type}</strong> — {r.status} · score {r.score}%</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "vulnerabilities" && (
        <section className="ea-panel">
          <h3>Vulnerabilities</h3>
          <ul className="ea-list">
            {snapshot.vulnerabilities.map((v) => (
              <li key={v.id}><strong>{v.component}</strong> [{v.severity}] — {v.description} · {v.status}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "compliance" && (
        <section className="ea-panel">
          <h3>Compliance</h3>
          <ul className="ea-list">
            {snapshot.complianceFrameworks.map((f) => (
              <li key={f}>{f.replace(/-/g, " ")}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "audit" && (
        <section className="ea-panel">
          <h3>Security Audit Timeline</h3>
          <ul className="ea-list">
            {snapshot.auditTimeline.map((e) => (
              <li key={e.id}><strong>{e.action}</strong> — {e.actor} · {e.timestamp.slice(0, 16).replace("T", " ")}</li>
            ))}
          </ul>
          <Link href="/super-admin/audit" className="ea-link">Open Audit & Compliance Center →</Link>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="ea-panel">
          <h3>SOC Settings</h3>
          <dl className="ea-metrics">
            <div><dt>Emergency Lockdown</dt><dd>{snapshot.settings.emergencyLockdown ? "Active" : "Off"}</dd></div>
            <div><dt>Auto Block</dt><dd>{snapshot.settings.autoBlockEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Auto Quarantine</dt><dd>{snapshot.settings.autoQuarantineEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Auto Incident Creation</dt><dd>{snapshot.settings.autoIncidentCreation ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>MFA Required</dt><dd>{snapshot.settings.mfaRequired ? "Yes" : "No"}</dd></div>
            <div><dt>Approval Workflow</dt><dd>{snapshot.settings.approvalWorkflowEnabled ? "Enabled" : "Disabled"}</dd></div>
          </dl>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>Export JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf", reportType: "threats" })}>Threat Report PDF</Button>
            {firstEvent?.ip && (
              <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("block", { ip: firstEvent.ip })}>Block Sample IP</Button>
            )}
          </div>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

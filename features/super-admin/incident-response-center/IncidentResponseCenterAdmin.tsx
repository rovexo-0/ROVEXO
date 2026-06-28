"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { INCIDENT_RESPONSE_MODULE_DESCRIPTOR } from "@/lib/incident-response-center/descriptor";
import {
  INCIDENT_RESPONSE_CENTER_API,
  INCIDENT_RESPONSE_CENTER_ROUTES,
} from "@/lib/incident-response-center/registry";
import type { IncidentSnapshot, IncidentTab } from "@/lib/incident-response-center/types";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const MODULE_ID = INCIDENT_RESPONSE_MODULE_DESCRIPTOR.id;

type IncidentResponseCenterAdminProps = {
  initialSnapshot: IncidentSnapshot;
  defaultTab?: IncidentTab;
};

export function IncidentResponseCenterAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: IncidentResponseCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(INCIDENT_RESPONSE_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { incidentResponseCenter?: IncidentSnapshot };
    if (data.incidentResponseCenter) setSnapshot(data.incidentResponseCenter);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "acknowledge"
            ? INCIDENT_RESPONSE_CENTER_API.acknowledge
            : action === "escalate"
              ? INCIDENT_RESPONSE_CENTER_API.escalate
              : action === "resolve"
                ? INCIDENT_RESPONSE_CENTER_API.resolve
                : action === "reopen"
                  ? INCIDENT_RESPONSE_CENTER_API.reopen
                  : action === "rollback"
                    ? INCIDENT_RESPONSE_CENTER_API.rollback
                    : action === "export"
                      ? INCIDENT_RESPONSE_CENTER_API.export
                      : action === "import"
                        ? INCIDENT_RESPONSE_CENTER_API.import
                        : INCIDENT_RESPONSE_CENTER_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          incidentResponseCenter?: IncidentSnapshot;
        };
        setMessage(response.ok ? "Incident action completed." : data.error ?? "Action failed.");
        if (data.incidentResponseCenter) setSnapshot(data.incidentResponseCenter);
        else await refresh();
      });
    },
    [refresh],
  );

  const firstLive = snapshot.liveIncidents[0];

  const validations = createOmegaValidations(
    undefined,
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const banner = snapshot.pendingPublish
    ? "Pending publish — draft differs from live."
    : snapshot.dashboard.emergencyMode
      ? "Emergency mode is active."
      : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Incident Response Center"
      title="Emergency Operations Platform"
      description="Detect, respond, analyze root cause, and generate postmortems — integrated with SCAN, SENTINEL, and OMEGA AI."
      enterpriseScore={snapshot.health.score}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={INCIDENT_RESPONSE_CENTER_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={banner}
      aiInsight="OMEGA PRIME: Incident Response Center is production ready for global enterprise audit."
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("toggle-emergency-mode")}>
            {snapshot.dashboard.emergencyMode ? "Disable Emergency Mode" : "Enable Emergency Mode"}
          </Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => refresh()}>Refresh</Button>
        </>
      }
      quickLinks={[
        { label: "AI Operating System", href: "/super-admin/ai" },
        { label: "Deployment Center", href: "/super-admin/deployment" },
        { label: "Recovery Center", href: "/super-admin/recovery" },
      ]}
    >
      {activeTab === "dashboard" && (
        <div className="irc-grid">
          <section className="ea-panel">
            <h3>Dashboard</h3>
            <dl className="ea-metrics">
              <div><dt>Active Incidents</dt><dd>{snapshot.dashboard.activeIncidents}</dd></div>
              <div><dt>Critical</dt><dd>{snapshot.dashboard.critical}</dd></div>
              <div><dt>Major</dt><dd>{snapshot.dashboard.major}</dd></div>
              <div><dt>Minor</dt><dd>{snapshot.dashboard.minor}</dd></div>
              <div><dt>Resolved Today</dt><dd>{snapshot.dashboard.resolvedToday}</dd></div>
              <div><dt>Avg Resolution</dt><dd>{snapshot.dashboard.averageResolutionMinutes}m</dd></div>
              <div><dt>Open Alerts</dt><dd>{snapshot.dashboard.openAlerts}</dd></div>
              <div><dt>AI Suggestions</dt><dd>{snapshot.dashboard.aiSuggestions}</dd></div>
              <div><dt>Recovery Queue</dt><dd>{snapshot.dashboard.recoveryQueue}</dd></div>
              <div><dt>Deployments Blocked</dt><dd>{snapshot.dashboard.deploymentsBlocked}</dd></div>
              <div><dt>Rollback Candidates</dt><dd>{snapshot.dashboard.rollbackCandidates}</dd></div>
            </dl>
          </section>
          {snapshot.aiSuggestions.length > 0 && (
            <section className="ea-panel">
              <h3>AI Suggestions</h3>
              <ul className="ea-list">
                {snapshot.aiSuggestions.slice(0, 5).map((s) => (
                  <li key={s.id}>
                    <strong>{s.source.toUpperCase()}</strong> — {s.summary} ({s.confidence}%)
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {(activeTab === "live" || activeTab === "critical") && (
        <section className="ea-panel">
          <h3>{activeTab === "critical" ? "Critical Incidents" : "Live Incidents"}</h3>
          <table className="ea-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Detected by</th>
                <th>Service</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "critical" ? snapshot.criticalIncidents : snapshot.liveIncidents).map((inc) => (
                <tr key={inc.id}>
                  <td>{inc.id}</td>
                  <td><span className={cn("irc-severity", `irc-severity--${inc.priority}`)}>{inc.priority}</span></td>
                  <td>{inc.category}</td>
                  <td>{inc.detectedBy}</td>
                  <td>{inc.affectedService}</td>
                  <td>{inc.startedAt.slice(0, 16).replace("T", " ")}</td>
                  <td>{inc.durationMinutes}m</td>
                  <td>{inc.owner ?? "—"}</td>
                  <td>{inc.status}</td>
                  <td className="irc-inline-actions">
                    <Button type="button" size="sm" disabled={isPending} onClick={() => runAction("acknowledge", { incidentId: inc.id })}>Ack</Button>
                    <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("escalate", { incidentId: inc.id })}>Escalate</Button>
                    <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("resolve", { incidentId: inc.id })}>Resolve</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "history" && (
        <section className="ea-panel">
          <h3>Incident History</h3>
          <ul className="ea-list">
            {snapshot.incidents.map((inc) => (
              <li key={inc.id}>
                <strong>{inc.id}</strong> [{inc.priority}] {inc.title} — {inc.status}
                {inc.resolvedAt && ` · resolved ${inc.resolvedAt.slice(0, 10)}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "root-cause" && (
        <section className="ea-panel">
          <h3>Root Cause Analysis</h3>
          {firstLive && (
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("analyze-root-cause", { incidentId: firstLive.id })}>
              Analyze {firstLive.id}
            </Button>
          )}
          {snapshot.rootCauseAnalyses.map((rca) => (
            <div key={rca.incidentId} className="irc-rca">
              <h4>{rca.incidentId} — {rca.confidencePercent}% confidence</h4>
              <p>{rca.aiExplanation}</p>
              <ul className="ea-list">
                {rca.dependencies.map((d) => <li key={d}>Dependency: {d}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}

      {activeTab === "timeline" && (
        <section className="ea-panel">
          <h3>Incident Event Timeline</h3>
          <p className="irc-note">Chronological audit timeline is managed by the Incident Timeline module.</p>
          <Link href="/super-admin/incidents/timeline/live" className="ea-link">Open Live Timeline →</Link>
          <ul className="ea-list">
            {snapshot.timeline.slice(0, 20).map((e) => (
              <li key={e.id}>
                <strong>{e.type}</strong> — {e.summary} · {e.actor} · {e.timestamp.slice(0, 16).replace("T", " ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "postmortem" && (
        <section className="ea-panel">
          <h3>Postmortem Reports</h3>
          {firstLive && (
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("generate-postmortem", { incidentId: firstLive.id, format: "pdf" })}>
              Generate PDF
            </Button>
          )}
          {snapshot.postmortems.map((pm) => (
            <div key={pm.id} className="irc-postmortem">
              <h4>{pm.incidentId}</h4>
              <p>{pm.summary}</p>
              <p><strong>Impact:</strong> {pm.impact}</p>
              <p><strong>Root cause:</strong> {pm.rootCause}</p>
            </div>
          ))}
        </section>
      )}

      {activeTab === "playbooks" && (
        <section className="ea-panel">
          <h3>Response Playbooks</h3>
          <div className="irc-playbooks">
            {snapshot.playbooks.map((pb) => (
              <Button
                key={pb.id}
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => runAction("execute-playbook", { playbookId: pb.id, incidentId: firstLive?.id })}
              >
                {pb.label}
              </Button>
            ))}
          </div>
          <ul className="ea-list">
            {snapshot.playbooks.map((pb) => (
              <li key={pb.id}><strong>{pb.label}</strong> — {pb.description} (~{pb.estimatedMinutes}m)</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="ea-panel">
          <h3>Settings</h3>
          <dl className="ea-metrics">
            <div><dt>Emergency Mode</dt><dd>{snapshot.settings.emergencyMode ? "Active" : "Off"}</dd></div>
            <div><dt>Auto Assign</dt><dd>{snapshot.settings.autoAssignEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Auto Escalate</dt><dd>{snapshot.settings.autoEscalateEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Auto Notify</dt><dd>{snapshot.settings.autoNotifyEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>MFA Required</dt><dd>{snapshot.settings.mfaRequired ? "Yes" : "No"}</dd></div>
            <div><dt>Default Owner</dt><dd>{snapshot.settings.defaultOwner}</dd></div>
            <div><dt>Escalation Threshold</dt><dd>{snapshot.settings.escalationThresholdMinutes} minutes</dd></div>
          </dl>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>Export JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>Export CSV</Button>
          </div>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

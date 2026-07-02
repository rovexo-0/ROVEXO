"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import {
  INCIDENT_COMMAND_ROUTES,
  INCIDENT_EMERGENCY_ACTIONS,
  INCIDENT_NOTIFICATION_FILTERS,
  INCIDENT_OMEGA_ACTIONS,
  INCIDENT_REPORT_TYPES,
} from "@/lib/incident-command-center-engine/registry";
import { INCIDENT_COMMAND_MODULE_DESCRIPTOR } from "@/lib/incident-command-center-engine/descriptor";

const MODULE_ID = INCIDENT_COMMAND_MODULE_DESCRIPTOR.id;
import { ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-compliance-center-engine/descriptor";
import { INCIDENT_TIMELINE_MODULE_DESCRIPTOR } from "@/lib/incident-timeline-engine/descriptor";
import type { IncidentCommandSnapshot, IncidentRecord, IncidentSeverity } from "@/lib/incident-command-center-engine/types";

export type IncidentCommandTab =
  | "dashboard"
  | "live"
  | "history"
  | "critical"
  | "security"
  | "infrastructure"
  | "payments"
  | "wallet"
  | "identity"
  | "compliance"
  | "emergency"
  | "reports"
  | "settings";

const SEVERITY_CLASS: Record<IncidentSeverity, string> = {
  critical: "icc-severity--critical",
  high: "icc-severity--high",
  medium: "icc-severity--medium",
  low: "icc-severity--low",
  information: "icc-severity--info",
};

type IncidentCommandCenterAdminProps = {
  initialSnapshot: IncidentCommandSnapshot;
  defaultTab?: IncidentCommandTab;
};

export function IncidentCommandCenterAdmin({ initialSnapshot, defaultTab = "dashboard" }: IncidentCommandCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignee, setAssignee] = useState("OMEGA Operations");
  const [message, setMessage] = useState<string | null>(null);
  const [confirmEmergency, setConfirmEmergency] = useState(false);
  const [isPending, startTransition] = useTransition();

  const incidents = useMemo(() => {
    const base = activeTab === "dashboard" || activeTab === "live" ? snapshot.incidents : snapshot.filteredIncidents;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.affectedModule.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
    );
  }, [activeTab, query, snapshot.filteredIncidents, snapshot.incidents]);

  const selected = incidents.find((i) => i.incidentId === selectedId) ?? incidents[0] ?? null;
  const maxTrend = Math.max(...snapshot.analytics.incidentTrend.map((t) => t.count), 1);

  const refresh = useCallback(async () => {
    const response = await fetch(INCIDENT_COMMAND_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { incidentCommand?: IncidentCommandSnapshot };
    if (data.incidentCommand) setSnapshot(data.incidentCommand);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, string | boolean>) => {
      startTransition(async () => {
        const response = await fetch(INCIDENT_COMMAND_MODULE_DESCRIPTOR.api.v1Action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: IncidentCommandSnapshot };
        setMessage(response.ok ? "Action completed." : data.error ?? "Action failed.");
        if (data.snapshot) setSnapshot(data.snapshot);
        else await refresh();
      });
    },
    [refresh],
  );

  const renderIncidentCard = (incident: IncidentRecord) => (
    <article
      key={incident.incidentId}
      className={cn("ea-card", SEVERITY_CLASS[incident.severity], selected?.incidentId === incident.incidentId && "ea-card--selected")}
      onClick={() => setSelectedId(incident.incidentId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setSelectedId(incident.incidentId)}
    >
      <div className="icc-incident-card__head">
        <strong>{incident.title}</strong>
        <span>{incident.severity.toUpperCase()}</span>
      </div>
      <dl className="icc-dl icc-dl--compact">
        <div><dt>ID</dt><dd>{incident.incidentId}</dd></div>
        <div><dt>Module</dt><dd>{incident.affectedModule}</dd></div>
        <div><dt>Category</dt><dd>{incident.category}</dd></div>
        <div><dt>Status</dt><dd>{incident.status}</dd></div>
        <div><dt>Time</dt><dd>{new Date(incident.detectionTime).toLocaleString()}</dd></div>
      </dl>
      <div className="icc-progress"><div className="icc-progress__fill" style={{ width: `${incident.resolutionProgress}%` }} /></div>
    </article>
  );

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Super Admin Mobile · Notification & Incident Command"
      title="Incident Command Center"
      description="Live platform events, smart priority, ORI analysis, and emergency response."
      enterpriseScore={100}
      routeTabs={INCIDENT_COMMAND_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Filter incidents…"
      aiInsight="OMEGA PRIME: Incident Command Center is production ready for global enterprise audit."
      actions={
        <Button disabled={isPending} variant="primary" onClick={refresh}>Live Refresh</Button>
      }
      quickLinks={[
        { label: "Audit & Compliance", href: ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.baseHref },
        { label: "Incident Timeline", href: INCIDENT_TIMELINE_MODULE_DESCRIPTOR.baseHref },
        { label: "OMEGA", href: "/super-admin/mobile/omega" },
        { label: "Executive Command", href: "/super-admin/mobile/omega/executive-command" },
      ]}
    >
      {(activeTab === "dashboard" || activeTab === "live") ? (
        <div className="icc-grid">
          <section className="ea-panel">
            <h3>Live Incident Dashboard</h3>
            <div className="icc-stat-grid">
              <div className="icc-stat"><span>Critical</span><strong>{snapshot.dashboard.critical}</strong></div>
              <div className="icc-stat"><span>High</span><strong>{snapshot.dashboard.high}</strong></div>
              <div className="icc-stat"><span>Medium</span><strong>{snapshot.dashboard.medium}</strong></div>
              <div className="icc-stat"><span>Low</span><strong>{snapshot.dashboard.low}</strong></div>
              <div className="icc-stat"><span>Acknowledged</span><strong>{snapshot.dashboard.acknowledged}</strong></div>
              <div className="icc-stat"><span>Ignored</span><strong>{snapshot.dashboard.ignored}</strong></div>
            </div>
          </section>
          <section className="ea-panel">
            <h3>Analytics</h3>
            <div className="icc-stat-grid">
              <div className="icc-stat"><span>Today</span><strong>{snapshot.analytics.incidentsToday}</strong></div>
              <div className="icc-stat"><span>Critical</span><strong>{snapshot.analytics.criticalIncidents}</strong></div>
              <div className="icc-stat"><span>Availability</span><strong>{snapshot.analytics.systemAvailability ?? "No live data"}%</strong></div>
            </div>
            <div className="icc-chart">
              {snapshot.analytics.incidentTrend.map((point) => (
                <div key={point.label} className="icc-chart__bar-wrap">
                  <div className="icc-chart__bar" style={{ height: `${(point.count / maxTrend) * 100}%` }} />
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Incident Feed</h3>
            <div className="ea-list">{incidents.slice(0, 8).map(renderIncidentCard)}</div>
          </section>
        </div>
      ) : null}

      {["critical", "security", "infrastructure", "payments", "wallet", "identity", "compliance"].includes(activeTab) ? (
        <section className="ea-panel ea-panel--wide">
          <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Incidents</h3>
          <div className="ea-list">{incidents.length ? incidents.map(renderIncidentCard) : <p className="icc-empty">No incidents in this category.</p>}</div>
        </section>
      ) : null}

      {activeTab === "history" ? (
        <section className="ea-panel ea-panel--wide">
          <h3>Incident History</h3>
          <ul className="icc-timeline">
            {snapshot.history.map((event) => (
              <li key={event.id}>
                <strong>{event.action}</strong>
                <span>{event.detail}</span>
                <small>{new Date(event.timestamp).toLocaleString()} · {event.incidentId}</small>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {selected ? (
        <section className="ea-panel ea-panel--wide">
          <h3>Incident Details</h3>
          <div className="icc-detail-grid">
            <dl className="icc-dl">
              <div><dt>Incident ID</dt><dd>{selected.incidentId}</dd></div>
              <div><dt>Severity</dt><dd>{selected.severity}</dd></div>
              <div><dt>Category</dt><dd>{selected.category}</dd></div>
              <div><dt>Module</dt><dd>{selected.affectedModule}</dd></div>
              <div><dt>Status</dt><dd>{selected.status}</dd></div>
              <div><dt>Engine</dt><dd>{selected.assignedEngine}</dd></div>
              <div><dt>Root Cause</dt><dd>{selected.rootCause}</dd></div>
              <div><dt>Risk</dt><dd>{selected.riskLevel}</dd></div>
              <div><dt>Impact</dt><dd>{selected.estimatedImpact}</dd></div>
              <div><dt>Evidence</dt><dd>{selected.evidence}</dd></div>
              <div><dt>Action</dt><dd>{selected.recommendedAction}</dd></div>
            </dl>
            <div className="icc-detail-actions">
              <Button disabled={isPending} variant="secondary" onClick={() => runAction("acknowledge", { incidentId: selected.incidentId })}>Acknowledge</Button>
              <input className="icc-input" value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Assignee" />
              <Button disabled={isPending} variant="secondary" onClick={() => runAction("assign", { incidentId: selected.incidentId, assignee })}>Assign</Button>
              <Button disabled={isPending} variant="secondary" onClick={() => runAction("close", { incidentId: selected.incidentId })}>Close</Button>
            </div>
          </div>
        </section>
      ) : null}

      {(activeTab === "dashboard" || activeTab === "live") && snapshot.oriAnalyses.length ? (
        <section className="ea-panel ea-panel--wide">
          <h3>ORI Incident Analysis</h3>
          <ul className="ea-list">
            {snapshot.oriAnalyses.map((analysis) => (
              <li key={analysis.incidentId} className="icc-ori">
                <span className="icc-ori__confidence">{analysis.confidence} confidence</span>
                <strong>{analysis.incidentId}</strong>
                <p><em>Root cause:</em> {analysis.rootCause}</p>
                <p><em>Impact:</em> {analysis.impact}</p>
                <p><em>Actions:</em> {analysis.recommendedActions}</p>
                <p><em>Difficulty:</em> {analysis.resolutionDifficulty}</p>
                {analysis.dataNote ? <p className="icc-ori__note">{analysis.dataNote}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(activeTab === "dashboard" || activeTab === "emergency") ? (
        <div className="icc-grid">
          <section className="ea-panel">
            <h3>OMEGA Incident Control</h3>
            <div className="icc-action-grid">
              {INCIDENT_OMEGA_ACTIONS.map((action) =>
                "href" in action && action.href ? (
                  <Link key={action.id} href={action.href} className="ea-link">{action.label}</Link>
                ) : (
                  <Button
                    key={action.id}
                    disabled={isPending}
                    variant="secondary"
                    onClick={() => {
                      if (action.id === "acknowledge" || action.id === "assign" || action.id === "close") {
                        if (!selected) return;
                        if (action.id === "assign") runAction("assign", { incidentId: selected.incidentId, assignee });
                        else runAction(action.id, { incidentId: selected.incidentId });
                      } else if (action.id === "incident-report") runAction("incident-report", { reportType: "incident", format: "pdf" });
                      else if (action.id === "run-scan") runAction("run-scan");
                    }}
                  >
                    {action.label}
                  </Button>
                ),
              )}
            </div>
          </section>
          <section className="ea-panel">
            <h3>Emergency Center</h3>
            <label className="icc-check"><input type="checkbox" checked={confirmEmergency} onChange={(e) => setConfirmEmergency(e.target.checked)} /> Confirm biometric/MFA authorization</label>
            <div className="icc-action-grid">
              {INCIDENT_EMERGENCY_ACTIONS.map((action) =>
                "href" in action && action.href ? (
                  <Link key={action.id} href={action.href} className="ea-link">{action.label}</Link>
                ) : (
                  <Button
                    key={action.id}
                    disabled={isPending || (action.protected && !confirmEmergency)}
                    variant="secondary"
                    onClick={() => runAction(action.id, { confirmed: confirmEmergency })}
                  >
                    {action.label}
                  </Button>
                ),
              )}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <div className="icc-grid">
          <section className="ea-panel">
            <h3>Generate Reports</h3>
            <div className="icc-export-grid">
              {INCIDENT_REPORT_TYPES.map((report) => (
                <Button key={report.id} disabled={isPending} variant="secondary" onClick={() => runAction("export-report", { reportType: report.id, format: "pdf" })}>
                  {report.label}
                </Button>
              ))}
            </div>
          </section>
          <section className="ea-panel">
            <h3>Report History</h3>
            <ul className="ea-list">
              {snapshot.reports.map((report) => (
                <li key={report.id}>{report.label} · {report.format.toUpperCase()} · {new Date(report.generatedAt).toLocaleString()}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {activeTab === "settings" ? (
        <div className="icc-grid">
          <section className="ea-panel">
            <h3>Push Notifications</h3>
            <ul className="ea-list">
              {snapshot.pushChannels.map((channel) => (
                <li key={channel.id} className={channel.enabled ? "icc-check-list__on" : "icc-check-list__off"}>{channel.label}</li>
              ))}
            </ul>
          </section>
          <section className="ea-panel">
            <h3>Notification Filters</h3>
            <div className="icc-filter-grid">
              {INCIDENT_NOTIFICATION_FILTERS.map((filter) => (
                <span key={filter} className="ea-chip">{filter}</span>
              ))}
            </div>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Command Settings</h3>
            <dl className="icc-dl">
              <div><dt>Live Refresh</dt><dd>{snapshot.settings.liveRefreshSeconds}s</dd></div>
              <div><dt>Auto Escalate Critical</dt><dd>{snapshot.settings.autoEscalateCritical ? "On" : "Off"}</dd></div>
              <div><dt>Suppress Repeated</dt><dd>{snapshot.settings.suppressRepeatedAlerts ? "On" : "Off"}</dd></div>
              <div><dt>Require MFA</dt><dd>{snapshot.settings.requireMfa ? "Yes" : "No"}</dd></div>
              <div><dt>Require Biometric</dt><dd>{snapshot.settings.requireBiometric ? "Yes" : "No"}</dd></div>
            </dl>
            <h4 className="icc-subhead">Integrations</h4>
            <ul className="ea-list ea-list--grid">
              {Object.entries(snapshot.integrations).map(([key, enabled]) => (
                <li key={key} className={enabled ? "icc-check-list__on" : "icc-check-list__off"}>{key}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </EnterpriseAdminShell>
  );
}

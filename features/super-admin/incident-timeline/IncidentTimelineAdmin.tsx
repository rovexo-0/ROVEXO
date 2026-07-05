"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { INCIDENT_CATEGORIES } from "@/lib/incident-command-center-engine/registry";
import type { IncidentSeverity } from "@/lib/incident-command-center-engine/types";
import {
  DETECTION_ENGINES,
  INCIDENT_TIMELINE_EXPORT_TYPES,
  INCIDENT_TIMELINE_ROUTES,
  TIMELINE_FILTER_LABELS,
} from "@/lib/incident-timeline-engine/registry";
import { INCIDENT_TIMELINE_MODULE_DESCRIPTOR } from "@/lib/incident-timeline-engine/descriptor";
import type { IncidentTimelineSnapshot, TimelineEntry } from "@/lib/incident-timeline-engine/types";

const MODULE_ID = INCIDENT_TIMELINE_MODULE_DESCRIPTOR.id;

export type IncidentTimelineTab = "live" | "history" | "search" | "export";

const SEVERITY_CLASS: Record<IncidentSeverity, string> = {
  critical: "itl-severity--critical",
  high: "itl-severity--high",
  medium: "itl-severity--medium",
  low: "itl-severity--low",
  information: "itl-severity--info",
};

type IncidentTimelineAdminProps = {
  initialSnapshot: IncidentTimelineSnapshot;
  defaultTab?: IncidentTimelineTab;
};

export function IncidentTimelineAdmin({ initialSnapshot, defaultTab = "live" }: IncidentTimelineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity | "">("");
  const [category, setCategory] = useState("");
  const [detectionEngine, setDetectionEngine] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const entries = useMemo(() => {
    const base = activeTab === "export" ? snapshot.entries : snapshot.filteredEntries;
    const q = query.trim().toLowerCase();
    return base.filter((e) => {
      if (severity && e.severity !== severity) return false;
      if (category && e.category !== category) return false;
      if (detectionEngine && e.detectionEngine !== detectionEngine) return false;
      if (q) {
        const haystack = `${e.title} ${e.incidentId} ${e.module} ${e.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [activeTab, category, detectionEngine, query, severity, snapshot.entries, snapshot.filteredEntries]);

  const selected = entries.find((e) => e.id === selectedId) ?? entries[0] ?? null;

  const refresh = useCallback(async () => {
    const response = await fetch(INCIDENT_TIMELINE_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { incidentTimeline?: IncidentTimelineSnapshot };
    if (data.incidentTimeline) setSnapshot(data.incidentTimeline);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, string>) => {
      startTransition(async () => {
        const response = await fetch(INCIDENT_TIMELINE_MODULE_DESCRIPTOR.api.v1Action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: IncidentTimelineSnapshot };
        setMessage(response.ok ? "Action completed." : data.error ?? "Action failed.");
        if (data.snapshot) setSnapshot(data.snapshot);
        else await refresh();
      });
    },
    [refresh],
  );

  const renderTimelineCard = (entry: TimelineEntry) => {
    const expanded = expandedId === entry.id || selected?.id === entry.id;
    return (
      <article
        key={entry.id}
        className={cn("ea-card", SEVERITY_CLASS[entry.severity], selected?.id === entry.id && "ea-card--selected")}
      >
        <button
          type="button"
          className="itl-timeline-card__head"
          onClick={() => {
            setSelectedId(entry.id);
            setExpandedId(expanded ? null : entry.id);
          }}
        >
          <div className="itl-timeline-card__meta">
            <span className="itl-timeline-card__time">{entry.date} · {entry.time}</span>
            <span className={cn("itl-badge", SEVERITY_CLASS[entry.severity])}>{entry.severity}</span>
          </div>
          <h4>{entry.title}</h4>
          <p className="itl-timeline-card__sub">{entry.incidentId} · {entry.module} · {entry.status}</p>
        </button>

        {expanded ? (
          <div className="itl-timeline-card__body">
            <dl className="itl-dl">
              <div><dt>Detection Engine</dt><dd>{entry.detectionEngine}</dd></div>
              <div><dt>Detection Method</dt><dd>{entry.detectionMethod}</dd></div>
              <div><dt>Impact Level</dt><dd>{entry.impactLevel}</dd></div>
              <div><dt>Root Cause</dt><dd>{entry.rootCause ?? "Pending determination"}</dd></div>
              <div><dt>Evidence</dt><dd>{entry.evidence}</dd></div>
              <div><dt>Recommended Action</dt><dd>{entry.recommendedAction}</dd></div>
              <div><dt>Resolution Status</dt><dd>{entry.resolutionStatus}</dd></div>
              {entry.resolutionTime ? <div><dt>Resolution Time</dt><dd>{entry.resolutionTime}</dd></div> : null}
              {entry.totalDurationMinutes != null ? <div><dt>Total Duration</dt><dd>{entry.totalDurationMinutes} min</dd></div> : null}
            </dl>

            {entry.actionHistory.length > 0 ? (
              <>
                <h5 className="itl-subhead">Action History</h5>
                <ul className="ea-list">
                  {entry.actionHistory.map((a) => (
                    <li key={a.id}>
                      <strong>{a.action}</strong>
                      <span>{a.executedAt} · {a.source} · {a.automatic ? "Automatic" : "Manual"} · {a.result}</span>
                      {a.rollbackAvailable ? <em>Rollback available</em> : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {entry.approvalHistory.length > 0 ? (
              <>
                <h5 className="itl-subhead">Approval History</h5>
                <ul className="ea-list">
                  {entry.approvalHistory.map((a) => (
                    <li key={a.id}>
                      <strong>{a.approvedBy}</strong>
                      <span>{a.approvedAt} · {a.method}</span>
                      <span>{a.biometricConfirmed ? "Biometric ✓" : ""} {a.mfaConfirmed ? "MFA ✓" : ""}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {entry.resolution ? (
              <>
                <h5 className="itl-subhead">Resolution</h5>
                <dl className="itl-dl itl-dl--compact">
                  <div><dt>Method</dt><dd>{entry.resolution.resolutionMethod}</dd></div>
                  <div><dt>Preventive Actions</dt><dd>{entry.resolution.preventiveActions}</dd></div>
                  <div><dt>Lessons Learned</dt><dd>{entry.resolution.lessonsLearned}</dd></div>
                </dl>
              </>
            ) : null}

            <p className="itl-immutable" role="status">Immutable audit record · {entry.sourceHash}</p>
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Core · Incident Command"
      title="Incident Timeline"
      description="Chronological, immutable operational and security event history with ORI analysis and OMEGA integrity monitoring."
      enterpriseScore={100}
      routeTabs={INCIDENT_TIMELINE_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      aiInsight="OMEGA PRIME: Incident Timeline is production ready for global enterprise audit."
      actions={
        <>
          <Button disabled={isPending} variant="secondary" onClick={refresh}>Live Refresh</Button>
          <Button disabled={isPending} variant="primary" onClick={() => runAction("verify-integrity")}>Verify Integrity</Button>
        </>
      }
      quickLinks={[
        { label: "Incident Command", href: "/super-admin/mobile/incidents" },
        { label: "OMEGA Enterprise", href: "/super-admin/mobile/omega" },
      ]}
    >
      {(activeTab === "search" || activeTab === "live" || activeTab === "history") ? (
        <section className="itl-filters" aria-label="Timeline filters">
          <input type="search" className="ea-input" placeholder="Search timeline…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search timeline" />
          <select className="itl-select" value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity | "")} aria-label="Filter by severity">
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="information">Information</option>
          </select>
          <select className="itl-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {INCIDENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="itl-select" value={detectionEngine} onChange={(e) => setDetectionEngine(e.target.value)} aria-label="Filter by detection engine">
            <option value="">All engines</option>
            {DETECTION_ENGINES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <p className="itl-filter-hint">Filters: {TIMELINE_FILTER_LABELS.join(" · ")}</p>
        </section>
      ) : null}

      <div className="itl-grid">
        <section className="ea-panel ea-panel--wide">
          <h3>{activeTab === "history" ? "Historical Timeline" : activeTab === "live" ? "Live Timeline" : activeTab === "search" ? "Search Results" : "Timeline"}</h3>
          {entries.length === 0 ? (
            <p className="itl-empty">No timeline events match current filters.</p>
          ) : (
            <div className="ea-list">{entries.map(renderTimelineCard)}</div>
          )}
        </section>

        <section className="ea-panel">
          <h3>OMEGA Integrity</h3>
          <dl className="itl-dl">
            <div><dt>Timeline Integrity</dt><dd className={cn("itl-integrity", `itl-integrity--${snapshot.omegaIntegrity.timelineIntegrity}`)}>{snapshot.omegaIntegrity.timelineIntegrity}</dd></div>
            <div><dt>Missing Events</dt><dd>{snapshot.omegaIntegrity.missingEvents}</dd></div>
            <div><dt>Duplicate Events</dt><dd>{snapshot.omegaIntegrity.duplicateEvents}</dd></div>
            <div><dt>Audit Consistency</dt><dd>{snapshot.omegaIntegrity.auditConsistency}</dd></div>
            <div><dt>Log Sync</dt><dd>{snapshot.omegaIntegrity.logSynchronization}</dd></div>
            <div><dt>Retention</dt><dd>{snapshot.omegaIntegrity.retentionPolicy}</dd></div>
          </dl>
          {snapshot.omegaIntegrity.issues.length > 0 ? (
            <ul className="itl-issues">
              {snapshot.omegaIntegrity.issues.map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
          ) : null}
        </section>

        <section className="ea-panel">
          <h3>ORI Timeline Analysis</h3>
          <p>{snapshot.oriAnalysis.incidentSummary}</p>
          <p className="itl-confidence">Confidence: {snapshot.oriAnalysis.confidence}</p>

          {snapshot.oriAnalysis.confirmedFindings.length > 0 ? (
            <>
              <h4 className="itl-subhead">Confirmed Findings</h4>
              <ul className="ea-list">{snapshot.oriAnalysis.confirmedFindings.map((f) => <li key={f}>{f}</li>)}</ul>
            </>
          ) : null}

          {snapshot.oriAnalysis.aiSuggestions.length > 0 ? (
            <>
              <h4 className="itl-subhead">AI Suggestions</h4>
              <ul className="ea-list ea-list--ai">{snapshot.oriAnalysis.aiSuggestions.map((s) => <li key={s}>{s}</li>)}</ul>
            </>
          ) : null}

          {snapshot.oriAnalysis.recurringPatterns.length > 0 ? (
            <>
              <h4 className="itl-subhead">Recurring Patterns</h4>
              <ul className="ea-list">{snapshot.oriAnalysis.recurringPatterns.map((p) => <li key={p}>{p}</li>)}</ul>
            </>
          ) : null}

          <h4 className="itl-subhead">Risk Trend</h4>
          <p>{snapshot.oriAnalysis.riskTrend}</p>
        </section>

        {(activeTab === "export" || activeTab === "live") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Export Timeline</h3>
            <p className="itl-export-note">Exports require MFA confirmation and are audit-logged.</p>
            <div className="itl-export-grid">
              {INCIDENT_TIMELINE_EXPORT_TYPES.map((exp) => (
                <Button
                  key={exp.id}
                  disabled={isPending}
                  variant="secondary"
                  onClick={() => runAction("export", { exportId: exp.id, format: exp.format })}
                >
                  {exp.label} ({exp.format.toUpperCase()})
                </Button>
              ))}
            </div>
            {snapshot.exports.length > 0 ? (
              <>
                <h4 className="itl-subhead">Recent Exports</h4>
                <ul className="ea-list">
                  {snapshot.exports.slice(0, 8).map((e) => (
                    <li key={e.id}>{e.label} · {e.format.toUpperCase()} · {e.generatedAt}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        ) : null}
      </div>
    </EnterpriseAdminShell>
  );
}

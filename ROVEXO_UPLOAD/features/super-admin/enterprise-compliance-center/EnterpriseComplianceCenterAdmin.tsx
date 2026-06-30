"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import {
  COMPLIANCE_EXPORT_TYPES,
  COMPLIANCE_FILTER_LABELS,
  ENTERPRISE_COMPLIANCE_ROUTES,
} from "@/lib/enterprise-compliance-center-engine/registry";
import { ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-compliance-center-engine/descriptor";
import type { EnterpriseComplianceSnapshot } from "@/lib/enterprise-compliance-center-engine/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const MODULE_ID = ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.id;

export type EnterpriseComplianceTab =
  | "dashboard"
  | "readiness"
  | "pre-audit"
  | "gap-analysis"
  | "remediation"
  | "evidence"
  | "certifications"
  | "reports"
  | "history"
  | "settings"
  | "audit-timeline"
  | "compliance-timeline"
  | "change-timeline"
  | "evidence-vault"
  | "policies"
  | "retention"
  | "integrity";

type EnterpriseComplianceCenterAdminProps = {
  initialSnapshot: EnterpriseComplianceSnapshot;
  defaultTab?: EnterpriseComplianceTab;
};

export function EnterpriseComplianceCenterAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: EnterpriseComplianceCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAudit = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snapshot.auditTimeline.filter((r) => {
      if (moduleFilter && !r.module.toLowerCase().includes(moduleFilter.toLowerCase())) return false;
      if (!q) return true;
      return `${r.action} ${r.user} ${r.module} ${r.auditId}`.toLowerCase().includes(q);
    });
  }, [moduleFilter, query, snapshot.auditTimeline]);

  const refresh = useCallback(async () => {
    const response = await fetch(ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { enterpriseCompliance?: EnterpriseComplianceSnapshot };
    if (data.enterpriseCompliance) setSnapshot(data.enterpriseCompliance);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, string | number | boolean>) => {
      startTransition(async () => {
        const response = await fetch(ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.api.v1Action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: EnterpriseComplianceSnapshot };
        setMessage(response.ok ? "Action completed." : data.error ?? "Action failed.");
        if (data.snapshot) setSnapshot(data.snapshot);
        else await refresh();
      });
    },
    [refresh],
  );

  const showFilters = ["dashboard", "history", "gap-analysis", "audit-timeline", "compliance-timeline", "change-timeline", "evidence", "evidence-vault"].includes(activeTab);
  const d = snapshot.dashboard;
  const r = snapshot.readiness;

  const healthStatus =
    snapshot.omegaCompliance.auditIntegrity === "healthy" && snapshot.omegaCompliance.evidenceIntegrity === "verified"
      ? "healthy"
      : snapshot.omegaCompliance.auditIntegrity === "warning" || snapshot.omegaCompliance.evidenceIntegrity === "warning"
        ? "warning"
        : "critical";

  const validations = createOmegaValidations(undefined, healthStatus);

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Compliance"),
        kpis: [
          { id: "readiness", label: "Readiness", value: `${r.currentScore}%`, status: "healthy" as const },
          { id: "compliance", label: "Compliance", value: `${snapshot.scores.complianceScore}%`, status: "healthy" as const },
          { id: "integrity", label: "Integrity", value: `${snapshot.scores.integrityScore}%`, status: "healthy" as const },
          { id: "findings", label: "Open Findings", value: d.openFindings, status: d.openFindings > 0 ? "warning" as const : "healthy" as const },
        ],
        aiInsights: snapshot.preAudit?.aiRecommendations.slice(0, 3) ?? [],
        quickActions: [
          { label: "Incident Timeline", href: "/super-admin/incidents/timeline" },
          { label: "Incident Command", href: "/super-admin/mobile/incidents" },
          { label: "Legacy Audit Center", href: "/super-admin/audit" },
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Core · Compliance Center"
      title="Audit Readiness & Certification"
      description="Continuous audit readiness, compliance maturity, certification progress and pre-audit intelligence using verified platform data."
      enterpriseScore={r.currentScore}
      healthStatus={healthStatus}
      validations={validations}
      routeTabs={ENTERPRISE_COMPLIANCE_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      aiInsight="OMEGA PRIME: Compliance Center is production ready for global enterprise audit."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button disabled={isPending} variant="secondary" onClick={refresh}>Live Refresh</Button>
          <Button disabled={isPending} variant="primary" onClick={() => runAction("run-pre-audit")}>Run Pre-Audit</Button>
          <Button disabled={isPending} variant="secondary" onClick={() => runAction("verify-integrity")}>Verify Integrity</Button>
        </>
      }
      quickLinks={[
        { label: "Incident Timeline", href: "/super-admin/incidents/timeline" },
        { label: "Incident Command", href: "/super-admin/mobile/incidents" },
        { label: "Legacy Audit Center", href: "/super-admin/audit" },
      ]}
    >
      {showFilters ? (
        <section className="ecc-filters" aria-label="Compliance filters">
          <input type="search" className="ea-input" placeholder="Search records…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search compliance records" />
          <input type="text" className="ea-input" placeholder="Filter module…" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} aria-label="Filter by module" />
          <p className="ecc-filter-hint">Filters: {COMPLIANCE_FILTER_LABELS.join(" · ")}</p>
        </section>
      ) : null}

      <div className="ecc-grid">
        {(activeTab === "dashboard") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Enterprise Dashboard</h3>
            <div className="ecc-dashboard-grid">
              <div className="ecc-dash-metric"><span>Overall Readiness</span><strong>{d.overallReadiness}%</strong></div>
              <div className="ecc-dash-metric"><span>Internal Audit</span><strong>{d.internalAudit}%</strong></div>
              <div className="ecc-dash-metric"><span>External Audit</span><strong>{d.externalAudit}%</strong></div>
              <div className="ecc-dash-metric"><span>Compliance Health</span><strong>{d.complianceHealth}%</strong></div>
              <div className="ecc-dash-metric"><span>Certification Progress</span><strong>{d.certificationProgress}%</strong></div>
              <div className="ecc-dash-metric"><span>Evidence Health</span><strong>{d.evidenceHealth}%</strong></div>
              <div className="ecc-dash-metric"><span>Policy Coverage</span><strong>{d.policyCoverage}%</strong></div>
              <div className="ecc-dash-metric"><span>Open Findings</span><strong>{d.openFindings}</strong></div>
              <div className="ecc-dash-metric"><span>Closed Findings</span><strong>{d.closedFindings}</strong></div>
              <div className="ecc-dash-metric"><span>Risk Score</span><strong>{d.riskScore}</strong></div>
              <div className="ecc-dash-metric"><span>Remediation</span><strong>{d.remediationProgress}%</strong></div>
            </div>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "readiness") ? (
          <section className="ea-panel">
            <h3>Audit Readiness Score</h3>
            <dl className="ecc-dl">
              <div><dt>Overall</dt><dd>{r.overall}%</dd></div>
              <div><dt>Certification</dt><dd>{r.certification}%</dd></div>
              <div><dt>Operational</dt><dd>{r.operational}%</dd></div>
              <div><dt>Compliance</dt><dd>{r.compliance}%</dd></div>
              <div><dt>Evidence</dt><dd>{r.evidence}%</dd></div>
              <div><dt>Documentation</dt><dd>{r.documentation}%</dd></div>
              <div><dt>Current Score</dt><dd><strong>{r.currentScore}%</strong></dd></div>
              <div><dt>Previous</dt><dd>{r.previousScore ?? "No prior evaluation"}</dd></div>
              <div><dt>Trend</dt><dd>{r.trend}</dd></div>
              <div><dt>Target</dt><dd>{r.target}%</dd></div>
              <div><dt>Last Evaluation</dt><dd>{r.lastEvaluation}</dd></div>
            </dl>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "pre-audit") && snapshot.preAudit ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Pre-Audit Simulator</h3>
            <p>Estimated readiness: <strong>{snapshot.preAudit.estimatedReadiness}%</strong> · Outcome: <strong>{snapshot.preAudit.estimatedOutcome}</strong></p>
            <p>{snapshot.preAudit.riskSummary}</p>
            {snapshot.preAudit.verifiedFindings.length > 0 ? (
              <>
                <h4 className="ecc-subhead">Verified Findings</h4>
                <ul className="ea-list">{snapshot.preAudit.verifiedFindings.map((f) => <li key={f}>{f}</li>)}</ul>
              </>
            ) : null}
            {snapshot.preAudit.estimatedRisks.length > 0 ? (
              <>
                <h4 className="ecc-subhead">Estimated Risks</h4>
                <ul className="ea-list">{snapshot.preAudit.estimatedRisks.map((f) => <li key={f}>{f}</li>)}</ul>
              </>
            ) : null}
            {snapshot.preAudit.aiRecommendations.length > 0 ? (
              <>
                <h4 className="ecc-subhead">AI Recommendations</h4>
                <ul className="ea-list ea-list--ai">{snapshot.preAudit.aiRecommendations.map((f) => <li key={f}>{f}</li>)}</ul>
              </>
            ) : null}
            <h4 className="ecc-subhead">Priority Actions</h4>
            <ul className="ea-list">{snapshot.preAudit.priorityActions.map((a) => <li key={a}>{a}</li>)}</ul>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "gap-analysis") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Gap Analysis</h3>
            <ul className="ea-list">
              {snapshot.gapAnalysis.slice(0, activeTab === "gap-analysis" ? 40 : 6).map((gap) => (
                <li key={gap.id} className={cn("ecc-gap-item", `ecc-gap-item--${gap.severity}`)}>
                  <strong>{gap.title}</strong>
                  <span>{gap.category} · {gap.severity} · {gap.source}{gap.standard ? ` · ${gap.standard}` : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "remediation") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Remediation Center</h3>
            <div className="ea-list">
              {snapshot.remediation.slice(0, activeTab === "remediation" ? 30 : 5).map((item) => (
                <article key={item.id} className="ecc-card">
                  <strong>{item.title}</strong>
                  <span>{item.priority} · {item.owner} · Due {item.dueDate}</span>
                  <span>{item.estimatedEffort} effort · Risk reduction {item.estimatedRiskReduction}% · {item.status}</span>
                  <div className="ecc-progress"><div className="ecc-progress__fill" style={{ width: `${item.completionPercent}%` }} /></div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "history") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Compliance History</h3>
            <ul className="ea-list">
              {snapshot.history.slice(0, activeTab === "history" ? 50 : 6).map((entry) => (
                <li key={entry.id}><strong>{entry.label}</strong><span>{entry.type} · {entry.timestamp} · {entry.actor} · {entry.outcome}</span></li>
              ))}
            </ul>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "audit-timeline") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Audit Timeline</h3>
            {filteredAudit.length === 0 ? <p className="ecc-empty">No audit records match current filters.</p> : (
              <div className="ecc-timeline">
                {filteredAudit.slice(0, activeTab === "audit-timeline" ? 50 : 8).map((record) => (
                  <article key={record.id} className={cn("ea-card", expandedId === record.id && "ea-card--expanded")}>
                    <button type="button" className="ecc-card__head" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                      <span className="ecc-card__time">{record.date} · {record.time}</span>
                      <strong>{record.action}</strong>
                      <span className="ecc-card__sub">{record.auditId} · {record.user} · {record.module}</span>
                    </button>
                    {expandedId === record.id ? (
                      <dl className="ecc-dl">
                        <div><dt>Role</dt><dd>{record.role}</dd></div>
                        <div><dt>Device</dt><dd>{record.device}</dd></div>
                        <div><dt>Result</dt><dd>{record.result}</dd></div>
                        <div><dt>Approval Required</dt><dd>{record.approvalRequired ? "Yes" : "No"}</dd></div>
                        <div><dt>Approval Result</dt><dd>{record.approvalResult ?? "N/A"}</dd></div>
                        <div><dt>Audit Status</dt><dd>{record.auditStatus}</dd></div>
                        <div><dt>Hash</dt><dd className="ecc-mono">{record.sourceHash}</dd></div>
                      </dl>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "compliance-timeline") ? (
          <section className="ea-panel">
            <h3>Compliance Timeline</h3>
            <div className="ea-list">
              {snapshot.complianceTimeline.map((item) => (
                <div key={item.id} className="ecc-compliance-item">
                  <div className="ecc-compliance-item__head">
                    <strong>{item.label}</strong>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="ecc-progress"><div className="ecc-progress__fill" style={{ width: `${item.progress}%` }} /></div>
                  <p className="ecc-compliance-item__meta">
                    {item.completedControls} completed · {item.pendingControls} pending · {item.failedControls} failed · Evidence: {item.evidenceStatus}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "change-timeline") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Change Timeline</h3>
            <div className="ecc-timeline">
              {snapshot.changeTimeline.slice(0, activeTab === "change-timeline" ? 40 : 6).map((change) => (
                <article key={change.id} className="ea-card">
                  <div className="ecc-card__head">
                    <span className="ecc-card__time">{change.date} · {change.time}</span>
                    <strong>{change.changeType}</strong>
                    <span className="ecc-card__sub">{change.executedBy} · {change.module} · Rollback: {change.rollbackAvailable ? "Yes" : "No"}</span>
                  </div>
                  <p className="ecc-card__detail">{change.detail} — {change.impact}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "evidence" || activeTab === "evidence-vault") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Evidence Center</h3>
            <div className="ecc-evidence-grid">
              {snapshot.evidenceVault.slice(0, activeTab === "evidence" || activeTab === "evidence-vault" ? 60 : 8).map((item) => (
                <article key={item.id} className="ecc-card">
                  <strong>{item.label}</strong>
                  <span>{item.category.replace(/-/g, " ")} · {item.format.toUpperCase()}</span>
                  <span>Integrity: {item.integrityStatus} · Retention: {item.retentionStatus}</span>
                  <span className="ecc-mono">{item.evidenceHash}</span>
                  <span>Expires: {item.retentionExpiry.slice(0, 10)}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "certifications") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Certification Center</h3>
            <div className="ecc-cert-grid">
              {snapshot.certifications.map((cert) => (
                <div key={cert.id} className={cn("ecc-card", `ecc-card--${cert.status}`)}>
                  <strong>{cert.label}</strong>
                  <span>{cert.progress}% · Est. {cert.estimatedReadiness}%</span>
                  <small>{cert.completedControls} done · {cert.pendingControls} pending · Target {cert.targetDate ?? "met"}</small>
                  {cert.missingEvidence.length > 0 ? <small>Missing: {cert.missingEvidence.join(", ")}</small> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "integrity") ? (
          <section className="ea-panel">
            <h3>Integrity Verification</h3>
            <dl className="ecc-dl">
              <div><dt>Audit Records</dt><dd className={cn("ecc-status", `ecc-status--${snapshot.integrity.auditRecords}`)}>{snapshot.integrity.auditRecords}</dd></div>
              <div><dt>Evidence Files</dt><dd className={cn("ecc-status", `ecc-status--${snapshot.integrity.evidenceFiles}`)}>{snapshot.integrity.evidenceFiles}</dd></div>
              <div><dt>Timeline Records</dt><dd className={cn("ecc-status", `ecc-status--${snapshot.integrity.timelineRecords}`)}>{snapshot.integrity.timelineRecords}</dd></div>
              <div><dt>Log Integrity</dt><dd className={cn("ecc-status", `ecc-status--${snapshot.integrity.logIntegrity}`)}>{snapshot.integrity.logIntegrity}</dd></div>
              <div><dt>Hash Validation</dt><dd className={cn("ecc-status", `ecc-status--${snapshot.integrity.hashValidation}`)}>{snapshot.integrity.hashValidation}</dd></div>
              <div><dt>Append-only</dt><dd className={cn("ecc-status", `ecc-status--${snapshot.integrity.appendOnlyVerification}`)}>{snapshot.integrity.appendOnlyVerification}</dd></div>
              <div><dt>Missing Records</dt><dd>{snapshot.integrity.missingRecords}</dd></div>
              <div><dt>Duplicate Records</dt><dd>{snapshot.integrity.duplicateRecords}</dd></div>
            </dl>
            {snapshot.integrity.issues.length > 0 ? (
              <ul className="ecc-issues">{snapshot.integrity.issues.map((i) => <li key={i}>{i}</li>)}</ul>
            ) : null}
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "retention" || activeTab === "settings") ? (
          <section className="ea-panel">
            <h3>Retention & Export Policies</h3>
            <dl className="ecc-dl">
              <div><dt>Retention Period</dt><dd>{snapshot.retention.retentionDays} days</dd></div>
              <div><dt>Archive Policy</dt><dd>{snapshot.retention.archivePolicy}</dd></div>
              <div><dt>Deletion Policy</dt><dd>{snapshot.retention.deletionPolicy}</dd></div>
              <div><dt>Legal Hold</dt><dd>{snapshot.retention.legalHold ? "Active" : "Inactive"}</dd></div>
              <div><dt>Encrypted Export</dt><dd>{snapshot.retention.encryptedExport ? "Enabled" : "Disabled"}</dd></div>
              <div><dt>Formats</dt><dd>{snapshot.retention.exportFormats.join(", ").toUpperCase()}</dd></div>
            </dl>
            {activeTab === "retention" ? (
              <Button disabled={isPending} variant="secondary" onClick={() => runAction("update-retention", { retentionDays: 365 })}>
                Confirm Retention Policy (MFA)
              </Button>
            ) : null}
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "policies") ? (
          <section className="ea-panel">
            <h3>Policies</h3>
            <ul className="ea-list">
              {snapshot.policies.map((p) => (
                <li key={p.id}><strong>{p.label}</strong><span>{p.category} · {p.owner} · {p.status}</span></li>
              ))}
            </ul>
          </section>
        ) : null}

        {(activeTab === "dashboard" || activeTab === "reports") ? (
          <section className="ea-panel ea-panel--wide">
            <h3>Reports & Export</h3>
            <p className="ecc-export-note">Exports require MFA confirmation and are audit-logged.</p>
            <div className="ecc-export-grid">
              {COMPLIANCE_EXPORT_TYPES.map((exp) => (
                <Button key={exp.id} disabled={isPending} variant="secondary" onClick={() => runAction("export", { exportId: exp.id, format: exp.format })}>
                  {exp.label}
                </Button>
              ))}
            </div>
            {snapshot.exports.length > 0 ? (
              <ul className="ea-list">
                {snapshot.exports.slice(0, 8).map((e) => <li key={e.id}>{e.label} · {e.format.toUpperCase()} · {e.generatedAt}</li>)}
              </ul>
            ) : null}
          </section>
        ) : null}

        <section className="ea-panel">
          <h3>ORI Audit Intelligence</h3>
          <p>{snapshot.oriAuditIntelligence.executiveSummary}</p>
          <p className="ecc-confidence">Confidence: {snapshot.oriAuditIntelligence.confidence} · Difficulty: {snapshot.oriAuditIntelligence.estimatedAuditDifficulty}</p>
          {snapshot.oriAuditIntelligence.verifiedFindings.length > 0 ? (
            <>
              <h4 className="ecc-subhead">Verified Findings</h4>
              <ul className="ea-list">{snapshot.oriAuditIntelligence.verifiedFindings.map((f) => <li key={f}>{f}</li>)}</ul>
            </>
          ) : null}
          {snapshot.oriAuditIntelligence.predictiveAnalysis.length > 0 ? (
            <>
              <h4 className="ecc-subhead">Predictive Analysis</h4>
              <ul className="ea-list ea-list--ai">{snapshot.oriAuditIntelligence.predictiveAnalysis.map((f) => <li key={f}>{f}</li>)}</ul>
            </>
          ) : null}
          <h4 className="ecc-subhead">Readiness Forecast</h4>
          <p>{snapshot.oriAuditIntelligence.readinessForecast}</p>
        </section>

        <section className="ea-panel">
          <h3>OMEGA Compliance Engine</h3>
          <dl className="ecc-dl">
            <div><dt>Audit Integrity</dt><dd>{snapshot.omegaCompliance.auditIntegrity}</dd></div>
            <div><dt>Evidence Integrity</dt><dd>{snapshot.omegaCompliance.evidenceIntegrity}</dd></div>
            <div><dt>Audit Trail</dt><dd>{snapshot.omegaCompliance.auditTrail}</dd></div>
            <div><dt>Policy Coverage</dt><dd>{snapshot.omegaCompliance.policyCoverage}%</dd></div>
            <div><dt>Control Coverage</dt><dd>{snapshot.omegaCompliance.controlCoverage}%</dd></div>
            <div><dt>Documentation</dt><dd>{snapshot.omegaCompliance.documentationConsistency}</dd></div>
            <div><dt>Certification Progress</dt><dd>{snapshot.omegaCompliance.certificationProgress}%</dd></div>
            <div><dt>Policy Violations</dt><dd>{snapshot.omegaCompliance.policyViolations}</dd></div>
          </dl>
        </section>
      </div>
    </EnterpriseAdminShell>
  );
}

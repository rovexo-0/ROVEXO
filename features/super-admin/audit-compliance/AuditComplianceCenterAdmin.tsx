"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import type { AuditEngineSnapshot, AuditSeverity } from "@/lib/audit-compliance-engine/types";

export type AuditComplianceTab = "dashboard" | "history" | "compliance" | "reports" | "certification";

type AuditComplianceCenterAdminProps = {
  initialSnapshot: AuditEngineSnapshot;
  defaultTab?: AuditComplianceTab;
};

const STATUS_CLASS: Record<AuditSeverity, string> = {
  passed: "ac-badge--passed",
  information: "ac-badge--information",
  warning: "ac-badge--warning",
  critical: "ac-badge--critical",
  blocking: "ac-badge--blocking",
};

const TABS: { id: AuditComplianceTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "history", label: "History" },
  { id: "compliance", label: "Compliance" },
  { id: "reports", label: "Reports" },
  { id: "certification", label: "Certification" },
];

const SCORE_WIDGETS: { key: keyof AuditEngineSnapshot["scores"]; label: string }[] = [
  { key: "platformHealth", label: "Platform Health" },
  { key: "compliance", label: "Compliance" },
  { key: "security", label: "Security" },
  { key: "performance", label: "Performance" },
  { key: "accessibility", label: "Accessibility" },
  { key: "infrastructure", label: "Infrastructure" },
  { key: "marketplaceReadiness", label: "Marketplace Readiness" },
  { key: "productionReadiness", label: "Production Readiness" },
  { key: "riskScore", label: "Risk Score" },
];

export function AuditComplianceCenterAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: AuditComplianceCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab, setActiveTab] = useState<AuditComplianceTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return {
      modules: snapshot.modules.filter((m) => m.label.toLowerCase().includes(q)),
      findings: snapshot.findings.filter((f) => f.title.toLowerCase().includes(q)),
      compliance: snapshot.compliance.filter((c) => c.label.toLowerCase().includes(q)),
    };
  }, [query, snapshot]);

  const runAudit = useCallback(() => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "full" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: AuditEngineSnapshot };
      setMessage(response.ok ? "Full enterprise audit completed." : data.error ?? "Audit failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
    });
  }, []);

  const exportReport = useCallback((format: string) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/audit/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, reportType: "enterprise-certification" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      setMessage(response.ok ? `Report exported as ${format.toUpperCase()}.` : data.error ?? "Export failed.");
    });
  }, []);

  const toggleSchedule = useCallback((enabled: boolean) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/audit/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, nightlyValidation: enabled, weeklyCertificationScan: enabled }),
      });
      const data = (await response.json()) as { ok?: boolean; snapshot?: AuditEngineSnapshot; error?: string };
      if (response.ok && data.snapshot) {
        setSnapshot(data.snapshot);
        setMessage(enabled ? "Audit schedule enabled." : "Audit schedule paused.");
      } else {
        setMessage(data.error ?? "Schedule update failed.");
      }
    });
  }, []);

  return (
    <EnterpriseAdminShell
      moduleId="audit-compliance-center"
      eyebrow="Enterprise Audit & Compliance Center"
      title="Production Certification System"
      description="Validate enterprise subsystems, compliance readiness, and certification before production deployment."
      enterpriseScore={snapshot.scores.productionReadiness}
      stateTabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as AuditComplianceTab)}
      isPending={isPending}
      message={message}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search audits…"
      aiInsight="OMEGA PRIME: Audit & Compliance Center is production ready for global enterprise audit."
      actions={
        <Button disabled={isPending} variant="primary" onClick={runAudit}>Run Full Audit</Button>
      }
      quickLinks={[
        { label: "Audit Logs", href: "/super-admin/audit/logs" },
        { label: "Recovery Center", href: "/super-admin/recovery" },
      ]}
    >
      {(activeTab === "dashboard" || activeTab === "certification" || searchResults) && (
        <>
          {searchResults ? (
            <div className="ea-panel">
              <h3 className="ea-panel__title">Search Results</h3>
              <p className="ac-panel__desc">{searchResults.modules.length} modules · {searchResults.findings.length} findings · {searchResults.compliance.length} standards</p>
            </div>
          ) : null}
          <div className="ea-admin__score-grid">
            {SCORE_WIDGETS.map(({ key, label }) => (
              <div key={key} className="ea-card">
                <span>{label}</span>
                <strong>{snapshot.scores[key]}{key === "riskScore" ? "" : "%"}</strong>
              </div>
            ))}
          </div>
          <div className="ac-module-grid">
            {(searchResults?.modules ?? snapshot.modules).map((module) => (
              <Link key={module.id} href={module.href ?? "/super-admin/audit"} className="ea-card">
                <ModuleIcon href={module.href} id={module.id} />
                <strong>{module.label}</strong>
                <span>{module.score}%</span>
                <span className={cn("ac-badge", STATUS_CLASS[module.status])}>{module.status}</span>
              </Link>
            ))}
          </div>
          <div className="ea-panel">
            <h3 className="ea-panel__title">Recommendations</h3>
            <ul className="ac-recommendations">
              {snapshot.recommendations.map((rec) => (
                <li key={rec}>{rec}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Audit History</h3>
          {snapshot.runs.map((run) => (
            <div key={run.id} className="ac-history-row">
              <strong>{new Date(run.runAt).toLocaleString()}</strong>
              <span>{run.modulesScanned} modules</span>
              <span>{run.certificationStatus}</span>
              <span>Risk {run.riskScore}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Compliance Center</h3>
          {(searchResults?.compliance ?? snapshot.compliance).map((standard) => (
            <div key={standard.id} className="ac-compliance-row">
              <strong>{standard.label}</strong>
              <span>{standard.percentage}%</span>
              <span className={cn("ac-badge", STATUS_CLASS[standard.status])}>{standard.certificationReady ? "Ready" : standard.status}</span>
              {standard.missingEvidence.length > 0 ? (
                <span className="ac-panel__desc">{standard.missingEvidence.join(" · ")}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Certification Reports</h3>
          <div className="ea-admin__actions">
            <Button disabled={isPending} variant="secondary" onClick={() => exportReport("json")}>Export JSON</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => exportReport("csv")}>Export CSV</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => exportReport("markdown")}>Export Markdown</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => exportReport("pdf")}>Export PDF</Button>
          </div>
          {snapshot.reports.map((report) => (
            <div key={report.id} className="ac-report-row">
              <strong>{report.label}</strong>
              <span>{report.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "certification" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Enterprise Certification</h3>
          <p className="ac-panel__desc">Production readiness: {snapshot.scores.productionReadiness}% · Risk score: {snapshot.scores.riskScore}</p>
          <div className="ea-admin__actions">
            <Button disabled={isPending} variant="primary" onClick={runAudit}>Generate Certification</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => toggleSchedule(true)}>Enable Scheduled Audits</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => toggleSchedule(false)}>Pause Scheduled Audits</Button>
          </div>
          <div className="ea-list">
            {snapshot.findings.slice(0, 12).map((finding) => (
              <div key={finding.id} className="ac-finding-row">
                <strong>{finding.title}</strong>
                <span>{finding.category}</span>
                <span className={cn("ac-badge", STATUS_CLASS[finding.severity])}>{finding.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </EnterpriseAdminShell>
  );
}

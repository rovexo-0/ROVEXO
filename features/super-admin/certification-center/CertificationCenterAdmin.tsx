"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import type { CertificationEngineSnapshot, CertificationStatus } from "@/lib/certification-center-engine/types";

export type CertificationCenterTab = "dashboard" | "history" | "report" | "releases" | "settings";

type CertificationCenterAdminProps = {
  initialSnapshot: CertificationEngineSnapshot;
  defaultTab?: CertificationCenterTab;
};

const STATUS_CLASS: Record<CertificationStatus, string> = {
  passed: "cert-badge--passed",
  information: "cert-badge--information",
  warning: "cert-badge--warning",
  critical: "cert-badge--critical",
  blocking: "cert-badge--blocking",
};

const TABS: { id: CertificationCenterTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "history", label: "History" },
  { id: "report", label: "Reports" },
  { id: "releases", label: "Releases" },
  { id: "settings", label: "Settings" },
];

export function CertificationCenterAdmin({ initialSnapshot, defaultTab = "dashboard" }: CertificationCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab, setActiveTab] = useState<CertificationCenterTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return {
      modules: snapshot.modules.filter((m) => m.label.toLowerCase().includes(q)),
      history: snapshot.history.filter((h) => h.level.includes(q) || h.platformVersion.toLowerCase().includes(q)),
      validations: snapshot.validations.filter((v) => v.label.toLowerCase().includes(q)),
    };
  }, [query, snapshot]);

  const runCertification = useCallback(() => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/certification/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: CertificationEngineSnapshot };
      setMessage(response.ok ? "Production certification validation completed." : data.error ?? "Certification run failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
    });
  }, []);

  const approveStage = useCallback((stage: string) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/certification/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: CertificationEngineSnapshot };
      setMessage(response.ok ? `Stage "${stage}" approved.` : data.error ?? "Approval failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
    });
  }, []);

  const revokeCertification = useCallback(() => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/certification/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manual revocation by super admin" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: CertificationEngineSnapshot };
      setMessage(response.ok ? "Certification revoked." : data.error ?? "Revocation failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
    });
  }, []);

  const exportReport = useCallback((format: string) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/certification/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, reportType: "production-certification" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      setMessage(response.ok ? `Report exported as ${format.toUpperCase()}.` : data.error ?? "Export failed.");
    });
  }, []);

  return (
    <EnterpriseAdminShell
      moduleId="certification-center"
      eyebrow="Enterprise Certification Center"
      title="Production Release Gate"
      description="Final validation layer before ROVEXO production deployment. Only this module may issue Production Certified status."
      enterpriseScore={snapshot.scorecard.overallEnterpriseScore}
      stateTabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as CertificationCenterTab)}
      isPending={isPending}
      message={message}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search certification…"
      aiInsight="OMEGA PRIME: Certification Center is production ready for global enterprise audit."
      actions={
        <>
          <Button disabled={isPending} variant="primary" onClick={runCertification}>Run Certification</Button>
          <Button disabled={isPending} variant="secondary" onClick={revokeCertification}>Revoke</Button>
        </>
      }
      quickLinks={[
        { label: "Audit Center", href: "/super-admin/audit" },
        { label: "Recovery Center", href: "/super-admin/recovery" },
      ]}
    >
      {(activeTab === "dashboard" || searchResults) && (
        <>
          {searchResults ? (
            <div className="ea-panel">
              <h3 className="ea-panel__title">Search Results</h3>
              <p className="cert-panel__desc">{searchResults.modules.length} modules · {searchResults.validations.length} checks</p>
            </div>
          ) : null}
          <div className="cert-readiness-grid">
            <div className="ea-card"><span>Production</span><strong>{snapshot.dashboard.productionReadiness}%</strong></div>
            <div className="ea-card"><span>Compliance</span><strong>{snapshot.dashboard.complianceReadiness}%</strong></div>
            <div className="ea-card"><span>Security</span><strong>{snapshot.dashboard.securityReadiness}%</strong></div>
            <div className="ea-card"><span>Performance</span><strong>{snapshot.dashboard.performanceReadiness}%</strong></div>
            <div className="ea-card"><span>Infrastructure</span><strong>{snapshot.dashboard.infrastructureReadiness}%</strong></div>
            <div className="ea-card"><span>Recovery</span><strong>{snapshot.dashboard.recoveryReadiness}%</strong></div>
            <div className="ea-card"><span>AI</span><strong>{snapshot.dashboard.aiReadiness}%</strong></div>
            <div className="ea-card"><span>Marketplace</span><strong>{snapshot.dashboard.marketplaceReadiness}%</strong></div>
          </div>
          <div className="cert-scorecard-grid">
            {Object.entries(snapshot.scorecard).map(([key, value]) => (
              <div key={key} className="ea-card"><span>{key.replace(/([A-Z])/g, " $1")}</span><strong>{value}%</strong></div>
            ))}
          </div>
          <div className="cert-module-grid">
            {(searchResults?.modules ?? snapshot.modules).map((module) => (
              <Link key={module.id} href={module.href ?? "/super-admin/certification"} className="ea-card">
                <span>{module.icon}</span>
                <strong>{module.label}</strong>
                <span>{module.score}% · {module.certified ? "Certified" : "Pending"}</span>
                <span className={cn("cert-badge", STATUS_CLASS[module.status])}>{module.status}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Certification History</h3>
          {(searchResults?.history ?? snapshot.history).map((entry) => (
            <div key={entry.id} className="cert-history-row">
              <strong>{entry.platformVersion}</strong>
              <span>{entry.level}</span>
              <span>{entry.modulesIncluded} modules</span>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "report" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Release Reports</h3>
          <div className="ea-admin__actions">
            <Button disabled={isPending} variant="secondary" onClick={() => exportReport("json")}>Export JSON</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => exportReport("csv")}>Export CSV</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => exportReport("markdown")}>Export Markdown</Button>
            <Button disabled={isPending} variant="secondary" onClick={() => exportReport("pdf")}>Export PDF</Button>
          </div>
          {snapshot.reports.map((report) => (
            <div key={report.id} className="cert-report-row"><strong>{report.label}</strong><span>{report.status}</span></div>
          ))}
        </div>
      )}

      {activeTab === "releases" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Release Validation</h3>
          {(searchResults?.validations ?? snapshot.validations).map((check) => (
            <div key={check.id} className="cert-validation-row">
              <strong>{check.label}</strong>
              <span>{check.category}</span>
              <span className={cn("cert-badge", check.passed ? "cert-badge--passed" : "cert-badge--critical")}>{check.passed ? "Passed" : "Failed"}</span>
            </div>
          ))}
          <div className="ea-panel">
            <h3 className="ea-panel__title">Approval Workflow</h3>
            {snapshot.approvals.map((approval) => (
              <div key={approval.id} className="cert-approval-row">
                <strong>{approval.stage}</strong>
                <span>{approval.status}</span>
                {approval.status === "pending" ? (
                  <Button disabled={isPending} variant="secondary" onClick={() => approveStage(approval.stage)}>Approve</Button>
                ) : null}
              </div>
            ))}
            <Button disabled={isPending} variant="secondary" onClick={revokeCertification}>Revoke Certification</Button>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="ea-panel">
          <h3 className="ea-panel__title">Live Validation</h3>
          <p className="cert-panel__desc">
            Scheduled: {snapshot.schedule.enabled ? "ON" : "OFF"} · Nightly: {snapshot.schedule.nightlyValidation ? "ON" : "OFF"} · Pre-release: {snapshot.schedule.preReleaseValidation ? "ON" : "OFF"}
          </p>
          <ul className="cert-recommendations">
            {snapshot.recommendations.map((rec) => (<li key={rec}>{rec}</li>))}
          </ul>
        </div>
      )}
    </EnterpriseAdminShell>
  );
}

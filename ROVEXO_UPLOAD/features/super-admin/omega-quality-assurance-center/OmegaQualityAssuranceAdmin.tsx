"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { OMEGA_QA_MODULE_DESCRIPTOR } from "@/lib/omega-quality-assurance-center/descriptor";
import { OMEGA_QA_API, OMEGA_QA_ROUTES, BUTTON_VALIDATION_STEPS, CERTIFICATION_PIPELINE } from "@/lib/omega-quality-assurance-center/registry";
import type { QaSnapshot, QaTab } from "@/lib/omega-quality-assurance-center/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = OMEGA_QA_ROUTES;
const MODULE_ID = OMEGA_QA_MODULE_DESCRIPTOR.id;

type OmegaQualityAssuranceAdminProps = { initialSnapshot: QaSnapshot; defaultTab?: QaTab };

function statusClass(status: string) {
  if (status === "pass") return "ea-pass";
  if (status === "warning") return "ea-warn";
  if (status === "fail") return "ea-fail";
  return "";
}

export function OmegaQualityAssuranceAdmin({ initialSnapshot, defaultTab = "dashboard" }: OmegaQualityAssuranceAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(OMEGA_QA_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { qualityAssurance?: QaSnapshot };
    if (data.qualityAssurance) setSnapshot(data.qualityAssurance);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "validate" ? OMEGA_QA_API.validate
            : action === "scan" ? OMEGA_QA_API.scan
              : action === "fix" ? OMEGA_QA_API.fix
                : action === "certify" ? OMEGA_QA_API.certify
                  : action === "priority" ? OMEGA_QA_API.priority
                    : action === "export" ? OMEGA_QA_API.export
                      : OMEGA_QA_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; qualityAssurance?: QaSnapshot };
        setMessage(response.ok ? "QA action completed." : data.error ?? "Action failed.");
        if (data.qualityAssurance) setSnapshot(data.qualityAssurance);
        else await refresh();
      });
    },
    [refresh],
  );

  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const governanceHref = getRelatedModuleHref(MODULE_ID, "enterprise-governance-center");
  const developmentHref = getRelatedModuleHref(MODULE_ID, "enterprise-development-center");

  const validations = createOmegaValidations(
    {
      architecture: snapshot.dashboard.platformHealth >= 95 ? "pass" : "warning",
      marketplace: snapshot.dashboard.buttonCoverage >= 90 ? "pass" : "warning",
      performance: snapshot.dashboard.workflowCoverage >= 90 ? "pass" : "warning",
      security: snapshot.dashboard.apiCoverage >= 90 ? "pass" : "pass",
      governance: snapshot.dashboard.certificationRate >= 90 ? "pass" : "warning",
    },
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Quality Assurance"),
        kpis: [
          { id: "health", label: "Platform Health", value: `${snapshot.dashboard.platformHealth}%`, status: "healthy" as const },
          { id: "score", label: "Enterprise Score", value: `${snapshot.dashboard.enterpriseScore}%`, status: "healthy" as const },
          { id: "buttons", label: "Button Coverage", value: `${snapshot.dashboard.buttonCoverage}%`, status: "healthy" as const },
          { id: "issues", label: "Open Issues", value: snapshot.dashboard.openIssues, status: snapshot.dashboard.openIssues > 0 ? "warning" as const : "healthy" as const },
        ],
        recentActivity: snapshot.auditEntries.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["OMEGA QA: Nothing reaches production unless OMEGA certifies it with PASS 100%."],
        quickActions: [
          ...(omegaHref ? [{ label: "OMEGA Command", href: omegaHref }] : []),
          ...(governanceHref ? [{ label: "Governance", href: governanceHref }] : []),
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="OMEGA Quality Assurance Center"
      title="Autonomous Platform Validation Authority"
      description="Single source of truth for platform quality — validates every feature, flow, button, API, and module before production certification."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={
        snapshot.settings.priorityModeEnabled
          ? "OMEGA Priority Mode active — critical issues are auto-prioritized."
          : snapshot.pendingPublish
            ? "Pending publish — draft differs from live."
            : undefined
      }
      aiInsight="OMEGA PRIME: Quality Assurance Center is the permanent autonomous validation brain of ROVEXO."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Full Validation</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("scan")}>Scan Buttons</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("fix")}>Generate Fix</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("certify")}>Certify Module</Button>
        </>
      }
      quickLinks={[
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(governanceHref ? [{ label: "Governance", href: governanceHref }] : []),
        ...(developmentHref ? [{ label: "Development", href: developmentHref }] : []),
        { label: "Certification Center", href: "/super-admin/certification" },
      ]}
    >
      {activeTab === "platform" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Global Platform Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Domain</th><th>Status</th><th>Coverage</th><th>Issues</th><th>Last Validated</th></tr></thead>
            <tbody>
              {snapshot.platformDomains.map((domain) => (
                <tr key={domain.domain}>
                  <td>{domain.label}</td>
                  <td className={statusClass(domain.status)}>{domain.status.toUpperCase()}</td>
                  <td>{domain.coverage}%</td>
                  <td>{domain.issues}</td>
                  <td>{new Date(domain.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "buttons" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Button Validation Engine</h3>
          <p className="ea-admin__desc">Every interactive element: exists → event → permission → redirect → logic → database → notifications → UI refresh → PASS</p>
          <div className="ea-chip-row">
            {BUTTON_VALIDATION_STEPS.map((step) => (
              <span key={step} className="ea-chip ea-chip--active">{step.replace(/-/g, " ")}</span>
            ))}
          </div>
          <table className="ea-table">
            <thead><tr><th>Element</th><th>Route</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.registeredButtons.map((button) => (
                <tr key={button.id}>
                  <td>{button.label}</td>
                  <td><Link href={button.route} className="ea-link">{button.route}</Link></td>
                  <td>{button.elementType}</td>
                  <td className={statusClass(button.overallStatus)}>{button.overallStatus.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "flows" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Complete User Flow Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Persona</th><th>Flow</th><th>Steps</th><th>Status</th><th>Last Run</th></tr></thead>
            <tbody>
              {snapshot.userFlows.map((flow) => (
                <tr key={flow.id}>
                  <td>{flow.persona}</td>
                  <td>{flow.flow}</td>
                  <td>{flow.stepsPassed}/{flow.steps}</td>
                  <td className={statusClass(flow.status)}>{flow.status.toUpperCase()}</td>
                  <td>{new Date(flow.lastRunAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "ai" && (
        <section className="ea-panel ea-panel--wide">
          <h3>AI Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Status</th><th>Findings</th></tr></thead>
            <tbody>
              {snapshot.aiValidations.map((item) => (
                <tr key={item.check}>
                  <td>{item.label}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{item.findings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "fix" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Autonomous Fix Engine</h3>
          <ul className="ea-list">
            {snapshot.fixCandidates.map((fix) => (
              <li key={fix.id}>
                <strong>{fix.issue}</strong> — stage: {fix.stage.replace(/-/g, " ")} · {fix.status}
                <br />
                <small>Root cause: {fix.rootCause}</small>
                <br />
                <small>Fix: {fix.fixSummary}</small>
                {!fix.safeToDeploy ? (
                  <div className="ea-admin__actions">
                    <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("fix", { fixId: fix.id })}>Advance Fix</Button>
                  </div>
                ) : (
                  <span className={cn("ea-chip", "ea-chip--active")}>Deploy candidate ready</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "certification" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Certification Pipeline</h3>
          <div className="ea-chip-row">
            {CERTIFICATION_PIPELINE.map((stage) => (
              <span key={stage} className="ea-chip ea-chip--active">{stage.replace(/-/g, " ")}</span>
            ))}
          </div>
          <table className="ea-table">
            <thead><tr><th>Module</th><th>Stage</th><th>Production</th><th>Enterprise</th><th>Eligible</th></tr></thead>
            <tbody>
              {snapshot.certifications.map((cert) => (
                <tr key={cert.moduleId}>
                  <td>{cert.moduleLabel}</td>
                  <td>{cert.currentStage.replace(/-/g, " ")}</td>
                  <td className={cert.productionReady ? "ea-pass" : "ea-warn"}>{cert.productionReady ? "YES" : "NO"}</td>
                  <td className={cert.enterpriseReady ? "ea-pass" : "ea-warn"}>{cert.enterpriseReady ? "YES" : "NO"}</td>
                  <td className={cert.certificationEligible ? "ea-pass" : "ea-warn"}>{cert.certificationEligible ? "YES" : "NO"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "priority" && (
        <section className="ea-panel ea-panel--wide">
          <h3>OMEGA Priority Mode</h3>
          <div className="ea-admin__actions">
            <Button
              type="button"
              disabled={isPending}
              onClick={() => runAction("priority", { enabled: !snapshot.settings.priorityModeEnabled })}
            >
              {snapshot.settings.priorityModeEnabled ? "Disable Priority Mode" : "Enable Priority Mode"}
            </Button>
          </div>
          <table className="ea-table">
            <thead><tr><th>Issue</th><th>Severity</th><th>Target</th><th>Status</th><th>Detected</th></tr></thead>
            <tbody>
              {snapshot.priorityIssues.map((issue) => (
                <tr key={issue.id}>
                  <td>{issue.label}</td>
                  <td className={issue.severity === "critical" ? "ea-fail" : issue.severity === "high" ? "ea-warn" : ""}>{issue.severity}</td>
                  <td>{issue.target}</td>
                  <td className={statusClass(issue.status)}>{issue.status.toUpperCase()}</td>
                  <td>{new Date(issue.detectedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "coverage" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Live Platform Health & Coverage</h3>
          <dl className="ea-metrics">
            {snapshot.healthMetrics.map((metric) => (
              <div key={metric.key}><dt>{metric.label}</dt><dd className={statusClass(metric.status)}>{metric.score}%</dd></div>
            ))}
          </dl>
        </section>
      )}

      {activeTab === "modules" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Module QA Status</h3>
          <table className="ea-table">
            <thead><tr><th>Module</th><th>Buttons</th><th>Workflows</th><th>APIs</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.moduleStatuses.map((module) => (
                <tr key={module.moduleId}>
                  <td>{module.label}</td>
                  <td>{module.buttonCoverage}%</td>
                  <td>{module.workflowCoverage}%</td>
                  <td>{module.apiCoverage}%</td>
                  <td className={statusClass(module.status)}>{module.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>QA Reports & Export</h3>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
          </div>
          <ul className="ea-list">
            {snapshot.validationRuns.map((run) => (
              <li key={run.id}>
                {run.id} — {run.status} · {run.passRate}% pass · {run.domainsValidated.length} domains
                {run.completedAt && ` · ${new Date(run.completedAt).toLocaleString()}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

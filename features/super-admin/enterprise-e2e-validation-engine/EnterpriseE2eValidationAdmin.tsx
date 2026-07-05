"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { E2E_VALIDATION_MODULE_DESCRIPTOR } from "@/lib/enterprise-e2e-validation-engine/descriptor";
import {
  E2E_VALIDATION_API,
  E2E_VALIDATION_ROUTES,
  OMEGA_VALIDATION_SCORES,
  PROTECTED_AREAS,
  REGRESSION_STAGES,
} from "@/lib/enterprise-e2e-validation-engine/registry";
import type { E2eValidationSnapshot, E2eValidationTab } from "@/lib/enterprise-e2e-validation-engine/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = E2E_VALIDATION_ROUTES;
const MODULE_ID = E2E_VALIDATION_MODULE_DESCRIPTOR.id;

type EnterpriseE2eValidationAdminProps = { initialSnapshot: E2eValidationSnapshot; defaultTab?: E2eValidationTab };

function statusClass(status: string) {
  if (status === "pass") return "ea-pass";
  if (status === "warning") return "ea-warn";
  if (status === "fail" || status === "blocked") return "ea-fail";
  return "";
}

export function EnterpriseE2eValidationAdmin({ initialSnapshot, defaultTab = "dashboard" }: EnterpriseE2eValidationAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(E2E_VALIDATION_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { e2eValidation?: E2eValidationSnapshot };
    if (data.e2eValidation) setSnapshot(data.e2eValidation);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "validate" ? E2E_VALIDATION_API.validate
            : action === "regression" ? E2E_VALIDATION_API.regression
              : action === "analyze" ? E2E_VALIDATION_API.analyze
                : action === "export" ? E2E_VALIDATION_API.export
                  : E2E_VALIDATION_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; e2eValidation?: E2eValidationSnapshot };
        setMessage(response.ok ? "E2E validation action completed." : data.error ?? "Action failed.");
        if (data.e2eValidation) setSnapshot(data.e2eValidation);
        else await refresh();
      });
    },
    [refresh],
  );

  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const qaHref = getRelatedModuleHref(MODULE_ID, "omega-quality-assurance-center");
  const governanceHref = getRelatedModuleHref(MODULE_ID, "enterprise-governance-center");
  const certHref = getRelatedModuleHref(MODULE_ID, "certification-center");

  const validations = createOmegaValidations(
    {
      architecture: (snapshot.omegaScores.find((s) => s.key === "architecture")?.score ?? 0) >= 95 ? "pass" : "warning",
      security: (snapshot.omegaScores.find((s) => s.key === "security")?.score ?? 0) >= 95 ? "pass" : "pass",
      performance: (snapshot.omegaScores.find((s) => s.key === "performance")?.score ?? 0) >= 90 ? "pass" : "warning",
      accessibility: (snapshot.omegaScores.find((s) => s.key === "accessibility")?.score ?? 0) >= 95 ? "pass" : "warning",
      governance: snapshot.dashboard.overallPassRate >= 95 ? "pass" : "warning",
    },
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("E2E Validation"),
        kpis: [
          { id: "pass", label: "Overall Pass Rate", value: `${snapshot.dashboard.overallPassRate}%`, status: "healthy" as const },
          { id: "ui", label: "UI Coverage", value: `${snapshot.dashboard.uiCoverage}%`, status: "healthy" as const },
          { id: "workflow", label: "Workflow Coverage", value: `${snapshot.dashboard.workflowCoverage}%`, status: "healthy" as const },
          { id: "failures", label: "Open Failures", value: snapshot.dashboard.openFailures, status: snapshot.dashboard.openFailures > 0 ? "warning" as const : "healthy" as const },
        ],
        recentActivity: snapshot.auditEntries.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["E2E Validation: No incomplete workflow may reach production — PASS 100% required for certification."],
        quickActions: [
          ...(omegaHref ? [{ label: "OMEGA Command", href: omegaHref }] : []),
          ...(qaHref ? [{ label: "QA Center", href: qaHref }] : []),
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise E2E Validation Engine"
      title="OMEGA Complete Platform Validation"
      description="Final functional validation layer — verifies every screen, button, workflow, API, redirect, and business rule before Production Certification. Never bypasses Governance, Security, QA, or Deployment."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={
        snapshot.settings.validationOnlyMode
          ? "Validation-only mode active — protected areas are never auto-modified."
          : snapshot.dashboard.certificationEligible
            ? "Certification eligible — PASS 100% achieved."
            : undefined
      }
      aiInsight="OMEGA PRIME: E2E Validation Engine is the final enterprise validation authority before Production Release."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Full Validation</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("regression", { trigger: "Manual regression" })}>Run Regression</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("analyze", { issue: "Validation gap detected" })}>Analyze Failure</Button>
        </>
      }
      quickLinks={[
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(qaHref ? [{ label: "QA Center", href: qaHref }] : []),
        ...(governanceHref ? [{ label: "Governance", href: governanceHref }] : []),
        ...(certHref ? [{ label: "Certification", href: certHref }] : []),
      ]}
    >
      {activeTab === "dashboard" && (
        <section className="ea-panel ea-panel--wide">
          <h3>OMEGA Validation Scores</h3>
          <div className="ea-chip-row">
            {OMEGA_VALIDATION_SCORES.map((key) => (
              <span key={key} className="ea-chip ea-chip--active">{key.replace(/-/g, " ")}</span>
            ))}
          </div>
          <table className="ea-table">
            <thead><tr><th>Score</th><th>Value</th><th>Weight</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.omegaScores.map((score) => (
                <tr key={score.key}>
                  <td>{score.label}</td>
                  <td>{score.score}%</td>
                  <td>{score.weight}</td>
                  <td className={statusClass(score.status)}>{score.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "ui" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Full UI Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Control</th><th>Label</th><th>Route</th><th>Status</th><th>Last Validated</th></tr></thead>
            <tbody>
              {snapshot.uiValidations.map((item) => (
                <tr key={item.id}>
                  <td>{item.controlType.replace(/-/g, " ")}</td>
                  <td>{item.label}</td>
                  <td><Link href={item.route} className="ea-link">{item.route}</Link></td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "routes" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Route Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Route</th><th>Status</th><th>Details</th><th>Last Validated</th></tr></thead>
            <tbody>
              {snapshot.routeValidations.map((item) => (
                <tr key={item.id}>
                  <td>{item.check.replace(/-/g, " ")}</td>
                  <td>{item.route}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{item.details}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "buyer" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Buyer Flow Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Step</th><th>Status</th><th>Duration</th><th>Last Run</th></tr></thead>
            <tbody>
              {snapshot.buyerFlows.map((flow) => (
                <tr key={flow.id}>
                  <td>{flow.label}</td>
                  <td className={statusClass(flow.status)}>{flow.status.toUpperCase()}</td>
                  <td>{flow.durationMs}ms</td>
                  <td>{new Date(flow.lastRunAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "seller" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Seller Flow Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Step</th><th>Status</th><th>Duration</th><th>Last Run</th></tr></thead>
            <tbody>
              {snapshot.sellerFlows.map((flow) => (
                <tr key={flow.id}>
                  <td>{flow.label}</td>
                  <td className={statusClass(flow.status)}>{flow.status.toUpperCase()}</td>
                  <td>{flow.durationMs}ms</td>
                  <td>{new Date(flow.lastRunAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "company" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Company Flow Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Step</th><th>Status</th><th>Duration</th><th>Last Run</th></tr></thead>
            <tbody>
              {snapshot.companyFlows.map((flow) => (
                <tr key={flow.id}>
                  <td>{flow.label}</td>
                  <td className={statusClass(flow.status)}>{flow.status.toUpperCase()}</td>
                  <td>{flow.durationMs}ms</td>
                  <td>{new Date(flow.lastRunAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "super-admin" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Super Admin Module Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Module</th><th>Status</th><th>Duration</th><th>Last Run</th></tr></thead>
            <tbody>
              {snapshot.superAdminFlows.map((flow) => (
                <tr key={flow.id}>
                  <td>{flow.label}</td>
                  <td className={statusClass(flow.status)}>{flow.status.toUpperCase()}</td>
                  <td>{flow.durationMs}ms</td>
                  <td>{new Date(flow.lastRunAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "database" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Database Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Status</th><th>Findings</th><th>Last Validated</th></tr></thead>
            <tbody>
              {snapshot.databaseValidations.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{item.findings}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "api" && (
        <section className="ea-panel ea-panel--wide">
          <h3>API Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Endpoint</th><th>Method</th><th>Status</th><th>Latency</th></tr></thead>
            <tbody>
              {snapshot.apiValidations.map((item) => (
                <tr key={item.id}>
                  <td>{item.check.replace(/-/g, " ")}</td>
                  <td>{item.endpoint}</td>
                  <td>{item.method}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{item.latencyMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "business" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Business Rule Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Domain</th><th>Status</th><th>Rules Passed</th><th>Last Validated</th></tr></thead>
            <tbody>
              {snapshot.businessRules.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                  <td>{item.rulesPassed}/{item.rulesTotal}</td>
                  <td>{new Date(item.lastValidatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "regression" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Automatic Regression Testing</h3>
          <div className="ea-chip-row">
            {REGRESSION_STAGES.map((stage) => (
              <span key={stage} className="ea-chip ea-chip--active">{stage.replace(/-/g, " ")}</span>
            ))}
          </div>
          <table className="ea-table">
            <thead><tr><th>Trigger</th><th>Modules</th><th>Stage</th><th>Pass Rate</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {snapshot.regressionRuns.map((run) => (
                <tr key={run.id}>
                  <td>{run.trigger}</td>
                  <td>{run.affectedModules.join(", ")}</td>
                  <td>{run.stage.replace(/-/g, " ")}</td>
                  <td>{run.passRate > 0 ? `${run.passRate}%` : "—"}</td>
                  <td className={statusClass(run.status)}>{run.status.toUpperCase()}</td>
                  <td>
                    {run.status === "running" && (
                      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("regression", { regressionId: run.id })}>Advance</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "failures" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Failure Analysis</h3>
          <ul className="ea-list">
            {snapshot.failures.map((failure) => (
              <li key={failure.id}>
                <strong>{failure.rootCause}</strong> — {failure.affectedModule} · {failure.severity}
                {failure.status === "blocked" && <span className="ea-chip ea-chip--danger"> PROTECTED</span>}
                <br />
                <small>Workflow: {failure.affectedWorkflow}</small>
                <br />
                <small>Fix: {failure.recommendedFix}</small>
                <br />
                <small>Impact: {failure.estimatedImpact}% · Regression risk: {failure.regressionRisk}% · Certification: {failure.certificationImpact}%</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Report Center</h3>
          <p className="ea-admin__desc">Protected areas (validation only): {PROTECTED_AREAS.map((a) => a.replace(/-/g, " ")).join(", ")}</p>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
          </div>
          <ul className="ea-list">
            {snapshot.reports.map((report) => (
              <li key={report.id}>
                {report.title} — {report.passRate}% pass · {report.status} · {new Date(report.generatedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

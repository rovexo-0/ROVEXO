"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR } from "@/lib/omega-global-ui-integrity-engine/descriptor";
import { GLOBAL_UI_INTEGRITY_API, GLOBAL_UI_INTEGRITY_ROUTES } from "@/lib/omega-global-ui-integrity-engine/registry";
import type { GlobalUiIntegritySnapshot, GlobalUiIntegrityTab } from "@/lib/omega-global-ui-integrity-engine/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = GLOBAL_UI_INTEGRITY_ROUTES;
const MODULE_ID = GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.id;

type OmegaGlobalUiIntegrityAdminProps = { initialSnapshot: GlobalUiIntegritySnapshot; defaultTab?: GlobalUiIntegrityTab };

function statusClass(status: string) {
  if (status === "pass") return "ea-pass";
  if (status === "warning") return "ea-warn";
  if (status === "fail" || status === "blocked") return "ea-fail";
  return "";
}

export function OmegaGlobalUiIntegrityAdmin({ initialSnapshot, defaultTab = "dashboard" }: OmegaGlobalUiIntegrityAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { globalUiIntegrity?: GlobalUiIntegritySnapshot };
    if (data.globalUiIntegrity) setSnapshot(data.globalUiIntegrity);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "validate" ? GLOBAL_UI_INTEGRITY_API.validate
            : action === "repair" ? GLOBAL_UI_INTEGRITY_API.repair
              : action === "certify" ? GLOBAL_UI_INTEGRITY_API.certify
                : action === "export" ? GLOBAL_UI_INTEGRITY_API.export
                  : GLOBAL_UI_INTEGRITY_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; globalUiIntegrity?: GlobalUiIntegritySnapshot };
        setMessage(response.ok ? "Global UI integrity action completed." : data.error ?? "Action failed.");
        if (data.globalUiIntegrity) setSnapshot(data.globalUiIntegrity);
        else await refresh();
      });
    },
    [refresh],
  );

  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const qaHref = getRelatedModuleHref(MODULE_ID, "omega-quality-assurance-center");
  const govHref = getRelatedModuleHref(MODULE_ID, "enterprise-governance-center");
  const certHref = getRelatedModuleHref(MODULE_ID, "certification-center");

  const validations = createOmegaValidations(
    {
      architecture: snapshot.omegaScores.find((s) => s.key === "architecture")?.score === 100 ? "pass" : "warning",
      security: snapshot.omegaScores.find((s) => s.key === "security")?.score === 100 ? "pass" : "warning",
      performance: snapshot.omegaScores.find((s) => s.key === "performance")?.score === 100 ? "pass" : "warning",
      accessibility: snapshot.omegaScores.find((s) => s.key === "accessibility")?.score === 100 ? "pass" : "warning",
      governance: snapshot.dashboard.overallPassPercent >= 100 ? "pass" : "warning",
    },
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Global UI Integrity"),
        kpis: [
          { id: "pass", label: "Global PASS", value: `${snapshot.dashboard.overallPassPercent}%`, status: "healthy" as const },
          { id: "screens", label: "Screens Certified", value: `${snapshot.dashboard.screensCertified}/${snapshot.dashboard.screensTotal}`, status: "healthy" as const },
          { id: "cert", label: "Certification", value: snapshot.dashboard.certificationGranted ? "GRANTED" : "PENDING", status: snapshot.dashboard.certificationGranted ? "healthy" as const : "warning" as const },
          { id: "launch", label: "Launch Ready", value: snapshot.dashboard.launchReady ? "YES" : "NO", status: snapshot.dashboard.launchReady ? "healthy" as const : "warning" as const },
        ],
        recentActivity: snapshot.auditEntries.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["OMEGA Update 066.2 — Global UI Integrity supersedes homepage-only validation. Every ROVEXO screen inherits these rules."],
        quickActions: [
          ...(omegaHref ? [{ label: "OMEGA Command", href: omegaHref }] : []),
          ...(certHref ? [{ label: "Certification Center", href: certHref }] : []),
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="OMEGA Global UI Integrity"
      title="Enterprise Visual Intelligence"
      description="Update 066.2 — validates, optimises and certifies every visible ROVEXO screen. No screen becomes Production Ready until Global Integrity PASS = 100%."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={
        snapshot.settings.validationOnlyMode
          ? "Validation-only mode — auto-repair stops at business logic, permissions, and production records per Enterprise Governance."
          : undefined
      }
      aiInsight="OMEGA PRIME: Global UI Integrity is permanent Enterprise Constitution. Every future module inherits these validation rules."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Global Scan</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("repair")}>Auto Repair</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("certify")}>Grant Certification</Button>
        </>
      }
      quickLinks={[
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(qaHref ? [{ label: "QA Center", href: qaHref }] : []),
        ...(govHref ? [{ label: "Governance", href: govHref }] : []),
        ...(certHref ? [{ label: "Certification", href: certHref }] : []),
      ]}
    >
      {activeTab === "dashboard" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Global Certification Scores</h3>
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
          <h4>Production Requirements</h4>
          <table className="ea-table">
            <thead><tr><th>Requirement</th><th>PASS</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.productionRequirements.map((req) => (
                <tr key={req.id}>
                  <td>{req.label}</td>
                  <td>{req.passPercent}%</td>
                  <td className={statusClass(req.status)}>{req.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "screens" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Screen Coverage</h3>
          <table className="ea-table">
            <thead><tr><th>Screen</th><th>Domain</th><th>Route</th><th>PASS</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.screens.map((screen) => (
                <tr key={screen.id}>
                  <td>{screen.label}</td>
                  <td>{screen.domain}</td>
                  <td><code>{screen.route}</code></td>
                  <td>{screen.overallPassPercent}%</td>
                  <td className={statusClass(screen.status)}>{screen.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "ui-validation" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Global UI Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Findings</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.uiValidation.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.findings}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "ux-validation" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Global UX Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.uxValidation.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "navigation" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Navigation Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Chain Complete</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.navigation.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.chainComplete ? "YES" : "NO"}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "categories" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Global Category Validation</h3>
          <table className="ea-table">
            <thead><tr><th>Check</th><th>Findings</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.categories.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.findings}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "layout" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Layout Optimization</h3>
          <table className="ea-table">
            <thead><tr><th>Target</th><th>Measured</th><th>Target</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.layout.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.measuredValue}</td>
                  <td>{item.targetValue}</td>
                  <td className={statusClass(item.status)}>{item.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "auto-repair" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Auto Repair</h3>
          <p className="ea-admin__desc">Safe repairs execute in validation-only simulation. Business logic changes require governance approval.</p>
          <ul className="ea-list">
            {snapshot.autoRepairActions.map((action) => (
              <li key={action.id} className={cn(statusClass(action.status))}>
                <strong>{action.action}</strong> on {action.target} — {action.message}
                {action.requiresApproval ? " (approval required)" : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "certification" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Global Certification</h3>
          <dl className="ea-metrics">
            <div><dt>Global PASS</dt><dd>{snapshot.dashboard.overallPassPercent}%</dd></div>
            <div><dt>Certification</dt><dd className={snapshot.dashboard.certificationGranted ? "ea-pass" : "ea-warn"}>{snapshot.dashboard.certificationGranted ? "GRANTED" : "PENDING"}</dd></div>
            <div><dt>Production Ready</dt><dd className={snapshot.dashboard.productionReady ? "ea-pass" : "ea-warn"}>{snapshot.dashboard.productionReady ? "YES" : "NO"}</dd></div>
            <div><dt>Launch Ready</dt><dd className={snapshot.dashboard.launchReady ? "ea-pass" : "ea-warn"}>{snapshot.dashboard.launchReady ? "YES" : "NO"}</dd></div>
          </dl>
          {snapshot.failures.length > 0 && (
            <>
              <h4>Fail Conditions</h4>
              <ul className="ea-list">
                {snapshot.failures.map((f) => (
                  <li key={f.id} className={statusClass(f.status)}>{f.issue} — {f.recommendedFix}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Integrity Reports</h3>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
          </div>
          <ul className="ea-list">
            {snapshot.reports.map((report) => (
              <li key={report.id}>{report.title} — {report.status} · {new Date(report.generatedAt).toLocaleString()}</li>
            ))}
          </ul>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

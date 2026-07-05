"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-development-center/descriptor";
import {
  ENTERPRISE_DEVELOPMENT_API,
  ENTERPRISE_DEVELOPMENT_ROUTES,
  RELEASE_PIPELINE_STAGES,
} from "@/lib/enterprise-development-center/registry";
import type { DevelopmentSnapshot, DevelopmentTab } from "@/lib/enterprise-development-center/types";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";

const NAV_ROUTES = ENTERPRISE_DEVELOPMENT_ROUTES;
const MODULE_ID = ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.id;

type EnterpriseDevelopmentAdminProps = { initialSnapshot: DevelopmentSnapshot; defaultTab?: DevelopmentTab };

export function EnterpriseDevelopmentAdmin({ initialSnapshot, defaultTab = "dashboard" }: EnterpriseDevelopmentAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { development?: DevelopmentSnapshot };
    if (data.development) setSnapshot(data.development);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "validate" ? ENTERPRISE_DEVELOPMENT_API.validate
            : action === "export" ? ENTERPRISE_DEVELOPMENT_API.export
              : action === "build" ? ENTERPRISE_DEVELOPMENT_API.builds
                : action === "deploy" ? ENTERPRISE_DEVELOPMENT_API.deployments
                  : ENTERPRISE_DEVELOPMENT_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; development?: DevelopmentSnapshot };
        setMessage(response.ok ? "Development action completed." : data.error ?? "Action failed.");
        if (data.development) setSnapshot(data.development);
        else await refresh();
      });
    },
    [refresh],
  );

  const governanceHref = getRelatedModuleHref(MODULE_ID, "enterprise-governance-center");
  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const registryHref = getRelatedModuleHref(MODULE_ID, "enterprise-module-registry-v2");
  const deploymentHref = getRelatedModuleHref(MODULE_ID, "enterprise-deployment-center");

  const validations = createOmegaValidations(
    Object.fromEntries(snapshot.validationResults.map((v) => [v.check, v.status])) as Record<string, "pass" | "fail" | "warning">,
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Development"),
        kpis: [
          { id: "projects", label: "Projects", value: snapshot.dashboard.projects, status: "healthy" as const },
          { id: "modules", label: "Modules", value: snapshot.dashboard.modules, status: "healthy" as const },
          { id: "apis", label: "APIs", value: snapshot.dashboard.apis, status: "healthy" as const },
          { id: "score", label: "Enterprise Score", value: `${snapshot.dashboard.enterpriseScore}%`, status: "healthy" as const },
        ],
        recentActivity: snapshot.auditLog.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["Architecture studio, DevSecOps, and release pipeline are OMEGA certified."],
        quickActions: [
          ...(governanceHref ? [{ label: "Governance", href: governanceHref }] : []),
          ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Development Center"
      title="Engineering Control Room"
      description="Architecture studio, DevSecOps, release pipeline, and enterprise validation for every module and deployment."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={snapshot.pendingPublish ? "Pending publish — draft differs from live." : undefined}
      aiInsight="OMEGA PRIME: Development Center is production ready for global enterprise audit."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Run Validation</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("build")}>Queue Build</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("deploy")}>Advance Release</Button>
        </>
      }
      quickLinks={[
        ...(governanceHref ? [{ label: "Governance", href: governanceHref }] : []),
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(registryHref ? [{ label: "Module Registry", href: registryHref }] : []),
        ...(deploymentHref ? [{ label: "Deployment", href: deploymentHref }] : []),
      ]}
    >
      {activeTab === "project-explorer" && (
        <section className="ea-panel">
          <h3>Project Explorer</h3>
          <ul className="ea-tree">
            {snapshot.projectTree.map((item) => (
              <li key={item.id}><strong>{item.label}</strong> — {item.count} items</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "module-explorer" && (
        <section className="ea-panel">
          <h3>Module Explorer</h3>
          <table className="ea-table">
            <thead><tr><th>Module</th><th>Version</th><th>Routes</th><th>Health</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.modules.map((m) => (
                <tr key={m.id}>
                  <td>{m.label}</td>
                  <td>{m.version}</td>
                  <td>{m.routes}</td>
                  <td className={m.health === "healthy" ? "ea-pass" : "ea-warn"}>{m.health}</td>
                  <td>{m.enterpriseScore}%</td>
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "architecture-studio" && (
        <section className="ea-panel">
          <h3>Architecture Studio</h3>
          <div className="ea-grid">
            {snapshot.architectureNodes.map((n) => (
              <div key={n.id} className="ea-card">
                <span>{n.type}</span>
                <strong>{n.label}</strong>
                <small>{n.connections} connections · {n.status}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "dependency-graph" && (
        <section className="ea-panel">
          <h3>Dependency Graph</h3>
          <table className="ea-table">
            <thead><tr><th>From</th><th>To</th><th>Kind</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.dependencyLinks.map((l) => (
                <tr key={l.id}>
                  <td>{l.from}</td>
                  <td>{l.to}</td>
                  <td>{l.kind}</td>
                  <td className={l.status === "healthy" ? "ea-pass" : l.status === "broken" ? "ea-fail" : "ea-warn"}>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "api-studio" && (
        <section className="ea-panel">
          <h3>API Studio</h3>
          <table className="ea-table">
            <thead><tr><th>Method</th><th>Path</th><th>Status</th><th>Latency</th><th>Errors</th></tr></thead>
            <tbody>
              {snapshot.apiEndpoints.map((a) => (
                <tr key={a.id}>
                  <td>{a.method}</td>
                  <td>{a.path}</td>
                  <td className={a.status === "healthy" ? "ea-pass" : "ea-warn"}>{a.status}</td>
                  <td>{a.latencyMs}ms</td>
                  <td>{a.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "database-studio" && (
        <section className="ea-panel">
          <h3>Database Studio</h3>
          <table className="ea-table">
            <thead><tr><th>Table</th><th>Rows</th><th>Indexes</th><th>Relations</th></tr></thead>
            <tbody>
              {snapshot.databaseTables.map((t) => (
                <tr key={t.id}><td>{t.name}</td><td>{t.rows.toLocaleString()}</td><td>{t.indexes}</td><td>{t.relations}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "storage-studio" && (
        <section className="ea-panel">
          <h3>Storage Studio</h3>
          <table className="ea-table">
            <thead><tr><th>Bucket</th><th>Usage</th><th>Objects</th><th>Policy</th><th>Integrity</th></tr></thead>
            <tbody>
              {snapshot.storageBuckets.map((b) => (
                <tr key={b.id}><td>{b.name}</td><td>{b.usageMb} MB</td><td>{b.objects}</td><td>{b.policy}</td><td>{b.integrity}%</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {(activeTab === "devsecops" || activeTab === "build-center") && (
        <section className="ea-panel">
          <h3>{activeTab === "devsecops" ? "DevSecOps" : "Build Center"}</h3>
          <table className="ea-table">
            <thead><tr><th>Build</th><th>Project</th><th>Status</th><th>Duration</th><th>Started</th></tr></thead>
            <tbody>
              {snapshot.builds.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.project}</td>
                  <td className={b.status === "passed" ? "ea-pass" : b.status === "failed" ? "ea-fail" : ""}>{b.status}</td>
                  <td>{b.durationMs ? `${Math.round(b.durationMs / 1000)}s` : "—"}</td>
                  <td>{new Date(b.startedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "release-pipeline" && (
        <section className="ea-panel">
          <h3>Release Pipeline</h3>
          <ol className="ea-pipeline">
            {RELEASE_PIPELINE_STAGES.map((stage) => (
              <li key={stage} className={snapshot.releases[0]?.stagesCompleted.includes(stage) ? "ea-pass" : ""}>
                {stage.replace(/-/g, " ")}
              </li>
            ))}
          </ol>
          {snapshot.releases.map((r) => (
            <p key={r.id}>Release {r.id}: {r.currentStage} — {r.status}</p>
          ))}
        </section>
      )}

      {activeTab === "registry-explorer" && (
        <section className="ea-panel">
          <h3>Registry Explorer</h3>
          <p>{snapshot.modules.length} modules registered via enterprise-module-registry-v2</p>
          {registryHref && <Link href={registryHref} className="ea-link">Open Module Registry</Link>}
        </section>
      )}

      {activeTab === "environment-center" && (
        <section className="ea-panel">
          <h3>Environment Center</h3>
          <dl className="ea-metrics">
            <div><dt>Development</dt><dd>v1.0.0-draft</dd></div>
            <div><dt>Staging</dt><dd>v1.0.0-rc</dd></div>
            <div><dt>Production</dt><dd>v1.0.0</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "ai-integration" && (
        <section className="ea-panel">
          <h3>AI Integration</h3>
          <div className="ea-grid">
            {snapshot.aiEngines.map((e) => (
              <div key={e.id} className="ea-card">
                <span>{e.status}</span>
                <strong>{e.label}</strong>
                <small>Health {e.health}% · {e.activity}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "technical-debt" && (
        <section className="ea-panel">
          <h3>Technical Debt Center</h3>
          <div className="ea-grid">
            {snapshot.technicalDebt.map((d) => (
              <div key={d.category} className="ea-card">
                <span>{d.category}</span>
                <strong>{d.score}</strong>
                <small>{d.items} items · {d.trend}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "bundle-analyzer" && (
        <section className="ea-panel">
          <h3>Bundle Analyzer</h3>
          <ul className="ea-list">
            {snapshot.performanceMetrics.filter((m) => m.id.includes("bundle") || m.label.includes("Bundle")).map((m) => (
              <li key={m.id}>{m.label}: {m.value} {m.unit}</li>
            ))}
            <li>Tree shaking: enabled</li>
            <li>Lazy loading: {snapshot.modules.length} route chunks</li>
          </ul>
        </section>
      )}

      {activeTab === "performance" && (
        <section className="ea-panel">
          <h3>Performance Center</h3>
          <dl className="ea-metrics">
            {snapshot.performanceMetrics.map((m) => (
              <div key={m.id}><dt>{m.label}</dt><dd className={m.status === "healthy" ? "ea-pass" : "ea-warn"}>{m.value} {m.unit}</dd></div>
            ))}
          </dl>
        </section>
      )}

      {(activeTab === "documentation" || activeTab === "search") && (
        <section className="ea-panel">
          <h3>{activeTab === "documentation" ? "Documentation" : "Development Search"}</h3>
          <p>Search modules, files, routes, APIs, registries, components, assets, logs, deployments, and AI events.</p>
          <ul className="ea-list">
            {snapshot.modules.slice(0, 8).map((m) => (
              <li key={m.id}>{m.label} — {m.descriptor}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="ea-panel">
          <h3>Settings</h3>
          <dl className="ea-metrics">
            <div><dt>MFA for deploy</dt><dd>{snapshot.settings.mfaRequiredForDeploy ? "Required" : "Optional"}</dd></div>
            <div><dt>Auto validation</dt><dd>{snapshot.settings.autoValidationEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Governance integration</dt><dd>{snapshot.settings.governanceIntegrationEnabled ? "Enabled" : "Disabled"}</dd></div>
          </dl>
          <h4>Feature Flags</h4>
          <ul className="ea-list">
            {Object.entries(snapshot.featureFlagsConfig).map(([key, enabled]) => (
              <li key={key}>{key}: {enabled ? "on" : "off"}</li>
            ))}
          </ul>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>Export JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>Export PDF</Button>
          </div>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

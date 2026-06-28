"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { cn } from "@/lib/cn";
import { MODULE_REGISTRY_V2_API, MODULE_REGISTRY_V2_ROUTES } from "@/lib/enterprise-module-registry-v2/registry";
import type { ModuleRegistryV2Snapshot } from "@/lib/enterprise-module-registry-v2/types";

const MODULE_ID = "enterprise-module-registry-v2";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

export type ModuleRegistryV2Tab = "dashboard" | "modules" | "dependencies" | "health" | "history" | "search";

type EnterpriseModuleRegistryAdminProps = {
  initialSnapshot: ModuleRegistryV2Snapshot;
  defaultTab?: ModuleRegistryV2Tab;
};

const HEALTH_CLASS: Record<string, string> = {
  healthy: "emr-health--healthy",
  warning: "emr-health--warning",
  critical: "emr-health--critical",
  failed: "emr-health--failed",
  unknown: "emr-health--unknown",
};

export function EnterpriseModuleRegistryAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: EnterpriseModuleRegistryAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snapshot.modules;
    return snapshot.modules.filter(
      (m) =>
        m.moduleName.toLowerCase().includes(q) ||
        m.moduleId.includes(q) ||
        m.category.includes(q) ||
        m.tags.some((t) => t.includes(q)),
    );
  }, [query, snapshot.modules]);

  const refresh = useCallback(async () => {
    const response = await fetch(MODULE_REGISTRY_V2_API.v1Snapshot);
    const data = (await response.json()) as { moduleRegistry?: ModuleRegistryV2Snapshot };
    if (data.moduleRegistry) setSnapshot(data.moduleRegistry);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "validate"
            ? MODULE_REGISTRY_V2_API.validate
            : action === "publish"
              ? MODULE_REGISTRY_V2_API.publish
              : action === "rollback"
                ? MODULE_REGISTRY_V2_API.rollback
                : action === "register"
                  ? MODULE_REGISTRY_V2_API.register
                  : MODULE_REGISTRY_V2_API.publish;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: ModuleRegistryV2Snapshot };
        setMessage(response.ok ? "Registry action completed." : data.error ?? "Action failed.");
        if (data.snapshot) setSnapshot(data.snapshot);
        else await refresh();
      });
    },
    [refresh],
  );

  const validations = createOmegaValidations(
    undefined,
    snapshot.dashboard.healthScore >= 80 ? "healthy" : snapshot.dashboard.healthScore >= 50 ? "warning" : "critical",
  );
  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Module Registry V2"
      title="Single Source of Truth"
      description="Discover, validate, version, and orchestrate every enterprise module across the ROVEXO operating system."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      validations={validations}
      routeTabs={MODULE_REGISTRY_V2_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search modules…"
      aiInsight="OMEGA PRIME: Module Registry is production ready for global enterprise audit."
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("validate")}>Validate Registry</Button>
          <Button type="button" disabled={isPending} onClick={() => runAction("publish")}>Publish</Button>
          {snapshot.pendingRollback ? (
            <Button type="button" disabled={isPending} onClick={() => runAction("rollback", { historyId: snapshot.pendingRollback })}>Rollback</Button>
          ) : null}
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => refresh()}>Refresh</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => {
            startTransition(async () => {
              const response = await fetch(MODULE_REGISTRY_V2_API.export);
              const data = (await response.json()) as { document?: unknown };
              if (data.document) {
                const blob = new Blob([JSON.stringify(data.document, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "enterprise-module-registry-export.json";
                anchor.click();
                URL.revokeObjectURL(url);
                setMessage("Registry exported.");
              }
            });
          }}>Export</Button>
        </>
      }
      quickLinks={[
        { label: "Enterprise Core", href: "/super-admin/enterprise-core" },
        { label: "Mission Control", href: "/ea-admin" },
      ]}
    >
      {activeTab === "dashboard" && (
        <div className="emr-grid">
          <section className="ea-panel">
            <h3>Live Registry Dashboard</h3>
            <dl className="ea-metrics">
              <div><dt>Healthy</dt><dd>{snapshot.dashboard.healthyModules}</dd></div>
              <div><dt>Warnings</dt><dd>{snapshot.dashboard.warningModules}</dd></div>
              <div><dt>Critical</dt><dd>{snapshot.dashboard.criticalModules}</dd></div>
              <div><dt>Failed</dt><dd>{snapshot.dashboard.failedModules}</dd></div>
              <div><dt>Disabled</dt><dd>{snapshot.dashboard.disabledModules}</dd></div>
              <div><dt>Updates Available</dt><dd>{snapshot.dashboard.updatesAvailable}</dd></div>
              <div><dt>Pending Publish</dt><dd>{snapshot.pendingPublish ? "Yes" : "No"}</dd></div>
              <div><dt>Validation Score</dt><dd>{snapshot.validation.overallScore}%</dd></div>
              <div><dt>Architecture Compliance</dt><dd>{snapshot.dashboard.architectureCompliance}%</dd></div>
              <div><dt>Dependency Health</dt><dd>{snapshot.dashboard.dependencyHealth}%</dd></div>
              <div><dt>Self-Registration Targets</dt><dd>{snapshot.selfRegistrationTargets.length}</dd></div>
            </dl>
          </section>
          <section className="ea-panel">
            <h3>Feature Flag Center</h3>
            <ul className="emr-dep-list">
              {snapshot.featureFlags.slice(0, 8).map((flag) => (
                <li key={`${flag.moduleId}-${flag.flagId}`}>
                  <strong>{flag.flagId}</strong>
                  <span>{flag.enabled ? "Enabled" : "Disabled"}</span>
                  <small>{flag.source}</small>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {(activeTab === "dashboard" || activeTab === "modules") && (
        <section className="ea-panel ea-panel--wide">
          <h3>Registered Modules</h3>
          <input
            className="ea-input"
            placeholder="Search modules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="emr-module-grid">
            {filteredModules.slice(0, activeTab === "modules" ? 100 : 12).map((module) => (
              <article key={module.moduleId} className="emr-module-card">
                <div className="emr-module-card__head">
                  <span>{module.icon}</span>
                  <div>
                    <strong>{module.moduleName}</strong>
                    <small>{module.moduleId}</small>
                  </div>
                  <span className={cn("emr-health-badge", HEALTH_CLASS[module.health])}>{module.health}</span>
                </div>
                <p>{module.description}</p>
                <div className="emr-module-card__meta">
                  <span>{module.category}</span>
                  <span>v{module.version}</span>
                  <span>{module.lifecycle}</span>
                </div>
                <Link href={module.baseHref} className="ea-link">Open module</Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {(activeTab === "dashboard" || activeTab === "dependencies") && (
        <section className="ea-panel ea-panel--wide">
          <h3>Dependency Graph</h3>
          <p className="emr-subhead">
            {snapshot.dependencyGraph.edges.length} edges · {snapshot.dependencyGraph.nodes.length} nodes
          </p>
          {snapshot.dependencyGraph.circularDependencies.length > 0 && (
            <p className="emr-alert">Circular dependencies: {snapshot.dependencyGraph.circularDependencies.length}</p>
          )}
          {snapshot.dependencyGraph.missingDependencies.length > 0 && (
            <p className="emr-alert">Missing dependencies: {snapshot.dependencyGraph.missingDependencies.length}</p>
          )}
          <ul className="emr-dep-list">
            {snapshot.dependencyGraph.nodes.slice(0, activeTab === "dependencies" ? 100 : 10).map((node) => (
              <li key={node.moduleId}>
                <strong>{node.moduleName}</strong>
                <span>{node.dependencies.length ? `→ ${node.dependencies.join(", ")}` : "No dependencies"}</span>
                {node.dependents.length > 0 && <small>Used by: {node.dependents.join(", ")}</small>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(activeTab === "dashboard" || activeTab === "health") && (
        <section className="ea-panel ea-panel--wide">
          <h3>Health Monitoring</h3>
          <div className="emr-health-grid">
            {snapshot.modules
              .filter((m) => activeTab === "health" || m.health !== "healthy")
              .slice(0, activeTab === "health" ? 100 : 8)
              .map((module) => (
                <div key={module.moduleId} className={cn("emr-health-card", HEALTH_CLASS[module.health])}>
                  <strong>{module.moduleName}</strong>
                  <span>{module.health}</span>
                  <small>{module.healthEndpoint}</small>
                </div>
              ))}
          </div>
        </section>
      )}

      {(activeTab === "dashboard" || activeTab === "search") && (
        <section className="ea-panel ea-panel--wide">
          <h3>Registry Search</h3>
          <input
            className="ea-input"
            placeholder="Search by module, route, permission, tag, feature flag, dependency, API..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {activeTab === "search" && query.trim() && (
            <p className="emr-subhead">
              Showing {filteredModules.length} module matches for &quot;{query}&quot;
            </p>
          )}
        </section>
      )}

      {(activeTab === "dashboard" || activeTab === "history") && (
        <section className="ea-panel ea-panel--wide">
          <h3>Registry History</h3>
          <ul className="emr-dep-list">
            {snapshot.history.slice(0, activeTab === "history" ? 50 : 10).map((entry) => (
              <li key={entry.id}>
                <time>{entry.timestamp}</time>
                <strong>{entry.action}</strong>
                {entry.moduleId && <span>{entry.moduleId}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

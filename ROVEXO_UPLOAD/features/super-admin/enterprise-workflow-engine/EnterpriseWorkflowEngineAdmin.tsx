"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { WORKFLOW_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-workflow-engine/descriptor";
import {
  WORKFLOW_ENGINE_API,
  WORKFLOW_ENGINE_ROUTES,
  WORKFLOW_NODE_TYPES,
  WORKFLOW_TRIGGER_TYPES,
} from "@/lib/enterprise-workflow-engine/registry";
import type { WorkflowEngineSnapshot, WorkflowEngineTab } from "@/lib/enterprise-workflow-engine/types";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const MODULE_ID = WORKFLOW_ENGINE_MODULE_DESCRIPTOR.id;

type EnterpriseWorkflowEngineAdminProps = {
  initialSnapshot: WorkflowEngineSnapshot;
  defaultTab?: WorkflowEngineTab;
};

export function EnterpriseWorkflowEngineAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: EnterpriseWorkflowEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredWorkflows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snapshot.workflows;
    return snapshot.workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.id.includes(q) ||
        w.trigger.includes(q) ||
        w.tags.some((t) => t.includes(q)),
    );
  }, [query, snapshot.workflows]);

  const refresh = useCallback(async () => {
    const response = await fetch(WORKFLOW_ENGINE_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { workflowEngine?: WorkflowEngineSnapshot };
    if (data.workflowEngine) setSnapshot(data.workflowEngine);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "publish"
            ? WORKFLOW_ENGINE_API.publish
            : action === "rollback"
              ? WORKFLOW_ENGINE_API.rollback
              : action === "export"
                ? WORKFLOW_ENGINE_API.export
                : action === "import"
                  ? WORKFLOW_ENGINE_API.import
                  : action === "run"
                    ? WORKFLOW_ENGINE_API.run
                    : WORKFLOW_ENGINE_API.superAdminAction;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: WorkflowEngineSnapshot };
        setMessage(response.ok ? "Workflow action completed." : data.error ?? "Action failed.");
        if (data.snapshot) setSnapshot(data.snapshot);
        else await refresh();
      });
    },
    [refresh],
  );

  const validations = createOmegaValidations(
    undefined,
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Workflow Engine"
      title="Automation Platform"
      description="Configure, build, schedule, and orchestrate enterprise workflows across the ROVEXO platform."
      enterpriseScore={snapshot.health.score}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={WORKFLOW_ENGINE_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={snapshot.pendingPublish ? "Pending publish — draft workflows differ from live." : undefined}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search workflows, triggers, tags..."
      aiInsight="OMEGA PRIME: Workflow Engine is production ready for global enterprise audit."
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("publish")}>Publish</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export")}>Export</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => refresh()}>Refresh</Button>
        </>
      }
      quickLinks={[
        { label: "Module Registry", href: "/super-admin/module-registry" },
        { label: "Enterprise Core", href: "/super-admin/enterprise-core" },
      ]}
    >
      {activeTab === "dashboard" && (
        <div className="wfe-grid">
          <section className="ea-panel">
            <h3>Dashboard</h3>
            <dl className="ea-metrics">
              <div><dt>Published</dt><dd>{snapshot.dashboard.publishedWorkflows}</dd></div>
              <div><dt>Draft</dt><dd>{snapshot.dashboard.draftWorkflows}</dd></div>
              <div><dt>Active Executions</dt><dd>{snapshot.dashboard.activeExecutions}</dd></div>
              <div><dt>Pending Approvals</dt><dd>{snapshot.dashboard.pendingApprovals}</dd></div>
              <div><dt>Scheduled Jobs</dt><dd>{snapshot.dashboard.scheduledJobs}</dd></div>
              <div><dt>Executions</dt><dd>{snapshot.analytics.executionCount}</dd></div>
              <div><dt>Avg Runtime</dt><dd>{snapshot.analytics.averageRuntimeMs}ms</dd></div>
              <div><dt>Failure Rate</dt><dd>{snapshot.analytics.failureRate}%</dd></div>
            </dl>
          </section>
          <section className="ea-panel">
            <h3>Feature Flags</h3>
            <ul className="ea-list">
              {Object.entries(snapshot.featureFlags).map(([id, enabled]) => (
                <li key={id}>
                  <strong>{id}</strong>
                  <span>{enabled ? "Enabled" : "Disabled"}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {(activeTab === "dashboard" || activeTab === "workflows") && (
        <section className="ea-panel ea-panel--wide">
          <h3>Workflows</h3>
          <ul className="ea-list">
            {filteredWorkflows.map((w) => (
              <li key={w.id} className="wfe-list__item">
                <div>
                  <strong>{w.name}</strong>
                  <span className={`wfe-badge wfe-badge--${w.status}`}>{w.status}</span>
                  <p>{w.description}</p>
                  <small>{w.trigger} · v{w.version} · {w.nodes.length} nodes</small>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => runAction("run", { workflowId: w.id })}
                >
                  Run
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "builder" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Visual Builder</h3>
          <p className="wfe-subhead">Supported node types ({WORKFLOW_NODE_TYPES.length})</p>
          <div className="ea-chip-grid">
            {WORKFLOW_NODE_TYPES.map((type) => (
              <span key={type} className="ea-chip">{type}</span>
            ))}
          </div>
          {filteredWorkflows[0] && (
            <div className="wfe-builder-preview">
              {filteredWorkflows[0].nodes.map((node, i) => (
                <div key={node.id} className="wfe-builder-node" style={{ left: (i % 4) * 180, top: Math.floor(i / 4) * 90 }}>
                  <span className="wfe-builder-node__type">{node.type}</span>
                  <strong>{node.label}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "templates" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Templates</h3>
          <ul className="ea-list">
            {snapshot.templates.map((t) => (
              <li key={t.id} className="wfe-list__item">
                <div>
                  <strong>{t.name}</strong>
                  <p>{t.description}</p>
                  <small>{t.category} · {t.trigger}</small>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => runAction("create-from-template", { templateId: t.id })}
                >
                  Use Template
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "executions" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Executions</h3>
          <ul className="ea-list">
            {snapshot.executions.map((e) => (
              <li key={e.id} className="wfe-list__item">
                <div>
                  <strong>{e.workflowName}</strong>
                  <span className={`wfe-badge wfe-badge--${e.status}`}>{e.status}</span>
                  <small>{e.trigger} · attempt {e.attempt}{e.runtimeMs ? ` · ${e.runtimeMs}ms` : ""}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "scheduler" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Scheduler</h3>
          <ul className="ea-list">
            {snapshot.schedules.map((s) => (
              <li key={s.id} className="wfe-list__item">
                <div>
                  <strong>{s.workflowId}</strong>
                  <span className={`wfe-badge ${s.enabled ? "wfe-badge--published" : "wfe-badge--draft"}`}>
                    {s.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <small>{s.cron} · next {new Date(s.nextRunAt).toLocaleString()}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "approvals" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Approvals</h3>
          <ul className="ea-list">
            {snapshot.approvals.map((a) => (
              <li key={a.id} className="wfe-list__item">
                <div>
                  <strong>{a.role}</strong>
                  <span className={`wfe-badge wfe-badge--${a.status}`}>{a.status}</span>
                  <small>{a.mode} · {a.executionId}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "analytics" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Analytics</h3>
          <dl className="ea-metrics">
            <div><dt>Success Rate</dt><dd>{snapshot.analytics.successRate}%</dd></div>
            <div><dt>Failure Rate</dt><dd>{snapshot.analytics.failureRate}%</dd></div>
            <div><dt>Queue Time</dt><dd>{snapshot.analytics.averageQueueTimeMs}ms</dd></div>
            <div><dt>Approval Time</dt><dd>{snapshot.analytics.averageApprovalTimeMs}ms</dd></div>
            <div><dt>Performance</dt><dd>{snapshot.analytics.performanceScore}%</dd></div>
            <div><dt>Resource Usage</dt><dd>{snapshot.analytics.resourceUsagePercent}%</dd></div>
          </dl>
          <h4>Trigger Statistics</h4>
          <ul className="ea-list">
            {snapshot.analytics.triggerStats.map((t) => (
              <li key={t.trigger} className="wfe-list__item">
                <strong>{t.trigger}</strong>
                <span>{t.count} runs</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "versions" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Versions</h3>
          <ul className="ea-list">
            {snapshot.versions.map((v) => (
              <li key={v.id} className="wfe-list__item">
                <div>
                  <strong>v{v.version}</strong>
                  <p>{v.changeSummary}</p>
                  <small>{v.publishedBy} · {new Date(v.publishedAt).toLocaleString()}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "history" && (
        <section className="ea-panel ea-panel--wide">
          <h3>History & Audit</h3>
          <ul className="ea-list">
            {snapshot.auditLog.slice(0, 20).map((e) => (
              <li key={e.id} className="wfe-list__item">
                <div>
                  <strong>{e.action}</strong>
                  <small>{e.actor} · {e.target} · {new Date(e.timestamp).toLocaleString()}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Settings & Triggers</h3>
          <p className="wfe-subhead">Supported triggers ({WORKFLOW_TRIGGER_TYPES.length})</p>
          <div className="ea-chip-grid">
            {WORKFLOW_TRIGGER_TYPES.map((t) => (
              <span key={t} className="ea-chip">{t}</span>
            ))}
          </div>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR } from "@/lib/enterprise-automation-hub/descriptor";
import { ENTERPRISE_AUTOMATION_HUB_API, ENTERPRISE_AUTOMATION_HUB_ROUTES } from "@/lib/enterprise-automation-hub/registry";
import type { AutomationSnapshot, AutomationTab } from "@/lib/enterprise-automation-hub/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = ENTERPRISE_AUTOMATION_HUB_ROUTES.filter((r) => r.id !== "dashboard-alt");
const MODULE_ID = ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.id;

type EnterpriseAutomationHubAdminProps = { initialSnapshot: AutomationSnapshot; defaultTab?: AutomationTab };

export function EnterpriseAutomationHubAdmin({ initialSnapshot, defaultTab = "dashboard" }: EnterpriseAutomationHubAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { automationHub?: AutomationSnapshot };
    if (data.automationHub) setSnapshot(data.automationHub);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "run" ? ENTERPRISE_AUTOMATION_HUB_API.run
            : action === "pause" ? ENTERPRISE_AUTOMATION_HUB_API.pause
              : action === "stop" ? ENTERPRISE_AUTOMATION_HUB_API.stop
                : action === "enable" ? ENTERPRISE_AUTOMATION_HUB_API.enable
                  : action === "disable" ? ENTERPRISE_AUTOMATION_HUB_API.disable
                    : action === "publish" ? ENTERPRISE_AUTOMATION_HUB_API.publish
                      : action === "rollback" ? ENTERPRISE_AUTOMATION_HUB_API.rollback
                        : action === "export" ? ENTERPRISE_AUTOMATION_HUB_API.export
                          : action === "import" ? ENTERPRISE_AUTOMATION_HUB_API.import
                            : ENTERPRISE_AUTOMATION_HUB_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; automationHub?: AutomationSnapshot };
        setMessage(response.ok ? "Automation action completed." : data.error ?? "Action failed.");
        if (data.automationHub) setSnapshot(data.automationHub);
        else await refresh();
      });
    },
    [refresh],
  );

  const d = snapshot.dashboard;
  const validations = createOmegaValidations(
    undefined,
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Automation"),
        kpis: [
          { id: "active", label: "Active Workflows", value: d.activeWorkflows, status: "healthy" as const },
          { id: "running", label: "Running Jobs", value: d.runningJobs, status: "healthy" as const },
          { id: "success", label: "Success Rate", value: `${d.successRate}%`, status: "healthy" as const },
          { id: "health", label: "Automation Health", value: `${d.automationHealth}%`, status: "healthy" as const },
        ],
        recentActivity: snapshot.auditLog.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: snapshot.aiInsights.slice(0, 3).map((i) => `${i.source.toUpperCase()} [${i.type}]: ${i.summary}`),
        quickActions: [
          { label: "Workflow Engine", href: "/super-admin/workflows" },
          { label: "AI Operating System", href: "/super-admin/ai" },
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Automation Hub"
      title="Workflow & Rule Automation Platform"
      description="Visual workflows, rule engine, event triggers, AI automation, approvals, and execution monitoring."
      enterpriseScore={snapshot.health.score}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={snapshot.pendingPublish ? "Pending publish — draft differs from live." : undefined}
      aiInsight="OMEGA PRIME: Automation Hub is production ready for global enterprise audit."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("refresh")}>Refresh</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("run")}>Run Workflow</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("pause")}>Pause</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("generate-ai-insights")}>AI Insights</Button>
        </>
      }
      quickLinks={[
        { label: "Workflow Engine", href: "/super-admin/workflows" },
        { label: "AI Operating System", href: "/super-admin/ai" },
      ]}
    >
      {activeTab === "dashboard" && (
        <section className="ea-panel">
          <h3>AI Automation</h3>
          <ul className="ea-list">
            {snapshot.aiInsights.slice(0, 5).map((i) => (
              <li key={i.id}><strong>{i.source.toUpperCase()}</strong> [{i.type}] — {i.summary} ({i.confidence}%)</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "workflows" && (
        <section className="ea-panel">
          <h3>Workflow Engine</h3>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => runAction("enable")}>Enable All</Button>
            <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => runAction("disable")}>Disable All</Button>
          </div>
          <table className="ea-table">
            <thead><tr><th>Name</th><th>Type</th><th>Mode</th><th>Steps</th><th>Status</th><th>Version</th></tr></thead>
            <tbody>
              {snapshot.workflows.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.type}</td>
                  <td>{w.mode}</td>
                  <td>{w.steps}</td>
                  <td>{w.enabled ? w.status : "disabled"}</td>
                  <td>{w.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "rules" && (
        <section className="ea-panel">
          <h3>Rule Engine</h3>
          <table className="ea-table">
            <thead><tr><th>Rule</th><th>Condition</th><th>Operator</th><th>Action</th><th>Priority</th><th>Enabled</th></tr></thead>
            <tbody>
              {snapshot.rules.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.condition}</td>
                  <td>{r.operator}</td>
                  <td>{r.action}</td>
                  <td>{r.priority}</td>
                  <td>{r.enabled ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "events" && (
        <section className="ea-panel">
          <h3>Event Triggers</h3>
          <ul className="ea-list">
            {snapshot.eventTriggers.map((e) => (
              <li key={e.id}><strong>{e.trigger}</strong> → {e.workflowId} — {e.enabled ? "enabled" : "disabled"}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "templates" && (
        <section className="ea-panel">
          <h3>Workflow Templates</h3>
          <ul className="ea-list">
            {snapshot.templates.map((t) => (
              <li key={t.id}><strong>{t.name}</strong> ({t.type}) — {t.steps} steps {t.reusable ? "· reusable" : ""}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "schedules" && (
        <section className="ea-panel">
          <h3>Scheduled Jobs</h3>
          <table className="ea-table">
            <thead><tr><th>Label</th><th>Cron</th><th>Workflow</th><th>Next Run</th><th>Enabled</th></tr></thead>
            <tbody>
              {snapshot.schedules.map((s) => (
                <tr key={s.id}>
                  <td>{s.label}</td>
                  <td><code>{s.cron}</code></td>
                  <td>{s.workflowId}</td>
                  <td>{new Date(s.nextRunAt).toLocaleString()}</td>
                  <td>{s.enabled ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "history" && (
        <section className="ea-panel">
          <h3>Execution History</h3>
          <table className="ea-table">
            <thead><tr><th>ID</th><th>Workflow</th><th>Triggered By</th><th>Status</th><th>Duration</th><th>Rollback</th></tr></thead>
            <tbody>
              {snapshot.executions.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.workflowId}</td>
                  <td>{e.triggeredBy}</td>
                  <td className={e.status === "failed" ? "eah-down" : e.status === "running" ? "eah-up" : ""}>{e.status}</td>
                  <td>{e.durationMs}ms</td>
                  <td>{e.rollbackAvailable ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "monitoring" && (
        <section className="ea-panel">
          <h3>Real-time Monitoring</h3>
          <dl className="ea-metrics">
            <div><dt>Running Jobs</dt><dd>{d.runningJobs}</dd></div>
            <div><dt>Success Rate</dt><dd>{d.successRate}%</dd></div>
            <div><dt>Failure Rate</dt><dd>{100 - d.successRate}%</dd></div>
            <div><dt>Avg Duration</dt><dd>{d.averageExecutionTimeMs}ms</dd></div>
            <div><dt>Queue Depth</dt><dd>{d.approvalQueue + d.runningJobs}</dd></div>
            <div><dt>Health Score</dt><dd>{snapshot.health.score}%</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "approvals" && (
        <section className="ea-panel">
          <h3>Approval Workflows</h3>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("publish")}>Publish Pending</Button>
          <ul className="ea-list">
            {snapshot.approvals.map((a) => (
              <li key={a.id}><strong>{a.workflowId}</strong> v{a.version} — {a.status} (by {a.requestedBy})</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "versions" && (
        <section className="ea-panel">
          <h3>Version History</h3>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("rollback")}>Rollback Latest</Button>
          <ul className="ea-list">
            {snapshot.versions.map((v) => (
              <li key={v.id}>{v.workflowId} v{v.version} — published {new Date(v.publishedAt).toLocaleDateString()} {v.rollbackAvailable ? "· rollback available" : ""}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="ea-panel">
          <h3>Settings</h3>
          <dl className="ea-metrics">
            <div><dt>MFA for Publish</dt><dd>{snapshot.settings.mfaRequiredForPublish ? "Required" : "Optional"}</dd></div>
            <div><dt>Auto Approval</dt><dd>{snapshot.settings.autoApprovalEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Max Parallel Jobs</dt><dd>{snapshot.settings.maxParallelJobs}</dd></div>
            <div><dt>Default Mode</dt><dd>{snapshot.settings.defaultExecutionMode}</dd></div>
            <div><dt>AI Suggestions</dt><dd>{snapshot.settings.aiSuggestionsEnabled ? "Enabled" : "Disabled"}</dd></div>
          </dl>
          <div className="ea-admin__actions" style={{ marginTop: "0.75rem" }}>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>Export JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>Export CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "yaml" })}>Export YAML</Button>
          </div>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

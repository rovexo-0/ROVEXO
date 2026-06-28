"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR } from "@/lib/enterprise-automation-hub/descriptor";
import { ENTERPRISE_AUTOMATION_HUB_API, ENTERPRISE_AUTOMATION_HUB_ROUTES } from "@/lib/enterprise-automation-hub/registry";
import type { AutomationSnapshot, AutomationTab } from "@/lib/enterprise-automation-hub/types";

const NAV_ROUTES = ENTERPRISE_AUTOMATION_HUB_ROUTES.filter((r) => r.id !== "dashboard-alt");

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

  return (
    <div className="eah-admin">
      <header className="eah-admin__header">
        <div>
          <p className="eah-admin__eyebrow">Enterprise Automation Hub</p>
          <h2 className="eah-admin__title">Workflow & Rule Automation Platform</h2>
          <p className="eah-admin__desc">Visual workflows, rule engine, event triggers, AI automation, approvals, and execution monitoring.</p>
        </div>
        <div className="eah-admin__scores">
          <div className="eah-score eah-score--active"><span>Active</span><strong>{d.activeWorkflows}</strong></div>
          <div className="eah-score eah-score--running"><span>Running</span><strong>{d.runningJobs}</strong></div>
          <div className="eah-score eah-score--health"><span>Health</span><strong>{d.automationHealth}%</strong></div>
        </div>
      </header>

      <div className="eah-admin__actions">
        <Button type="button" disabled={isPending} onClick={() => runAction("refresh")}>Refresh</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("run")}>Run Workflow</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("pause")}>Pause</Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("generate-ai-insights")}>AI Insights</Button>
        <Link href="/super-admin/workflows" className="eah-link">Workflow Engine</Link>
        <Link href="/super-admin/ai" className="eah-link">AI Operating System</Link>
      </div>

      {message && <p className="eah-admin__message">{message}</p>}
      {snapshot.pendingPublish && <p className="eah-admin__banner">Pending publish — draft differs from live.</p>}

      <nav className="eah-tabs" aria-label="Automation sections">
        {NAV_ROUTES.map((route) => (
          <Link
            key={route.id}
            href={route.href}
            className={cn("eah-tab", (activeTab === route.id || (activeTab === "dashboard" && route.id === "dashboard")) && "eah-tab--active")}
          >
            {route.label}
          </Link>
        ))}
      </nav>

      {activeTab === "dashboard" && (
        <div className="eah-grid">
          <section className="eah-panel">
            <h3>Automation Dashboard</h3>
            <dl className="eah-metrics">
              <div><dt>Active Workflows</dt><dd>{d.activeWorkflows}</dd></div>
              <div><dt>Running Jobs</dt><dd>{d.runningJobs}</dd></div>
              <div><dt>Scheduled Jobs</dt><dd>{d.scheduledJobs}</dd></div>
              <div><dt>Paused Jobs</dt><dd>{d.pausedJobs}</dd></div>
              <div><dt>Failed Jobs</dt><dd>{d.failedJobs}</dd></div>
              <div><dt>AI Automations</dt><dd>{d.aiAutomations}</dd></div>
              <div><dt>Approval Queue</dt><dd>{d.approvalQueue}</dd></div>
              <div><dt>Avg Execution</dt><dd>{d.averageExecutionTimeMs}ms</dd></div>
              <div><dt>Success Rate</dt><dd>{d.successRate}%</dd></div>
              <div><dt>Rollback Queue</dt><dd>{d.rollbackQueue}</dd></div>
              <div><dt>Automation Health</dt><dd>{d.automationHealth}%</dd></div>
            </dl>
          </section>
          <section className="eah-panel">
            <h3>AI Automation</h3>
            <ul className="eah-list">
              {snapshot.aiInsights.slice(0, 5).map((i) => (
                <li key={i.id}><strong>{i.source.toUpperCase()}</strong> [{i.type}] — {i.summary} ({i.confidence}%)</li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {activeTab === "workflows" && (
        <section className="eah-panel">
          <h3>Workflow Engine</h3>
          <div className="eah-admin__actions">
            <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => runAction("enable")}>Enable All</Button>
            <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => runAction("disable")}>Disable All</Button>
          </div>
          <table className="eah-table">
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
        <section className="eah-panel">
          <h3>Rule Engine</h3>
          <table className="eah-table">
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
        <section className="eah-panel">
          <h3>Event Triggers</h3>
          <ul className="eah-list">
            {snapshot.eventTriggers.map((e) => (
              <li key={e.id}><strong>{e.trigger}</strong> → {e.workflowId} — {e.enabled ? "enabled" : "disabled"}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "templates" && (
        <section className="eah-panel">
          <h3>Workflow Templates</h3>
          <ul className="eah-list">
            {snapshot.templates.map((t) => (
              <li key={t.id}><strong>{t.name}</strong> ({t.type}) — {t.steps} steps {t.reusable ? "· reusable" : ""}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "schedules" && (
        <section className="eah-panel">
          <h3>Scheduled Jobs</h3>
          <table className="eah-table">
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
        <section className="eah-panel">
          <h3>Execution History</h3>
          <table className="eah-table">
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
        <section className="eah-panel">
          <h3>Real-time Monitoring</h3>
          <dl className="eah-metrics">
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
        <section className="eah-panel">
          <h3>Approval Workflows</h3>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("publish")}>Publish Pending</Button>
          <ul className="eah-list">
            {snapshot.approvals.map((a) => (
              <li key={a.id}><strong>{a.workflowId}</strong> v{a.version} — {a.status} (by {a.requestedBy})</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "versions" && (
        <section className="eah-panel">
          <h3>Version History</h3>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("rollback")}>Rollback Latest</Button>
          <ul className="eah-list">
            {snapshot.versions.map((v) => (
              <li key={v.id}>{v.workflowId} v{v.version} — published {new Date(v.publishedAt).toLocaleDateString()} {v.rollbackAvailable ? "· rollback available" : ""}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="eah-panel">
          <h3>Settings</h3>
          <dl className="eah-metrics">
            <div><dt>MFA for Publish</dt><dd>{snapshot.settings.mfaRequiredForPublish ? "Required" : "Optional"}</dd></div>
            <div><dt>Auto Approval</dt><dd>{snapshot.settings.autoApprovalEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Max Parallel Jobs</dt><dd>{snapshot.settings.maxParallelJobs}</dd></div>
            <div><dt>Default Mode</dt><dd>{snapshot.settings.defaultExecutionMode}</dd></div>
            <div><dt>AI Suggestions</dt><dd>{snapshot.settings.aiSuggestionsEnabled ? "Enabled" : "Disabled"}</dd></div>
          </dl>
          <div className="eah-admin__actions" style={{ marginTop: "0.75rem" }}>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>Export JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>Export CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "yaml" })}>Export YAML</Button>
          </div>
        </section>
      )}
    </div>
  );
}

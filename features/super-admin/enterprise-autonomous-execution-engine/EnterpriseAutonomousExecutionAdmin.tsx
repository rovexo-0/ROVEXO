"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getRelatedModuleHref } from "@/lib/enterprise-architecture/registry";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { EXECUTION_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-autonomous-execution-engine/descriptor";
import {
  EXECUTION_ENGINE_API,
  EXECUTION_ENGINE_ROUTES,
  EXECUTION_PIPELINE_STAGES,
  PROTECTED_AREAS,
  RECOVERY_STAGES,
} from "@/lib/enterprise-autonomous-execution-engine/registry";
import type { ExecutionEngineSnapshot, ExecutionEngineTab } from "@/lib/enterprise-autonomous-execution-engine/types";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";

const NAV_ROUTES = EXECUTION_ENGINE_ROUTES;
const MODULE_ID = EXECUTION_ENGINE_MODULE_DESCRIPTOR.id;

type EnterpriseAutonomousExecutionAdminProps = { initialSnapshot: ExecutionEngineSnapshot; defaultTab?: ExecutionEngineTab };

function statusClass(status: string) {
  if (status === "pass" || status === "completed") return "ea-pass";
  if (status === "warning" || status === "waiting-approval" || status === "running") return "ea-warn";
  if (status === "fail" || status === "blocked") return "ea-fail";
  return "";
}

export function EnterpriseAutonomousExecutionAdmin({ initialSnapshot, defaultTab = "dashboard" }: EnterpriseAutonomousExecutionAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(EXECUTION_ENGINE_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { autonomousExecution?: ExecutionEngineSnapshot };
    if (data.autonomousExecution) setSnapshot(data.autonomousExecution);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "orchestrate" ? EXECUTION_ENGINE_API.orchestrate
            : action === "execute" ? EXECUTION_ENGINE_API.execute
              : action === "prioritize" ? EXECUTION_ENGINE_API.prioritize
                : action === "approve" ? EXECUTION_ENGINE_API.approve
                  : action === "recover" ? EXECUTION_ENGINE_API.recover
                    : action === "export" ? EXECUTION_ENGINE_API.export
                      : EXECUTION_ENGINE_API.action;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; autonomousExecution?: ExecutionEngineSnapshot };
        setMessage(response.ok ? "Execution action completed." : data.error ?? "Action failed.");
        if (data.autonomousExecution) setSnapshot(data.autonomousExecution);
        else await refresh();
      });
    },
    [refresh],
  );

  const omegaHref = getRelatedModuleHref(MODULE_ID, "omega-command-center");
  const qaHref = getRelatedModuleHref(MODULE_ID, "omega-quality-assurance-center");
  const governanceHref = getRelatedModuleHref(MODULE_ID, "enterprise-governance-center");
  const deploymentHref = getRelatedModuleHref(MODULE_ID, "enterprise-deployment-center");

  const validations = createOmegaValidations(
    {
      architecture: snapshot.dashboard.platformReadiness >= 90 ? "pass" : "warning",
      security: snapshot.dashboard.certificationStatus === "pass" ? "pass" : "warning",
      governance: snapshot.settings.approvalGatesEnforced ? "pass" : "warning",
      performance: snapshot.dashboard.enterpriseScore >= 95 ? "pass" : "warning",
      marketplace: snapshot.dashboard.deploymentStatus === "pass" ? "pass" : "warning",
    },
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );

  const dashboard = activeTab === "dashboard"
    ? {
        ...createDefaultEnterpriseDashboard("Autonomous Execution"),
        kpis: [
          { id: "running", label: "Running Workflows", value: snapshot.dashboard.runningWorkflows, status: "healthy" as const },
          { id: "approval", label: "Waiting Approval", value: snapshot.dashboard.waitingApproval, status: snapshot.dashboard.waitingApproval > 0 ? "warning" as const : "healthy" as const },
          { id: "readiness", label: "Platform Readiness", value: `${snapshot.dashboard.platformReadiness}%`, status: "healthy" as const },
          { id: "failed", label: "Failed Tasks", value: snapshot.dashboard.failedTasks, status: snapshot.dashboard.failedTasks > 0 ? "warning" as const : "healthy" as const },
        ],
        recentActivity: snapshot.auditEntries.slice(0, 5).map((entry) => ({
          id: entry.id,
          action: entry.action,
          actor: entry.actor,
          target: entry.target,
          timestamp: entry.timestamp,
        })),
        aiInsights: ["Autonomous Execution: Never bypasses Governance, Security, QA, Certification, or Deployment approval gates."],
        quickActions: [
          ...(omegaHref ? [{ label: "OMEGA Command", href: omegaHref }] : []),
          ...(deploymentHref ? [{ label: "Deployment", href: deploymentHref }] : []),
        ],
      }
    : undefined;

  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Autonomous Execution Engine"
      title="OMEGA Workflow Orchestrator"
      description="Execution layer of the ROVEXO ecosystem — coordinates enterprise modules through approved workflows while respecting Governance, Security, QA, Certification, and human approval."
      enterpriseScore={snapshot.dashboard.enterpriseScore}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={NAV_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={
        snapshot.settings.neverBypassProtectedAreas
          ? "Protected area enforcement active — approval required before deployment and protected changes."
          : undefined
      }
      aiInsight="OMEGA PRIME: Autonomous Execution Engine transforms OMEGA from analysis into enterprise workflow orchestration."
      showDashboard={activeTab === "dashboard"}
      dashboard={dashboard}
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("orchestrate")}>Sync Orchestration</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("execute", { workflowType: "development" })}>Start Workflow</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("prioritize")}>Reprioritize Tasks</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("recover", { issue: "Workflow failure" })}>Start Recovery</Button>
        </>
      }
      quickLinks={[
        ...(omegaHref ? [{ label: "OMEGA", href: omegaHref }] : []),
        ...(qaHref ? [{ label: "QA Center", href: qaHref }] : []),
        ...(governanceHref ? [{ label: "Governance", href: governanceHref }] : []),
        ...(deploymentHref ? [{ label: "Deployment", href: deploymentHref }] : []),
      ]}
    >
      {activeTab === "dashboard" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Live Execution Dashboard</h3>
          <dl className="ea-metrics">
            <div><dt>Completed Tasks</dt><dd>{snapshot.dashboard.completedTasks}</dd></div>
            <div><dt>Certification</dt><dd className={statusClass(snapshot.dashboard.certificationStatus)}>{snapshot.dashboard.certificationStatus.toUpperCase()}</dd></div>
            <div><dt>Deployment</dt><dd className={statusClass(snapshot.dashboard.deploymentStatus)}>{snapshot.dashboard.deploymentStatus.toUpperCase()}</dd></div>
            <div><dt>Enterprise Score</dt><dd>{snapshot.dashboard.enterpriseScore}%</dd></div>
          </dl>
        </section>
      )}

      {activeTab === "orchestration" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Enterprise Orchestration</h3>
          <table className="ea-table">
            <thead><tr><th>Module</th><th>Role</th><th>Status</th><th>Pending Tasks</th><th>Last Sync</th></tr></thead>
            <tbody>
              {snapshot.coordinations.map((coord) => (
                <tr key={coord.moduleId}>
                  <td>
                    {getRelatedModuleHref(MODULE_ID, coord.moduleId)
                      ? <Link href={getRelatedModuleHref(MODULE_ID, coord.moduleId)!} className="ea-link">{coord.label}</Link>
                      : coord.label}
                  </td>
                  <td>{coord.role}</td>
                  <td className={statusClass(coord.status)}>{coord.status.toUpperCase()}</td>
                  <td>{coord.pendingTasks}</td>
                  <td>{new Date(coord.lastSyncAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "workflows" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Autonomous Workflow Engine</h3>
          <table className="ea-table">
            <thead><tr><th>Workflow</th><th>Stage</th><th>Priority</th><th>Status</th><th>Approval</th><th></th></tr></thead>
            <tbody>
              {snapshot.workflows.map((wf) => (
                <tr key={wf.id}>
                  <td>{wf.label}</td>
                  <td>{wf.currentStage.replace(/-/g, " ")}</td>
                  <td>{wf.priority}</td>
                  <td className={statusClass(wf.status)}>{wf.status.toUpperCase()}</td>
                  <td>{wf.awaitingApproval ? "YES" : "NO"}</td>
                  <td>
                    {wf.status === "running" && (
                      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("execute", { workflowId: wf.id })}>Advance</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "tasks" && (
        <section className="ea-panel ea-panel--wide">
          <h3>OMEGA Task Manager</h3>
          <table className="ea-table">
            <thead><tr><th>Task</th><th>Queue</th><th>Priority</th><th>Status</th><th>Dependencies</th><th>Created</th></tr></thead>
            <tbody>
              {snapshot.tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.queue.replace(/-/g, " ")}</td>
                  <td>{task.priority}</td>
                  <td className={statusClass(task.status)}>{task.status.toUpperCase()}</td>
                  <td>{task.dependencies.join(", ") || "—"}</td>
                  <td>{new Date(task.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "priority" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Smart Priority Engine</h3>
          <table className="ea-table">
            <thead><tr><th>Factor</th><th>Score</th><th>Weight</th><th>Status</th></tr></thead>
            <tbody>
              {snapshot.priorityScores.map((score) => (
                <tr key={score.factor}>
                  <td>{score.label}</td>
                  <td>{score.score}</td>
                  <td>{score.weight}</td>
                  <td className={statusClass(score.status)}>{score.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "pipeline" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Execution Pipeline</h3>
          <div className="ea-chip-row">
            {EXECUTION_PIPELINE_STAGES.map((stage) => (
              <span key={stage} className="ea-chip ea-chip--active">{stage.replace(/-/g, " ")}</span>
            ))}
          </div>
          <table className="ea-table">
            <thead><tr><th>Workflow</th><th>Current Stage</th><th>Completed</th><th>Blocked</th><th>Approval</th></tr></thead>
            <tbody>
              {snapshot.pipeline.map((item) => (
                <tr key={item.id}>
                  <td>{item.workflow}</td>
                  <td>{item.currentStage.replace(/-/g, " ")}</td>
                  <td>{item.stagesCompleted.map((s) => s.replace(/-/g, " ")).join(" → ")}</td>
                  <td className={item.blocked ? "ea-fail" : "ea-pass"}>{item.blocked ? "YES" : "NO"}</td>
                  <td className={item.awaitingApproval ? "ea-warn" : "ea-pass"}>{item.awaitingApproval ? "YES" : "NO"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "approvals" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Enterprise Approval Gates</h3>
          <table className="ea-table">
            <thead><tr><th>Gate</th><th>Protected</th><th>Status</th><th>Requested</th><th></th></tr></thead>
            <tbody>
              {snapshot.approvalGates.map((gate) => (
                <tr key={gate.id}>
                  <td>{gate.label}</td>
                  <td>{gate.protectedArea ? "YES" : "NO"}</td>
                  <td className={statusClass(gate.status)}>{gate.status.toUpperCase()}</td>
                  <td>{new Date(gate.requestedAt).toLocaleString()}</td>
                  <td>
                    {gate.status === "waiting-approval" && (
                      <>
                        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("approve", { gateId: gate.id, approved: true })}>Approve</Button>
                        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("approve", { gateId: gate.id, approved: false })}>Reject</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "recovery" && (
        <section className="ea-panel ea-panel--wide">
          <h3>Automated Recovery</h3>
          <div className="ea-chip-row">
            {RECOVERY_STAGES.map((stage) => (
              <span key={stage} className="ea-chip ea-chip--active">{stage.replace(/-/g, " ")}</span>
            ))}
          </div>
          <ul className="ea-list">
            {snapshot.recoveries.map((recovery) => (
              <li key={recovery.id}>
                <strong>{recovery.issue}</strong> — {recovery.stage.replace(/-/g, " ")} · {recovery.status}
                <br />
                <small>Diagnostics: {recovery.diagnosticsCollected ? "YES" : "NO"} · Incident notified: {recovery.incidentNotified ? "YES" : "NO"}</small>
                {recovery.status === "running" && (
                  <div className="ea-admin__actions">
                    <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("recover", { recoveryId: recovery.id })}>Advance Recovery</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "decisions" && (
        <section className="ea-panel ea-panel--wide">
          <h3>OMEGA Decision Support</h3>
          <ul className="ea-list">
            {snapshot.decisions.map((decision) => (
              <li key={decision.id}>
                <strong>{decision.recommendedAction}</strong>
                <span className={cn("ea-chip", decision.riskAssessment === "critical" ? "ea-chip--danger" : "")}> {decision.riskAssessment}</span>
                <br />
                <small>ETA: {decision.estimatedCompletion} · Business impact: {decision.businessImpact}% · Certification: {decision.certificationImpact}%</small>
                <br />
                <small>Rollback: {decision.rollbackStrategy}</small>
                {decision.requiresApproval && <span className="ea-chip ea-chip--active"> Requires approval</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="ea-panel">
          <h3>Execution Reports</h3>
          <p className="ea-admin__desc">Protected areas: {PROTECTED_AREAS.map((a) => a.replace(/-/g, " ")).join(", ")}</p>
          <div className="ea-admin__actions">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "json" })}>JSON</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "csv" })}>CSV</Button>
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export", { format: "pdf" })}>PDF</Button>
          </div>
          <ul className="ea-list">
            {snapshot.reports.map((report) => (
              <li key={report.id}>
                {report.title} — {report.status} · {new Date(report.generatedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      )}
    </EnterpriseAdminShell>
  );
}

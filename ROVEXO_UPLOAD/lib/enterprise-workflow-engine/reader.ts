import type { WorkflowEngineTab, WorkflowEngineSnapshot } from "@/lib/enterprise-workflow-engine/types";
import { buildWorkflowAnalytics, buildWorkflowDashboard, computeHealthScore } from "@/lib/enterprise-workflow-engine/analytics";
import { createApprovalChain } from "@/lib/enterprise-workflow-engine/approval";
import { getWorkflowEngineLiveDocument, detectWorkflowPendingPublish } from "@/lib/enterprise-workflow-engine/config";
import { getWorkflowEngineDraftDocument } from "@/lib/enterprise-workflow-engine/config";
import { WORKFLOW_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-workflow-engine/descriptor";
import { DEFAULT_WORKFLOW_TEMPLATES } from "@/lib/enterprise-workflow-engine/templates";
import { createVersionEntry } from "@/lib/enterprise-workflow-engine/versioning";

export async function getWorkflowEngineSnapshot(tab: WorkflowEngineTab = "dashboard"): Promise<WorkflowEngineSnapshot> {
  const live = await getWorkflowEngineLiveDocument();
  const draft = await getWorkflowEngineDraftDocument();
  const { workflows, executions, schedules } = live.settings;
  const flags = live.featureFlags;

  const approvals = workflows.flatMap((w) =>
    executions
      .filter((e) => e.workflowId === w.id && e.status === "waiting-approval")
      .flatMap((e) => createApprovalChain(e.id, w)),
  );

  const analytics = buildWorkflowAnalytics(executions, approvals);
  const dashboard = buildWorkflowDashboard(workflows, executions, approvals, schedules.length, analytics);
  const versions = workflows
    .filter((w) => w.publishedAt)
    .map((w) => createVersionEntry(w, "system", `Live v${w.version}`));

  const enabled = flags.workflow_engine_enabled !== false;
  const healthScore = computeHealthScore(analytics, enabled);

  return {
    tab,
    dashboard,
    analytics,
    workflows,
    templates: DEFAULT_WORKFLOW_TEMPLATES,
    executions,
    approvals,
    schedules,
    versions,
    history: versions,
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    featureFlags: flags,
    pendingPublish: detectWorkflowPendingPublish(draft, live),
    health: {
      status: healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "failed",
      score: healthScore,
      message: enabled ? "Workflow engine operational" : "Workflow engine disabled by feature flag",
    },
  };
}

export async function getWorkflowEnginePageData(tab: WorkflowEngineTab = "dashboard") {
  const snapshot = await getWorkflowEngineSnapshot(tab);
  return { snapshot, descriptor: WORKFLOW_ENGINE_MODULE_DESCRIPTOR };
}

export function validateWorkflowEngineReadiness(snapshot: WorkflowEngineSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlags.workflow_engine_enabled !== false,
    snapshot.workflows.length > 0,
    snapshot.health.score >= 50,
    snapshot.templates.length > 0,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}

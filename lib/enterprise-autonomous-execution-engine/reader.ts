import type { ExecutionEngineSnapshot, ExecutionEngineTab } from "@/lib/enterprise-autonomous-execution-engine/types";
import {
  detectExecutionEnginePendingPublish,
  getExecutionEngineDraftDocument,
  getExecutionEngineLiveDocument,
  executionEngineConfigLifecycle,
} from "@/lib/enterprise-autonomous-execution-engine/config";
import { EXECUTION_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-autonomous-execution-engine/descriptor";
import { computeExecutionEnterpriseScore, createDefaultExecutionEngineSettings } from "@/lib/enterprise-autonomous-execution-engine/engine";

export async function getExecutionEngineSnapshot(tab: ExecutionEngineTab = "dashboard"): Promise<ExecutionEngineSnapshot> {
  const live = await getExecutionEngineLiveDocument();
  const draft = await getExecutionEngineDraftDocument();
  const {
    dashboard,
    coordinations,
    workflows,
    tasks,
    priorityScores,
    pipeline,
    approvalGates,
    recoveries,
    decisions,
    reports,
    auditEntries,
    orchestrationEnabled,
    autonomousWorkflowsEnabled,
    approvalGatesEnforced,
    neverBypassProtectedAreas,
    autoRecoveryEnabled,
    coordinateWithIncidentResponse,
  } = live.settings;
  const settings = {
    ...createDefaultExecutionEngineSettings(),
    orchestrationEnabled,
    autonomousWorkflowsEnabled,
    approvalGatesEnforced: approvalGatesEnforced ?? true,
    neverBypassProtectedAreas: neverBypassProtectedAreas ?? true,
    autoRecoveryEnabled,
    coordinateWithIncidentResponse,
  };
  const flags = live.featureFlags;
  const enabled = flags.enterprise_autonomous_execution_engine_v1 !== false;
  const enterpriseScore = enabled ? computeExecutionEnterpriseScore({ dashboard, priorityScores }) : 0;
  const history = await executionEngineConfigLifecycle.getHistory();

  return {
    tab,
    dashboard: enabled ? { ...dashboard, enterpriseScore } : { ...dashboard, platformReadiness: 0, enterpriseScore: 0, runningWorkflows: 0 },
    coordinations: flags.orchestration_enabled !== false ? coordinations : [],
    workflows: flags.autonomous_workflows_enabled !== false ? workflows : [],
    tasks,
    priorityScores: flags.priority_engine_enabled !== false ? priorityScores : [],
    pipeline,
    approvalGates: flags.approval_gates_enforced !== false ? approvalGates : [],
    recoveries: flags.auto_recovery_enabled !== false ? recoveries : [],
    decisions: flags.decision_support_enabled !== false ? decisions : [],
    reports,
    auditEntries,
    settings,
    history: history.map((h) => ({ id: h.id, action: "publish", actor: h.publishedBy, timestamp: h.publishedAt })),
    auditLog: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      target: e.module,
      timestamp: e.timestamp,
    })),
    featureFlagsConfig: flags,
    pendingPublish: detectExecutionEnginePendingPublish(draft, live),
    health: {
      status: enterpriseScore >= 95 ? "healthy" : enterpriseScore >= 80 ? "warning" : "critical",
      score: enterpriseScore,
      message: enabled ? "Autonomous Execution Engine operational — approval gates enforced" : "Execution Engine disabled",
    },
  };
}

export async function getExecutionEnginePageData(tab: ExecutionEngineTab = "dashboard") {
  const snapshot = await getExecutionEngineSnapshot(tab);
  return { snapshot, descriptor: EXECUTION_ENGINE_MODULE_DESCRIPTOR };
}

export function validateExecutionEngineReadiness(snapshot: ExecutionEngineSnapshot): { ready: boolean; score: number } {
  const checks = [
    snapshot.featureFlagsConfig.enterprise_autonomous_execution_engine_v1 !== false,
    snapshot.settings.neverBypassProtectedAreas === true,
    snapshot.settings.approvalGatesEnforced === true,
    snapshot.coordinations.length > 0,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return { ready: score >= 75, score };
}

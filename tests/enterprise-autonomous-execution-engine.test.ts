import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformExecutionEngineAction, requiresMfaForExecutionEngine } from "@/lib/enterprise-autonomous-execution-engine/audit";
import { isExecutionEngineConfigAction } from "@/lib/enterprise-autonomous-execution-engine/config-actions";
import { EXECUTION_ENGINE_MODULE_DESCRIPTOR } from "@/lib/enterprise-autonomous-execution-engine/descriptor";
import {
  advanceRecovery,
  advanceWorkflow,
  allPipelineStagesComplete,
  computeExecutionEnterpriseScore,
  createDefaultExecutionEngineSettings,
  createDefaultExecutionEngineState,
  isProtectedExecutionTarget,
  prioritizeTasks,
  processApproval,
  requiresApprovalForAction,
  startRecovery,
  startWorkflow,
  syncOrchestration,
} from "@/lib/enterprise-autonomous-execution-engine/engine";
import { exportExecutionEngineSnapshot, isValidExecutionExportFormat } from "@/lib/enterprise-autonomous-execution-engine/export";
import { computeExecutionEngineHealth } from "@/lib/enterprise-autonomous-execution-engine/health";
import { validateExecutionEngineReadiness } from "@/lib/enterprise-autonomous-execution-engine/reader";
import {
  APPROVAL_GATE_TYPES,
  ENTERPRISE_WORKFLOW_TYPES,
  EXECUTION_ENGINE_API,
  EXECUTION_ENGINE_ROUTES,
  EXECUTION_PIPELINE_STAGES,
  ORCHESTRATION_MODULES,
  PRIORITY_FACTORS,
  PROTECTED_AREAS,
  RECOVERY_STAGES,
  REPORT_TYPES,
  TASK_QUEUE_TYPES,
} from "@/lib/enterprise-autonomous-execution-engine/registry";
import type { ExecutionEngineSnapshot } from "@/lib/enterprise-autonomous-execution-engine/types";

function sampleSnapshot(): ExecutionEngineSnapshot {
  const state = createDefaultExecutionEngineState();
  const settings = createDefaultExecutionEngineSettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      enterprise_autonomous_execution_engine_v1: true,
      orchestration_enabled: true,
      autonomous_workflows_enabled: true,
      approval_gates_enforced: true,
      auto_recovery_enabled: true,
      priority_engine_enabled: true,
      decision_support_enabled: true,
      never_bypass_protected_areas: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("enterprise autonomous execution descriptor", () => {
  it("registers module id", () => {
    expect(EXECUTION_ENGINE_MODULE_DESCRIPTOR.id).toBe("enterprise-autonomous-execution-engine");
  });

  it("auto registers", () => {
    expect(EXECUTION_ENGINE_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(EXECUTION_ENGINE_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/autonomous-execution");
  });

  it("has master feature flag", () => {
    expect(EXECUTION_ENGINE_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("enterprise_autonomous_execution_engine_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-autonomous-execution-engine")?.id).toBe("enterprise-autonomous-execution-engine");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-autonomous-execution-engine")?.moduleId).toBe("enterprise-autonomous-execution-engine");
  });
});

describe("enterprise autonomous execution registry constants", () => {
  it("defines orchestration modules", () => {
    expect(ORCHESTRATION_MODULES).toContain("omega-command-center");
    expect(ORCHESTRATION_MODULES).toContain("enterprise-e2e-validation-engine");
    expect(ORCHESTRATION_MODULES.length).toBeGreaterThan(10);
  });

  it("defines workflow types", () => {
    expect(ENTERPRISE_WORKFLOW_TYPES).toContain("development");
    expect(ENTERPRISE_WORKFLOW_TYPES).toContain("deployment");
    expect(ENTERPRISE_WORKFLOW_TYPES).toContain("marketplace-review");
  });

  it("defines pipeline stages", () => {
    expect(EXECUTION_PIPELINE_STAGES[0]).toBe("planning");
    expect(EXECUTION_PIPELINE_STAGES).toContain("e2e-validation");
    expect(EXECUTION_PIPELINE_STAGES.at(-1)).toBe("production-monitoring");
  });

  it("defines routes and api", () => {
    expect(EXECUTION_ENGINE_ROUTES.length).toBe(10);
    expect(EXECUTION_ENGINE_API.snapshot).toBe("/api/super-admin/autonomous-execution");
    expect(EXECUTION_ENGINE_API.approve).toBe("/api/super-admin/autonomous-execution/approve");
  });

  it("defines protected areas and approval gates", () => {
    expect(PROTECTED_AREAS).toContain("payments");
    expect(APPROVAL_GATE_TYPES).toContain("deployment");
    expect(APPROVAL_GATE_TYPES).toContain("marketplace-logic-changes");
  });

  it("defines task queues and priority factors", () => {
    expect(TASK_QUEUE_TYPES).toContain("deployment-queue");
    expect(PRIORITY_FACTORS).toContain("security-risk");
    expect(RECOVERY_STAGES).toContain("await-approval");
  });
});

describe("enterprise autonomous execution engine", () => {
  it("creates default state with execution data", () => {
    const state = createDefaultExecutionEngineState();
    expect(state.coordinations.length).toBe(ORCHESTRATION_MODULES.length);
    expect(state.workflows.length).toBeGreaterThan(0);
    expect(state.priorityScores.length).toBe(PRIORITY_FACTORS.length);
    expect(state.approvalGates.length).toBe(APPROVAL_GATE_TYPES.length);
  });

  it("computes enterprise score", () => {
    const state = createDefaultExecutionEngineState();
    const score = computeExecutionEnterpriseScore(state);
    expect(score).toBeGreaterThan(80);
  });

  it("syncs orchestration", () => {
    const coordinations = syncOrchestration();
    expect(coordinations.length).toBe(ORCHESTRATION_MODULES.length);
    expect(coordinations[0]?.lastSyncAt).toBeTruthy();
  });

  it("starts and advances workflows", () => {
    const workflow = startWorkflow("development");
    expect(workflow.currentStage).toBe("planning");
    expect(workflow.status).toBe("running");
    const advanced = advanceWorkflow(workflow);
    expect(advanced.currentStage).not.toBe("planning");
  });

  it("prioritizes tasks by priority score", () => {
    const state = createDefaultExecutionEngineState();
    const sorted = prioritizeTasks(state.tasks);
    expect(sorted[0]!.priority).toBeGreaterThanOrEqual(sorted.at(-1)!.priority);
  });

  it("processes approval gates with protected area blocking", () => {
    const state = createDefaultExecutionEngineState();
    const gate = state.approvalGates.find((g) => g.protectedArea)!;
    const rejected = processApproval(gate, false);
    expect(rejected.status).toBe("blocked");
    const approved = processApproval(gate, true);
    expect(approved.status).toBe("pass");
  });

  it("starts and advances recovery", () => {
    const recovery = startRecovery("Workflow failure");
    expect(recovery.stage).toBe("pause-workflow");
    const advanced = advanceRecovery(recovery);
    expect(advanced.stage).not.toBe("pause-workflow");
    expect(advanced.diagnosticsCollected).toBe(true);
  });

  it("detects protected execution targets", () => {
    expect(isProtectedExecutionTarget("payments")).toBe(true);
    expect(isProtectedExecutionTarget("homepage")).toBe(false);
  });

  it("requires approval for protected actions", () => {
    expect(requiresApprovalForAction("deployment")).toBe(true);
    expect(requiresApprovalForAction("orchestrate")).toBe(false);
  });

  it("checks pipeline completion", () => {
    const state = createDefaultExecutionEngineState();
    const complete = state.pipeline.find((p) => p.stagesCompleted.includes("production-monitoring"));
    if (complete) expect(allPipelineStagesComplete(complete)).toBe(true);
    expect(allPipelineStagesComplete(state.pipeline[0]!)).toBe(false);
  });
});

describe("enterprise autonomous execution export and health", () => {
  it("exports snapshot formats", () => {
    const snapshot = sampleSnapshot();
    expect(isValidExecutionExportFormat("json")).toBe(true);
    expect(exportExecutionEngineSnapshot(snapshot, "json")).toContain("exportedAt");
    expect(exportExecutionEngineSnapshot(snapshot, "csv")).toContain("queue");
    expect(exportExecutionEngineSnapshot(snapshot, "pdf")).toContain("Platform Readiness");
  });

  it("computes health checks", () => {
    const snapshot = sampleSnapshot();
    const health = computeExecutionEngineHealth(snapshot);
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("validates readiness", () => {
    const snapshot = sampleSnapshot();
    const readiness = validateExecutionEngineReadiness(snapshot);
    expect(readiness.ready).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(75);
  });
});

describe("enterprise autonomous execution audit and permissions", () => {
  it("maps config actions", () => {
    expect(isExecutionEngineConfigAction("publish-config")).toBe(true);
    expect(isExecutionEngineConfigAction("orchestrate")).toBe(false);
  });

  it("requires mfa for approve", () => {
    expect(requiresMfaForExecutionEngine("approve")).toBe(true);
    expect(requiresMfaForExecutionEngine("orchestrate")).toBe(false);
  });

  it("allows orchestrate for super-admin role mapping", () => {
    const result = canPerformExecutionEngineAction({ action: "orchestrate" });
    expect(result.allowed).toBe(true);
  });
});

describe("enterprise autonomous execution domains", () => {
  it("tracks report types", () => {
    expect(REPORT_TYPES).toContain("certification");
    expect(REPORT_TYPES).toContain("deployment");
  });

  it("tracks recovery stages", () => {
    expect(RECOVERY_STAGES).toContain("resume-workflow");
    expect(RECOVERY_STAGES).toContain("notify-incident-center");
  });
});

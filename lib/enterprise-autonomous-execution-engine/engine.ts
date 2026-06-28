import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import {
  APPROVAL_GATE_TYPES,
  ENTERPRISE_WORKFLOW_TYPES,
  EXECUTION_PIPELINE_STAGES,
  ORCHESTRATION_MODULES,
  PRIORITY_FACTORS,
  PROTECTED_AREAS,
  RECOVERY_STAGES,
  REPORT_TYPES,
} from "@/lib/enterprise-autonomous-execution-engine/registry";
import type {
  ApprovalGate,
  EnterpriseWorkflow,
  EnterpriseWorkflowType,
  ExecutionDashboard,
  ExecutionEngineSettings,
  ExecutionEngineState,
  ExecutionPipelineStage,
  ExecutionStatus,
  ModuleCoordination,
  OmegaDecision,
  OmegaTask,
  PipelineItem,
  PriorityScore,
  RecoveryWorkflow,
  ExecutionAuditEntry,
  ExecutionReport,
} from "@/lib/enterprise-autonomous-execution-engine/types";

export function createDefaultExecutionEngineSettings(): ExecutionEngineSettings {
  return {
    orchestrationEnabled: true,
    autonomousWorkflowsEnabled: true,
    approvalGatesEnforced: true,
    neverBypassProtectedAreas: true,
    autoRecoveryEnabled: true,
    coordinateWithIncidentResponse: true,
  };
}

function statusForIndex(index: number): ExecutionStatus {
  if (index % 19 === 0) return "fail";
  if (index % 11 === 0) return "waiting-approval";
  if (index % 7 === 0) return "warning";
  if (index % 13 === 0) return "blocked";
  return "pass";
}

function createDashboard(): ExecutionDashboard {
  return {
    runningWorkflows: 6,
    waitingApproval: 3,
    failedTasks: 2,
    completedTasks: 47,
    platformReadiness: 94.2,
    enterpriseScore: 98.5,
    certificationStatus: "pass",
    deploymentStatus: "waiting-approval",
  };
}

function createCoordinations(): ModuleCoordination[] {
  const roles: Record<string, string> = {
    "omega-command-center": "AI orchestration hub",
    "enterprise-ai-operating-system": "SCAN • SENTINEL • OMEGA AI layer",
    "omega-development-director": "Development coordination",
    "omega-quality-assurance-center": "QA validation gate",
    "enterprise-observability-center": "Operational telemetry",
    "enterprise-governance-center": "Governance & constitution",
    "enterprise-security-operations-center": "Security validation",
    "incident-response-center": "Incident coordination",
    "enterprise-business-intelligence": "Business impact analytics",
    "enterprise-deployment-center": "Release orchestration",
    "certification-center": "Production certification",
    "enterprise-e2e-validation-engine": "E2E validation gate",
    "enterprise-automation-hub": "Workflow automation",
    "mission-control-engine": "Platform command",
  };
  return ORCHESTRATION_MODULES.map((moduleId, i) => {
    const desc = getEnterpriseModuleDescriptor(moduleId);
    return {
      moduleId,
      label: desc?.label ?? moduleId,
      role: roles[moduleId] ?? "Enterprise module",
      status: statusForIndex(i),
      lastSyncAt: new Date(Date.now() - i * 300000).toISOString(),
      pendingTasks: i % 4,
    };
  });
}

function createWorkflows(): EnterpriseWorkflow[] {
  return ENTERPRISE_WORKFLOW_TYPES.slice(0, 8).map((type, i) => ({
    id: `wf-${type}`,
    type,
    label: type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    currentStage: EXECUTION_PIPELINE_STAGES[Math.min(i + 2, EXECUTION_PIPELINE_STAGES.length - 1)]!,
    status: statusForIndex(i),
    priority: 100 - i * 8,
    assignedModules: [ORCHESTRATION_MODULES[i % ORCHESTRATION_MODULES.length]!, ORCHESTRATION_MODULES[(i + 1) % ORCHESTRATION_MODULES.length]!],
    startedAt: new Date(Date.now() - i * 3600000).toISOString(),
    awaitingApproval: i % 5 === 0,
  }));
}

function createTasks(): OmegaTask[] {
  const queues = ["task-queue", "priority-queue", "certification-queue", "deployment-queue", "retry-queue", "recovery-queue"] as const;
  return Array.from({ length: 12 }, (_, i) => ({
    id: `task-${i}`,
    title: `Enterprise task ${i + 1}`,
    queue: queues[i % queues.length]!,
    status: statusForIndex(i),
    priority: 90 - i * 5,
    dependencies: i > 0 ? [`task-${i - 1}`] : [],
    moduleId: ORCHESTRATION_MODULES[i % ORCHESTRATION_MODULES.length],
    createdAt: new Date(Date.now() - i * 1800000).toISOString(),
    completedAt: i % 4 === 0 ? new Date(Date.now() - i * 900000).toISOString() : undefined,
  }));
}

function createPriorityScores(): PriorityScore[] {
  const weights: Record<string, number> = {
    "business-impact": 12,
    "customer-impact": 10,
    "security-risk": 15,
    "performance-impact": 8,
    "revenue-impact": 12,
    "certification-impact": 10,
    "architecture-risk": 9,
    "technical-debt": 7,
    "platform-stability": 11,
  };
  return PRIORITY_FACTORS.map((factor, i) => ({
    factor,
    label: factor.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    score: 70 + (i % 5) * 6,
    weight: weights[factor] ?? 8,
    status: statusForIndex(i),
  }));
}

function createPipeline(): PipelineItem[] {
  return [
    { id: "pipe-1", workflow: "Feature: Development Director integration", currentStage: "e2e-validation", stagesCompleted: ["planning", "architecture-review", "development", "qa", "security", "governance", "observability"], blocked: false, awaitingApproval: false },
    { id: "pipe-2", workflow: "Bug Fix: Category rail accessibility", currentStage: "qa", stagesCompleted: ["planning", "development"], blocked: false, awaitingApproval: false },
    { id: "pipe-3", workflow: "Deployment: Observability Center v1", currentStage: "certification", stagesCompleted: EXECUTION_PIPELINE_STAGES.slice(0, 8) as ExecutionPipelineStage[], blocked: false, awaitingApproval: true },
    { id: "pipe-4", workflow: "Certification: E2E Validation Engine", currentStage: "deployment", stagesCompleted: EXECUTION_PIPELINE_STAGES.slice(0, 9) as ExecutionPipelineStage[], blocked: true, awaitingApproval: true },
  ];
}

function createApprovalGates(): ApprovalGate[] {
  return APPROVAL_GATE_TYPES.map((type, i) => ({
    id: `gate-${type}`,
    type,
    label: type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    required: true,
    status: i < 2 ? "waiting-approval" : statusForIndex(i),
    requestedBy: "enterprise-autonomous-execution-engine",
    requestedAt: new Date(Date.now() - i * 7200000).toISOString(),
    approvedAt: i > 4 ? new Date(Date.now() - i * 3600000).toISOString() : undefined,
    protectedArea: ["payment-changes", "authentication-changes", "marketplace-logic-changes", "database-migration"].includes(type),
  }));
}

function createRecoveries(): RecoveryWorkflow[] {
  return [
    { id: "rec-1", issue: "Workflow blocked at certification stage", stage: "run-validation", status: "running", diagnosticsCollected: true, incidentNotified: true, readyToResume: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "rec-2", issue: "Deployment pipeline timeout", stage: "await-approval", status: "waiting-approval", diagnosticsCollected: true, incidentNotified: true, readyToResume: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: "rec-3", issue: "QA validation failure — auto-recovered", stage: "resume-workflow", status: "completed", diagnosticsCollected: true, incidentNotified: false, readyToResume: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  ];
}

function createDecisions(): OmegaDecision[] {
  return [
    { id: "dec-1", recommendedAction: "Advance E2E Validation Engine through certification pipeline", estimatedCompletion: "2 business days", riskAssessment: "low", businessImpact: 65, certificationImpact: 90, rollbackStrategy: "Revert to previous certification snapshot", requiresApproval: true },
    { id: "dec-2", recommendedAction: "Pause deployment — await governance approval for payment module", estimatedCompletion: "Pending approval", riskAssessment: "critical", businessImpact: 85, certificationImpact: 95, rollbackStrategy: "No deployment — protected area", requiresApproval: true },
    { id: "dec-3", recommendedAction: "Run regression on Observability Center integration", estimatedCompletion: "4 hours", riskAssessment: "medium", businessImpact: 40, certificationImpact: 55, rollbackStrategy: "Disable observability feature flag", requiresApproval: false },
  ];
}

function createReports(): ExecutionReport[] {
  return REPORT_TYPES.map((type, i) => ({
    id: `rpt-${type}`,
    type,
    title: `${type.charAt(0).toUpperCase()}${type.slice(1)} Report`,
    generatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    status: "pass" as const,
  }));
}

function createAuditEntries(): ExecutionAuditEntry[] {
  return [
    { id: "aud-1", action: "orchestration-sync", actor: "enterprise-autonomous-execution-engine", target: "global", timestamp: new Date(Date.now() - 3600000).toISOString(), result: "pass" },
    { id: "aud-2", action: "approval-gate-block", actor: "enterprise-autonomous-execution-engine", target: "payment-changes", timestamp: new Date(Date.now() - 1800000).toISOString(), result: "blocked" },
    { id: "aud-3", action: "workflow-recovery", actor: "enterprise-autonomous-execution-engine", target: "incident-response-center", timestamp: new Date().toISOString(), result: "pass" },
  ];
}

export function createDefaultExecutionEngineState(): ExecutionEngineState {
  return {
    dashboard: createDashboard(),
    coordinations: createCoordinations(),
    workflows: createWorkflows(),
    tasks: createTasks(),
    priorityScores: createPriorityScores(),
    pipeline: createPipeline(),
    approvalGates: createApprovalGates(),
    recoveries: createRecoveries(),
    decisions: createDecisions(),
    reports: createReports(),
    auditEntries: createAuditEntries(),
  };
}

export function computeExecutionEnterpriseScore(state: Pick<ExecutionEngineState, "dashboard" | "priorityScores">): number {
  const avg = [state.dashboard.platformReadiness, state.dashboard.enterpriseScore, ...state.priorityScores.map((p) => p.score)].reduce((s, v) => s + v, 0);
  return Math.round((avg / (2 + state.priorityScores.length)) * 100) / 100;
}

export function syncOrchestration(): ModuleCoordination[] {
  return ORCHESTRATION_MODULES.map((moduleId, i) => {
    const desc = getEnterpriseModuleDescriptor(moduleId);
    return {
      moduleId,
      label: desc?.label ?? moduleId,
      role: "Orchestrated module",
      status: (i % 11 === 0 ? "warning" : "pass") as ExecutionStatus,
      lastSyncAt: new Date().toISOString(),
      pendingTasks: i % 3,
    };
  });
}

export function startWorkflow(type: EnterpriseWorkflowType): EnterpriseWorkflow {
  return {
    id: `wf-${type}-${Date.now()}`,
    type,
    label: type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    currentStage: "planning",
    status: "running",
    priority: 80,
    assignedModules: ["omega-command-center"],
    startedAt: new Date().toISOString(),
    awaitingApproval: false,
  };
}

export function advanceWorkflow(workflow: EnterpriseWorkflow): EnterpriseWorkflow {
  const idx = EXECUTION_PIPELINE_STAGES.indexOf(workflow.currentStage);
  const next = EXECUTION_PIPELINE_STAGES[Math.min(idx + 1, EXECUTION_PIPELINE_STAGES.length - 1)] ?? workflow.currentStage;
  const needsApproval = next === "deployment" || next === "certification";
  return {
    ...workflow,
    currentStage: next,
    status: needsApproval ? "waiting-approval" : "running",
    awaitingApproval: needsApproval,
  };
}

export function prioritizeTasks(tasks: OmegaTask[]): OmegaTask[] {
  return [...tasks].sort((a, b) => b.priority - a.priority);
}

export function processApproval(gate: ApprovalGate, approved: boolean): ApprovalGate {
  if (gate.protectedArea && !approved) {
    return { ...gate, status: "blocked" };
  }
  return {
    ...gate,
    status: approved ? "pass" : "fail",
    approvedAt: approved ? new Date().toISOString() : undefined,
  };
}

export function startRecovery(issue: string): RecoveryWorkflow {
  return {
    id: `rec-${Date.now()}`,
    issue,
    stage: "pause-workflow",
    status: "running",
    diagnosticsCollected: false,
    incidentNotified: false,
    readyToResume: false,
    createdAt: new Date().toISOString(),
  };
}

export function advanceRecovery(recovery: RecoveryWorkflow): RecoveryWorkflow {
  const idx = RECOVERY_STAGES.indexOf(recovery.stage);
  const next = RECOVERY_STAGES[Math.min(idx + 1, RECOVERY_STAGES.length - 1)] ?? recovery.stage;
  return {
    ...recovery,
    stage: next,
    diagnosticsCollected: next !== "pause-workflow" ? true : recovery.diagnosticsCollected,
    incidentNotified: ["notify-incident-center", "generate-repair-proposal", "run-validation", "await-approval", "resume-workflow"].includes(next),
    readyToResume: next === "resume-workflow",
    status: next === "await-approval" ? "waiting-approval" : next === "resume-workflow" ? "completed" : "running",
  };
}

export function isProtectedExecutionTarget(target: string): boolean {
  const normalized = target.toLowerCase();
  return PROTECTED_AREAS.some((area) => normalized.includes(area.replace(/-/g, "")) || normalized.includes(area));
}

export function requiresApprovalForAction(action: string): boolean {
  return APPROVAL_GATE_TYPES.some((gate) => action.toLowerCase().includes(gate.replace(/-/g, "")));
}

export function allPipelineStagesComplete(item: PipelineItem): boolean {
  return item.stagesCompleted.includes("production-monitoring");
}

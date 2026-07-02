import type {
  APPROVAL_GATE_TYPES,
  ENTERPRISE_WORKFLOW_TYPES,
  EXECUTION_PIPELINE_STAGES,
  EXPORT_FORMATS,
  ORCHESTRATION_MODULES,
  PRIORITY_FACTORS,
  RECOVERY_STAGES,
  REPORT_TYPES,
  TASK_QUEUE_TYPES,
} from "@/lib/enterprise-autonomous-execution-engine/registry";

export type ExecutionEngineTab =
  | "dashboard"
  | "orchestration"
  | "workflows"
  | "tasks"
  | "priority"
  | "pipeline"
  | "approvals"
  | "recovery"
  | "decisions"
  | "reports";

export type OrchestrationModule = (typeof ORCHESTRATION_MODULES)[number];
export type EnterpriseWorkflowType = (typeof ENTERPRISE_WORKFLOW_TYPES)[number];
export type TaskQueueType = (typeof TASK_QUEUE_TYPES)[number];
export type PriorityFactor = (typeof PRIORITY_FACTORS)[number];
export type ExecutionPipelineStage = (typeof EXECUTION_PIPELINE_STAGES)[number];
export type ApprovalGateType = (typeof APPROVAL_GATE_TYPES)[number];
export type RecoveryStage = (typeof RECOVERY_STAGES)[number];
export type ExecutionReportType = (typeof REPORT_TYPES)[number];
export type ExecutionExportFormat = (typeof EXPORT_FORMATS)[number];
export type ExecutionStatus = "pass" | "warning" | "fail" | "pending" | "running" | "blocked" | "waiting-approval" | "completed";

export type ExecutionDashboard = {
  runningWorkflows: number;
  waitingApproval: number;
  failedTasks: number;
  completedTasks: number;
  platformReadiness: number;
  enterpriseScore: number;
  certificationStatus: ExecutionStatus;
  deploymentStatus: ExecutionStatus;
};

export type ModuleCoordination = {
  moduleId: OrchestrationModule;
  label: string;
  role: string;
  status: ExecutionStatus;
  lastSyncAt: string;
  pendingTasks: number;
};

export type EnterpriseWorkflow = {
  id: string;
  type: EnterpriseWorkflowType;
  label: string;
  currentStage: ExecutionPipelineStage;
  status: ExecutionStatus;
  priority: number;
  assignedModules: string[];
  startedAt: string;
  awaitingApproval: boolean;
};

export type OmegaTask = {
  id: string;
  title: string;
  queue: TaskQueueType;
  status: ExecutionStatus;
  priority: number;
  dependencies: string[];
  moduleId?: string;
  createdAt: string;
  completedAt?: string;
};

export type PriorityScore = {
  factor: PriorityFactor;
  label: string;
  score: number;
  weight: number;
  status: ExecutionStatus;
};

export type PipelineItem = {
  id: string;
  workflow: string;
  currentStage: ExecutionPipelineStage;
  stagesCompleted: ExecutionPipelineStage[];
  blocked: boolean;
  awaitingApproval: boolean;
};

export type ApprovalGate = {
  id: string;
  type: ApprovalGateType;
  label: string;
  required: boolean;
  status: ExecutionStatus;
  requestedBy: string;
  requestedAt: string;
  approvedAt?: string;
  protectedArea: boolean;
};

export type RecoveryWorkflow = {
  id: string;
  issue: string;
  stage: RecoveryStage;
  status: ExecutionStatus;
  diagnosticsCollected: boolean;
  incidentNotified: boolean;
  readyToResume: boolean;
  createdAt: string;
};

export type OmegaDecision = {
  id: string;
  recommendedAction: string;
  estimatedCompletion: string;
  riskAssessment: "low" | "medium" | "high" | "critical";
  businessImpact: number;
  certificationImpact: number;
  rollbackStrategy: string;
  requiresApproval: boolean;
};

export type ExecutionReport = {
  id: string;
  type: ExecutionReportType;
  title: string;
  generatedAt: string;
  status: ExecutionStatus;
};

export type ExecutionAuditEntry = {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: ExecutionStatus;
};

export type ExecutionEngineSettings = {
  orchestrationEnabled: boolean;
  autonomousWorkflowsEnabled: boolean;
  approvalGatesEnforced: boolean;
  neverBypassProtectedAreas: boolean;
  autoRecoveryEnabled: boolean;
  coordinateWithIncidentResponse: boolean;
};

export type ExecutionEngineState = {
  dashboard: ExecutionDashboard;
  coordinations: ModuleCoordination[];
  workflows: EnterpriseWorkflow[];
  tasks: OmegaTask[];
  priorityScores: PriorityScore[];
  pipeline: PipelineItem[];
  approvalGates: ApprovalGate[];
  recoveries: RecoveryWorkflow[];
  decisions: OmegaDecision[];
  reports: ExecutionReport[];
  auditEntries: ExecutionAuditEntry[];
};

export type ExecutionEngineSnapshot = ExecutionEngineState & {
  tab: ExecutionEngineTab;
  settings: ExecutionEngineSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "critical" | "failed"; score: number; message: string };
};

export const EXECUTION_ENGINE_ROUTES = [
  { id: "dashboard", label: "Execution Board", href: "/super-admin/autonomous-execution" },
  { id: "orchestration", label: "Orchestration", href: "/super-admin/autonomous-execution/orchestration" },
  { id: "workflows", label: "Workflows", href: "/super-admin/autonomous-execution/workflows" },
  { id: "tasks", label: "Task Manager", href: "/super-admin/autonomous-execution/tasks" },
  { id: "priority", label: "Priority Engine", href: "/super-admin/autonomous-execution/priority" },
  { id: "pipeline", label: "Execution Pipeline", href: "/super-admin/autonomous-execution/pipeline" },
  { id: "approvals", label: "Approval Gates", href: "/super-admin/autonomous-execution/approvals" },
  { id: "recovery", label: "Auto Recovery", href: "/super-admin/autonomous-execution/recovery" },
  { id: "decisions", label: "Decision Support", href: "/super-admin/autonomous-execution/decisions" },
  { id: "reports", label: "Reports", href: "/super-admin/autonomous-execution/reports" },
] as const;

export const ORCHESTRATION_MODULES = [
  "omega-command-center",
  "enterprise-ai-operating-system",
  "omega-development-director",
  "omega-quality-assurance-center",
  "enterprise-observability-center",
  "enterprise-governance-center",
  "enterprise-security-operations-center",
  "incident-response-center",
  "enterprise-business-intelligence",
  "enterprise-deployment-center",
  "certification-center",
  "enterprise-e2e-validation-engine",
  "enterprise-automation-hub",
  "mission-control-engine",
] as const;

export const ENTERPRISE_WORKFLOW_TYPES = [
  "development",
  "bug-fix",
  "feature-validation",
  "regression",
  "certification",
  "deployment",
  "monitoring",
  "incident-recovery",
  "security-validation",
  "architecture-review",
  "performance-review",
  "accessibility-review",
  "seo-review",
  "marketplace-review",
] as const;

export const TASK_QUEUE_TYPES = [
  "task-queue",
  "priority-queue",
  "dependencies",
  "execution-status",
  "approval-status",
  "blocked-tasks",
  "completed-tasks",
  "retry-queue",
  "recovery-queue",
  "certification-queue",
  "deployment-queue",
] as const;

export const PRIORITY_FACTORS = [
  "business-impact",
  "customer-impact",
  "security-risk",
  "performance-impact",
  "revenue-impact",
  "certification-impact",
  "architecture-risk",
  "technical-debt",
  "platform-stability",
] as const;

export const EXECUTION_PIPELINE_STAGES = [
  "planning",
  "architecture-review",
  "development",
  "qa",
  "security",
  "governance",
  "observability",
  "e2e-validation",
  "certification",
  "deployment",
  "production-monitoring",
] as const;

export const APPROVAL_GATE_TYPES = [
  "deployment",
  "database-migration",
  "business-rule-modification",
  "payment-changes",
  "authentication-changes",
  "security-policy-changes",
  "marketplace-logic-changes",
] as const;

export const RECOVERY_STAGES = [
  "pause-workflow",
  "collect-diagnostics",
  "notify-incident-center",
  "generate-repair-proposal",
  "run-validation",
  "await-approval",
  "resume-workflow",
] as const;

export const PROTECTED_AREAS = [
  "production-database",
  "payments",
  "wallet",
  "authentication",
  "marketplace-business-logic",
  "orders",
  "shipping",
  "deployment-pipeline",
  "business-rules",
] as const;

export const REPORT_TYPES = ["execution", "workflow", "approval", "recovery", "priority", "orchestration", "certification", "deployment"] as const;
export const EXPORT_FORMATS = ["pdf", "excel", "csv", "json"] as const;

export const EXECUTION_ENGINE_API = {
  snapshot: "/api/super-admin/autonomous-execution",
  action: "/api/super-admin/autonomous-execution/action",
  orchestrate: "/api/super-admin/autonomous-execution/orchestrate",
  execute: "/api/super-admin/autonomous-execution/execute",
  prioritize: "/api/super-admin/autonomous-execution/prioritize",
  approve: "/api/super-admin/autonomous-execution/approve",
  recover: "/api/super-admin/autonomous-execution/recover",
  export: "/api/super-admin/autonomous-execution/export",
  v1Snapshot: "/api/v1/super-admin/autonomous-execution",
} as const;

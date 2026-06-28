import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  EXECUTION_ENGINE_DRAFT_KEY,
  EXECUTION_ENGINE_HISTORY_KEY,
  EXECUTION_ENGINE_LIVE_KEY,
  EXECUTION_ENGINE_SETTINGS_KEY,
} from "@/lib/enterprise-autonomous-execution-engine/keys";
import { EXECUTION_ENGINE_API, EXECUTION_ENGINE_ROUTES } from "@/lib/enterprise-autonomous-execution-engine/registry";

const API_BASE = "/super-admin/autonomous-execution";

export const EXECUTION_ENGINE_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-autonomous-execution-engine",
  label: "Enterprise Autonomous Execution Engine",
  icon: "⚙️",
  description: "Enterprise Workflow Orchestrator — coordinates all enterprise modules through approved workflows while respecting Governance, Security, QA, Certification, and Deployment",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/autonomous-execution",
  routes: EXECUTION_ENGINE_ROUTES,
  api: {
    snapshot: EXECUTION_ENGINE_API.snapshot,
    action: EXECUTION_ENGINE_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_autonomous_execution_engine_v1", label: "Autonomous Execution Engine", description: "Master execution engine toggle", defaultEnabled: true },
    { id: "orchestration_enabled", label: "Enterprise Orchestration", description: "Coordinate all enterprise modules", defaultEnabled: true },
    { id: "autonomous_workflows_enabled", label: "Autonomous Workflows", description: "Self-coordinating enterprise workflows", defaultEnabled: true },
    { id: "approval_gates_enforced", label: "Approval Gates", description: "Require approval before protected actions", defaultEnabled: true },
    { id: "auto_recovery_enabled", label: "Automated Recovery", description: "Pause, diagnose, and recover workflows", defaultEnabled: true },
    { id: "priority_engine_enabled", label: "Smart Priority Engine", description: "Business and risk-based prioritization", defaultEnabled: true },
    { id: "decision_support_enabled", label: "OMEGA Decision Support", description: "Recommended actions and risk assessment", defaultEnabled: true },
    { id: "never_bypass_protected_areas", label: "Protected Area Enforcement", description: "Never bypass production controls", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View execution engine", roles: ["super-admin"] },
    { action: "orchestrate", label: "Sync orchestration", roles: ["super-admin"] },
    { action: "execute", label: "Execute workflows", roles: ["super-admin"] },
    { action: "prioritize", label: "Reprioritize tasks", roles: ["super-admin"] },
    { action: "approve", label: "Process approvals", requiresMfa: true, roles: ["super-admin"] },
    { action: "recover", label: "Run recovery", roles: ["super-admin"] },
    { action: "export", label: "Export reports", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: EXECUTION_ENGINE_DRAFT_KEY,
    live: EXECUTION_ENGINE_LIVE_KEY,
    history: EXECUTION_ENGINE_HISTORY_KEY,
    settings: EXECUTION_ENGINE_SETTINGS_KEY,
  },
  relatedModules: [
    "omega-command-center",
    "enterprise-ai-operating-system",
    "omega-development-director",
    "omega-quality-assurance-center",
    "enterprise-observability-center",
    "enterprise-e2e-validation-engine",
    "enterprise-governance-center",
    "enterprise-security-operations-center",
    "incident-response-center",
    "enterprise-business-intelligence",
    "enterprise-deployment-center",
    "certification-center",
    "enterprise-automation-hub",
    "mission-control-engine",
    "enterprise-module-registry-v2",
  ],
};

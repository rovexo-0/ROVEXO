import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import {
  ENTERPRISE_WORKFLOW_ENGINE_DRAFT_KEY,
  ENTERPRISE_WORKFLOW_ENGINE_HISTORY_KEY,
  ENTERPRISE_WORKFLOW_ENGINE_LIVE_KEY,
  ENTERPRISE_WORKFLOW_ENGINE_SETTINGS_KEY,
} from "@/lib/enterprise-workflow-engine/keys";
import { WORKFLOW_ENGINE_API, WORKFLOW_ENGINE_ROUTES } from "@/lib/enterprise-workflow-engine/registry";
import type { WorkflowEngineDescriptor } from "@/lib/enterprise-workflow-engine/types";

const API_BASE = "/workflows";

export const WORKFLOW_ENGINE_MODULE_DESCRIPTOR: WorkflowEngineDescriptor = {
  id: "enterprise-workflow-engine",
  label: "Enterprise Workflow Engine",
  icon: "⚡",
  description: "Configurable workflow automation across the ROVEXO platform",
  category: "platform",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/workflows",
  routes: WORKFLOW_ENGINE_ROUTES,
  api: {
    snapshot: WORKFLOW_ENGINE_API.snapshot,
    action: WORKFLOW_ENGINE_API.superAdminAction,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "workflow_engine_enabled", label: "Workflow Engine", description: "Master workflow engine toggle", defaultEnabled: true },
    { id: "workflow_builder_enabled", label: "Workflow Builder", description: "Visual workflow builder", defaultEnabled: true },
    { id: "approval_engine_enabled", label: "Approval Engine", description: "Multi-step approval chains", defaultEnabled: true },
    { id: "scheduler_enabled", label: "Scheduler", description: "Cron and scheduled workflow execution", defaultEnabled: true },
    { id: "workflow_templates_enabled", label: "Workflow Templates", description: "Pre-built workflow templates", defaultEnabled: true },
    { id: "workflow_export_enabled", label: "Workflow Export", description: "Import and export workflow configuration", defaultEnabled: true },
  ],
  permissions: [
    { action: "workflow-admin", label: "Workflow Admin", roles: ["super-admin"] },
    { action: "workflow-editor", label: "Workflow Editor", roles: ["super-admin"] },
    { action: "workflow-operator", label: "Workflow Operator", roles: ["super-admin"] },
    { action: "workflow-viewer", label: "Workflow Viewer", roles: ["super-admin"] },
    { action: "view", label: "View workflows", roles: ["super-admin"] },
    { action: "create", label: "Create workflow", roles: ["super-admin"] },
    { action: "update", label: "Update workflow", roles: ["super-admin"] },
    { action: "run", label: "Run workflow", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish workflows", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback workflows", requiresMfa: true, roles: ["super-admin"] },
    { action: "delete", label: "Delete workflow", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
    { action: "approve", label: "Approve workflow step", roles: ["super-admin"] },
    { action: "schedule", label: "Manage scheduler", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_WORKFLOW_ENGINE_DRAFT_KEY,
    live: ENTERPRISE_WORKFLOW_ENGINE_LIVE_KEY,
    history: ENTERPRISE_WORKFLOW_ENGINE_HISTORY_KEY,
    settings: ENTERPRISE_WORKFLOW_ENGINE_SETTINGS_KEY,
  },
  relatedModules: [
    "enterprise-module-registry-v2",
    "enterprise-core",
    "mission-control",
    "notifications-engine",
    "integrations-engine",
  ],
};

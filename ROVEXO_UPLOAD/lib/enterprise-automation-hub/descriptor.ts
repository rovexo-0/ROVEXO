import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  ENTERPRISE_AUTOMATION_HUB_DRAFT_KEY,
  ENTERPRISE_AUTOMATION_HUB_HISTORY_KEY,
  ENTERPRISE_AUTOMATION_HUB_LIVE_KEY,
  ENTERPRISE_AUTOMATION_HUB_SETTINGS_KEY,
} from "@/lib/enterprise-automation-hub/keys";
import { ENTERPRISE_AUTOMATION_HUB_API, ENTERPRISE_AUTOMATION_HUB_ROUTES } from "@/lib/enterprise-automation-hub/registry";

const API_BASE = "/super-admin/automation";

export const ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-automation-hub",
  label: "Enterprise Automation Hub",
  icon: "🤖",
  description: "Central workflow automation, rule engine, and AI automation platform",
  category: "platform",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/automation",
  routes: ENTERPRISE_AUTOMATION_HUB_ROUTES,
  api: {
    snapshot: ENTERPRISE_AUTOMATION_HUB_API.snapshot,
    action: ENTERPRISE_AUTOMATION_HUB_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_automation_hub_v1", label: "Enterprise Automation Hub", description: "Master automation hub toggle", defaultEnabled: true },
    { id: "workflow_builder_enabled", label: "Visual Workflow Builder", description: "Drag-and-drop workflow builder", defaultEnabled: true },
    { id: "rule_engine_enabled", label: "Rule Engine", description: "If/then rule automation", defaultEnabled: true },
    { id: "event_triggers_enabled", label: "Event Triggers", description: "Marketplace and platform event triggers", defaultEnabled: true },
    { id: "scheduler_enabled", label: "Scheduler", description: "Cron and scheduled jobs", defaultEnabled: true },
    { id: "approval_workflows_enabled", label: "Approval Workflows", description: "Draft, approve, publish lifecycle", defaultEnabled: true },
    { id: "ai_automation_enabled", label: "AI Automation", description: "SCAN, SENTINEL, OMEGA insights", defaultEnabled: true },
    { id: "import_export_enabled", label: "Import / Export", description: "JSON, CSV, YAML packages", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View automation hub", roles: ["super-admin"] },
    { action: "run", label: "Run workflows", roles: ["super-admin"] },
    { action: "pause", label: "Pause jobs", roles: ["super-admin"] },
    { action: "stop", label: "Stop jobs", roles: ["super-admin"] },
    { action: "enable", label: "Enable automations", roles: ["super-admin"] },
    { action: "disable", label: "Disable automations", roles: ["super-admin"] },
    { action: "publish", label: "Publish workflows", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback", label: "Rollback workflows", requiresMfa: true, roles: ["super-admin"] },
    { action: "export", label: "Export automations", roles: ["super-admin"] },
    { action: "import", label: "Import automations", requiresMfa: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_AUTOMATION_HUB_DRAFT_KEY,
    live: ENTERPRISE_AUTOMATION_HUB_LIVE_KEY,
    history: ENTERPRISE_AUTOMATION_HUB_HISTORY_KEY,
    settings: ENTERPRISE_AUTOMATION_HUB_SETTINGS_KEY,
  },
  relatedModules: [
    "enterprise-workflow-engine",
    "enterprise-ai-operating-system",
    "enterprise-business-intelligence",
    "enterprise-security-operations-center",
    "incident-response-center",
    "enterprise-deployment-center",
    "recovery-center",
    "certification-center",
    "homepage-builder-engine",
    "enterprise-mobile-control-center",
    "enterprise-core",
    "mission-control",
  ],
};

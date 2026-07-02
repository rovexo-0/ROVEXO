import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  ENTERPRISE_AI_OS_DRAFT_KEY,
  ENTERPRISE_AI_OS_HISTORY_KEY,
  ENTERPRISE_AI_OS_LIVE_KEY,
  ENTERPRISE_AI_OS_SETTINGS_KEY,
} from "@/lib/enterprise-ai-operating-system/keys";
import { ENTERPRISE_AI_OS_API, ENTERPRISE_AI_OS_ROUTES } from "@/lib/enterprise-ai-operating-system/registry";

const API_BASE = "/super-admin/ai";

export const ENTERPRISE_AI_OS_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-ai-operating-system",
  label: "Enterprise AI Operating System",
  icon: "🧠",
  description: "SCAN • SENTINEL • OMEGA — central enterprise AI layer",
  category: "platform",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/ai",
  routes: ENTERPRISE_AI_OS_ROUTES,
  api: {
    snapshot: ENTERPRISE_AI_OS_API.snapshot,
    action: `${ENTERPRISE_AI_OS_API.snapshot}/action`,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "ai_os_enabled", label: "AI Operating System", description: "Master AI OS toggle", defaultEnabled: true },
    { id: "scan_engine_enabled", label: "Scan Engine", description: "Continuous platform scanning", defaultEnabled: true },
    { id: "sentinel_engine_enabled", label: "Sentinel Engine", description: "Threat and anomaly monitoring", defaultEnabled: true },
    { id: "omega_core_enabled", label: "Omega Core", description: "Enterprise AI brain and recommendations", defaultEnabled: true },
    { id: "self_healing_enabled", label: "Self Healing", description: "Automated repair plan generation", defaultEnabled: true },
    { id: "predictions_enabled", label: "AI Predictions", description: "Traffic, fraud, and resource forecasting", defaultEnabled: true },
    { id: "automation_queue_enabled", label: "Automation Queue", description: "Suggested cleanup and optimisation tasks", defaultEnabled: true },
    { id: "learning_enabled", label: "Platform Learning", description: "Behaviour learning and intelligence", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View AI OS", roles: ["super-admin"] },
    { action: "run-scan", label: "Run scan", roles: ["super-admin"] },
    { action: "run-analysis", label: "Run Omega analysis", roles: ["super-admin"] },
    { action: "create-repair-plan", label: "Create repair plan", requiresMfa: true, roles: ["super-admin"] },
    { action: "approve-repair", label: "Approve repair", requiresMfa: true, roles: ["super-admin"] },
    { action: "cancel-repair", label: "Cancel repair", requiresMfa: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_AI_OS_DRAFT_KEY,
    live: ENTERPRISE_AI_OS_LIVE_KEY,
    history: ENTERPRISE_AI_OS_HISTORY_KEY,
    settings: ENTERPRISE_AI_OS_SETTINGS_KEY,
  },
  relatedModules: [
    "omega-command-center",
    "ai-engine",
    "enterprise-workflow-engine",
    "enterprise-module-registry-v2",
    "operations-center",
    "recovery-center",
    "audit-compliance-center",
    "mission-control",
    "search-engine",
  ],
};

import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  OMEGA_COMMAND_CENTER_DRAFT_KEY,
  OMEGA_COMMAND_CENTER_HISTORY_KEY,
  OMEGA_COMMAND_CENTER_LIVE_KEY,
  OMEGA_COMMAND_CENTER_SETTINGS_KEY,
} from "@/lib/omega-command-center/keys";
import { OMEGA_COMMAND_CENTER_API, OMEGA_COMMAND_CENTER_ROUTES, OMEGA_ENGINE_ROUTES } from "@/lib/omega-command-center/registry";

const API_BASE = "/super-admin/omega";

export const OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "omega-command-center",
  label: "OMEGA Command Center",
  icon: "🟡",
  description: "Unified Enterprise AI orchestration — SCAN, SENTINEL, ORACLE, PHOENIX, TITAN, ATLAS, GUARDIAN",
  category: "platform",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/omega",
  routes: [...OMEGA_COMMAND_CENTER_ROUTES, ...OMEGA_ENGINE_ROUTES],
  api: {
    snapshot: OMEGA_COMMAND_CENTER_API.snapshot,
    action: OMEGA_COMMAND_CENTER_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "omega_command_center_v1", label: "OMEGA Command Center", description: "Master AI orchestrator toggle", defaultEnabled: true },
    { id: "omega_orchestration_enabled", label: "AI Orchestration", description: "Sequential engine orchestration pipeline", defaultEnabled: true },
    { id: "omega_live_monitor_enabled", label: "Live Monitor", description: "Real-time infrastructure widgets", defaultEnabled: true },
    { id: "omega_executive_reports_enabled", label: "Executive Reports", description: "PDF, CSV, Excel, JSON reports", defaultEnabled: true },
    { id: "omega_auto_repair_enabled", label: "Auto Repair", description: "One-click auto fix recommendations", defaultEnabled: true },
    { id: "omega_enterprise_search_enabled", label: "Enterprise Search", description: "Unified super admin search", defaultEnabled: true },
    { id: "omega_mobile_mirror_enabled", label: "Mobile Mirror", description: "Mirror to Super Admin Mobile", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View OMEGA Command Center", roles: ["super-admin"] },
    { action: "run-scan", label: "Run enterprise scan", roles: ["super-admin"] },
    { action: "quick-scan", label: "Quick scan", roles: ["super-admin"] },
    { action: "deep-scan", label: "Deep scan", roles: ["super-admin"] },
    { action: "pause", label: "Pause scan", roles: ["super-admin"] },
    { action: "resume", label: "Resume scan", roles: ["super-admin"] },
    { action: "cancel", label: "Cancel scan", roles: ["super-admin"] },
    { action: "repair", label: "Execute repair", requiresMfa: true, roles: ["super-admin"] },
    { action: "deploy", label: "Deploy fix", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback", label: "Rollback", requiresMfa: true, roles: ["super-admin"] },
    { action: "report", label: "Generate report", roles: ["super-admin"] },
    { action: "export", label: "Export snapshot", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: OMEGA_COMMAND_CENTER_DRAFT_KEY,
    live: OMEGA_COMMAND_CENTER_LIVE_KEY,
    history: OMEGA_COMMAND_CENTER_HISTORY_KEY,
    settings: OMEGA_COMMAND_CENTER_SETTINGS_KEY,
  },
  relatedModules: [
    "enterprise-ai-operating-system",
    "enterprise-workflow-engine",
    "enterprise-automation-hub",
    "enterprise-business-intelligence",
    "enterprise-security-operations-center",
    "incident-response-center",
    "enterprise-deployment-center",
    "recovery-center",
    "operations-center",
    "enterprise-mobile-control-center",
    "enterprise-core",
    "mission-control",
  ],
};

import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  OMEGA_DEV_DIRECTOR_DRAFT_KEY,
  OMEGA_DEV_DIRECTOR_HISTORY_KEY,
  OMEGA_DEV_DIRECTOR_LIVE_KEY,
  OMEGA_DEV_DIRECTOR_SETTINGS_KEY,
} from "@/lib/omega-development-director/keys";
import { OMEGA_DEV_DIRECTOR_API, OMEGA_DEV_DIRECTOR_ROUTES } from "@/lib/omega-development-director/registry";

const API_BASE = "/super-admin/development-director";

export const OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "omega-development-director",
  label: "OMEGA Development Director",
  icon: "🎯",
  description: "Autonomous Enterprise Development Director — analyzes, prioritizes, coordinates, and prepares features for certification without modifying production",
  category: "platform",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/development-director",
  routes: OMEGA_DEV_DIRECTOR_ROUTES,
  api: {
    snapshot: OMEGA_DEV_DIRECTOR_API.snapshot,
    action: OMEGA_DEV_DIRECTOR_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "omega_development_director_v1", label: "OMEGA Development Director", description: "Master development director toggle", defaultEnabled: true },
    { id: "autonomous_code_analysis_enabled", label: "Autonomous Code Analysis", description: "Continuous codebase analysis", defaultEnabled: true },
    { id: "development_discovery_enabled", label: "Development Discovery", description: "Detect missing and incomplete work", defaultEnabled: true },
    { id: "roadmap_engine_enabled", label: "Roadmap Engine", description: "Priority-based project roadmap", defaultEnabled: true },
    { id: "dependency_graph_enabled", label: "Dependency Graph", description: "Live dependency mapping", defaultEnabled: true },
    { id: "safe_repair_mode_enabled", label: "Safe Repair Mode", description: "Repair proposals with validation gates", defaultEnabled: true },
    { id: "recommendation_only_mode", label: "Recommendation Only", description: "Never modify production directly", defaultEnabled: true },
    { id: "enterprise_coordination_enabled", label: "Enterprise Coordination", description: "Sync with QA, Governance, Security, Deployment", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View development director", roles: ["super-admin"] },
    { action: "analyze", label: "Run codebase analysis", roles: ["super-admin"] },
    { action: "discover", label: "Run discovery scan", roles: ["super-admin"] },
    { action: "prioritize", label: "Reprioritize roadmap", roles: ["super-admin"] },
    { action: "repair", label: "Generate repair proposal", roles: ["super-admin"] },
    { action: "export", label: "Export reports", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: OMEGA_DEV_DIRECTOR_DRAFT_KEY,
    live: OMEGA_DEV_DIRECTOR_LIVE_KEY,
    history: OMEGA_DEV_DIRECTOR_HISTORY_KEY,
    settings: OMEGA_DEV_DIRECTOR_SETTINGS_KEY,
  },
  relatedModules: [
    "omega-command-center",
    "omega-quality-assurance-center",
    "enterprise-governance-center",
    "enterprise-development-center",
    "enterprise-security-operations-center",
    "certification-center",
    "enterprise-deployment-center",
    "enterprise-module-registry-v2",
    "enterprise-automation-hub",
    "enterprise-observability-center",
    "enterprise-e2e-validation-engine",
    "enterprise-autonomous-execution-engine",
  ],
};

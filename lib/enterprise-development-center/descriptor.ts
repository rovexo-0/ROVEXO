import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  ENTERPRISE_DEVELOPMENT_DRAFT_KEY,
  ENTERPRISE_DEVELOPMENT_HISTORY_KEY,
  ENTERPRISE_DEVELOPMENT_LIVE_KEY,
  ENTERPRISE_DEVELOPMENT_SETTINGS_KEY,
} from "@/lib/enterprise-development-center/keys";
import { ENTERPRISE_DEVELOPMENT_API, ENTERPRISE_DEVELOPMENT_ROUTES } from "@/lib/enterprise-development-center/registry";

const API_BASE = "/super-admin/development";

export const ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-development-center",
  label: "Enterprise Development Center",
  icon: "🛠️",
  description: "Enterprise engineering platform — architecture studio, DevSecOps, and release pipeline",
  category: "platform",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/development",
  routes: ENTERPRISE_DEVELOPMENT_ROUTES,
  api: {
    snapshot: ENTERPRISE_DEVELOPMENT_API.snapshot,
    action: ENTERPRISE_DEVELOPMENT_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_development_center_v1", label: "Enterprise Development Center", description: "Master development center toggle", defaultEnabled: true },
    { id: "architecture_studio_enabled", label: "Architecture Studio", description: "Interactive architecture graph", defaultEnabled: true },
    { id: "devsecops_enabled", label: "DevSecOps", description: "Build, test, validate, deploy pipeline", defaultEnabled: true },
    { id: "release_pipeline_enabled", label: "Release Pipeline", description: "Governance to production approval", defaultEnabled: true },
    { id: "ai_integration_panel_enabled", label: "AI Integration", description: "OMEGA PRIME and engine status", defaultEnabled: true },
    { id: "code_quality_enabled", label: "Code Quality", description: "Dead code and duplicate detection", defaultEnabled: true },
    { id: "governance_integration_enabled", label: "Governance Integration", description: "Live Governance Center sync", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View development center", roles: ["super-admin"] },
    { action: "validate", label: "Run validation", roles: ["super-admin"] },
    { action: "build", label: "Trigger builds", roles: ["super-admin"] },
    { action: "deploy", label: "Deploy releases", requiresMfa: true, roles: ["super-admin"] },
    { action: "export", label: "Export reports", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_DEVELOPMENT_DRAFT_KEY,
    live: ENTERPRISE_DEVELOPMENT_LIVE_KEY,
    history: ENTERPRISE_DEVELOPMENT_HISTORY_KEY,
    settings: ENTERPRISE_DEVELOPMENT_SETTINGS_KEY,
  },
  relatedModules: [
    "enterprise-governance-center",
    "enterprise-module-registry-v2",
    "enterprise-deployment-center",
    "certification-center",
    "omega-command-center",
    "enterprise-workflow-engine",
    "platform-studio",
    "app-studio",
    "enterprise-core",
    "mission-control",
  ],
};

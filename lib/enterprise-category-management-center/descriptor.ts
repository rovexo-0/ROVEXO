import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  CATEGORY_MANAGEMENT_DRAFT_KEY,
  CATEGORY_MANAGEMENT_HISTORY_KEY,
  CATEGORY_MANAGEMENT_LIVE_KEY,
  CATEGORY_MANAGEMENT_SETTINGS_KEY,
} from "@/lib/enterprise-category-management-center/keys";
import { CATEGORY_MANAGEMENT_API, CATEGORY_MANAGEMENT_ROUTES } from "@/lib/enterprise-category-management-center/registry";

const API_BASE = "/super-admin/category-management";

export const CATEGORY_MANAGEMENT_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-category-management-center",
  label: "Enterprise Category Management Center",
  icon: "📁",
  description: "Master taxonomy manager for the entire ROVEXO marketplace — Premium 2026 Enterprise interface with OMEGA validation and certification",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/category-management",
  routes: CATEGORY_MANAGEMENT_ROUTES,
  api: {
    snapshot: CATEGORY_MANAGEMENT_API.snapshot,
    action: CATEGORY_MANAGEMENT_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_category_management_center_v1", label: "Category Management Center", description: "Master taxonomy manager toggle", defaultEnabled: true },
    { id: "tree_editor_enabled", label: "Enterprise Category Tree", description: "Hierarchy, drag-drop, search, filters", defaultEnabled: true },
    { id: "ai_assistant_enabled", label: "AI Category Assistant", description: "OMEGA AI suggestions and optimization", defaultEnabled: true },
    { id: "version_control_enabled", label: "Version Control", description: "Full history, compare, rollback", defaultEnabled: true },
    { id: "import_export_enabled", label: "Import / Export", description: "CSV, Excel, JSON backup and restore", defaultEnabled: true },
    { id: "validation_only_mode", label: "Validation Only", description: "Never auto-modify protected areas", defaultEnabled: true },
    { id: "omega_score_engine_enabled", label: "OMEGA Score Engine", description: "Category certification scores", defaultEnabled: true },
    { id: "require_pass_100", label: "Require PASS 100%", description: "Certification only after 100% pass", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View category management", roles: ["super-admin"] },
    { action: "validate", label: "Run taxonomy validation", roles: ["super-admin"] },
    { action: "sync", label: "Sync taxonomy to database", requiresMfa: true, roles: ["super-admin"] },
    { action: "import", label: "Import categories", requiresMfa: true, roles: ["super-admin"] },
    { action: "export", label: "Export taxonomy", roles: ["super-admin"] },
    { action: "analyze", label: "Analyze category issues", roles: ["super-admin"] },
    { action: "certify", label: "Grant category certification", requiresMfa: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: CATEGORY_MANAGEMENT_DRAFT_KEY,
    live: CATEGORY_MANAGEMENT_LIVE_KEY,
    history: CATEGORY_MANAGEMENT_HISTORY_KEY,
    settings: CATEGORY_MANAGEMENT_SETTINGS_KEY,
  },
  relatedModules: [
    "omega-command-center",
    "omega-quality-assurance-center",
    "omega-development-director",
    "enterprise-observability-center",
    "enterprise-governance-center",
    "enterprise-security-operations-center",
    "certification-center",
    "homepage-builder-engine",
    "homepage-enterprise-certification-engine",
    "enterprise-e2e-validation-engine",
    "enterprise-autonomous-execution-engine",
    "search-engine",
    "enterprise-module-registry-v2",
    "mission-control-engine",
  ],
};

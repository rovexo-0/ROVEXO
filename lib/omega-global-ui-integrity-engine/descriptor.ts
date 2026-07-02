import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  GLOBAL_UI_INTEGRITY_DRAFT_KEY,
  GLOBAL_UI_INTEGRITY_HISTORY_KEY,
  GLOBAL_UI_INTEGRITY_LIVE_KEY,
  GLOBAL_UI_INTEGRITY_SETTINGS_KEY,
} from "@/lib/omega-global-ui-integrity-engine/keys";
import { GLOBAL_UI_INTEGRITY_API, GLOBAL_UI_INTEGRITY_ROUTES } from "@/lib/omega-global-ui-integrity-engine/registry";

const API_BASE = "/super-admin/global-ui-integrity";

export const GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "omega-global-ui-integrity-engine",
  label: "OMEGA Global UI Integrity",
  icon: "🔮",
  description: "Enterprise Visual Intelligence — validates, optimises and certifies every visible ROVEXO screen at Global Integrity PASS 100%",
  category: "platform",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/global-ui-integrity",
  routes: GLOBAL_UI_INTEGRITY_ROUTES,
  api: {
    snapshot: GLOBAL_UI_INTEGRITY_API.snapshot,
    action: GLOBAL_UI_INTEGRITY_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "omega_global_ui_integrity_engine_v1", label: "Global UI Integrity Engine", description: "Master global visual intelligence toggle — Update 066.2", defaultEnabled: true },
    { id: "global_ui_validation_enabled", label: "Global UI Validation", description: "Duplication, spacing, alignment, Premium 2026 consistency", defaultEnabled: true },
    { id: "global_ux_validation_enabled", label: "Global UX Validation", description: "Click, tap, focus, loading, empty and error states", defaultEnabled: true },
    { id: "global_navigation_validation_enabled", label: "Navigation Validation", description: "Buttons, menus, routes, modals, deep-links", defaultEnabled: true },
    { id: "global_category_validation_enabled", label: "Global Category Validation", description: "Taxonomy, homepage duplication, orphan detection", defaultEnabled: true },
    { id: "global_layout_optimization_enabled", label: "Layout Optimization", description: "Spacing, safe areas, viewport usage", defaultEnabled: true },
    { id: "global_auto_repair_enabled", label: "Auto Repair", description: "Safe automatic layout repairs with governance gates", defaultEnabled: true },
    { id: "validation_only_mode", label: "Validation Only", description: "Never auto-modify protected business logic", defaultEnabled: true },
    { id: "inherit_to_future_modules", label: "Inherit To Future Modules", description: "Every new module inherits global integrity rules", defaultEnabled: true },
    { id: "require_pass_100", label: "Require PASS 100%", description: "No screen production ready until 100% pass", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View global UI integrity", roles: ["super-admin"] },
    { action: "validate", label: "Run global UI validation", roles: ["super-admin"] },
    { action: "repair", label: "Run auto repair", requiresMfa: true, roles: ["super-admin"] },
    { action: "certify", label: "Grant global certification", requiresMfa: true, roles: ["super-admin"] },
    { action: "export", label: "Export integrity reports", roles: ["super-admin"] },
    { action: "analyze", label: "Analyze integrity failures", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: GLOBAL_UI_INTEGRITY_DRAFT_KEY,
    live: GLOBAL_UI_INTEGRITY_LIVE_KEY,
    history: GLOBAL_UI_INTEGRITY_HISTORY_KEY,
    settings: GLOBAL_UI_INTEGRITY_SETTINGS_KEY,
  },
  relatedModules: [
    "omega-command-center",
    "omega-quality-assurance-center",
    "omega-development-director",
    "enterprise-observability-center",
    "enterprise-governance-center",
    "enterprise-security-operations-center",
    "certification-center",
    "homepage-enterprise-certification-engine",
    "homepage-category-integrity-engine",
    "enterprise-category-management-center",
    "enterprise-e2e-validation-engine",
    "enterprise-autonomous-execution-engine",
    "enterprise-module-registry-v2",
    "mission-control-engine",
    "enterprise-deployment-center",
  ],
};

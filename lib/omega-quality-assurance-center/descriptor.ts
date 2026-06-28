import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  OMEGA_QA_DRAFT_KEY,
  OMEGA_QA_HISTORY_KEY,
  OMEGA_QA_LIVE_KEY,
  OMEGA_QA_SETTINGS_KEY,
} from "@/lib/omega-quality-assurance-center/keys";
import { OMEGA_QA_API, OMEGA_QA_ROUTES } from "@/lib/omega-quality-assurance-center/registry";

const API_BASE = "/super-admin/quality-assurance";

export const OMEGA_QA_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "omega-quality-assurance-center",
  label: "OMEGA Quality Assurance Center",
  icon: "🔬",
  description: "Autonomous platform validation, inspection, verification, correction, optimization, and certification authority",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/quality-assurance",
  routes: OMEGA_QA_ROUTES,
  api: {
    snapshot: OMEGA_QA_API.snapshot,
    action: OMEGA_QA_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "omega_quality_assurance_center_v1", label: "OMEGA Quality Assurance Center", description: "Master QA center toggle", defaultEnabled: true },
    { id: "button_validation_engine_enabled", label: "Button Validation Engine", description: "Register and validate every interactive element", defaultEnabled: true },
    { id: "user_flow_validation_enabled", label: "User Flow Validation", description: "Automated buyer, seller, business, and admin flows", defaultEnabled: true },
    { id: "ai_validation_enabled", label: "AI Validation", description: "Listing and marketplace AI compliance checks", defaultEnabled: true },
    { id: "autonomous_fix_engine_enabled", label: "Autonomous Fix Engine", description: "Safe fix generation and regression testing", defaultEnabled: true },
    { id: "certification_pipeline_enabled", label: "Certification Pipeline", description: "Production certification gate for all modules", defaultEnabled: true },
    { id: "omega_priority_mode_enabled", label: "OMEGA Priority Mode", description: "Auto-prioritize critical platform issues", defaultEnabled: true },
    { id: "continuous_validation_enabled", label: "Continuous Validation", description: "Live platform health monitoring", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View QA center", roles: ["super-admin"] },
    { action: "validate", label: "Run platform validation", roles: ["super-admin"] },
    { action: "scan", label: "Scan button registry", roles: ["super-admin"] },
    { action: "fix", label: "Run fix engine", roles: ["super-admin"] },
    { action: "certify", label: "Issue production certification", requiresMfa: true, roles: ["super-admin"] },
    { action: "priority", label: "Toggle priority mode", roles: ["super-admin"] },
    { action: "export", label: "Export QA reports", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: OMEGA_QA_DRAFT_KEY,
    live: OMEGA_QA_LIVE_KEY,
    history: OMEGA_QA_HISTORY_KEY,
    settings: OMEGA_QA_SETTINGS_KEY,
  },
  relatedModules: [
    "omega-command-center",
    "enterprise-governance-center",
    "enterprise-development-center",
    "omega-development-director",
    "enterprise-observability-center",
    "enterprise-e2e-validation-engine",
    "enterprise-autonomous-execution-engine",
    "certification-center",
    "enterprise-compliance-center",
    "enterprise-deployment-center",
    "enterprise-module-registry-v2",
    "enterprise-automation-hub",
  ],
};

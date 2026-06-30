import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  E2E_VALIDATION_DRAFT_KEY,
  E2E_VALIDATION_HISTORY_KEY,
  E2E_VALIDATION_LIVE_KEY,
  E2E_VALIDATION_SETTINGS_KEY,
} from "@/lib/enterprise-e2e-validation-engine/keys";
import { E2E_VALIDATION_API, E2E_VALIDATION_ROUTES } from "@/lib/enterprise-e2e-validation-engine/registry";

const API_BASE = "/super-admin/e2e-validation";

export const E2E_VALIDATION_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-e2e-validation-engine",
  label: "Enterprise E2E Validation Engine",
  icon: "✅",
  description: "Final functional validation layer — verifies every screen, button, workflow, API, redirect, and business rule before Production Certification",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/e2e-validation",
  routes: E2E_VALIDATION_ROUTES,
  api: {
    snapshot: E2E_VALIDATION_API.snapshot,
    action: E2E_VALIDATION_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_e2e_validation_engine_v1", label: "Enterprise E2E Validation Engine", description: "Master E2E validation toggle", defaultEnabled: true },
    { id: "full_ui_validation_enabled", label: "Full UI Validation", description: "Validate every button, menu, modal, and control", defaultEnabled: true },
    { id: "workflow_validation_enabled", label: "Workflow Validation", description: "Buyer, seller, company, super-admin flows", defaultEnabled: true },
    { id: "api_validation_enabled", label: "API Validation", description: "Auth, schema, performance, versioning", defaultEnabled: true },
    { id: "database_validation_enabled", label: "Database Validation", description: "Transactions, constraints, migration integrity", defaultEnabled: true },
    { id: "business_rule_validation_enabled", label: "Business Rule Validation", description: "Marketplace, wallet, payment, shipping rules", defaultEnabled: true },
    { id: "regression_auto_trigger_enabled", label: "Regression Auto-Trigger", description: "Automatic regression on change detection", defaultEnabled: true },
    { id: "validation_only_mode", label: "Validation Only", description: "Never auto-modify protected areas", defaultEnabled: true },
    { id: "omega_score_engine_enabled", label: "OMEGA Score Engine", description: "Compute OMEGA validation scores", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View E2E validation engine", roles: ["super-admin"] },
    { action: "validate", label: "Run full platform validation", roles: ["super-admin"] },
    { action: "regression", label: "Run regression tests", roles: ["super-admin"] },
    { action: "analyze", label: "Analyze failures", roles: ["super-admin"] },
    { action: "export", label: "Export reports", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: E2E_VALIDATION_DRAFT_KEY,
    live: E2E_VALIDATION_LIVE_KEY,
    history: E2E_VALIDATION_HISTORY_KEY,
    settings: E2E_VALIDATION_SETTINGS_KEY,
  },
  relatedModules: [
    "omega-command-center",
    "omega-quality-assurance-center",
    "omega-development-director",
    "enterprise-observability-center",
    "enterprise-governance-center",
    "enterprise-security-operations-center",
    "certification-center",
    "enterprise-deployment-center",
    "enterprise-module-registry-v2",
    "enterprise-automation-hub",
    "incident-response-center",
    "enterprise-autonomous-execution-engine",
    "homepage-enterprise-certification-engine",
  ],
};

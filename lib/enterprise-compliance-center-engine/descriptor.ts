import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  ENTERPRISE_COMPLIANCE_CENTER_DRAFT_KEY,
  ENTERPRISE_COMPLIANCE_CENTER_HISTORY_KEY,
  ENTERPRISE_COMPLIANCE_CENTER_LIVE_KEY,
  ENTERPRISE_COMPLIANCE_CENTER_SETTINGS_KEY,
} from "@/lib/enterprise-compliance-center-engine/keys";
import { ENTERPRISE_COMPLIANCE_ROUTES } from "@/lib/enterprise-compliance-center-engine/registry";

const API_BASE = "/super-admin/compliance";

export const ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-compliance-center",
  label: "Audit Readiness & Certification",
  icon: "🏆",
  description: "Audit readiness and certification intelligence",
  category: "operations",
  version: "2.0",
  autoRegister: true,
  baseHref: "/super-admin/compliance",
  routes: ENTERPRISE_COMPLIANCE_ROUTES,
  api: {
    snapshot: `/api${API_BASE}`,
    action: `/api${API_BASE}/action`,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "readiness-dashboard", label: "Readiness Dashboard", description: "Audit readiness score and trends", defaultEnabled: true },
    { id: "pre-audit-simulator", label: "Pre-Audit Simulator", description: "Pre-audit simulation runs", defaultEnabled: true },
    { id: "gap-analysis", label: "Gap Analysis", description: "Compliance gap identification", defaultEnabled: true },
    { id: "remediation-center", label: "Remediation Center", description: "Remediation tracking and overrides", defaultEnabled: true },
    { id: "certification-dashboard", label: "Certification Dashboard", description: "Certification readiness controls", defaultEnabled: true },
    { id: "evidence-vault", label: "Evidence Vault", description: "Compliance evidence storage", defaultEnabled: true },
    { id: "compliance-export", label: "Compliance Export", description: "Multi-format compliance exports", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View compliance center", roles: ["super-admin"] },
    { action: "run-pre-audit", label: "Run pre-audit simulation", roles: ["super-admin"] },
    { action: "verify-integrity", label: "Verify integrity", roles: ["super-admin"] },
    { action: "export", label: "Export compliance reports", requiresMfa: true, roles: ["super-admin"] },
    { action: "update-retention", label: "Update retention policy", requiresBiometric: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_COMPLIANCE_CENTER_DRAFT_KEY,
    live: ENTERPRISE_COMPLIANCE_CENTER_LIVE_KEY,
    history: ENTERPRISE_COMPLIANCE_CENTER_HISTORY_KEY,
    settings: ENTERPRISE_COMPLIANCE_CENTER_SETTINGS_KEY,
  },
  relatedModules: ["incident-command-center", "incident-timeline", "audit-compliance-center", "certification-center"],
};

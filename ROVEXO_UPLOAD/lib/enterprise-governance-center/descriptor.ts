import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  ENTERPRISE_GOVERNANCE_DRAFT_KEY,
  ENTERPRISE_GOVERNANCE_HISTORY_KEY,
  ENTERPRISE_GOVERNANCE_LIVE_KEY,
  ENTERPRISE_GOVERNANCE_SETTINGS_KEY,
} from "@/lib/enterprise-governance-center/keys";
import { ENTERPRISE_GOVERNANCE_API, ENTERPRISE_GOVERNANCE_ROUTES } from "@/lib/enterprise-governance-center/registry";

const API_BASE = "/super-admin/governance";

export const ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-governance-center",
  label: "Enterprise Governance Center",
  icon: "⚖️",
  description: "Enterprise Constitution, architecture governance, certification, and compliance authority",
  category: "core",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/governance",
  routes: ENTERPRISE_GOVERNANCE_ROUTES,
  api: {
    snapshot: ENTERPRISE_GOVERNANCE_API.snapshot,
    action: ENTERPRISE_GOVERNANCE_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_governance_center_v1", label: "Enterprise Governance Center", description: "Master governance toggle", defaultEnabled: true },
    { id: "constitution_viewer_enabled", label: "Constitution Viewer", description: "Official enterprise constitution", defaultEnabled: true },
    { id: "architecture_governance_enabled", label: "Architecture Governance", description: "Real-time architecture validation", defaultEnabled: true },
    { id: "rule_engine_enabled", label: "Enterprise Rule Engine", description: "Live rule evaluation", defaultEnabled: true },
    { id: "certification_engine_enabled", label: "Certification Engine", description: "Release certification and certificates", defaultEnabled: true },
    { id: "validation_pipeline_enabled", label: "Validation Pipeline", description: "Full enterprise validation", defaultEnabled: true },
    { id: "technical_debt_tracking_enabled", label: "Technical Debt", description: "Debt scoring across domains", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View governance center", roles: ["super-admin"] },
    { action: "scan", label: "Architecture scan", roles: ["super-admin"] },
    { action: "validate", label: "Run validation", roles: ["super-admin"] },
    { action: "certify", label: "Issue certificate", requiresMfa: true, roles: ["super-admin"] },
    { action: "export", label: "Export reports", roles: ["super-admin"] },
    { action: "report", label: "Generate report", roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_GOVERNANCE_DRAFT_KEY,
    live: ENTERPRISE_GOVERNANCE_LIVE_KEY,
    history: ENTERPRISE_GOVERNANCE_HISTORY_KEY,
    settings: ENTERPRISE_GOVERNANCE_SETTINGS_KEY,
  },
  relatedModules: [
    "enterprise-module-registry-v2",
    "enterprise-core",
    "omega-command-center",
    "enterprise-ai-operating-system",
    "certification-center",
    "enterprise-compliance-center",
    "audit-compliance-center",
    "enterprise-deployment-center",
    "enterprise-workflow-engine",
    "enterprise-security-operations-center",
    "mission-control",
  ],
};

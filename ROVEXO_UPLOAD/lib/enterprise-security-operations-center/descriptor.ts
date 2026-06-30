import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import {
  ENTERPRISE_SOC_DRAFT_KEY,
  ENTERPRISE_SOC_HISTORY_KEY,
  ENTERPRISE_SOC_LIVE_KEY,
  ENTERPRISE_SOC_SETTINGS_KEY,
} from "@/lib/enterprise-security-operations-center/keys";
import { ENTERPRISE_SOC_API, ENTERPRISE_SOC_ROUTES } from "@/lib/enterprise-security-operations-center/registry";

const API_BASE = "/super-admin/security";

export const ENTERPRISE_SOC_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "enterprise-security-operations-center",
  label: "Security Operations Center",
  icon: "🛡️",
  description: "Enterprise cyber security platform — threat detection, firewall, scanner, and compliance",
  category: "operations",
  version: "1.0",
  autoRegister: true,
  baseHref: "/super-admin/security",
  routes: ENTERPRISE_SOC_ROUTES,
  api: {
    snapshot: ENTERPRISE_SOC_API.snapshot,
    action: ENTERPRISE_SOC_API.action,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    { id: "enterprise_soc_v1", label: "Security Operations Center", description: "Master SOC toggle", defaultEnabled: true },
    { id: "live_monitoring_enabled", label: "Live Monitoring", description: "Real-time security event feed", defaultEnabled: true },
    { id: "ai_security_enabled", label: "AI Security", description: "SCAN, SENTINEL, OMEGA integration", defaultEnabled: true },
    { id: "firewall_enabled", label: "Firewall Center", description: "IP, country, and rate limit rules", defaultEnabled: true },
    { id: "scanner_enabled", label: "Security Scanner", description: "Configuration and dependency scanning", defaultEnabled: true },
    { id: "automations_enabled", label: "Security Automations", description: "Auto block, quarantine, escalate", defaultEnabled: true },
    { id: "compliance_enabled", label: "Compliance Center", description: "GDPR and security policy compliance", defaultEnabled: true },
  ],
  permissions: [
    { action: "view", label: "View SOC", roles: ["super-admin"] },
    { action: "scan", label: "Run security scan", roles: ["super-admin"] },
    { action: "block", label: "Block threat", requiresMfa: true, roles: ["super-admin"] },
    { action: "unblock", label: "Unblock IP", requiresMfa: true, roles: ["super-admin"] },
    { action: "quarantine", label: "Quarantine threat", requiresMfa: true, roles: ["super-admin"] },
    { action: "isolate", label: "Isolate device", requiresMfa: true, roles: ["super-admin"] },
    { action: "rotate", label: "Rotate credentials", requiresMfa: true, roles: ["super-admin"] },
    { action: "revoke", label: "Revoke session/device", requiresMfa: true, roles: ["super-admin"] },
    { action: "export", label: "Export reports", requiresMfa: true, roles: ["super-admin"] },
    { action: "import", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "publish-config", label: "Publish configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "rollback-config", label: "Rollback configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "import-config", label: "Import configuration", requiresMfa: true, roles: ["super-admin"] },
    { action: "export-config", label: "Export configuration", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: ENTERPRISE_SOC_DRAFT_KEY,
    live: ENTERPRISE_SOC_LIVE_KEY,
    history: ENTERPRISE_SOC_HISTORY_KEY,
    settings: ENTERPRISE_SOC_SETTINGS_KEY,
  },
  relatedModules: [
    "enterprise-ai-operating-system",
    "incident-response-center",
    "recovery-center",
    "enterprise-deployment-center",
    "certification-center",
    "enterprise-mobile-control-center",
    "enterprise-workflow-engine",
    "security-engine",
    "security-center",
    "enterprise-core",
    "mission-control",
  ],
};

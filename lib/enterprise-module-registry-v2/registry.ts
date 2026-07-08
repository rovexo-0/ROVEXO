import type { RegistryV2Category } from "@/lib/enterprise-module-registry-v2/types";

export const REGISTRY_V2_CATEGORIES: Array<{ id: RegistryV2Category; label: string }> = [
  { id: "enterprise-core", label: "Enterprise Core" },
  { id: "mission-control", label: "Mission Control" },
  { id: "platform-studio", label: "Platform Studio" },
  { id: "theme-studio", label: "Theme Studio" },
  { id: "visual-cms", label: "Visual CMS" },
  { id: "asset-manager", label: "Asset Manager" },
  { id: "recovery", label: "Recovery" },
  { id: "audit", label: "Audit" },
  { id: "certification", label: "Certification" },
  { id: "developer", label: "Developer" },
  { id: "operations", label: "Operations" },
  { id: "analytics", label: "Analytics" },
  { id: "orders", label: "Orders" },
  { id: "shipping", label: "Shipping" },
  { id: "wallet", label: "Wallet" },
  { id: "payments", label: "Payments" },
  { id: "buyer-protection", label: "Purchase Protection" },
  { id: "messages", label: "Messages" },
  { id: "notifications", label: "Notifications" },
  { id: "ai", label: "AI" },
  { id: "search", label: "Search" },
  { id: "security", label: "Security" },
  { id: "integrations", label: "Integrations" },
  { id: "marketplace", label: "Marketplace" },
  { id: "system", label: "System" },
];

export const MODULE_REGISTRY_V2_ROUTES = [
  { id: "dashboard", label: "Dashboard", href: "/super-admin/module-registry" },
  { id: "modules", label: "Modules", href: "/super-admin/module-registry/modules" },
  { id: "dependencies", label: "Dependencies", href: "/super-admin/module-registry/dependencies" },
  { id: "health", label: "Health", href: "/super-admin/module-registry/health" },
  { id: "history", label: "History", href: "/super-admin/module-registry/history" },
  { id: "search", label: "Search", href: "/super-admin/module-registry/search" },
] as const;

export const MODULE_REGISTRY_V2_API = {
  snapshot: "/api/super-admin/module-registry",
  modules: "/api/super-admin/module-registry/modules",
  dependencies: "/api/super-admin/module-registry/dependencies",
  health: "/api/super-admin/module-registry/health",
  history: "/api/super-admin/module-registry/history",
  search: "/api/super-admin/module-registry/search",
  register: "/api/super-admin/module-registry/register",
  publish: "/api/super-admin/module-registry/publish",
  rollback: "/api/super-admin/module-registry/rollback",
  validate: "/api/super-admin/module-registry/validate",
  import: "/api/super-admin/module-registry/import",
  export: "/api/super-admin/module-registry/export",
  v1Snapshot: "/api/v1/super-admin/module-registry",
} as const;

export const MODULE_ID_CATEGORY_MAP: Record<string, RegistryV2Category> = {
  "mission-control": "mission-control",
  "mission-control-engine": "mission-control",
  "enterprise-core": "enterprise-core",
  "enterprise-module-registry-v2": "enterprise-core",
  "enterprise-workflow-engine": "platform-studio",
  "homepage-builder-engine": "visual-cms",
  "enterprise-ai-operating-system": "ai",
  "enterprise-mobile-control-center": "operations",
  "enterprise-deployment-center": "operations",
  "incident-response-center": "operations",
  "enterprise-security-operations-center": "security",
  "enterprise-business-intelligence": "analytics",
  "enterprise-automation-hub": "platform-studio",
  "omega-command-center": "ai",
  "omega-quality-assurance-center": "certification",
  "omega-development-director": "developer",
  "enterprise-observability-center": "operations",
  "enterprise-e2e-validation-engine": "certification",
  "enterprise-autonomous-execution-engine": "operations",
  "homepage-enterprise-certification-engine": "certification",
  "omega-global-ui-integrity-engine": "certification",
  "enterprise-launch-readiness-engine": "certification",
  "enterprise-marketplace-completion-engine": "certification",
  "enterprise-category-management-center": "marketplace",
  "enterprise-governance-center": "enterprise-core",
  "enterprise-development-center": "developer",
  "platform-studio": "platform-studio",
  "app-studio": "platform-studio",
  "theme-studio": "theme-studio",
  "visual-cms": "visual-cms",
  "asset-manager": "asset-manager",
  "recovery-center": "recovery",
  "audit-compliance-center": "audit",
  "compliance-center": "audit",
  "enterprise-compliance-center": "audit",
  "certification-center": "certification",
  "developer-center": "developer",
  "operations-center": "operations",
  "analytics-engine": "analytics",
  "analytics-center": "analytics",
  "orders-engine": "orders",
  "commerce-center": "orders",
  "shipping-engine": "shipping",
  "wallet-engine": "wallet",
  "payments-engine": "payments",
  "protection-engine": "buyer-protection",
  "messages-engine": "messages",
  "notifications-engine": "notifications",
  "ai-engine": "ai",
  "ai-center": "ai",
  "search-engine": "search",
  "security-engine": "security",
  "security-center": "security",
  "integrations-engine": "integrations",
  "marketplace-center": "marketplace",
  "incident-command-center": "operations",
  "incident-timeline": "operations",
  "omega-enterprise-mobile": "operations",
  "executive-command": "operations",
  "device-lifecycle-manager": "operations",
  "mobile-distribution-center": "operations",
};

export function resolveModuleCategory(moduleId: string, fallback: RegistryV2Category = "system"): RegistryV2Category {
  if (MODULE_ID_CATEGORY_MAP[moduleId]) return MODULE_ID_CATEGORY_MAP[moduleId]!;
  if (moduleId.includes("orders")) return "orders";
  if (moduleId.includes("shipping")) return "shipping";
  if (moduleId.includes("wallet")) return "wallet";
  if (moduleId.includes("payment")) return "payments";
  if (moduleId.includes("protection")) return "buyer-protection";
  if (moduleId.includes("message")) return "messages";
  if (moduleId.includes("notification")) return "notifications";
  if (moduleId.includes("analytics")) return "analytics";
  if (moduleId.includes("search")) return "search";
  if (moduleId.includes("security")) return "security";
  if (moduleId.includes("ai")) return "ai";
  if (moduleId.includes("audit") || moduleId.includes("compliance")) return "audit";
  if (moduleId.includes("certification")) return "certification";
  if (moduleId.includes("recovery")) return "recovery";
  return fallback;
}

export const MODULE_DEPENDENCY_HINTS: Record<string, string[]> = {
  "mission-control-engine": ["enterprise-core", "operations-center"],
  "enterprise-module-registry-v2": ["enterprise-core", "mission-control"],
  "enterprise-workflow-engine": ["enterprise-module-registry-v2", "enterprise-core", "notifications-engine"],
  "homepage-builder-engine": ["visual-cms", "asset-manager", "enterprise-workflow-engine", "enterprise-module-registry-v2"],
  "enterprise-ai-operating-system": ["ai-engine", "enterprise-workflow-engine", "operations-center", "enterprise-module-registry-v2"],
  "enterprise-mobile-control-center": ["mobile-distribution-center", "device-lifecycle-manager", "enterprise-ai-operating-system", "certification-center"],
  "enterprise-deployment-center": ["certification-center", "recovery-center", "enterprise-workflow-engine", "enterprise-ai-operating-system"],
  "incident-response-center": ["incident-timeline", "enterprise-ai-operating-system", "enterprise-deployment-center", "recovery-center", "enterprise-workflow-engine"],
  "enterprise-security-operations-center": ["enterprise-ai-operating-system", "incident-response-center", "recovery-center", "enterprise-deployment-center", "certification-center", "security-engine"],
  "enterprise-business-intelligence": ["enterprise-ai-operating-system", "analytics-engine", "enterprise-deployment-center", "incident-response-center", "enterprise-security-operations-center", "enterprise-workflow-engine"],
  "enterprise-automation-hub": ["enterprise-workflow-engine", "enterprise-ai-operating-system", "enterprise-business-intelligence", "enterprise-security-operations-center", "incident-response-center", "enterprise-deployment-center", "recovery-center", "homepage-builder-engine"],
  "omega-command-center": ["enterprise-ai-operating-system", "enterprise-workflow-engine", "enterprise-automation-hub", "enterprise-business-intelligence", "enterprise-security-operations-center", "incident-response-center", "enterprise-deployment-center", "operations-center", "recovery-center", "omega-quality-assurance-center", "omega-development-director", "enterprise-observability-center", "enterprise-e2e-validation-engine", "enterprise-autonomous-execution-engine"],
  "omega-quality-assurance-center": ["omega-command-center", "enterprise-governance-center", "enterprise-development-center", "certification-center", "enterprise-compliance-center", "enterprise-deployment-center", "enterprise-module-registry-v2", "enterprise-automation-hub", "omega-development-director", "enterprise-observability-center", "enterprise-e2e-validation-engine", "enterprise-autonomous-execution-engine"],
  "omega-development-director": ["omega-command-center", "omega-quality-assurance-center", "enterprise-governance-center", "enterprise-development-center", "enterprise-security-operations-center", "certification-center", "enterprise-deployment-center", "enterprise-module-registry-v2", "enterprise-automation-hub", "enterprise-observability-center", "enterprise-e2e-validation-engine", "enterprise-autonomous-execution-engine"],
  "enterprise-observability-center": ["omega-command-center", "omega-quality-assurance-center", "omega-development-director", "enterprise-governance-center", "enterprise-security-operations-center", "incident-response-center", "enterprise-business-intelligence", "enterprise-deployment-center", "certification-center", "operations-center", "enterprise-module-registry-v2", "enterprise-e2e-validation-engine", "enterprise-autonomous-execution-engine"],
  "enterprise-e2e-validation-engine": ["omega-command-center", "omega-quality-assurance-center", "omega-development-director", "enterprise-observability-center", "enterprise-governance-center", "enterprise-security-operations-center", "certification-center", "enterprise-deployment-center", "enterprise-module-registry-v2", "enterprise-automation-hub", "incident-response-center", "enterprise-autonomous-execution-engine"],
  "enterprise-autonomous-execution-engine": ["omega-command-center", "enterprise-ai-operating-system", "omega-development-director", "omega-quality-assurance-center", "enterprise-observability-center", "enterprise-e2e-validation-engine", "enterprise-governance-center", "enterprise-security-operations-center", "incident-response-center", "enterprise-business-intelligence", "enterprise-deployment-center", "certification-center", "enterprise-automation-hub", "mission-control-engine", "enterprise-module-registry-v2"],
  "homepage-enterprise-certification-engine": ["omega-command-center", "omega-quality-assurance-center", "omega-development-director", "enterprise-observability-center", "enterprise-e2e-validation-engine", "enterprise-governance-center", "enterprise-security-operations-center", "certification-center", "homepage-builder-engine", "omega-global-ui-integrity-engine", "enterprise-autonomous-execution-engine", "enterprise-module-registry-v2", "mission-control-engine"],
  "omega-global-ui-integrity-engine": ["omega-command-center", "omega-quality-assurance-center", "omega-development-director", "enterprise-observability-center", "enterprise-e2e-validation-engine", "enterprise-governance-center", "enterprise-security-operations-center", "certification-center", "homepage-enterprise-certification-engine", "homepage-category-integrity-engine", "enterprise-category-management-center", "homepage-builder-engine", "enterprise-autonomous-execution-engine", "enterprise-module-registry-v2", "mission-control-engine", "enterprise-deployment-center"],
  "enterprise-launch-readiness-engine": ["omega-command-center", "omega-quality-assurance-center", "omega-development-director", "enterprise-observability-center", "enterprise-e2e-validation-engine", "enterprise-governance-center", "enterprise-security-operations-center", "certification-center", "enterprise-deployment-center", "homepage-enterprise-certification-engine", "omega-global-ui-integrity-engine", "enterprise-autonomous-execution-engine", "enterprise-module-registry-v2", "mission-control-engine"],
  "enterprise-marketplace-completion-engine": ["omega-command-center", "omega-quality-assurance-center", "omega-development-director", "enterprise-observability-center", "enterprise-e2e-validation-engine", "enterprise-governance-center", "enterprise-security-operations-center", "certification-center", "enterprise-deployment-center", "enterprise-launch-readiness-engine", "homepage-enterprise-certification-engine", "omega-global-ui-integrity-engine", "enterprise-category-management-center", "enterprise-autonomous-execution-engine", "enterprise-module-registry-v2", "mission-control-engine"],
  "enterprise-category-management-center": ["omega-command-center", "omega-quality-assurance-center", "omega-development-director", "enterprise-observability-center", "enterprise-e2e-validation-engine", "homepage-enterprise-certification-engine", "omega-global-ui-integrity-engine", "enterprise-launch-readiness-engine", "homepage-builder-engine", "enterprise-governance-center", "enterprise-security-operations-center", "certification-center", "search-engine", "enterprise-autonomous-execution-engine", "enterprise-module-registry-v2", "mission-control-engine"],
  "enterprise-governance-center": ["enterprise-module-registry-v2", "enterprise-core", "omega-command-center", "omega-quality-assurance-center", "omega-development-director", "enterprise-observability-center", "enterprise-e2e-validation-engine", "enterprise-autonomous-execution-engine", "certification-center", "enterprise-compliance-center", "audit-compliance-center", "enterprise-deployment-center", "enterprise-workflow-engine"],
  "enterprise-development-center": ["enterprise-module-registry-v2", "enterprise-governance-center", "enterprise-deployment-center", "omega-command-center", "certification-center", "enterprise-workflow-engine", "platform-studio", "app-studio", "omega-development-director"],
  "incident-command-center": ["operations-center", "omega-enterprise-mobile"],
  "incident-timeline": ["incident-command-center", "operations-center"],
  "enterprise-compliance-center": ["audit-compliance-center", "certification-center", "incident-timeline"],
  "omega-enterprise-mobile": ["operations-center", "device-lifecycle-manager"],
  "executive-command": ["omega-enterprise-mobile", "analytics-engine"],
  "device-lifecycle-manager": ["mobile-distribution-center", "security-engine"],
  "certification-center": ["audit-compliance-center"],
  "recovery-center": ["operations-center", "audit-compliance-center"],
  "orders-engine": ["payments-engine", "shipping-engine", "wallet-engine"],
  "payments-engine": ["wallet-engine", "security-engine"],
  "protection-engine": ["orders-engine", "messages-engine"],
};

import type { AppStudioPlatformModule } from "@/lib/app-studio/types";

/** Enterprise platform modules — auto-register for App Studio overview. */
export const APP_STUDIO_MODULES: AppStudioPlatformModule[] = [
  { id: "marketplace", label: "Marketplace", icon: "🛒", category: "marketplace", href: "/super-admin/listings", status: "live", version: "1.0", health: "healthy", performanceScore: 98, permissions: ["read", "write"], dependencies: ["listings", "categories"] },
  { id: "buyers", label: "Buyers", icon: "🛍️", category: "people", href: "/super-admin/users", status: "live", version: "1.0", health: "healthy", performanceScore: 96, permissions: ["read"], dependencies: ["orders", "messages"] },
  { id: "sellers", label: "Sellers", icon: "🏷️", category: "people", href: "/super-admin/listings", status: "live", version: "1.2", health: "healthy", performanceScore: 95, permissions: ["read", "write"], dependencies: ["listings", "wallet"] },
  { id: "businesses", label: "Businesses", icon: "🏢", category: "people", href: "/super-admin/businesses", status: "live", version: "1.1", health: "healthy", performanceScore: 94, permissions: ["read", "approve"], dependencies: ["listings"] },
  { id: "categories", label: "Categories", icon: "📁", category: "design", href: "/super-admin/category-management", status: "live", version: "1.0", health: "healthy", performanceScore: 99, permissions: ["read", "write"], dependencies: ["search"] },
  { id: "listings", label: "Listings", icon: "📋", category: "marketplace", href: "/super-admin/listings", status: "live", version: "1.3", health: "healthy", performanceScore: 97, permissions: ["read", "moderate"], dependencies: ["categories"] },
  { id: "orders", label: "Orders Engine", icon: "📋", category: "commerce", href: "/super-admin/orders-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 96, permissions: ["read", "refund"], dependencies: ["payments", "shipping"] },
  { id: "orders-queue", label: "Order Queue", icon: "📦", category: "commerce", href: "/super-admin/orders", status: "live", version: "1.0", health: "healthy", performanceScore: 94, permissions: ["read", "refund"], dependencies: ["payments", "shipping"] },
  { id: "shipping", label: "Shipping", icon: "🚚", category: "commerce", href: "/super-admin/shipping-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 95, permissions: ["read"], dependencies: ["orders"] },
  { id: "payments", label: "Payments Engine", icon: "💳", category: "commerce", href: "/super-admin/payments-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 98, permissions: ["read", "refund"], dependencies: ["wallet"] },
  { id: "wallet", label: "Wallet Engine", icon: "💰", category: "commerce", href: "/super-admin/wallet-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 97, permissions: ["read", "withdraw"], dependencies: ["payments"] },
  { id: "protection", label: "Buyer Protection Engine", icon: "🛡️", category: "commerce", href: "/super-admin/protection-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 96, permissions: ["read", "moderate"], dependencies: ["orders", "payments"] },
  { id: "messages", label: "Messages Engine", icon: "💬", category: "people", href: "/super-admin/messages-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 94, permissions: ["read", "moderate"], dependencies: ["orders", "listings"] },
  { id: "notifications", label: "Notifications Engine", icon: "🔔", category: "platform", href: "/super-admin/notifications-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 93, permissions: ["read", "write"], dependencies: ["messages"] },
  { id: "support", label: "Support", icon: "🎧", category: "people", href: "/super-admin/support", status: "live", version: "1.0", health: "healthy", performanceScore: 92, permissions: ["read"], dependencies: [] },
  { id: "reviews", label: "Reviews", icon: "⭐", category: "people", href: "/super-admin/reviews", status: "live", version: "1.0", health: "healthy", performanceScore: 96, permissions: ["read", "moderate"], dependencies: ["listings"] },
  { id: "search", label: "Search Engine", icon: "🔍", category: "platform", href: "/super-admin/search-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 98, permissions: ["read", "write"], dependencies: ["listings", "categories"] },
  { id: "homepage", label: "Homepage", icon: "🏠", category: "design", href: "/super-admin/homepage-builder", status: "live", version: "1.4", health: "healthy", performanceScore: 99, permissions: ["read", "publish"], dependencies: ["theme-studio"] },
  { id: "auctions", label: "Live Auctions", icon: "🔨", category: "commerce", href: "/super-admin/auctions", status: "coming-soon", version: "0.9", health: "warning", performanceScore: 88, permissions: ["read"], dependencies: ["listings", "payments"] },
  { id: "ai", label: "AI Engine", icon: "🤖", category: "platform", href: "/super-admin/ai-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 96, permissions: ["read", "write", "manage-ai"], dependencies: ["analytics", "search"] },
  { id: "analytics", label: "Analytics Engine", icon: "📈", category: "insights", href: "/super-admin/analytics-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 97, permissions: ["read"], dependencies: ["orders", "payments"] },
  { id: "security", label: "Security Engine", icon: "🔒", category: "platform", href: "/super-admin/security-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 98, permissions: ["read", "write"], dependencies: ["analytics"] },
  { id: "developer", label: "Developer Center", icon: "🛠️", category: "platform", href: "/super-admin/developer", status: "live", version: "1.0", health: "healthy", performanceScore: 96, permissions: ["read", "write"], dependencies: [] },
  { id: "mission-control", label: "Mission Control", icon: "🛰️", category: "platform", href: "/super-admin", status: "live", version: "2.0", health: "healthy", performanceScore: 100, permissions: ["read"], dependencies: [] },
  { id: "mission-control-engine", label: "Mission Control Engine", icon: "🛰️", category: "platform", href: "/super-admin/mission-control-engine", status: "live", version: "2.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "publish"], dependencies: ["mission-control"] },
  { id: "theme-studio", label: "Theme Studio", icon: "🎨", category: "design", href: "/super-admin/theme-studio", status: "live", version: "1.0", health: "healthy", performanceScore: 98, permissions: ["manage-theme"], dependencies: [] },
  { id: "platform-studio", label: "Platform Studio", icon: "🧩", category: "platform", href: "/super-admin/platform-studio", status: "live", version: "1.0", health: "healthy", performanceScore: 97, permissions: ["read", "publish"], dependencies: [] },
  { id: "app-studio", label: "App Studio", icon: "🏛️", category: "platform", href: "/super-admin/app-studio", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "publish"], dependencies: ["mission-control"] },
  { id: "enterprise-core", label: "Enterprise Core", icon: "⚡", category: "platform", href: "/super-admin/enterprise-core", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "publish"], dependencies: ["mission-control", "app-studio"] },
  { id: "integrations", label: "Integrations Engine", icon: "🔌", category: "platform", href: "/super-admin/integrations-engine", status: "live", version: "1.0", health: "healthy", performanceScore: 97, permissions: ["read", "write"], dependencies: ["payments", "shipping", "notifications"] },
  { id: "visual-cms", label: "Visual CMS", icon: "🎨", category: "design", href: "/super-admin/visual-cms", status: "live", version: "1.0", health: "healthy", performanceScore: 99, permissions: ["read", "write", "publish"], dependencies: ["theme-studio", "homepage"] },
  { id: "asset-manager", label: "Asset Manager", icon: "✨", category: "design", href: "/super-admin/assets", status: "live", version: "1.0", health: "healthy", performanceScore: 98, permissions: ["read", "write", "publish"], dependencies: ["visual-cms", "premium-assets"] },
  { id: "operations-center", label: "Operations Center", icon: "🛰️", category: "platform", href: "/super-admin/operations", status: "live", version: "1.0", health: "healthy", performanceScore: 99, permissions: ["read", "write", "publish"], dependencies: ["mission-control", "monitoring"] },
  { id: "recovery-center", label: "Recovery Center", icon: "💾", category: "platform", href: "/super-admin/recovery", status: "live", version: "1.0", health: "healthy", performanceScore: 98, permissions: ["read", "write", "publish"], dependencies: ["operations-center", "backups"] },
  { id: "audit-compliance-center", label: "Audit & Compliance Center", icon: "📋", category: "platform", href: "/super-admin/audit", status: "live", version: "1.0", health: "healthy", performanceScore: 99, permissions: ["read", "write", "publish"], dependencies: ["operations-center", "recovery-center"] },
  { id: "certification-center", label: "Certification Center", icon: "🏆", category: "platform", href: "/super-admin/certification", status: "live", version: "1.0", health: "healthy", performanceScore: 99, permissions: ["read", "write", "publish"], dependencies: ["audit-compliance-center", "operations-center", "recovery-center"] },
  { id: "mobile-distribution-center", label: "Mobile Distribution Center", icon: "📱", category: "platform", href: "/super-admin/mobile-distribution", status: "live", version: "1.0", health: "healthy", performanceScore: 98, permissions: ["read", "write", "publish"], dependencies: ["certification-center", "security-engine", "operations-center"] },
  { id: "device-lifecycle-manager", label: "Device Lifecycle Manager", icon: "📱", category: "platform", href: "/super-admin/mobile-distribution/devices", status: "live", version: "1.0", health: "healthy", performanceScore: 97, permissions: ["read", "write", "publish"], dependencies: ["mobile-distribution-center", "security-engine", "recovery-center"] },
  { id: "omega-enterprise-mobile", label: "OMEGA Enterprise", icon: "🟡", category: "platform", href: "/super-admin/mobile/omega", status: "live", version: "1.0", health: "healthy", performanceScore: 99, permissions: ["read", "write", "publish"], dependencies: ["certification-center", "security-engine", "operations-center", "device-lifecycle-manager"] },
  { id: "incident-command-center", label: "Incident Command Center", icon: "🚨", category: "platform", href: "/super-admin/mobile/incidents", status: "live", version: "1.0", health: "healthy", performanceScore: 98, permissions: ["read", "write", "publish"], dependencies: ["omega-enterprise-mobile", "operations-center", "security-engine", "executive-command"] },
  { id: "incident-timeline", label: "Incident Timeline", icon: "🕒", category: "platform", href: "/super-admin/incidents/timeline", status: "live", version: "1.0", health: "healthy", performanceScore: 97, permissions: ["read", "write", "export"], dependencies: ["incident-command-center", "omega-enterprise-mobile", "operations-center"] },
  { id: "enterprise-compliance-center", label: "Audit & Compliance Center", icon: "📋", category: "platform", href: "/super-admin/compliance", status: "live", version: "1.0", health: "healthy", performanceScore: 99, permissions: ["read", "write", "export"], dependencies: ["audit-compliance-center", "certification-center", "incident-timeline", "omega-enterprise-mobile"] },
  { id: "enterprise-module-registry-v2", label: "Enterprise Module Registry", icon: "🗂️", category: "platform", href: "/super-admin/module-registry", status: "live", version: "2.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "publish", "rollback"], dependencies: ["enterprise-core", "mission-control"] },
  { id: "enterprise-workflow-engine", label: "Enterprise Workflow Engine", icon: "⚡", category: "platform", href: "/super-admin/workflows", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "publish", "run"], dependencies: ["enterprise-module-registry-v2", "enterprise-core"] },
  { id: "homepage-builder-engine", label: "Homepage Builder", icon: "🏠", category: "design", href: "/super-admin/homepage-builder", status: "live", version: "2.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "publish"], dependencies: ["visual-cms", "asset-manager"] },
  { id: "enterprise-ai-operating-system", label: "Enterprise AI OS", icon: "🧠", category: "platform", href: "/super-admin/ai", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "publish", "run-scan"], dependencies: ["ai-engine", "enterprise-workflow-engine"] },
  { id: "enterprise-mobile-control-center", label: "Mobile Control Center", icon: "📱", category: "platform", href: "/super-admin/mobile", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "publish", "build"], dependencies: ["mobile-distribution-center", "enterprise-ai-operating-system"] },
  { id: "enterprise-deployment-center", label: "Deployment Center", icon: "🚀", category: "platform", href: "/super-admin/deployment", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "deploy", "rollback"], dependencies: ["certification-center", "enterprise-workflow-engine"] },
  { id: "incident-response-center", label: "Incident Response Center", icon: "🚨", category: "platform", href: "/super-admin/incidents", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "acknowledge", "resolve", "escalate"], dependencies: ["enterprise-ai-operating-system", "incident-timeline", "recovery-center"] },
  { id: "enterprise-security-operations-center", label: "Security Operations Center", icon: "🛡️", category: "platform", href: "/super-admin/security", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "scan", "block", "quarantine", "revoke"], dependencies: ["enterprise-ai-operating-system", "incident-response-center", "security-engine"] },
  { id: "enterprise-business-intelligence", label: "Business Intelligence Center", icon: "📊", category: "platform", href: "/super-admin/business-intelligence", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "calculate", "forecast", "export"], dependencies: ["enterprise-ai-operating-system", "analytics-engine"] },
  { id: "enterprise-automation-hub", label: "Enterprise Automation Hub", icon: "🤖", category: "platform", href: "/super-admin/automation", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "run", "publish", "rollback", "export"], dependencies: ["enterprise-workflow-engine", "enterprise-ai-operating-system", "enterprise-business-intelligence"] },
  { id: "omega-command-center", label: "OMEGA Command Center", icon: "🟡", category: "platform", href: "/super-admin/omega", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "run-scan", "repair", "deploy", "rollback", "export"], dependencies: ["enterprise-ai-operating-system", "enterprise-workflow-engine", "enterprise-automation-hub"] },
  { id: "omega-quality-assurance-center", label: "OMEGA Quality Assurance Center", icon: "🔬", category: "platform", href: "/super-admin/quality-assurance", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "validate", "scan", "fix", "certify", "export"], dependencies: ["omega-command-center", "enterprise-governance-center", "certification-center"] },
  { id: "omega-development-director", label: "OMEGA Development Director", icon: "🎯", category: "platform", href: "/super-admin/development-director", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "analyze", "discover", "prioritize", "repair", "export"], dependencies: ["omega-command-center", "omega-quality-assurance-center", "enterprise-governance-center", "enterprise-development-center"] },
  { id: "enterprise-observability-center", label: "Enterprise Observability Center", icon: "📡", category: "platform", href: "/super-admin/observability", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "monitor", "telemetry", "diagnose", "alerts", "sync-omega", "export"], dependencies: ["omega-command-center", "incident-response-center", "enterprise-business-intelligence", "operations-center"] },
  { id: "enterprise-e2e-validation-engine", label: "Enterprise E2E Validation Engine", icon: "✅", category: "platform", href: "/super-admin/e2e-validation", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "validate", "regression", "analyze", "export"], dependencies: ["omega-command-center", "omega-quality-assurance-center", "enterprise-governance-center", "certification-center"] },
  { id: "enterprise-autonomous-execution-engine", label: "Enterprise Autonomous Execution Engine", icon: "⚙️", category: "platform", href: "/super-admin/autonomous-execution", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "orchestrate", "execute", "prioritize", "approve", "recover", "export"], dependencies: ["omega-command-center", "enterprise-e2e-validation-engine", "enterprise-governance-center", "enterprise-deployment-center"] },
  { id: "homepage-enterprise-certification-engine", label: "Homepage Enterprise Certification", icon: "🏠", category: "platform", href: "/super-admin/homepage-certification", status: "live", version: "1.1", health: "healthy", performanceScore: 100, permissions: ["read", "write", "validate", "certify", "analyze", "export"], dependencies: ["homepage-builder-engine", "omega-quality-assurance-center", "omega-global-ui-integrity-engine", "certification-center", "enterprise-e2e-validation-engine"] },
  { id: "omega-global-ui-integrity-engine", label: "OMEGA Global UI Integrity", icon: "🔮", category: "platform", href: "/super-admin/global-ui-integrity", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "validate", "repair", "certify", "export"], dependencies: ["omega-command-center", "omega-quality-assurance-center", "enterprise-governance-center", "certification-center", "homepage-enterprise-certification-engine", "enterprise-e2e-validation-engine"] },
  { id: "enterprise-launch-readiness-engine", label: "Enterprise Launch Readiness", icon: "🚀", category: "platform", href: "/super-admin/launch-readiness", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "validate", "repair", "certify", "export"], dependencies: ["omega-command-center", "omega-quality-assurance-center", "enterprise-deployment-center", "enterprise-observability-center", "certification-center", "homepage-enterprise-certification-engine", "omega-global-ui-integrity-engine", "enterprise-e2e-validation-engine"] },
  { id: "enterprise-marketplace-completion-engine", label: "Marketplace Completion", icon: "🏪", category: "platform", href: "/super-admin/marketplace-completion", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "validate", "repair", "certify", "export"], dependencies: ["omega-command-center", "enterprise-launch-readiness-engine", "omega-global-ui-integrity-engine", "homepage-enterprise-certification-engine", "enterprise-e2e-validation-engine", "certification-center"] },
  { id: "enterprise-category-management-center", label: "Enterprise Category Management Center", icon: "📁", category: "platform", href: "/super-admin/category-management", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "validate", "sync", "import", "export", "certify"], dependencies: ["search-engine", "homepage-builder-engine", "certification-center", "omega-quality-assurance-center"] },
  { id: "enterprise-governance-center", label: "Enterprise Governance Center", icon: "⚖️", category: "platform", href: "/super-admin/governance", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "scan", "validate", "certify", "export"], dependencies: ["enterprise-module-registry-v2", "omega-command-center", "certification-center"] },
  { id: "enterprise-development-center", label: "Enterprise Development Center", icon: "🛠️", category: "platform", href: "/super-admin/development", status: "live", version: "1.0", health: "healthy", performanceScore: 100, permissions: ["read", "write", "validate", "build", "deploy", "export"], dependencies: ["enterprise-module-registry-v2", "enterprise-governance-center", "omega-command-center", "enterprise-deployment-center"] },
  { id: "settings", label: "Settings", icon: "⚙️", category: "settings", href: "/super-admin/platform", status: "live", version: "1.0", health: "healthy", performanceScore: 99, permissions: ["read", "write"], dependencies: [] },
];

export const APP_STUDIO_NAV_SECTIONS = [
  "topNav",
  "bottomNav",
  "sidebar",
  "footerNav",
  "accountNav",
  "businessNav",
  "sellerNav",
  "buyerNav",
  "supportNav",
  "mobileNav",
  "desktopNav",
] as const;

export const APP_STUDIO_PAGE_TYPES = [
  "homepage",
  "landing",
  "business",
  "seller",
  "buyer",
  "support",
  "help-center",
  "legal",
  "marketing",
  "campaign",
  "custom",
] as const;

export const APP_STUDIO_SIMULATOR_DEVICES = [
  "windows",
  "macos",
  "iphone",
  "android",
  "tablet",
  "desktop",
  "laptop",
  "ultrawide",
] as const;

export function registerAppStudioModule(module: AppStudioPlatformModule): AppStudioPlatformModule[] {
  const index = APP_STUDIO_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...APP_STUDIO_MODULES];
    next[index] = module;
    return next;
  }
  return [...APP_STUDIO_MODULES, module];
}

export function getAppStudioModule(id: string): AppStudioPlatformModule | undefined {
  return APP_STUDIO_MODULES.find((item) => item.id === id);
}

import type { PlatformStudioModule } from "@/lib/platform-studio/types";

/** Platform modules auto-register for Platform Studio builders. */
export const PLATFORM_STUDIO_MODULES: PlatformStudioModule[] = [
  { id: "marketplace", label: "Marketplace", icon: "🛒", category: "marketplace", href: "/super-admin/listings", builders: ["forms", "workflows", "dashboards", "pages"] },
  { id: "buyer", label: "Buyer", icon: "🛍️", category: "people", href: "/super-admin/users", builders: ["forms", "dashboards", "pages", "permissions"] },
  { id: "seller", label: "Seller", icon: "🏷️", category: "people", href: "/super-admin/listings", builders: ["forms", "workflows", "dashboards", "automations", "pages"] },
  { id: "business", label: "Business", icon: "🏢", category: "people", href: "/super-admin/businesses", builders: ["forms", "workflows", "dashboards", "pages"] },
  { id: "shipping", label: "Shipping", icon: "🚚", category: "commerce", href: "/super-admin/shipping-engine", builders: ["workflows", "automations", "database"] },
  { id: "payments", label: "Payments Engine", icon: "💳", category: "commerce", href: "/super-admin/payments-engine", builders: ["workflows", "automations", "database", "permissions"] },
  { id: "protection", label: "Buyer Protection", icon: "🛡️", category: "commerce", href: "/super-admin/protection-engine", builders: ["workflows", "automations", "database"] },
  { id: "wallet", label: "Wallet Engine", icon: "💰", category: "commerce", href: "/super-admin/wallet-engine", builders: ["workflows", "dashboards", "automations"] },
  { id: "orders", label: "Orders", icon: "📋", category: "commerce", href: "/super-admin/orders-engine", builders: ["workflows", "dashboards", "automations", "database"] },
  { id: "orders-legacy", label: "Order Queue", icon: "📦", category: "commerce", href: "/super-admin/orders", builders: ["workflows", "dashboards", "automations", "database"] },
  { id: "messages", label: "Messages Engine", icon: "💬", category: "people", href: "/super-admin/messages-engine", builders: ["forms", "workflows", "dashboards"] },
  { id: "notifications", label: "Notifications Engine", icon: "🔔", category: "platform", href: "/super-admin/notifications-engine", builders: ["workflows", "automations"] },
  { id: "reviews", label: "Reviews", icon: "⭐", category: "people", href: "/super-admin/reviews", builders: ["forms", "workflows", "database"] },
  { id: "support", label: "Support", icon: "🎧", category: "people", href: "/super-admin/support", builders: ["forms", "workflows", "dashboards", "pages"] },
  { id: "auctions", label: "Live Auctions", icon: "🔨", category: "commerce", href: "/super-admin/auctions", builders: ["workflows", "dashboards", "automations"] },
  { id: "ai", label: "AI Engine", icon: "🤖", category: "platform", href: "/super-admin/ai-engine", builders: ["workflows", "automations", "permissions", "dashboards"] },
  { id: "homepage", label: "Homepage", icon: "🏠", category: "design", href: "/super-admin/homepage-builder", builders: ["pages", "dashboards"] },
  { id: "search", label: "Search Engine", icon: "🔍", category: "platform", href: "/super-admin/search-engine", builders: ["forms", "database", "dashboards"] },
  { id: "categories", label: "Categories", icon: "📁", category: "design", href: "/super-admin/categories", builders: ["forms", "database", "pages"] },
  { id: "theme-studio", label: "Theme Studio", icon: "🎨", category: "design", href: "/super-admin/theme-studio", builders: ["pages"] },
  { id: "mission-control", label: "Mission Control", icon: "🛰️", category: "platform", href: "/super-admin", builders: ["dashboards", "permissions"] },
  { id: "mission-control-engine", label: "Mission Control Engine", icon: "🛰️", category: "platform", href: "/super-admin/mission-control-engine", builders: ["dashboards", "permissions", "workflows"] },
  { id: "developer", label: "Developer Center", icon: "🛠️", category: "platform", href: "/super-admin/developer", builders: ["workflows", "dashboards", "permissions"] },
  { id: "analytics", label: "Analytics Engine", icon: "📈", category: "insights", href: "/super-admin/analytics-engine", builders: ["dashboards", "automations"] },
  { id: "security", label: "Security Engine", icon: "🔒", category: "platform", href: "/super-admin/security-engine", builders: ["workflows", "permissions", "dashboards"] },
  { id: "app-studio", label: "App Studio", icon: "🏛️", category: "platform", href: "/super-admin/app-studio", builders: ["dashboards", "permissions", "pages"] },
  { id: "integrations", label: "Integrations Engine", icon: "🔌", category: "platform", href: "/super-admin/integrations-engine", builders: ["workflows", "database", "permissions", "dashboards"] },
  { id: "visual-cms", label: "Visual CMS", icon: "🎨", category: "design", href: "/super-admin/visual-cms", builders: ["pages", "dashboards"] },
  { id: "asset-manager", label: "Asset Manager", icon: "✨", category: "design", href: "/super-admin/assets", builders: ["pages", "dashboards"] },
  { id: "operations-center", label: "Operations Center", icon: "🛰️", category: "platform", href: "/super-admin/operations", builders: ["dashboards", "workflows"] },
  { id: "recovery-center", label: "Recovery Center", icon: "💾", category: "platform", href: "/super-admin/recovery", builders: ["dashboards", "workflows"] },
  { id: "audit-compliance-center", label: "Audit & Compliance Center", icon: "📋", category: "platform", href: "/super-admin/audit", builders: ["dashboards", "permissions"] },
  { id: "certification-center", label: "Certification Center", icon: "🏆", category: "platform", href: "/super-admin/certification", builders: ["dashboards", "workflows"] },
  { id: "mobile-distribution-center", label: "Mobile Distribution Center", icon: "📱", category: "platform", href: "/super-admin/mobile-distribution", builders: ["dashboards", "workflows"] },
  { id: "device-lifecycle-manager", label: "Device Lifecycle Manager", icon: "📱", category: "platform", href: "/super-admin/mobile-distribution/devices", builders: ["dashboards", "workflows"] },
  { id: "omega-enterprise-mobile", label: "OMEGA Enterprise", icon: "🟡", category: "platform", href: "/super-admin/mobile/omega", builders: ["dashboards", "workflows"] },
  { id: "incident-command-center", label: "Incident Command Center", icon: "🚨", category: "platform", href: "/super-admin/mobile/incidents", builders: ["dashboards", "workflows"] },
  { id: "incident-timeline", label: "Incident Timeline", icon: "🕒", category: "platform", href: "/super-admin/incidents/timeline", builders: ["dashboards", "workflows"] },
  { id: "enterprise-compliance-center", label: "Audit & Compliance Center", icon: "📋", category: "platform", href: "/super-admin/compliance", builders: ["dashboards", "workflows"] },
  { id: "enterprise-module-registry-v2", label: "Enterprise Module Registry", icon: "🗂️", category: "platform", href: "/super-admin/module-registry", builders: ["dashboards", "workflows", "permissions"] },
  { id: "enterprise-workflow-engine", label: "Enterprise Workflow Engine", icon: "⚡", category: "platform", href: "/super-admin/workflows", builders: ["workflows", "automations", "dashboards", "permissions"] },
  { id: "homepage-builder-engine", label: "Homepage Builder", icon: "🏠", category: "design", href: "/super-admin/homepage-builder", builders: ["pages", "dashboards", "workflows"] },
  { id: "enterprise-ai-operating-system", label: "Enterprise AI OS", icon: "🧠", category: "platform", href: "/super-admin/ai", builders: ["dashboards", "workflows", "automations"] },
  { id: "enterprise-mobile-control-center", label: "Mobile Control Center", icon: "📱", category: "platform", href: "/super-admin/mobile", builders: ["dashboards", "workflows", "automations"] },
  { id: "enterprise-deployment-center", label: "Deployment Center", icon: "🚀", category: "platform", href: "/super-admin/deployment", builders: ["dashboards", "workflows", "automations"] },
  { id: "incident-response-center", label: "Incident Response Center", icon: "🚨", category: "platform", href: "/super-admin/incidents", builders: ["dashboards", "workflows", "automations"] },
  { id: "enterprise-security-operations-center", label: "Security Operations Center", icon: "🛡️", category: "platform", href: "/super-admin/security", builders: ["dashboards", "workflows", "automations", "permissions"] },
  { id: "enterprise-business-intelligence", label: "Business Intelligence Center", icon: "📊", category: "platform", href: "/super-admin/business-intelligence", builders: ["dashboards", "workflows", "automations"] },
  { id: "enterprise-automation-hub", label: "Enterprise Automation Hub", icon: "🤖", category: "platform", href: "/super-admin/automation", builders: ["workflows", "automations", "dashboards"] },
  { id: "omega-command-center", label: "OMEGA Command Center", icon: "🟡", category: "platform", href: "/super-admin/omega", builders: ["automations", "dashboards", "workflows"] },
  { id: "enterprise-governance-center", label: "Enterprise Governance Center", icon: "⚖️", category: "platform", href: "/super-admin/governance", builders: ["dashboards", "automations", "permissions"] },
  { id: "enterprise-development-center", label: "Enterprise Development Center", icon: "🛠️", category: "platform", href: "/super-admin/development", builders: ["dashboards", "workflows", "automations"] },
  { id: "enterprise-core", label: "Enterprise Core", icon: "⚡", category: "platform", href: "/super-admin/enterprise-core", builders: ["dashboards", "permissions"] },
];

export const PLATFORM_STUDIO_FIELD_TYPES = [
  "text", "textarea", "number", "currency", "email", "password", "phone", "country", "language",
  "date", "time", "datetime", "checkbox", "switch", "radio", "dropdown", "multi-select", "tags",
  "location", "map", "address", "image-upload", "video-upload", "document-upload", "signature",
  "rating", "color-picker", "icon-picker", "slider", "repeater", "hidden", "divider",
  "rich-text", "markdown", "json", "ai-input", "barcode", "qr-code",
] as const;

export const PLATFORM_STUDIO_WIDGET_TYPES = [
  { id: "chart", label: "Charts", icon: "📈" },
  { id: "statistics", label: "Statistics", icon: "📊" },
  { id: "table", label: "Tables", icon: "📑" },
  { id: "list", label: "Lists", icon: "📋" },
  { id: "recent-activity", label: "Recent Activity", icon: "🕒" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "orders", label: "Orders", icon: "📦" },
  { id: "wallet", label: "Wallet", icon: "👛" },
  { id: "revenue", label: "Revenue", icon: "💰" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "visitors", label: "Visitors", icon: "👁️" },
  { id: "products", label: "Products", icon: "🏷️" },
  { id: "businesses", label: "Businesses", icon: "🏢" },
  { id: "live-users", label: "Live Users", icon: "🟢" },
  { id: "platform-health", label: "Platform Health", icon: "💚" },
] as const;

export const PLATFORM_STUDIO_PERMISSIONS = [
  "read", "write", "publish", "delete", "approve", "reject", "refund", "withdraw", "moderate",
  "manage-ai", "manage-theme", "manage-assets", "manage-users", "manage-orders", "manage-shipping", "manage-payments",
] as const;

export function registerPlatformStudioModule(module: PlatformStudioModule): PlatformStudioModule[] {
  const index = PLATFORM_STUDIO_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...PLATFORM_STUDIO_MODULES];
    next[index] = module;
    return next;
  }
  return [...PLATFORM_STUDIO_MODULES, module];
}

export function getPlatformStudioModule(id: string): PlatformStudioModule | undefined {
  return PLATFORM_STUDIO_MODULES.find((item) => item.id === id);
}

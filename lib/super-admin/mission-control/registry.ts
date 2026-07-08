import type { MissionControlModule } from "@/lib/super-admin/mission-control/types";

/** Central module registry — future modules register here for Mission Control. */
export const MISSION_CONTROL_MODULES: MissionControlModule[] = [
  { id: "enterprise-core", label: "Enterprise Core", description: "Unified enterprise operating system", href: "/super-admin/enterprise-core", icon: "⚡", category: "platform" },
  { id: "app-studio", label: "App Studio", description: "Enterprise platform operating system", href: "/super-admin/app-studio", icon: "🏛️", category: "platform" },
  { id: "platform-studio", label: "Platform Studio", description: "No-code platform builder", href: "/super-admin/platform-studio", icon: "🧩", category: "platform" },
  { id: "theme-studio", label: "Theme Studio Pro", description: "Visual platform designer", href: "/super-admin/theme-studio", icon: "🎨", category: "content" },
  { id: "menu-builder", label: "Menu Builder", description: "Dynamic navigation", href: "/super-admin/menu-builder", icon: "🧭", category: "content" },
  { id: "homepage-builder", label: "Homepage Builder", description: "Visual homepage editor", href: "/super-admin/homepage-builder", icon: "🏠", category: "content" },
  { id: "listings", label: "Listings", description: "Marketplace listings", href: "/super-admin/listings", icon: "🏷️", category: "commerce" },
  { id: "orders", label: "Orders", description: "Order management", href: "/super-admin/orders", icon: "📦", category: "commerce" },
  { id: "orders-engine", label: "Orders Engine", description: "Enterprise order lifecycle", href: "/super-admin/orders-engine", icon: "📋", category: "commerce" },
  { id: "shipping", label: "Shipping Engine", description: "Logistics foundation", href: "/super-admin/shipping-engine", icon: "🚚", category: "commerce" },
  { id: "payments", label: "Payments", description: "Transactions & Stripe", href: "/super-admin/payments", icon: "💳", category: "commerce" },
  { id: "payments-engine", label: "Payments Engine", description: "Payment orchestration", href: "/super-admin/payments-engine", icon: "💳", category: "commerce" },
  { id: "protection-engine", label: "Purchase Protection Engine", description: "Trust and dispute system", href: "/super-admin/protection-engine", icon: "🛡️", category: "commerce" },
  { id: "messages-engine", label: "Messages Engine", description: "Enterprise communication system", href: "/super-admin/messages-engine", icon: "💬", category: "people" },
  { id: "notifications-engine", label: "Notifications Engine", description: "Real-time event delivery platform", href: "/super-admin/notifications-engine", icon: "🔔", category: "platform" },
  { id: "analytics-engine", label: "Analytics Engine", description: "Enterprise business intelligence", href: "/super-admin/analytics-engine", icon: "📊", category: "insights" },
  { id: "security-engine", label: "Security Engine", description: "Enterprise security and compliance", href: "/super-admin/security-engine", icon: "🔒", category: "platform" },
  { id: "search-engine", label: "Search Engine", description: "Enterprise search and discovery", href: "/super-admin/search-engine", icon: "🔍", category: "platform" },
  { id: "ai-engine", label: "AI Engine", description: "Enterprise AI orchestration", href: "/super-admin/ai-engine", icon: "🤖", category: "platform" },
  { id: "integrations-engine", label: "Integrations Engine", description: "External services and API platform", href: "/super-admin/integrations-engine", icon: "🔌", category: "platform" },
  { id: "mission-control-engine", label: "Mission Control Engine", description: "Enterprise command center configuration", href: "/super-admin/mission-control-engine", icon: "🛰️", category: "platform" },
  { id: "visual-cms", label: "Visual CMS", description: "Enterprise visual design platform", href: "/super-admin/visual-cms", icon: "🎨", category: "content" },
  { id: "asset-manager", label: "Asset Manager", description: "Digital asset operating system", href: "/super-admin/assets", icon: "✨", category: "content" },
  { id: "wallet", label: "Wallet", description: "Balances & withdrawals", href: "/super-admin/wallet-engine", icon: "👛", category: "commerce" },
  { id: "wallet-engine", label: "Wallet Engine", description: "Enterprise digital wallet", href: "/super-admin/wallet-engine", icon: "💰", category: "commerce" },
  { id: "users", label: "Users", description: "Accounts & sessions", href: "/super-admin/users", icon: "👤", category: "people" },
  { id: "businesses", label: "Businesses", description: "B2B accounts", href: "/super-admin/businesses", icon: "🏢", category: "people" },
  { id: "categories", label: "Categories", description: "Taxonomy & icons", href: "/super-admin/category-management", icon: "📁", category: "content" },
  { id: "banners", label: "Banner Manager", description: "Hero & promo banners", href: "/super-admin/banners", icon: "🖼️", category: "content" },
  { id: "premium-assets", label: "Premium Asset Manager", description: "Photography pipeline", href: "/super-admin/premium-design", icon: "✨", category: "content" },
  { id: "ai-manager", label: "AI Manager", description: "Global & feature AI toggles", href: "/super-admin/ai-manager", icon: "🤖", category: "platform" },
  { id: "features", label: "Feature Manager", description: "Module rollout control", href: "/super-admin/features", icon: "🧩", category: "platform" },
  { id: "analytics", label: "Analytics", description: "Platform metrics", href: "/super-admin/analytics", icon: "📈", category: "insights" },
  { id: "reports", label: "Reports", description: "Moderation queue", href: "/super-admin/reports", icon: "🚩", category: "insights" },
  { id: "support", label: "Support", description: "Help centre ops", href: "/super-admin/support", icon: "🎧", category: "people" },
  { id: "messages", label: "Messages", description: "Conversation oversight", href: "/super-admin/moderation", icon: "💬", category: "people" },
  { id: "notifications", label: "Notifications", description: "Broadcast centre", href: "/super-admin/notifications", icon: "🔔", category: "platform" },
  { id: "security", label: "Security", description: "Audit & sessions", href: "/super-admin/security", icon: "🔐", category: "platform" },
  { id: "developer", label: "Developer Tools", description: "Cache, assets, health", href: "/super-admin/developer", icon: "🛠️", category: "platform" },
  { id: "settings", label: "Settings", description: "Platform configuration", href: "/super-admin/platform", icon: "⚙️", category: "platform" },
  { id: "quick-listing", label: "Quick Listing", description: "Admin publish without seller login", href: "/super-admin/quick-listing", icon: "⚡", category: "commerce" },
  { id: "production-assets", label: "Production Validator", description: "Asset QA gate", href: "/super-admin/production-assets", icon: "✅", category: "platform" },
  { id: "operations-center", label: "Operations Center", description: "Enterprise NOC and live monitoring", href: "/super-admin/operations", icon: "🛰️", category: "platform" },
  { id: "recovery-center", label: "Recovery Center", description: "Disaster recovery & continuity", href: "/super-admin/recovery", icon: "💾", category: "platform" },
  { id: "audit-compliance-center", label: "Audit & Compliance", description: "Production certification", href: "/super-admin/audit", icon: "📋", category: "platform" },
  { id: "certification-center", label: "Certification Center", description: "Production release gate", href: "/super-admin/certification", icon: "🏆", category: "platform" },
  { id: "mobile-distribution-center", label: "Mobile Distribution", description: "Super Admin Mobile app", href: "/super-admin/mobile-distribution", icon: "📱", category: "platform" },
  { id: "device-lifecycle-manager", label: "Device Lifecycle", description: "Device trust and security", href: "/super-admin/mobile-distribution/devices", icon: "📱", category: "platform" },
  { id: "omega-enterprise-mobile", label: "OMEGA Enterprise", description: "Enterprise command center", href: "/super-admin/mobile/omega", icon: "🟡", category: "platform" },
  { id: "incident-command-center", label: "Incident Command Center", description: "Notification and incident command", href: "/super-admin/mobile/incidents", icon: "🚨", category: "platform" },
  { id: "incident-timeline", label: "Incident Timeline", description: "Chronological audit-ready incident history", href: "/super-admin/incidents/timeline", icon: "🕒", category: "platform" },
  { id: "enterprise-compliance-center", label: "Audit Readiness & Certification", description: "Audit readiness and certification intelligence", href: "/super-admin/compliance", icon: "🏆", category: "platform" },
  { id: "operations-ai", label: "AI Operations", description: "AI monitoring & repair", href: "/super-admin/operations/ai", icon: "🤖", category: "platform" },
  { id: "monitoring", label: "System Health", description: "Infra diagnostics", href: "/super-admin/monitoring", icon: "💚", category: "platform" },
  { id: "audit", label: "Logs", description: "Audit trail", href: "/super-admin/audit", icon: "📋", category: "insights" },
];

export function registerMissionControlModule(module: MissionControlModule): MissionControlModule[] {
  const existing = MISSION_CONTROL_MODULES.findIndex((item) => item.id === module.id);
  if (existing >= 0) {
    const next = [...MISSION_CONTROL_MODULES];
    next[existing] = module;
    return next;
  }
  return [...MISSION_CONTROL_MODULES, module];
}

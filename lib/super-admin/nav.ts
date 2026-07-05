import { buildEnterprisePrimaryNavItems } from "@/lib/enterprise-architecture/navigation";
import { ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-development-center/descriptor";

export type SuperAdminNavItem = {
  href: string;
  label: string;
  description?: string;
  icon?: string;
};

/** Enterprise modules — registry-driven, no hardcoded routes. */
const ENTERPRISE_REGISTRY_PRIMARY_NAV = buildEnterprisePrimaryNavItems();

/** Primary super-admin navigation shown in profile menu and shell. */
export const SUPER_ADMIN_PRIMARY_NAV: SuperAdminNavItem[] = [
  { href: "/super-admin", label: "Command Center", description: "Enterprise operations dashboard", icon: "🛰️" },
  { href: "/super-admin/command-os", label: "Command OS", description: "Enterprise v4.0 platform operating system", icon: "🧭" },
  { href: "/super-admin/experience", label: "Experience OS", description: "XOS v3 screens, navigation, publish", icon: "🎛️" },
  { href: "/super-admin/users", label: "Users", description: "Accounts & sessions", icon: "👤" },
  { href: "/super-admin/moderation", label: "Listings", description: "Moderation & marketplace listings", icon: "🏷️" },
  { href: "/super-admin/category-management", label: "Categories", description: "Taxonomy tree", icon: "📁" },
  { href: "/super-admin/orders-engine", label: "Orders", description: "Order management engine", icon: "📦" },
  { href: "/super-admin/payments-engine", label: "Payments", description: "Payments engine", icon: "💳" },
  { href: "/super-admin/wallet", label: "Wallet", description: "Balances & withdrawals", icon: "👛" },
  { href: "/super-admin/reports", label: "Reports", description: "Moderation queue", icon: "🚩" },
  { href: "/super-admin/analytics", label: "Analytics", description: "Platform metrics", icon: "📈" },
  { href: "/super-admin/seo", label: "SEO", description: "Search optimisation", icon: "🌐" },
  { href: "/super-admin/platform", label: "Platform Settings", description: "Feature flags & maintenance", icon: "⚙️" },
  { href: "/super-admin/notifications", label: "Notifications", description: "Broadcast messages", icon: "🔔" },
  { href: "/super-admin/trust", label: "Trust Centre", description: "Scores & verification", icon: "🛡️" },
  { href: "/super-admin/moderation", label: "Moderation", description: "Content moderation", icon: "🧹" },
  { href: "/super-admin/reviews", label: "Reviews", description: "Product reviews", icon: "⭐" },
  { href: "/super-admin/coupons", label: "Coupons", description: "Discount codes", icon: "🎟️" },
  { href: "/super-admin/promotions", label: "Promotions", description: "Featured & bumps", icon: "📣" },
  { href: "/super-admin/email", label: "Email Centre", description: "Outbound email", icon: "✉️" },
  { href: "/super-admin/support", label: "Support", description: "Help centre ops", icon: "🎧" },
  { href: "/super-admin/monitoring", label: "System Health", description: "Infra & cron", icon: "💚" },
  { href: "/super-admin/production-assets", label: "Production Asset Validator", description: "Premium asset QA", icon: "🖼️" },
  { href: "/super-admin/premium-design", label: "Premium Asset Manager", description: "Design system assets", icon: "✨" },
  { href: "/super-admin/operations", label: "Operations Center", description: "NOC & live monitoring", icon: "🛰️" },
  { href: "/super-admin/operations/ai", label: "AI Operations Center", description: "AI monitoring & repair", icon: "🤖" },
  { href: "/super-admin/audit", label: "Audit & Compliance", description: "Production certification", icon: "📋" },
  { href: "/super-admin/certification", label: "Certification Center", description: "Production release gate", icon: "🏆" },
  { href: "/super-admin/mobile-distribution", label: "Super Admin Mobile", description: "Enterprise mobile administration app", icon: "📱" },
  { href: "/super-admin/mobile/omega", label: "OMEGA Enterprise", description: "Enterprise command center", icon: "🟡" },
  { href: "/super-admin/mobile/omega/executive-command", label: "Executive Command", description: "ORI executive intelligence dashboard", icon: "🚀" },
  { href: "/super-admin/module-registry", label: "Enterprise Module Registry", description: "Central module discovery & orchestration", icon: "🗂️" },
  { href: "/super-admin/workflows", label: "Enterprise Workflow Engine", description: "Workflow automation platform", icon: "⚡" },
  ...ENTERPRISE_REGISTRY_PRIMARY_NAV,
  { href: "/super-admin/recovery", label: "Recovery Center", description: "Disaster recovery & continuity", icon: "💾" },
];

export type SuperAdminNavSection = {
  id: string;
  title: string;
  items: SuperAdminNavItem[];
  collapsible?: boolean;
};

/** Descriptor-driven Development Center navigation. */
export function buildDevelopmentNavSection(): SuperAdminNavSection {
  return {
    id: "development",
    title: "Development",
    collapsible: true,
    items: ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.routes.map((route) => ({
      href: route.href,
      label: route.label,
      description: ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.description,
      icon: ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.icon,
    })),
  };
}

export const SUPER_ADMIN_NAV: SuperAdminNavSection[] = [
  {
    id: "mission-control",
    title: "Command Center",
    items: [
      { href: "/super-admin", label: "Dashboard", description: "Enterprise operations dashboard", icon: "🛰️" },
      { href: "/super-admin/users", label: "Users", description: "Accounts & sessions", icon: "👤" },
      { href: "/super-admin/moderation", label: "Marketplace", description: "Marketplace overview", icon: "🛒" },
      { href: "/super-admin/moderation", label: "Listings", description: "Moderation & listings", icon: "🏷️" },
      { href: "/super-admin/orders-engine", label: "Orders", description: "Enterprise order lifecycle", icon: "📋" },
      { href: "/super-admin/payments-engine", label: "Payments", description: "Payment orchestration", icon: "💳" },
      { href: "/super-admin/shipping-engine", label: "Shipping", description: "Logistics foundation", icon: "🚚" },
      { href: "/super-admin/protection-engine", label: "Buyer Protection", description: "Trust and dispute system", icon: "🛡️" },
      { href: "/super-admin/messages-engine", label: "Messages", description: "Enterprise communication system", icon: "💬" },
      { href: "/super-admin/reviews", label: "Reviews", description: "Product reviews", icon: "⭐" },
      { href: "/super-admin/analytics-engine", label: "Analytics", description: "Business intelligence platform", icon: "📊" },
      { href: "/super-admin/security-engine", label: "Security", description: "Enterprise security and compliance", icon: "🔒" },
      { href: "/super-admin/operations/ai", label: "AI Center", description: "AI monitoring & repair", icon: "🤖" },
      { href: "/super-admin/omega", label: "Omega", description: "OMEGA command center", icon: "🟡" },
      { href: "/super-admin/ai/sentinel", label: "Sentinel", description: "Sentinel security engine", icon: "🛡️" },
      { href: "/super-admin/visitors", label: "Marketplace Health", description: "Live visitor intelligence", icon: "💚" },
      { href: "/super-admin/monitoring", label: "Performance", description: "Platform performance", icon: "⚡" },
      { href: "/super-admin/monitoring", label: "Servers", description: "Infra & cron", icon: "🖥️" },
      { href: "/super-admin/database", label: "Database", description: "Database command center", icon: "🗄️" },
      { href: "/super-admin/platform", label: "System", description: "Feature flags & maintenance", icon: "⚙️" },
      { href: "/super-admin/integrations-engine", label: "Integrations", description: "External services platform", icon: "🔌" },
      { href: "/super-admin/assets", label: "Brand Center", description: "Digital asset operating system", icon: "✨" },
      { href: "/super-admin/theme-manager", label: "Theme Manager", description: "Publish and rollback themes", icon: "🎨" },
      { href: "/super-admin/mission-control-engine", label: "Banner Studio", description: "Banner manager configuration", icon: "🖼️" },
      { href: "/super-admin/homepage-builder", label: "Homepage Builder", description: "Homepage configuration", icon: "🏠" },
      { href: "/super-admin/platform", label: "Settings", description: "Platform settings", icon: "⚙️" },
      { href: "/super-admin/audit", label: "Audit Logs", description: "Audit & compliance", icon: "📋" },
      { href: "/super-admin/homepage-builder", label: "Homepage Builder", description: "Visual homepage editor", icon: "🏠" },
      { href: "/super-admin/banners", label: "Banner Manager", description: "Hero slider campaigns", icon: "🖼️" },
      { href: "/super-admin/premium-design", label: "Premium Asset Manager", description: "Photography pipeline", icon: "✨" },
      { href: "/super-admin/features", label: "Feature Manager", description: "Module rollout", icon: "🧩" },
      { href: "/super-admin/ai-manager", label: "AI Manager", description: "Global & feature AI", icon: "🤖" },
      { href: "/super-admin/developer", label: "Developer Tools", description: "Cache, assets, health", icon: "🛠️" },
      { href: "/super-admin/quick-listing", label: "Quick Listing", description: "Admin publish", icon: "⚡" },
    ],
  },
  buildDevelopmentNavSection(),
  {
    id: "command",
    title: "Command",
    items: [
      { href: "/super-admin", label: "Dashboard", description: "Mission Control home", icon: "📊" },
      { href: "/super-admin/command", label: "Command Centre", description: "Quick actions", icon: "⚡" },
      { href: "/super-admin/search", label: "Global Search", description: "Search everything", icon: "🔍" },
      { href: "/super-admin/activity", label: "Activity Timeline", description: "Recent audit events", icon: "🕒" },
    ],
  },
  {
    id: "people",
    title: "People & Trust",
    items: [
      { href: "/super-admin/users", label: "Users", description: "Accounts & sessions", icon: "👤" },
      { href: "/super-admin/staff", label: "Staff Profile", description: "Personnel, roles & activity audit", icon: "🪪" },
      { href: "/staff", label: "Staff Enterprise", description: "Staff platform portal", icon: "📱" },
      { href: "/super-admin/businesses", label: "Businesses", description: "B2B accounts", icon: "🏢" },
      { href: "/super-admin/verification", label: "Verification", description: "Identity queue", icon: "✅" },
      { href: "/super-admin/trust", label: "Trust Centre", description: "Scores & adjustments", icon: "🛡️" },
      { href: "/super-admin/fraud", label: "Fraud", description: "Risk & scam reports", icon: "🚨" },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    items: [
      { href: "/super-admin/moderation", label: "Listings", description: "Moderation & approvals", icon: "🏷️" },
      { href: "/super-admin/category-management", label: "Categories", description: "Taxonomy tree", icon: "📁" },
      { href: "/super-admin/orders-engine", label: "Orders", description: "Order management engine", icon: "📦" },
      { href: "/super-admin/featured", label: "Featured", description: "Featured placements", icon: "⭐" },
      { href: "/super-admin/bumps", label: "Bumps", description: "Bump promotions", icon: "📈" },
      { href: "/super-admin/promotions", label: "Promotions", description: "Campaign overview", icon: "📣" },
      { href: "/super-admin/coupons", label: "Coupons", description: "Discount codes", icon: "🎟️" },
      { href: "/super-admin/reviews", label: "Reviews", description: "Product reviews", icon: "💬" },
      { href: "/super-admin/auctions", label: "Auctions", description: "Live auctions & subscribers", icon: "🔨" },
    ],
  },
  {
    id: "money",
    title: "Payments & Revenue",
    items: [
      { href: "/super-admin/payments-engine", label: "Payments", description: "Payments engine", icon: "💳" },
      { href: "/super-admin/revenue", label: "Revenue", description: "Platform revenue", icon: "💰" },
      { href: "/super-admin/wallet", label: "Wallet", description: "Balances & withdrawals", icon: "👛" },
      { href: "/super-admin/subscriptions", label: "Subscriptions", description: "Plans & billing", icon: "📦" },
      { href: "/super-admin/grants", label: "Free Benefits", description: "Manual grants", icon: "🎁" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      { href: "/super-admin/reports", label: "Reports", description: "Moderation queue", icon: "🚩" },
      { href: "/super-admin/moderation", label: "Moderation", description: "Content moderation", icon: "🧹" },
      { href: "/super-admin/analytics", label: "Analytics", description: "Platform metrics", icon: "📈" },
      { href: "/super-admin/support", label: "Support", description: "Help centre ops", icon: "🎧" },
      { href: "/super-admin/notifications", label: "Notifications", description: "Broadcast messages", icon: "🔔" },
      { href: "/super-admin/email", label: "Email Centre", description: "Outbound email", icon: "✉️" },
      { href: "/super-admin/monitoring", label: "System Health", description: "Infra & cron", icon: "💚" },
      { href: "/super-admin/database", label: "Database", description: "Migrations, tables, storage", icon: "🗄️" },
      { href: "/super-admin/production-assets", label: "Production Asset Validator", description: "Premium asset QA", icon: "🖼️" },
  { href: "/super-admin/premium-design", label: "Premium Asset Manager", description: "Design system assets", icon: "✨" },
      { href: "/super-admin/operations", label: "Operations Center", description: "NOC & live monitoring", icon: "🛰️" },
      { href: "/super-admin/operations/ai", label: "AI Operations Center", description: "AI monitoring & repair", icon: "🤖" },
      { href: "/super-admin/visitors", label: "Live Visitors", description: "Online users", icon: "👁️" },
      { href: "/super-admin/recovery", label: "Recovery Center", description: "Disaster recovery & continuity", icon: "💾" },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    items: [
      { href: "/super-admin/mobile-distribution", label: "Super Admin Mobile", description: "Enterprise mobile administration app", icon: "📱" },
      { href: "/super-admin/mobile/omega", label: "OMEGA Enterprise", description: "Enterprise command center", icon: "🟡" },
      { href: "/super-admin/mobile/omega/executive-command", label: "Executive Command", description: "ORI executive intelligence dashboard", icon: "🚀" },
  { href: "/super-admin/mobile/incidents", label: "Incident Command Center", description: "Notifications & incident command", icon: "🚨" },
  { href: "/super-admin/incidents/timeline", label: "Incident Timeline", description: "Chronological audit-ready incident history", icon: "🕒" },
  { href: "/super-admin/compliance", label: "Audit Readiness & Certification", description: "Audit readiness & certification intelligence", icon: "🏆" },
      { href: "/super-admin/mobile-distribution/devices", label: "Device Lifecycle Manager", description: "Device registration, trust & security", icon: "📱" },
      { href: "/super-admin/developer", label: "Developer Tools", description: "Cache, assets, health", icon: "🛠️" },
      { href: "/super-admin/command", label: "Command Centre", description: "Quick actions", icon: "⚡" },
    ],
  },
  {
    id: "platform",
    title: "Platform Control",
    items: [
      { href: "/super-admin/platform", label: "Settings", description: "Maintenance & features", icon: "⚙️" },
      { href: "/super-admin/seo", label: "SEO", description: "Search optimisation", icon: "🌐" },
      { href: "/super-admin/security", label: "Security", description: "Audit & sessions", icon: "🔐" },
      { href: "/super-admin/audit", label: "Audit & Compliance", description: "Production certification", icon: "📋" },
      { href: "/super-admin/certification", label: "Certification Center", description: "Production release gate", icon: "🏆" },
      { href: "/super-admin/mobile-distribution", label: "Super Admin Mobile", description: "Enterprise mobile administration app", icon: "📱" },
      { href: "/super-admin/mobile/omega", label: "OMEGA Enterprise", description: "Enterprise command center", icon: "🟡" },
      { href: "/super-admin/mobile/omega/executive-command", label: "Executive Command", description: "ORI executive intelligence dashboard", icon: "🚀" },
  { href: "/super-admin/mobile/incidents", label: "Incident Command Center", description: "Notifications & incident command", icon: "🚨" },
  { href: "/super-admin/incidents/timeline", label: "Incident Timeline", description: "Chronological audit-ready incident history", icon: "🕒" },
  { href: "/super-admin/compliance", label: "Audit Readiness & Certification", description: "Audit readiness & certification intelligence", icon: "🏆" },
      { href: "/super-admin/mobile-distribution/devices", label: "Device Lifecycle Manager", description: "Device registration, trust & security", icon: "📱" },
      { href: "/super-admin/audit/logs", label: "Audit Logs", description: "Full action history", icon: "📝" },
    ],
  },
];

export const SUPER_ADMIN_QUICK_LINKS = SUPER_ADMIN_NAV.flatMap((section) => section.items);

import type { MissionControlEngineSection, MissionControlQuickAction } from "@/lib/mission-control-engine/types";

export const MISSION_CONTROL_ENGINE_SECTIONS: MissionControlEngineSection[] = [
  { id: "dashboard", label: "Dashboard", icon: "🛰️", description: "Enterprise command center", href: "/super-admin", group: "operations" },
  { id: "homepage-builder", label: "Homepage Builder", icon: "🏠", description: "Visual homepage editor", href: "/super-admin/homepage-builder", group: "visual" },
  { id: "theme-studio", label: "Theme Studio Pro", icon: "🎨", description: "Visual platform designer", href: "/super-admin/theme-studio", group: "visual" },
  { id: "platform-studio", label: "Platform Studio", icon: "🧩", description: "No-code configuration", href: "/super-admin/platform-studio", group: "visual" },
  { id: "menu-builder", label: "Menu Builder", icon: "🧭", description: "Dynamic navigation", href: "/super-admin/menu-builder", group: "visual" },
  { id: "header-builder", label: "Header Builder", icon: "📐", description: "Header layout and branding", href: "/super-admin/theme-studio", group: "visual" },
  { id: "footer-builder", label: "Footer Builder", icon: "📄", description: "Footer links and layout", href: "/super-admin/theme-studio", group: "visual" },
  { id: "bottom-nav-builder", label: "Bottom Navigation", icon: "📱", description: "Mobile bottom navigation", href: "/super-admin/homepage-builder", group: "visual" },
  { id: "category-builder", label: "Category Builder", icon: "📁", description: "Taxonomy and icons", href: "/super-admin/category-management", group: "visual" },
  { id: "banner-builder", label: "Banner Builder", icon: "🖼️", description: "Hero and promo banners", href: "/super-admin/banners", group: "visual" },
  { id: "search-builder", label: "Search Builder", icon: "🔍", description: "Search configuration", href: "/super-admin/search-engine", group: "visual" },
  { id: "listing-builder", label: "Listing Builder", icon: "🏷️", description: "Listing management", href: "/super-admin/listings", group: "commerce" },
  { id: "asset-library", label: "Asset Library", icon: "✨", description: "Premium production assets", href: "/super-admin/assets", group: "visual" },
  { id: "visual-cms", label: "Visual CMS", icon: "🎨", description: "Enterprise visual design platform", href: "/super-admin/visual-cms", group: "visual" },
  { id: "asset-manager", label: "Asset Manager", icon: "✨", description: "Digital asset operating system", href: "/super-admin/assets", group: "visual" },
  { id: "operations-center", label: "Operations Center", icon: "🛰️", description: "Enterprise NOC and live monitoring", href: "/super-admin/operations", group: "operations" },
  { id: "ai-center", label: "AI Center", icon: "🤖", description: "AI orchestration platform", href: "/super-admin/ai-engine", group: "enterprise" },
  { id: "analytics-center", label: "Analytics Center", icon: "📊", description: "Business intelligence", href: "/super-admin/analytics-engine", group: "enterprise" },
  { id: "orders-center", label: "Orders Center", icon: "📦", description: "Order lifecycle engine", href: "/super-admin/orders-engine", group: "commerce" },
  { id: "shipping-center", label: "Shipping Center", icon: "🚚", description: "Logistics foundation", href: "/super-admin/shipping-engine", group: "commerce" },
  { id: "wallet-center", label: "Wallet Center", icon: "💰", description: "Digital wallet system", href: "/super-admin/wallet-engine", group: "commerce" },
  { id: "payments-center", label: "Payments Center", icon: "💳", description: "Payment orchestration", href: "/super-admin/payments-engine", group: "commerce" },
  { id: "protection-center", label: "Buyer Protection Center", icon: "🛡️", description: "Trust and disputes", href: "/super-admin/protection-engine", group: "commerce" },
  { id: "messages-center", label: "Messages Center", icon: "💬", description: "Communication platform", href: "/super-admin/messages-engine", group: "enterprise" },
  { id: "notifications-center", label: "Notifications Center", icon: "🔔", description: "Event delivery platform", href: "/super-admin/notifications-engine", group: "enterprise" },
  { id: "security-center", label: "Security Center", icon: "🔒", description: "Security and compliance", href: "/super-admin/security-engine", group: "enterprise" },
  { id: "search-engine-center", label: "Search Engine Center", icon: "🔎", description: "Discovery platform", href: "/super-admin/search-engine", group: "enterprise" },
  { id: "integrations-center", label: "Integrations Center", icon: "🔌", description: "External services platform", href: "/super-admin/integrations-engine", group: "enterprise" },
  { id: "infrastructure-center", label: "Infrastructure Center", icon: "🏗️", description: "System health and infra", href: "/super-admin/monitoring", group: "operations" },
  { id: "operations-center", label: "Operations Center", icon: "🛰️", description: "Enterprise NOC and live monitoring", href: "/super-admin/operations", group: "operations" },
  { id: "recovery-center", label: "Recovery Center", icon: "💾", description: "Disaster recovery and business continuity", href: "/super-admin/recovery", group: "operations" },
  { id: "audit-compliance-center", label: "Audit & Compliance Center", icon: "📋", description: "Production certification system", href: "/super-admin/audit", group: "operations" },
  { id: "certification-center", label: "Certification Center", icon: "🏆", description: "Production release gate and certification platform", href: "/super-admin/certification", group: "operations" },
  { id: "mobile-distribution-center", label: "Mobile Distribution Center", icon: "📱", description: "Super Admin Mobile installation hub", href: "/super-admin/mobile-distribution", group: "operations" },
  { id: "device-lifecycle-manager", label: "Device Lifecycle Manager", icon: "📱", description: "Device trust, security, and remote administration", href: "/super-admin/mobile-distribution/devices", group: "operations" },
  { id: "omega-enterprise-mobile", label: "OMEGA Enterprise", icon: "🟡", description: "Enterprise command center", href: "/super-admin/mobile/omega", group: "operations" },
  { id: "incident-command-center", label: "Incident Command Center", icon: "🚨", description: "Notification and incident command", href: "/super-admin/mobile/incidents", group: "operations" },
  { id: "incident-response-center", label: "Incident Response Center", icon: "🚨", description: "Enterprise incident management and emergency operations", href: "/super-admin/incidents", group: "operations" },
  { id: "enterprise-security-operations-center", label: "Security Operations Center", icon: "🛡️", description: "Enterprise cyber security and threat response", href: "/super-admin/security", group: "operations" },
  { id: "enterprise-business-intelligence", label: "Business Intelligence Center", icon: "📊", description: "Executive analytics and AI forecasting", href: "/super-admin/business-intelligence", group: "enterprise" },
  { id: "enterprise-automation-hub", label: "Enterprise Automation Hub", icon: "🤖", description: "Workflow automation, rule engine, and AI automation", href: "/super-admin/automation", group: "enterprise" },
  { id: "omega-command-center", label: "OMEGA Command Center", icon: "🟡", description: "Unified Enterprise AI orchestration platform", href: "/super-admin/omega", group: "enterprise" },
  { id: "omega-quality-assurance-center", label: "OMEGA Quality Assurance Center", icon: "🔬", description: "Autonomous platform validation and certification authority", href: "/super-admin/quality-assurance", group: "enterprise" },
  { id: "omega-development-director", label: "OMEGA Development Director", icon: "🎯", description: "Autonomous Enterprise Development Director — analyzes and coordinates without modifying production", href: "/super-admin/development-director", group: "enterprise" },
  { id: "enterprise-observability-center", label: "Enterprise Observability Center", icon: "📡", description: "Enterprise Monitoring Platform — real-time health, telemetry, and diagnostics", href: "/super-admin/observability", group: "operations" },
  { id: "enterprise-e2e-validation-engine", label: "Enterprise E2E Validation Engine", icon: "✅", description: "Final functional validation — every screen, workflow, API, and business rule", href: "/super-admin/e2e-validation", group: "enterprise" },
  { id: "enterprise-autonomous-execution-engine", label: "Enterprise Autonomous Execution Engine", icon: "⚙️", description: "Enterprise Workflow Orchestrator — coordinates modules through approved workflows", href: "/super-admin/autonomous-execution", group: "enterprise" },
  { id: "homepage-enterprise-certification-engine", label: "Homepage Enterprise Certification", icon: "🏠", description: "First Production Certified Homepage — PASS 100% reference implementation", href: "/super-admin/homepage-certification", group: "enterprise" },
  { id: "omega-global-ui-integrity-engine", label: "OMEGA Global UI Integrity", icon: "🔮", description: "Enterprise Visual Intelligence — validates every ROVEXO screen at Global Integrity PASS 100%", href: "/super-admin/global-ui-integrity", group: "enterprise" },
  { id: "enterprise-launch-readiness-engine", label: "Enterprise Launch Readiness", icon: "🚀", description: "Final operational readiness layer — infrastructure, operations and launch gate before production", href: "/super-admin/launch-readiness", group: "enterprise" },
  { id: "enterprise-marketplace-completion-engine", label: "Marketplace Completion", icon: "🏪", description: "Permanent Marketplace Completion Authority — PASS 100% across all modules", href: "/super-admin/marketplace-completion", group: "enterprise" },
  { id: "enterprise-category-management-center", label: "Enterprise Category Management Center", icon: "📁", description: "Master taxonomy platform — Premium 2026 Enterprise interface", href: "/super-admin/category-management", group: "enterprise" },
  { id: "enterprise-governance-center", label: "Enterprise Governance Center", icon: "⚖️", description: "Constitution, architecture governance, and certification", href: "/super-admin/governance", group: "enterprise" },
  { id: "enterprise-development-center", label: "Enterprise Development Center", icon: "🛠️", description: "Architecture studio, DevSecOps, and release pipeline", href: "/super-admin/development", group: "enterprise" },
  { id: "incident-timeline", label: "Incident Timeline", icon: "🕒", description: "Chronological audit-ready incident history", href: "/super-admin/incidents/timeline", group: "operations" },
  { id: "enterprise-compliance-center", label: "Audit & Compliance Center", icon: "📋", description: "Enterprise audit, compliance and certification", href: "/super-admin/compliance", group: "operations" },
  { id: "enterprise-module-registry-v2", label: "Enterprise Module Registry", icon: "🗂️", description: "Central registry for enterprise module discovery", href: "/super-admin/module-registry", group: "enterprise" },
  { id: "developer-center", label: "Developer Center", icon: "🛠️", description: "Build and deploy tools", href: "/super-admin/developer", group: "operations" },
  { id: "system-settings", label: "System Settings", icon: "⚙️", description: "Platform configuration", href: "/super-admin/platform", group: "operations" },
];

export const MISSION_CONTROL_ENGINE_SECTION_IDS = MISSION_CONTROL_ENGINE_SECTIONS.map((s) => ({
  id: s.id,
  label: s.label,
}));

export const MISSION_CONTROL_QUICK_ACTIONS: MissionControlQuickAction[] = [
  { id: "create-listing", label: "Create Listing", icon: "➕", href: "/super-admin/quick-listing" },
  { id: "homepage", label: "Homepage", icon: "🏠", href: "/super-admin/homepage-builder" },
  { id: "theme", label: "Publish Theme", icon: "🎨", href: "/super-admin/theme-studio" },
  { id: "developer", label: "Developer", icon: "🛠️", href: "/super-admin/developer" },
  { id: "recovery", label: "Recovery", icon: "💾", href: "/super-admin/recovery" },
  { id: "analytics", label: "Analytics", icon: "📊", href: "/super-admin/analytics-engine" },
  { id: "security", label: "Security", icon: "🔒", href: "/super-admin/security-engine" },
  { id: "search", label: "Search", icon: "🔍", href: "/super-admin/search-engine" },
  { id: "ai", label: "AI", icon: "🤖", href: "/super-admin/ai-engine" },
  { id: "payments", label: "Payments", icon: "💳", href: "/super-admin/payments-engine" },
  { id: "orders", label: "Orders", icon: "📦", href: "/super-admin/orders-engine" },
  { id: "wallet", label: "Wallet", icon: "💰", href: "/super-admin/wallet-engine" },
  { id: "shipping", label: "Shipping", icon: "🚚", href: "/super-admin/shipping-engine" },
  { id: "messages", label: "Messages", icon: "💬", href: "/super-admin/messages-engine" },
  { id: "notifications", label: "Notifications", icon: "🔔", href: "/super-admin/notifications-engine" },
  { id: "integrations", label: "Integrations", icon: "🔌", href: "/super-admin/integrations-engine" },
  { id: "infrastructure", label: "Infrastructure", icon: "🏗️", href: "/super-admin/monitoring" },
  { id: "global-search", label: "Global Search", icon: "🔎", href: "/super-admin/search" },
];

export function registerMissionControlEngineSection(section: MissionControlEngineSection): MissionControlEngineSection[] {
  const index = MISSION_CONTROL_ENGINE_SECTIONS.findIndex((item) => item.id === section.id);
  if (index >= 0) {
    const next = [...MISSION_CONTROL_ENGINE_SECTIONS];
    next[index] = section;
    return next;
  }
  return [...MISSION_CONTROL_ENGINE_SECTIONS, section];
}

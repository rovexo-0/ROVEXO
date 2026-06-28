import { ENTERPRISE_CORE_REGISTRY, ENTERPRISE_CORE_SETTING_GROUPS } from "@/lib/enterprise-core/registry";
import type { EnterpriseCoreSearchResult } from "@/lib/enterprise-core/types";
import { runSuperAdminGlobalSearch } from "@/lib/super-admin/search";

function searchAdminRegistry(query: string): EnterpriseCoreSearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const results: EnterpriseCoreSearchResult[] = [];

  for (const module of ENTERPRISE_CORE_REGISTRY) {
    if (
      module.label.toLowerCase().includes(trimmed) ||
      module.description.toLowerCase().includes(trimmed) ||
      module.id.includes(trimmed)
    ) {
      results.push({
        id: `module-${module.id}`,
        category: "settings",
        title: module.label,
        subtitle: module.description,
        href: module.href,
      });
    }
  }

  for (const group of ENTERPRISE_CORE_SETTING_GROUPS) {
    if (group.label.toLowerCase().includes(trimmed) || group.module.includes(trimmed)) {
      results.push({
        id: `setting-${group.id}`,
        category: "settings",
        title: `${group.label} Settings`,
        subtitle: group.keys.join(", ") || "Configuration panel",
        href: group.href,
      });
    }
  }

  const adminLinks: { id: string; category: EnterpriseCoreSearchResult["category"]; title: string; subtitle: string; href: string; terms: string[] }[] = [
    { id: "themes", category: "themes", title: "Theme Studio Pro", subtitle: "Visual platform designer", href: "/super-admin/theme-studio", terms: ["theme", "design", "visual"] },
    { id: "forms", category: "forms", title: "Platform Studio Forms", subtitle: "Form builder", href: "/super-admin/platform-studio", terms: ["form", "field"] },
    { id: "workflows", category: "workflows", title: "Platform Studio Workflows", subtitle: "Workflow builder", href: "/super-admin/platform-studio", terms: ["workflow", "automation"] },
    { id: "audit", category: "audit", title: "Audit & Compliance Center", subtitle: "Production certification and compliance validation", href: "/super-admin/audit", terms: ["audit", "compliance", "certification", "gdpr", "soc2", "iso", "security", "performance", "accessibility", "seo", "readiness", "risk"] },
    { id: "certification-center", category: "audit", title: "Certification Center", subtitle: "Production release gate and enterprise certification", href: "/super-admin/certification", terms: ["certification", "production", "release", "approve", "revoke", "certified", "readiness", "scorecard", "validation"] },
    { id: "mobile-distribution", category: "developer", title: "Super Admin Mobile", subtitle: "Enterprise mobile administration app distribution hub", href: "/super-admin/mobile-distribution", terms: ["mobile", "iphone", "android", "download", "install", "qr", "device", "biometric", "omega", "ori", "guardian", "sentinel", "super admin"] },
    { id: "device-lifecycle-manager", category: "developer", title: "Device Lifecycle Manager", subtitle: "Device registration, trust score, security, and remote administration", href: "/super-admin/mobile-distribution/devices", terms: ["device", "lifecycle", "trust", "health", "security", "root", "jailbreak", "tamper", "remote", "lock", "revoke", "certification", "omega", "sentinel", "guardian", "mobile"] },
    { id: "omega-enterprise-mobile", category: "developer", title: "OMEGA Enterprise", subtitle: "Enterprise command center for platform health, security, and certification", href: "/super-admin/mobile/omega", terms: ["omega", "command", "center", "health", "scan", "alert", "guardian", "sentinel", "antivirus", "infrastructure", "performance", "certification", "release", "report", "ori", "gold"] },
    { id: "executive-command", category: "developer", title: "Executive Command Center", subtitle: "ORI executive intelligence and live platform overview", href: "/super-admin/mobile/omega/executive-command", terms: ["executive", "command", "ori", "intelligence", "revenue", "incidents", "business", "dashboard", "report", "ceo"] },
    { id: "incident-command-center", category: "developer", title: "Incident Command Center", subtitle: "Enterprise notification and incident command", href: "/super-admin/mobile/incidents", terms: ["incident", "alert", "notification", "emergency", "critical", "security", "omega", "guardian", "sentinel", "ori"] },
    { id: "incident-timeline", category: "developer", title: "Incident Timeline", subtitle: "Chronological audit-ready incident history", href: "/super-admin/incidents/timeline", terms: ["timeline", "history", "audit", "chronological", "incident", "export", "search", "ori", "omega", "integrity"] },
    { id: "enterprise-compliance-center", category: "developer", title: "Audit Readiness & Certification", subtitle: "Audit readiness and certification intelligence", href: "/super-admin/compliance", terms: ["audit", "readiness", "certification", "pre-audit", "gap", "remediation", "evidence", "compliance", "gdpr", "iso", "soc2", "pci", "omega", "ori"] },
    { id: "enterprise-module-registry-v2", category: "settings", title: "Enterprise Module Registry", subtitle: "Central registry for discovering and orchestrating enterprise modules", href: "/super-admin/module-registry", terms: ["registry", "module", "discovery", "dependency", "health", "feature flag", "version", "publish", "rollback", "enterprise"] },
    { id: "enterprise-workflow-engine", category: "workflows", title: "Enterprise Workflow Engine", subtitle: "Configurable workflow automation platform", href: "/super-admin/workflows", terms: ["workflow", "automation", "approval", "scheduler", "trigger", "builder", "template", "execution"] },
    { id: "homepage-builder-engine", category: "homepage", title: "Enterprise Homepage Builder", subtitle: "Visual CMS Pro v2 homepage operating system", href: "/super-admin/homepage-builder", terms: ["homepage", "builder", "visual", "cms", "section", "publish", "preview", "rollback", "banner", "hero"] },
    { id: "enterprise-ai-operating-system", category: "ai", title: "Enterprise AI Operating System", subtitle: "SCAN Sentinel Omega central AI layer", href: "/super-admin/ai", terms: ["ai", "scan", "sentinel", "omega", "prediction", "repair", "self-healing", "automation", "threat", "incident", "recommendation", "model"] },
    { id: "enterprise-mobile-control-center", category: "developer", title: "Mobile Control Center", subtitle: "Super Admin mobile app builds releases OTA devices push", href: "/super-admin/mobile", terms: ["mobile", "android", "ios", "build", "testflight", "apk", "aab", "ota", "push", "device", "release", "download", "qr"] },
    { id: "enterprise-deployment-center", category: "developer", title: "Deployment Center", subtitle: "Production deployment gateway validate approve deploy rollback", href: "/super-admin/deployment", terms: ["deployment", "release", "staging", "production", "rollback", "canary", "blue-green", "hotfix", "certification", "devops", "environment"] },
    { id: "incident-response-center", category: "developer", title: "Incident Response Center", subtitle: "Enterprise incident management detection response root cause postmortem", href: "/super-admin/incidents", terms: ["incident", "emergency", "critical", "severity", "playbook", "postmortem", "root cause", "escalate", "acknowledge", "resolve", "scan", "sentinel", "omega", "rollback", "recovery"] },
    { id: "enterprise-security-operations-center", category: "permissions", title: "Security Operations Center", subtitle: "Enterprise cyber security threat detection firewall scanner compliance SOC", href: "/super-admin/security", terms: ["soc", "security", "threat", "firewall", "intrusion", "vulnerability", "scanner", "block", "quarantine", "isolate", "session", "device", "mfa", "compliance", "gdpr", "scan", "sentinel", "omega", "brute force", "bot"] },
    { id: "enterprise-business-intelligence", category: "analytics", title: "Business Intelligence Center", subtitle: "Executive analytics KPI engine revenue forecasting marketplace reports", href: "/super-admin/business-intelligence", terms: ["bi", "business intelligence", "kpi", "revenue", "gmv", "forecast", "executive", "dashboard", "analytics", "growth", "conversion", "retention", "marketplace", "report", "scan", "sentinel", "omega"] },
    { id: "enterprise-automation-hub", category: "workflows", title: "Enterprise Automation Hub", subtitle: "Workflow automation rule engine event triggers schedules approvals monitoring", href: "/super-admin/automation", terms: ["automation", "workflow", "rule", "trigger", "schedule", "approval", "publish", "rollback", "run", "pause", "event", "template", "execution", "monitoring", "scan", "sentinel", "omega", "marketplace automation", "buyer", "seller", "payment", "shipping", "security"] },
    { id: "omega-command-center", category: "ai", title: "OMEGA Command Center", subtitle: "Unified AI orchestrator SCAN Sentinel Oracle Phoenix Titan Atlas Guardian enterprise score", href: "/super-admin/omega", terms: ["omega", "orchestrator", "scan", "sentinel", "oracle", "phoenix", "titan", "atlas", "guardian", "enterprise score", "executive report", "auto repair", "deep scan", "quick scan", "ai", "orchestration", "live monitor", "timeline", "recommendation", "deploy", "rollback"] },
    { id: "enterprise-governance-center", category: "audit", title: "Enterprise Governance Center", subtitle: "Constitution architecture compliance certification validation enterprise score technical debt", href: "/super-admin/governance", terms: ["governance", "constitution", "architecture", "compliance", "certification", "validation", "enterprise rules", "technical debt", "enterprise score", "audit", "amendment", "registry", "certify", "scan", "omega", "pass", "fail", "warning"] },
    { id: "enterprise-development-center", category: "developer", title: "Enterprise Development Center", subtitle: "Architecture studio DevSecOps release pipeline dependency graph build center API studio", href: "/super-admin/development", terms: ["development", "devsecops", "architecture", "dependency", "build", "release", "pipeline", "api studio", "database studio", "storage", "bundle", "performance", "technical debt", "code quality", "module explorer", "project explorer", "registry", "validate", "deploy", "omega", "governance", "engineering"] },
    { id: "developer", category: "developer", title: "Developer Center", subtitle: "Build and deploy tools", href: "/super-admin/developer", terms: ["developer", "build", "deploy"] },
    { id: "ai", category: "ai", title: "AI Manager", subtitle: "Global and feature AI", href: "/super-admin/ai-manager", terms: ["ai", "assistant", "machine"] },
    { id: "features", category: "features", title: "Feature Manager", subtitle: "Feature flags and rollout", href: "/super-admin/features", terms: ["feature", "flag", "beta"] },
    { id: "permissions", category: "permissions", title: "Security & Permissions", subtitle: "Roles and access control", href: "/super-admin/security", terms: ["permission", "role", "security"] },
    { id: "homepage", category: "homepage", title: "Homepage Builder", subtitle: "Visual homepage editor", href: "/super-admin/homepage-builder", terms: ["homepage", "home"] },
    { id: "assets", category: "assets", title: "Premium Asset Manager", subtitle: "Production assets", href: "/super-admin/premium-design", terms: ["asset", "image", "photo"] },
    { id: "categories", category: "categories", title: "Categories", subtitle: "Taxonomy management", href: "/super-admin/categories", terms: ["category", "taxonomy"] },
    { id: "protection", category: "protection", title: "Buyer Protection Engine", subtitle: "Trust and dispute system", href: "/super-admin/protection-engine", terms: ["protection", "dispute", "refund", "case"] },
    { id: "messages-engine", category: "messages", title: "Messages Engine", subtitle: "Enterprise communication system", href: "/super-admin/messages-engine", terms: ["messages", "chat", "conversation", "communication"] },
    { id: "notifications-engine", category: "notifications", title: "Notifications Engine", subtitle: "Real-time event delivery platform", href: "/super-admin/notifications-engine", terms: ["notifications", "notification", "alert", "push", "badge"] },
    { id: "analytics-engine", category: "analytics", title: "Analytics Engine", subtitle: "Enterprise business intelligence", href: "/super-admin/analytics-engine", terms: ["analytics", "dashboard", "revenue", "metrics", "reporting"] },
    { id: "security-engine", category: "permissions", title: "Security Engine", subtitle: "Enterprise security and compliance", href: "/super-admin/security-engine", terms: ["security", "authentication", "authorization", "mfa", "2fa", "compliance", "gdpr", "audit", "fraud"] },
    { id: "search-engine", category: "settings", title: "Search Engine", subtitle: "Enterprise search and discovery platform", href: "/super-admin/search-engine", terms: ["search", "discovery", "index", "autocomplete", "filter", "listing", "category", "seller"] },
    { id: "ai-engine", category: "ai", title: "AI Engine", subtitle: "Enterprise AI orchestration and automation", href: "/super-admin/ai-engine", terms: ["ai", "assistant", "automation", "provider", "openai", "ollama", "semantic", "prompt", "orchestration"] },
    { id: "integrations-engine", category: "developer", title: "Integrations Engine", subtitle: "Enterprise external services and API platform", href: "/super-admin/integrations-engine", terms: ["integration", "webhook", "oauth", "stripe", "provider", "api", "secrets", "email", "shipping"] },
    { id: "mission-control-engine", category: "settings", title: "Mission Control Engine", subtitle: "Enterprise command center configuration", href: "/super-admin/mission-control-engine", terms: ["mission", "control", "command", "center", "dashboard", "widgets", "monitoring", "status", "enterprise", "administration"] },
    { id: "visual-cms", category: "themes", title: "Visual CMS", subtitle: "Enterprise visual design platform", href: "/super-admin/visual-cms", terms: ["visual", "cms", "design", "builder", "canvas", "theme", "layout", "homepage", "header", "footer", "asset", "preview", "publish"] },
    { id: "theme-manager", category: "themes", title: "Theme Manager", subtitle: "Draft, preview, publish, and rollback themes", href: "/super-admin/theme-manager", terms: ["theme", "manager", "publish", "rollback", "draft", "preview", "variables"] },
    { id: "asset-manager", category: "assets", title: "Asset Manager", subtitle: "Digital asset operating system", href: "/super-admin/assets", terms: ["asset", "manager", "library", "upload", "brand", "logo", "icon", "photography", "storage", "optimization", "usage"] },
    { id: "operations-center", category: "developer", title: "Operations Center", subtitle: "Enterprise NOC and live platform monitoring", href: "/super-admin/operations", terms: ["operations", "noc", "monitoring", "health", "alerts", "incidents", "maintenance", "recovery", "logs", "system", "dashboard", "live", "status"] },
    { id: "recovery-center", category: "developer", title: "Recovery Center", subtitle: "Disaster recovery and business continuity", href: "/super-admin/recovery", terms: ["recovery", "backup", "restore", "rollback", "safe mode", "disaster", "continuity", "rto", "rpo", "integrity", "failover"] },
    { id: "payments-engine", category: "payments", title: "Payments Engine", subtitle: "Enterprise payment processing", href: "/super-admin/payments-engine", terms: ["payments", "payment", "stripe", "refund", "checkout"] },
    { id: "wallet", category: "wallet", title: "Wallet Engine", subtitle: "Enterprise digital wallet system", href: "/super-admin/wallet-engine", terms: ["wallet", "balance", "payout", "withdrawal"] },
    { id: "shipping", category: "shipping", title: "Shipping Engine", subtitle: "Logistics foundation", href: "/super-admin/shipping-engine", terms: ["shipping", "fulfillment", "tracking", "delivery"] },
    { id: "orders-engine", category: "orders", title: "Orders Engine", subtitle: "Enterprise order lifecycle", href: "/super-admin/orders-engine", terms: ["orders", "order", "lifecycle", "transaction"] },
    { id: "support", category: "support", title: "Support", subtitle: "Help centre operations", href: "/super-admin/support", terms: ["support", "ticket", "help"] },
    { id: "reviews", category: "reviews", title: "Reviews", subtitle: "Product review moderation", href: "/super-admin/reviews", terms: ["review", "rating"] },
    { id: "notifications", category: "notifications", title: "Notifications", subtitle: "Broadcast centre", href: "/super-admin/notifications", terms: ["notification", "alert"] },
  ];

  for (const link of adminLinks) {
    if (link.terms.some((term) => term.includes(trimmed) || trimmed.includes(term)) || link.title.toLowerCase().includes(trimmed)) {
      results.push({
        id: link.id,
        category: link.category,
        title: link.title,
        subtitle: link.subtitle,
        href: link.href,
      });
    }
  }

  return results;
}

const CATEGORY_MAP: Record<string, EnterpriseCoreSearchResult["category"]> = {
  user: "users",
  listing: "listings",
  business: "businesses",
  order: "orders",
  report: "reports",
  message: "messages",
};

export function searchEnterpriseCoreAdminRegistry(query: string): EnterpriseCoreSearchResult[] {
  return searchAdminRegistry(query);
}

export async function runEnterpriseCoreAdminSearch(query: string): Promise<EnterpriseCoreSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const [platformResults, adminResults] = await Promise.all([
    runSuperAdminGlobalSearch(trimmed),
    Promise.resolve(searchAdminRegistry(trimmed)),
  ]);

  const mapped: EnterpriseCoreSearchResult[] = platformResults.map((result) => ({
    id: `${result.type}-${result.id}`,
    category: CATEGORY_MAP[result.type] ?? "settings",
    title: result.title,
    subtitle: result.subtitle,
    href: result.href,
  }));

  const combined = [...mapped, ...adminResults];
  const seen = new Set<string>();
  return combined.filter((item) => {
    const key = `${item.category}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

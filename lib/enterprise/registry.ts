/**
 * Enterprise module registry — new features register here for automatic
 * integration with Trust, Help, AI, Business, Monetization, Analytics, and Admin.
 */

export type EnterpriseModuleId =
  | "trust"
  | "help"
  | "ai-assistant"
  | "business"
  | "wholesale"
  | "monetization"
  | "analytics"
  | "admin";

export type EnterpriseModule = {
  id: EnterpriseModuleId;
  name: string;
  description: string;
  userRoutes: string[];
  adminRoutes: string[];
  apiPrefixes: string[];
};

export const ENTERPRISE_MODULES: EnterpriseModule[] = [
  {
    id: "trust",
    name: "Trust Center",
    description: "Trust scores, verification, protection, disputes, and safety",
    userRoutes: ["/trust", "/resolution"],
    adminRoutes: ["/admin/trust"],
    apiPrefixes: ["/api/trust"],
  },
  {
    id: "help",
    name: "Help Center",
    description: "Interactive help, decision trees, and support gating",
    userRoutes: ["/help", "/support"],
    adminRoutes: ["/admin/help"],
    apiPrefixes: ["/api/help"],
  },
  {
    id: "ai-assistant",
    name: "AI Marketplace Assistant",
    description: "Context-aware assistant for buyers, sellers, and businesses",
    userRoutes: ["/assistant"],
    adminRoutes: ["/admin/analytics"],
    apiPrefixes: ["/api/assistant"],
  },
  {
    id: "business",
    name: "Business Center",
    description: "Business sellers, company profiles, and B2B tools",
    userRoutes: ["/business", "/store"],
    adminRoutes: ["/admin/business"],
    apiPrefixes: ["/api/business"],
  },
  {
    id: "wholesale",
    name: "Wholesale Center",
    description: "MOQ, bulk pricing, RFQ, and verified suppliers",
    userRoutes: ["/wholesale"],
    adminRoutes: ["/admin/wholesale"],
    apiPrefixes: ["/api/wholesale"],
  },
  {
    id: "monetization",
    name: "Monetization Engine",
    description: "Subscriptions, promotions, badges, and premium features",
    userRoutes: ["/seller/wallet", "/plans"],
    adminRoutes: ["/admin/monetization", "/admin/promotions"],
    apiPrefixes: ["/api/monetization", "/api/promotions"],
  },
  {
    id: "analytics",
    name: "Platform Analytics",
    description: "Marketplace, revenue, trust, and AI analytics",
    userRoutes: ["/seller/analytics", "/business/analytics"],
    adminRoutes: ["/admin/analytics"],
    apiPrefixes: ["/api/analytics", "/api/platform-analytics"],
  },
  {
    id: "admin",
    name: "Admin Center",
    description: "Operations, verifications, appeals, and permissions",
    userRoutes: [],
    adminRoutes: ["/admin"],
    apiPrefixes: ["/api/admin"],
  },
];

export function getEnterpriseModule(id: EnterpriseModuleId): EnterpriseModule | undefined {
  return ENTERPRISE_MODULES.find((module) => module.id === id);
}

export function listEnterpriseModules(): EnterpriseModule[] {
  return ENTERPRISE_MODULES;
}

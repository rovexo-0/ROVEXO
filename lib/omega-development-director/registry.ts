export const OMEGA_DEV_DIRECTOR_ROUTES = [
  { id: "dashboard", label: "Development Board", href: "/super-admin/development-director" },
  { id: "analysis", label: "Code Analysis", href: "/super-admin/development-director/analysis" },
  { id: "discovery", label: "Discovery", href: "/super-admin/development-director/discovery" },
  { id: "status", label: "Implementation Status", href: "/super-admin/development-director/status" },
  { id: "roadmap", label: "Roadmap", href: "/super-admin/development-director/roadmap" },
  { id: "dependencies", label: "Dependencies", href: "/super-admin/development-director/dependencies" },
  { id: "pipeline", label: "Quality Pipeline", href: "/super-admin/development-director/pipeline" },
  { id: "repair", label: "Safe Repair", href: "/super-admin/development-director/repair" },
  { id: "insights", label: "Insights", href: "/super-admin/development-director/insights" },
  { id: "coordination", label: "Coordination", href: "/super-admin/development-director/coordination" },
  { id: "reports", label: "Reports", href: "/super-admin/development-director/reports" },
] as const;

export const CODE_ANALYSIS_DOMAINS = [
  "codebase",
  "routes",
  "components",
  "layouts",
  "api-endpoints",
  "database-layer",
  "enterprise-modules",
  "super-admin",
  "buyer",
  "seller",
  "company",
  "homepage",
  "categories",
  "listing-flow",
  "checkout",
  "orders",
  "wallet",
  "shipping",
  "messaging",
  "notifications",
  "search",
  "seo",
  "performance",
  "security",
  "accessibility",
] as const;

export const DISCOVERY_CATEGORIES = [
  "missing-modules",
  "missing-pages",
  "missing-buttons",
  "missing-redirects",
  "broken-navigation",
  "duplicate-code",
  "dead-code",
  "unused-css",
  "unused-components",
  "incomplete-workflows",
  "incomplete-apis",
  "missing-tests",
  "missing-validations",
  "missing-translations",
  "performance-bottlenecks",
  "security-risks",
  "accessibility-issues",
] as const;

export const IMPLEMENTATION_STAGES = [
  "not-started",
  "planning",
  "architecture-ready",
  "development",
  "testing",
  "qa",
  "omega-validation",
  "governance-validation",
  "security-validation",
  "certification-ready",
  "production-ready",
  "released",
] as const;

export const ROADMAP_PRIORITIES = ["critical", "high", "medium", "low", "future"] as const;

export const QUALITY_PIPELINE_STAGES = [
  "development",
  "qa-center",
  "security-center",
  "governance-center",
  "certification-engine",
  "deployment-center",
  "production",
] as const;

export const REPAIR_STAGES = [
  "analyze",
  "identify-root-cause",
  "generate-proposal",
  "regression-analysis",
  "qa",
  "security",
  "governance",
  "certification",
  "ready-for-review",
] as const;

export const INSIGHT_CATEGORIES = [
  "architecture",
  "refactoring",
  "performance",
  "security",
  "database",
  "ux",
  "accessibility",
  "seo",
  "maintainability",
  "scalability",
] as const;

export const BOARD_METRICS = [
  "development-progress",
  "platform-completion",
  "technical-debt",
  "enterprise-score",
  "architecture-health",
  "module-health",
  "certification-progress",
  "qa-progress",
  "performance-progress",
  "security-progress",
  "accessibility-progress",
  "deployment-readiness",
] as const;

export const EXPORT_FORMATS = ["pdf", "excel", "csv", "json"] as const;

export const OMEGA_DEV_DIRECTOR_API = {
  snapshot: "/api/super-admin/development-director",
  action: "/api/super-admin/development-director/action",
  analyze: "/api/super-admin/development-director/analyze",
  discover: "/api/super-admin/development-director/discover",
  prioritize: "/api/super-admin/development-director/prioritize",
  repair: "/api/super-admin/development-director/repair",
  export: "/api/super-admin/development-director/export",
  v1Snapshot: "/api/v1/super-admin/development-director",
} as const;

export const PROTECTED_AREAS = [
  "payments",
  "wallet",
  "checkout",
  "authentication",
  "marketplace-business-logic",
  "orders",
  "shipping",
  "buyer-workflows",
  "seller-workflows",
  "company-workflows",
  "production-database",
  "deployment-pipeline",
] as const;

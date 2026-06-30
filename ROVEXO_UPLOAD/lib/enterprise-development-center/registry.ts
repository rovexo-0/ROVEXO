export const ENTERPRISE_DEVELOPMENT_ROUTES = [
  { id: "dashboard", label: "Dashboard", href: "/super-admin/development" },
  { id: "project-explorer", label: "Project Explorer", href: "/super-admin/development/project-explorer" },
  { id: "module-explorer", label: "Module Explorer", href: "/super-admin/development/module-explorer" },
  { id: "architecture-studio", label: "Architecture Studio", href: "/super-admin/development/architecture-studio" },
  { id: "api-studio", label: "API Studio", href: "/super-admin/development/api-studio" },
  { id: "database-studio", label: "Database Studio", href: "/super-admin/development/database-studio" },
  { id: "storage-studio", label: "Storage Studio", href: "/super-admin/development/storage-studio" },
  { id: "devsecops", label: "DevSecOps", href: "/super-admin/development/devsecops" },
  { id: "build-center", label: "Build Center", href: "/super-admin/development/build-center" },
  { id: "release-pipeline", label: "Release Pipeline", href: "/super-admin/development/release-pipeline" },
  { id: "registry-explorer", label: "Registry Explorer", href: "/super-admin/development/registry-explorer" },
  { id: "environment-center", label: "Environment Center", href: "/super-admin/development/environment-center" },
  { id: "ai-integration", label: "AI Integration", href: "/super-admin/development/ai-integration" },
  { id: "technical-debt", label: "Technical Debt", href: "/super-admin/development/technical-debt" },
  { id: "dependency-graph", label: "Dependency Graph", href: "/super-admin/development/dependency-graph" },
  { id: "bundle-analyzer", label: "Bundle Analyzer", href: "/super-admin/development/bundle-analyzer" },
  { id: "performance", label: "Performance", href: "/super-admin/development/performance" },
  { id: "documentation", label: "Documentation", href: "/super-admin/development/documentation" },
  { id: "search", label: "Search", href: "/super-admin/development/search" },
  { id: "settings", label: "Settings", href: "/super-admin/development/settings" },
] as const;

export const PROJECT_TREE_NODES = ["modules", "packages", "apps", "shared-components", "enterprise-engines", "libraries", "assets", "configuration", "documentation"] as const;

export const AI_ENGINE_IDS = ["omega-prime", "scan", "sentinel", "oracle", "phoenix", "titan", "atlas", "guardian"] as const;

export const RELEASE_PIPELINE_STAGES = [
  "development", "architecture-validation", "governance-validation", "security-validation", "ai-validation",
  "marketplace-validation", "performance-validation", "accessibility-validation", "certification-readiness", "production-approval",
] as const;

export const BUILD_STATUSES = ["queued", "running", "passed", "failed", "cancelled"] as const;

export const CODE_QUALITY_CHECKS = [
  "dead-code", "duplicate-code", "duplicate-css", "duplicate-apis", "duplicate-assets", "unused-imports",
  "unused-exports", "unused-images", "unused-icons", "unused-fonts", "unused-dependencies", "broken-imports", "legacy-references",
] as const;

export const DEBT_CATEGORIES = [
  "architecture", "security", "ui", "ux", "performance", "marketplace", "infrastructure", "accessibility", "seo", "developer", "enterprise",
] as const;

export const VALIDATION_CHECKS = ["architecture", "governance", "security", "marketplace", "performance", "accessibility", "ai", "registry", "zero-legacy"] as const;

export const EXPORT_FORMATS = ["pdf", "csv", "excel", "json"] as const;

export const ENTERPRISE_DEVELOPMENT_API = {
  snapshot: "/api/super-admin/development",
  action: "/api/super-admin/development/action",
  dashboard: "/api/super-admin/development/dashboard",
  projects: "/api/super-admin/development/projects",
  modules: "/api/super-admin/development/modules",
  architecture: "/api/super-admin/development/architecture",
  dependencies: "/api/super-admin/development/dependencies",
  apis: "/api/super-admin/development/apis",
  database: "/api/super-admin/development/database",
  storage: "/api/super-admin/development/storage",
  builds: "/api/super-admin/development/builds",
  deployments: "/api/super-admin/development/deployments",
  quality: "/api/super-admin/development/quality",
  performance: "/api/super-admin/development/performance",
  debt: "/api/super-admin/development/debt",
  registry: "/api/super-admin/development/registry",
  export: "/api/super-admin/development/export",
  history: "/api/super-admin/development/history",
  validate: "/api/super-admin/development/validate",
  v1Snapshot: "/api/v1/super-admin/development",
} as const;

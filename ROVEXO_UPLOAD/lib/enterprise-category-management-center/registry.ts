export const CATEGORY_MANAGEMENT_ROUTES = [
  { id: "dashboard", label: "Taxonomy Board", href: "/super-admin/category-management" },
  { id: "tree", label: "Category Tree", href: "/super-admin/category-management/tree" },
  { id: "editor", label: "Category Editor", href: "/super-admin/category-management/editor" },
  { id: "ai", label: "AI Assistant", href: "/super-admin/category-management/ai" },
  { id: "analytics", label: "Live Analytics", href: "/super-admin/category-management/analytics" },
  { id: "import-export", label: "Import / Export", href: "/super-admin/category-management/import-export" },
  { id: "versions", label: "Version Control", href: "/super-admin/category-management/versions" },
  { id: "validation", label: "Validation", href: "/super-admin/category-management/validation" },
  { id: "certification", label: "Certification", href: "/super-admin/category-management/certification" },
  { id: "reports", label: "Reports", href: "/super-admin/category-management/reports" },
] as const;

export const TREE_FEATURES = [
  "unlimited-hierarchy",
  "expand-collapse",
  "drag-drop",
  "multi-select",
  "search",
  "filter",
  "quick-actions",
  "color-tags",
  "status-icons",
  "item-counter",
  "ai-suggestions",
  "recently-modified",
  "favorites",
  "pinned-categories",
] as const;

export const EDITOR_FIELDS = [
  "name",
  "slug",
  "description",
  "rich-text",
  "icon",
  "cover-image",
  "thumbnail",
  "banner",
  "color",
  "attributes",
  "specifications",
  "marketplace-rules",
  "visibility-rules",
  "permissions",
  "seo-title",
  "seo-description",
  "canonical-url",
  "open-graph",
  "structured-data",
  "robots",
  "priority",
  "change-frequency",
  "translations",
  "aliases",
  "version",
] as const;

export const INSPECTOR_CHECKS = [
  "live-validation",
  "seo-health",
  "accessibility",
  "performance",
  "duplicate-detection",
  "broken-relations",
  "missing-images",
  "missing-icons",
  "unused-categories",
  "marketplace-coverage",
  "search-index-status",
  "certification-progress",
] as const;

export const AI_ASSISTANT_CAPABILITIES = [
  "suggest-parent",
  "suggest-attributes",
  "suggest-seo",
  "detect-duplicates",
  "detect-conflicts",
  "suggest-improvements",
  "predict-popularity",
  "recommend-merge",
  "recommend-split",
  "generate-metadata",
] as const;

export const VALIDATION_CHECKS = [
  "hierarchy",
  "slug",
  "routing",
  "images",
  "icons",
  "seo",
  "performance",
  "accessibility",
  "relationships",
  "marketplace-rules",
  "translations",
  "aliases",
  "business-logic",
] as const;

export const OMEGA_CATEGORY_SCORES = [
  "ui",
  "ux",
  "seo",
  "accessibility",
  "performance",
  "security",
  "architecture",
  "marketplace",
  "enterprise",
] as const;

export const IMPORT_EXPORT_FORMATS = ["csv", "excel", "json"] as const;
export const REPORT_TYPES = ["taxonomy", "validation", "certification", "analytics", "audit", "import", "seo"] as const;
export const EXPORT_FORMATS = ["pdf", "excel", "csv", "json"] as const;

export const PROTECTED_AREAS = [
  "orders",
  "payments",
  "wallet",
  "authentication",
  "shipping",
  "buyer-protection",
  "marketplace-transactions",
  "production-database",
  "deployment-pipeline",
] as const;

export const CATEGORY_MANAGEMENT_API = {
  snapshot: "/api/super-admin/category-management",
  action: "/api/super-admin/category-management/action",
  validate: "/api/super-admin/category-management/validate",
  sync: "/api/super-admin/category-management/sync",
  import: "/api/super-admin/category-management/import",
  export: "/api/super-admin/category-management/export",
  v1Snapshot: "/api/v1/super-admin/category-management",
} as const;

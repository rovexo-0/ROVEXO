export const E2E_VALIDATION_ROUTES = [
  { id: "dashboard", label: "Validation Board", href: "/super-admin/e2e-validation" },
  { id: "ui", label: "UI Validation", href: "/super-admin/e2e-validation/ui" },
  { id: "routes", label: "Route Validation", href: "/super-admin/e2e-validation/routes" },
  { id: "buyer", label: "Buyer Flows", href: "/super-admin/e2e-validation/buyer" },
  { id: "seller", label: "Seller Flows", href: "/super-admin/e2e-validation/seller" },
  { id: "company", label: "Company Flows", href: "/super-admin/e2e-validation/company" },
  { id: "super-admin", label: "Super Admin", href: "/super-admin/e2e-validation/super-admin" },
  { id: "database", label: "Database", href: "/super-admin/e2e-validation/database" },
  { id: "api", label: "API Validation", href: "/super-admin/e2e-validation/api" },
  { id: "business", label: "Business Rules", href: "/super-admin/e2e-validation/business" },
  { id: "regression", label: "Regression", href: "/super-admin/e2e-validation/regression" },
  { id: "failures", label: "Failure Analysis", href: "/super-admin/e2e-validation/failures" },
  { id: "reports", label: "Reports", href: "/super-admin/e2e-validation/reports" },
] as const;

export const UI_CONTROL_TYPES = [
  "button",
  "menu",
  "dropdown",
  "tab",
  "modal",
  "dialog",
  "popup",
  "shortcut",
  "filter",
  "search-field",
  "upload-control",
  "image-picker",
  "pagination",
  "card",
  "dashboard-widget",
  "navigation-item",
  "breadcrumb",
  "notification",
  "quick-action",
] as const;

export const ROUTE_VALIDATION_CHECKS = [
  "correct-redirect",
  "protected-routes",
  "role-permissions",
  "404-handling",
  "403-handling",
  "deep-links",
  "external-redirects",
  "back-navigation",
  "forward-navigation",
  "refresh-behavior",
] as const;

export const BUYER_FLOW_STEPS = [
  "register",
  "login",
  "profile",
  "search",
  "filters",
  "categories",
  "listing-page",
  "watchlist",
  "cart",
  "checkout",
  "payment",
  "wallet",
  "orders",
  "tracking",
  "delivery",
  "reviews",
  "messages",
  "notifications",
  "settings",
  "logout",
] as const;

export const SELLER_FLOW_STEPS = [
  "registration",
  "verification",
  "business-profile",
  "create-listing",
  "edit-listing",
  "upload-photos",
  "ai-category",
  "ai-validation",
  "title-validation",
  "description-validation",
  "attributes",
  "pricing",
  "stock",
  "shipping",
  "publish",
  "drafts",
  "orders",
  "messages",
  "analytics",
  "wallet",
  "payouts",
  "settings",
] as const;

export const COMPANY_FLOW_STEPS = [
  "company-registration",
  "employee-management",
  "roles",
  "permissions",
  "branches",
  "analytics",
  "invoices",
  "business-settings",
  "verification",
] as const;

export const SUPER_ADMIN_MODULES = [
  "governance",
  "qa",
  "security",
  "observability",
  "development-director",
  "omega",
  "deployment",
  "certification",
  "bi",
  "incident-response",
  "operations",
  "mobile-center",
  "automation",
  "audit",
] as const;

export const DATABASE_VALIDATION_CHECKS = [
  "read-operations",
  "write-operations",
  "transactions",
  "rollback",
  "indexes",
  "constraints",
  "relations",
  "migration-integrity",
  "data-consistency",
] as const;

export const API_VALIDATION_CHECKS = [
  "authentication",
  "authorization",
  "input",
  "output",
  "timeouts",
  "errors",
  "retries",
  "rate-limits",
  "performance",
  "schema",
  "versioning",
] as const;

export const BUSINESS_RULE_DOMAINS = [
  "marketplace-rules",
  "trust-score",
  "buyer-protection",
  "wallet-rules",
  "payment-rules",
  "shipping-rules",
  "returns",
  "disputes",
  "refunds",
  "subscriptions",
  "coupons",
  "auctions",
  "featured-listings",
  "business-accounts",
  "moderation",
  "compliance",
] as const;

export const OMEGA_VALIDATION_SCORES = [
  "architecture",
  "ui",
  "ux",
  "accessibility",
  "security",
  "performance",
  "database",
  "api",
  "business-logic",
  "regression",
  "certification",
] as const;

export const REGRESSION_STAGES = [
  "identify-modules",
  "targeted-regression",
  "integration-tests",
  "ui-validation",
  "workflow-validation",
  "api-validation",
  "generate-report",
] as const;

export const REPORT_TYPES = [
  "validation",
  "coverage",
  "workflow",
  "regression",
  "api",
  "database",
  "accessibility",
  "performance",
  "certification",
] as const;

export const EXPORT_FORMATS = ["pdf", "excel", "csv", "json"] as const;

export const PROTECTED_AREAS = [
  "production-database",
  "payments",
  "wallet",
  "checkout",
  "authentication",
  "marketplace-business-logic",
  "orders",
  "shipping",
  "deployment-pipeline",
  "business-rules",
] as const;

export const E2E_VALIDATION_API = {
  snapshot: "/api/super-admin/e2e-validation",
  action: "/api/super-admin/e2e-validation/action",
  validate: "/api/super-admin/e2e-validation/validate",
  regression: "/api/super-admin/e2e-validation/regression",
  analyze: "/api/super-admin/e2e-validation/analyze",
  export: "/api/super-admin/e2e-validation/export",
  v1Snapshot: "/api/v1/super-admin/e2e-validation",
} as const;

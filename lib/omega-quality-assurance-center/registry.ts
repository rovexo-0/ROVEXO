export const OMEGA_QA_ROUTES = [
  { id: "dashboard", label: "Dashboard", href: "/super-admin/quality-assurance" },
  { id: "platform", label: "Platform Validation", href: "/super-admin/quality-assurance/platform" },
  { id: "buttons", label: "Button Engine", href: "/super-admin/quality-assurance/buttons" },
  { id: "flows", label: "User Flows", href: "/super-admin/quality-assurance/flows" },
  { id: "ai", label: "AI Validation", href: "/super-admin/quality-assurance/ai" },
  { id: "fix", label: "Fix Engine", href: "/super-admin/quality-assurance/fix" },
  { id: "certification", label: "Certification", href: "/super-admin/quality-assurance/certification" },
  { id: "priority", label: "Priority Mode", href: "/super-admin/quality-assurance/priority" },
  { id: "coverage", label: "Coverage", href: "/super-admin/quality-assurance/coverage" },
  { id: "modules", label: "Module QA", href: "/super-admin/quality-assurance/modules" },
  { id: "reports", label: "Reports", href: "/super-admin/quality-assurance/reports" },
] as const;

export const VALIDATION_DOMAINS = [
  "buyer-platform",
  "seller-platform",
  "company-platform",
  "super-admin",
  "homepage",
  "categories",
  "listing-workflow",
  "checkout",
  "orders",
  "wallet",
  "payments",
  "shipping",
  "messaging",
  "notifications",
  "ai-modules",
  "enterprise-modules",
  "apis",
  "database",
  "security",
  "seo",
  "performance",
] as const;

export const INTERACTIVE_ELEMENT_TYPES = [
  "button",
  "menu",
  "dropdown",
  "tab",
  "filter",
  "modal",
  "popup",
  "dialog",
  "pagination",
  "shortcut",
] as const;

export const BUTTON_VALIDATION_STEPS = [
  "exists",
  "correct-event",
  "correct-permission",
  "correct-redirect",
  "correct-business-logic",
  "correct-database-update",
  "correct-notifications",
  "correct-ui-refresh",
] as const;

export const BUYER_FLOWS = [
  "register",
  "login",
  "browse",
  "search",
  "filter",
  "watchlist",
  "cart",
  "checkout",
  "payment",
  "order",
  "delivery",
  "review",
] as const;

export const SELLER_FLOWS = [
  "register",
  "business-verification",
  "create-listing",
  "upload-photos",
  "ai-category",
  "ai-validation",
  "publish",
  "orders",
  "shipping",
  "messages",
  "payout",
] as const;

export const BUSINESS_FLOWS = [
  "company-onboarding",
  "employees",
  "permissions",
  "analytics",
  "invoices",
  "settings",
] as const;

export const SUPER_ADMIN_FLOWS = [
  "module-navigation",
  "dashboard-access",
  "automation-run",
  "approval-workflow",
  "emergency-action",
  "enterprise-workflow",
] as const;

export const AI_VALIDATION_CHECKS = [
  "titles",
  "descriptions",
  "category-selection",
  "attributes",
  "photos",
  "stock",
  "pricing",
  "shipping",
  "policies",
  "trust-score",
  "marketplace-rules",
  "duplicate-detection",
  "spam-detection",
  "compliance",
] as const;

export const FIX_ENGINE_STAGES = [
  "analyze",
  "identify-root-cause",
  "generate-safe-fix",
  "validate",
  "regression-test",
  "pass",
  "deploy-candidate",
] as const;

export const CERTIFICATION_PIPELINE = [
  "development",
  "verified",
  "validated",
  "qa-pass",
  "omega-pass",
  "governance-pass",
  "security-pass",
  "compliance-pass",
  "enterprise-pass",
  "production-certified",
] as const;

export const HEALTH_SCORES = [
  "platform-health",
  "enterprise-score",
  "module-health",
  "button-coverage",
  "workflow-coverage",
  "api-coverage",
  "database-health",
  "security-score",
  "performance-score",
  "seo-score",
  "accessibility-score",
  "certification-status",
] as const;

export const PRIORITY_ISSUE_TYPES = [
  "broken-buttons",
  "failed-redirects",
  "missing-routes",
  "missing-translations",
  "missing-permissions",
  "broken-apis",
  "incorrect-validations",
  "database-inconsistencies",
  "performance-regressions",
  "security-findings",
  "accessibility-issues",
] as const;

export const EXPORT_FORMATS = ["pdf", "excel", "csv", "json"] as const;

export const OMEGA_QA_API = {
  snapshot: "/api/super-admin/quality-assurance",
  action: "/api/super-admin/quality-assurance/action",
  validate: "/api/super-admin/quality-assurance/validate",
  scan: "/api/super-admin/quality-assurance/scan",
  fix: "/api/super-admin/quality-assurance/fix",
  certify: "/api/super-admin/quality-assurance/certify",
  priority: "/api/super-admin/quality-assurance/priority",
  export: "/api/super-admin/quality-assurance/export",
  v1Snapshot: "/api/v1/super-admin/quality-assurance",
} as const;

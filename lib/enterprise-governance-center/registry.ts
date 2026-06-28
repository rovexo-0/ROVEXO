export const ENTERPRISE_GOVERNANCE_ROUTES = [
  { id: "constitution", label: "Constitution", href: "/super-admin/governance" },
  { id: "constitution-alt", label: "Constitution", href: "/super-admin/governance/constitution" },
  { id: "architecture", label: "Architecture", href: "/super-admin/governance/architecture" },
  { id: "compliance", label: "Compliance", href: "/super-admin/governance/compliance" },
  { id: "enterprise-rules", label: "Enterprise Rules", href: "/super-admin/governance/enterprise-rules" },
  { id: "technical-debt", label: "Technical Debt", href: "/super-admin/governance/technical-debt" },
  { id: "enterprise-score", label: "Enterprise Score", href: "/super-admin/governance/enterprise-score" },
  { id: "certification", label: "Certification", href: "/super-admin/governance/certification" },
  { id: "audit", label: "Audit", href: "/super-admin/governance/audit" },
  { id: "validation", label: "Validation", href: "/super-admin/governance/validation" },
  { id: "reports", label: "Reports", href: "/super-admin/governance/reports" },
] as const;

export const CONSTITUTION_SECTIONS = [
  "architecture", "security", "marketplace", "payments", "ai", "infrastructure", "mobile",
  "deployment", "compliance", "ui", "ux", "performance", "accessibility", "enterprise-standards",
  "search", "storage", "recovery", "business-rules",
] as const;

export const ARCHITECTURE_CHECKS = [
  "duplicate-components", "duplicate-css", "duplicate-apis", "duplicate-routes", "dead-code",
  "circular-dependencies", "broken-imports", "deprecated-modules", "legacy-code", "unused-assets",
  "unused-icons", "unused-images", "unused-fonts", "navigation-violations", "enterprise-violations", "registry-violations",
] as const;

export const COMPLIANCE_CATEGORIES = [
  "architecture", "security", "marketplace", "ai", "seo", "performance", "accessibility",
  "infrastructure", "enterprise-registry", "configuration", "deployment",
] as const;

export const COMPLIANCE_STATUSES = ["pass", "warning", "fail"] as const;

export const DEBT_CATEGORIES = [
  "architecture", "security", "performance", "ui", "ux", "marketplace", "ai", "infrastructure",
  "seo", "accessibility", "developer", "enterprise",
] as const;

export const ENTERPRISE_SCORE_DOMAINS = [
  "architecture", "security", "marketplace", "performance", "ai", "infrastructure", "accessibility", "seo",
] as const;

export const CERTIFICATION_CHECKS = [
  "architecture", "security", "performance", "marketplace", "payments", "orders", "ai",
  "infrastructure", "search", "storage", "deployment", "recovery", "compliance",
] as const;

export const VALIDATION_PIPELINE = [
  "scan", "sentinel", "omega", "architecture-engine", "security-engine", "marketplace-validator",
  "performance-validator", "accessibility-validator", "seo-validator", "infrastructure-validator", "certification-engine",
] as const;

export const REPORT_TYPES = ["architecture", "security", "governance", "certification", "audit"] as const;

export const EXPORT_FORMATS = ["pdf", "excel", "csv", "json"] as const;

export const ENTERPRISE_GOVERNANCE_API = {
  snapshot: "/api/super-admin/governance",
  action: "/api/super-admin/governance/action",
  scan: "/api/super-admin/governance/scan",
  validate: "/api/super-admin/governance/validate",
  certify: "/api/super-admin/governance/certify",
  rules: "/api/super-admin/governance/rules",
  score: "/api/super-admin/governance/score",
  debt: "/api/super-admin/governance/debt",
  audit: "/api/super-admin/governance/audit",
  report: "/api/super-admin/governance/report",
  history: "/api/super-admin/governance/history",
  export: "/api/super-admin/governance/export",
  v1Snapshot: "/api/v1/super-admin/governance",
} as const;

import type { CertificationModuleId } from "@/lib/certification-center-engine/types";

export const CERTIFICATION_MODULES: { id: CertificationModuleId; label: string; icon: string; href: string }[] = [
  { id: "enterprise-core", label: "Enterprise Core", icon: "⚡", href: "/super-admin/enterprise-core" },
  { id: "mission-control", label: "Mission Control", icon: "🛰️", href: "/super-admin" },
  { id: "platform-studio", label: "Platform Studio", icon: "🧩", href: "/super-admin/platform-studio" },
  { id: "theme-studio", label: "Theme Studio Pro", icon: "🎨", href: "/super-admin/theme-studio" },
  { id: "visual-cms", label: "Visual CMS", icon: "🎨", href: "/super-admin/visual-cms" },
  { id: "asset-manager", label: "Asset Manager", icon: "✨", href: "/super-admin/assets" },
  { id: "recovery-center", label: "Recovery Center", icon: "💾", href: "/super-admin/recovery" },
  { id: "operations-center", label: "Operations Center", icon: "🛰️", href: "/super-admin/operations" },
  { id: "security-engine", label: "Security Engine", icon: "🔒", href: "/super-admin/security-engine" },
  { id: "orders-engine", label: "Orders Engine", icon: "📦", href: "/super-admin/orders-engine" },
  { id: "shipping-engine", label: "Shipping Engine", icon: "🚚", href: "/super-admin/shipping-engine" },
  { id: "wallet-engine", label: "Wallet Engine", icon: "💰", href: "/super-admin/wallet-engine" },
  { id: "payments-engine", label: "Payments Engine", icon: "💳", href: "/super-admin/payments-engine" },
  { id: "protection-engine", label: "Buyer Protection Engine", icon: "🛡️", href: "/super-admin/protection-engine" },
  { id: "messages-engine", label: "Messages Engine", icon: "💬", href: "/super-admin/messages-engine" },
  { id: "notifications-engine", label: "Notifications Engine", icon: "🔔", href: "/super-admin/notifications-engine" },
  { id: "analytics-engine", label: "Analytics Engine", icon: "📊", href: "/super-admin/analytics-engine" },
  { id: "search-engine", label: "Search Engine", icon: "🔍", href: "/super-admin/search-engine" },
  { id: "ai-engine", label: "AI Engine", icon: "🤖", href: "/super-admin/ai-engine" },
  { id: "integrations-engine", label: "Integrations Engine", icon: "🔌", href: "/super-admin/integrations-engine" },
  { id: "audit-compliance-center", label: "Audit & Compliance Center", icon: "📋", href: "/super-admin/audit" },
  { id: "homepage-enterprise-certification-engine", label: "Homepage Enterprise Certification", icon: "🏠", href: "/super-admin/homepage-certification" },
  { id: "omega-global-ui-integrity-engine", label: "OMEGA Global UI Integrity", icon: "🔮", href: "/super-admin/global-ui-integrity" },
  { id: "enterprise-launch-readiness-engine", label: "Enterprise Launch Readiness", icon: "🚀", href: "/super-admin/launch-readiness" },
  { id: "enterprise-marketplace-completion-engine", label: "Marketplace Completion", icon: "🏪", href: "/super-admin/marketplace-completion" },
  { id: "enterprise-category-management-center", label: "Enterprise Category Management Center", icon: "📁", href: "/super-admin/category-management" },
];

export const CERTIFICATION_LEVELS = [
  "draft",
  "internal-review",
  "qa-approved",
  "security-approved",
  "compliance-approved",
  "release-candidate",
  "production-ready",
  "certified",
  "revoked",
  "archived",
] as const;

export const CERTIFICATION_APPROVAL_STAGES = [
  { id: "draft", label: "Draft" },
  { id: "review", label: "Review" },
  { id: "technical-approval", label: "Technical Approval" },
  { id: "security-approval", label: "Security Approval" },
  { id: "compliance-approval", label: "Compliance Approval" },
  { id: "executive-approval", label: "Executive Approval" },
  { id: "production-certification", label: "Production Certification" },
  { id: "archive", label: "Archive" },
] as const;

export const CERTIFICATION_REPORT_TYPES = [
  "executive-summary",
  "technical",
  "security",
  "compliance",
  "infrastructure",
  "performance",
  "marketplace",
  "production-certification",
] as const;

export const CERTIFICATION_EXPORT_FORMATS = ["pdf", "csv", "json", "markdown"] as const;

export const RELEASE_VALIDATION_CHECKS = [
  { id: "production-build", label: "Production Build", category: "build" },
  { id: "typecheck", label: "Typecheck", category: "build" },
  { id: "unit-tests", label: "Unit Tests", category: "tests" },
  { id: "integration-tests", label: "Integration Tests", category: "tests" },
  { id: "end-to-end-tests", label: "End-to-End Tests", category: "tests" },
  { id: "accessibility", label: "Accessibility", category: "quality" },
  { id: "seo", label: "SEO", category: "quality" },
  { id: "performance", label: "Performance", category: "quality" },
  { id: "security", label: "Security", category: "security" },
  { id: "compliance", label: "Compliance", category: "compliance" },
  { id: "infrastructure", label: "Infrastructure", category: "infrastructure" },
  { id: "monitoring", label: "Monitoring", category: "infrastructure" },
  { id: "backups", label: "Backups", category: "recovery" },
  { id: "recovery", label: "Recovery", category: "recovery" },
  { id: "health-checks", label: "Health Checks", category: "infrastructure" },
] as const;

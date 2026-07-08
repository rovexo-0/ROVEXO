import type { AuditModuleId } from "@/lib/audit-compliance-engine/types";

export const AUDIT_COMPLIANCE_MODULES: { id: AuditModuleId; label: string; icon: string; href: string }[] = [
  { id: "enterprise-core", label: "Enterprise Core", icon: "⚡", href: "/super-admin/enterprise-core" },
  { id: "mission-control", label: "Mission Control", icon: "🛰️", href: "/super-admin" },
  { id: "operations-center", label: "Operations Center", icon: "🛰️", href: "/super-admin/operations" },
  { id: "recovery-center", label: "Recovery Center", icon: "💾", href: "/super-admin/recovery" },
  { id: "security-engine", label: "Security Engine", icon: "🔒", href: "/super-admin/security-engine" },
  { id: "asset-manager", label: "Asset Manager", icon: "✨", href: "/super-admin/assets" },
  { id: "visual-cms", label: "Visual CMS", icon: "🎨", href: "/super-admin/visual-cms" },
  { id: "theme-studio", label: "Theme Studio", icon: "🎨", href: "/super-admin/theme-studio" },
  { id: "platform-studio", label: "Platform Studio", icon: "🧩", href: "/super-admin/platform-studio" },
  { id: "ai-engine", label: "AI Engine", icon: "🤖", href: "/super-admin/ai-engine" },
  { id: "search-engine", label: "Search Engine", icon: "🔍", href: "/super-admin/search-engine" },
  { id: "integrations-engine", label: "Integrations Engine", icon: "🔌", href: "/super-admin/integrations-engine" },
  { id: "payments-engine", label: "Payments Engine", icon: "💳", href: "/super-admin/payments-engine" },
  { id: "wallet-engine", label: "Wallet Engine", icon: "💰", href: "/super-admin/wallet-engine" },
  { id: "orders-engine", label: "Orders Engine", icon: "📦", href: "/super-admin/orders-engine" },
  { id: "shipping-engine", label: "Shipping Engine", icon: "🚚", href: "/super-admin/shipping-engine" },
  { id: "protection-engine", label: "Purchase Protection Engine", icon: "🛡️", href: "/super-admin/protection-engine" },
  { id: "messages-engine", label: "Messages Engine", icon: "💬", href: "/super-admin/messages-engine" },
  { id: "notifications-engine", label: "Notifications Engine", icon: "🔔", href: "/super-admin/notifications-engine" },
  { id: "analytics-engine", label: "Analytics Engine", icon: "📊", href: "/super-admin/analytics-engine" },
];

export const AUDIT_SECURITY_CHECKS = [
  "authentication",
  "authorization",
  "permissions",
  "api-security",
  "rate-limits",
  "secrets",
  "tokens",
  "sessions",
  "encryption",
  "headers",
  "cookies",
  "cors",
  "csrf",
  "xss-protection",
  "sql-injection-protection",
  "webhook-validation",
] as const;

export const AUDIT_PERFORMANCE_CHECKS = [
  "page-speed",
  "api-response-times",
  "database-queries",
  "caching",
  "images",
  "assets",
  "bundle-size",
  "memory-usage",
  "cpu-usage",
  "background-workers",
  "queue-performance",
] as const;

export const AUDIT_ACCESSIBILITY_CHECKS = [
  "wcag-2.2-aa",
  "keyboard-navigation",
  "focus-order",
  "screen-readers",
  "color-contrast",
  "aria-labels",
  "responsive-scaling",
  "reduced-motion",
  "high-contrast-support",
] as const;

export const AUDIT_SEO_CHECKS = [
  "metadata",
  "open-graph",
  "structured-data",
  "canonical-urls",
  "sitemap",
  "robots",
  "performance",
  "indexability",
  "broken-links",
] as const;

export const AUDIT_COMPLIANCE_STANDARDS = [
  { id: "gdpr", label: "GDPR" },
  { id: "uk-gdpr", label: "UK GDPR" },
  { id: "iso-27001", label: "ISO/IEC 27001" },
  { id: "soc2", label: "SOC 2 Type II" },
  { id: "cyber-essentials", label: "Cyber Essentials" },
  { id: "cyber-essentials-plus", label: "Cyber Essentials Plus" },
  { id: "pci-dss", label: "PCI DSS" },
  { id: "rovexo-trust", label: "ROVEXO Trust Framework" },
] as const;

export const AUDIT_REPORT_TYPES = [
  "production-readiness",
  "security",
  "performance",
  "compliance",
  "infrastructure",
  "accessibility",
  "seo",
  "enterprise-certification",
  "executive-summary",
] as const;

export const AUDIT_EXPORT_FORMATS = ["pdf", "csv", "json", "markdown"] as const;

export const ENTERPRISE_SOC_ROUTES = [
  { id: "dashboard", label: "Security Operations Center", href: "/super-admin/security" },
  { id: "dashboard-alt", label: "SOC Dashboard", href: "/super-admin/security/dashboard" },
  { id: "live", label: "Live Events", href: "/super-admin/security/live" },
  { id: "threats", label: "Threat Intelligence", href: "/super-admin/security/threats" },
  { id: "firewall", label: "Firewall Center", href: "/super-admin/security/firewall" },
  { id: "devices", label: "Device Security", href: "/super-admin/security/devices" },
  { id: "sessions", label: "Sessions", href: "/super-admin/security/sessions" },
  { id: "scanner", label: "Security Scanner", href: "/super-admin/security/scanner" },
  { id: "vulnerabilities", label: "Vulnerabilities", href: "/super-admin/security/vulnerabilities" },
  { id: "compliance", label: "Compliance", href: "/super-admin/security/compliance" },
  { id: "audit", label: "Security Audit", href: "/super-admin/security/audit" },
  { id: "settings", label: "Settings", href: "/super-admin/security/settings" },
] as const;

export const SOC_EVENT_CATEGORIES = [
  "authentication", "payments", "wallet", "orders", "marketplace", "api", "devices",
  "sessions", "permissions", "deployments", "ai", "infrastructure", "cron", "email",
  "notifications", "search",
] as const;

export const THREAT_LEVELS = ["critical", "high", "medium", "low", "info"] as const;

export const INTRUSION_TYPES = [
  "brute-force", "credential-stuffing", "api-abuse", "rate-limit-violation",
  "session-hijacking", "privilege-escalation", "bot-activity", "spam-activity", "abnormal-behaviour",
] as const;

export const SCANNER_TYPES = [
  "configuration", "dependency", "secrets", "package", "infrastructure",
  "environment", "storage", "permission", "security-headers", "ssl-validation",
] as const;

export const FIREWALL_RULE_TYPES = [
  "ip", "country", "asn", "session", "device", "rate-limit", "allow-list", "block-list",
] as const;

export const SOC_AUTOMATIONS = [
  "auto-block", "auto-quarantine", "auto-notify", "auto-escalate", "auto-recovery",
  "auto-rollback-suggestion", "auto-incident-creation",
] as const;

export const COMPLIANCE_FRAMEWORKS = ["gdpr", "security-audit", "access-logs", "permission-review", "mfa-compliance", "password-policy", "security-policies"] as const;

export const ENTERPRISE_SOC_API = {
  snapshot: "/api/super-admin/security",
  action: "/api/super-admin/security/action",
  scan: "/api/super-admin/security/scan",
  block: "/api/super-admin/security/block",
  unblock: "/api/super-admin/security/unblock",
  quarantine: "/api/super-admin/security/quarantine",
  isolate: "/api/super-admin/security/isolate",
  rotate: "/api/super-admin/security/rotate",
  revoke: "/api/super-admin/security/revoke",
  export: "/api/super-admin/security/export",
  import: "/api/super-admin/security/import",
  v1Snapshot: "/api/v1/super-admin/security",
} as const;

export const AI_SECURITY_SOURCES = ["scan", "sentinel", "omega"] as const;

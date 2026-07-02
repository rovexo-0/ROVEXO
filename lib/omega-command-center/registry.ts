export const OMEGA_COMMAND_CENTER_ROUTES = [
  { id: "dashboard", label: "OMEGA Command Center", href: "/super-admin/omega" },
] as const;

export const OMEGA_AI_ENGINES = ["scan", "sentinel", "oracle", "phoenix", "titan", "atlas", "guardian"] as const;

export const OMEGA_ENGINE_ROUTES = [
  { id: "scan", label: "SCAN", href: "/super-admin/ai/scan", icon: "🔍" },
  { id: "sentinel", label: "SENTINEL", href: "/super-admin/ai/sentinel", icon: "🛡️" },
  { id: "oracle", label: "ORACLE", href: "/super-admin/ai/oracle", icon: "🔮" },
  { id: "phoenix", label: "PHOENIX", href: "/super-admin/ai/phoenix", icon: "🔥" },
  { id: "titan", label: "TITAN", href: "/super-admin/ai/titan", icon: "⚡" },
  { id: "atlas", label: "ATLAS", href: "/super-admin/ai/atlas", icon: "🗺️" },
  { id: "guardian", label: "GUARDIAN", href: "/super-admin/ai/guardian", icon: "🏛️" },
] as const;

export const SCAN_ENGINE_TABS = [
  "infrastructure", "marketplace", "api", "database", "storage", "performance", "seo", "mobile", "reports",
] as const;

export const SENTINEL_ENGINE_TABS = [
  "threats", "fraud", "accounts", "sessions", "security", "firewall", "bot-detection", "geo-risk", "reports",
] as const;

export const ORACLE_ENGINE_TABS = [
  "forecast", "revenue", "demand", "growth", "capacity", "conversion", "marketplace", "predictions",
] as const;

export const PHOENIX_ENGINE_TABS = ["recovery", "rollback", "restore", "self-healing", "repair-queue"] as const;

export const TITAN_ENGINE_TABS = ["automation", "workflows", "optimization", "background-jobs", "scheduling"] as const;

export const ATLAS_ENGINE_TABS = ["infrastructure", "services", "dependencies", "live-topology", "database-relations", "api-map"] as const;

export const GUARDIAN_ENGINE_TABS = ["compliance", "policies", "audit", "gdpr", "enterprise-rules", "validation"] as const;

export const ENTERPRISE_HEALTH_DOMAINS = [
  "platform", "marketplace", "security", "infrastructure", "performance", "financial", "seo", "mobile",
  "ai", "compliance", "deployment", "incident", "recovery",
] as const;

export const ENTERPRISE_SCAN_PHASES = [
  "scanning-platform", "scanning-database", "scanning-marketplace", "scanning-apis",
  "scanning-infrastructure", "scanning-security", "scanning-fraud", "scanning-performance",
  "scanning-revenue", "scanning-seo", "scanning-mobile", "scanning-compliance",
] as const;

export const OMEGA_SCAN_TYPES = [
  "quick", "deep", "security", "marketplace", "infrastructure", "performance", "financial", "seo", "mobile",
  "compliance", "production-certification", "emergency", "enterprise",
] as const;

export const LIVE_MONITOR_WIDGETS = [
  "cpu", "ram", "api", "redis", "supabase", "stripe", "storage", "search", "email", "cron", "notifications", "queue", "workers",
] as const;

export const REPORT_EXPORT_FORMATS = ["pdf", "csv", "excel", "json"] as const;

export const OMEGA_COMMAND_CENTER_API = {
  snapshot: "/api/super-admin/omega",
  action: "/api/super-admin/omega/action",
  runScan: "/api/super-admin/omega/run-scan",
  quickScan: "/api/super-admin/omega/quick-scan",
  deepScan: "/api/super-admin/omega/deep-scan",
  pause: "/api/super-admin/omega/pause",
  resume: "/api/super-admin/omega/resume",
  cancel: "/api/super-admin/omega/cancel",
  repair: "/api/super-admin/omega/repair",
  deploy: "/api/super-admin/omega/deploy",
  rollback: "/api/super-admin/omega/rollback",
  history: "/api/super-admin/omega/history",
  report: "/api/super-admin/omega/report",
  logs: "/api/super-admin/omega/logs",
  export: "/api/super-admin/omega/export",
  diagnostics: "/api/super-admin/omega/diagnostics",
  v1Snapshot: "/api/v1/super-admin/omega",
} as const;

export const OMEGA_SEARCH_CATEGORIES = [
  "order", "listing", "user", "seller", "buyer", "module", "workflow", "deployment", "incident", "ai", "audit", "security", "scan",
] as const;

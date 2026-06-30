export const ENTERPRISE_AI_OS_ROUTES = [
  { id: "dashboard", label: "AI Command Center", href: "/super-admin/ai" },
  { id: "scan", label: "Scan Center", href: "/super-admin/ai/scan" },
  { id: "sentinel", label: "Sentinel Center", href: "/super-admin/ai/sentinel" },
  { id: "omega", label: "Omega Center", href: "/super-admin/ai/omega" },
  { id: "predictions", label: "Predictions", href: "/super-admin/ai/predictions" },
  { id: "repairs", label: "Repair Queue", href: "/super-admin/ai/repairs" },
  { id: "history", label: "History", href: "/super-admin/ai/history" },
  { id: "logs", label: "AI Logs", href: "/super-admin/ai/logs" },
] as const;

export const SCAN_TARGET_TYPES = [
  "platform", "infrastructure", "database", "storage", "payments", "orders",
  "users", "businesses", "listings", "messages", "notifications", "cron-jobs",
  "queues", "api", "search", "security", "performance", "memory", "cpu",
  "disk", "network", "ai-models",
] as const;

export const SCAN_MODES = [
  "manual", "full-platform", "quick", "security", "infrastructure",
  "marketplace", "fraud", "payments", "performance", "database",
  "storage", "api", "search", "ai",
] as const;

export const SENTINEL_MONITOR_TYPES = [
  "platform-health", "marketplace-health", "fraud", "attacks", "spam", "bots",
  "abuse", "chargebacks", "high-risk-sellers", "high-risk-buyers",
  "suspicious-businesses", "payment-anomalies", "traffic-anomalies",
  "database-anomalies", "infrastructure-anomalies",
] as const;

export const PREDICTION_TYPES = [
  "traffic", "sales", "revenue", "fraud", "chargebacks", "server-load",
  "storage-growth", "database-growth", "cpu-usage", "memory-usage",
  "bandwidth", "marketplace-growth", "business-growth",
] as const;

export const SELF_HEALING_ISSUE_TYPES = [
  "broken-jobs", "failed-cron", "broken-queue", "failed-api", "storage-errors",
  "database-errors", "email-failure", "push-failure", "cache-failure",
  "search-failure", "configuration-drift",
] as const;

export const ENTERPRISE_AI_OS_API = {
  snapshot: "/api/super-admin/ai",
  scan: "/api/super-admin/ai/scan",
  sentinel: "/api/super-admin/ai/sentinel",
  omega: "/api/super-admin/ai/omega",
  runScan: "/api/super-admin/ai/run-scan",
  runAnalysis: "/api/super-admin/ai/run-analysis",
  createRepairPlan: "/api/super-admin/ai/create-repair-plan",
  approveRepair: "/api/super-admin/ai/approve-repair",
  cancelRepair: "/api/super-admin/ai/cancel-repair",
  history: "/api/super-admin/ai/history",
  models: "/api/super-admin/ai/models",
  incidents: "/api/super-admin/ai/incidents",
  recommendations: "/api/super-admin/ai/recommendations",
  predictions: "/api/super-admin/ai/predictions",
  v1Snapshot: "/api/v1/super-admin/ai",
} as const;

export const AI_DASHBOARD_WIDGETS = [
  "ai-status", "sentinel-status", "scan-status", "omega-status", "prediction-status",
] as const;

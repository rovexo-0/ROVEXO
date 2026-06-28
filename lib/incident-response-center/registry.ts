export const INCIDENT_RESPONSE_CENTER_ROUTES = [
  { id: "dashboard", label: "Incident Response Center", href: "/super-admin/incidents" },
  { id: "live", label: "Live Incidents", href: "/super-admin/incidents/live" },
  { id: "history", label: "History", href: "/super-admin/incidents/history" },
  { id: "critical", label: "Critical", href: "/super-admin/incidents/critical" },
  { id: "root-cause", label: "Root Cause Analysis", href: "/super-admin/incidents/root-cause" },
  { id: "timeline", label: "Event Timeline", href: "/super-admin/incidents/timeline" },
  { id: "postmortem", label: "Postmortem", href: "/super-admin/incidents/postmortem" },
  { id: "playbooks", label: "Playbooks", href: "/super-admin/incidents/playbooks" },
  { id: "settings", label: "Settings", href: "/super-admin/incidents/settings" },
] as const;

export const INCIDENT_SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

export const INCIDENT_TYPES = [
  "api", "database", "payments", "stripe", "supabase", "redis", "authentication", "search",
  "email", "notifications", "push", "ai", "workflow", "deployment", "marketplace", "orders",
  "wallet", "cron", "storage", "security", "infrastructure",
] as const;

export const INCIDENT_STATUSES = [
  "open", "acknowledged", "investigating", "mitigating", "resolved", "reopened", "escalated",
] as const;

export const TIMELINE_EVENT_TYPES = [
  "detection", "escalation", "assignment", "mitigation", "recovery", "resolution", "postmortem",
] as const;

export const PLAYBOOK_ACTIONS = [
  "restart", "flush-cache", "rollback", "disable-feature", "enable-maintenance", "restart-workers",
  "reconnect-provider", "retry-queue", "notify-team", "create-report",
] as const;

export const AUTOMATION_RULES = [
  "auto-assign", "auto-escalate", "auto-reopen", "auto-notify", "auto-recover", "auto-rollback-suggestion",
] as const;

export const INCIDENT_RESPONSE_CENTER_API = {
  snapshot: "/api/super-admin/incidents",
  action: "/api/super-admin/incidents/action",
  acknowledge: "/api/super-admin/incidents/acknowledge",
  escalate: "/api/super-admin/incidents/escalate",
  resolve: "/api/super-admin/incidents/resolve",
  reopen: "/api/super-admin/incidents/reopen",
  rollback: "/api/super-admin/incidents/rollback",
  export: "/api/super-admin/incidents/export",
  import: "/api/super-admin/incidents/import",
  v1Snapshot: "/api/v1/super-admin/incidents",
} as const;

export const AI_INTEGRATION_SOURCES = ["scan", "sentinel", "omega"] as const;

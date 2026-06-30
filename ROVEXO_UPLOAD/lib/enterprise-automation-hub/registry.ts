export const ENTERPRISE_AUTOMATION_HUB_ROUTES = [
  { id: "dashboard", label: "Automation Hub", href: "/super-admin/automation" },
  { id: "dashboard-alt", label: "Dashboard", href: "/super-admin/automation/dashboard" },
  { id: "workflows", label: "Workflows", href: "/super-admin/automation/workflows" },
  { id: "rules", label: "Rule Engine", href: "/super-admin/automation/rules" },
  { id: "events", label: "Event Triggers", href: "/super-admin/automation/events" },
  { id: "templates", label: "Templates", href: "/super-admin/automation/templates" },
  { id: "schedules", label: "Schedules", href: "/super-admin/automation/schedules" },
  { id: "history", label: "Execution History", href: "/super-admin/automation/history" },
  { id: "monitoring", label: "Monitoring", href: "/super-admin/automation/monitoring" },
  { id: "approvals", label: "Approvals", href: "/super-admin/automation/approvals" },
  { id: "versions", label: "Versions", href: "/super-admin/automation/versions" },
  { id: "settings", label: "Settings", href: "/super-admin/automation/settings" },
] as const;

export const EVENT_TRIGGERS = [
  "user-registration", "order-created", "payment-completed", "listing-published", "listing-updated",
  "auction-started", "auction-ended", "refund-created", "chargeback", "support-ticket",
  "fraud-detection", "security-alert", "deployment-completed", "incident-created", "scheduled-event",
  "api-event", "webhook-event",
] as const;

export const AUTOMATION_TYPES = [
  "marketplace", "buyer", "seller", "business", "payment", "wallet", "shipping", "notification",
  "support", "analytics", "security", "deployment", "recovery", "incident", "seo", "homepage",
] as const;

export const WORKFLOW_EXECUTION_MODES = ["sequential", "parallel", "conditional", "loop"] as const;

export const APPROVAL_STATUSES = ["draft", "pending-approval", "approved", "rejected", "published", "rollback"] as const;

export const JOB_STATUSES = ["running", "scheduled", "paused", "failed", "completed", "stopped"] as const;

export const RULE_OPERATORS = ["equals", "not-equals", "greater-than", "less-than", "contains", "matches"] as const;

export const EXPORT_FORMATS = ["json", "csv", "yaml"] as const;

export const ENTERPRISE_AUTOMATION_HUB_API = {
  snapshot: "/api/super-admin/automation",
  action: "/api/super-admin/automation/action",
  run: "/api/super-admin/automation/run",
  pause: "/api/super-admin/automation/pause",
  stop: "/api/super-admin/automation/stop",
  enable: "/api/super-admin/automation/enable",
  disable: "/api/super-admin/automation/disable",
  publish: "/api/super-admin/automation/publish",
  rollback: "/api/super-admin/automation/rollback",
  export: "/api/super-admin/automation/export",
  import: "/api/super-admin/automation/import",
  v1Snapshot: "/api/v1/super-admin/automation",
} as const;

export const AI_AUTOMATION_SOURCES = ["scan", "sentinel", "omega"] as const;

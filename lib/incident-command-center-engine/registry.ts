export const INCIDENT_COMMAND_ROUTES = [
  { id: "dashboard", label: "Dashboard", href: "/super-admin/mobile/incidents" },
  { id: "live", label: "Live", href: "/super-admin/mobile/incidents/live" },
  { id: "history", label: "History", href: "/super-admin/mobile/incidents/history" },
  { id: "critical", label: "Critical", href: "/super-admin/mobile/incidents/critical" },
  { id: "security", label: "Security", href: "/super-admin/mobile/incidents/security" },
  { id: "infrastructure", label: "Infrastructure", href: "/super-admin/mobile/incidents/infrastructure" },
  { id: "payments", label: "Payments", href: "/super-admin/mobile/incidents/payments" },
  { id: "wallet", label: "Wallet", href: "/super-admin/mobile/incidents/wallet" },
  { id: "identity", label: "Identity", href: "/super-admin/mobile/incidents/identity" },
  { id: "compliance", label: "Compliance", href: "/super-admin/mobile/incidents/compliance" },
  { id: "emergency", label: "Emergency", href: "/super-admin/mobile/incidents/emergency" },
  { id: "reports", label: "Reports", href: "/super-admin/mobile/incidents/reports" },
  { id: "settings", label: "Settings", href: "/super-admin/mobile/incidents/settings" },
] as const;

export const INCIDENT_CATEGORIES = [
  "infrastructure", "database", "api", "marketplace", "wallet", "payments", "identity",
  "authentication", "security", "guardian", "sentinel", "antivirus", "ori", "compliance",
  "certification", "storage", "backup", "recovery", "network", "performance", "application",
  "server", "cloud", "queue", "jobs", "cron", "notifications",
] as const;

export const INCIDENT_OMEGA_ACTIONS = [
  { id: "run-scan", label: "Run Global Scan" },
  { id: "open-guardian", label: "Open Guardian", href: "/super-admin/security-engine" },
  { id: "open-sentinel", label: "Open Sentinel", href: "/super-admin/security-engine" },
  { id: "open-antivirus", label: "Open Antivirus", href: "/super-admin/security-engine" },
  { id: "verify-infrastructure", label: "Verify Infrastructure", href: "/super-admin/mobile/omega/infrastructure" },
  { id: "incident-report", label: "Generate Incident Report" },
  { id: "executive-report", label: "Generate Executive Report", href: "/super-admin/mobile/omega/executive-command" },
  { id: "emergency-center", label: "Open Emergency Center", href: "/super-admin/mobile/incidents/emergency" },
  { id: "acknowledge", label: "Acknowledge Incident" },
  { id: "assign", label: "Assign Incident" },
  { id: "close", label: "Close Incident" },
] as const;

export const INCIDENT_EMERGENCY_ACTIONS = [
  { id: "maintenance-mode", label: "Maintenance Mode", protected: true },
  { id: "emergency-lock", label: "Emergency Lock", protected: true },
  { id: "disable-login", label: "Disable Login", protected: true },
  { id: "pause-marketplace", label: "Pause Marketplace", protected: true },
  { id: "pause-payments", label: "Pause Payments", protected: true },
  { id: "pause-wallet", label: "Pause Wallet", protected: true },
  { id: "emergency-broadcast", label: "Emergency Broadcast", protected: true },
  { id: "backup-verification", label: "Backup Verification", href: "/super-admin/recovery/backups" },
  { id: "recovery-verification", label: "Recovery Verification", href: "/super-admin/recovery" },
] as const;

export const INCIDENT_REPORT_TYPES = [
  { id: "incident", label: "Incident Report" },
  { id: "executive-summary", label: "Executive Incident Summary" },
  { id: "security", label: "Security Report" },
  { id: "infrastructure", label: "Infrastructure Report" },
  { id: "payment", label: "Payment Report" },
  { id: "compliance", label: "Compliance Report" },
] as const;

export const INCIDENT_NOTIFICATION_FILTERS = [
  "Critical", "Security", "Payments", "Wallet", "Marketplace", "Infrastructure",
  "Compliance", "Certification", "ORI", "OMEGA", "Guardian", "Sentinel", "Antivirus",
] as const;

export const INCIDENT_PUSH_TYPES = [
  "Critical Push", "Silent Push", "Security Push", "Emergency Push", "Maintenance Push",
  "Release Push", "Compliance Push", "Device Push",
] as const;

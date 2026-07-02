export const OMEGA_ENTERPRISE_ROUTES = [
  { id: "dashboard", label: "Dashboard", href: "/super-admin/mobile/omega" },
  { id: "live", label: "Live", href: "/super-admin/mobile/omega/live" },
  { id: "health", label: "Health", href: "/super-admin/mobile/omega/health" },
  { id: "scans", label: "Scans", href: "/super-admin/mobile/omega/scans" },
  { id: "alerts", label: "Alerts", href: "/super-admin/mobile/omega/alerts" },
  { id: "certifications", label: "Certifications", href: "/super-admin/mobile/omega/certifications" },
  { id: "security", label: "Security", href: "/super-admin/mobile/omega/security" },
  { id: "infrastructure", label: "Infrastructure", href: "/super-admin/mobile/omega/infrastructure" },
  { id: "performance", label: "Performance", href: "/super-admin/mobile/omega/performance" },
  { id: "analytics", label: "Analytics", href: "/super-admin/mobile/omega/analytics" },
  { id: "releases", label: "Releases", href: "/super-admin/mobile/omega/releases" },
  { id: "reports", label: "Reports", href: "/super-admin/mobile/omega/reports" },
  { id: "settings", label: "Settings", href: "/super-admin/mobile/omega/settings" },
  { id: "executive-command", label: "Executive Command", href: "/super-admin/mobile/omega/executive-command" },
] as const;

export const OMEGA_LIVE_MODULES = [
  "Platform Health",
  "Marketplace",
  "Wallet",
  "Payments",
  "Identity",
  "Infrastructure",
  "Performance",
  "Guardian",
  "Sentinel",
  "Antivirus",
  "ORI",
  "Compliance",
  "Certification",
] as const;

export const OMEGA_GLOBAL_SCAN_CHECKS = [
  { id: "guardian", label: "Guardian Scan", module: "Guardian Enterprise X" },
  { id: "sentinel", label: "Sentinel Scan", module: "Sentinel X" },
  { id: "antivirus", label: "Antivirus Scan", module: "Antivirus Engine X" },
  { id: "infrastructure", label: "Infrastructure Scan", module: "Infrastructure Engine" },
  { id: "database", label: "Database Scan", module: "Database" },
  { id: "api", label: "API Scan", module: "API Gateway" },
  { id: "performance", label: "Performance Scan", module: "Performance Engine" },
  { id: "compliance", label: "Compliance Scan", module: "Enterprise Compliance Center" },
  { id: "certification", label: "Certification Scan", module: "Certification Center" },
] as const;

export const OMEGA_ACTION_CENTER = [
  { id: "run-scan", label: "Run Scan" },
  { id: "verify-integrity", label: "Verify Integrity" },
  { id: "restart-services", label: "Restart Background Services" },
  { id: "clear-cache", label: "Clear Cache" },
  { id: "generate-report", label: "Generate Report" },
  { id: "verify-certificates", label: "Verify Certificates" },
  { id: "sync-data", label: "Sync Data" },
  { id: "refresh-status", label: "Refresh Status" },
  { id: "emergency-mode", label: "Emergency Mode" },
  { id: "maintenance-mode", label: "Maintenance Mode" },
] as const;

export const OMEGA_CERTIFICATION_ITEMS = [
  { id: "omega-gold", label: "OMEGA GOLD" },
  { id: "guardian", label: "Guardian" },
  { id: "sentinel", label: "Sentinel" },
  { id: "antivirus", label: "Antivirus" },
  { id: "ori", label: "ORI" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "disaster-recovery", label: "Disaster Recovery" },
  { id: "rovexo-trust", label: "ROVEXO TRUST" },
  { id: "iso", label: "ISO Readiness" },
  { id: "soc2", label: "SOC2 Readiness" },
  { id: "cyber-essentials", label: "Cyber Essentials" },
  { id: "gdpr", label: "GDPR" },
  { id: "pci", label: "PCI Readiness" },
] as const;

export const OMEGA_REPORT_TYPES = [
  { id: "executive", label: "Executive Report" },
  { id: "security", label: "Security Report" },
  { id: "infrastructure", label: "Infrastructure Report" },
  { id: "marketplace", label: "Marketplace Report" },
  { id: "financial", label: "Financial Report" },
  { id: "compliance", label: "Compliance Report" },
  { id: "certification", label: "Certification Report" },
] as const;

export const OMEGA_NOTIFICATION_EVENTS = [
  "Critical Alert",
  "Security Incident",
  "Server Offline",
  "Backup Failed",
  "Release Failed",
  "Certificate Expiring",
  "Infrastructure Warning",
  "Performance Warning",
] as const;

export const OMEGA_SYSTEM_STATUS_ITEMS = [
  "System Status",
  "Live Users",
  "Server Status",
  "API Status",
  "Database Status",
  "Queue Status",
  "Background Jobs",
] as const;

export const OMEGA_ORI_QUESTIONS = [
  "What is the current platform health?",
  "Are there critical incidents?",
  "Why is performance reduced?",
  "What should be fixed first?",
  "Predict future infrastructure needs.",
  "Recommend corrective actions.",
] as const;

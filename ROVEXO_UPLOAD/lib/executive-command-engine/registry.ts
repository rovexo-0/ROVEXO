export const EXECUTIVE_COMMAND_ROUTE = {
  id: "executive-command",
  label: "Executive Command",
  href: "/super-admin/mobile/omega/executive-command",
} as const;

export const EXECUTIVE_ACTIONS = [
  { id: "run-scan", label: "Run Global Scan", href: "/super-admin/mobile/omega/scans", action: "run-scan" },
  { id: "guardian", label: "Open Guardian", href: "/super-admin/security-engine" },
  { id: "sentinel", label: "Open Sentinel", href: "/super-admin/security-engine" },
  { id: "antivirus", label: "Open Antivirus", href: "/super-admin/security-engine" },
  { id: "infrastructure", label: "Open Infrastructure", href: "/super-admin/mobile/omega/infrastructure" },
  { id: "reports", label: "Open Reports", href: "/super-admin/mobile/omega/reports" },
  { id: "executive-report", label: "Generate Executive Report", action: "generate-executive-report" },
  { id: "compliance", label: "Open Compliance Center", href: "/super-admin/audit/compliance" },
  { id: "emergency", label: "Emergency Mode", action: "emergency-mode" },
] as const;

export const EXECUTIVE_EXPORT_TYPES = [
  { id: "executive-pdf", label: "Executive PDF", format: "pdf" as const },
  { id: "executive-xlsx", label: "Executive XLSX", format: "xlsx" as const },
  { id: "executive-csv", label: "Executive CSV", format: "csv" as const },
  { id: "executive-summary", label: "Executive Summary", format: "pdf" as const },
  { id: "audit-report", label: "Audit Report", format: "pdf" as const },
] as const;

export const EXECUTIVE_CERTIFICATION_LABELS = [
  "OMEGA GOLD",
  "Guardian",
  "Sentinel",
  "Antivirus",
  "ORI",
  "Infrastructure",
  "Disaster Recovery",
  "ROVEXO TRUST",
  "ISO Readiness",
  "SOC 2 Readiness",
  "Cyber Essentials",
  "PCI Readiness",
  "GDPR",
] as const;

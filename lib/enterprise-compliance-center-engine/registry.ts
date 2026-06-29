export const ENTERPRISE_COMPLIANCE_ROUTES = [
  { id: "dashboard", label: "Dashboard", href: "/super-admin/compliance" },
  { id: "readiness", label: "Readiness", href: "/super-admin/compliance/readiness" },
  { id: "pre-audit", label: "Pre-Audit", href: "/super-admin/compliance/pre-audit" },
  { id: "gap-analysis", label: "Gap Analysis", href: "/super-admin/compliance/gap-analysis" },
  { id: "remediation", label: "Remediation", href: "/super-admin/compliance/remediation" },
  { id: "evidence", label: "Evidence", href: "/super-admin/compliance/evidence" },
  { id: "certifications", label: "Certifications", href: "/super-admin/compliance/certifications" },
  { id: "reports", label: "Reports", href: "/super-admin/compliance/reports" },
  { id: "history", label: "History", href: "/super-admin/compliance/history" },
  { id: "settings", label: "Settings", href: "/super-admin/compliance/settings" },
] as const;

export const COMPLIANCE_EXPORT_TYPES = [
  { id: "executive-audit", label: "Executive Audit Report", format: "pdf" as const },
  { id: "gap-analysis-report", label: "Gap Analysis Report", format: "pdf" as const },
  { id: "evidence-report", label: "Evidence Report", format: "pdf" as const },
  { id: "compliance-report", label: "Compliance Report", format: "pdf" as const },
  { id: "certification-report", label: "Certification Report", format: "pdf" as const },
  { id: "pre-audit-report", label: "Pre-Audit Report", format: "pdf" as const },
  { id: "integrity-report", label: "Integrity Report", format: "pdf" as const },
  { id: "compliance-csv", label: "Compliance CSV", format: "csv" as const },
  { id: "compliance-xlsx", label: "Compliance XLSX", format: "xlsx" as const },
  { id: "compliance-json", label: "Compliance JSON", format: "json" as const },
] as const;

export const CERTIFICATION_READINESS_ITEMS = [
  { id: "rovexo-trust", label: "ROVEXO TRUST" },
  { id: "iso-27001", label: "ISO/IEC 27001" },
  { id: "soc2", label: "SOC 2" },
  { id: "cyber-essentials", label: "Cyber Essentials" },
  { id: "cyber-essentials-plus", label: "Cyber Essentials Plus" },
  { id: "pci-dss", label: "PCI DSS" },
  { id: "gdpr", label: "GDPR" },
  { id: "internal-standards", label: "Internal Standards" },
] as const;

/** @deprecated Use CERTIFICATION_READINESS_ITEMS — kept for backward compatibility */
export const CERTIFICATION_DASHBOARD_ITEMS = CERTIFICATION_READINESS_ITEMS;

export const COMPLIANCE_POLICIES = [
  { id: "data-retention", label: "Data Retention Policy", category: "retention", owner: "Compliance Team" },
  { id: "access-control", label: "Access Control Policy", category: "security", owner: "Security Team" },
  { id: "incident-response", label: "Incident Response Policy", category: "operations", owner: "Operations Team" },
  { id: "export-control", label: "Export Control Policy", category: "compliance", owner: "Compliance Team" },
  { id: "backup-recovery", label: "Backup & Recovery Policy", category: "infrastructure", owner: "Recovery Team" },
  { id: "privacy-gdpr", label: "Privacy & GDPR Policy", category: "privacy", owner: "Legal Team" },
] as const;

export const COMPLIANCE_FILTER_LABELS = [
  "Date", "User", "Module", "Certification", "Severity", "Status", "Evidence", "Compliance Standard", "Approval Status",
] as const;

export const READINESS_TARGET_SCORE = 90;

export const INCIDENT_TIMELINE_ROUTES = [
  { id: "live", label: "Live", href: "/super-admin/incidents/timeline" },
  { id: "history", label: "History", href: "/super-admin/incidents/timeline/history" },
  { id: "search", label: "Search", href: "/super-admin/incidents/timeline/search" },
  { id: "export", label: "Export", href: "/super-admin/incidents/timeline/export" },
] as const;

export const DETECTION_ENGINES = [
  "OMEGA",
  "Guardian Enterprise X",
  "Sentinel X",
  "Antivirus Engine X",
  "ORI",
  "Infrastructure Engine",
  "Disaster Recovery Engine",
  "Identity Engine",
  "Payment Engine",
  "Wallet Engine",
  "Monitoring Engine",
  "Operations Center",
] as const;

export const INCIDENT_TIMELINE_EXPORT_TYPES = [
  { id: "timeline-pdf", label: "Incident Timeline PDF", format: "pdf" as const },
  { id: "timeline-csv", label: "Incident Timeline CSV", format: "csv" as const },
  { id: "timeline-xlsx", label: "Incident Timeline XLSX", format: "xlsx" as const },
  { id: "executive-timeline", label: "Executive Timeline Report", format: "pdf" as const },
  { id: "audit-timeline", label: "Audit Timeline Report", format: "pdf" as const },
] as const;

export const TIMELINE_FILTER_LABELS = [
  "Date",
  "Severity",
  "Category",
  "Module",
  "Detection Engine",
  "Status",
  "Resolution State",
  "Approval State",
] as const;

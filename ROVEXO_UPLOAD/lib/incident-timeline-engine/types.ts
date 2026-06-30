import type { IncidentCategory, IncidentSeverity, IncidentStatus } from "@/lib/incident-command-center-engine/types";

export type IncidentTimelineTab = "live" | "history" | "search" | "export";

export type DetectionEngine =
  | "OMEGA"
  | "Guardian Enterprise X"
  | "Sentinel X"
  | "Antivirus Engine X"
  | "ORI"
  | "Infrastructure Engine"
  | "Disaster Recovery Engine"
  | "Identity Engine"
  | "Payment Engine"
  | "Wallet Engine"
  | "Monitoring Engine"
  | "Operations Center";

export type TimelineActionRecord = {
  id: string;
  action: string;
  executedAt: string;
  result: string;
  source: string;
  automatic: boolean;
  rollbackAvailable: boolean;
};

export type TimelineApprovalRecord = {
  id: string;
  approvedBy: string;
  approvedAt: string;
  method: string;
  biometricConfirmed: boolean;
  mfaConfirmed: boolean;
};

export type TimelineResolution = {
  resolved: boolean;
  resolutionTime: string | null;
  resolutionMethod: string;
  totalDurationMinutes: number | null;
  preventiveActions: string;
  lessonsLearned: string;
};

export type TimelineEntry = {
  id: string;
  incidentId: string;
  date: string;
  time: string;
  timestamp: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  module: string;
  status: IncidentStatus;
  title: string;
  detectionTime: string;
  detectionEngine: DetectionEngine;
  detectionMethod: string;
  affectedModule: string;
  impactLevel: string;
  rootCause: string | null;
  evidence: string;
  recommendedAction: string;
  resolutionStatus: string;
  resolutionTime: string | null;
  totalDurationMinutes: number | null;
  actionHistory: TimelineActionRecord[];
  approvalHistory: TimelineApprovalRecord[];
  resolution: TimelineResolution | null;
  immutable: true;
  sourceHash: string;
};

export type IncidentTimelineOriAnalysis = {
  incidentSummary: string;
  recurringPatterns: string[];
  relatedIncidentIds: string[];
  preventiveRecommendations: string[];
  riskTrend: string;
  confirmedFindings: string[];
  aiSuggestions: string[];
  confidence: "high" | "medium" | "low";
};

export type OmegaTimelineIntegrity = {
  timelineIntegrity: "verified" | "warning" | "failed";
  missingEvents: number;
  duplicateEvents: number;
  auditConsistency: "consistent" | "warning" | "inconsistent";
  logSynchronization: "synced" | "pending" | "out-of-sync";
  retentionPolicy: string;
  lastVerifiedAt: string;
  issues: string[];
};

export type IncidentTimelineFilters = {
  dateFrom?: string;
  dateTo?: string;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  module?: string;
  detectionEngine?: DetectionEngine;
  status?: IncidentStatus;
  resolutionState?: "resolved" | "open" | "all";
  approvalState?: "approved" | "pending" | "all";
  query?: string;
};

export type IncidentTimelineExportRecord = {
  id: string;
  label: string;
  format: "pdf" | "csv" | "xlsx";
  generatedAt: string;
  generatedBy?: string;
};

export type IncidentTimelineSettings = {
  retentionDays: number;
  liveRefreshSeconds: number;
  requireMfaForExport: boolean;
  appendOnly: boolean;
};

export type PersistedTimelineRecord = {
  id: string;
  incidentId: string;
  timestamp: string;
  eventType: string;
  detail: string;
  actorId: string;
  sourceHash: string;
};

export type IncidentTimelineSnapshot = {
  scannedAt: string;
  entries: TimelineEntry[];
  filteredEntries: TimelineEntry[];
  oriAnalysis: IncidentTimelineOriAnalysis;
  omegaIntegrity: OmegaTimelineIntegrity;
  exports: IncidentTimelineExportRecord[];
  settings: IncidentTimelineSettings;
  stats: {
    total: number;
    today: number;
    critical: number;
    resolved: number;
    open: number;
  };
  integrations: Record<string, boolean>;
};

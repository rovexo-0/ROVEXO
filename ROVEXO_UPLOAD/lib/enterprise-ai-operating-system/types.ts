import type {
  PREDICTION_TYPES,
  SCAN_MODES,
  SCAN_TARGET_TYPES,
  SENTINEL_MONITOR_TYPES,
  SELF_HEALING_ISSUE_TYPES,
} from "@/lib/enterprise-ai-operating-system/registry";

export type AiOsTab = "dashboard" | "scan" | "sentinel" | "omega" | "predictions" | "repairs" | "history" | "logs";
export type ScanTargetType = (typeof SCAN_TARGET_TYPES)[number];
export type ScanMode = (typeof SCAN_MODES)[number];
export type SentinelMonitorType = (typeof SENTINEL_MONITOR_TYPES)[number];
export type PredictionType = (typeof PREDICTION_TYPES)[number];
export type SelfHealingIssueType = (typeof SELF_HEALING_ISSUE_TYPES)[number];

export type ScanReport = {
  id: string;
  mode: ScanMode;
  targets: ScanTargetType[];
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  findings: number;
  score: number;
  summary: string;
};

export type SentinelAlert = {
  id: string;
  type: SentinelMonitorType;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  detectedAt: string;
  resolved: boolean;
};

export type SentinelScores = {
  securityScore: number;
  trustScore: number;
  marketplaceRisk: number;
  infrastructureRisk: number;
};

export type OmegaRecommendation = {
  id: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  title: string;
  description: string;
  moduleId: string;
  confidence: number;
  createdAt: string;
};

export type AiPrediction = {
  id: string;
  type: PredictionType;
  horizon: "24h" | "7d" | "30d";
  value: number;
  unit: string;
  confidence: number;
  trend: "up" | "down" | "stable";
  generatedAt: string;
};

export type RepairPlan = {
  id: string;
  issueType: SelfHealingIssueType;
  title: string;
  description: string;
  workflowId?: string;
  status: "pending-approval" | "approved" | "running" | "completed" | "cancelled" | "rejected";
  requiresApproval: boolean;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
};

export type AiModelStatus = {
  id: string;
  name: string;
  provider: string;
  status: "healthy" | "degraded" | "offline";
  latencyMs: number;
  lastChecked: string;
};

export type AiOsSettings = {
  scanIntervalMinutes: number;
  sentinelEnabled: boolean;
  omegaEnabled: boolean;
  selfHealingEnabled: boolean;
  approvalRequiredForRepairs: boolean;
  learningEnabled: boolean;
  maxConcurrentScans: number;
};

export type AiOsDashboard = {
  aiStatus: "healthy" | "warning" | "critical";
  aiHealthScore: number;
  activeScans: number;
  sentinelAlerts: number;
  pendingRepairs: number;
  predictionsCount: number;
  recommendationsCount: number;
  learningStatus: "active" | "paused" | "disabled";
  automationQueue: number;
};

export type AiOsState = {
  scans: ScanReport[];
  alerts: SentinelAlert[];
  recommendations: OmegaRecommendation[];
  predictions: AiPrediction[];
  repairs: RepairPlan[];
  models: AiModelStatus[];
  incidents: { id: string; title: string; severity: string; moduleId: string; createdAt: string }[];
};

export type AiOsSnapshot = {
  tab: AiOsTab;
  dashboard: AiOsDashboard;
  sentinelScores: SentinelScores;
  scans: ScanReport[];
  alerts: SentinelAlert[];
  recommendations: OmegaRecommendation[];
  predictions: AiPrediction[];
  repairs: RepairPlan[];
  models: AiModelStatus[];
  incidents: AiOsState["incidents"];
  history: { id: string; action: string; actor: string; timestamp: string }[];
  auditLog: { id: string; action: string; actor: string; target: string; timestamp: string }[];
  featureFlags: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};

export type AiWidgetStatus = {
  widget: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  score: number;
  label: string;
};

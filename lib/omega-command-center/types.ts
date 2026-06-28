import type {
  ATLAS_ENGINE_TABS,
  ENTERPRISE_HEALTH_DOMAINS,
  ENTERPRISE_SCAN_PHASES,
  GUARDIAN_ENGINE_TABS,
  LIVE_MONITOR_WIDGETS,
  OMEGA_AI_ENGINES,
  OMEGA_SCAN_TYPES,
  ORACLE_ENGINE_TABS,
  PHOENIX_ENGINE_TABS,
  REPORT_EXPORT_FORMATS,
  SCAN_ENGINE_TABS,
  SENTINEL_ENGINE_TABS,
  TITAN_ENGINE_TABS,
} from "@/lib/omega-command-center/registry";

export type OmegaEngineId = (typeof OMEGA_AI_ENGINES)[number];
export type OmegaEngineStatus = "running" | "waiting" | "completed" | "failed" | "paused";
export type EnterpriseHealthDomain = (typeof ENTERPRISE_HEALTH_DOMAINS)[number];
export type OmegaScanType = (typeof OMEGA_SCAN_TYPES)[number];
export type EnterpriseScanPhase = (typeof ENTERPRISE_SCAN_PHASES)[number];
export type LiveMonitorWidget = (typeof LIVE_MONITOR_WIDGETS)[number];
export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

export type ScanEngineTab = (typeof SCAN_ENGINE_TABS)[number];
export type SentinelEngineTab = (typeof SENTINEL_ENGINE_TABS)[number];
export type OracleEngineTab = (typeof ORACLE_ENGINE_TABS)[number];
export type PhoenixEngineTab = (typeof PHOENIX_ENGINE_TABS)[number];
export type TitanEngineTab = (typeof TITAN_ENGINE_TABS)[number];
export type AtlasEngineTab = (typeof ATLAS_ENGINE_TABS)[number];
export type GuardianEngineTab = (typeof GUARDIAN_ENGINE_TABS)[number];

export type OmegaEngineState = {
  id: OmegaEngineId;
  label: string;
  status: OmegaEngineStatus;
  health: "healthy" | "warning" | "critical";
  lastRunAt?: string;
  progress?: number;
};

export type EnterpriseHealthCard = {
  domain: EnterpriseHealthDomain;
  label: string;
  score: number;
  status: "healthy" | "warning" | "critical";
};

export type OmegaTimelineEntry = {
  id: string;
  timestamp: string;
  engine: OmegaEngineId | "omega";
  message: string;
  severity: "info" | "warning" | "critical" | "success";
};

export type OmegaRecommendation = {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  risk: number;
  cost: number;
  impact: number;
  repairTimeMinutes: number;
  actions: Array<"analyze" | "preview" | "auto-repair" | "manual-repair" | "ignore" | "create-incident" | "deploy-fix">;
};

export type OmegaExecutiveReport = {
  id: string;
  enterpriseScore: number;
  generatedAt: string;
  executiveSummary: string;
  riskSummary: string;
  repairQueueCount: number;
};

export type LiveMonitorReading = {
  widget: LiveMonitorWidget;
  label: string;
  value: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
};

export type OmegaScanProgress = {
  scanId: string;
  type: OmegaScanType;
  status: "queued" | "running" | "completed" | "paused" | "cancelled";
  currentPhase?: EnterpriseScanPhase;
  currentEngine?: OmegaEngineId;
  phasesCompleted: EnterpriseScanPhase[];
  enginesCompleted: OmegaEngineId[];
  startedAt: string;
  completedAt?: string;
};

export type OmegaSettings = {
  mfaRequiredForRepair: boolean;
  mfaRequiredForDeploy: boolean;
  autoOrchestrationEnabled: boolean;
  enterpriseSearchEnabled: boolean;
  liveMonitorIntervalSeconds: number;
};

export type OmegaDashboard = {
  enterpriseScore: number;
  healthCards: EnterpriseHealthCard[];
  engineStates: OmegaEngineState[];
  activeScan?: OmegaScanProgress;
  recommendations: OmegaRecommendation[];
  executiveReport?: OmegaExecutiveReport;
  timeline: OmegaTimelineEntry[];
  liveMonitor: LiveMonitorReading[];
};

export type OmegaSnapshot = {
  dashboard: OmegaDashboard;
  settings: OmegaSettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "failed"; score: number; message: string };
};

export type OmegaEngineSnapshot = {
  engine: OmegaEngineId;
  tab: string;
  items: Array<{ id: string; label: string; value: string; status?: string }>;
  score: number;
};

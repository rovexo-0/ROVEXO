import type {
  ALERT_TYPES,
  CAPACITY_FORECASTS,
  DIAGNOSTIC_DOMAINS,
  EXPORT_FORMATS,
  HEALTH_DASHBOARD_METRICS,
  MONITORING_SUBSYSTEMS,
  OMEGA_FEED_TYPES,
  REPORT_TYPES,
  TELEMETRY_METRICS,
  TIMELINE_EVENT_TYPES,
  TOPOLOGY_NODE_TYPES,
} from "@/lib/enterprise-observability-center/registry";

export type ObservabilityTab =
  | "dashboard"
  | "monitoring"
  | "telemetry"
  | "alerts"
  | "topology"
  | "diagnostics"
  | "timeline"
  | "capacity"
  | "omega"
  | "reports";

export type MonitoringSubsystem = (typeof MONITORING_SUBSYSTEMS)[number];
export type HealthMetricKey = (typeof HEALTH_DASHBOARD_METRICS)[number];
export type TelemetryMetricKey = (typeof TELEMETRY_METRICS)[number];
export type AlertType = (typeof ALERT_TYPES)[number];
export type DiagnosticDomain = (typeof DIAGNOSTIC_DOMAINS)[number];
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];
export type CapacityForecastKey = (typeof CAPACITY_FORECASTS)[number];
export type TopologyNodeType = (typeof TOPOLOGY_NODE_TYPES)[number];
export type OmegaFeedType = (typeof OMEGA_FEED_TYPES)[number];
export type ReportType = (typeof REPORT_TYPES)[number];
export type ObservabilityExportFormat = (typeof EXPORT_FORMATS)[number];
export type ObservabilityStatus = "pass" | "warning" | "fail" | "pending" | "running" | "degraded" | "healthy" | "critical";

export type ObservabilityDashboard = {
  platformHealth: number;
  availability: number;
  activeAlerts: number;
  openIncidents: number;
  enterpriseScore: number;
  telemetryFreshness: number;
  omegaSyncStatus: ObservabilityStatus;
};

export type HealthMetric = {
  key: HealthMetricKey;
  label: string;
  score: number;
  status: ObservabilityStatus;
  trend: "up" | "down" | "stable";
  lastCheckedAt: string;
};

export type SubsystemMonitor = {
  id: MonitoringSubsystem;
  label: string;
  status: ObservabilityStatus;
  latencyMs: number;
  errorRate: number;
  uptime: number;
  lastCheckedAt: string;
};

export type TelemetryReading = {
  key: TelemetryMetricKey;
  label: string;
  value: number;
  unit: string;
  status: ObservabilityStatus;
  trend: "up" | "down" | "stable";
  capturedAt: string;
};

export type SmartAlert = {
  id: string;
  type: AlertType;
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  target: string;
  status: ObservabilityStatus;
  detectedAt: string;
  acknowledged: boolean;
};

export type TopologyNode = {
  id: string;
  label: string;
  type: TopologyNodeType;
  status: ObservabilityStatus;
  latencyMs: number;
  trafficRps: number;
  dependencies: string[];
  dependents: string[];
};

export type DiagnosticResult = {
  id: string;
  domain: DiagnosticDomain;
  label: string;
  status: ObservabilityStatus;
  findings: number;
  durationMs: number;
  lastRunAt: string;
  summary: string;
};

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  timestamp: string;
  moduleId?: string;
};

export type CapacityForecast = {
  key: CapacityForecastKey;
  label: string;
  currentUsage: number;
  projectedUsage: number;
  horizonDays: number;
  status: ObservabilityStatus;
  recommendation: string;
};

export type OmegaFeedItem = {
  id: string;
  feedType: OmegaFeedType;
  label: string;
  payload: string;
  status: ObservabilityStatus;
  syncedAt: string;
};

export type ObservabilityReport = {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  status: ObservabilityStatus;
};

export type ObservabilityAuditEntry = {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  result: ObservabilityStatus;
};

export type ObservabilitySettings = {
  liveMonitoringEnabled: boolean;
  telemetryCaptureEnabled: boolean;
  alertEngineEnabled: boolean;
  readOnlyMonitoring: boolean;
  syncWithOmega: boolean;
  syncWithIncidentResponse: boolean;
};

export type ObservabilityState = {
  dashboard: ObservabilityDashboard;
  healthMetrics: HealthMetric[];
  subsystems: SubsystemMonitor[];
  telemetry: TelemetryReading[];
  alerts: SmartAlert[];
  topology: TopologyNode[];
  diagnostics: DiagnosticResult[];
  timeline: TimelineEvent[];
  capacityForecasts: CapacityForecast[];
  omegaFeed: OmegaFeedItem[];
  reports: ObservabilityReport[];
  auditEntries: ObservabilityAuditEntry[];
};

export type ObservabilitySnapshot = ObservabilityState & {
  tab: ObservabilityTab;
  settings: ObservabilitySettings;
  history: Array<{ id: string; action: string; actor: string; timestamp: string }>;
  auditLog: Array<{ id: string; action: string; actor: string; target: string; timestamp: string }>;
  featureFlagsConfig: Record<string, boolean>;
  pendingPublish: boolean;
  health: { status: "healthy" | "warning" | "critical" | "failed"; score: number; message: string };
};

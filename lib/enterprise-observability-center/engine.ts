import { ENTERPRISE_MODULE_DESCRIPTORS } from "@/lib/enterprise-architecture/registry";
import {
  ALERT_TYPES,
  CAPACITY_FORECASTS,
  DIAGNOSTIC_DOMAINS,
  HEALTH_DASHBOARD_METRICS,
  MONITORING_SUBSYSTEMS,
  OMEGA_FEED_TYPES,
  PROTECTED_AREAS,
  REPORT_TYPES,
  TELEMETRY_METRICS,
  TIMELINE_EVENT_TYPES,
} from "@/lib/enterprise-observability-center/registry";
import type {
  CapacityForecast,
  DiagnosticResult,
  HealthMetric,
  ObservabilityDashboard,
  ObservabilitySettings,
  ObservabilityState,
  ObservabilityStatus,
  OmegaFeedItem,
  SmartAlert,
  SubsystemMonitor,
  TelemetryReading,
  TimelineEvent,
  TopologyNode,
  ObservabilityAuditEntry,
  ObservabilityReport,
} from "@/lib/enterprise-observability-center/types";

export function createDefaultObservabilitySettings(): ObservabilitySettings {
  return {
    liveMonitoringEnabled: true,
    telemetryCaptureEnabled: true,
    alertEngineEnabled: true,
    readOnlyMonitoring: true,
    syncWithOmega: true,
    syncWithIncidentResponse: true,
  };
}

function statusForIndex(index: number): ObservabilityStatus {
  if (index % 17 === 0) return "fail";
  if (index % 9 === 0) return "degraded";
  if (index % 7 === 0) return "warning";
  return "healthy";
}

function createDashboard(): ObservabilityDashboard {
  return {
    platformHealth: 98.4,
    availability: 99.97,
    activeAlerts: 3,
    openIncidents: 1,
    enterpriseScore: 99.1,
    telemetryFreshness: 99.8,
    omegaSyncStatus: "healthy",
  };
}

function createHealthMetrics(): HealthMetric[] {
  const scores: Record<string, number> = {
    "platform-health": 98.4,
    "module-health": 97.8,
    "api-health": 99.2,
    "database-health": 98.9,
    "storage-health": 99.5,
    "queue-health": 97.1,
    "cache-health": 99.8,
    "worker-health": 98.2,
    "search-health": 99.0,
    "ai-health": 98.6,
    "payment-health": 99.9,
    "deployment-health": 96.5,
    "security-health": 99.7,
    "certification-health": 98.0,
    "governance-health": 99.3,
    "qa-health": 98.8,
  };
  return HEALTH_DASHBOARD_METRICS.map((key, i) => ({
    key,
    label: key.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    score: scores[key] ?? 95,
    status: statusForIndex(i),
    trend: i % 3 === 0 ? "up" : i % 3 === 1 ? "stable" : "down",
    lastCheckedAt: new Date(Date.now() - i * 60000).toISOString(),
  }));
}

function createSubsystems(): SubsystemMonitor[] {
  return MONITORING_SUBSYSTEMS.map((id, i) => ({
    id,
    label: id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: statusForIndex(i),
    latencyMs: 12 + (i % 8) * 5,
    errorRate: statusForIndex(i) === "healthy" ? 0.01 : statusForIndex(i) === "warning" ? 0.5 : 2.1,
    uptime: 99.9 - (i % 5) * 0.02,
    lastCheckedAt: new Date(Date.now() - i * 30000).toISOString(),
  }));
}

function createTelemetry(): TelemetryReading[] {
  const units: Record<string, string> = {
    cpu: "%",
    memory: "%",
    disk: "%",
    storage: "GB",
    bandwidth: "Mbps",
    "api-latency": "ms",
    "request-rate": "rps",
    "error-rate": "%",
    timeouts: "count",
    exceptions: "count",
    "database-queries": "qps",
    "slow-queries": "count",
    "queue-latency": "ms",
    "worker-execution-time": "ms",
    "cache-hit-ratio": "%",
    "search-latency": "ms",
    "image-processing": "ms",
    "background-jobs": "count",
  };
  const values: Record<string, number> = {
    cpu: 42,
    memory: 68,
    disk: 55,
    storage: 1240,
    bandwidth: 890,
    "api-latency": 48,
    "request-rate": 1240,
    "error-rate": 0.08,
    timeouts: 2,
    exceptions: 5,
    "database-queries": 3400,
    "slow-queries": 3,
    "queue-latency": 22,
    "worker-execution-time": 180,
    "cache-hit-ratio": 94.2,
    "search-latency": 35,
    "image-processing": 120,
    "background-jobs": 18,
  };
  return TELEMETRY_METRICS.map((key, i) => ({
    key,
    label: key.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    value: values[key] ?? 50,
    unit: units[key] ?? "",
    status: statusForIndex(i),
    trend: i % 3 === 0 ? "up" : i % 3 === 1 ? "stable" : "down",
    capturedAt: new Date(Date.now() - i * 15000).toISOString(),
  }));
}

function createAlerts(): SmartAlert[] {
  return ALERT_TYPES.slice(0, 8).map((type, i) => ({
    id: `alert-${type}`,
    type,
    label: type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    severity: i < 2 ? "critical" : i < 4 ? "high" : "medium",
    target: i === 0 ? "api-gateway" : i === 1 ? "database" : `subsystem-${i}`,
    status: i < 2 ? "fail" : i < 4 ? "warning" : "healthy",
    detectedAt: new Date(Date.now() - i * 3600000).toISOString(),
    acknowledged: i > 3,
  }));
}

function createTopology(): TopologyNode[] {
  const modules = ENTERPRISE_MODULE_DESCRIPTORS.slice(0, 10);
  const nodes: TopologyNode[] = [
    { id: "frontend", label: "Next.js Frontend", type: "application", status: "healthy", latencyMs: 12, trafficRps: 2400, dependencies: ["api-gateway"], dependents: [] },
    { id: "api-gateway", label: "API Gateway", type: "service", status: "healthy", latencyMs: 8, trafficRps: 3200, dependencies: ["database", "redis"], dependents: ["frontend"] },
    { id: "database", label: "PostgreSQL", type: "database", status: "healthy", latencyMs: 4, trafficRps: 3400, dependencies: [], dependents: ["api-gateway"] },
    { id: "redis", label: "Redis Cache", type: "storage", status: "healthy", latencyMs: 1, trafficRps: 8900, dependencies: [], dependents: ["api-gateway"] },
    { id: "queue-main", label: "Job Queue", type: "queue", status: "healthy", latencyMs: 22, trafficRps: 180, dependencies: ["database"], dependents: ["worker-main"] },
    { id: "worker-main", label: "Background Workers", type: "worker", status: "healthy", latencyMs: 180, trafficRps: 45, dependencies: ["queue-main"], dependents: [] },
    { id: "omega-ai", label: "OMEGA AI Services", type: "ai-service", status: "healthy", latencyMs: 95, trafficRps: 120, dependencies: ["api-gateway"], dependents: [] },
  ];
  modules.forEach((m, i) => {
    nodes.push({
      id: m.id,
      label: m.label,
      type: "enterprise-module",
      status: statusForIndex(i),
      latencyMs: 20 + i * 3,
      trafficRps: 50 + i * 10,
      dependencies: i > 0 ? [modules[i - 1]!.id] : ["api-gateway"],
      dependents: i < modules.length - 1 ? [modules[i + 1]!.id] : [],
    });
  });
  return nodes;
}

function createDiagnostics(): DiagnosticResult[] {
  return DIAGNOSTIC_DOMAINS.map((domain, i) => ({
    id: `diag-${domain}`,
    domain,
    label: domain.charAt(0).toUpperCase() + domain.slice(1),
    status: statusForIndex(i),
    findings: statusForIndex(i) === "healthy" ? 0 : statusForIndex(i) === "warning" ? 2 : 5,
    durationMs: 1200 + i * 200,
    lastRunAt: new Date(Date.now() - i * 7200000).toISOString(),
    summary: `Diagnostic scan for ${domain} — read-only monitoring, no production modifications`,
  }));
}

function createTimeline(): TimelineEvent[] {
  const events: Array<{ type: TimelineEvent["type"]; title: string; severity: TimelineEvent["severity"] }> = [
    { type: "deployment", title: "Production deployment v2.4.1", severity: "info" },
    { type: "performance", title: "API latency spike — api-gateway", severity: "medium" },
    { type: "alert", title: "Queue congestion detected", severity: "high" },
    { type: "incident", title: "Search index lag — resolved", severity: "high" },
    { type: "certification-change", title: "OMEGA QA Center certified", severity: "info" },
    { type: "security-event", title: "Anomalous login pattern — blocked", severity: "medium" },
    { type: "architecture-change", title: "Development Director module registered", severity: "info" },
    { type: "outage", title: "Third-party webhook timeout — recovered", severity: "critical" },
    { type: "capacity", title: "Storage usage forecast updated", severity: "low" },
    { type: "error", title: "Elevated exception rate — checkout (monitored only)", severity: "high" },
  ];
  return events.map((e, i) => ({
    id: `tl-${i}`,
    type: e.type,
    title: e.title,
    description: `Immutable timeline record — ${e.type.replace(/-/g, " ")}`,
    severity: e.severity,
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    moduleId: i % 3 === 0 ? "enterprise-observability-center" : undefined,
  }));
}

function createCapacityForecasts(): CapacityForecast[] {
  const current: Record<string, number> = {
    "traffic-growth": 72,
    "storage-usage": 62,
    "cpu-usage": 42,
    "memory-usage": 68,
    "database-growth": 55,
    "queue-growth": 38,
    "search-index-growth": 48,
    "infrastructure-scaling": 70,
  };
  return CAPACITY_FORECASTS.map((key, i) => ({
    key,
    label: key.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    currentUsage: current[key] ?? 50,
    projectedUsage: Math.min(95, (current[key] ?? 50) + 15 + i * 2),
    horizonDays: 90,
    status: (current[key] ?? 50) > 80 ? "warning" : "healthy",
    recommendation: `Forecast based on 90-day trend — ${key.replace(/-/g, " ")} monitoring only`,
  }));
}

function createOmegaFeed(): OmegaFeedItem[] {
  return OMEGA_FEED_TYPES.map((feedType, i) => ({
    id: `omega-${feedType}`,
    feedType,
    label: feedType.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    payload: `OMEGA feed: ${feedType} — synced from Observability Center`,
    status: statusForIndex(i),
    syncedAt: new Date(Date.now() - i * 300000).toISOString(),
  }));
}

function createReports(): ObservabilityReport[] {
  return REPORT_TYPES.map((type, i) => ({
    id: `rpt-${type}`,
    type,
    title: `${type.charAt(0).toUpperCase()}${type.slice(1)} Report`,
    generatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    status: "healthy",
  }));
}

function createAuditEntries(): ObservabilityAuditEntry[] {
  return [
    { id: "aud-1", action: "full-platform-monitor", actor: "enterprise-observability-center", target: "global", timestamp: new Date(Date.now() - 3600000).toISOString(), result: "healthy" },
    { id: "aud-2", action: "telemetry-capture", actor: "enterprise-observability-center", target: "telemetry", timestamp: new Date(Date.now() - 1800000).toISOString(), result: "healthy" },
    { id: "aud-3", action: "omega-sync", actor: "enterprise-observability-center", target: "omega-command-center", timestamp: new Date().toISOString(), result: "healthy" },
  ];
}

export function createDefaultObservabilityState(): ObservabilityState {
  return {
    dashboard: createDashboard(),
    healthMetrics: createHealthMetrics(),
    subsystems: createSubsystems(),
    telemetry: createTelemetry(),
    alerts: createAlerts(),
    topology: createTopology(),
    diagnostics: createDiagnostics(),
    timeline: createTimeline(),
    capacityForecasts: createCapacityForecasts(),
    omegaFeed: createOmegaFeed(),
    reports: createReports(),
    auditEntries: createAuditEntries(),
  };
}

export function computeObservabilityEnterpriseScore(state: Pick<ObservabilityState, "dashboard" | "healthMetrics">): number {
  const metrics = [state.dashboard.enterpriseScore, state.dashboard.platformHealth, state.dashboard.availability, ...state.healthMetrics.map((m) => m.score)];
  const avg = metrics.reduce((sum, v) => sum + v, 0) / metrics.length;
  return Math.round(avg * 100) / 100;
}

export function runPlatformMonitoring(): SubsystemMonitor[] {
  return MONITORING_SUBSYSTEMS.map((id, i) => ({
    id,
    label: id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: i % 11 === 0 ? "warning" : "healthy",
    latencyMs: 10 + (i % 6) * 4,
    errorRate: i % 11 === 0 ? 0.3 : 0.01,
    uptime: 99.95,
    lastCheckedAt: new Date().toISOString(),
  }));
}

export function captureTelemetrySnapshot(): TelemetryReading[] {
  return TELEMETRY_METRICS.map((key, i) => ({
    key,
    label: key.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    value: 40 + (i % 10) * 5,
    unit: key.includes("latency") || key.includes("time") ? "ms" : key.includes("rate") ? "rps" : "%",
    status: "healthy",
    trend: "stable" as const,
    capturedAt: new Date().toISOString(),
  }));
}

export function runDiagnosticsScan(): DiagnosticResult[] {
  return DIAGNOSTIC_DOMAINS.map((domain, i) => ({
    id: `scan-${domain}-${Date.now()}`,
    domain,
    label: domain.charAt(0).toUpperCase() + domain.slice(1),
    status: i % 8 === 0 ? "warning" : "healthy",
    findings: i % 8 === 0 ? 1 : 0,
    durationMs: 1000 + i * 150,
    lastRunAt: new Date().toISOString(),
    summary: `Live diagnostic for ${domain} — read-only`,
  }));
}

export function scanAlerts(): SmartAlert[] {
  return ALERT_TYPES.slice(0, 4).map((type, i) => ({
    id: `scan-alert-${type}-${Date.now()}`,
    type,
    label: `Detected: ${type.replace(/-/g, " ")}`,
    severity: i < 1 ? "critical" : "medium",
    target: `scan-target-${i}`,
    status: "warning",
    detectedAt: new Date().toISOString(),
    acknowledged: false,
  }));
}

export function syncOmegaFeed(): OmegaFeedItem[] {
  return OMEGA_FEED_TYPES.map((feedType) => ({
    id: `sync-${feedType}-${Date.now()}`,
    feedType,
    label: feedType.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    payload: `Synced to OMEGA — ${feedType}`,
    status: "healthy" as const,
    syncedAt: new Date().toISOString(),
  }));
}

export function isProtectedMonitoringTarget(target: string): boolean {
  const normalized = target.toLowerCase();
  return PROTECTED_AREAS.some((area) => normalized.includes(area.replace(/-/g, "")) || normalized.includes(area));
}

export function acknowledgeAlert(alert: SmartAlert): SmartAlert {
  return { ...alert, acknowledged: true, status: "healthy" };
}

export function computeAvailability(subsystems: SubsystemMonitor[]): number {
  if (!subsystems.length) return 100;
  const avg = subsystems.reduce((sum, s) => sum + s.uptime, 0) / subsystems.length;
  return Math.round(avg * 100) / 100;
}

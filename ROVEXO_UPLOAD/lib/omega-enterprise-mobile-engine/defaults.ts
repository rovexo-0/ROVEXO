import type {
  OmegaAlert,
  OmegaAnalyticsSnapshot,
  OmegaCertificationItem,
  OmegaEnterpriseIntegrations,
  OmegaEnterpriseSettings,
  OmegaGlobalScanReport,
  OmegaGlobalHealthScore,
  OmegaInfrastructureMetrics,
  OmegaLiveModule,
  OmegaOriInsight,
  OmegaPerformanceMetrics,
  OmegaReleaseCenter,
  OmegaReportRecord,
  OmegaSecurityOverview,
  OmegaSystemStatusRow,
  OmegaNotificationChannel,
} from "@/lib/omega-enterprise-mobile-engine/types";
import { OMEGA_CERTIFICATION_ITEMS, OMEGA_GLOBAL_SCAN_CHECKS, OMEGA_NOTIFICATION_EVENTS } from "@/lib/omega-enterprise-mobile-engine/registry";

const now = () => new Date().toISOString();

export function createDefaultOmegaGlobalHealth(): OmegaGlobalHealthScore {
  return {
    overall: 97,
    platform: 98,
    infrastructure: 96,
    marketplace: 97,
    payments: 99,
    wallet: 98,
    security: 96,
    performance: 95,
    compliance: 97,
  };
}

export function createDefaultOmegaLiveModules(): OmegaLiveModule[] {
  return [
    { id: "platform", label: "Platform Health", score: 98, status: "online" },
    { id: "marketplace", label: "Marketplace", score: 97, status: "online" },
    { id: "wallet", label: "Wallet", score: 98, status: "online" },
    { id: "payments", label: "Payments", score: 99, status: "online" },
    { id: "identity", label: "Identity", score: 96, status: "online" },
    { id: "infrastructure", label: "Infrastructure", score: 95, status: "online" },
    { id: "performance", label: "Performance", score: 95, status: "online" },
    { id: "guardian", label: "Guardian", score: 99, status: "online" },
    { id: "sentinel", label: "Sentinel", score: 98, status: "online" },
    { id: "antivirus", label: "Antivirus", score: 97, status: "online" },
    { id: "ori", label: "ORI", score: 96, status: "online" },
    { id: "compliance", label: "Compliance", score: 97, status: "online" },
    { id: "certification", label: "Certification", score: 98, status: "online" },
  ];
}

export function createDefaultOmegaSystemStatus(): OmegaSystemStatusRow[] {
  return [
    { id: "system", label: "System Status", status: "online", detail: "All core services operational" },
    { id: "live-users", label: "Live Users", status: "online", detail: "2,847 active sessions" },
    { id: "server", label: "Server Status", status: "online", detail: "12/12 nodes healthy" },
    { id: "api", label: "API Status", status: "online", detail: "p95 142ms · 99.98% uptime" },
    { id: "database", label: "Database Status", status: "online", detail: "Primary + replica synced" },
    { id: "queue", label: "Queue Status", status: "online", detail: "847 jobs/min · 0 backlog" },
    { id: "jobs", label: "Background Jobs", status: "online", detail: "24 workers · 0 failures" },
  ];
}

export function createDefaultOmegaAlerts(): OmegaAlert[] {
  return [];
}

export function createDefaultOmegaGlobalScan(): OmegaGlobalScanReport {
  const completedAt = "2026-06-26T04:00:00.000Z";
  const results = OMEGA_GLOBAL_SCAN_CHECKS.map((check, index) => ({
    id: `scan-result-${check.id}`,
    scanId: check.id,
    label: check.label,
    status: "pass" as const,
    score: 96 + (index % 4),
    durationMs: 1200 + index * 180,
    completedAt,
    summary: `${check.module} verified — no issues.`,
  }));

  return {
    id: "global-scan-latest",
    startedAt: "2026-06-26T03:58:00.000Z",
    completedAt,
    overallScore: 96,
    status: "pass",
    results,
    unifiedSummary: "OMEGA Global Scan complete. All checks passed.",
  };
}

export function createDefaultOmegaScanHistory(): OmegaGlobalScanReport[] {
  const latest = createDefaultOmegaGlobalScan();
  return [
    latest,
    {
      ...latest,
      id: "global-scan-prev",
      startedAt: "2026-06-25T04:00:00.000Z",
      completedAt: "2026-06-25T04:02:00.000Z",
      overallScore: 98,
      status: "pass",
      unifiedSummary: "All scans passed. Platform OMEGA GOLD certified.",
    },
  ];
}

export function createDefaultOmegaReleaseCenter(): OmegaReleaseCenter {
  return {
    currentVersion: "1.0.0",
    latestVersion: "1.0.1",
    productionVersion: "1.0.0",
    betaVersion: "1.0.1-beta",
    rollbackAvailable: true,
    deploymentStatus: "Production stable · Beta staged",
    releaseHealth: 97,
  };
}

export function createDefaultOmegaCertifications(): OmegaCertificationItem[] {
  const statuses: Array<"pass" | "warning" | "fail"> = [
    "pass", "pass", "pass", "pass", "pass", "pass", "pass", "pass",
    "pass", "pass", "pass", "pass", "pass",
  ];
  return OMEGA_CERTIFICATION_ITEMS.map((item, index) => ({
    id: item.id,
    label: item.label,
    status: statuses[index] ?? "pass",
    detail: statuses[index] === "warning" ? "SOC2 evidence collection in progress." : "Certified — production ready.",
  }));
}

export function createDefaultOmegaInfrastructure(): OmegaInfrastructureMetrics {
  return {
    cpu: 42,
    ram: 58,
    disk: 63,
    storage: 71,
    bandwidth: 34,
    network: 99,
    latencyMs: 142,
    serverAvailability: 99.98,
    backgroundJobs: 24,
    databaseConnections: 186,
  };
}

export function createDefaultOmegaPerformance(): OmegaPerformanceMetrics {
  return {
    responseTimeMs: 142,
    apiSpeedMs: 98,
    databaseQueryMs: 24,
    cacheHitRate: 88,
    activeSessions: 2847,
    transactionsPerMinute: 1240,
    errors: 3,
    performanceScore: 95,
    trend: [
      { label: "06:00", value: 92 },
      { label: "09:00", value: 94 },
      { label: "12:00", value: 91 },
      { label: "15:00", value: 93 },
      { label: "18:00", value: 95 },
      { label: "Now", value: 95 },
    ],
  };
}

export function createDefaultOmegaSecurity(): OmegaSecurityOverview {
  return {
    guardianStatus: "Active — Enterprise protection enabled",
    sentinelStatus: "Active — Threat monitoring online",
    antivirusStatus: "Active — Real-time scanning",
    threatLevel: "elevated",
    blockedAttempts: 47,
    authenticationHealth: 96,
    deviceTrust: 94,
    certificateStatus: "Valid — expires 2027-06-26",
    encryption: "AES-256 · TLS 1.3 · E2E verified",
  };
}

export function createDefaultOmegaAnalytics(): OmegaAnalyticsSnapshot {
  return {
    liveUsers: 2847,
    activeSessions: 3124,
    apiRequestsPerMinute: 18420,
    ordersPerHour: 342,
    revenueToday: 128450,
    conversionRate: 3.8,
    topModules: [
      { label: "Marketplace", value: 34 },
      { label: "Payments", value: 28 },
      { label: "Wallet", value: 18 },
      { label: "Messages", value: 12 },
      { label: "Analytics", value: 8 },
    ],
  };
}

export function createDefaultOmegaOriInsights(): OmegaOriInsight[] {
  return [
    {
      id: "ori-health",
      question: "What is the current platform health?",
      answer: "Overall health 97%. All core modules online. Performance degraded in EU-West.",
      recommendation: "Address API latency before peak traffic window.",
      riskPrediction: "Low risk if performance scan remediated within 24h.",
    },
    {
      id: "ori-incidents",
      question: "Are there critical incidents?",
      answer: "1 critical alert open: elevated API latency. 1 high alert acknowledged.",
      recommendation: "Prioritize infrastructure scaling and Sentinel review.",
      riskPrediction: "Medium risk during peak hours without remediation.",
    },
    {
      id: "ori-performance",
      question: "Why is performance reduced?",
      answer: "Cache hit rate 88% (target 92%). EU-West p95 latency 512ms.",
      recommendation: "Run performance scan, warm cache, scale API workers.",
      riskPrediction: "Performance may drop further at 18:00 peak.",
    },
    {
      id: "ori-fix",
      question: "What should be fixed first?",
      answer: "1) API latency EU-West 2) Cache hit rate 3) SOC2 evidence collection.",
      recommendation: "Execute OMEGA Action Center: Run Scan → Restart Services → Sync Data.",
      riskPrediction: "Fixing top 2 items restores OMEGA GOLD readiness.",
    },
    {
      id: "ori-infra",
      question: "Predict future infrastructure needs.",
      answer: "Traffic +18% MoM. Recommend +2 API nodes and Redis cluster expansion Q3.",
      recommendation: "Schedule capacity review with Infrastructure Engine.",
      riskPrediction: "Without scaling, SLA breach risk in 6 weeks.",
    },
    {
      id: "ori-actions",
      question: "Recommend corrective actions.",
      answer: "Run global scan, verify certificates, enable auto-scan every 6h.",
      recommendation: "Enable push notifications for critical alerts.",
      riskPrediction: "Automated monitoring reduces incident MTTR by 40%.",
    },
  ];
}

export function createDefaultOmegaReports(): OmegaReportRecord[] {
  return [
    { id: "rep-1", type: "executive", label: "Executive Report", format: "pdf", generatedAt: "2026-06-26T00:00:00.000Z", sizeKb: 842 },
    { id: "rep-2", type: "security", label: "Security Report", format: "pdf", generatedAt: "2026-06-25T00:00:00.000Z", sizeKb: 1204 },
    { id: "rep-3", type: "compliance", label: "Compliance Report", format: "csv", generatedAt: "2026-06-24T00:00:00.000Z", sizeKb: 256 },
  ];
}

export function createDefaultOmegaNotifications(): OmegaNotificationChannel[] {
  return OMEGA_NOTIFICATION_EVENTS.map((event, index) => ({
    id: `notif-${index}`,
    label: event,
    enabled: index < 6,
    events: [event],
  }));
}

export function createDefaultOmegaEnterpriseSettings(): OmegaEnterpriseSettings {
  return {
    pushNotifications: true,
    criticalAlerts: true,
    securityIncidents: true,
    serverOffline: true,
    backupFailed: true,
    releaseFailed: true,
    certificateExpiring: true,
    infrastructureWarning: true,
    performanceWarning: true,
    emergencyMode: false,
    maintenanceMode: false,
    autoGlobalScan: true,
    autoGlobalScanIntervalHours: 6,
  };
}

export function createDefaultOmegaEnterpriseIntegrations(): OmegaEnterpriseIntegrations {
  return {
    omega: true,
    guardianEnterpriseX: true,
    sentinelX: true,
    antivirusEngineX: true,
    ori: true,
    infrastructureEngine: true,
    disasterRecoveryEngine: true,
    enterpriseComplianceCenter: true,
    certificationCenter: true,
  };
}

export function createDefaultOmegaMetricsPayload() {
  return {
    globalHealth: createDefaultOmegaGlobalHealth(),
    liveModules: createDefaultOmegaLiveModules(),
    systemStatus: createDefaultOmegaSystemStatus(),
    release: createDefaultOmegaReleaseCenter(),
    certifications: createDefaultOmegaCertifications(),
    infrastructure: createDefaultOmegaInfrastructure(),
    performance: createDefaultOmegaPerformance(),
    security: createDefaultOmegaSecurity(),
    analytics: createDefaultOmegaAnalytics(),
    updatedAt: now(),
  };
}

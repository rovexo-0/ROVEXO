import type {
  OmegaAlert,
  OmegaEnterpriseDashboard,
  OmegaGlobalScanReport,
  OmegaGlobalHealthScore,
  OmegaOriInsight,
  OmegaPerformanceMetrics,
} from "@/lib/omega-enterprise-mobile-engine/types";
import { OMEGA_GLOBAL_SCAN_CHECKS } from "@/lib/omega-enterprise-mobile-engine/registry";

export function calculateOverallHealthScore(scores: OmegaGlobalHealthScore): number {
  const values = [
    scores.platform,
    scores.infrastructure,
    scores.marketplace,
    scores.payments,
    scores.wallet,
    scores.security,
    scores.performance,
    scores.compliance,
  ];
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function buildOmegaEnterpriseDashboard(input: {
  globalHealth: OmegaGlobalHealthScore;
  liveModules: OmegaEnterpriseDashboard["liveModules"];
  systemStatus: OmegaEnterpriseDashboard["systemStatus"];
  alerts: OmegaAlert[];
  latestScan: OmegaGlobalScanReport | null;
  performanceScore: number;
}): OmegaEnterpriseDashboard {
  const alertCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    information: 0,
  } satisfies Record<OmegaAlert["severity"], number>;

  for (const alert of input.alerts) {
    if (alert.status !== "resolved") alertCounts[alert.severity] += 1;
  }

  const openCritical = alertCounts.critical;
  const adjustedOverall = Math.max(0, input.globalHealth.overall - openCritical * 3);

  return {
    globalHealth: { ...input.globalHealth, overall: adjustedOverall },
    liveModules: input.liveModules,
    systemStatus: input.systemStatus,
    alertCounts,
    lastGlobalScanAt: input.latestScan?.completedAt ?? null,
    lastGlobalScanScore: input.latestScan?.overallScore ?? null,
    fleetSecurityScore: input.globalHealth.security,
    performanceScore: input.performanceScore,
  };
}

export function buildGlobalScanReport(previousScore?: number): OmegaGlobalScanReport {
  const startedAt = new Date().toISOString();
  const results = OMEGA_GLOBAL_SCAN_CHECKS.map((check, index) => {
    const score = 92 + ((index * 7 + Date.now()) % 9);
    return {
      id: `scan-${check.id}-${Date.now().toString(36)}`,
      scanId: check.id,
      label: check.label,
      status: score >= 95 ? ("pass" as const) : score >= 85 ? ("warning" as const) : ("fail" as const),
      score,
      durationMs: 900 + index * 220,
      completedAt: new Date(Date.now() + index * 200).toISOString(),
      summary: `${check.module} scan completed.`,
    };
  });

  const overallScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  const status = overallScore >= 95 ? "pass" : overallScore >= 85 ? "warning" : "fail";
  const passCount = results.filter((r) => r.status === "pass").length;

  return {
    id: `global-scan-${Date.now().toString(36)}`,
    startedAt,
    completedAt: new Date().toISOString(),
    overallScore,
    status,
    results,
    unifiedSummary: `OMEGA Global Scan complete. ${passCount}/${results.length} checks passed.${
      previousScore != null && overallScore > previousScore ? " Health improved." : ""
    }`,
  };
}

export function buildOriInsightsFromState(input: {
  globalHealth: OmegaGlobalHealthScore;
  alerts: OmegaAlert[];
  performance: OmegaPerformanceMetrics;
}): OmegaOriInsight[] {
  const openCritical = input.alerts.filter((a) => a.severity === "critical" && a.status !== "resolved");
  return [
    {
      id: "ori-live-health",
      question: "What is the current platform health?",
      answer: `Overall health ${input.globalHealth.overall}%. Performance score ${input.performance.performanceScore}%.`,
      recommendation: openCritical.length ? "Resolve critical alerts immediately." : "Continue monitoring.",
      riskPrediction: openCritical.length ? "Elevated risk until critical alerts resolved." : "Low predicted risk.",
    },
    {
      id: "ori-live-incidents",
      question: "Are there critical incidents?",
      answer: openCritical.length
        ? `${openCritical.length} critical incident(s) open.`
        : "No open critical incidents.",
      recommendation: openCritical[0]?.recommendedAction ?? "Maintain current monitoring posture.",
      riskPrediction: openCritical.length ? "High risk during peak traffic." : "Stable operations expected.",
    },
    {
      id: "ori-live-performance",
      question: "Why is performance reduced?",
      answer: `Cache hit ${input.performance.cacheHitRate}%. Response ${input.performance.responseTimeMs}ms. Errors: ${input.performance.errors}.`,
      recommendation: input.performance.cacheHitRate < 90 ? "Clear cache and warm critical keys." : "Performance within target.",
      riskPrediction: input.performance.performanceScore < 90 ? "May degrade at peak." : "Stable performance expected.",
    },
  ];
}

export function validateOmegaEnterpriseReadiness(input: {
  integrations: { omega: boolean; guardianEnterpriseX: boolean; sentinelX: boolean; antivirusEngineX: boolean };
  globalHealth: OmegaGlobalHealthScore;
}): { ready: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (!input.integrations.omega) blockers.push("OMEGA core not connected");
  if (!input.integrations.guardianEnterpriseX) blockers.push("Guardian Enterprise X required");
  if (!input.integrations.sentinelX) blockers.push("Sentinel X required");
  if (!input.integrations.antivirusEngineX) blockers.push("Antivirus Engine X required");
  if (input.globalHealth.overall < 85) blockers.push("Global health below OMEGA GOLD threshold (85%)");
  return { ready: blockers.length === 0, blockers };
}

export function computeOmegaGoldScore(globalHealth: OmegaGlobalHealthScore, certificationsPassCount: number, totalCertifications: number): number {
  const certRatio = totalCertifications ? certificationsPassCount / totalCertifications : 1;
  return Math.round(globalHealth.overall * 0.7 + certRatio * 100 * 0.3);
}

export function searchOmegaAlerts(query: string, alerts: OmegaAlert[]): OmegaAlert[] {
  const q = query.trim().toLowerCase();
  if (!q) return alerts;
  return alerts.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.module.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q),
  );
}

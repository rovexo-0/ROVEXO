import type { AiOsDashboard, AiOsSettings, AiOsState, AiWidgetStatus } from "@/lib/enterprise-ai-operating-system/types";
import { AI_DASHBOARD_WIDGETS } from "@/lib/enterprise-ai-operating-system/registry";
import { createDefaultAlerts, computeSentinelScores } from "@/lib/enterprise-ai-operating-system/sentinel";
import { generateAllPredictions } from "@/lib/enterprise-ai-operating-system/predictions";
import { generateOmegaRecommendations } from "@/lib/enterprise-ai-operating-system/omega";
import { runScan } from "@/lib/enterprise-ai-operating-system/scan";
import { pendingRepairs, createRepairPlan, detectSelfHealingIssues } from "@/lib/enterprise-ai-operating-system/self-healing";

export function createDefaultAiOsSettings(): AiOsSettings {
  return {
    scanIntervalMinutes: 60,
    sentinelEnabled: true,
    omegaEnabled: true,
    selfHealingEnabled: true,
    approvalRequiredForRepairs: true,
    learningEnabled: true,
    maxConcurrentScans: 3,
  };
}

export function createDefaultAiOsState(): AiOsState {
  const scans = [runScan("quick"), runScan("security")];
  const alerts = createDefaultAlerts();
  const recommendations = generateOmegaRecommendations(scans, alerts);
  const repairs = detectSelfHealingIssues().slice(0, 2).map((issue) => createRepairPlan(issue));
  return {
    scans,
    alerts,
    recommendations,
    predictions: generateAllPredictions().slice(0, 6),
    repairs,
    models: [
      { id: "model-local", name: "Local Assistant", provider: "ollama", status: "healthy", latencyMs: 120, lastChecked: new Date().toISOString() },
      { id: "model-cloud", name: "Cloud Orchestrator", provider: "openai", status: "healthy", latencyMs: 450, lastChecked: new Date().toISOString() },
    ],
    incidents: alerts.filter((a) => !a.resolved).map((a) => ({
      id: a.id,
      title: a.title,
      severity: a.severity,
      moduleId: "enterprise-ai-operating-system",
      createdAt: a.detectedAt,
    })),
  };
}

export function buildAiOsDashboard(state: AiOsState, settings: AiOsSettings): AiOsDashboard {
  const scores = computeSentinelScores(state.alerts);
  const openAlerts = state.alerts.filter((a) => !a.resolved).length;
  const aiHealthScore = Math.round((scores.securityScore + (state.scans[0]?.score ?? 80)) / 2);
  return {
    aiStatus: openAlerts > 2 ? "warning" : aiHealthScore > 70 ? "healthy" : "critical",
    aiHealthScore,
    activeScans: state.scans.filter((s) => s.status === "running").length,
    sentinelAlerts: openAlerts,
    pendingRepairs: pendingRepairs(state.repairs).length,
    predictionsCount: state.predictions.length,
    recommendationsCount: state.recommendations.length,
    learningStatus: settings.learningEnabled ? "active" : "disabled",
    automationQueue: state.recommendations.length,
  };
}

export function buildDashboardWidgets(state: AiOsState): AiWidgetStatus[] {
  const scores = computeSentinelScores(state.alerts);
  const scanScore = state.scans[0]?.score ?? 0;
  const map: Record<string, { score: number; label: string }> = {
    "ai-status": { score: Math.round((scanScore + scores.securityScore) / 2), label: "AI OS" },
    "sentinel-status": { score: scores.securityScore, label: "Sentinel" },
    "scan-status": { score: scanScore, label: "Scan" },
    "omega-status": { score: state.recommendations.length > 0 ? 85 : 70, label: "Omega" },
    "prediction-status": { score: 78, label: "Predictions" },
  };
  return AI_DASHBOARD_WIDGETS.map((widget) => {
    const data = map[widget] ?? { score: 0, label: widget };
    return {
      widget,
      score: data.score,
      label: data.label,
      status: data.score >= 80 ? "healthy" : data.score >= 50 ? "warning" : "critical",
    };
  });
}

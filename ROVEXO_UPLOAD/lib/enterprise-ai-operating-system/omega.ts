import type { OmegaRecommendation, RepairPlan, ScanReport, SentinelAlert } from "@/lib/enterprise-ai-operating-system/types";

export function generateOmegaRecommendations(
  scans: ScanReport[],
  alerts: SentinelAlert[],
): OmegaRecommendation[] {
  const recs: OmegaRecommendation[] = [];
  const lowScoreScan = scans.find((s) => s.score < 80);
  if (lowScoreScan) {
    recs.push({
      id: `omega-rec-${Date.now()}-1`,
      priority: "high",
      category: "scan",
      title: `Improve ${lowScoreScan.mode} scan score`,
      description: `Scan score ${lowScoreScan.score}% — review ${lowScoreScan.findings} findings`,
      moduleId: "enterprise-ai-operating-system",
      confidence: 0.88,
      createdAt: new Date().toISOString(),
    });
  }
  const openAlerts = alerts.filter((a) => !a.resolved && a.severity !== "info");
  if (openAlerts.length > 0) {
    recs.push({
      id: `omega-rec-${Date.now()}-2`,
      priority: openAlerts.some((a) => a.severity === "critical") ? "critical" : "medium",
      category: "sentinel",
      title: "Resolve open Sentinel alerts",
      description: `${openAlerts.length} unresolved alerts require attention`,
      moduleId: "enterprise-ai-operating-system",
      confidence: 0.92,
      createdAt: new Date().toISOString(),
    });
  }
  recs.push({
    id: `omega-rec-${Date.now()}-3`,
    priority: "low",
    category: "optimisation",
    title: "Schedule off-peak full platform scan",
    description: "Run full platform scan during low-traffic window",
    moduleId: "enterprise-workflow-engine",
    confidence: 0.75,
    createdAt: new Date().toISOString(),
  });
  return recs;
}

export function prioritizeRecommendations(recs: OmegaRecommendation[]): OmegaRecommendation[] {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...recs].sort((a, b) => order[a.priority] - order[b.priority]);
}

export function createRepairPlanFromRecommendation(rec: OmegaRecommendation): RepairPlan {
  return {
    id: `repair-${Date.now()}`,
    issueType: "configuration-drift",
    title: rec.title,
    description: rec.description,
    workflowId: "enterprise-workflow-engine",
    status: "pending-approval",
    requiresApproval: true,
    createdAt: new Date().toISOString(),
  };
}

export function runOmegaAnalysis(scans: ScanReport[], alerts: SentinelAlert[]) {
  const recommendations = prioritizeRecommendations(generateOmegaRecommendations(scans, alerts));
  const intelligenceScore = Math.round(
    (scans.reduce((s, r) => s + r.score, 0) / Math.max(scans.length, 1) +
      (100 - alerts.filter((a) => !a.resolved).length * 10)) /
      2,
  );
  return {
    recommendations,
    intelligenceScore: Math.max(0, Math.min(100, intelligenceScore)),
    decisions: recommendations.slice(0, 3).map((r) => r.title),
  };
}

export function allocateResources(recommendations: OmegaRecommendation[]): Record<string, number> {
  return recommendations.reduce<Record<string, number>>((acc, rec) => {
    acc[rec.moduleId] = (acc[rec.moduleId] ?? 0) + (rec.priority === "critical" ? 3 : rec.priority === "high" ? 2 : 1);
    return acc;
  }, {});
}

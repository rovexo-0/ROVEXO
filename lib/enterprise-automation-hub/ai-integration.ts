import type { AiAutomationInsight } from "@/lib/enterprise-automation-hub/types";
import { AI_AUTOMATION_SOURCES } from "@/lib/enterprise-automation-hub/registry";

export function generateAutomationAiInsights(): AiAutomationInsight[] {
  return [
    { id: "ai-scan-1", source: "scan", type: "suggestion", summary: "Pattern detected: duplicate order notifications — consolidate into single workflow", confidence: 87, workflowId: "wf-notification" },
    { id: "ai-scan-2", source: "scan", type: "suggestion", summary: "Unused event trigger on listing-updated — consider disabling", confidence: 72 },
    { id: "ai-sentinel-1", source: "sentinel", type: "risk", summary: "Payment automation lacks MFA gate on publish — recommend approval workflow", confidence: 94, workflowId: "wf-payment" },
    { id: "ai-sentinel-2", source: "sentinel", type: "suggestion", summary: "High failure rate on security automation — review timeout thresholds", confidence: 81, workflowId: "wf-security" },
    { id: "ai-omega-1", source: "omega", type: "optimization", summary: "Parallel execution could reduce avg duration by 34% for analytics sync", confidence: 89, workflowId: "wf-analytics" },
    { id: "ai-omega-2", source: "omega", type: "repair", summary: "Auto-repair available for failed exec-4 — missing retry handler", confidence: 76 },
    { id: "ai-omega-3", source: "omega", type: "recovery", summary: "Self-healing: rollback workflow v1.1.0 recommended for payment automation", confidence: 83, workflowId: "wf-payment" },
  ];
}

export function allAiSourcesPresent(insights: AiAutomationInsight[]): boolean {
  return AI_AUTOMATION_SOURCES.every((s) => insights.some((i) => i.source === s));
}

export function scanInsightCount(insights: AiAutomationInsight[]): number {
  return insights.filter((i) => i.source === "scan").length;
}

export function sentinelInsightCount(insights: AiAutomationInsight[]): number {
  return insights.filter((i) => i.source === "sentinel").length;
}

export function omegaInsightCount(insights: AiAutomationInsight[]): number {
  return insights.filter((i) => i.source === "omega").length;
}

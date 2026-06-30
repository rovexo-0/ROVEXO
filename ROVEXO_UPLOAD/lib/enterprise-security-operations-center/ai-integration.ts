import type { AiSecurityInsight } from "@/lib/enterprise-security-operations-center/types";
import { AI_SECURITY_SOURCES } from "@/lib/enterprise-security-operations-center/registry";
import type { IntrusionAlert } from "@/lib/enterprise-security-operations-center/types";
import type { SecurityEvent } from "@/lib/enterprise-security-operations-center/types";

export function generateSocAiInsights(events: SecurityEvent[], intrusions: IntrusionAlert[]): AiSecurityInsight[] {
  const insights: AiSecurityInsight[] = [];

  for (const event of events.filter((e) => e.level === "critical" || e.level === "high").slice(0, 3)) {
    insights.push({
      id: `scan-${event.id}`,
      source: "scan",
      type: "threat",
      summary: `SCAN detected ${event.level} threat in ${event.category}: ${event.summary}`,
      confidence: 88,
      recommendedAction: "Review and block source IP",
    });
  }

  for (const intrusion of intrusions.filter((i) => !i.mitigated)) {
    insights.push({
      id: `sentinel-${intrusion.id}`,
      source: "sentinel",
      type: "correlation",
      summary: `SENTINEL correlated ${intrusion.type} attack on ${intrusion.target} (${intrusion.count} events)`,
      confidence: 91,
    });
  }

  insights.push({
    id: "omega-auto-1",
    source: "omega",
    type: "auto-response",
    summary: "OMEGA recommends auto-block for credential-stuffing source IPs",
    confidence: 86,
    recommendedAction: "Enable auto-block automation",
  });

  insights.push({
    id: "omega-predict-1",
    source: "omega",
    type: "prediction",
    summary: "OMEGA predicts increased bot activity during next deployment window",
    confidence: 72,
  });

  return insights;
}

export function allAiSourcesPresent(insights: AiSecurityInsight[]): boolean {
  return AI_SECURITY_SOURCES.every((s) => insights.some((i) => i.source === s));
}

export function scanThreatCount(insights: AiSecurityInsight[]): number {
  return insights.filter((i) => i.source === "scan").length;
}

export function sentinelCorrelationCount(insights: AiSecurityInsight[]): number {
  return insights.filter((i) => i.source === "sentinel" && i.type === "correlation").length;
}

export function omegaAutoResponseCount(insights: AiSecurityInsight[]): number {
  return insights.filter((i) => i.source === "omega" && (i.type === "auto-response" || i.type === "prediction")).length;
}

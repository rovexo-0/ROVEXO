import type { SentinelAlert, SentinelMonitorType, SentinelScores } from "@/lib/enterprise-ai-operating-system/types";
import { SENTINEL_MONITOR_TYPES } from "@/lib/enterprise-ai-operating-system/registry";

export function createDefaultAlerts(): SentinelAlert[] {
  return [
    {
      id: "sent-alert-1",
      type: "platform-health",
      severity: "info",
      title: "Platform baseline healthy",
      description: "All core services responding within SLA",
      detectedAt: new Date(Date.now() - 3600_000).toISOString(),
      resolved: true,
    },
    {
      id: "sent-alert-2",
      type: "payment-anomalies",
      severity: "warning",
      title: "Elevated payment retry rate",
      description: "Payment retry rate 12% above baseline",
      detectedAt: new Date(Date.now() - 1800_000).toISOString(),
      resolved: false,
    },
  ];
}

export function computeSentinelScores(alerts: SentinelAlert[]): SentinelScores {
  const open = alerts.filter((a) => !a.resolved);
  const critical = open.filter((a) => a.severity === "critical").length;
  const warning = open.filter((a) => a.severity === "warning").length;
  const securityScore = Math.max(0, 100 - critical * 20 - warning * 8);
  return {
    securityScore,
    trustScore: Math.max(0, securityScore - 5),
    marketplaceRisk: Math.min(100, warning * 10 + critical * 25),
    infrastructureRisk: Math.min(100, critical * 30),
  };
}

export function detectThreat(alerts: SentinelAlert[]): SentinelAlert[] {
  return alerts.filter((a) => ["attacks", "fraud", "abuse", "bots"].includes(a.type) && !a.resolved);
}

export function isValidMonitorType(type: string): type is SentinelMonitorType {
  return (SENTINEL_MONITOR_TYPES as readonly string[]).includes(type);
}

export function resolveAlert(alerts: SentinelAlert[], alertId: string): SentinelAlert[] {
  return alerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a));
}

export function buildRiskTimeline(alerts: SentinelAlert[]): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const alert of alerts) {
    const date = alert.detectedAt.slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + 1);
  }
  return [...map.entries()].map(([date, count]) => ({ date, count }));
}

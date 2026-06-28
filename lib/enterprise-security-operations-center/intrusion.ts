import type { IntrusionAlert, IntrusionType, ThreatLevel } from "@/lib/enterprise-security-operations-center/types";
import { INTRUSION_TYPES } from "@/lib/enterprise-security-operations-center/registry";

export function isValidIntrusionType(value: string): value is IntrusionType {
  return (INTRUSION_TYPES as readonly string[]).includes(value);
}

export function createDefaultIntrusions(): IntrusionAlert[] {
  return [
    { id: "ids-1", type: "brute-force", level: "high", target: "/api/auth/login", count: 847, lastSeen: new Date().toISOString(), mitigated: true },
    { id: "ids-2", type: "credential-stuffing", level: "critical", target: "authentication", count: 23, lastSeen: new Date().toISOString(), mitigated: false },
    { id: "ids-3", type: "api-abuse", level: "medium", target: "/api/listings", count: 1204, lastSeen: new Date().toISOString(), mitigated: true },
    { id: "ids-4", type: "session-hijacking", level: "high", target: "session-store", count: 2, lastSeen: new Date().toISOString(), mitigated: false },
    { id: "ids-5", type: "bot-activity", level: "medium", target: "search-index", count: 5600, lastSeen: new Date().toISOString(), mitigated: true },
  ];
}

export function activeIntrusions(alerts: IntrusionAlert[]): IntrusionAlert[] {
  return alerts.filter((a) => !a.mitigated);
}

export function intrusionSeverityScore(alerts: IntrusionAlert[]): number {
  const weights: Record<ThreatLevel, number> = { critical: 40, high: 25, medium: 15, low: 5, info: 1 };
  return Math.min(100, alerts.reduce((s, a) => s + weights[a.level], 0));
}

export function coversAllIntrusionTypes(alerts: IntrusionAlert[]): boolean {
  const types = new Set(alerts.map((a) => a.type));
  return INTRUSION_TYPES.filter((t) => ["brute-force", "api-abuse", "bot-activity"].includes(t)).every((t) => types.has(t));
}

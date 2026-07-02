import type { SecurityEvent, SocEventCategory, ThreatLevel } from "@/lib/enterprise-security-operations-center/types";
import { SOC_EVENT_CATEGORIES, THREAT_LEVELS } from "@/lib/enterprise-security-operations-center/registry";

let eventCounter = 9000;

export function isValidEventCategory(value: string): value is SocEventCategory {
  return (SOC_EVENT_CATEGORIES as readonly string[]).includes(value);
}

export function isValidThreatLevel(value: string): value is ThreatLevel {
  return (THREAT_LEVELS as readonly string[]).includes(value);
}

export function createSecurityEvent(
  input: Pick<SecurityEvent, "category" | "level" | "summary" | "source"> &
    Partial<Pick<SecurityEvent, "ip" | "country" | "blocked">>,
): SecurityEvent {
  eventCounter += 1;
  return {
    id: `SEC-${eventCounter}`,
    category: input.category,
    level: input.level,
    summary: input.summary,
    source: input.source,
    ip: input.ip,
    country: input.country,
    blocked: input.blocked ?? false,
    timestamp: new Date().toISOString(),
  };
}

export function createDefaultEvents(): SecurityEvent[] {
  return [
    createSecurityEvent({ category: "authentication", level: "high", summary: "Failed login burst from unknown IP", source: "SENTINEL AI", ip: "203.0.113.42", country: "RU", blocked: true }),
    createSecurityEvent({ category: "payments", level: "critical", summary: "Suspicious payment velocity pattern", source: "SCAN AI", ip: "198.51.100.8", country: "US" }),
    createSecurityEvent({ category: "api", level: "medium", summary: "Rate limit threshold exceeded on listings API", source: "Firewall", ip: "192.0.2.15", country: "GB" }),
    createSecurityEvent({ category: "sessions", level: "high", summary: "Concurrent sessions from multiple countries", source: "OMEGA AI", ip: "203.0.113.99", country: "CN" }),
    createSecurityEvent({ category: "deployments", level: "low", summary: "Deployment signature verification passed", source: "Deployment Center" }),
    createSecurityEvent({ category: "wallet", level: "medium", summary: "Withdrawal attempt from new device", source: "SENTINEL AI", country: "DE" }),
    createSecurityEvent({ category: "marketplace", level: "low", summary: "Listing moderation queue spike", source: "Platform Monitor" }),
    createSecurityEvent({ category: "ai", level: "info", summary: "SCAN completed platform security sweep", source: "SCAN AI" }),
  ];
}

export function liveEvents(events: SecurityEvent[]): SecurityEvent[] {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return events.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
}

export function blockedEvents(events: SecurityEvent[]): SecurityEvent[] {
  return events.filter((e) => e.blocked);
}

export function criticalEvents(events: SecurityEvent[]): SecurityEvent[] {
  return events.filter((e) => e.level === "critical" || e.level === "high");
}

export function computeThreatLevel(events: SecurityEvent[]): ThreatLevel {
  const critical = events.filter((e) => e.level === "critical").length;
  const high = events.filter((e) => e.level === "high").length;
  if (critical > 0) return "critical";
  if (high >= 3) return "high";
  if (high > 0) return "medium";
  return "low";
}

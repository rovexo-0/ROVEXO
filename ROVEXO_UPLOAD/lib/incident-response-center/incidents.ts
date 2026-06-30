import type { IncidentRecord, IncidentSeverity, IncidentStatus, IncidentType } from "@/lib/incident-response-center/types";
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES, INCIDENT_TYPES } from "@/lib/incident-response-center/registry";

let incidentCounter = 1000;

export function isValidSeverity(value: string): value is IncidentSeverity {
  return (INCIDENT_SEVERITIES as readonly string[]).includes(value);
}

export function isValidIncidentType(value: string): value is IncidentType {
  return (INCIDENT_TYPES as readonly string[]).includes(value);
}

export function isValidIncidentStatus(value: string): value is IncidentStatus {
  return (INCIDENT_STATUSES as readonly string[]).includes(value);
}

export function createIncident(
  input: Pick<IncidentRecord, "priority" | "category" | "detectedBy" | "affectedService" | "title"> &
    Partial<Pick<IncidentRecord, "description" | "owner">>,
): IncidentRecord {
  incidentCounter += 1;
  return {
    id: `INC-${incidentCounter}`,
    priority: input.priority,
    category: input.category,
    detectedBy: input.detectedBy,
    affectedService: input.affectedService,
    title: input.title,
    description: input.description,
    owner: input.owner,
    startedAt: new Date().toISOString(),
    durationMinutes: 0,
    status: "open",
  };
}

export function acknowledgeIncident(incident: IncidentRecord, owner: string): IncidentRecord {
  return { ...incident, status: "acknowledged", owner: owner || incident.owner };
}

export function escalateIncident(incident: IncidentRecord): IncidentRecord {
  const order: IncidentSeverity[] = ["info", "low", "medium", "high", "critical"];
  const idx = order.indexOf(incident.priority);
  const next = order[Math.min(idx + 1, order.length - 1)]!;
  return { ...incident, priority: next, status: "escalated" };
}

export function resolveIncident(incident: IncidentRecord): IncidentRecord {
  const now = new Date();
  const started = new Date(incident.startedAt);
  const durationMinutes = Math.round((now.getTime() - started.getTime()) / 60000);
  return { ...incident, status: "resolved", resolvedAt: now.toISOString(), durationMinutes };
}

export function reopenIncident(incident: IncidentRecord): IncidentRecord {
  return { ...incident, status: "reopened", resolvedAt: undefined };
}

export function assignIncident(incident: IncidentRecord, owner: string): IncidentRecord {
  return { ...incident, owner, status: incident.status === "open" ? "investigating" : incident.status };
}

export function activeIncidents(incidents: IncidentRecord[]): IncidentRecord[] {
  return incidents.filter((i) => !["resolved"].includes(i.status));
}

export function criticalIncidents(incidents: IncidentRecord[]): IncidentRecord[] {
  return incidents.filter((i) => i.priority === "critical" && i.status !== "resolved");
}

export function resolvedToday(incidents: IncidentRecord[]): IncidentRecord[] {
  const today = new Date().toISOString().slice(0, 10);
  return incidents.filter((i) => i.status === "resolved" && i.resolvedAt?.startsWith(today));
}

export function averageResolutionMinutes(incidents: IncidentRecord[]): number {
  const resolved = incidents.filter((i) => i.status === "resolved" && i.durationMinutes > 0);
  if (resolved.length === 0) return 0;
  return Math.round(resolved.reduce((s, i) => s + i.durationMinutes, 0) / resolved.length);
}

export function severityCounts(incidents: IncidentRecord[]) {
  const active = activeIncidents(incidents);
  return {
    critical: active.filter((i) => i.priority === "critical").length,
    major: active.filter((i) => i.priority === "high").length,
    minor: active.filter((i) => ["medium", "low", "info"].includes(i.priority)).length,
  };
}

export function updateIncidentDuration(incident: IncidentRecord): IncidentRecord {
  if (incident.status === "resolved") return incident;
  const started = new Date(incident.startedAt);
  const durationMinutes = Math.round((Date.now() - started.getTime()) / 60000);
  return { ...incident, durationMinutes };
}

export function createDefaultIncidents(): IncidentRecord[] {
  return [
    createIncident({
      priority: "critical",
      category: "payments",
      detectedBy: "SENTINEL AI",
      affectedService: "Stripe Webhook Processor",
      title: "Payment webhook delivery failures",
      owner: "on-call-engineer",
    }),
    createIncident({
      priority: "high",
      category: "database",
      detectedBy: "SCAN AI",
      affectedService: "Supabase Primary",
      title: "Elevated query latency on orders table",
    }),
    createIncident({
      priority: "medium",
      category: "search",
      detectedBy: "OMEGA AI",
      affectedService: "Search Index",
      title: "Index lag exceeding SLA threshold",
    }),
    createIncident({
      priority: "low",
      category: "cron",
      detectedBy: "Platform Monitor",
      affectedService: "Analytics Aggregation",
      title: "Delayed nightly aggregation job",
    }),
    {
      ...createIncident({
        priority: "high",
        category: "deployment",
        detectedBy: "Deployment Center",
        affectedService: "Production API",
        title: "Post-deploy health check regression",
      }),
      status: "resolved" as const,
      resolvedAt: new Date().toISOString(),
      durationMinutes: 45,
    },
  ];
}

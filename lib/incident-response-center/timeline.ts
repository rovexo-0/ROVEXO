import type { IncidentRecord, TimelineEvent, TimelineEventType } from "@/lib/incident-response-center/types";
import { TIMELINE_EVENT_TYPES } from "@/lib/incident-response-center/registry";

let eventCounter = 5000;

export function isValidTimelineEventType(value: string): value is TimelineEventType {
  return (TIMELINE_EVENT_TYPES as readonly string[]).includes(value);
}

export function createTimelineEvent(
  incidentId: string,
  type: TimelineEventType,
  actor: string,
  summary: string,
): TimelineEvent {
  eventCounter += 1;
  return {
    id: `tl-${eventCounter}`,
    incidentId,
    type,
    actor,
    summary,
    timestamp: new Date().toISOString(),
  };
}

export function buildIncidentTimeline(incident: IncidentRecord, events: TimelineEvent[]): TimelineEvent[] {
  const related = events.filter((e) => e.incidentId === incident.id);
  const defaults: TimelineEvent[] = [
    createTimelineEvent(incident.id, "detection", incident.detectedBy, `Incident detected: ${incident.title}`),
  ];
  if (incident.owner) {
    defaults.push(createTimelineEvent(incident.id, "assignment", "system", `Assigned to ${incident.owner}`));
  }
  if (incident.status === "escalated") {
    defaults.push(createTimelineEvent(incident.id, "escalation", "automation", "Incident escalated"));
  }
  if (incident.status === "resolved" && incident.resolvedAt) {
    defaults.push(createTimelineEvent(incident.id, "resolution", incident.owner ?? "system", "Incident resolved"));
  }
  return [...defaults, ...related].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

export function createDefaultTimelineEvents(incidents: IncidentRecord[]): TimelineEvent[] {
  return incidents.flatMap((incident) => buildIncidentTimeline(incident, []));
}

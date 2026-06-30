import type { AutomationRule, IncidentRecord, IncidentSettings } from "@/lib/incident-response-center/types";
import { AUTOMATION_RULES } from "@/lib/incident-response-center/registry";
import { assignIncident, escalateIncident } from "@/lib/incident-response-center/incidents";

export function isValidAutomationRule(value: string): value is AutomationRule {
  return (AUTOMATION_RULES as readonly string[]).includes(value);
}

export function createDefaultAutomations(): AutomationRule[] {
  return [...AUTOMATION_RULES];
}

export function applyAutomations(
  incident: IncidentRecord,
  settings: IncidentSettings,
): { incident: IncidentRecord; actions: string[] } {
  const actions: string[] = [];
  let updated = { ...incident };

  if (settings.autoAssignEnabled && !updated.owner && settings.defaultOwner) {
    updated = assignIncident(updated, settings.defaultOwner);
    actions.push("auto-assign");
  }

  if (settings.autoEscalateEnabled && updated.durationMinutes >= settings.escalationThresholdMinutes) {
    updated = escalateIncident(updated);
    actions.push("auto-escalate");
  }

  if (settings.autoNotifyEnabled) {
    actions.push("auto-notify");
  }

  if (settings.autoRecoverEnabled && updated.category === "cron") {
    actions.push("auto-recover");
  }

  return { incident: updated, actions };
}

export function suggestRollback(incident: IncidentRecord): boolean {
  return incident.category === "deployment" && ["critical", "high"].includes(incident.priority);
}

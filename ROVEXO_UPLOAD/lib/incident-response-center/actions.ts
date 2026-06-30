import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformIncidentAction } from "@/lib/incident-response-center/audit";
import { getIncidentLiveDocument, incidentConfigLifecycle } from "@/lib/incident-response-center/config";
import { executeIncidentConfigAction, isIncidentConfigAction } from "@/lib/incident-response-center/config-actions";
import type { IncidentConfigDocument } from "@/lib/incident-response-center/config";
import { INCIDENT_RESPONSE_MODULE_DESCRIPTOR } from "@/lib/incident-response-center/descriptor";
import {
  acknowledgeIncident,
  activeIncidents,
  createIncident,
  escalateIncident,
  isValidIncidentType,
  isValidSeverity,
  reopenIncident,
  resolveIncident,
  updateIncidentDuration,
} from "@/lib/incident-response-center/incidents";
import { analyzeRootCause } from "@/lib/incident-response-center/root-cause";
import { generatePostmortem } from "@/lib/incident-response-center/postmortem";
import { createTimelineEvent } from "@/lib/incident-response-center/timeline";
import { executePlaybook, isValidPlaybookAction } from "@/lib/incident-response-center/playbooks";
import { generateIncidentAiSuggestions } from "@/lib/incident-response-center/ai-integration";
import { exportIncidents, exportPostmortem, isValidExportFormat, parseImportPayload } from "@/lib/incident-response-center/export";
import { applyAutomations } from "@/lib/incident-response-center/automations";

export async function executeIncidentAction(
  action: string,
  actorId: string,
  payload?: Record<string, unknown>,
) {
  if (isIncidentConfigAction(action)) {
    return executeIncidentConfigAction(action, actorId, payload as { document?: IncidentConfigDocument; historyId?: string });
  }

  const permission = canPerformIncidentAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getIncidentLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: INCIDENT_RESPONSE_MODULE_DESCRIPTOR.id,
    action,
  });

  const incidentId = String(payload?.incidentId ?? "");
  const findIncident = () => live.settings.incidents.find((i) => i.id === incidentId);

  switch (action) {
    case "acknowledge": {
      const incident = findIncident();
      if (!incident) throw new Error("Incident not found");
      const updated = acknowledgeIncident(incident, String(payload?.owner ?? actorId));
      const timeline = [
        createTimelineEvent(incidentId, "assignment", actorId, `Acknowledged by ${actorId}`),
        ...live.settings.timeline,
      ];
      const incidents = live.settings.incidents.map((i) => (i.id === incidentId ? updated : i));
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, incidents, timeline }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { incident: updated };
    }
    case "escalate": {
      const incident = findIncident();
      if (!incident) throw new Error("Incident not found");
      const updated = escalateIncident(incident);
      const timeline = [
        createTimelineEvent(incidentId, "escalation", actorId, "Incident escalated"),
        ...live.settings.timeline,
      ];
      const incidents = live.settings.incidents.map((i) => (i.id === incidentId ? updated : i));
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, incidents, timeline }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { incident: updated };
    }
    case "resolve": {
      const incident = findIncident();
      if (!incident) throw new Error("Incident not found");
      const updated = resolveIncident(incident);
      const timeline = [
        createTimelineEvent(incidentId, "resolution", actorId, "Incident resolved"),
        ...live.settings.timeline,
      ];
      const analysis = live.settings.rootCauseAnalyses.find((r) => r.incidentId === incidentId) ?? analyzeRootCause(updated);
      const postmortem = generatePostmortem(updated, analysis);
      const incidents = live.settings.incidents.map((i) => (i.id === incidentId ? updated : i));
      const postmortems = [postmortem, ...live.settings.postmortems.filter((p) => p.incidentId !== incidentId)];
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, incidents, timeline, postmortems }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { incident: updated, postmortem };
    }
    case "reopen": {
      const incident = findIncident();
      if (!incident) throw new Error("Incident not found");
      const updated = reopenIncident(incident);
      const incidents = live.settings.incidents.map((i) => (i.id === incidentId ? updated : i));
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, incidents }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { incident: updated };
    }
    case "rollback": {
      const incident = findIncident();
      if (!incident) throw new Error("Incident not found");
      const timeline = [
        createTimelineEvent(incidentId, "mitigation", actorId, "Rollback suggested via Deployment Center"),
        ...live.settings.timeline,
      ];
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, timeline }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { rollbackSuggested: true, incidentId };
    }
    case "execute-playbook": {
      const playbookId = String(payload?.playbookId ?? "");
      const playbook = live.settings.playbooks.find((p) => p.id === playbookId);
      if (!playbook) throw new Error("Playbook not found");
      if (!isValidPlaybookAction(playbook.action)) throw new Error("Invalid playbook");
      const result = executePlaybook(playbook, incidentId || "platform");
      const timeline = [
        createTimelineEvent(incidentId || "platform", "mitigation", actorId, result.message),
        ...live.settings.timeline,
      ];
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, timeline }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return result;
    }
    case "create-incident": {
      const priority = String(payload?.priority ?? "medium");
      const category = String(payload?.category ?? "api");
      if (!isValidSeverity(priority) || !isValidIncidentType(category)) throw new Error("Invalid incident parameters");
      const incident = createIncident({
        priority,
        category,
        detectedBy: String(payload?.detectedBy ?? actorId),
        affectedService: String(payload?.affectedService ?? "Unknown"),
        title: String(payload?.title ?? "New incident"),
        description: payload?.description ? String(payload.description) : undefined,
      });
      const { incident: automated } = applyAutomations(incident, live.settings);
      const timeline = [
        createTimelineEvent(automated.id, "detection", automated.detectedBy, automated.title),
        ...live.settings.timeline,
      ];
      const analysis = analyzeRootCause(automated);
      const incidents = [automated, ...live.settings.incidents];
      const aiSuggestions = generateIncidentAiSuggestions(incidents);
      await incidentConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...live.settings,
            incidents,
            timeline,
            rootCauseAnalyses: [analysis, ...live.settings.rootCauseAnalyses],
            aiSuggestions,
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { incident: automated };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidExportFormat(format)) throw new Error("Invalid export format");
      const data = exportIncidents(live.settings.incidents, format);
      return { exported: data, format };
    }
    case "import": {
      const raw = String(payload?.data ?? "{}");
      const parsed = parseImportPayload(raw);
      if (!parsed.incidents?.length) throw new Error("No incidents in import payload");
      const incidents = [...parsed.incidents, ...live.settings.incidents].slice(0, 200);
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, incidents }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { imported: parsed.incidents.length };
    }
    case "toggle-emergency-mode": {
      const next = { ...live.settings, emergencyMode: !live.settings.emergencyMode };
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: next, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { emergencyMode: next.emergencyMode };
    }
    case "analyze-root-cause": {
      const incident = findIncident();
      if (!incident) throw new Error("Incident not found");
      const analysis = analyzeRootCause(incident);
      const rootCauseAnalyses = [
        analysis,
        ...live.settings.rootCauseAnalyses.filter((r) => r.incidentId !== incidentId),
      ];
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, rootCauseAnalyses }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { analysis };
    }
    case "generate-postmortem": {
      const incident = findIncident();
      if (!incident) throw new Error("Incident not found");
      const analysis = live.settings.rootCauseAnalyses.find((r) => r.incidentId === incidentId);
      const postmortem = generatePostmortem(incident, analysis);
      const format = payload?.format ? String(payload.format) : "json";
      const exported = isValidExportFormat(format) ? exportPostmortem(postmortem, format) : undefined;
      const postmortems = [postmortem, ...live.settings.postmortems.filter((p) => p.incidentId !== incidentId)];
      await incidentConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, postmortems }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { postmortem, exported };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export async function refreshIncidentDurations(actorId: string) {
  const live = await getIncidentLiveDocument();
  const incidents = live.settings.incidents.map(updateIncidentDuration);
  const aiSuggestions = generateIncidentAiSuggestions(incidents);
  await incidentConfigLifecycle.saveDraft(
    { ...live, settings: { ...live.settings, incidents, aiSuggestions } },
    actorId,
  );
}

export function countActiveIncidentsFromLive(live: IncidentConfigDocument) {
  return activeIncidents(live.settings.incidents).length;
}

import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { INCIDENT_RESPONSE_MODULE_DESCRIPTOR } from "@/lib/incident-response-center/descriptor";

export type IncidentAuditAction =
  | "detection"
  | "acknowledgement"
  | "escalation"
  | "assignment"
  | "mitigation"
  | "resolution"
  | "reopen"
  | "rollback"
  | "playbook"
  | "postmortem"
  | "export"
  | "import"
  | "configuration";

export function canPerformIncidentAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    acknowledge: "acknowledge",
    escalate: "escalate",
    resolve: "resolve",
    reopen: "reopen",
    rollback: "rollback",
    "execute-playbook": "execute-playbook",
    export: "export",
    import: "import",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: INCIDENT_RESPONSE_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForIncident(action: IncidentAuditAction): boolean {
  return ["escalation", "resolution", "reopen", "rollback", "playbook", "export", "import", "configuration"].includes(action);
}

export function createIncidentAuditEntry(action: IncidentAuditAction, actor: string, target: string) {
  return { id: `irc-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}

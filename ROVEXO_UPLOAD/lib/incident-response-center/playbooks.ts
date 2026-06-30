import type { PlaybookAction, PlaybookDefinition } from "@/lib/incident-response-center/types";
import { PLAYBOOK_ACTIONS } from "@/lib/incident-response-center/registry";

const PLAYBOOK_LABELS: Record<PlaybookAction, { label: string; description: string; requiresMfa: boolean; estimatedMinutes: number }> = {
  restart: { label: "Restart Service", description: "Gracefully restart the affected service instance", requiresMfa: true, estimatedMinutes: 5 },
  "flush-cache": { label: "Flush Cache", description: "Clear Redis and application caches for affected service", requiresMfa: false, estimatedMinutes: 2 },
  rollback: { label: "Rollback Deployment", description: "Initiate rollback via Deployment Center", requiresMfa: true, estimatedMinutes: 15 },
  "disable-feature": { label: "Disable Feature", description: "Disable feature flag for affected component", requiresMfa: true, estimatedMinutes: 3 },
  "enable-maintenance": { label: "Enable Maintenance Mode", description: "Enable platform maintenance mode for affected region", requiresMfa: true, estimatedMinutes: 5 },
  "restart-workers": { label: "Restart Workers", description: "Restart background job workers and queue processors", requiresMfa: true, estimatedMinutes: 8 },
  "reconnect-provider": { label: "Reconnect Provider", description: "Reset connection pool to external provider", requiresMfa: false, estimatedMinutes: 4 },
  "retry-queue": { label: "Retry Queue", description: "Requeue failed jobs in dead-letter queue", requiresMfa: false, estimatedMinutes: 6 },
  "notify-team": { label: "Notify Team", description: "Send incident notification to on-call and stakeholders", requiresMfa: false, estimatedMinutes: 1 },
  "create-report": { label: "Create Report", description: "Generate incident status report for leadership", requiresMfa: false, estimatedMinutes: 3 },
};

export function isValidPlaybookAction(value: string): value is PlaybookAction {
  return (PLAYBOOK_ACTIONS as readonly string[]).includes(value);
}

export function createDefaultPlaybooks(): PlaybookDefinition[] {
  return PLAYBOOK_ACTIONS.map((action, i) => ({
    id: `pb-${i + 1}`,
    action,
    ...PLAYBOOK_LABELS[action],
  }));
}

export function executePlaybook(playbook: PlaybookDefinition, incidentId: string): { success: boolean; message: string } {
  return {
    success: true,
    message: `Playbook "${playbook.label}" executed for incident ${incidentId}`,
  };
}

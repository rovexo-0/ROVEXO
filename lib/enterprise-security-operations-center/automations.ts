import type { SocAutomation, SocSettings } from "@/lib/enterprise-security-operations-center/types";
import { SOC_AUTOMATIONS } from "@/lib/enterprise-security-operations-center/registry";
import type { SecurityEvent } from "@/lib/enterprise-security-operations-center/types";
import { blockIpRule } from "@/lib/enterprise-security-operations-center/firewall";

export function createDefaultAutomations(): SocAutomation[] {
  return [...SOC_AUTOMATIONS];
}

export function applySocAutomations(
  event: SecurityEvent,
  settings: SocSettings,
): { actions: string[]; blockRule?: ReturnType<typeof blockIpRule> } {
  const actions: string[] = [];
  let blockRule: ReturnType<typeof blockIpRule> | undefined;

  if (settings.autoBlockEnabled && event.ip && (event.level === "critical" || event.level === "high")) {
    actions.push("auto-block");
    blockRule = blockIpRule(event.ip);
  }
  if (settings.autoQuarantineEnabled && event.level === "critical") {
    actions.push("auto-quarantine");
  }
  if (settings.autoNotifyEnabled) actions.push("auto-notify");
  if (settings.autoEscalateEnabled && event.level === "critical") actions.push("auto-escalate");
  if (settings.autoIncidentCreation && event.level === "critical") actions.push("auto-incident-creation");

  return { actions, blockRule };
}

export function shouldSuggestRollback(event: SecurityEvent): boolean {
  return event.category === "deployments" && event.level === "critical";
}

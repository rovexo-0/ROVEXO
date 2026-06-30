import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { OBSERVABILITY_MODULE_DESCRIPTOR } from "@/lib/enterprise-observability-center/descriptor";

export type ObservabilityAuditAction = "monitor" | "telemetry" | "diagnose" | "alerts" | "sync-omega" | "export";

export function canPerformObservabilityAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    monitor: "monitor",
    telemetry: "telemetry",
    diagnose: "diagnose",
    alerts: "alerts",
    "sync-omega": "sync-omega",
    export: "export",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: OBSERVABILITY_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForObservability(action: string): boolean {
  return ["publish-config", "rollback-config", "import-config"].includes(action);
}

export function createObservabilityAuditEntry(action: ObservabilityAuditAction, actor: string, target: string) {
  return { id: `eoc-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}

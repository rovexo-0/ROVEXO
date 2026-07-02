import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { ENTERPRISE_BI_MODULE_DESCRIPTOR } from "@/lib/enterprise-business-intelligence/descriptor";

export type BiAuditAction = "refresh" | "calculate" | "forecast" | "export" | "import" | "report" | "configuration";

export function canPerformBiAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    refresh: "refresh",
    calculate: "calculate",
    forecast: "forecast",
    export: "export",
    import: "import",
    "generate-report": "export",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: ENTERPRISE_BI_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForBi(action: BiAuditAction): boolean {
  return ["export", "import", "configuration"].includes(action);
}

export function createBiAuditEntry(action: BiAuditAction, actor: string, target: string) {
  return { id: `bi-audit-${Date.now()}`, action, actor, target, timestamp: new Date().toISOString() };
}

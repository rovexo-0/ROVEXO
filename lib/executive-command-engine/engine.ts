import type { Json } from "@/lib/supabase/types/database";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditExecutiveCommandAction } from "@/lib/executive-command-engine/audit";
import { EXECUTIVE_EXPORT_TYPES } from "@/lib/executive-command-engine/registry";
import type { ExecutiveExportRecord } from "@/lib/executive-command-engine/types";
import { executeOmegaEnterpriseAction } from "@/lib/omega-enterprise-mobile-engine/engine";

const EXECUTIVE_EXPORTS_KEY = "executive_command_exports_v1";

export async function getExecutiveExports(): Promise<ExecutiveExportRecord[]> {
  return getPlatformSetting(EXECUTIVE_EXPORTS_KEY, []);
}

export async function executeExecutiveCommandAction(
  action: string,
  actorId: string,
  payload?: { format?: "pdf" | "csv" | "xlsx"; exportId?: string },
): Promise<void> {
  if (action === "run-scan") {
    await executeOmegaEnterpriseAction("run-scan", actorId);
  } else if (action === "emergency-mode") {
    await executeOmegaEnterpriseAction("emergency-mode", actorId);
  } else if (action === "generate-executive-report" || action.startsWith("export-")) {
    const exportDef =
      EXECUTIVE_EXPORT_TYPES.find((e) => e.id === payload?.exportId) ??
      EXECUTIVE_EXPORT_TYPES.find((e) => e.format === (payload?.format ?? "pdf")) ??
      EXECUTIVE_EXPORT_TYPES[0]!;
    const exports = await getExecutiveExports();
    const next: ExecutiveExportRecord[] = [
      {
        id: `exec-${Date.now().toString(36)}`,
        label: exportDef.label,
        format: payload?.format ?? exportDef.format,
        generatedAt: new Date().toISOString(),
      },
      ...exports,
    ].slice(0, 30);
    await updatePlatformSetting({ actorId, key: EXECUTIVE_EXPORTS_KEY, value: next as unknown as Json });
  } else {
    throw new Error("Unknown action");
  }

  await auditExecutiveCommandAction({ actorId, action, newValue: payload });
}

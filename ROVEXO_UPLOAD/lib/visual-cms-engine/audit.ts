import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { auditVisualChange } from "@/lib/platform-visual/audit";
import { toAuditLogMetadata } from "@/lib/audit/metadata";

export async function auditVisualCmsEngineAction(input: {
  actorId: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
  publishReference?: string;
}): Promise<void> {
  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "visual_cms_engine.change",
    resourceType: "visual_cms_engine",
    resourceId: input.module,
    metadata: toAuditLogMetadata({
      module: input.module,
      component: input.component,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
      rollbackAvailable: input.rollbackAvailable ?? true,
      publishReference: input.publishReference,
      time: new Date().toISOString(),
    }),
  });
}

export async function auditVisualCmsThemeAction(input: {
  actorId: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
}): Promise<void> {
  await auditVisualChange({
    actorId: input.actorId,
    module: "visual-cms",
    action: input.action,
    previousValue: input.previousValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable ?? true,
  });
}

export function createVisualCmsEngineAuditEntry(input: {
  administrator: string;
  module: string;
  component?: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  rollbackAvailable?: boolean;
  publishReference?: string;
}) {
  return {
    id: `vcms-${Date.now().toString(36)}`,
    administrator: input.administrator,
    timestamp: new Date().toISOString(),
    module: input.module,
    component: input.component,
    action: input.action,
    previousValue: input.previousValue,
    newValue: input.newValue,
    rollbackAvailable: input.rollbackAvailable ?? true,
    publishReference: input.publishReference,
  };
}

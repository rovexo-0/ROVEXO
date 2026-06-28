import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { HOMEPAGE_BUILDER_MODULE_DESCRIPTOR } from "@/lib/homepage-builder-engine/descriptor";

export type HomepageAuditAction =
  | "create"
  | "edit"
  | "move"
  | "delete"
  | "hide"
  | "show"
  | "publish"
  | "rollback"
  | "preview"
  | "duplicate"
  | "import"
  | "export";

export function canPerformHomepageAction(input: {
  action: string;
  mfaVerified?: boolean;
}): { allowed: boolean; reason?: string } {
  const map: Record<string, string> = {
    create: "edit",
    edit: "edit",
    move: "edit",
    delete: "delete",
    hide: "edit",
    show: "edit",
    publish: "publish-config",
    rollback: "rollback-config",
    preview: "preview",
    duplicate: "duplicate",
    "import-config": "import-config",
    "export-config": "export-config",
    schedule: "schedule",
    approve: "approve",
  };
  return canPerformModuleAction({
    moduleId: HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForHomepage(action: HomepageAuditAction): boolean {
  return ["publish", "rollback", "delete", "import"].includes(action);
}

export function createHomepageAuditEntry(
  action: HomepageAuditAction,
  actor: string,
  target: string,
): { id: string; action: string; actor: string; target: string; timestamp: string } {
  return {
    id: `hpb-audit-${Date.now()}`,
    action,
    actor,
    target,
    timestamp: new Date().toISOString(),
  };
}

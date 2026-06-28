import { canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import { HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR } from "@/lib/homepage-enterprise-certification-engine/descriptor";

export type HomepageCertificationAuditAction = "validate" | "certify" | "analyze" | "export";

export function canPerformHomepageCertificationAction(input: { action: string; mfaVerified?: boolean }) {
  const map: Record<string, string> = {
    validate: "validate",
    certify: "certify",
    analyze: "analyze",
    export: "export",
    "publish-config": "publish-config",
    "rollback-config": "rollback-config",
    "import-config": "import-config",
    "export-config": "export-config",
    view: "view",
  };
  return canPerformModuleAction({
    moduleId: HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.id,
    action: map[input.action] ?? input.action,
    mfaVerified: input.mfaVerified ?? false,
  });
}

export function requiresMfaForHomepageCertification(action: string): boolean {
  return ["certify", "publish-config", "rollback-config", "import-config"].includes(action);
}

import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformDevelopmentAction } from "@/lib/enterprise-development-center/audit";
import { getDevelopmentLiveDocument, developmentConfigLifecycle } from "@/lib/enterprise-development-center/config";
import { executeDevelopmentConfigAction, isDevelopmentConfigAction } from "@/lib/enterprise-development-center/config-actions";
import type { DevelopmentConfigDocument } from "@/lib/enterprise-development-center/config";
import { ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-development-center/descriptor";
import { advanceReleasePipeline, queueBuild, runEnterpriseValidation } from "@/lib/enterprise-development-center/engine";
import { exportDevelopmentSnapshot, isValidDevelopmentExportFormat } from "@/lib/enterprise-development-center/export";
import { getDevelopmentSnapshot } from "@/lib/enterprise-development-center/reader";

export async function executeDevelopmentAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isDevelopmentConfigAction(action)) {
    return executeDevelopmentConfigAction(action, actorId, payload as { document?: DevelopmentConfigDocument; historyId?: string });
  }

  const permission = canPerformDevelopmentAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getDevelopmentLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.id,
    action,
  });

  const state = live.settings;

  switch (action) {
    case "validate": {
      const validationResults = runEnterpriseValidation();
      await developmentConfigLifecycle.saveDraft(
        { ...live, settings: { ...state, validationResults }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { validated: true, results: validationResults };
    }
    case "build": {
      const build = queueBuild(String(payload?.project ?? "rovexo-web"));
      await developmentConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            builds: [build, ...state.builds].slice(0, 20),
            dashboard: { ...state.dashboard, activeBuilds: state.dashboard.activeBuilds + 1 },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { buildId: build.id };
    }
    case "deploy": {
      const release = state.releases[0] ? advanceReleasePipeline(state.releases[0]) : undefined;
      await developmentConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            releases: release ? [release, ...state.releases.slice(1)] : state.releases,
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { deployed: true };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidDevelopmentExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getDevelopmentSnapshot();
      return { data: exportDevelopmentSnapshot(snapshot, format) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

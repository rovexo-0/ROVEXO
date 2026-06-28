import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformQaAction } from "@/lib/omega-quality-assurance-center/audit";
import { getQaLiveDocument, qaConfigLifecycle } from "@/lib/omega-quality-assurance-center/config";
import { executeQaConfigAction, isQaConfigAction } from "@/lib/omega-quality-assurance-center/config-actions";
import type { QaConfigDocument } from "@/lib/omega-quality-assurance-center/config";
import { OMEGA_QA_MODULE_DESCRIPTOR } from "@/lib/omega-quality-assurance-center/descriptor";
import {
  advanceFixCandidate,
  certifyModule,
  computeButtonCoverage,
  generateFixCandidate,
  runButtonRegistryScan,
  runFullPlatformValidation,
} from "@/lib/omega-quality-assurance-center/engine";
import { exportQaSnapshot, isValidQaExportFormat } from "@/lib/omega-quality-assurance-center/export";
import { getQaSnapshot } from "@/lib/omega-quality-assurance-center/reader";

export async function executeQaAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isQaConfigAction(action)) {
    return executeQaConfigAction(action, actorId, payload as { document?: QaConfigDocument; historyId?: string });
  }

  const permission = canPerformQaAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getQaLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: OMEGA_QA_MODULE_DESCRIPTOR.id,
    action,
  });

  const state = live.settings;

  switch (action) {
    case "validate": {
      const run = runFullPlatformValidation();
      await qaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            validationRuns: [run, ...state.validationRuns].slice(0, 20),
            dashboard: { ...state.dashboard, platformHealth: run.passRate },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { validationId: run.id, passRate: run.passRate };
    }
    case "scan": {
      const scanned = runButtonRegistryScan();
      const merged = [...scanned, ...state.registeredButtons].slice(0, 50);
      const buttonCoverage = computeButtonCoverage(merged);
      await qaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            registeredButtons: merged,
            dashboard: { ...state.dashboard, buttonCoverage },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { buttonsScanned: scanned.length, buttonCoverage };
    }
    case "fix": {
      const issue = String(payload?.issue ?? "Automated platform issue detected");
      const candidate = generateFixCandidate(issue);
      const existingId = payload?.fixId ? String(payload.fixId) : undefined;
      const updated = existingId
        ? state.fixCandidates.map((item) => (item.id === existingId ? advanceFixCandidate(item) : item))
        : [candidate, ...state.fixCandidates];
      await qaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            fixCandidates: updated.slice(0, 20),
            dashboard: { ...state.dashboard, fixQueue: updated.filter((f) => !f.safeToDeploy).length },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { fixId: existingId ?? candidate.id };
    }
    case "certify": {
      const moduleId = String(payload?.moduleId ?? OMEGA_QA_MODULE_DESCRIPTOR.id);
      const moduleLabel = String(payload?.moduleLabel ?? OMEGA_QA_MODULE_DESCRIPTOR.label);
      const cert = certifyModule(moduleId, moduleLabel);
      await qaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            certifications: [cert, ...state.certifications.filter((c) => c.moduleId !== moduleId)],
            dashboard: {
              ...state.dashboard,
              certificationRate: Math.min(100, state.dashboard.certificationRate + 1),
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { moduleId, productionReady: cert.productionReady };
    }
    case "priority": {
      const enabled = payload?.enabled !== undefined ? Boolean(payload.enabled) : !state.priorityModeEnabled;
      await qaConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...state, priorityModeEnabled: enabled },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { priorityModeEnabled: enabled };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidQaExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getQaSnapshot();
      return { data: exportQaSnapshot(snapshot, format) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

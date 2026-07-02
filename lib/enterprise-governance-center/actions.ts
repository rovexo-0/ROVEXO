import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformGovernanceAction } from "@/lib/enterprise-governance-center/audit";
import { getGovernanceLiveDocument, governanceConfigLifecycle } from "@/lib/enterprise-governance-center/config";
import { executeGovernanceConfigAction, isGovernanceConfigAction } from "@/lib/enterprise-governance-center/config-actions";
import type { GovernanceConfigDocument } from "@/lib/enterprise-governance-center/config";
import { ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-governance-center/descriptor";
import {
  allCertificationChecksPass,
  issueCertificate,
  runArchitectureScan,
  runFullValidation,
} from "@/lib/enterprise-governance-center/engine";
import { exportGovernanceSnapshot, isValidGovernanceExportFormat } from "@/lib/enterprise-governance-center/export";
import { getGovernanceSnapshot } from "@/lib/enterprise-governance-center/reader";

export async function executeGovernanceAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isGovernanceConfigAction(action)) {
    return executeGovernanceConfigAction(action, actorId, payload as { document?: GovernanceConfigDocument; historyId?: string });
  }

  const permission = canPerformGovernanceAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getGovernanceLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: ENTERPRISE_GOVERNANCE_MODULE_DESCRIPTOR.id,
    action,
  });

  const state = live.settings;

  switch (action) {
    case "scan": {
      const violations = runArchitectureScan();
      await governanceConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...state, architectureViolations: [...violations, ...state.architectureViolations].slice(0, 50) },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { violations: violations.length };
    }
    case "validate": {
      const run = runFullValidation();
      await governanceConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...state, validationRuns: [run, ...state.validationRuns].slice(0, 20) },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { validationId: run.id };
    }
    case "certify": {
      if (!allCertificationChecksPass()) throw new Error("Certification checks failed");
      const cert = issueCertificate(actorId);
      await governanceConfigLifecycle.saveDraft(
        {
          ...live,
          settings: { ...state, certificates: [cert, ...state.certificates] },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { certificateId: cert.id };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidGovernanceExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getGovernanceSnapshot();
      return { data: exportGovernanceSnapshot(snapshot, format) };
    }
    case "report": {
      const reportType = String(payload?.reportType ?? "governance");
      const snapshot = await getGovernanceSnapshot();
      return { reportType, data: exportGovernanceSnapshot(snapshot, "pdf") };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

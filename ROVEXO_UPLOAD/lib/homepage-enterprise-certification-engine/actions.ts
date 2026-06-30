import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformHomepageCertificationAction } from "@/lib/homepage-enterprise-certification-engine/audit";
import { getHomepageCertificationLiveDocument, homepageCertificationConfigLifecycle } from "@/lib/homepage-enterprise-certification-engine/config";
import { executeHomepageCertificationConfigAction, isHomepageCertificationConfigAction } from "@/lib/homepage-enterprise-certification-engine/config-actions";
import type { HomepageCertificationConfigDocument } from "@/lib/homepage-enterprise-certification-engine/config";
import { HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR } from "@/lib/homepage-enterprise-certification-engine/descriptor";
import {
  advanceCertificationRun,
  analyzeFailure,
  computeHomepageEnterpriseScore,
  countCertifiedSections,
  isProtectedHomepageTarget,
  runFullHomepageValidation,
  runHomepageIntegrityValidation,
  scanHomepageSections,
  startCertificationRun,
} from "@/lib/homepage-enterprise-certification-engine/engine";
import { exportHomepageCertificationSnapshot, isValidHomepageCertificationExportFormat } from "@/lib/homepage-enterprise-certification-engine/export";
import { getHomepageCertificationSnapshot } from "@/lib/homepage-enterprise-certification-engine/reader";

export async function executeHomepageCertificationAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isHomepageCertificationConfigAction(action)) {
    return executeHomepageCertificationConfigAction(action, actorId, payload as { document?: HomepageCertificationConfigDocument; historyId?: string });
  }

  const permission = canPerformHomepageCertificationAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getHomepageCertificationLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: HOMEPAGE_CERTIFICATION_MODULE_DESCRIPTOR.id,
    action,
  });

  const state = live.settings;

  if (state.validationOnlyMode === false) {
    throw new Error("Validation-only mode must remain enabled — protected areas cannot be auto-modified");
  }

  const target = payload?.target ? String(payload.target) : undefined;
  if (target && isProtectedHomepageTarget(target)) {
    throw new Error("Protected area — validation only, no modifications allowed");
  }

  switch (action) {
    case "validate": {
      const result = runFullHomepageValidation();
      const integrityResult = runHomepageIntegrityValidation("homepage-validation");
      const sections = scanHomepageSections();
      const dashboardUpdate = {
        ...state.dashboard,
        overallPassPercent: result.passPercent,
        sectionsCertified: countCertifiedSections(sections),
        sectionsTotal: sections.length,
        openIssues: integrityResult.failures.length + result.engineeringScan.checks.filter((c) => c.status === "fail").length,
        enterpriseScore: computeHomepageEnterpriseScore({ dashboard: state.dashboard, omegaScores: result.scores }),
        certificationGranted: integrityResult.certificationEligible,
        productionReady: result.passPercent >= 100 && integrityResult.certificationEligible && result.engineeringScan.productionReady,
      };
      await homepageCertificationConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            sections,
            omegaScores: result.scores,
            integrity: integrityResult.integrity,
            integrityScan: integrityResult.integrityScan,
            engineeringScan: result.engineeringScan,
            duplicationFindings: integrityResult.duplicationFindings,
            layoutFindings: integrityResult.layoutFindings,
            failures: integrityResult.failures,
            dashboard: dashboardUpdate,
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return {
        passPercent: result.passPercent,
        status: result.status,
        integrityPass: integrityResult.certificationEligible,
        engineeringPass: result.engineeringScan.status === "pass",
      };
    }
    case "certify": {
      const existingId = payload?.certificationId ? String(payload.certificationId) : undefined;
      if (existingId) {
        const updated = state.certificationRuns.map((r) => (r.id === existingId ? advanceCertificationRun(r) : r));
        const latest = updated.find((r) => r.id === existingId);
        const granted = latest?.stage === "certification-grant" && latest.status === "pass";
        await homepageCertificationConfigLifecycle.saveDraft(
          {
            ...live,
            settings: {
              ...state,
              certificationRuns: updated,
              dashboard: {
                ...state.dashboard,
                certificationGranted: granted || state.dashboard.certificationGranted,
                lastCertifiedAt: granted ? new Date().toISOString() : state.dashboard.lastCertifiedAt,
              },
            },
            auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
          },
          actorId,
        );
        return { certificationId: existingId, advanced: true, granted };
      }
      const integrityCheck = runHomepageIntegrityValidation("enterprise-certification");
      if (!integrityCheck.certificationEligible && state.requirePass100) {
        throw new Error("Homepage certification failed — resolve integrity and engineering director violations before granting certification");
      }
      if (state.dashboard.overallPassPercent < 100 && state.requirePass100) {
        throw new Error("PASS 100% required before certification can be granted");
      }
      const run = startCertificationRun(actorId);
      await homepageCertificationConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            certificationRuns: [run, ...state.certificationRuns].slice(0, 20),
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { certificationId: run.id };
    }
    case "analyze": {
      const issue = String(payload?.issue ?? "Homepage certification issue detected");
      const section = payload?.section ? String(payload.section) : undefined;
      const analysis = analyzeFailure(issue, section);
      await homepageCertificationConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...state,
            failures: [analysis, ...state.failures].slice(0, 25),
            dashboard: {
              ...state.dashboard,
              openIssues: state.dashboard.openIssues + (analysis.status === "blocked" ? 0 : 1),
            },
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { failureId: analysis.id, blocked: analysis.status === "blocked" };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidHomepageCertificationExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getHomepageCertificationSnapshot();
      return { data: exportHomepageCertificationSnapshot(snapshot, format) };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

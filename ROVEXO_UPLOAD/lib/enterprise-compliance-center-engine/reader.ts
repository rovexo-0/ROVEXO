import {
  buildAuditTimeline,
  buildCertificationDashboard,
  buildChangeTimeline,
  buildCompliancePolicies,
  buildComplianceTimeline,
  buildEvidenceVault,
  buildOmegaComplianceStatus,
  buildOriComplianceAnalysis,
  computeComplianceScores,
  verifyIntegrity,
} from "@/lib/enterprise-compliance-center-engine/builder";
import {
  getEnterpriseComplianceExports,
  getEnterpriseComplianceSettings,
  getPreAuditHistory,
  getReadinessHistory,
  getRemediationOverrides,
} from "@/lib/enterprise-compliance-center-engine/engine";
import { fetchEnterpriseComplianceLiveContext } from "@/lib/enterprise-compliance-center-engine/live";
import {
  buildAuditReadinessScore,
  buildComplianceHistory,
  buildEnterpriseDashboard,
  buildGapAnalysis,
  buildOriAuditIntelligence,
  buildRemediationItems,
  runPreAuditSimulation,
} from "@/lib/enterprise-compliance-center-engine/readiness";
import type { EnterpriseComplianceTab } from "@/lib/enterprise-compliance-center-engine/types";

export async function getEnterpriseComplianceSnapshot(_tab: EnterpriseComplianceTab = "dashboard") {
  const [ctx, settings, exports, preAuditHistory, readinessHistory, remediationOverrides] = await Promise.all([
    fetchEnterpriseComplianceLiveContext(),
    getEnterpriseComplianceSettings(),
    getEnterpriseComplianceExports(),
    getPreAuditHistory(),
    getReadinessHistory(),
    getRemediationOverrides(),
  ]);

  const auditTimeline = buildAuditTimeline(ctx);
  const complianceTimeline = buildComplianceTimeline(ctx);
  const changeTimeline = buildChangeTimeline(ctx);
  const evidenceVault = buildEvidenceVault(ctx, settings);
  const integrity = verifyIntegrity({ auditTimeline, changeTimeline, evidenceVault, ctx });
  const scores = computeComplianceScores(integrity, ctx.auditSnapshot.scores.productionReadiness, ctx.auditSnapshot.scores.compliance);
  const previousScore = readinessHistory[0]?.score ?? null;
  const readiness = buildAuditReadinessScore({ ctx, evidenceVault, integrity, previousScore });
  const gapAnalysis = buildGapAnalysis(ctx);
  const remediation = buildRemediationItems(gapAnalysis, remediationOverrides);
  const certifications = buildCertificationDashboard(ctx);
  const preAudit = preAuditHistory[0] ?? runPreAuditSimulation(ctx, gapAnalysis);
  const dashboard = buildEnterpriseDashboard({ ctx, readiness, evidenceVault, remediation, certifications });
  const history = buildComplianceHistory(ctx, preAuditHistory, exports);
  const oriAnalysis = buildOriComplianceAnalysis(ctx, complianceTimeline, integrity);
  const oriAuditIntelligence = buildOriAuditIntelligence({ ctx, readiness, gapAnalysis, complianceTimeline });

  return {
    scannedAt: new Date().toISOString(),
    scores,
    dashboard,
    readiness,
    preAudit,
    preAuditHistory,
    gapAnalysis,
    remediation,
    history,
    auditTimeline,
    complianceTimeline,
    changeTimeline,
    evidenceVault,
    retention: {
      retentionDays: settings.retentionDays,
      archivePolicy: settings.archivePolicy,
      deletionPolicy: settings.deletionPolicy,
      legalHold: settings.legalHold,
      automaticExport: settings.automaticExport,
      scheduledExport: settings.scheduledExport,
      encryptedExport: settings.encryptedExport,
      exportFormats: settings.exportFormats,
    },
    integrity,
    certifications,
    policies: buildCompliancePolicies(),
    oriAnalysis,
    oriAuditIntelligence,
    omegaCompliance: buildOmegaComplianceStatus(ctx, integrity, evidenceVault),
    exports,
    settings,
    integrations: {
      omega: true,
      ori: true,
      auditComplianceCenter: true,
      certificationCenter: true,
      incidentCommandCenter: true,
      incidentTimeline: true,
      rovexoTrust: true,
      guardianEnterpriseX: true,
      sentinelX: true,
      antivirusEngineX: true,
    },
  };
}

export async function getEnterpriseCompliancePageData(tab: EnterpriseComplianceTab = "dashboard") {
  const snapshot = await getEnterpriseComplianceSnapshot(tab);
  return { snapshot };
}

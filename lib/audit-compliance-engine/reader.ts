import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformHealthReport } from "@/lib/ops/health";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";
import {
  getAuditComplianceEngineSnapshotForAdmin,
  getAuditRuns,
  getAuditSchedule,
  readLiveAuditComplianceEngineDocument,
} from "@/lib/audit-compliance-engine/engine";
import {
  buildAccessibilityFindings,
  buildAuditRecommendations,
  buildAuditScoreCard,
  buildCertificationReports,
  buildComplianceStandards,
  buildModuleAuditResults,
  buildPerformanceFindings,
  buildSecurityFindings,
  buildSeoFindings,
  mergeFindings,
  searchAuditData,
} from "@/lib/audit-compliance-engine/timeline";
import type { AuditEngineSnapshot } from "@/lib/audit-compliance-engine/types";

export async function getAuditComplianceEngineSnapshot(): Promise<AuditEngineSnapshot> {
  const [{ draft, live, history }, health, operations, runs, schedule] = await Promise.all([
    getAuditComplianceEngineSnapshotForAdmin(),
    getPlatformHealthReport(),
    getProductionOperationsSnapshot(),
    getAuditRuns(),
    getAuditSchedule(),
  ]);

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count: errorCount } = await admin
    .from("platform_error_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  const modules = buildModuleAuditResults({
    config: live,
    errorCount: errorCount ?? 0,
    healthStatus: health.status,
  });
  const findings = mergeFindings(
    buildSecurityFindings({ errorCount: errorCount ?? 0, env: operations.environment }),
    buildPerformanceFindings({ health, operations }),
    buildAccessibilityFindings(),
    buildSeoFindings(),
  );
  const scores = buildAuditScoreCard({ modules, findings, healthStatus: health.status, errorCount: errorCount ?? 0 });
  const compliance = buildComplianceStandards({ scores, findings });
  const recommendations = buildAuditRecommendations(findings);
  const reports = buildCertificationReports(new Date().toISOString());

  return {
    scannedAt: new Date().toISOString(),
    scores,
    modules,
    findings,
    compliance,
    runs,
    reports,
    schedule,
    recommendations,
    draft,
    live,
    history,
  };
}

export async function getAuditCompliancePageData() {
  const snapshot = await getAuditComplianceEngineSnapshot();
  return { snapshot };
}

export async function searchAuditComplianceCenter(query: string) {
  const snapshot = await getAuditComplianceEngineSnapshot();
  return {
    scannedAt: snapshot.scannedAt,
    ...searchAuditData({
      query,
      modules: snapshot.modules,
      findings: snapshot.findings,
      runs: snapshot.runs,
      compliance: snapshot.compliance,
    }),
  };
}

export async function getAuditComplianceHistoryData() {
  const snapshot = await getAuditComplianceEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, runs: snapshot.runs, history: snapshot.history };
}

export async function getAuditComplianceData() {
  const snapshot = await getAuditComplianceEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, compliance: snapshot.compliance, scores: snapshot.scores };
}

export async function getAuditReportsData() {
  const snapshot = await getAuditComplianceEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, reports: snapshot.reports, scores: snapshot.scores };
}

export async function getPublicAuditComplianceEngineConfig() {
  return readLiveAuditComplianceEngineDocument();
}

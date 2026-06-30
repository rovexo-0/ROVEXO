import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformHealthReport } from "@/lib/ops/health";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";
import {
  getCertificationApprovals,
  getCertificationCenterEngineSnapshotForAdmin,
  getCertificationHistory,
  getCertificationSchedule,
  readLiveCertificationCenterEngineDocument,
} from "@/lib/certification-center-engine/engine";
import {
  buildCertificationDashboard,
  buildCertificationModuleResults,
  buildCertificationRecommendations,
  buildCertificationReports,
  buildCertificationScorecard,
  buildReleaseValidationChecks,
  searchCertificationData,
} from "@/lib/certification-center-engine/timeline";
import type { CertificationEngineSnapshot } from "@/lib/certification-center-engine/types";

export async function getCertificationCenterEngineSnapshot(): Promise<CertificationEngineSnapshot> {
  const [{ draft, live, history: configHistory }, health, operations, approvals, certHistory, schedule] =
    await Promise.all([
      getCertificationCenterEngineSnapshotForAdmin(),
      getPlatformHealthReport(),
      getProductionOperationsSnapshot(),
      getCertificationApprovals(),
      getCertificationHistory(),
      getCertificationSchedule(),
    ]);

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count: errorCount } = await admin
    .from("platform_error_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  const modules = buildCertificationModuleResults({
    config: live,
    errorCount: errorCount ?? 0,
    healthStatus: health.status,
  });
  const validations = buildReleaseValidationChecks({
    config: live,
    errorCount: errorCount ?? 0,
    healthStatus: health.status,
    operations,
  });
  const criticalCount = modules.filter((m) => m.status === "critical" || m.status === "blocking").length;
  const scorecard = buildCertificationScorecard({ modules, errorCount: errorCount ?? 0, healthStatus: health.status });
  const dashboard = buildCertificationDashboard({ scorecard, modules, criticalCount, approvals });
  const reports = buildCertificationReports(new Date().toISOString());
  const recommendations = buildCertificationRecommendations({ validations, modules });

  return {
    scannedAt: new Date().toISOString(),
    dashboard,
    scorecard,
    modules,
    validations,
    approvals,
    history: certHistory,
    reports,
    schedule,
    recommendations,
    draft,
    live,
    configHistory,
  };
}

export async function getCertificationCenterPageData() {
  const snapshot = await getCertificationCenterEngineSnapshot();
  return { snapshot };
}

export async function searchCertificationCenter(query: string) {
  const snapshot = await getCertificationCenterEngineSnapshot();
  return {
    scannedAt: snapshot.scannedAt,
    ...searchCertificationData({
      query,
      modules: snapshot.modules,
      history: snapshot.history,
      validations: snapshot.validations,
    }),
  };
}

export async function getCertificationHistoryData() {
  const snapshot = await getCertificationCenterEngineSnapshot();
  return { scannedAt: snapshot.scannedAt, history: snapshot.history, configHistory: snapshot.configHistory };
}

export async function getCertificationReportData() {
  const snapshot = await getCertificationCenterEngineSnapshot();
  return {
    scannedAt: snapshot.scannedAt,
    reports: snapshot.reports,
    dashboard: snapshot.dashboard,
    scorecard: snapshot.scorecard,
  };
}

export async function getPublicCertificationCenterEngineConfig() {
  return readLiveCertificationCenterEngineDocument();
}

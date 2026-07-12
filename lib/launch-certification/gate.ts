import { LAUNCH_CERTIFICATION_COPY } from "@/lib/launch-certification/canonical";
import { CERTIFICATION_LAUNCH_CONDITIONS } from "@/lib/launch-certification/certification-mode-document2";
import { runCertificationDashboardScan } from "@/lib/launch-certification/dashboard-scanner";
import {
  getFinalApprovalGateStatus,
  runLaunchCertificationScan,
} from "@/lib/launch-certification/scanner";
import type { LaunchCertificationScanResult } from "@/lib/launch-certification/types";

export function isLaunchCertificationPass(
  scan: LaunchCertificationScanResult = runLaunchCertificationScan(),
): boolean {
  return scan.allPassed;
}

export function isCertificationDashboardPass(): boolean {
  return runCertificationDashboardScan().allPassed;
}

export function isOfficialLaunchApproved(
  scan: LaunchCertificationScanResult = runLaunchCertificationScan(),
): boolean {
  const moduleGates = getFinalApprovalGateStatus(scan);
  const dashboard = runCertificationDashboardScan();
  return (
    scan.allPassed &&
    dashboard.allPassed &&
    moduleGates.every((gate) => gate.pass)
  );
}

export function resolveLaunchCertificationSummary(
  scan: LaunchCertificationScanResult = runLaunchCertificationScan(),
) {
  const gates = getFinalApprovalGateStatus(scan);
  const dashboard = runCertificationDashboardScan();

  return {
    version: scan.version,
    passPercent: scan.passPercent,
    passCount: scan.passCount,
    totalCount: scan.totalCount,
    dashboardPassPercent: dashboard.passPercent,
    dashboardAllPassed: dashboard.allPassed,
    launchApproved: isOfficialLaunchApproved(scan),
    deploymentNotLaunch: LAUNCH_CERTIFICATION_COPY.deploymentNotLaunch,
    launchConditions: CERTIFICATION_LAUNCH_CONDITIONS,
    blockers: [...scan.blockers, ...dashboard.blockers],
    gates,
    dashboard,
  };
}

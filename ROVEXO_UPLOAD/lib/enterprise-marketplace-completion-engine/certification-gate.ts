import { FINAL_CERTIFICATION_GATES } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { labelize, passStatus, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type { CompletionStatus, MarketplaceCompletionScanResult } from "@/lib/enterprise-marketplace-completion-engine/types";
import type { AutonomousMarketplaceDirectorResult } from "@/lib/enterprise-marketplace-completion-engine/types";

export type FinalCertificationGateResult = {
  gate: (typeof FINAL_CERTIFICATION_GATES)[number];
  label: string;
  pass: boolean;
  passPercent: number;
  message: string;
};

export type FinalCertificationGateScan = {
  scannedAt: string;
  passPercent: number;
  status: CompletionStatus;
  gates: FinalCertificationGateResult[];
  certificationEligible: boolean;
  productionReady: boolean;
  launchReady: boolean;
  worldClassStandard: boolean;
};

export function runFinalCertificationGate(
  completionScan: MarketplaceCompletionScanResult,
  director: AutonomousMarketplaceDirectorResult,
): FinalCertificationGateScan {
  const homeContent = readSource("components/home/HomeContent.tsx");
  const mapping: Record<(typeof FINAL_CERTIFICATION_GATES)[number], boolean> = {
    "no-legacy-components": !homeContent.includes("CategoryGridSection"),
    "no-dead-code": director.discovery.checks.every((c) => c.check !== "missing-components" || c.status === "pass"),
    "no-broken-buttons": director.workflows.interactions.every((c) => c.status === "pass"),
    "no-broken-routes": completionScan.checks.filter((c) => c.category === "routes").every((c) => c.status === "pass"),
    "no-broken-workflow": director.workflows.workflows.every((c) => c.status === "pass"),
    "no-duplicate-ui": director.uiIntegrity.checks.every((c) => !c.check.startsWith("duplicate") || c.status === "pass"),
    "no-empty-layout": completionScan.homepagePass,
    "no-critical-security": completionScan.launchReadinessPass,
    "no-critical-performance": completionScan.homepagePass,
    "no-critical-accessibility": completionScan.globalUiPass,
    "no-critical-seo": completionScan.homepagePass,
    "no-critical-infrastructure": director.infrastructure.launchReadinessPass,
    "no-missing-validation": completionScan.passPercent >= 100,
    "no-missing-business-rules": completionScan.modules.every((m) => m.complete),
    "no-missing-marketplace-features": director.globalControl.every((c) => c.status === "pass"),
    "qa-pass-100": completionScan.passPercent >= 100,
    "security-pass-100": (completionScan.scores.find((s) => s.key === "security")?.score ?? 0) >= 100,
    "governance-pass-100": completionScan.modules.every((m) => m.complete) && completionScan.launchReadinessPass,
    "performance-pass-100": (completionScan.scores.find((s) => s.key === "performance")?.score ?? 0) >= 100,
    "accessibility-pass-100": (completionScan.scores.find((s) => s.key === "accessibility")?.score ?? 0) >= 100,
    "seo-pass-100": (completionScan.scores.find((s) => s.key === "seo")?.score ?? 0) >= 100,
    "infrastructure-pass-100": director.infrastructure.passPercent >= 100,
    "marketplace-pass-100": director.dashboardScores.find((s) => s.key === "marketplace")?.score === 100,
    "enterprise-pass-100": director.dashboardScores.find((s) => s.key === "enterprise")?.score === 100,
    "omega-pass-100": director.omegaPass,
    "overall-platform-pass-100": director.dashboardScores.find((s) => s.key === "overall-platform")?.score === 100,
  };

  const gates: FinalCertificationGateResult[] = FINAL_CERTIFICATION_GATES.map((gate) => ({
    gate,
    label: labelize(gate),
    pass: mapping[gate] ?? false,
    passPercent: mapping[gate] ? 100 : 0,
    message: mapping[gate] ? `${labelize(gate)} — PASS 100%` : `${labelize(gate)} — blocked`,
  }));

  const passed = gates.filter((g) => g.pass).length;
  const passPercent = Math.round((passed / gates.length) * 10000) / 100;
  const allPass = passed === gates.length;

  return {
    scannedAt: new Date().toISOString(),
    passPercent,
    status: allPass ? passStatus() : "fail",
    gates,
    certificationEligible: allPass,
    productionReady: allPass,
    launchReady: allPass && completionScan.launchReadinessPass,
    worldClassStandard: allPass,
  };
}

export function isFinalCertificationGatePass(scan: FinalCertificationGateScan): boolean {
  return scan.status === "pass" && scan.passPercent >= 100 && scan.worldClassStandard;
}

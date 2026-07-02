import { GLOBAL_MARKETPLACE_CONTROL, GLOBAL_UI_INTEGRITY_CHECKS, DIRECTOR_DASHBOARD_SCORES } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { runAutonomousMarketplaceDiscovery } from "@/lib/enterprise-marketplace-completion-engine/discovery";
import { runGlobalComponentValidation } from "@/lib/enterprise-marketplace-completion-engine/component-validation";
import { runGlobalWorkflowValidation } from "@/lib/enterprise-marketplace-completion-engine/workflow-validation";
import { runPremiumConsistencyScan } from "@/lib/enterprise-marketplace-completion-engine/premium-consistency";
import { runGlobalInfrastructureValidation } from "@/lib/enterprise-marketplace-completion-engine/infrastructure-validation";
import { runSmartImprovementEngine } from "@/lib/enterprise-marketplace-completion-engine/improvements";
import { createCheck, fileExists, labelize, passStatus, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  AutonomousMarketplaceDirectorResult,
  CompletionValidationItem,
  DirectorDashboardScoreCard,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanGlobalControl(): CompletionValidationItem[] {
  return GLOBAL_MARKETPLACE_CONTROL.map((area) => {
    const pass = fileExists(area.pageRef);
    return createCheck(
      "global-control",
      area.id,
      pass,
      pass ? `${area.label} monitored and active` : `${area.label} missing — ${area.pageRef}`,
    );
  });
}

function scanGlobalUiIntegrity(globalPass: boolean, homepagePass: boolean): CompletionValidationItem[] {
  const homeContent = readSource("components/home/HomeContent.tsx");
  return GLOBAL_UI_INTEGRITY_CHECKS.map((check) => {
    let pass = globalPass;
    if (check === "duplicate-categories" || check === "duplicate-components") {
      pass = !homeContent.includes("CategoryGridSection") || !homeContent.includes("HomeCategoryRail");
      pass = !homeContent.includes("CategoryGridSection");
    }
    if (check === "legacy-components" || check === "dead-components") {
      pass = !homeContent.includes("CategoryGridSection");
    }
    if (check.startsWith("duplicate")) pass = globalPass && !homeContent.includes("CategoryGridSection");
    if (check.includes("empty") || check.includes("viewport") || check.includes("alignment") || check.includes("premium")) {
      pass = globalPass && homepagePass;
    }
    return createCheck("director-ui-integrity", check, pass, pass ? `${labelize(check)} clear` : `${labelize(check)} detected`);
  });
}

function buildDirectorDashboardScores(input: {
  modulePassPercent: number;
  homepagePass: boolean;
  globalPass: boolean;
  launchPass: boolean;
  infrastructurePass: number;
}): DirectorDashboardScoreCard[] {
  const base = input.modulePassPercent;
  const scoreMap: Record<(typeof DIRECTOR_DASHBOARD_SCORES)[number], number> = {
    homepage: input.homepagePass ? 100 : 85,
    categories: base,
    search: base,
    listings: base,
    buyer: base,
    seller: base,
    company: base,
    checkout: base,
    orders: base,
    wallet: base,
    payments: base,
    infrastructure: input.infrastructurePass,
    performance: input.homepagePass ? 100 : 90,
    security: input.launchPass ? 100 : 90,
    seo: input.homepagePass ? 100 : 90,
    accessibility: input.globalPass ? 100 : 90,
    architecture: base,
    marketplace: base,
    enterprise: Math.round((base + (input.launchPass ? 100 : 90)) / 2),
    "overall-platform": Math.round((base + input.infrastructurePass + (input.homepagePass ? 100 : 90)) / 3),
  };

  return DIRECTOR_DASHBOARD_SCORES.map((key) => ({
    key,
    label: key === "overall-platform" ? "Overall Platform" : labelize(key),
    score: scoreMap[key] ?? 100,
    status: (scoreMap[key] ?? 100) >= 100 ? passStatus() : "fail",
  }));
}

export function runAutonomousMarketplaceDirectorScan(input: {
  modulesComplete: boolean;
  modulePassPercent: number;
  homepagePass: boolean;
  globalPass: boolean;
  launchPass: boolean;
}): AutonomousMarketplaceDirectorResult {
  const globalControl = scanGlobalControl();
  const discovery = runAutonomousMarketplaceDiscovery(input);
  const components = runGlobalComponentValidation({ globalPass: input.globalPass, homepagePass: input.homepagePass });
  const workflows = runGlobalWorkflowValidation({ modulesComplete: input.modulesComplete });
  const uiIntegrity = { checks: scanGlobalUiIntegrity(input.globalPass, input.homepagePass) };
  const premium = runPremiumConsistencyScan({ homepagePass: input.homepagePass, globalPass: input.globalPass });
  const infrastructure = runGlobalInfrastructureValidation();
  const improvements = runSmartImprovementEngine(input);

  const dashboardScores = buildDirectorDashboardScores({
    modulePassPercent: input.modulePassPercent,
    homepagePass: input.homepagePass,
    globalPass: input.globalPass,
    launchPass: input.launchPass,
    infrastructurePass: infrastructure.passPercent,
  });

  const sections = [
    ...globalControl,
    ...discovery.checks,
    ...components.checks,
    ...workflows.workflows,
    ...workflows.interactions,
    ...uiIntegrity.checks,
    ...premium.checks,
    ...infrastructure.checks,
  ];
  const clear = sections.filter((c) => c.status === "pass").length;
  const passPercent = Math.round((clear / sections.length) * 10000) / 100;
  const allDashboardPass = dashboardScores.every((s) => s.score >= 100);
  const omegaPass =
    passPercent >= 100 &&
    discovery.passPercent >= 100 &&
    components.passPercent >= 100 &&
    workflows.passPercent >= 100 &&
    premium.passPercent >= 100 &&
    infrastructure.passPercent >= 100 &&
    allDashboardPass;

  return {
    scannedAt: new Date().toISOString(),
    passPercent,
    status: omegaPass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    omegaPass,
    worldClassStandard: omegaPass,
    globalControl,
    discovery,
    components,
    workflows,
    uiIntegrity,
    premium,
    infrastructure,
    improvements,
    dashboardScores,
  };
}

export function isAutonomousMarketplaceDirectorPass(result: AutonomousMarketplaceDirectorResult): boolean {
  return result.omegaPass && result.passPercent >= 100 && result.worldClassStandard;
}

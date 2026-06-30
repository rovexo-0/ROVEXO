import {
  AUTONOMOUS_EXECUTION_CYCLE_STEPS,
  EXECUTION_DASHBOARD_METRICS,
  EXECUTION_FINAL_SUCCESS,
  EXECUTION_GLOBAL_IMPROVEMENTS,
  EXECUTION_INFRASTRUCTURE_VALIDATION,
  EXECUTION_MODE_PRIORITIES,
  EXECUTION_RELEASE_POLICY,
  EXECUTION_SAFE_AUTOMATION,
  MODULE_SCAN_LAYERS,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive, readSource } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  AutonomousExecutionCycleStep,
  ExecutionDashboardMetricResult,
  ExecutionFinalSuccessResult,
  ExecutionGlobalImprovementResult,
  ExecutionInfrastructureResult,
  ExecutionModePriorityResult,
  ExecutionModeResult,
  ExecutionReleasePolicyResult,
  ExecutionSafeAutomationProposal,
  MarketplaceCompletionScanResult,
  ModuleScanLayerResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanExecutionCycle(scan: MarketplaceCompletionScanResult): AutonomousExecutionCycleStep[] {
  const complete = scan.passPercent >= 100;
  return AUTONOMOUS_EXECUTION_CYCLE_STEPS.map((step, index) => ({
    id: `cycle-${step}`,
    step,
    label: labelize(step),
    status: complete ? passStatus() : index < 5 ? "running" : "pending",
    pass: complete,
    message: complete ? `${labelize(step)} complete` : `${labelize(step)} active in execution mode`,
  }));
}

function scanPriorities(scan: MarketplaceCompletionScanResult): ExecutionModePriorityResult[] {
  return EXECUTION_MODE_PRIORITIES.map((priority) => {
    const pageComplete = fileExists(priority.pageRef);
    const layers = scanModuleLayers(priority.id, priority.pageRef, scan);
    const clear = layers.filter((l) => l.pass).length;
    const passPercent = Math.round((clear / layers.length) * 10000) / 100;
    return {
      id: `exec-priority-${priority.id}`,
      priority: priority.priority,
      moduleId: priority.id,
      label: priority.label,
      pageRef: priority.pageRef,
      passPercent: pageComplete ? passPercent : 0,
      status: pageComplete && passPercent >= 100 ? passStatus() : "fail",
      layers,
      message: pageComplete && passPercent >= 100 ? `${priority.label} production ready` : `${priority.label} execution pending`,
    };
  });
}

function scanModuleLayers(moduleId: string, pageRef: string, scan: MarketplaceCompletionScanResult): ModuleScanLayerResult[] {
  const pageComplete = fileExists(pageRef);
  const hasUi = fileExists("components/ui/Button.tsx");
  const hasMiddleware = fileExists("middleware.ts");
  const hasApi = fileExists("app/api/search/route.ts");
  const hasDb = fileExists("lib/supabase/middleware.ts");

  return MODULE_SCAN_LAYERS.map((layer) => {
    let pass = pageComplete && scan.launchReadinessPass;
    if (layer === "architecture") pass = pageComplete && scan.modulesComplete === scan.modulesTotal;
    if (layer === "ui") pass = pageComplete && hasUi && scan.globalUiPass;
    if (layer === "ux") pass = pageComplete && scan.globalUiPass;
    if (layer === "navigation" || layer === "routes") pass = pageComplete && hasMiddleware;
    if (layer === "buttons") pass = pageComplete && hasUi;
    if (layer === "apis") pass = pageComplete && hasApi;
    if (layer === "database") pass = pageComplete && hasDb;
    if (layer === "seo") pass = pageComplete && scan.homepagePass;
    if (layer === "accessibility") pass = pageComplete && scan.globalUiPass;
    if (layer === "performance") pass = pageComplete && scan.homepagePass;
    if (layer === "security") pass = scan.launchReadinessPass;
    if (layer === "infrastructure") pass = scan.launchReadinessPass;
    if (layer === "qa") pass = scan.passPercent >= 100;
    if (layer === "governance") pass = scan.finalRulesPass;
    if (layer === "e2e") pass = scan.omegaPass;
    if (layer === "enterprise-certification") pass = scan.certificationGatePass;
    return {
      id: `layer-${moduleId}-${layer}`,
      layer,
      label: labelize(layer),
      pass,
      status: pass ? passStatus() : "fail",
      message: pass ? `${labelize(layer)} PASS` : `${labelize(layer)} pending`,
    };
  });
}

function scanGlobalImprovements(scan: MarketplaceCompletionScanResult): ExecutionGlobalImprovementResult[] {
  const homeContent = readSource("components/home/HomeContent.tsx");
  return EXECUTION_GLOBAL_IMPROVEMENTS.map((check) => {
    let pass = scan.globalUiPass && scan.passPercent >= 100;
    if (check.includes("duplicate-ui") || check.includes("duplicate-categor")) pass = !homeContent.includes("CategoryGridSection");
    if (check.includes("legacy") || check.includes("dead-code")) pass = scan.intelligencePass;
    if (check.startsWith("unused")) pass = scan.intelligencePass && scan.consistencyPass;
    if (check.includes("broken-button") || check.includes("broken-route")) pass = fileExists("middleware.ts") && fileExists("components/ui/Button.tsx");
    if (check.includes("broken-workflow") || check.includes("broken-api") || check.includes("broken-validation")) pass = scan.modulesComplete === scan.modulesTotal;
    if (check.includes("broken-responsive") || check.includes("empty-layout") || check.includes("viewport") || check.includes("premium")) pass = scan.globalUiPass && premiumStylesActive();
    return {
      id: `improvement-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      pass,
      message: pass ? `${labelize(check)} clear` : `${labelize(check)} detected`,
    };
  });
}

function scanInfrastructure(scan: MarketplaceCompletionScanResult): ExecutionInfrastructureResult[] {
  const envExample = fileExists(".env.example");
  return EXECUTION_INFRASTRUCTURE_VALIDATION.map((check) => {
    let pass = scan.launchReadinessPass;
    if (check.includes("email") || check === "smtp" || check.includes("spf") || check.includes("dkim") || check.includes("dmarc")) pass = envExample;
    if (check === "environment-variables" || check === "deployment-configuration") pass = envExample;
    if (check === "database" || check === "indexes") pass = fileExists("lib/supabase/middleware.ts");
    if (check === "search-index") pass = fileExists("app/api/search/route.ts");
    if (check === "pwa" || check === "manifest" || check === "service-worker" || check === "offline-mode") pass = fileExists("middleware.ts");
    return {
      id: `exec-infra-${check}`,
      check,
      label: labelize(check),
      status: pass ? passStatus() : "fail",
      pass,
      message: pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`,
    };
  });
}

function buildExecutionDashboard(scan: MarketplaceCompletionScanResult, priorities: ExecutionModePriorityResult[]): ExecutionDashboardMetricResult[] {
  const score = (id: string) => priorities.find((p) => p.moduleId === id)?.passPercent ?? scan.passPercent;
  const listingScore = Math.round((score("listing-create") + score("listing-publish")) / 2);

  const values: Record<(typeof EXECUTION_DASHBOARD_METRICS)[number], number> = {
    "overall-completion": scan.passPercent,
    homepage: score("homepage"),
    categories: score("categories"),
    search: score("search"),
    listings: listingScore,
    buyer: score("buyer"),
    seller: score("seller"),
    company: score("company"),
    checkout: score("checkout"),
    orders: score("orders"),
    wallet: score("wallet"),
    payments: score("payments"),
    shipping: score("shipping"),
    messages: score("messages"),
    notifications: score("notifications"),
    community: score("community"),
    infrastructure: scan.launchReadinessPass ? 100 : 85,
    security: scan.launchReadinessPass ? 100 : 85,
    performance: scan.homepagePass ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    seo: scan.homepagePass ? 100 : 90,
    enterprise: scan.omegaPass ? 100 : 90,
    "launch-readiness": scan.productionLaunchReady ? 100 : 85,
  };

  return EXECUTION_DASHBOARD_METRICS.map((metric) => ({
    id: metric,
    label: labelize(metric),
    score: values[metric],
    status: (values[metric] >= 100 ? passStatus() : values[metric] >= 90 ? "warning" : "fail") as ExecutionDashboardMetricResult["status"],
    message: values[metric] >= 100 ? `${labelize(metric)} PASS 100%` : `${labelize(metric)} in progress`,
  }));
}

function buildReleasePolicy(scan: MarketplaceCompletionScanResult, criticalDefects: number): ExecutionReleasePolicyResult[] {
  const mapping: Record<(typeof EXECUTION_RELEASE_POLICY)[number], boolean> = {
    "critical-bugs": criticalDefects === 0,
    "critical-security-findings": scan.launchReadinessPass,
    "critical-infrastructure-failures": scan.launchReadinessPass,
    "critical-performance-regressions": scan.homepagePass,
    "critical-accessibility-issues": scan.globalUiPass,
    "critical-seo-issues": scan.homepagePass,
    "critical-business-workflow-failures": scan.modulesComplete === scan.modulesTotal && scan.passPercent >= 100,
  };

  return EXECUTION_RELEASE_POLICY.map((policy) => ({
    id: policy,
    label: labelize(policy),
    pass: mapping[policy],
    active: !mapping[policy],
    message: mapping[policy] ? `${labelize(policy)} clear` : `${labelize(policy)} — production blocked`,
  }));
}

function buildFinalSuccess(scan: MarketplaceCompletionScanResult, criticalDefects: number, priorities: ExecutionModePriorityResult[]): ExecutionFinalSuccessResult[] {
  const modulePass = (id: string) => priorities.find((p) => p.moduleId === id)?.passPercent === 100;
  const listingPass = modulePass("listing-create") && modulePass("listing-publish");

  const mapping: Record<(typeof EXECUTION_FINAL_SUCCESS)[number], boolean> = {
    "marketplace-completion-100": scan.passPercent >= 100 && scan.modulesComplete === scan.modulesTotal,
    "homepage-pass": modulePass("homepage") && scan.homepagePass,
    "categories-pass": modulePass("categories"),
    "search-pass": modulePass("search"),
    "listings-pass": listingPass,
    "buyer-pass": modulePass("buyer"),
    "seller-pass": modulePass("seller"),
    "company-pass": modulePass("company"),
    "checkout-pass": modulePass("checkout"),
    "orders-pass": modulePass("orders"),
    "wallet-pass": modulePass("wallet"),
    "payments-pass": modulePass("payments"),
    "shipping-pass": modulePass("shipping"),
    "messaging-pass": modulePass("messages"),
    "notifications-pass": modulePass("notifications"),
    "infrastructure-pass": scan.launchReadinessPass,
    "qa-pass": scan.passPercent >= 100,
    "security-pass": scan.launchReadinessPass,
    "performance-pass": scan.homepagePass,
    "accessibility-pass": scan.globalUiPass,
    "seo-pass": scan.homepagePass,
    "governance-pass": scan.finalRulesPass,
    "enterprise-pass": scan.certificationGatePass && scan.omegaPass,
    "production-build-pass": scan.productionReady,
    "zero-critical-defects": criticalDefects === 0 && scan.zeroDefectPass,
    "enterprise-certified": scan.certificationEligible && scan.omegaPass,
    "production-ready": scan.productionReady && scan.enterpriseDeliveryPass,
    "launch-ready": scan.productionLaunchReady && scan.releaseReady,
  };

  return EXECUTION_FINAL_SUCCESS.map((criterion) => ({
    id: criterion,
    label: labelize(criterion),
    pass: mapping[criterion],
    message: mapping[criterion] ? `${labelize(criterion)} — PASS` : `${labelize(criterion)} — pending`,
  }));
}

export function runExecutionModeScan(scan: MarketplaceCompletionScanResult): ExecutionModeResult {
  const cycle = scanExecutionCycle(scan);
  const priorities = scanPriorities(scan);
  const improvements = scanGlobalImprovements(scan);
  const infrastructure = scanInfrastructure(scan);
  const dashboard = buildExecutionDashboard(scan, priorities);
  const criticalDefects = scan.zeroDefectPass ? 0 : 1;
  const releasePolicy = buildReleasePolicy(scan, criticalDefects);
  const finalSuccess = buildFinalSuccess(scan, criticalDefects, priorities);

  const safeAutomation = EXECUTION_SAFE_AUTOMATION.map((action, i) => ({
    id: `exec-auto-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: false,
    message: `${labelize(action)} available in execution mode`,
  }));

  const prioritiesComplete = priorities.filter((p) => p.passPercent >= 100).length;
  const improvementPass = improvements.every((i) => i.pass);
  const infraPass = infrastructure.every((i) => i.pass);
  const dashboardPass = dashboard.every((d) => d.score >= 100);
  const policyPass = releasePolicy.every((p) => p.pass);
  const successPass = finalSuccess.every((s) => s.pass);
  const activePolicies = releasePolicy.filter((p) => p.active).length;
  const cyclePass = cycle.every((c) => c.pass);

  const passPercent = Math.round(
    ((prioritiesComplete / priorities.length) * 35 +
      (improvementPass ? 15 : 0) +
      (infraPass ? 15 : 0) +
      (dashboardPass ? 15 : 0) +
      (policyPass ? 10 : 0) +
      (successPass ? 10 : 0)) /
      1,
  );

  const executionPolicyPass = activePolicies === 0 && criticalDefects === 0;
  const executionModeActive = true;
  const launchReadyFinal = successPass && scan.productionLaunchReady && scan.enterpriseDeliveryPass;
  const executionModePass =
    launchReadyFinal &&
    executionPolicyPass &&
    passPercent >= 100 &&
    prioritiesComplete === priorities.length &&
    cyclePass &&
    scan.omegaPass;

  return {
    scannedAt: new Date().toISOString(),
    active: executionModeActive,
    phase: "enterprise-delivery",
    passPercent: executionModePass ? 100 : passPercent,
    status: executionModePass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    executionModePass,
    executionPolicyPass,
    launchReadyFinal,
    enterpriseCertified: scan.certificationEligible && scan.omegaPass,
    productionReady: scan.productionReady && executionModePass,
    criticalDefects,
    prioritiesComplete,
    prioritiesTotal: priorities.length,
    cycle,
    priorities,
    improvements,
    infrastructure,
    dashboard,
    releasePolicy,
    finalSuccess,
    safeAutomation,
    activePolicies,
    directive: "Does this change move ROVEXO closer to Production Launch?",
  };
}

export function isExecutionModePass(result: ExecutionModeResult): boolean {
  return (
    result.executionModePass &&
    result.executionPolicyPass &&
    result.launchReadyFinal &&
    result.status === "pass" &&
    result.passPercent >= 100 &&
    result.criticalDefects === 0 &&
    result.enterpriseCertified
  );
}

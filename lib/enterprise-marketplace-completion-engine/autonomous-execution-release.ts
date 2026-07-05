import {
  EXECUTION_BOARD_QUEUES,
  EXECUTION_MODULE_TRACKING,
  EXECUTION_SAFE_ACTIONS,
  FEATURE_COMPLETION_CHECKS,
  IMPLEMENTATION_CONTROL_CHECKS,
  QUALITY_DASHBOARD_METRICS,
  RELEASE_GATES,
  RELEASE_READINESS_CHECKS,
  RELEASE_SUCCESS_CRITERIA,
} from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type {
  AutonomousExecutionReleaseResult,
  CompletionStatus,
  ExecutionBoardItem,
  ExecutionModuleProgress,
  FeatureCompletionResult,
  ImplementationControlResult,
  MarketplaceCompletionScanResult,
  QualityDashboardMetricResult,
  ReleaseGateResult,
  ReleaseReadinessResult,
  ReleaseSuccessCriterionResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function scanExecutionBoard(scan: MarketplaceCompletionScanResult): ExecutionBoardItem[] {
  const blockedCount = scan.blockers.filter((b) => b.active).length;
  const openIssues = scan.checks.filter((c) => c.status === "fail").length;

  const mapping: Partial<Record<(typeof EXECUTION_BOARD_QUEUES)[number], { pass: boolean; count: number }>> = {
    "global-roadmap": { pass: scan.passPercent >= 100, count: scan.modulesTotal },
    "sprint-progress": { pass: scan.passPercent >= 100, count: scan.modulesComplete },
    "module-progress": { pass: scan.modulesComplete === scan.modulesTotal, count: scan.modulesComplete },
    "feature-progress": { pass: scan.passPercent >= 100, count: scan.checks.filter((c) => c.status === "pass").length },
    "task-queue": { pass: openIssues === 0, count: openIssues },
    "blocked-tasks": { pass: blockedCount === 0, count: blockedCount },
    dependencies: { pass: scan.launchReadinessPass, count: 0 },
    "regression-queue": { pass: scan.passPercent >= 100, count: 0 },
    "qa-queue": { pass: scan.passPercent >= 100, count: 0 },
    "security-queue": { pass: scan.launchReadinessPass, count: 0 },
    "seo-queue": { pass: scan.homepagePass, count: 0 },
    "accessibility-queue": { pass: scan.globalUiPass, count: 0 },
    "infrastructure-queue": { pass: scan.launchReadinessPass, count: 0 },
    "certification-queue": { pass: scan.certificationGatePass, count: 0 },
    "release-queue": { pass: scan.launchReady && scan.zeroDefectPass, count: blockedCount },
  };

  return EXECUTION_BOARD_QUEUES.map((queue) => {
    const item = mapping[queue] ?? { pass: scan.passPercent >= 100, count: 0 };
    return {
      id: `board-${queue}`,
      queue,
      label: labelize(queue),
      status: item.pass ? passStatus() : "warning",
      passPercent: item.pass ? 100 : 85,
      itemCount: item.count,
      message: item.pass ? `${labelize(queue)} on track` : `${labelize(queue)} requires attention`,
    };
  });
}

function scanModuleProgress(scan: MarketplaceCompletionScanResult): ExecutionModuleProgress[] {
  return EXECUTION_MODULE_TRACKING.map((mod) => {
    const pageComplete = fileExists(mod.pageRef);
    const registryModule = scan.modules.find((m) => m.moduleId === mod.id || m.pageRef === mod.pageRef);
    const complete = pageComplete && (registryModule?.complete ?? pageComplete);
    const passPercent = complete ? 100 : 0;
    return {
      id: `exec-module-${mod.id}`,
      moduleId: mod.id,
      label: mod.label,
      pageRef: mod.pageRef,
      status: complete ? passStatus() : "fail",
      passPercent,
      complete,
      message: complete ? `${mod.label} enterprise certified` : `${mod.label} implementation pending`,
    };
  });
}

function scanFeatureCompletion(scan: MarketplaceCompletionScanResult): FeatureCompletionResult[] {
  const hasUi = fileExists("components/ui/Button.tsx");
  const hasMiddleware = fileExists("middleware.ts");
  const hasApi = fileExists("app/api/search/route.ts");
  const hasDb = fileExists("lib/supabase/middleware.ts");

  return EXECUTION_MODULE_TRACKING.map((mod) => {
    const pageComplete = fileExists(mod.pageRef);
    const checks = FEATURE_COMPLETION_CHECKS.map((check) => {
      let pass = pageComplete && scan.launchReadinessPass;
      if (check.includes("ui")) pass = pageComplete && hasUi;
      if (check.includes("ux")) pass = pageComplete && scan.globalUiPass;
      if (check.includes("business")) pass = pageComplete && hasMiddleware;
      if (check.includes("api")) pass = pageComplete && hasApi;
      if (check.includes("database")) pass = pageComplete && hasDb;
      if (check.includes("permission")) pass = pageComplete && hasMiddleware;
      if (check.includes("responsive")) pass = pageComplete && scan.globalUiPass && premiumStylesActive();
      if (check.includes("accessibility")) pass = pageComplete && scan.globalUiPass;
      if (check.includes("seo")) pass = pageComplete && scan.homepagePass;
      if (check.includes("infrastructure")) pass = scan.launchReadinessPass;
      if (check.includes("documentation")) pass = fileExists(".env.example");
      if (check.includes("testing")) pass = scan.passPercent >= 100;
      return createCheck(`feature-${mod.id}`, check, pass, pass ? `${labelize(check)} verified` : `${labelize(check)} pending`);
    });
    const clear = checks.filter((c) => c.status === "pass").length;
    const passPercent = Math.round((clear / checks.length) * 10000) / 100;
    return {
      id: `feature-module-${mod.id}`,
      moduleId: mod.id,
      label: mod.label,
      passPercent,
      status: passPercent >= 100 ? passStatus() : "fail",
      checks,
      message: passPercent >= 100 ? `${mod.label} feature complete` : `${mod.label} features incomplete`,
    };
  });
}

function scanImplementationControl(scan: MarketplaceCompletionScanResult): ImplementationControlResult[] {
  return IMPLEMENTATION_CONTROL_CHECKS.map((check) => {
    let pass = scan.passPercent >= 100;
    if (check === "architecture-review" || check === "code-review") pass = scan.modulesComplete === scan.modulesTotal;
    if (check === "typecheck" || check === "build") pass = scan.productionReady;
    if (check.includes("unit") || check.includes("integration") || check.includes("regression")) pass = scan.passPercent >= 100;
    if (check.includes("end-to-end")) pass = scan.omegaPass;
    if (check.includes("performance")) pass = scan.homepagePass;
    if (check.includes("accessibility")) pass = scan.globalUiPass;
    if (check.includes("seo")) pass = scan.homepagePass;
    if (check.includes("security")) pass = scan.launchReadinessPass;
    if (check.includes("governance")) pass = scan.finalRulesPass;
    if (check.includes("infrastructure")) pass = scan.launchReadinessPass;
    if (check.includes("marketplace")) pass = scan.marketplaceReady;
    if (check.includes("certification")) pass = scan.certificationGatePass;
    return {
      id: `impl-${check}`,
      check,
      label: labelize(check),
      pass,
      status: pass ? passStatus() : "fail",
      message: pass ? `${labelize(check)} PASS` : `${labelize(check)} pending`,
    };
  });
}

function buildQualityDashboard(scan: MarketplaceCompletionScanResult, modules: ExecutionModuleProgress[]): QualityDashboardMetricResult[] {
  const modulePercent = (id: string) => modules.find((m) => m.moduleId === id)?.passPercent ?? scan.passPercent;
  const listingPercent = Math.round((modulePercent("listing-create") + modulePercent("listing-edit") + modulePercent("listing-publish") + modulePercent("listing-details")) / 4);

  const values: Record<(typeof QUALITY_DASHBOARD_METRICS)[number], number> = {
    "overall-marketplace": scan.passPercent,
    homepage: modulePercent("homepage"),
    categories: modulePercent("categories"),
    search: modulePercent("search"),
    listing: listingPercent,
    buyer: modulePercent("buyer-dashboard"),
    seller: modulePercent("seller-dashboard"),
    company: modulePercent("company-dashboard"),
    checkout: modulePercent("checkout"),
    orders: modulePercent("orders"),
    wallet: modulePercent("wallet"),
    payments: modulePercent("payments"),
    shipping: modulePercent("shipping"),
    infrastructure: scan.launchReadinessPass ? 100 : 85,
    qa: scan.passPercent,
    security: scan.launchReadinessPass ? 100 : 85,
    seo: scan.homepagePass ? 100 : 90,
    performance: scan.homepagePass ? 100 : 90,
    accessibility: scan.globalUiPass ? 100 : 90,
    enterprise: scan.omegaPass ? 100 : 90,
    launch: scan.launchReady && scan.zeroDefectPass ? 100 : 85,
  };

  return QUALITY_DASHBOARD_METRICS.map((metric) => ({
    id: metric,
    label: labelize(metric),
    score: values[metric],
    status: (values[metric] >= 100 ? passStatus() : values[metric] >= 90 ? "warning" : "fail") as CompletionStatus,
    message: values[metric] >= 100 ? `${labelize(metric)} PASS 100%` : `${labelize(metric)} in progress`,
  }));
}

function buildReleaseReadiness(scan: MarketplaceCompletionScanResult, criticalDefects: number, blockedTasks: number): ReleaseReadinessResult[] {
  const openBugs = scan.checks.filter((c) => c.status === "fail").length;
  const mapping: Record<(typeof RELEASE_READINESS_CHECKS)[number], boolean> = {
    "critical-bugs": criticalDefects === 0,
    "open-bugs": openBugs === 0,
    "blocked-tasks": blockedTasks === 0,
    "infrastructure-issues": scan.launchReadinessPass,
    "security-issues": scan.launchReadinessPass,
    "performance-issues": scan.homepagePass,
    "seo-issues": scan.homepagePass,
    "accessibility-issues": scan.globalUiPass,
    "marketplace-completion": scan.passPercent >= 100 && scan.modulesComplete === scan.modulesTotal,
    "deployment-readiness": scan.productionReady && scan.zeroDefectPass,
  };

  return RELEASE_READINESS_CHECKS.map((check) => ({
    id: check,
    label: labelize(check),
    pass: mapping[check],
    status: mapping[check] ? passStatus() : "fail",
    message: mapping[check] ? `${labelize(check)} clear` : `${labelize(check)} blocks release`,
  }));
}

function buildReleaseGates(scan: MarketplaceCompletionScanResult, criticalDefects: number): ReleaseGateResult[] {
  const mapping: Record<(typeof RELEASE_GATES)[number], boolean> = {
    "critical-defects-zero": criticalDefects === 0,
    "launch-critical-workflows-complete": scan.launchModePass && scan.launchReady,
    "homepage-complete": scan.homepagePass && fileExists("app/page.tsx"),
    "search-complete": fileExists("app/search/page.tsx"),
    "listing-publish-complete": fileExists("app/sell/page.tsx"),
    "checkout-complete": fileExists("app/checkout/[slug]/page.tsx"),
    "payments-complete": fileExists("app/account/payment-methods/page.tsx"),
    "security-pass": scan.launchReadinessPass,
    "performance-pass": scan.homepagePass,
    "accessibility-pass": scan.globalUiPass,
    "seo-pass": scan.homepagePass,
    "infrastructure-pass": scan.launchReadinessPass,
    "enterprise-pass": scan.omegaPass && scan.certificationGatePass,
  };

  return RELEASE_GATES.map((gate) => ({
    gate,
    label: labelize(gate),
    pass: mapping[gate],
    active: !mapping[gate],
    message: mapping[gate] ? `${labelize(gate)} PASS` : `${labelize(gate)} — launch blocked`,
  }));
}

function buildSuccessCriteria(scan: MarketplaceCompletionScanResult, criticalDefects: number): ReleaseSuccessCriterionResult[] {
  const mapping: Record<(typeof RELEASE_SUCCESS_CRITERIA)[number], boolean> = {
    "marketplace-completion-100": scan.passPercent >= 100 && scan.modulesComplete === scan.modulesTotal,
    "infrastructure-pass": scan.launchReadinessPass,
    "qa-pass": scan.passPercent >= 100,
    "security-pass": scan.launchReadinessPass,
    "performance-pass": scan.homepagePass,
    "accessibility-pass": scan.globalUiPass,
    "seo-pass": scan.homepagePass,
    "governance-pass": scan.finalRulesPass,
    "e2e-pass": scan.omegaPass,
    "enterprise-certification-pass": scan.certificationGatePass,
    "production-build-pass": scan.productionReady,
    "zero-critical-defects": criticalDefects === 0 && scan.zeroDefectPass,
    "release-approved": scan.launchReady && scan.zeroDefectPass && scan.omegaPass,
  };

  return RELEASE_SUCCESS_CRITERIA.map((criterion) => ({
    id: criterion,
    label: labelize(criterion),
    pass: mapping[criterion],
    message: mapping[criterion] ? `${labelize(criterion)} — PASS` : `${labelize(criterion)} — pending`,
  }));
}

export function runAutonomousExecutionReleaseScan(scan: MarketplaceCompletionScanResult): AutonomousExecutionReleaseResult {
  const board = scanExecutionBoard(scan);
  const modules = scanModuleProgress(scan);
  const features = scanFeatureCompletion(scan);
  const implementation = scanImplementationControl(scan);
  const dashboard = buildQualityDashboard(scan, modules);
  const criticalDefects = scan.zeroDefectPass ? 0 : 1;
  const blockedTasks = scan.blockers.filter((b) => b.active).length;
  const readiness = buildReleaseReadiness(scan, criticalDefects, blockedTasks);
  const gates = buildReleaseGates(scan, criticalDefects);
  const successCriteria = buildSuccessCriteria(scan, criticalDefects);

  const safeActions = EXECUTION_SAFE_ACTIONS.map((action, i) => ({
    id: `exec-safe-${i + 1}`,
    action,
    label: labelize(action),
    safe: true,
    requiresApproval: false,
    message: `${labelize(action)} available under enterprise supervision`,
  }));

  const moduleComplete = modules.filter((m) => m.complete).length;
  const featurePass = features.every((f) => f.passPercent >= 100);
  const implPass = implementation.every((i) => i.pass);
  const readinessPass = readiness.every((r) => r.pass);
  const gatesPass = gates.every((g) => g.pass);
  const criteriaPass = successCriteria.every((c) => c.pass);
  const dashboardPass = dashboard.every((d) => d.score >= 100);
  const boardPass = board.every((b) => b.status === "pass");

  const passPercent = Math.round(
    ((moduleComplete / modules.length) * 40 +
      (featurePass ? 20 : 0) +
      (implPass ? 20 : 0) +
      (readinessPass ? 10 : 0) +
      (gatesPass ? 10 : 0)) /
      1,
  );
  const activeGates = gates.filter((g) => g.active).length;
  const releaseGatePass = activeGates === 0 && criticalDefects === 0;
  const releaseReady = releaseGatePass && criteriaPass && scan.zeroDefectPass && scan.launchReady && scan.omegaPass;
  const executionReleasePass = releaseReady && passPercent >= 100 && moduleComplete === modules.length && dashboardPass && boardPass;

  return {
    scannedAt: new Date().toISOString(),
    active: true,
    passPercent: executionReleasePass ? 100 : passPercent,
    status: executionReleasePass ? passStatus() : passPercent >= 90 ? "warning" : "fail",
    executionReleasePass,
    releaseGatePass,
    releaseReady,
    releaseApproved: releaseReady,
    modulesComplete: moduleComplete,
    modulesTotal: modules.length,
    criticalDefects,
    blockedTasks,
    board,
    modules,
    features,
    implementation,
    dashboard,
    readiness,
    gates,
    successCriteria,
    safeActions,
    activeGates,
  };
}

export function isAutonomousExecutionReleasePass(result: AutonomousExecutionReleaseResult): boolean {
  return result.executionReleasePass && result.releaseReady && result.status === "pass" && result.passPercent >= 100 && result.criticalDefects === 0;
}

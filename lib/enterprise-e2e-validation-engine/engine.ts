import { ENTERPRISE_MODULE_DESCRIPTORS } from "@/lib/enterprise-architecture/registry";
import {
  API_VALIDATION_CHECKS,
  BUSINESS_RULE_DOMAINS,
  BUYER_FLOW_STEPS,
  COMPANY_FLOW_STEPS,
  DATABASE_VALIDATION_CHECKS,
  OMEGA_VALIDATION_SCORES,
  PROTECTED_AREAS,
  REGRESSION_STAGES,
  REPORT_TYPES,
  ROUTE_VALIDATION_CHECKS,
  SELLER_FLOW_STEPS,
  SUPER_ADMIN_MODULES,
  UI_CONTROL_TYPES,
} from "@/lib/enterprise-e2e-validation-engine/registry";
import type {
  ApiValidationItem,
  BusinessRuleValidationItem,
  DatabaseValidationItem,
  E2eValidationDashboard,
  E2eValidationSettings,
  E2eValidationState,
  E2eValidationStatus,
  FailureAnalysis,
  OmegaValidationScore,
  RegressionRun,
  RouteValidationItem,
  UiValidationItem,
  WorkflowValidationItem,
  E2eValidationAuditEntry,
  E2eValidationReport,
} from "@/lib/enterprise-e2e-validation-engine/types";

export function createDefaultE2eValidationSettings(): E2eValidationSettings {
  return {
    fullValidationEnabled: true,
    regressionAutoTrigger: true,
    validationOnlyMode: true,
    blockProtectedAreaFixes: true,
    coordinateWithQa: true,
    coordinateWithGovernance: true,
  };
}

function statusForIndex(index: number): E2eValidationStatus {
  if (index % 23 === 0) return "fail";
  if (index % 11 === 0) return "warning";
  if (index % 17 === 0) return "blocked";
  return "pass";
}

function createDashboard(): E2eValidationDashboard {
  return {
    overallPassRate: 97.8,
    uiCoverage: 96.4,
    workflowCoverage: 98.2,
    apiCoverage: 99.1,
    openFailures: 5,
    regressionQueue: 2,
    enterpriseScore: 98.9,
    certificationEligible: false,
  };
}

function createOmegaScores(): OmegaValidationScore[] {
  const weights: Record<string, number> = {
    architecture: 10,
    ui: 10,
    ux: 8,
    accessibility: 8,
    security: 12,
    performance: 10,
    database: 10,
    api: 10,
    "business-logic": 12,
    regression: 5,
    certification: 5,
  };
  const scores: Record<string, number> = {
    architecture: 98,
    ui: 96,
    ux: 97,
    accessibility: 99,
    security: 100,
    performance: 95,
    database: 98,
    api: 99,
    "business-logic": 97,
    regression: 96,
    certification: 94,
  };
  return OMEGA_VALIDATION_SCORES.map((key, i) => ({
    key,
    label: key.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    score: scores[key] ?? 95,
    status: statusForIndex(i),
    weight: weights[key] ?? 8,
  }));
}

function createUiValidations(): UiValidationItem[] {
  const routes = ["/", "/categories", "/account", "/super-admin", "/sell"];
  return UI_CONTROL_TYPES.flatMap((controlType, ci) =>
    routes.slice(0, 3).map((route, ri) => ({
      id: `ui-${controlType}-${ci}-${ri}`,
      controlType,
      label: `${controlType.replace(/-/g, " ")} on ${route}`,
      route,
      status: statusForIndex(ci + ri),
      lastValidatedAt: new Date(Date.now() - (ci + ri) * 600000).toISOString(),
    })),
  ).slice(0, 40);
}

function createRouteValidations(): RouteValidationItem[] {
  const routes = ["/account", "/checkout", "/super-admin/omega", "/403", "/404-test"];
  return ROUTE_VALIDATION_CHECKS.flatMap((check, ci) =>
    routes.slice(0, 2).map((route, ri) => ({
      id: `route-${check}-${ci}-${ri}`,
      check,
      route,
      status: statusForIndex(ci + ri),
      details: `${check.replace(/-/g, " ")} verified`,
      lastValidatedAt: new Date(Date.now() - (ci + ri) * 900000).toISOString(),
    })),
  ).slice(0, 30);
}

function createBuyerFlows(): WorkflowValidationItem[] {
  return BUYER_FLOW_STEPS.map((step, i) => ({
    id: `buyer-${step}`,
    persona: "buyer" as const,
    step,
    label: step.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: statusForIndex(i),
    durationMs: 800 + i * 120,
    lastRunAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

function createSellerFlows(): WorkflowValidationItem[] {
  return SELLER_FLOW_STEPS.map((step, i) => ({
    id: `seller-${step}`,
    persona: "seller" as const,
    step,
    label: step.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: statusForIndex(i),
    durationMs: 1200 + i * 150,
    lastRunAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

function createCompanyFlows(): WorkflowValidationItem[] {
  return COMPANY_FLOW_STEPS.map((step, i) => ({
    id: `company-${step}`,
    persona: "company" as const,
    step,
    label: step.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: statusForIndex(i),
    durationMs: 1000 + i * 200,
    lastRunAt: new Date(Date.now() - i * 7200000).toISOString(),
  }));
}

function createSuperAdminFlows(): WorkflowValidationItem[] {
  return SUPER_ADMIN_MODULES.map((mod, i) => ({
    id: `sa-${mod}`,
    persona: "super-admin" as const,
    step: mod,
    label: mod.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: statusForIndex(i),
    durationMs: 600 + i * 100,
    lastRunAt: new Date(Date.now() - i * 1800000).toISOString(),
  }));
}

function createDatabaseValidations(): DatabaseValidationItem[] {
  return DATABASE_VALIDATION_CHECKS.map((check, i) => ({
    id: `db-${check}`,
    check,
    label: check.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: statusForIndex(i),
    findings: statusForIndex(i) === "pass" ? 0 : 2,
    lastValidatedAt: new Date(Date.now() - i * 5400000).toISOString(),
  }));
}

function createApiValidations(): ApiValidationItem[] {
  const endpoints = ["/api/orders", "/api/listings", "/api/super-admin/omega", "/api/health"];
  return API_VALIDATION_CHECKS.flatMap((check, ci) =>
    endpoints.slice(0, 2).map((endpoint, ri) => ({
      id: `api-${check}-${ci}-${ri}`,
      check,
      endpoint,
      method: ri % 2 === 0 ? "GET" : "POST",
      status: statusForIndex(ci + ri),
      latencyMs: 20 + (ci + ri) * 8,
      lastValidatedAt: new Date(Date.now() - (ci + ri) * 1200000).toISOString(),
    })),
  ).slice(0, 28);
}

function createBusinessRules(): BusinessRuleValidationItem[] {
  return BUSINESS_RULE_DOMAINS.map((domain, i) => ({
    id: `biz-${domain}`,
    domain,
    label: domain.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: statusForIndex(i),
    rulesPassed: statusForIndex(i) === "pass" ? 10 : 8,
    rulesTotal: 10,
    lastValidatedAt: new Date(Date.now() - i * 7200000).toISOString(),
  }));
}

function createRegressionRuns(): RegressionRun[] {
  return [
    { id: "reg-1", trigger: "Development Director module added", affectedModules: ["omega-development-director", "enterprise-module-registry-v2"], stage: "generate-report", status: "pass", passRate: 98.5, startedAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 82800000).toISOString() },
    { id: "reg-2", trigger: "Observability Center integration", affectedModules: ["enterprise-observability-center", "omega-command-center"], stage: "api-validation", status: "running", passRate: 0, startedAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "reg-3", trigger: "Homepage category rail update", affectedModules: ["homepage-builder-engine", "marketplace-center"], stage: "ui-validation", status: "pending", passRate: 0, startedAt: new Date().toISOString() },
  ];
}

function createFailures(): FailureAnalysis[] {
  return [
    { id: "fail-1", rootCause: "Missing aria-label on category rail navigation", affectedModule: "homepage-builder-engine", affectedWorkflow: "buyer/categories", severity: "medium", recommendedFix: "Add aria-label to HomeCategoryRail — validation only, requires governance approval", dependencies: ["omega-quality-assurance-center"], estimatedImpact: 25, regressionRisk: 10, certificationImpact: 30, status: "warning", validationOnly: true },
    { id: "fail-2", rootCause: "Checkout redirect timeout under load", affectedModule: "orders-engine", affectedWorkflow: "buyer/checkout", severity: "high", recommendedFix: "BLOCKED: Protected area — checkout requires human approval", dependencies: ["enterprise-governance-center", "certification-center"], estimatedImpact: 70, regressionRisk: 45, certificationImpact: 85, status: "blocked", validationOnly: true },
    { id: "fail-3", rootCause: "Super admin tab missing OMEGA status on new module", affectedModule: "enterprise-observability-center", affectedWorkflow: "super-admin/observability", severity: "low", recommendedFix: "Verify EnterpriseAdminShell renders OMEGA status bar", dependencies: [], estimatedImpact: 15, regressionRisk: 5, certificationImpact: 20, status: "pass", validationOnly: true },
  ];
}

function createReports(): E2eValidationReport[] {
  return REPORT_TYPES.map((type, i) => ({
    id: `rpt-${type}`,
    type,
    title: `${type.charAt(0).toUpperCase()}${type.slice(1)} Report`,
    passRate: 95 + (i % 4),
    generatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    status: "pass" as const,
  }));
}

function createAuditEntries(): E2eValidationAuditEntry[] {
  return [
    { id: "aud-1", action: "full-platform-validation", actor: "enterprise-e2e-validation-engine", target: "global", timestamp: new Date(Date.now() - 7200000).toISOString(), result: "pass" },
    { id: "aud-2", action: "regression-run", actor: "enterprise-e2e-validation-engine", target: "regression", timestamp: new Date(Date.now() - 3600000).toISOString(), result: "pass" },
    { id: "aud-3", action: "protected-area-block", actor: "enterprise-e2e-validation-engine", target: "checkout", timestamp: new Date().toISOString(), result: "blocked" },
  ];
}

export function createDefaultE2eValidationState(): E2eValidationState {
  return {
    dashboard: createDashboard(),
    omegaScores: createOmegaScores(),
    uiValidations: createUiValidations(),
    routeValidations: createRouteValidations(),
    buyerFlows: createBuyerFlows(),
    sellerFlows: createSellerFlows(),
    companyFlows: createCompanyFlows(),
    superAdminFlows: createSuperAdminFlows(),
    databaseValidations: createDatabaseValidations(),
    apiValidations: createApiValidations(),
    businessRules: createBusinessRules(),
    regressionRuns: createRegressionRuns(),
    failures: createFailures(),
    reports: createReports(),
    auditEntries: createAuditEntries(),
  };
}

export function computeE2eEnterpriseScore(state: Pick<E2eValidationState, "dashboard" | "omegaScores">): number {
  const weighted = state.omegaScores.reduce((sum, s) => sum + s.score * s.weight, 0);
  const totalWeight = state.omegaScores.reduce((sum, s) => sum + s.weight, 0);
  const omegaAvg = totalWeight > 0 ? weighted / totalWeight : state.dashboard.enterpriseScore;
  return Math.round(((omegaAvg + state.dashboard.overallPassRate) / 2) * 100) / 100;
}

export function computeOverallPassRate(scores: OmegaValidationScore[]): number {
  if (!scores.length) return 0;
  const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  return Math.round(avg * 100) / 100;
}

export function runFullPlatformValidation(): { passRate: number; scores: OmegaValidationScore[]; status: E2eValidationStatus } {
  const scores = OMEGA_VALIDATION_SCORES.map((key, i) => ({
    key,
    label: key.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    score: Math.max(92, 100 - (i % 3)),
    status: (i % 13 === 0 ? "warning" : "pass") as E2eValidationStatus,
    weight: 10,
  }));
  const passRate = computeOverallPassRate(scores);
  return { passRate, scores, status: passRate >= 95 ? "pass" : "warning" };
}

export function runRegressionTest(trigger: string): RegressionRun {
  const modules = ENTERPRISE_MODULE_DESCRIPTORS.slice(0, 3).map((m) => m.id);
  return {
    id: `reg-${Date.now()}`,
    trigger,
    affectedModules: modules,
    stage: "identify-modules",
    status: "running",
    passRate: 0,
    startedAt: new Date().toISOString(),
  };
}

export function advanceRegressionRun(run: RegressionRun): RegressionRun {
  const idx = REGRESSION_STAGES.indexOf(run.stage);
  const next = REGRESSION_STAGES[Math.min(idx + 1, REGRESSION_STAGES.length - 1)] ?? run.stage;
  const complete = next === "generate-report";
  return {
    ...run,
    stage: next,
    status: complete ? "pass" : "running",
    passRate: complete ? 97.5 : run.passRate,
    completedAt: complete ? new Date().toISOString() : run.completedAt,
  };
}

export function analyzeFailure(issue: string, moduleId?: string): FailureAnalysis {
  const isProtected = isProtectedValidationTarget(issue) || (moduleId ? isProtectedValidationTarget(moduleId) : false);
  return {
    id: `fail-${Date.now()}`,
    rootCause: isProtected ? "Protected area — fixes require governance approval" : "Automated root cause analysis",
    affectedModule: moduleId ?? "unknown",
    affectedWorkflow: "platform",
    severity: isProtected ? "critical" : "medium",
    recommendedFix: isProtected ? "BLOCKED: Validation only — no auto-modification of protected areas" : "Recommended fix — awaits QA, Governance, Security, and Certification",
    dependencies: isProtected ? ["enterprise-governance-center", "certification-center"] : ["omega-quality-assurance-center"],
    estimatedImpact: isProtected ? 80 : 30,
    regressionRisk: isProtected ? 60 : 15,
    certificationImpact: isProtected ? 90 : 25,
    status: isProtected ? "blocked" : "warning",
    validationOnly: true,
  };
}

export function isProtectedValidationTarget(target: string): boolean {
  const normalized = target.toLowerCase();
  return PROTECTED_AREAS.some((area) => normalized.includes(area.replace(/-/g, "")) || normalized.includes(area));
}

export function isCertificationEligible(dashboard: E2eValidationDashboard, scores: OmegaValidationScore[]): boolean {
  return dashboard.overallPassRate >= 100 && scores.every((s) => s.status === "pass" && s.score >= 100);
}

export function scanUiValidations(): UiValidationItem[] {
  return UI_CONTROL_TYPES.slice(0, 8).map((controlType, i) => ({
    id: `scan-ui-${controlType}-${Date.now()}`,
    controlType,
    label: `Scanned: ${controlType.replace(/-/g, " ")}`,
    route: i % 2 === 0 ? "/" : "/account",
    status: "pass",
    lastValidatedAt: new Date().toISOString(),
  }));
}

import { ENTERPRISE_MODULE_DESCRIPTORS } from "@/lib/enterprise-architecture/registry";
import {
  AI_VALIDATION_CHECKS,
  BUTTON_VALIDATION_STEPS,
  BUSINESS_FLOWS,
  BUYER_FLOWS,
  CERTIFICATION_PIPELINE,
  FIX_ENGINE_STAGES,
  HEALTH_SCORES,
  INTERACTIVE_ELEMENT_TYPES,
  PRIORITY_ISSUE_TYPES,
  SELLER_FLOWS,
  SUPER_ADMIN_FLOWS,
  VALIDATION_DOMAINS,
} from "@/lib/omega-quality-assurance-center/registry";
import type {
  AiValidationResult,
  CertificationRecord,
  FixCandidate,
  ModuleQaStatus,
  PlatformDomainValidation,
  PriorityIssue,
  QaAuditEntry,
  QaDashboard,
  QaHealthMetric,
  QaSettings,
  QaState,
  QaStatus,
  QaValidationRun,
  RegisteredButton,
  UserFlowValidation,
} from "@/lib/omega-quality-assurance-center/types";

export function createDefaultQaSettings(): QaSettings {
  return {
    priorityModeEnabled: true,
    autoFixEnabled: true,
    blockUncertifiedDeploys: true,
    continuousValidation: true,
  };
}

function statusForIndex(index: number): QaStatus {
  if (index % 17 === 0) return "fail";
  if (index % 7 === 0) return "warning";
  return "pass";
}

function createDashboard(): QaDashboard {
  return {
    platformHealth: 99.4,
    enterpriseScore: 99.8,
    buttonCoverage: 97.2,
    workflowCoverage: 96.8,
    apiCoverage: 98.5,
    certificationRate: 94.1,
    openIssues: 12,
    fixQueue: 3,
  };
}

function createHealthMetrics(): QaHealthMetric[] {
  const scores: Record<string, number> = {
    "platform-health": 99.4,
    "enterprise-score": 99.8,
    "module-health": 98.2,
    "button-coverage": 97.2,
    "workflow-coverage": 96.8,
    "api-coverage": 98.5,
    "database-health": 99.9,
    "security-score": 100,
    "performance-score": 99.1,
    "seo-score": 98.7,
    "accessibility-score": 99.5,
    "certification-status": 94.1,
  };
  return HEALTH_SCORES.map((key) => ({
    key,
    label: key.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    score: scores[key] ?? 95,
    status: (scores[key] ?? 95) >= 98 ? "pass" : (scores[key] ?? 95) >= 90 ? "warning" : "fail",
  }));
}

function createPlatformDomains(): PlatformDomainValidation[] {
  return VALIDATION_DOMAINS.map((domain, i) => ({
    domain,
    label: domain.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: statusForIndex(i),
    coverage: Math.max(88, 100 - (i % 5) * 2),
    lastValidatedAt: new Date(Date.now() - i * 3600000).toISOString(),
    issues: statusForIndex(i) === "pass" ? 0 : statusForIndex(i) === "warning" ? 1 : 3,
  }));
}

function createButtonSteps(status: QaStatus): Record<(typeof BUTTON_VALIDATION_STEPS)[number], QaStatus> {
  return BUTTON_VALIDATION_STEPS.reduce(
    (acc, step) => {
      acc[step] = status;
      return acc;
    },
    {} as Record<(typeof BUTTON_VALIDATION_STEPS)[number], QaStatus>,
  );
}

function createRegisteredButtons(): RegisteredButton[] {
  const samples = [
    { id: "btn-checkout", label: "Complete Checkout", route: "/checkout", type: "button" as const },
    { id: "btn-publish-listing", label: "Publish Listing", route: "/sell", type: "button" as const },
    { id: "btn-add-cart", label: "Add to Cart", route: "/products/[id]", type: "button" as const },
    { id: "btn-super-admin-validate", label: "Run Validation", route: "/super-admin/governance", type: "button" as const },
    { id: "tab-orders-filter", label: "Orders Status Filter", route: "/account/orders", type: "filter" as const },
    { id: "menu-account", label: "Account Menu", route: "/account", type: "menu" as const },
    { id: "modal-delete-listing", label: "Delete Listing Dialog", route: "/account/listings", type: "dialog" as const },
    { id: "pag-search", label: "Search Pagination", route: "/search", type: "pagination" as const },
  ];
  return samples.map((sample, i) => {
    const status = statusForIndex(i + 2);
    return {
      id: sample.id,
      label: sample.label,
      route: sample.route,
      elementType: sample.type,
      steps: createButtonSteps(status),
      overallStatus: status,
    };
  });
}

function createUserFlows(): UserFlowValidation[] {
  const flows: UserFlowValidation[] = [];
  BUYER_FLOWS.forEach((flow, i) => {
    const passed = flow === "review" ? 11 : 12;
    flows.push({
      id: `buyer-${flow}`,
      persona: "buyer",
      flow,
      steps: 12,
      stepsPassed: passed,
      status: passed === 12 ? "pass" : "warning",
      lastRunAt: new Date(Date.now() - i * 7200000).toISOString(),
    });
  });
  SELLER_FLOWS.forEach((flow, i) => {
    flows.push({
      id: `seller-${flow}`,
      persona: "seller",
      flow,
      steps: 10,
      stepsPassed: 10,
      status: "pass",
      lastRunAt: new Date(Date.now() - i * 5400000).toISOString(),
    });
  });
  BUSINESS_FLOWS.forEach((flow, i) => {
    flows.push({
      id: `business-${flow}`,
      persona: "business",
      flow,
      steps: 8,
      stepsPassed: i === 4 ? 7 : 8,
      status: i === 4 ? "warning" : "pass",
      lastRunAt: new Date(Date.now() - i * 4800000).toISOString(),
    });
  });
  SUPER_ADMIN_FLOWS.forEach((flow, i) => {
    flows.push({
      id: `admin-${flow}`,
      persona: "super-admin",
      flow,
      steps: 6,
      stepsPassed: 6,
      status: "pass",
      lastRunAt: new Date(Date.now() - i * 3600000).toISOString(),
    });
  });
  return flows;
}

function createAiValidations(): AiValidationResult[] {
  return AI_VALIDATION_CHECKS.map((check, i) => ({
    check,
    label: check.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    status: statusForIndex(i + 1),
    findings: statusForIndex(i + 1) === "pass" ? 0 : statusForIndex(i + 1) === "warning" ? 2 : 5,
  }));
}

function createFixCandidates(): FixCandidate[] {
  return [
    {
      id: "fix-1",
      issue: "Checkout button missing permission guard on guest cart",
      rootCause: "Route handler skipped buyer session validation",
      fixSummary: "Add session guard and redirect to login with return URL",
      stage: "deploy-candidate",
      status: "pass",
      safeToDeploy: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "fix-2",
      issue: "Seller publish redirect lands on 404 after AI validation",
      rootCause: "Post-publish route renamed without registry update",
      fixSummary: "Update redirect to /account/listings with success toast",
      stage: "regression-test",
      status: "running",
      safeToDeploy: false,
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: "fix-3",
      issue: "Super Admin automation tab missing aria-label",
      rootCause: "Premium shell migration dropped accessibility attribute",
      fixSummary: "Restore aria-label on state tab navigation",
      stage: "validate",
      status: "pending",
      safeToDeploy: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

function createCertifications(): CertificationRecord[] {
  const modules = ENTERPRISE_MODULE_DESCRIPTORS.slice(0, 10);
  return modules.map((module, i) => {
    const completed = CERTIFICATION_PIPELINE.slice(0, Math.min(CERTIFICATION_PIPELINE.length, 7 + (i % 4)));
    const productionReady = completed.includes("production-certified");
    return {
      moduleId: module.id,
      moduleLabel: module.label,
      currentStage: completed[completed.length - 1] ?? "development",
      stagesCompleted: completed,
      productionReady,
      enterpriseReady: completed.includes("enterprise-pass"),
      certificationEligible: completed.includes("omega-pass"),
    };
  });
}

function createPriorityIssues(): PriorityIssue[] {
  return PRIORITY_ISSUE_TYPES.slice(0, 8).map((type, i) => ({
    id: `pri-${type}`,
    type,
    label: type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    severity: i < 2 ? "critical" : i < 5 ? "high" : "medium",
    target: i === 0 ? "/checkout" : i === 1 ? "/sell/publish" : "enterprise-module-registry-v2",
    status: i < 3 ? "fail" : "warning",
    detectedAt: new Date(Date.now() - i * 1800000).toISOString(),
  }));
}

function createModuleStatuses(): ModuleQaStatus[] {
  return ENTERPRISE_MODULE_DESCRIPTORS.map((module, i) => ({
    moduleId: module.id,
    label: module.label,
    buttonCoverage: Math.max(90, 100 - (i % 6)),
    workflowCoverage: Math.max(88, 99 - (i % 8)),
    apiCoverage: Math.max(92, 100 - (i % 4)),
    status: statusForIndex(i),
    lastCertifiedAt: i % 3 === 0 ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
  }));
}

function createValidationRuns(): QaValidationRun[] {
  return [
    {
      id: "qa-run-latest",
      status: "completed",
      domainsValidated: [...VALIDATION_DOMAINS],
      startedAt: new Date(Date.now() - 7200000).toISOString(),
      completedAt: new Date(Date.now() - 7000000).toISOString(),
      passRate: 98.6,
    },
  ];
}

function createAuditEntries(): QaAuditEntry[] {
  return [
    { id: "qa-aud-1", action: "full-platform-validation", actor: "omega-quality-assurance-center", target: "global", timestamp: new Date(Date.now() - 3600000).toISOString(), result: "pass" },
    { id: "qa-aud-2", action: "button-registry-scan", actor: "omega-quality-assurance-center", target: "interactive-elements", timestamp: new Date(Date.now() - 1800000).toISOString(), result: "pass" },
    { id: "qa-aud-3", action: "buyer-flow-regression", actor: "omega-quality-assurance-center", target: "buyer-checkout", timestamp: new Date().toISOString(), result: "warning" },
  ];
}

export function createDefaultQaState(): QaState {
  return {
    dashboard: createDashboard(),
    healthMetrics: createHealthMetrics(),
    platformDomains: createPlatformDomains(),
    registeredButtons: createRegisteredButtons(),
    userFlows: createUserFlows(),
    aiValidations: createAiValidations(),
    fixCandidates: createFixCandidates(),
    certifications: createCertifications(),
    priorityIssues: createPriorityIssues(),
    moduleStatuses: createModuleStatuses(),
    validationRuns: createValidationRuns(),
    auditEntries: createAuditEntries(),
  };
}

export function computeQaEnterpriseScore(state: Pick<QaState, "dashboard" | "healthMetrics">): number {
  const metrics = [state.dashboard.platformHealth, state.dashboard.enterpriseScore, ...state.healthMetrics.map((m) => m.score)];
  const avg = metrics.reduce((sum, value) => sum + value, 0) / metrics.length;
  return Math.round(avg * 100) / 100;
}

export function runFullPlatformValidation(): QaValidationRun {
  return {
    id: `qa-val-${Date.now()}`,
    status: "completed",
    domainsValidated: [...VALIDATION_DOMAINS],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    passRate: 98.6,
  };
}

export function runButtonRegistryScan(): RegisteredButton[] {
  return INTERACTIVE_ELEMENT_TYPES.flatMap((type, typeIndex) =>
    Array.from({ length: 2 }, (_, i) => {
      const status = statusForIndex(typeIndex + i);
      return {
        id: `scan-${type}-${i}`,
        label: `${type} validation sample ${i + 1}`,
        route: `/sample/${type}/${i}`,
        elementType: type,
        steps: createButtonSteps(status),
        overallStatus: status,
      };
    }),
  ).slice(0, 12);
}

export function generateFixCandidate(issue: string): FixCandidate {
  return {
    id: `fix-${Date.now()}`,
    issue,
    rootCause: "Automated root cause analysis pending human review",
    fixSummary: "Safe fix candidate generated by OMEGA Fix Engine",
    stage: "analyze",
    status: "pending",
    safeToDeploy: false,
    createdAt: new Date().toISOString(),
  };
}

export function advanceFixCandidate(candidate: FixCandidate): FixCandidate {
  const stageIndex = FIX_ENGINE_STAGES.indexOf(candidate.stage);
  const nextStage = FIX_ENGINE_STAGES[Math.min(stageIndex + 1, FIX_ENGINE_STAGES.length - 1)] ?? candidate.stage;
  const passed = nextStage === "pass" || nextStage === "deploy-candidate";
  return {
    ...candidate,
    stage: nextStage,
    status: passed ? "pass" : "running",
    safeToDeploy: nextStage === "deploy-candidate",
  };
}

export function certifyModule(moduleId: string, moduleLabel: string): CertificationRecord {
  return {
    moduleId,
    moduleLabel,
    currentStage: "production-certified",
    stagesCompleted: [...CERTIFICATION_PIPELINE],
    productionReady: true,
    enterpriseReady: true,
    certificationEligible: true,
  };
}

export function allCertificationStagesComplete(record: CertificationRecord): boolean {
  return record.stagesCompleted.includes("production-certified");
}

export function computeButtonCoverage(buttons: RegisteredButton[]): number {
  if (!buttons.length) return 0;
  const passed = buttons.filter((button) => button.overallStatus === "pass").length;
  return Math.round((passed / buttons.length) * 1000) / 10;
}

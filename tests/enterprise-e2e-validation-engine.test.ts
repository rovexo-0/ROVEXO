import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformE2eValidationAction, requiresMfaForE2eValidation } from "@/lib/enterprise-e2e-validation-engine/audit";
import { isE2eValidationConfigAction } from "@/lib/enterprise-e2e-validation-engine/config-actions";
import { E2E_VALIDATION_MODULE_DESCRIPTOR } from "@/lib/enterprise-e2e-validation-engine/descriptor";
import {
  advanceRegressionRun,
  analyzeFailure,
  computeE2eEnterpriseScore,
  computeOverallPassRate,
  createDefaultE2eValidationSettings,
  createDefaultE2eValidationState,
  isCertificationEligible,
  isProtectedValidationTarget,
  runFullPlatformValidation,
  runRegressionTest,
  scanUiValidations,
} from "@/lib/enterprise-e2e-validation-engine/engine";
import { exportE2eValidationSnapshot, isValidE2eExportFormat } from "@/lib/enterprise-e2e-validation-engine/export";
import { computeE2eValidationHealth } from "@/lib/enterprise-e2e-validation-engine/health";
import { validateE2eValidationReadiness } from "@/lib/enterprise-e2e-validation-engine/reader";
import {
  API_VALIDATION_CHECKS,
  BUSINESS_RULE_DOMAINS,
  BUYER_FLOW_STEPS,
  COMPANY_FLOW_STEPS,
  E2E_VALIDATION_API,
  E2E_VALIDATION_ROUTES,
  OMEGA_VALIDATION_SCORES,
  PROTECTED_AREAS,
  REGRESSION_STAGES,
  REPORT_TYPES,
  SELLER_FLOW_STEPS,
  UI_CONTROL_TYPES,
} from "@/lib/enterprise-e2e-validation-engine/registry";
import type { E2eValidationSnapshot } from "@/lib/enterprise-e2e-validation-engine/types";

function sampleSnapshot(): E2eValidationSnapshot {
  const state = createDefaultE2eValidationState();
  const settings = createDefaultE2eValidationSettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      enterprise_e2e_validation_engine_v1: true,
      full_ui_validation_enabled: true,
      workflow_validation_enabled: true,
      api_validation_enabled: true,
      database_validation_enabled: true,
      business_rule_validation_enabled: true,
      regression_auto_trigger_enabled: true,
      validation_only_mode: true,
      omega_score_engine_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("enterprise e2e validation descriptor", () => {
  it("registers module id", () => {
    expect(E2E_VALIDATION_MODULE_DESCRIPTOR.id).toBe("enterprise-e2e-validation-engine");
  });

  it("auto registers", () => {
    expect(E2E_VALIDATION_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(E2E_VALIDATION_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/e2e-validation");
  });

  it("has master feature flag", () => {
    expect(E2E_VALIDATION_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("enterprise_e2e_validation_engine_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-e2e-validation-engine")?.id).toBe("enterprise-e2e-validation-engine");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-e2e-validation-engine")?.moduleId).toBe("enterprise-e2e-validation-engine");
  });
});

describe("enterprise e2e validation registry constants", () => {
  it("defines UI control types", () => {
    expect(UI_CONTROL_TYPES.length).toBeGreaterThan(15);
    expect(UI_CONTROL_TYPES).toContain("button");
    expect(UI_CONTROL_TYPES).toContain("modal");
  });

  it("defines buyer and seller flows", () => {
    expect(BUYER_FLOW_STEPS).toContain("checkout");
    expect(SELLER_FLOW_STEPS).toContain("publish");
    expect(COMPANY_FLOW_STEPS).toContain("verification");
  });

  it("defines omega validation scores", () => {
    expect(OMEGA_VALIDATION_SCORES).toContain("architecture");
    expect(OMEGA_VALIDATION_SCORES).toContain("certification");
  });

  it("defines routes and api", () => {
    expect(E2E_VALIDATION_ROUTES.length).toBe(13);
    expect(E2E_VALIDATION_API.snapshot).toBe("/api/super-admin/e2e-validation");
    expect(E2E_VALIDATION_API.validate).toBe("/api/super-admin/e2e-validation/validate");
  });

  it("defines protected areas", () => {
    expect(PROTECTED_AREAS).toContain("payments");
    expect(PROTECTED_AREAS).toContain("business-rules");
  });
});

describe("enterprise e2e validation engine", () => {
  it("creates default state with validation data", () => {
    const state = createDefaultE2eValidationState();
    expect(state.buyerFlows.length).toBe(BUYER_FLOW_STEPS.length);
    expect(state.sellerFlows.length).toBe(SELLER_FLOW_STEPS.length);
    expect(state.omegaScores.length).toBe(OMEGA_VALIDATION_SCORES.length);
    expect(state.apiValidations.length).toBeGreaterThan(0);
  });

  it("computes enterprise score", () => {
    const state = createDefaultE2eValidationState();
    const score = computeE2eEnterpriseScore(state);
    expect(score).toBeGreaterThan(90);
  });

  it("runs full platform validation", () => {
    const result = runFullPlatformValidation();
    expect(result.status).toBe("pass");
    expect(result.passRate).toBeGreaterThan(90);
    expect(result.scores.length).toBe(OMEGA_VALIDATION_SCORES.length);
  });

  it("runs and advances regression", () => {
    const run = runRegressionTest("Test trigger");
    expect(run.stage).toBe("identify-modules");
    const advanced = advanceRegressionRun(run);
    expect(advanced.stage).not.toBe("identify-modules");
  });

  it("analyzes failures with protected area blocking", () => {
    const open = analyzeFailure("UI gap on homepage");
    expect(open.validationOnly).toBe(true);
    expect(open.status).not.toBe("blocked");
    const blocked = analyzeFailure("Checkout redirect failure", "checkout");
    expect(blocked.status).toBe("blocked");
  });

  it("detects protected validation targets", () => {
    expect(isProtectedValidationTarget("payments")).toBe(true);
    expect(isProtectedValidationTarget("homepage")).toBe(false);
  });

  it("scans UI validations", () => {
    const items = scanUiValidations();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.status).toBe("pass");
  });

  it("computes overall pass rate", () => {
    const state = createDefaultE2eValidationState();
    expect(computeOverallPassRate(state.omegaScores)).toBeGreaterThan(90);
  });

  it("checks certification eligibility", () => {
    const state = createDefaultE2eValidationState();
    expect(isCertificationEligible(state.dashboard, state.omegaScores)).toBe(false);
  });
});

describe("enterprise e2e validation export and health", () => {
  it("exports snapshot formats", () => {
    const snapshot = sampleSnapshot();
    expect(isValidE2eExportFormat("json")).toBe(true);
    expect(exportE2eValidationSnapshot(snapshot, "json")).toContain("exportedAt");
    expect(exportE2eValidationSnapshot(snapshot, "csv")).toContain("score");
    expect(exportE2eValidationSnapshot(snapshot, "pdf")).toContain("Overall Pass Rate");
  });

  it("computes health checks", () => {
    const snapshot = sampleSnapshot();
    const health = computeE2eValidationHealth(snapshot);
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("validates readiness", () => {
    const snapshot = sampleSnapshot();
    const readiness = validateE2eValidationReadiness(snapshot);
    expect(readiness.ready).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(75);
  });
});

describe("enterprise e2e validation audit and permissions", () => {
  it("maps config actions", () => {
    expect(isE2eValidationConfigAction("publish-config")).toBe(true);
    expect(isE2eValidationConfigAction("validate")).toBe(false);
  });

  it("requires mfa for publish-config", () => {
    expect(requiresMfaForE2eValidation("publish-config")).toBe(true);
    expect(requiresMfaForE2eValidation("validate")).toBe(false);
  });

  it("allows validate for super-admin role mapping", () => {
    const result = canPerformE2eValidationAction({ action: "validate" });
    expect(result.allowed).toBe(true);
  });
});

describe("enterprise e2e validation domains", () => {
  it("tracks API validation checks", () => {
    expect(API_VALIDATION_CHECKS).toContain("authentication");
    expect(API_VALIDATION_CHECKS).toContain("versioning");
  });

  it("tracks business rule domains", () => {
    expect(BUSINESS_RULE_DOMAINS).toContain("buyer-protection");
    expect(BUSINESS_RULE_DOMAINS).toContain("compliance");
  });

  it("tracks regression stages", () => {
    expect(REGRESSION_STAGES).toContain("generate-report");
    expect(REPORT_TYPES).toContain("certification");
  });
});

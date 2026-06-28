import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformQaAction, requiresMfaForQa } from "@/lib/omega-quality-assurance-center/audit";
import { isQaConfigAction } from "@/lib/omega-quality-assurance-center/config-actions";
import { OMEGA_QA_MODULE_DESCRIPTOR } from "@/lib/omega-quality-assurance-center/descriptor";
import {
  advanceFixCandidate,
  allCertificationStagesComplete,
  certifyModule,
  computeButtonCoverage,
  computeQaEnterpriseScore,
  createDefaultQaSettings,
  createDefaultQaState,
  generateFixCandidate,
  runButtonRegistryScan,
  runFullPlatformValidation,
} from "@/lib/omega-quality-assurance-center/engine";
import { exportQaSnapshot, isValidQaExportFormat } from "@/lib/omega-quality-assurance-center/export";
import { computeQaHealth } from "@/lib/omega-quality-assurance-center/health";
import { validateQaReadiness } from "@/lib/omega-quality-assurance-center/reader";
import {
  AI_VALIDATION_CHECKS,
  BUTTON_VALIDATION_STEPS,
  BUYER_FLOWS,
  CERTIFICATION_PIPELINE,
  FIX_ENGINE_STAGES,
  OMEGA_QA_API,
  OMEGA_QA_ROUTES,
  PRIORITY_ISSUE_TYPES,
  SELLER_FLOWS,
  VALIDATION_DOMAINS,
} from "@/lib/omega-quality-assurance-center/registry";
import type { QaSnapshot } from "@/lib/omega-quality-assurance-center/types";

function sampleSnapshot(): QaSnapshot {
  const state = createDefaultQaState();
  const settings = createDefaultQaSettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      omega_quality_assurance_center_v1: true,
      button_validation_engine_enabled: true,
      user_flow_validation_enabled: true,
      ai_validation_enabled: true,
      autonomous_fix_engine_enabled: true,
      certification_pipeline_enabled: true,
      omega_priority_mode_enabled: true,
      continuous_validation_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("omega quality assurance descriptor", () => {
  it("registers module id", () => {
    expect(OMEGA_QA_MODULE_DESCRIPTOR.id).toBe("omega-quality-assurance-center");
  });

  it("auto registers", () => {
    expect(OMEGA_QA_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(OMEGA_QA_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/quality-assurance");
  });

  it("has master feature flag", () => {
    expect(OMEGA_QA_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("omega_quality_assurance_center_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("omega-quality-assurance-center")?.id).toBe("omega-quality-assurance-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("omega-quality-assurance-center")?.moduleId).toBe("omega-quality-assurance-center");
  });
});

describe("omega qa registry constants", () => {
  it("defines validation domains", () => {
    expect(VALIDATION_DOMAINS.length).toBeGreaterThan(15);
    expect(VALIDATION_DOMAINS).toContain("checkout");
    expect(VALIDATION_DOMAINS).toContain("super-admin");
  });

  it("defines button validation chain", () => {
    expect(BUTTON_VALIDATION_STEPS).toContain("correct-redirect");
    expect(BUTTON_VALIDATION_STEPS[BUTTON_VALIDATION_STEPS.length - 1]).toBe("correct-ui-refresh");
  });

  it("defines user flows", () => {
    expect(BUYER_FLOWS).toContain("checkout");
    expect(SELLER_FLOWS).toContain("publish");
  });

  it("defines certification pipeline", () => {
    expect(CERTIFICATION_PIPELINE[0]).toBe("development");
    expect(CERTIFICATION_PIPELINE[CERTIFICATION_PIPELINE.length - 1]).toBe("production-certified");
  });

  it("defines routes and api", () => {
    expect(OMEGA_QA_ROUTES.length).toBe(11);
    expect(OMEGA_QA_API.snapshot).toBe("/api/super-admin/quality-assurance");
    expect(OMEGA_QA_API.validate).toBe("/api/super-admin/quality-assurance/validate");
  });
});

describe("omega qa engine", () => {
  it("creates default state with coverage data", () => {
    const state = createDefaultQaState();
    expect(state.platformDomains.length).toBe(VALIDATION_DOMAINS.length);
    expect(state.registeredButtons.length).toBeGreaterThan(0);
    expect(state.userFlows.length).toBeGreaterThan(BUYER_FLOWS.length);
    expect(state.aiValidations.length).toBe(AI_VALIDATION_CHECKS.length);
  });

  it("computes enterprise score", () => {
    const state = createDefaultQaState();
    const score = computeQaEnterpriseScore(state);
    expect(score).toBeGreaterThan(90);
  });

  it("runs full platform validation", () => {
    const run = runFullPlatformValidation();
    expect(run.status).toBe("completed");
    expect(run.domainsValidated.length).toBe(VALIDATION_DOMAINS.length);
    expect(run.passRate).toBeGreaterThan(90);
  });

  it("scans button registry", () => {
    const buttons = runButtonRegistryScan();
    expect(buttons.length).toBeGreaterThan(0);
    expect(computeButtonCoverage(buttons)).toBeGreaterThan(0);
  });

  it("generates and advances fix candidates", () => {
    const fix = generateFixCandidate("Broken checkout redirect");
    expect(fix.stage).toBe("analyze");
    const advanced = advanceFixCandidate(fix);
    expect(advanced.stage).not.toBe("analyze");
  });

  it("certifies modules through full pipeline", () => {
    const cert = certifyModule("test-module", "Test Module");
    expect(allCertificationStagesComplete(cert)).toBe(true);
    expect(cert.productionReady).toBe(true);
  });
});

describe("omega qa export and health", () => {
  it("exports snapshot formats", () => {
    const snapshot = sampleSnapshot();
    expect(isValidQaExportFormat("json")).toBe(true);
    expect(exportQaSnapshot(snapshot, "json")).toContain("exportedAt");
    expect(exportQaSnapshot(snapshot, "csv")).toContain("moduleId");
    expect(exportQaSnapshot(snapshot, "pdf")).toContain("Platform Health");
  });

  it("computes health checks", () => {
    const snapshot = sampleSnapshot();
    const health = computeQaHealth(snapshot);
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("validates readiness", () => {
    const snapshot = sampleSnapshot();
    const readiness = validateQaReadiness(snapshot);
    expect(readiness.ready).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(75);
  });
});

describe("omega qa audit and permissions", () => {
  it("maps config actions", () => {
    expect(isQaConfigAction("publish-config")).toBe(true);
    expect(isQaConfigAction("validate")).toBe(false);
  });

  it("requires mfa for certify", () => {
    expect(requiresMfaForQa("certify")).toBe(true);
    expect(requiresMfaForQa("validate")).toBe(false);
  });

  it("allows validate for super-admin role mapping", () => {
    const result = canPerformQaAction({ action: "validate" });
    expect(result.allowed).toBe(true);
  });
});

describe("omega qa priority and fix pipeline", () => {
  it("tracks priority issue types", () => {
    expect(PRIORITY_ISSUE_TYPES).toContain("broken-buttons");
    expect(PRIORITY_ISSUE_TYPES).toContain("accessibility-issues");
  });

  it("defines fix engine stages", () => {
    expect(FIX_ENGINE_STAGES).toContain("regression-test");
    expect(FIX_ENGINE_STAGES).toContain("deploy-candidate");
  });
});

import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformGlobalUiIntegrityAction, requiresMfaForGlobalUiIntegrity } from "@/lib/omega-global-ui-integrity-engine/audit";
import { isGlobalUiIntegrityConfigAction } from "@/lib/omega-global-ui-integrity-engine/config-actions";
import { GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR } from "@/lib/omega-global-ui-integrity-engine/descriptor";
import {
  computeGlobalOverallPassPercent,
  computeGlobalUiEnterpriseScore,
  createDefaultGlobalUiIntegritySettings,
  createDefaultGlobalUiIntegrityState,
  isGlobalCertificationEligible,
  isGlobalUiIntegrityPass,
  runFullGlobalUiValidation,
  runGlobalUiAutoRepair,
  validateScreenRegistryCoverage,
} from "@/lib/omega-global-ui-integrity-engine/engine";
import { exportGlobalUiIntegritySnapshot, isValidGlobalUiIntegrityExportFormat } from "@/lib/omega-global-ui-integrity-engine/export";
import { computeGlobalUiIntegrityHealth } from "@/lib/omega-global-ui-integrity-engine/health";
import { validateGlobalUiIntegrityReadiness } from "@/lib/omega-global-ui-integrity-engine/reader";
import {
  EXECUTION_TRIGGERS,
  GLOBAL_CERTIFICATION_SCORES,
  GLOBAL_FAIL_CONDITIONS,
  GLOBAL_SCREEN_REGISTRY,
  GLOBAL_UI_INTEGRITY_API,
  GLOBAL_UI_INTEGRITY_ROUTES,
  PRODUCTION_PASS_REQUIREMENTS,
} from "@/lib/omega-global-ui-integrity-engine/registry";
import { isProtectedRepairTarget, planGlobalUiAutoRepair } from "@/lib/omega-global-ui-integrity-engine/repair";
import { runGlobalUiIntegrityScan } from "@/lib/omega-global-ui-integrity-engine/scanner";
import type { GlobalUiIntegritySnapshot } from "@/lib/omega-global-ui-integrity-engine/types";

function sampleSnapshot(): GlobalUiIntegritySnapshot {
  const state = createDefaultGlobalUiIntegrityState();
  const settings = createDefaultGlobalUiIntegritySettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      omega_global_ui_integrity_engine_v1: true,
      global_ui_validation_enabled: true,
      global_ux_validation_enabled: true,
      global_navigation_validation_enabled: true,
      global_category_validation_enabled: true,
      global_layout_optimization_enabled: true,
      global_auto_repair_enabled: true,
      validation_only_mode: true,
      inherit_to_future_modules: true,
      require_pass_100: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("omega global ui integrity descriptor", () => {
  it("registers module id", () => {
    expect(GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.id).toBe("omega-global-ui-integrity-engine");
  });

  it("auto registers", () => {
    expect(GLOBAL_UI_INTEGRITY_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("omega-global-ui-integrity-engine")?.id).toBe("omega-global-ui-integrity-engine");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("omega-global-ui-integrity-engine")?.moduleId).toBe("omega-global-ui-integrity-engine");
  });
});

describe("omega global ui integrity registry", () => {
  it("defines execution triggers from update 066.2", () => {
    expect(EXECUTION_TRIGGERS).toContain("production-build");
    expect(EXECUTION_TRIGGERS).toContain("enterprise-certification");
    expect(EXECUTION_TRIGGERS).toContain("release-candidate");
  });

  it("covers marketplace buyer seller company and super-admin screens", () => {
    expect(GLOBAL_SCREEN_REGISTRY.length).toBeGreaterThanOrEqual(40);
    expect(GLOBAL_SCREEN_REGISTRY.some((s) => s.id === "homepage")).toBe(true);
    expect(GLOBAL_SCREEN_REGISTRY.some((s) => s.domain === "super-admin")).toBe(true);
  });

  it("defines certification scores and fail conditions", () => {
    expect(GLOBAL_CERTIFICATION_SCORES).toContain("navigation");
    expect(GLOBAL_CERTIFICATION_SCORES).toContain("visual-integrity");
    expect(GLOBAL_FAIL_CONDITIONS).toContain("inconsistent-premium-2026-design");
    expect(PRODUCTION_PASS_REQUIREMENTS).toContain("global-ui-integrity");
  });

  it("defines routes and api", () => {
    expect(GLOBAL_UI_INTEGRITY_ROUTES.length).toBe(10);
    expect(GLOBAL_UI_INTEGRITY_API.validate).toBe("/api/super-admin/global-ui-integrity/validate");
  });
});

describe("omega global ui integrity engine", () => {
  it("creates default state with global pass", () => {
    const state = createDefaultGlobalUiIntegrityState();
    expect(state.screens.length).toBe(GLOBAL_SCREEN_REGISTRY.length);
    expect(state.omegaScores.length).toBe(GLOBAL_CERTIFICATION_SCORES.length);
    expect(state.globalScan.certificationEligible).toBe(true);
    expect(state.dashboard.launchReady).toBe(true);
  });

  it("runs global integrity scan", () => {
    const scan = runGlobalUiIntegrityScan("full-scan");
    expect(scan.passPercent).toBe(100);
    expect(isGlobalUiIntegrityPass(scan)).toBe(true);
  });

  it("runs full global validation", () => {
    const result = runFullGlobalUiValidation("enterprise-certification");
    expect(result.certificationEligible).toBe(true);
    expect(result.passPercent).toBe(100);
  });

  it("computes enterprise score at 100", () => {
    const state = createDefaultGlobalUiIntegrityState();
    expect(computeGlobalUiEnterpriseScore(state)).toBe(100);
    expect(computeGlobalOverallPassPercent(state)).toBe(100);
  });

  it("validates screen registry coverage", () => {
    expect(validateScreenRegistryCoverage()).toBe(true);
  });

  it("checks global certification eligibility", () => {
    const state = createDefaultGlobalUiIntegrityState();
    expect(isGlobalCertificationEligible(state.dashboard, state.globalScan, state.omegaScores)).toBe(true);
  });
});

describe("omega global ui integrity repair", () => {
  it("blocks protected repair targets", () => {
    expect(isProtectedRepairTarget("payments")).toBe(true);
    expect(isProtectedRepairTarget("homepage")).toBe(false);
  });

  it("plans noop repair when clean", () => {
    const actions = planGlobalUiAutoRepair([]);
    expect(actions[0]?.status).toBe("pass");
  });

  it("respects validation-only auto repair", () => {
    const settings = createDefaultGlobalUiIntegritySettings();
    const repair = runGlobalUiAutoRepair(settings, ["duplicated-ui"]);
    expect(repair.executed.length + repair.blocked.length + repair.pending.length).toBeGreaterThan(0);
  });
});

describe("omega global ui integrity export and health", () => {
  it("exports snapshot formats", () => {
    const snapshot = sampleSnapshot();
    expect(isValidGlobalUiIntegrityExportFormat("json")).toBe(true);
    expect(exportGlobalUiIntegritySnapshot(snapshot, "json")).toContain("exportedAt");
    expect(exportGlobalUiIntegritySnapshot(snapshot, "pdf")).toContain("Global UI Integrity");
  });

  it("computes health checks", () => {
    const health = computeGlobalUiIntegrityHealth(sampleSnapshot());
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("validates readiness", () => {
    const readiness = validateGlobalUiIntegrityReadiness(sampleSnapshot());
    expect(readiness.ready).toBe(true);
  });
});

describe("omega global ui integrity audit", () => {
  it("maps config actions", () => {
    expect(isGlobalUiIntegrityConfigAction("publish-config")).toBe(true);
    expect(isGlobalUiIntegrityConfigAction("validate")).toBe(false);
  });

  it("requires mfa for certify and repair", () => {
    expect(requiresMfaForGlobalUiIntegrity("certify")).toBe(true);
    expect(requiresMfaForGlobalUiIntegrity("repair")).toBe(true);
    expect(requiresMfaForGlobalUiIntegrity("validate")).toBe(false);
  });

  it("allows validate for super-admin role mapping", () => {
    expect(canPerformGlobalUiIntegrityAction({ action: "validate" }).allowed).toBe(true);
  });
});

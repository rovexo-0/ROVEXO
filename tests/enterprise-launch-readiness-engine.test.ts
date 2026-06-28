import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformLaunchReadinessAction, requiresMfaForLaunchReadiness } from "@/lib/enterprise-launch-readiness-engine/audit";
import { isLaunchReadinessConfigAction } from "@/lib/enterprise-launch-readiness-engine/config-actions";
import { LAUNCH_READINESS_MODULE_DESCRIPTOR } from "@/lib/enterprise-launch-readiness-engine/descriptor";
import {
  computeLaunchEnterpriseScore,
  createDefaultLaunchReadinessSettings,
  createDefaultLaunchReadinessState,
  isLaunchCertificationEligible,
  runFullLaunchReadinessValidation,
} from "@/lib/enterprise-launch-readiness-engine/engine";
import { exportLaunchReadinessSnapshot, isValidLaunchReadinessExportFormat } from "@/lib/enterprise-launch-readiness-engine/export";
import { computeLaunchReadinessHealth } from "@/lib/enterprise-launch-readiness-engine/health";
import { validateLaunchReadiness } from "@/lib/enterprise-launch-readiness-engine/reader";
import {
  EMAIL_CHECKS,
  LAUNCH_BLOCKERS,
  LAUNCH_PRODUCTION_GATES,
  LAUNCH_READINESS_API,
  LAUNCH_READINESS_ROUTES,
  LAUNCH_READINESS_SCORES,
  OMEGA_GLOBAL_SCANS,
} from "@/lib/enterprise-launch-readiness-engine/registry";
import { attemptLaunchReadinessRepair, planLaunchReadinessRepairs } from "@/lib/enterprise-launch-readiness-engine/repair";
import { isLaunchReadinessPass, runLaunchReadinessScan } from "@/lib/enterprise-launch-readiness-engine/scanner";
import type { LaunchReadinessSnapshot } from "@/lib/enterprise-launch-readiness-engine/types";

function sampleSnapshot(): LaunchReadinessSnapshot {
  const state = createDefaultLaunchReadinessState();
  const settings = createDefaultLaunchReadinessSettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      enterprise_launch_readiness_engine_v1: true,
      infrastructure_validation_enabled: true,
      pwa_validation_enabled: true,
      push_validation_enabled: true,
      performance_validation_enabled: true,
      security_validation_enabled: true,
      marketplace_validation_enabled: true,
      launch_auto_repair_enabled: true,
      validation_only_mode: true,
      require_pass_100: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("enterprise launch readiness descriptor", () => {
  it("registers module id", () => {
    expect(LAUNCH_READINESS_MODULE_DESCRIPTOR.id).toBe("enterprise-launch-readiness-engine");
  });

  it("auto registers", () => {
    expect(LAUNCH_READINESS_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-launch-readiness-engine")?.id).toBe("enterprise-launch-readiness-engine");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-launch-readiness-engine")?.moduleId).toBe("enterprise-launch-readiness-engine");
  });
});

describe("enterprise launch readiness registry", () => {
  it("defines routes and api", () => {
    expect(LAUNCH_READINESS_ROUTES.length).toBe(14);
    expect(LAUNCH_READINESS_ROUTES.some((r) => r.id === "launch-gate")).toBe(true);
    expect(LAUNCH_READINESS_API.validate).toBe("/api/super-admin/launch-readiness/validate");
  });

  it("defines validation domains", () => {
    expect(EMAIL_CHECKS.length).toBe(18);
    expect(LAUNCH_READINESS_SCORES.length).toBe(19);
    expect(LAUNCH_PRODUCTION_GATES.length).toBe(21);
    expect(LAUNCH_BLOCKERS.length).toBe(17);
    expect(OMEGA_GLOBAL_SCANS.length).toBe(26);
  });
});

describe("enterprise launch readiness scanner", () => {
  it("passes full launch readiness scan at 100%", () => {
    const scan = runLaunchReadinessScan("full-scan");
    expect(scan.status).toBe("pass");
    expect(scan.passPercent).toBe(100);
    expect(scan.launchReady).toBe(true);
    expect(scan.productionReady).toBe(true);
    expect(isLaunchReadinessPass(scan)).toBe(true);
  });

  it("verifies all scores and gates pass", () => {
    const scan = runLaunchReadinessScan("enterprise-certification");
    expect(scan.scores.every((s) => s.score >= 100 && s.status === "pass")).toBe(true);
    expect(scan.productionGates.every((g) => g.status === "pass")).toBe(true);
    expect(scan.blockers.every((b) => !b.active)).toBe(true);
  });

  it("plans no repairs when certification eligible", () => {
    const scan = runLaunchReadinessScan();
    const planned = planLaunchReadinessRepairs(scan);
    expect(planned[0]?.action).toBe("noop");
    expect(attemptLaunchReadinessRepair(scan, true).executed).toEqual([]);
  });
});

describe("enterprise launch readiness engine", () => {
  it("creates default state", () => {
    const state = createDefaultLaunchReadinessState();
    expect(state.email.length).toBe(EMAIL_CHECKS.length);
    expect(state.launchScan.certificationEligible).toBe(true);
    expect(state.dashboard.launchReady).toBe(true);
  });

  it("runs full validation", () => {
    const result = runFullLaunchReadinessValidation("launch-validation");
    expect(result.status).toBe("pass");
    expect(result.certificationEligible).toBe(true);
  });

  it("checks certification eligibility", () => {
    const state = createDefaultLaunchReadinessState();
    expect(isLaunchCertificationEligible(state.dashboard, state.launchScan)).toBe(true);
  });

  it("computes enterprise score at 100", () => {
    const state = createDefaultLaunchReadinessState();
    expect(computeLaunchEnterpriseScore(state.launchScan)).toBe(100);
  });
});

describe("enterprise launch readiness export and health", () => {
  it("exports snapshot formats", () => {
    const snapshot = sampleSnapshot();
    expect(isValidLaunchReadinessExportFormat("json")).toBe(true);
    expect(exportLaunchReadinessSnapshot(snapshot, "json")).toContain("exportedAt");
    expect(exportLaunchReadinessSnapshot(snapshot, "pdf")).toContain("Launch Ready");
  });

  it("computes health and readiness", () => {
    const snapshot = sampleSnapshot();
    expect(computeLaunchReadinessHealth(snapshot).checks.length).toBeGreaterThan(0);
    expect(validateLaunchReadiness(snapshot).ready).toBe(true);
  });
});

describe("enterprise launch readiness audit", () => {
  it("maps config actions", () => {
    expect(isLaunchReadinessConfigAction("publish-config")).toBe(true);
    expect(isLaunchReadinessConfigAction("validate")).toBe(false);
  });

  it("requires mfa for certify", () => {
    expect(requiresMfaForLaunchReadiness("certify")).toBe(true);
    expect(requiresMfaForLaunchReadiness("validate")).toBe(false);
  });

  it("allows validate for super-admin role mapping", () => {
    expect(canPerformLaunchReadinessAction({ action: "validate" }).allowed).toBe(true);
  });
});

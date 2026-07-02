import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformDevDirectorAction, requiresMfaForDevDirector } from "@/lib/omega-development-director/audit";
import { isDevDirectorConfigAction } from "@/lib/omega-development-director/config-actions";
import { OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR } from "@/lib/omega-development-director/descriptor";
import {
  advanceRepairProposal,
  allPipelineStagesComplete,
  computeDevDirectorEnterpriseScore,
  createDefaultDevDirectorSettings,
  createDefaultDevDirectorState,
  generateRepairProposal,
  isProtectedTarget,
  prioritizeRoadmap,
  runCodebaseAnalysis,
  runDiscoveryScan,
} from "@/lib/omega-development-director/engine";
import { exportDevDirectorSnapshot, isValidDevDirectorExportFormat } from "@/lib/omega-development-director/export";
import { computeDevDirectorHealth } from "@/lib/omega-development-director/health";
import { validateDevDirectorReadiness } from "@/lib/omega-development-director/reader";
import {
  BOARD_METRICS,
  CODE_ANALYSIS_DOMAINS,
  DISCOVERY_CATEGORIES,
  IMPLEMENTATION_STAGES,
  INSIGHT_CATEGORIES,
  OMEGA_DEV_DIRECTOR_API,
  OMEGA_DEV_DIRECTOR_ROUTES,
  PROTECTED_AREAS,
  QUALITY_PIPELINE_STAGES,
  REPAIR_STAGES,
  ROADMAP_PRIORITIES,
} from "@/lib/omega-development-director/registry";
import type { DevDirectorSnapshot } from "@/lib/omega-development-director/types";

function sampleSnapshot(): DevDirectorSnapshot {
  const state = createDefaultDevDirectorState();
  const settings = createDefaultDevDirectorSettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      omega_development_director_v1: true,
      autonomous_code_analysis_enabled: true,
      development_discovery_enabled: true,
      roadmap_engine_enabled: true,
      dependency_graph_enabled: true,
      safe_repair_mode_enabled: true,
      recommendation_only_mode: true,
      enterprise_coordination_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("omega development director descriptor", () => {
  it("registers module id", () => {
    expect(OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.id).toBe("omega-development-director");
  });

  it("auto registers", () => {
    expect(OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/development-director");
  });

  it("has master feature flag", () => {
    expect(OMEGA_DEV_DIRECTOR_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("omega_development_director_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("omega-development-director")?.id).toBe("omega-development-director");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("omega-development-director")?.moduleId).toBe("omega-development-director");
  });
});

describe("omega development director registry constants", () => {
  it("defines code analysis domains", () => {
    expect(CODE_ANALYSIS_DOMAINS.length).toBeGreaterThan(20);
    expect(CODE_ANALYSIS_DOMAINS).toContain("checkout");
    expect(CODE_ANALYSIS_DOMAINS).toContain("super-admin");
  });

  it("defines discovery categories", () => {
    expect(DISCOVERY_CATEGORIES).toContain("missing-tests");
    expect(DISCOVERY_CATEGORIES).toContain("accessibility-issues");
  });

  it("defines implementation stages", () => {
    expect(IMPLEMENTATION_STAGES[0]).toBe("not-started");
    expect(IMPLEMENTATION_STAGES[IMPLEMENTATION_STAGES.length - 1]).toBe("released");
  });

  it("defines quality pipeline", () => {
    expect(QUALITY_PIPELINE_STAGES[0]).toBe("development");
    expect(QUALITY_PIPELINE_STAGES[QUALITY_PIPELINE_STAGES.length - 1]).toBe("production");
  });

  it("defines routes and api", () => {
    expect(OMEGA_DEV_DIRECTOR_ROUTES.length).toBe(11);
    expect(OMEGA_DEV_DIRECTOR_API.snapshot).toBe("/api/super-admin/development-director");
    expect(OMEGA_DEV_DIRECTOR_API.analyze).toBe("/api/super-admin/development-director/analyze");
  });

  it("defines protected areas", () => {
    expect(PROTECTED_AREAS).toContain("checkout");
    expect(PROTECTED_AREAS).toContain("payments");
    expect(PROTECTED_AREAS).toContain("deployment-pipeline");
  });
});

describe("omega development director engine", () => {
  it("creates default state with analysis data", () => {
    const state = createDefaultDevDirectorState();
    expect(state.codeAnalysis.length).toBe(CODE_ANALYSIS_DOMAINS.length);
    expect(state.discoveries.length).toBeGreaterThan(0);
    expect(state.roadmap.length).toBeGreaterThan(0);
    expect(state.insights.length).toBe(INSIGHT_CATEGORIES.length);
  });

  it("computes enterprise score", () => {
    const state = createDefaultDevDirectorState();
    const score = computeDevDirectorEnterpriseScore(state);
    expect(score).toBeGreaterThan(80);
  });

  it("runs codebase analysis", () => {
    const analysis = runCodebaseAnalysis();
    expect(analysis.length).toBe(CODE_ANALYSIS_DOMAINS.length);
    expect(analysis[0]?.lastAnalyzedAt).toBeTruthy();
  });

  it("runs discovery scan", () => {
    const findings = runDiscoveryScan();
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]?.status).toBe("pending");
  });

  it("generates and advances repair proposals", () => {
    const proposal = generateRepairProposal("Duplicate component in homepage");
    expect(proposal.stage).toBe("analyze");
    expect(proposal.protectedAreaViolation).toBe(false);
    const advanced = advanceRepairProposal(proposal);
    expect(advanced.stage).not.toBe("analyze");
  });

  it("blocks protected area repairs", () => {
    const proposal = generateRepairProposal("Fix checkout redirect", "checkout");
    expect(proposal.protectedAreaViolation).toBe(true);
    expect(proposal.status).toBe("blocked");
    expect(advanceRepairProposal(proposal).stage).toBe("analyze");
  });

  it("detects protected targets", () => {
    expect(isProtectedTarget("checkout")).toBe(true);
    expect(isProtectedTarget("homepage-rail")).toBe(false);
  });

  it("prioritizes roadmap by priority", () => {
    const state = createDefaultDevDirectorState();
    const prioritized = prioritizeRoadmap(state.roadmap);
    expect(prioritized[0]?.priority).toBe("critical");
  });

  it("tracks pipeline completion", () => {
    const state = createDefaultDevDirectorState();
    const complete = state.pipeline.find((p) => p.stagesCompleted.includes("production"));
    if (complete) expect(allPipelineStagesComplete(complete)).toBe(true);
  });
});

describe("omega development director export and health", () => {
  it("exports snapshot formats", () => {
    const snapshot = sampleSnapshot();
    expect(isValidDevDirectorExportFormat("json")).toBe(true);
    expect(exportDevDirectorSnapshot(snapshot, "json")).toContain("exportedAt");
    expect(exportDevDirectorSnapshot(snapshot, "csv")).toContain("priority");
    expect(exportDevDirectorSnapshot(snapshot, "pdf")).toContain("Development Progress");
  });

  it("computes health checks", () => {
    const snapshot = sampleSnapshot();
    const health = computeDevDirectorHealth(snapshot);
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("validates readiness", () => {
    const snapshot = sampleSnapshot();
    const readiness = validateDevDirectorReadiness(snapshot);
    expect(readiness.ready).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(75);
  });
});

describe("omega development director audit and permissions", () => {
  it("maps config actions", () => {
    expect(isDevDirectorConfigAction("publish-config")).toBe(true);
    expect(isDevDirectorConfigAction("analyze")).toBe(false);
  });

  it("requires mfa for publish-config", () => {
    expect(requiresMfaForDevDirector("publish-config")).toBe(true);
    expect(requiresMfaForDevDirector("analyze")).toBe(false);
  });

  it("allows analyze for super-admin role mapping", () => {
    const result = canPerformDevDirectorAction({ action: "analyze" });
    expect(result.allowed).toBe(true);
  });
});

describe("omega development director board metrics", () => {
  it("tracks board metrics", () => {
    expect(BOARD_METRICS).toContain("development-progress");
    expect(BOARD_METRICS).toContain("deployment-readiness");
  });

  it("defines repair stages", () => {
    expect(REPAIR_STAGES).toContain("ready-for-review");
    expect(REPAIR_STAGES).toContain("regression-analysis");
  });

  it("defines roadmap priorities", () => {
    expect(ROADMAP_PRIORITIES).toContain("critical");
    expect(ROADMAP_PRIORITIES).toContain("future");
  });
});

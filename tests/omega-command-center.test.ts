import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformOmegaAction, createOmegaAuditEntry, requiresMfaForOmega } from "@/lib/omega-command-center/audit";
import { isOmegaConfigAction } from "@/lib/omega-command-center/config-actions";
import { OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR } from "@/lib/omega-command-center/descriptor";
import { allEnginesPresent, buildEngineSnapshot, getEngineTabs } from "@/lib/omega-command-center/engines";
import { exportOmegaSnapshot, isValidOmegaExportFormat } from "@/lib/omega-command-center/export";
import { computeOmegaHealth } from "@/lib/omega-command-center/health";
import {
  advanceEnterpriseScan,
  computeEnterpriseScore,
  createDefaultEngineStates,
  createDefaultRecommendations,
  createDefaultTimeline,
  createEnterpriseHealthCards,
  createExecutiveReport,
  createLiveMonitorReadings,
  createOmegaSettings,
  runFullEnterpriseScanPipeline,
  startEnterpriseScan,
} from "@/lib/omega-command-center/orchestrator";
import { validateOmegaReadiness } from "@/lib/omega-command-center/reader";
import {
  ENTERPRISE_HEALTH_DOMAINS,
  ENTERPRISE_SCAN_PHASES,
  OMEGA_AI_ENGINES,
  OMEGA_COMMAND_CENTER_API,
  OMEGA_ENGINE_ROUTES,
  OMEGA_SCAN_TYPES,
  REPORT_EXPORT_FORMATS,
} from "@/lib/omega-command-center/registry";
import type { OmegaSnapshot } from "@/lib/omega-command-center/types";

function sampleSnapshot(overrides: Partial<OmegaSnapshot> = {}): OmegaSnapshot {
  const healthCards = createEnterpriseHealthCards();
  const enterpriseScore = computeEnterpriseScore(healthCards);
  return {
    dashboard: {
      enterpriseScore,
      healthCards,
      engineStates: createDefaultEngineStates(),
      recommendations: createDefaultRecommendations(),
      executiveReport: createExecutiveReport(enterpriseScore),
      timeline: createDefaultTimeline(),
      liveMonitor: createLiveMonitorReadings(),
    },
    settings: createOmegaSettings(),
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      omega_command_center_v1: true,
      omega_orchestration_enabled: true,
      omega_live_monitor_enabled: true,
      omega_executive_reports_enabled: true,
      omega_auto_repair_enabled: true,
      omega_enterprise_search_enabled: true,
      omega_mobile_mirror_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: enterpriseScore, message: "ok" },
    ...overrides,
  };
}

describe("omega command center descriptor", () => {
  it("registers module id", () => {
    expect(OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.id).toBe("omega-command-center");
  });

  it("auto registers", () => {
    expect(OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/omega");
  });

  it("has master feature flag", () => {
    expect(OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("omega_command_center_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("omega-command-center")?.id).toBe("omega-command-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("omega-command-center")?.moduleId).toBe("omega-command-center");
  });

  it("lists seven ai engines", () => {
    expect(OMEGA_AI_ENGINES).toHaveLength(7);
    expect(OMEGA_ENGINE_ROUTES).toHaveLength(7);
  });

  it("relates to ai os and workflow engine", () => {
    expect(OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-ai-operating-system");
    expect(OMEGA_COMMAND_CENTER_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-workflow-engine");
  });
});

describe("enterprise score and health", () => {
  it("creates health cards for all domains", () => {
    expect(createEnterpriseHealthCards()).toHaveLength(ENTERPRISE_HEALTH_DOMAINS.length);
  });

  it("computes enterprise score", () => {
    const cards = createEnterpriseHealthCards();
    expect(computeEnterpriseScore(cards)).toBeGreaterThan(0);
    expect(computeEnterpriseScore(cards)).toBeLessThanOrEqual(100);
  });

  it("creates engine states", () => {
    expect(createDefaultEngineStates()).toHaveLength(7);
  });

  it("creates live monitor readings", () => {
    expect(createLiveMonitorReadings().length).toBeGreaterThan(10);
  });
});

describe("orchestration pipeline", () => {
  it("starts enterprise scan", () => {
    const scan = startEnterpriseScan("enterprise");
    expect(scan.status).toBe("running");
    expect(scan.currentEngine).toBe("scan");
  });

  it("advances scan phases", () => {
    let scan = startEnterpriseScan("enterprise");
    scan = advanceEnterpriseScan(scan);
    expect(scan.enginesCompleted).toContain("scan");
  });

  it("runs full pipeline", () => {
    const result = runFullEnterpriseScanPipeline();
    expect(result.progress.status).toBe("completed");
    expect(result.progress.enginesCompleted).toHaveLength(7);
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it("covers scan phases", () => {
    expect(ENTERPRISE_SCAN_PHASES.length).toBeGreaterThanOrEqual(10);
  });

  it("lists scan types", () => {
    expect(OMEGA_SCAN_TYPES).toContain("emergency");
    expect(OMEGA_SCAN_TYPES).toContain("production-certification");
  });
});

describe("ai engines", () => {
  it("all engines present", () => {
    expect(allEnginesPresent()).toBe(true);
  });

  it("scan engine tabs", () => {
    expect(getEngineTabs("scan")).toContain("infrastructure");
    expect(getEngineTabs("scan")).toContain("marketplace");
  });

  it("sentinel engine tabs", () => {
    expect(getEngineTabs("sentinel")).toContain("threats");
    expect(getEngineTabs("sentinel")).toContain("fraud");
  });

  it("oracle engine tabs", () => {
    expect(getEngineTabs("oracle")).toContain("forecast");
    expect(getEngineTabs("oracle")).toContain("revenue");
  });

  it("phoenix engine tabs", () => {
    expect(getEngineTabs("phoenix")).toContain("self-healing");
  });

  it("builds engine snapshot", () => {
    const snap = buildEngineSnapshot("atlas", "live-topology");
    expect(snap.engine).toBe("atlas");
    expect(snap.tab).toBe("live-topology");
    expect(snap.items.length).toBeGreaterThan(0);
  });
});

describe("recommendations and timeline", () => {
  it("creates recommendations with priorities", () => {
    const recs = createDefaultRecommendations();
    expect(recs.some((r) => r.priority === "critical")).toBe(true);
    expect(recs[0]?.actions).toContain("auto-repair");
  });

  it("creates timeline", () => {
    expect(createDefaultTimeline().length).toBeGreaterThanOrEqual(6);
  });

  it("creates executive report", () => {
    const report = createExecutiveReport(85);
    expect(report.enterpriseScore).toBe(85);
    expect(report.executiveSummary).toContain("85");
  });
});

describe("export", () => {
  it("exports json", () => {
    expect(exportOmegaSnapshot(sampleSnapshot(), "json")).toContain("snapshot");
  });

  it("exports csv", () => {
    expect(exportOmegaSnapshot(sampleSnapshot(), "csv")).toContain("domain,label");
  });

  it("exports pdf text", () => {
    expect(exportOmegaSnapshot(sampleSnapshot(), "pdf")).toContain("OMEGA Executive Report");
  });

  it("validates export format", () => {
    expect(isValidOmegaExportFormat("json")).toBe(true);
    expect(REPORT_EXPORT_FORMATS).toHaveLength(4);
  });
});

describe("audit and permissions", () => {
  it("allows view", () => {
    expect(canPerformOmegaAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for repair", () => {
    expect(canPerformOmegaAction({ action: "repair", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformOmegaAction({ action: "repair", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for deploy", () => {
    expect(requiresMfaForOmega("deploy")).toBe(true);
  });

  it("allows run-scan without mfa", () => {
    expect(canPerformOmegaAction({ action: "run-scan" }).allowed).toBe(true);
  });

  it("creates audit entry", () => {
    expect(createOmegaAuditEntry("run-scan", "admin", "omega").action).toBe("run-scan");
  });

  it("identifies config actions", () => {
    expect(isOmegaConfigAction("publish-config")).toBe(true);
  });
});

describe("health and readiness", () => {
  it("computes omega health", () => {
    expect(computeOmegaHealth(sampleSnapshot()).score).toBeGreaterThan(0);
  });

  it("reports disabled", () => {
    expect(
      computeOmegaHealth(
        sampleSnapshot({ featureFlagsConfig: { omega_command_center_v1: false } as OmegaSnapshot["featureFlagsConfig"] }),
      ).status,
    ).toBe("failed");
  });

  it("validates readiness", () => {
    expect(validateOmegaReadiness(sampleSnapshot()).ready).toBe(true);
  });
});

describe("api routes", () => {
  it("exposes snapshot api", () => {
    expect(OMEGA_COMMAND_CENTER_API.snapshot).toBe("/api/super-admin/omega");
  });

  it("exposes orchestration endpoints", () => {
    expect(OMEGA_COMMAND_CENTER_API.runScan).toContain("run-scan");
    expect(OMEGA_COMMAND_CENTER_API.quickScan).toContain("quick-scan");
    expect(OMEGA_COMMAND_CENTER_API.deepScan).toContain("deep-scan");
    expect(OMEGA_COMMAND_CENTER_API.repair).toContain("repair");
    expect(OMEGA_COMMAND_CENTER_API.diagnostics).toContain("diagnostics");
  });

  it("exposes v1 snapshot", () => {
    expect(OMEGA_COMMAND_CENTER_API.v1Snapshot).toContain("/api/v1/");
  });
});

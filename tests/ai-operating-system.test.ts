import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformAiOsAction, createAiOsAuditEntry, requiresMfaForAiOs } from "@/lib/enterprise-ai-operating-system/audit";
import { isAiOsConfigAction } from "@/lib/enterprise-ai-operating-system/config-actions";
import { ENTERPRISE_AI_OS_MODULE_DESCRIPTOR } from "@/lib/enterprise-ai-operating-system/descriptor";
import {
  createDefaultAiOsSettings,
  createDefaultAiOsState,
  buildAiOsDashboard,
  buildDashboardWidgets,
} from "@/lib/enterprise-ai-operating-system/engine";
import { computeAiOsHealth } from "@/lib/enterprise-ai-operating-system/health";
import {
  allocateResources,
  createRepairPlanFromRecommendation,
  generateOmegaRecommendations,
  prioritizeRecommendations,
  runOmegaAnalysis,
} from "@/lib/enterprise-ai-operating-system/omega";
import {
  averagePredictionConfidence,
  generateAllPredictions,
  generatePrediction,
} from "@/lib/enterprise-ai-operating-system/predictions";
import {
  ENTERPRISE_AI_OS_API,
  ENTERPRISE_AI_OS_ROUTES,
  SCAN_MODES,
  SCAN_TARGET_TYPES,
  SENTINEL_MONITOR_TYPES,
  PREDICTION_TYPES,
  SELF_HEALING_ISSUE_TYPES,
  AI_DASHBOARD_WIDGETS,
} from "@/lib/enterprise-ai-operating-system/registry";
import { validateAiOsReadiness } from "@/lib/enterprise-ai-operating-system/reader";
import {
  aggregateScanScore,
  isValidScanMode,
  listScanModes,
  resolveScanTargets,
  runScan,
} from "@/lib/enterprise-ai-operating-system/scan";
import {
  buildRiskTimeline,
  computeSentinelScores,
  createDefaultAlerts,
  detectThreat,
  isValidMonitorType,
  resolveAlert,
} from "@/lib/enterprise-ai-operating-system/sentinel";
import {
  approveRepair,
  cancelRepair,
  createRepairPlan,
  detectSelfHealingIssues,
  pendingRepairs,
  rejectRepair,
} from "@/lib/enterprise-ai-operating-system/self-healing";
import {
  AUTOMATION_SUGGESTIONS,
  buildAutomationQueue,
  listAutomationSuggestions,
  suggestAutomationsForModule,
} from "@/lib/enterprise-ai-operating-system/automation";
import type { AiOsSnapshot } from "@/lib/enterprise-ai-operating-system/types";

function sampleSnapshot(overrides: Partial<AiOsSnapshot> = {}): AiOsSnapshot {
  const state = createDefaultAiOsState();
  const settings = createDefaultAiOsSettings();
  return {
    tab: "dashboard",
    dashboard: buildAiOsDashboard(state, settings),
    sentinelScores: computeSentinelScores(state.alerts),
    scans: state.scans,
    alerts: state.alerts,
    recommendations: state.recommendations,
    predictions: state.predictions,
    repairs: state.repairs,
    models: state.models,
    incidents: state.incidents,
    history: [],
    auditLog: [],
    featureFlags: {
      ai_os_enabled: true,
      scan_engine_enabled: true,
      sentinel_engine_enabled: true,
      omega_core_enabled: true,
      self_healing_enabled: true,
      predictions_enabled: true,
      automation_queue_enabled: true,
      learning_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: 85, message: "ok" },
    ...overrides,
  };
}

describe("enterprise ai os descriptor", () => {
  it("registers module id", () => {
    expect(ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.id).toBe("enterprise-ai-operating-system");
  });

  it("auto registers", () => {
    expect(ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/ai");
  });

  it("includes eight feature flags", () => {
    expect(ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.featureFlags).toHaveLength(8);
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-ai-operating-system")?.id).toBe("enterprise-ai-operating-system");
  });

  it("discovered by module registry v2", () => {
    const mod = getDiscoveredModuleV2("enterprise-ai-operating-system");
    expect(mod?.moduleId).toBe("enterprise-ai-operating-system");
  });
});

describe("enterprise ai os routes", () => {
  it("defines eight routes", () => {
    expect(ENTERPRISE_AI_OS_ROUTES).toHaveLength(8);
  });

  it("includes scan center route", () => {
    expect(ENTERPRISE_AI_OS_ROUTES.find((r) => r.id === "scan")?.href).toBe("/super-admin/ai/scan");
  });

  it("includes omega center route", () => {
    expect(ENTERPRISE_AI_OS_ROUTES.find((r) => r.id === "omega")?.href).toBe("/super-admin/ai/omega");
  });
});

describe("scan engine", () => {
  it("lists all scan modes", () => {
    expect(listScanModes()).toEqual([...SCAN_MODES]);
  });

  it("validates scan mode", () => {
    expect(isValidScanMode("full-platform")).toBe(true);
    expect(isValidScanMode("invalid")).toBe(false);
  });

  it("resolves full platform targets", () => {
    expect(resolveScanTargets("full-platform")).toHaveLength(SCAN_TARGET_TYPES.length);
  });

  it("runs scan and returns report", () => {
    const report = runScan("security");
    expect(report.mode).toBe("security");
    expect(report.status).toBe("completed");
    expect(report.score).toBeGreaterThan(0);
  });

  it("aggregates scan scores", () => {
    const reports = [runScan("quick"), runScan("security")];
    expect(aggregateScanScore(reports)).toBeGreaterThan(0);
  });
});

describe("sentinel engine", () => {
  it("creates default alerts", () => {
    expect(createDefaultAlerts().length).toBeGreaterThan(0);
  });

  it("computes sentinel scores", () => {
    const scores = computeSentinelScores(createDefaultAlerts());
    expect(scores.securityScore).toBeGreaterThanOrEqual(0);
    expect(scores.trustScore).toBeGreaterThanOrEqual(0);
  });

  it("detects threats", () => {
    const alerts = [{ id: "1", type: "attacks" as const, severity: "critical" as const, title: "t", description: "d", detectedAt: new Date().toISOString(), resolved: false }];
    expect(detectThreat(alerts)).toHaveLength(1);
  });

  it("validates monitor type", () => {
    expect(isValidMonitorType("fraud")).toBe(true);
    expect(isValidMonitorType("unknown")).toBe(false);
  });

  it("builds risk timeline", () => {
    const timeline = buildRiskTimeline(createDefaultAlerts());
    expect(timeline.length).toBeGreaterThan(0);
  });

  it("resolves alert", () => {
    const alerts = createDefaultAlerts();
    const resolved = resolveAlert(alerts, alerts[1]!.id);
    expect(resolved.find((a) => a.id === alerts[1]!.id)?.resolved).toBe(true);
  });

  it("covers sentinel monitor types", () => {
    expect(SENTINEL_MONITOR_TYPES.length).toBe(15);
  });
});

describe("omega core", () => {
  it("generates recommendations", () => {
    const state = createDefaultAiOsState();
    const recs = generateOmegaRecommendations(state.scans, state.alerts);
    expect(recs.length).toBeGreaterThan(0);
  });

  it("prioritizes recommendations", () => {
    const state = createDefaultAiOsState();
    const recs = prioritizeRecommendations(generateOmegaRecommendations(state.scans, state.alerts));
    expect(recs[0]?.priority).toBeDefined();
  });

  it("runs omega analysis", () => {
    const state = createDefaultAiOsState();
    const analysis = runOmegaAnalysis(state.scans, state.alerts);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
    expect(analysis.intelligenceScore).toBeGreaterThanOrEqual(0);
  });

  it("allocates resources by module", () => {
    const state = createDefaultAiOsState();
    const allocation = allocateResources(state.recommendations);
    expect(Object.keys(allocation).length).toBeGreaterThan(0);
  });

  it("creates repair plan from recommendation", () => {
    const rec = generateOmegaRecommendations(createDefaultAiOsState().scans, createDefaultAlerts())[0]!;
    const plan = createRepairPlanFromRecommendation(rec);
    expect(plan.status).toBe("pending-approval");
    expect(plan.requiresApproval).toBe(true);
  });
});

describe("predictions", () => {
  it("generates prediction for type", () => {
    const pred = generatePrediction("traffic");
    expect(pred.type).toBe("traffic");
    expect(pred.confidence).toBeGreaterThan(0);
  });

  it("generates all prediction types", () => {
    expect(generateAllPredictions()).toHaveLength(PREDICTION_TYPES.length);
  });

  it("computes average confidence", () => {
    const preds = generateAllPredictions();
    expect(averagePredictionConfidence(preds)).toBeGreaterThan(0);
  });
});

describe("self healing and repair queue", () => {
  it("detects self healing issues", () => {
    expect(detectSelfHealingIssues().length).toBeGreaterThan(0);
  });

  it("creates repair plan", () => {
    const plan = createRepairPlan("failed-cron");
    expect(plan.status).toBe("pending-approval");
  });

  it("approves repair with actor", () => {
    const approved = approveRepair(createRepairPlan("broken-queue"), "admin-1");
    expect(approved.status).toBe("approved");
    expect(approved.approvedBy).toBe("admin-1");
  });

  it("cancels repair", () => {
    expect(cancelRepair(createRepairPlan("failed-api")).status).toBe("cancelled");
  });

  it("rejects repair", () => {
    expect(rejectRepair(createRepairPlan("cache-failure")).status).toBe("rejected");
  });

  it("lists pending repairs", () => {
    const plans = [createRepairPlan("search-failure"), approveRepair(createRepairPlan("email-failure"), "a")];
    expect(pendingRepairs(plans)).toHaveLength(1);
  });

  it("covers self healing issue types", () => {
    expect(SELF_HEALING_ISSUE_TYPES.length).toBe(11);
  });
});

describe("automation", () => {
  it("lists automation suggestions", () => {
    expect(listAutomationSuggestions()).toEqual([...AUTOMATION_SUGGESTIONS]);
  });

  it("builds automation queue", () => {
    expect(buildAutomationQueue(listAutomationSuggestions()).length).toBe(AUTOMATION_SUGGESTIONS.length);
  });

  it("suggests automations for recovery module", () => {
    expect(suggestAutomationsForModule("recovery-center")).toContain("backups");
  });
});

describe("ai dashboard", () => {
  it("builds dashboard metrics", () => {
    const state = createDefaultAiOsState();
    const dashboard = buildAiOsDashboard(state, createDefaultAiOsSettings());
    expect(dashboard.aiHealthScore).toBeGreaterThan(0);
    expect(["healthy", "warning", "critical"]).toContain(dashboard.aiStatus);
  });

  it("builds dashboard widgets", () => {
    const widgets = buildDashboardWidgets(createDefaultAiOsState());
    expect(widgets).toHaveLength(AI_DASHBOARD_WIDGETS.length);
    expect(widgets[0]?.widget).toBe("ai-status");
  });
});

describe("permissions and audit", () => {
  it("allows view for super admin", () => {
    expect(canPerformAiOsAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for repair approval", () => {
    expect(canPerformAiOsAction({ action: "approve-repair", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformAiOsAction({ action: "approve-repair", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for config publish", () => {
    expect(canPerformAiOsAction({ action: "publish", mfaVerified: false }).allowed).toBe(false);
  });

  it("flags mfa audit actions", () => {
    expect(requiresMfaForAiOs("repair")).toBe(true);
    expect(requiresMfaForAiOs("scan")).toBe(false);
  });

  it("creates audit entry", () => {
    const entry = createAiOsAuditEntry("scan", "admin", "platform");
    expect(entry.action).toBe("scan");
    expect(entry.actor).toBe("admin");
  });
});

describe("config lifecycle", () => {
  it("recognizes config actions", () => {
    expect(isAiOsConfigAction("publish")).toBe(true);
    expect(isAiOsConfigAction("run-scan")).toBe(false);
  });

  it("exposes config keys on descriptor", () => {
    expect(ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.configKeys.draft).toBe("enterprise_ai_os_draft_v1");
    expect(ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.configKeys.live).toBe("enterprise_ai_os_live_v1");
  });
});

describe("api registry", () => {
  it("defines snapshot endpoint", () => {
    expect(ENTERPRISE_AI_OS_API.snapshot).toBe("/api/super-admin/ai");
  });

  it("defines run scan endpoint", () => {
    expect(ENTERPRISE_AI_OS_API.runScan).toBe("/api/super-admin/ai/run-scan");
  });

  it("defines repair endpoints", () => {
    expect(ENTERPRISE_AI_OS_API.approveRepair).toBe("/api/super-admin/ai/approve-repair");
    expect(ENTERPRISE_AI_OS_API.cancelRepair).toBe("/api/super-admin/ai/cancel-repair");
  });
});

describe("health and readiness", () => {
  it("computes health when enabled", () => {
    const health = computeAiOsHealth(sampleSnapshot());
    expect(health.score).toBeGreaterThan(0);
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("reports failed when disabled", () => {
    const health = computeAiOsHealth(sampleSnapshot({ featureFlags: { ...sampleSnapshot().featureFlags, ai_os_enabled: false } }));
    expect(health.status).toBe("failed");
  });

  it("validates readiness", () => {
    const readiness = validateAiOsReadiness(sampleSnapshot());
    expect(readiness.ready).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(75);
  });
});

describe("workflow integration", () => {
  it("links repair plans to workflow engine", () => {
    const plan = createRepairPlan("broken-jobs");
    expect(plan.workflowId).toBe("enterprise-workflow-engine");
  });

  it("references workflow engine in related modules", () => {
    expect(ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-workflow-engine");
  });
});

describe("enterprise registration", () => {
  it("registers scan target count", () => {
    expect(SCAN_TARGET_TYPES.length).toBe(22);
  });

  it("registers scan mode count", () => {
    expect(SCAN_MODES.length).toBe(14);
  });

  it("module has permissions for scan and analysis", () => {
    const actions = ENTERPRISE_AI_OS_MODULE_DESCRIPTOR.permissions.map((p) => p.action);
    expect(actions).toContain("run-scan");
    expect(actions).toContain("run-analysis");
    expect(actions).toContain("create-repair-plan");
  });
});

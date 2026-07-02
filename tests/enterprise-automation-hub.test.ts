import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import {
  allAiSourcesPresent,
  generateAutomationAiInsights,
  omegaInsightCount,
  scanInsightCount,
  sentinelInsightCount,
} from "@/lib/enterprise-automation-hub/ai-integration";
import { canPerformAutomationAction, createAutomationAuditEntry, requiresMfaForAutomation } from "@/lib/enterprise-automation-hub/audit";
import { isAutomationConfigAction } from "@/lib/enterprise-automation-hub/config-actions";
import { ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR } from "@/lib/enterprise-automation-hub/descriptor";
import {
  buildAutomationDashboard,
  createDefaultAutomationSettings,
  createDefaultAutomationState,
  refreshAutomationState,
} from "@/lib/enterprise-automation-hub/engine";
import { exportAutomationSnapshot, isValidAutomationExportFormat, parseAutomationImportPayload } from "@/lib/enterprise-automation-hub/export";
import { computeAutomationHealth } from "@/lib/enterprise-automation-hub/health";
import { validateAutomationReadiness } from "@/lib/enterprise-automation-hub/reader";
import {
  AUTOMATION_TYPES,
  ENTERPRISE_AUTOMATION_HUB_API,
  ENTERPRISE_AUTOMATION_HUB_ROUTES,
  EVENT_TRIGGERS,
  EXPORT_FORMATS,
  WORKFLOW_EXECUTION_MODES,
} from "@/lib/enterprise-automation-hub/registry";
import type { AutomationSnapshot } from "@/lib/enterprise-automation-hub/types";

function sampleSnapshot(overrides: Partial<AutomationSnapshot> = {}): AutomationSnapshot {
  const state = createDefaultAutomationState();
  const settings = createDefaultAutomationSettings();
  return {
    tab: "dashboard",
    dashboard: buildAutomationDashboard(state),
    workflows: state.workflows,
    rules: state.rules,
    eventTriggers: state.eventTriggers,
    templates: state.templates,
    schedules: state.schedules,
    executions: state.executions,
    approvals: state.approvals,
    versions: state.versions,
    aiInsights: state.aiInsights,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      enterprise_automation_hub_v1: true,
      workflow_builder_enabled: true,
      rule_engine_enabled: true,
      event_triggers_enabled: true,
      scheduler_enabled: true,
      approval_workflows_enabled: true,
      ai_automation_enabled: true,
      import_export_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: 94, message: "ok" },
    ...overrides,
  };
}

describe("enterprise automation hub descriptor", () => {
  it("registers module id", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.id).toBe("enterprise-automation-hub");
  });

  it("auto registers", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/automation");
  });

  it("has master feature flag", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("enterprise_automation_hub_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-automation-hub")?.id).toBe("enterprise-automation-hub");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-automation-hub")?.moduleId).toBe("enterprise-automation-hub");
  });

  it("lists routes", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_ROUTES.length).toBeGreaterThanOrEqual(11);
  });

  it("relates to workflow engine and ai os", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-workflow-engine");
    expect(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-ai-operating-system");
  });

  it("uses platform category", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_MODULE_DESCRIPTOR.category).toBe("platform");
  });
});

describe("automation dashboard", () => {
  it("builds dashboard", () => {
    const dashboard = buildAutomationDashboard(createDefaultAutomationState());
    expect(dashboard.activeWorkflows).toBeGreaterThan(0);
    expect(dashboard.successRate).toBeGreaterThanOrEqual(0);
    expect(dashboard.automationHealth).toBeGreaterThan(0);
  });

  it("includes approval queue", () => {
    const dashboard = buildAutomationDashboard(createDefaultAutomationState());
    expect(dashboard.approvalQueue).toBeGreaterThanOrEqual(0);
  });

  it("refreshes state", () => {
    const refreshed = refreshAutomationState(createDefaultAutomationState());
    expect(refreshed.executions.length).toBeGreaterThan(0);
  });
});

describe("workflow and rule engine", () => {
  it("creates default workflows", () => {
    expect(createDefaultAutomationState().workflows.length).toBeGreaterThan(0);
  });

  it("creates default rules", () => {
    expect(createDefaultAutomationState().rules.length).toBeGreaterThanOrEqual(5);
  });

  it("covers automation types", () => {
    expect(AUTOMATION_TYPES.length).toBe(16);
  });

  it("covers execution modes", () => {
    expect(WORKFLOW_EXECUTION_MODES).toContain("parallel");
    expect(WORKFLOW_EXECUTION_MODES).toContain("conditional");
  });
});

describe("event triggers", () => {
  it("lists event triggers", () => {
    expect(EVENT_TRIGGERS).toContain("order-created");
    expect(EVENT_TRIGGERS).toContain("payment-completed");
    expect(EVENT_TRIGGERS).toContain("fraud-detection");
    expect(EVENT_TRIGGERS.length).toBe(17);
  });

  it("creates event trigger configs", () => {
    expect(createDefaultAutomationState().eventTriggers.length).toBeGreaterThan(0);
  });
});

describe("schedules and executions", () => {
  it("creates schedules", () => {
    expect(createDefaultAutomationState().schedules.length).toBeGreaterThan(0);
  });

  it("creates execution history", () => {
    const executions = createDefaultAutomationState().executions;
    expect(executions.some((e) => e.rollbackAvailable)).toBe(true);
    expect(executions.some((e) => e.status === "failed")).toBe(true);
  });

  it("creates approval requests", () => {
    expect(createDefaultAutomationState().approvals.some((a) => a.status === "pending-approval")).toBe(true);
  });

  it("creates version history", () => {
    expect(createDefaultAutomationState().versions.some((v) => v.rollbackAvailable)).toBe(true);
  });
});

describe("ai integration", () => {
  it("generates ai insights", () => {
    expect(generateAutomationAiInsights().length).toBeGreaterThan(0);
  });

  it("includes all ai sources", () => {
    expect(allAiSourcesPresent(generateAutomationAiInsights())).toBe(true);
  });

  it("counts scan insights", () => {
    expect(scanInsightCount(generateAutomationAiInsights())).toBeGreaterThan(0);
  });

  it("counts sentinel insights", () => {
    expect(sentinelInsightCount(generateAutomationAiInsights())).toBeGreaterThan(0);
  });

  it("counts omega insights", () => {
    expect(omegaInsightCount(generateAutomationAiInsights())).toBeGreaterThan(0);
  });
});

describe("export", () => {
  it("exports json", () => {
    expect(exportAutomationSnapshot(sampleSnapshot(), "json")).toContain("snapshot");
  });

  it("exports csv", () => {
    expect(exportAutomationSnapshot(sampleSnapshot(), "csv")).toContain("id,name");
  });

  it("exports yaml", () => {
    expect(exportAutomationSnapshot(sampleSnapshot(), "yaml")).toContain("workflows:");
  });

  it("validates export format", () => {
    expect(isValidAutomationExportFormat("json")).toBe(true);
    expect(EXPORT_FORMATS).toHaveLength(3);
  });

  it("parses import", () => {
    expect(parseAutomationImportPayload('{"workflows":[]}')).toEqual({ workflows: [] });
  });
});

describe("audit and permissions", () => {
  it("allows view", () => {
    expect(canPerformAutomationAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for publish", () => {
    expect(canPerformAutomationAction({ action: "publish", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformAutomationAction({ action: "publish", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for rollback", () => {
    expect(requiresMfaForAutomation("rollback")).toBe(true);
  });

  it("allows run without mfa", () => {
    expect(canPerformAutomationAction({ action: "run" }).allowed).toBe(true);
  });

  it("creates audit entry", () => {
    expect(createAutomationAuditEntry("run", "admin", "wf-marketplace").action).toBe("run");
  });

  it("identifies config actions", () => {
    expect(isAutomationConfigAction("publish-config")).toBe(true);
  });
});

describe("health and readiness", () => {
  it("computes automation health", () => {
    expect(computeAutomationHealth(sampleSnapshot()).score).toBeGreaterThan(0);
  });

  it("reports disabled", () => {
    expect(
      computeAutomationHealth(
        sampleSnapshot({ featureFlagsConfig: { enterprise_automation_hub_v1: false } as AutomationSnapshot["featureFlagsConfig"] }),
      ).status,
    ).toBe("failed");
  });

  it("validates readiness", () => {
    expect(validateAutomationReadiness(sampleSnapshot()).ready).toBe(true);
  });
});

describe("settings", () => {
  it("creates default settings", () => {
    const settings = createDefaultAutomationSettings();
    expect(settings.mfaRequiredForPublish).toBe(true);
    expect(settings.maxParallelJobs).toBeGreaterThan(0);
  });
});

describe("api routes", () => {
  it("exposes snapshot api", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_API.snapshot).toBe("/api/super-admin/automation");
  });

  it("exposes action endpoints", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_API.run).toContain("run");
    expect(ENTERPRISE_AUTOMATION_HUB_API.pause).toContain("pause");
    expect(ENTERPRISE_AUTOMATION_HUB_API.stop).toContain("stop");
    expect(ENTERPRISE_AUTOMATION_HUB_API.enable).toContain("enable");
    expect(ENTERPRISE_AUTOMATION_HUB_API.disable).toContain("disable");
    expect(ENTERPRISE_AUTOMATION_HUB_API.publish).toContain("publish");
    expect(ENTERPRISE_AUTOMATION_HUB_API.rollback).toContain("rollback");
    expect(ENTERPRISE_AUTOMATION_HUB_API.export).toContain("export");
    expect(ENTERPRISE_AUTOMATION_HUB_API.import).toContain("import");
  });

  it("exposes v1 snapshot", () => {
    expect(ENTERPRISE_AUTOMATION_HUB_API.v1Snapshot).toContain("/api/v1/");
  });
});

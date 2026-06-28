import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import {
  allAiSourcesPresent,
  generateIncidentAiSuggestions,
  omegaRepairCount,
  scanAnomalyCount,
  sentinelThreatCount,
} from "@/lib/incident-response-center/ai-integration";
import {
  canPerformIncidentAction,
  createIncidentAuditEntry,
  requiresMfaForIncident,
} from "@/lib/incident-response-center/audit";
import { isIncidentConfigAction } from "@/lib/incident-response-center/config-actions";
import { INCIDENT_RESPONSE_MODULE_DESCRIPTOR } from "@/lib/incident-response-center/descriptor";
import {
  buildIncidentDashboard,
  createDefaultIncidentSettings,
  createDefaultIncidentState,
} from "@/lib/incident-response-center/engine";
import {
  exportIncidents,
  exportPostmortem,
  exportSnapshot,
  isValidExportFormat,
  parseImportPayload,
} from "@/lib/incident-response-center/export";
import { computeIncidentHealth } from "@/lib/incident-response-center/health";
import {
  acknowledgeIncident,
  activeIncidents,
  averageResolutionMinutes,
  createDefaultIncidents,
  createIncident,
  criticalIncidents,
  escalateIncident,
  isValidIncidentStatus,
  isValidIncidentType,
  isValidSeverity,
  reopenIncident,
  resolveIncident,
  resolvedToday,
  severityCounts,
} from "@/lib/incident-response-center/incidents";
import {
  createDefaultPlaybooks,
  executePlaybook,
  isValidPlaybookAction,
} from "@/lib/incident-response-center/playbooks";
import {
  formatPostmortemMarkdown,
  generatePostmortem,
} from "@/lib/incident-response-center/postmortem";
import { validateIncidentReadiness } from "@/lib/incident-response-center/reader";
import {
  analyzeRootCause,
  rootCauseConfidence,
} from "@/lib/incident-response-center/root-cause";
import {
  applyAutomations,
  createDefaultAutomations,
  suggestRollback,
} from "@/lib/incident-response-center/automations";
import {
  buildIncidentTimeline,
  createTimelineEvent,
  isValidTimelineEventType,
} from "@/lib/incident-response-center/timeline";
import {
  INCIDENT_RESPONSE_CENTER_API,
  INCIDENT_RESPONSE_CENTER_ROUTES,
  INCIDENT_SEVERITIES,
  INCIDENT_TYPES,
  PLAYBOOK_ACTIONS,
  TIMELINE_EVENT_TYPES,
} from "@/lib/incident-response-center/registry";
import type { IncidentSnapshot } from "@/lib/incident-response-center/types";

function sampleSnapshot(overrides: Partial<IncidentSnapshot> = {}): IncidentSnapshot {
  const state = createDefaultIncidentState();
  const settings = createDefaultIncidentSettings();
  return {
    tab: "dashboard",
    dashboard: buildIncidentDashboard(state, settings),
    incidents: state.incidents,
    liveIncidents: activeIncidents(state.incidents),
    criticalIncidents: criticalIncidents(state.incidents),
    timeline: state.timeline,
    rootCauseAnalyses: state.rootCauseAnalyses,
    postmortems: state.postmortems,
    playbooks: state.playbooks,
    aiSuggestions: state.aiSuggestions,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      enterprise_incident_center_v1: true,
      live_incidents_enabled: true,
      ai_analysis_enabled: true,
      playbooks_enabled: true,
      automations_enabled: true,
      postmortem_enabled: true,
      emergency_mode_enabled: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: 85, message: "ok" },
    ...overrides,
  };
}

describe("incident response center descriptor", () => {
  it("registers module id", () => {
    expect(INCIDENT_RESPONSE_MODULE_DESCRIPTOR.id).toBe("incident-response-center");
  });

  it("auto registers", () => {
    expect(INCIDENT_RESPONSE_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(INCIDENT_RESPONSE_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/incidents");
  });

  it("has master feature flag", () => {
    expect(INCIDENT_RESPONSE_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("enterprise_incident_center_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("incident-response-center")?.id).toBe("incident-response-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("incident-response-center")?.moduleId).toBe("incident-response-center");
  });

  it("lists all routes", () => {
    expect(INCIDENT_RESPONSE_CENTER_ROUTES).toHaveLength(9);
  });

  it("relates to ai os and deployment", () => {
    expect(INCIDENT_RESPONSE_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-ai-operating-system");
    expect(INCIDENT_RESPONSE_MODULE_DESCRIPTOR.relatedModules).toContain("enterprise-deployment-center");
  });
});

describe("incident engine", () => {
  it("creates default incidents", () => {
    expect(createDefaultIncidents().length).toBeGreaterThan(0);
  });

  it("creates incident with id", () => {
    const inc = createIncident({
      priority: "high",
      category: "api",
      detectedBy: "SCAN AI",
      affectedService: "API Gateway",
      title: "Test incident",
    });
    expect(inc.id).toMatch(/^INC-/);
    expect(inc.status).toBe("open");
  });

  it("validates severity", () => {
    expect(isValidSeverity("critical")).toBe(true);
    expect(isValidSeverity("invalid")).toBe(false);
  });

  it("validates incident type", () => {
    expect(isValidIncidentType("payments")).toBe(true);
    expect(INCIDENT_TYPES).toHaveLength(21);
  });

  it("validates status", () => {
    expect(isValidIncidentStatus("resolved")).toBe(true);
  });

  it("acknowledges incident", () => {
    const inc = createIncident({
      priority: "medium",
      category: "database",
      detectedBy: "system",
      affectedService: "DB",
      title: "DB slow",
    });
    const ack = acknowledgeIncident(inc, "engineer-1");
    expect(ack.status).toBe("acknowledged");
    expect(ack.owner).toBe("engineer-1");
  });

  it("escalates incident priority", () => {
    const inc = createIncident({
      priority: "medium",
      category: "api",
      detectedBy: "system",
      affectedService: "API",
      title: "API error",
    });
    const escalated = escalateIncident(inc);
    expect(escalated.priority).toBe("high");
    expect(escalated.status).toBe("escalated");
  });

  it("resolves incident", () => {
    const inc = createIncident({
      priority: "low",
      category: "cron",
      detectedBy: "system",
      affectedService: "Cron",
      title: "Cron delay",
    });
    const resolved = resolveIncident(inc);
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolvedAt).toBeDefined();
  });

  it("reopens incident", () => {
    const inc = resolveIncident(
      createIncident({
        priority: "low",
        category: "email",
        detectedBy: "system",
        affectedService: "Email",
        title: "Email delay",
      }),
    );
    const reopened = reopenIncident(inc);
    expect(reopened.status).toBe("reopened");
    expect(reopened.resolvedAt).toBeUndefined();
  });

  it("filters active incidents", () => {
    const incidents = createDefaultIncidents();
    expect(activeIncidents(incidents).length).toBeLessThan(incidents.length);
  });

  it("filters critical incidents", () => {
    const incidents = createDefaultIncidents();
    expect(criticalIncidents(incidents).every((i) => i.priority === "critical")).toBe(true);
  });

  it("computes severity counts", () => {
    const counts = severityCounts(createDefaultIncidents());
    expect(counts.critical).toBeGreaterThanOrEqual(0);
  });

  it("computes average resolution", () => {
    expect(averageResolutionMinutes(createDefaultIncidents())).toBeGreaterThanOrEqual(0);
  });

  it("counts resolved today", () => {
    expect(resolvedToday(createDefaultIncidents()).length).toBeGreaterThanOrEqual(0);
  });
});

describe("dashboard", () => {
  it("builds dashboard metrics", () => {
    const state = createDefaultIncidentState();
    const settings = createDefaultIncidentSettings();
    const dashboard = buildIncidentDashboard(state, settings);
    expect(dashboard.activeIncidents).toBeGreaterThan(0);
    expect(dashboard.critical).toBeGreaterThanOrEqual(0);
    expect(typeof dashboard.emergencyMode).toBe("boolean");
  });

  it("includes ai suggestions count", () => {
    const state = createDefaultIncidentState();
    const dashboard = buildIncidentDashboard(state, createDefaultIncidentSettings());
    expect(dashboard.aiSuggestions).toBeGreaterThan(0);
  });

  it("lists all severities", () => {
    expect(INCIDENT_SEVERITIES).toHaveLength(5);
  });
});

describe("root cause analysis", () => {
  it("analyzes incident", () => {
    const inc = createDefaultIncidents()[0]!;
    const rca = analyzeRootCause(inc);
    expect(rca.incidentId).toBe(inc.id);
    expect(rca.confidencePercent).toBeGreaterThan(0);
    expect(rca.sources).toContain("scan");
  });

  it("includes ai explanation", () => {
    const inc = createDefaultIncidents()[0]!;
    expect(analyzeRootCause(inc).aiExplanation.length).toBeGreaterThan(0);
  });

  it("computes confidence level", () => {
    const inc = createDefaultIncidents()[0]!;
    const level = rootCauseConfidence(analyzeRootCause(inc));
    expect(["high", "medium", "low"]).toContain(level);
  });
});

describe("playbooks", () => {
  it("creates default playbooks", () => {
    expect(createDefaultPlaybooks()).toHaveLength(PLAYBOOK_ACTIONS.length);
  });

  it("validates playbook action", () => {
    expect(isValidPlaybookAction("rollback")).toBe(true);
    expect(isValidPlaybookAction("invalid")).toBe(false);
  });

  it("executes playbook", () => {
    const pb = createDefaultPlaybooks()[0]!;
    const result = executePlaybook(pb, "INC-1001");
    expect(result.success).toBe(true);
  });

  it("covers all playbook actions", () => {
    expect(PLAYBOOK_ACTIONS).toHaveLength(10);
  });
});

describe("timeline", () => {
  it("creates timeline event", () => {
    const event = createTimelineEvent("INC-1", "detection", "SCAN AI", "Detected anomaly");
    expect(event.type).toBe("detection");
  });

  it("validates timeline event type", () => {
    expect(isValidTimelineEventType("resolution")).toBe(true);
    expect(TIMELINE_EVENT_TYPES).toHaveLength(7);
  });

  it("builds incident timeline", () => {
    const inc = createDefaultIncidents()[0]!;
    const events = buildIncidentTimeline(inc, []);
    expect(events.length).toBeGreaterThan(0);
  });
});

describe("postmortem", () => {
  it("generates postmortem", () => {
    const inc = resolveIncident(createDefaultIncidents()[0]!);
    const pm = generatePostmortem(inc);
    expect(pm.incidentId).toBe(inc.id);
    expect(pm.lessonsLearned.length).toBeGreaterThan(0);
  });

  it("formats markdown", () => {
    const inc = resolveIncident(createDefaultIncidents()[0]!);
    const md = formatPostmortemMarkdown(generatePostmortem(inc));
    expect(md).toContain("# Postmortem");
  });
});

describe("ai integration", () => {
  it("generates ai suggestions", () => {
    const suggestions = generateIncidentAiSuggestions(createDefaultIncidents());
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("includes all ai sources", () => {
    const suggestions = generateIncidentAiSuggestions(createDefaultIncidents());
    expect(allAiSourcesPresent(suggestions)).toBe(true);
  });

  it("counts scan anomalies", () => {
    const suggestions = generateIncidentAiSuggestions(createDefaultIncidents());
    expect(scanAnomalyCount(suggestions)).toBeGreaterThan(0);
  });

  it("counts sentinel threats", () => {
    const suggestions = generateIncidentAiSuggestions(createDefaultIncidents());
    expect(sentinelThreatCount(suggestions)).toBeGreaterThan(0);
  });

  it("counts omega repairs", () => {
    const suggestions = generateIncidentAiSuggestions(createDefaultIncidents());
    expect(omegaRepairCount(suggestions)).toBeGreaterThanOrEqual(0);
  });
});

describe("automations", () => {
  it("creates default automations", () => {
    expect(createDefaultAutomations().length).toBeGreaterThan(0);
  });

  it("applies auto assign", () => {
    const inc = createIncident({
      priority: "medium",
      category: "api",
      detectedBy: "system",
      affectedService: "API",
      title: "Test",
    });
    const settings = createDefaultIncidentSettings();
    const { actions } = applyAutomations(inc, settings);
    expect(actions).toContain("auto-assign");
  });

  it("suggests rollback for deployment incidents", () => {
    const inc = createIncident({
      priority: "critical",
      category: "deployment",
      detectedBy: "system",
      affectedService: "Production",
      title: "Deploy fail",
    });
    expect(suggestRollback(inc)).toBe(true);
  });
});

describe("export", () => {
  it("exports json", () => {
    const data = exportIncidents(createDefaultIncidents(), "json");
    expect(data).toContain("incidents");
  });

  it("exports csv", () => {
    const data = exportIncidents(createDefaultIncidents(), "csv");
    expect(data).toContain("id,priority");
  });

  it("validates export format", () => {
    expect(isValidExportFormat("pdf")).toBe(true);
    expect(isValidExportFormat("xml")).toBe(false);
  });

  it("exports snapshot", () => {
    const data = exportSnapshot(sampleSnapshot(), "json");
    expect(data).toContain("snapshot");
  });

  it("exports postmortem pdf content", () => {
    const inc = resolveIncident(createDefaultIncidents()[0]!);
    const content = exportPostmortem(generatePostmortem(inc), "pdf");
    expect(content).toContain("Postmortem");
  });

  it("parses import payload", () => {
    const parsed = parseImportPayload('{"incidents":[]}');
    expect(parsed.incidents).toEqual([]);
  });
});

describe("audit and permissions", () => {
  it("allows view action", () => {
    expect(canPerformIncidentAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires mfa for escalate", () => {
    expect(canPerformIncidentAction({ action: "escalate", mfaVerified: false }).allowed).toBe(false);
    expect(canPerformIncidentAction({ action: "escalate", mfaVerified: true }).allowed).toBe(true);
  });

  it("requires mfa for resolve", () => {
    expect(requiresMfaForIncident("resolution")).toBe(true);
  });

  it("creates audit entry", () => {
    const entry = createIncidentAuditEntry("escalation", "admin", "INC-1");
    expect(entry.action).toBe("escalation");
  });

  it("identifies config actions", () => {
    expect(isIncidentConfigAction("publish-config")).toBe(true);
    expect(isIncidentConfigAction("acknowledge")).toBe(false);
  });
});

describe("health and readiness", () => {
  it("computes health", () => {
    const health = computeIncidentHealth(sampleSnapshot());
    expect(health.score).toBeGreaterThan(0);
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("reports disabled when feature flag off", () => {
    const health = computeIncidentHealth(
      sampleSnapshot({ featureFlagsConfig: { enterprise_incident_center_v1: false } as IncidentSnapshot["featureFlagsConfig"] }),
    );
    expect(health.status).toBe("failed");
  });

  it("validates readiness", () => {
    const readiness = validateIncidentReadiness(sampleSnapshot());
    expect(readiness.ready).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(75);
  });
});

describe("api routes", () => {
  it("exposes snapshot api", () => {
    expect(INCIDENT_RESPONSE_CENTER_API.snapshot).toBe("/api/super-admin/incidents");
  });

  it("exposes action endpoints", () => {
    expect(INCIDENT_RESPONSE_CENTER_API.acknowledge).toContain("acknowledge");
    expect(INCIDENT_RESPONSE_CENTER_API.escalate).toContain("escalate");
    expect(INCIDENT_RESPONSE_CENTER_API.resolve).toContain("resolve");
    expect(INCIDENT_RESPONSE_CENTER_API.reopen).toContain("reopen");
    expect(INCIDENT_RESPONSE_CENTER_API.rollback).toContain("rollback");
    expect(INCIDENT_RESPONSE_CENTER_API.export).toContain("export");
    expect(INCIDENT_RESPONSE_CENTER_API.import).toContain("import");
  });

  it("exposes v1 snapshot", () => {
    expect(INCIDENT_RESPONSE_CENTER_API.v1Snapshot).toContain("/api/v1/");
  });
});

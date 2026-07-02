import { describe, expect, it } from "vitest";
import { canPerformIncidentAction } from "@/lib/incident-command-center-engine/audit";
import { createDefaultIncidentCommandSettings } from "@/lib/incident-command-center-engine/engine";
import {
  INCIDENT_CATEGORIES,
  INCIDENT_COMMAND_ROUTES,
  INCIDENT_EMERGENCY_ACTIONS,
  INCIDENT_OMEGA_ACTIONS,
  INCIDENT_PUSH_TYPES,
  INCIDENT_REPORT_TYPES,
} from "@/lib/incident-command-center-engine/registry";
import {
  assembleLiveIncidents,
  buildIncidentAnalytics,
  buildIncidentDashboard,
  buildIncidentOriAnalyses,
  filterIncidentsByTab,
  smartPriorityEngine,
  validateIncidentCommandReadiness,
} from "@/lib/incident-command-center-engine/timeline";
import type { IncidentLiveContext } from "@/lib/incident-command-center-engine/live";
import type { IncidentRecord } from "@/lib/incident-command-center-engine/types";

const emptyCtx: IncidentLiveContext = {
  operationsIncidents: null,
  operationsError: null,
  omegaAlerts: null,
  omegaError: null,
  deviceAlerts: null,
  deviceError: null,
  health: null,
  healthError: null,
  operations: null,
  operationsSnapshotError: null,
  platformErrors: null,
  platformErrorsError: null,
  resolvedTodayCount: null,
};

const sampleIncident: IncidentRecord = {
  id: "test-1",
  incidentId: "test-1",
  severity: "critical",
  category: "api",
  affectedModule: "API Gateway",
  detectionTime: new Date().toISOString(),
  status: "open",
  assignedEngine: "OMEGA",
  rootCause: "Elevated latency",
  riskLevel: "critical",
  recommendedAction: "Scale workers",
  estimatedImpact: "High platform impact",
  evidence: "p95 latency exceeded threshold",
  resolutionProgress: 10,
  title: "API latency spike",
  source: "omega-enterprise",
};

describe("incident command center engine v1.0", () => {
  it("registers all SA-005 routes", () => {
    expect(INCIDENT_COMMAND_ROUTES.length).toBe(13);
    expect(INCIDENT_COMMAND_ROUTES.some((r) => r.href.includes("/mobile/incidents/emergency"))).toBe(true);
  });

  it("registers incident categories", () => {
    expect(INCIDENT_CATEGORIES.length).toBe(27);
    expect(INCIDENT_CATEGORIES).toContain("guardian");
    expect(INCIDENT_CATEGORIES).toContain("cron");
  });

  it("registers omega actions and emergency actions", () => {
    expect(INCIDENT_OMEGA_ACTIONS.length).toBe(11);
    expect(INCIDENT_EMERGENCY_ACTIONS.length).toBe(9);
    expect(INCIDENT_REPORT_TYPES.length).toBe(6);
    expect(INCIDENT_PUSH_TYPES.length).toBe(8);
  });

  it("assembles incidents from empty context", () => {
    const incidents = assembleLiveIncidents(emptyCtx, {});
    expect(Array.isArray(incidents)).toBe(true);
  });

  it("builds incident dashboard counts", () => {
    const incidents = [sampleIncident];
    const dashboard = buildIncidentDashboard(incidents, 0);
    expect(dashboard.critical).toBe(1);
    expect(dashboard.open).toBe(1);
  });

  it("smart priority engine merges duplicates", () => {
    const duplicate = { ...sampleIncident, id: "test-2", incidentId: "test-2" };
    const merged = smartPriorityEngine([sampleIncident, duplicate], { suppressRepeated: true });
    expect(merged[0]?.mergedCount).toBe(2);
  });

  it("escalates stale critical incidents", () => {
    const stale = {
      ...sampleIncident,
      detectionTime: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
    };
    const result = smartPriorityEngine([stale], {});
    expect(result[0]?.status).toBe("escalated");
  });

  it("filters incidents by security tab", () => {
    const security = { ...sampleIncident, category: "security" as const };
    const filtered = filterIncidentsByTab([sampleIncident, security], "security");
    expect(filtered).toHaveLength(1);
  });

  it("builds ORI analyses with confidence", () => {
    const analyses = buildIncidentOriAnalyses([sampleIncident]);
    expect(analyses[0]?.confidence).toBe("high");
    expect(analyses[0]?.recommendedActions).toContain("Scale");
  });

  it("builds analytics from incidents", () => {
    const analytics = buildIncidentAnalytics([sampleIncident], emptyCtx);
    expect(analytics.incidentsToday).toBeGreaterThanOrEqual(1);
    expect(analytics.topIncidentTypes.length).toBeGreaterThan(0);
  });

  it("requires MFA for emergency actions", () => {
    const settings = createDefaultIncidentCommandSettings();
    expect(canPerformIncidentAction({ action: "maintenance-mode", settings: { ...settings, requireMfa: false } }).allowed).toBe(false);
    expect(canPerformIncidentAction({ action: "maintenance-mode", settings }).allowed).toBe(true);
  });

  it("requires biometric for emergency actions", () => {
    const settings = createDefaultIncidentCommandSettings();
    expect(canPerformIncidentAction({ action: "emergency-lock", settings: { ...settings, requireBiometric: false } }).allowed).toBe(false);
  });

  it("validates incident command readiness", () => {
    const { ready, blockers } = validateIncidentCommandReadiness({
      dashboard: buildIncidentDashboard([sampleIncident], 0),
      integrations: { omega: true, guardianEnterpriseX: true, sentinelX: true, antivirusEngineX: true, ori: true, infrastructureEngine: true, disasterRecoveryEngine: true, enterpriseComplianceCenter: true, certificationCenter: true, executiveCommandCenter: true, rovexoTrust: true },
    });
    expect(ready).toBe(false);
    expect(blockers.some((b) => b.includes("critical"))).toBe(true);
  });

  it("enables push channels in defaults", () => {
    const settings = createDefaultIncidentCommandSettings();
    expect(settings.pushCritical).toBe(true);
    expect(settings.autoEscalateCritical).toBe(true);
  });

  it("includes acknowledge action", () => {
    expect(INCIDENT_OMEGA_ACTIONS.some((a) => a.id === "acknowledge")).toBe(true);
  });

  it("includes close incident action", () => {
    expect(INCIDENT_OMEGA_ACTIONS.some((a) => a.id === "close")).toBe(true);
  });

  it("includes emergency broadcast", () => {
    expect(INCIDENT_EMERGENCY_ACTIONS.some((a) => a.id === "emergency-broadcast")).toBe(true);
  });

  it("includes compliance report type", () => {
    expect(INCIDENT_REPORT_TYPES.some((r) => r.id === "compliance")).toBe(true);
  });

  it("filters payments incidents", () => {
    const payment = { ...sampleIncident, category: "payments" as const };
    expect(filterIncidentsByTab([payment], "payments")).toHaveLength(1);
  });

  it("classifies health degradation from live context", () => {
    const incidents = assembleLiveIncidents(
      {
        ...emptyCtx,
        health: {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          checks: {
            api: { status: "unhealthy", latencyMs: 500, message: "timeout" },
            database: { status: "healthy", latencyMs: 20 },
            storage: { status: "healthy", latencyMs: 0 },
            stripe: { status: "healthy", latencyMs: 0 },
            redis: { status: "healthy", latencyMs: 0 },
            cron: { status: "healthy", latencyMs: 0 },
            email: { status: "healthy", latencyMs: 0 },
            push: { status: "degraded", latencyMs: 0 },
          },
        },
      },
      {},
    );
    expect(incidents.some((i) => i.severity === "critical")).toBe(true);
  });
});

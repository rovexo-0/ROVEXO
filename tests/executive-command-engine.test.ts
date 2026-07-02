import { describe, expect, it } from "vitest";
import {
  healthCheckToScore,
  healthStatusToScore,
  liveNumberMetric,
  unavailableMetric,
} from "@/lib/executive-command-engine/live";
import { EXECUTIVE_ACTIONS, EXECUTIVE_CERTIFICATION_LABELS, EXECUTIVE_COMMAND_ROUTE, EXECUTIVE_EXPORT_TYPES } from "@/lib/executive-command-engine/registry";
import {
  buildExecutiveCommandSnapshot,
  buildExecutiveOriRecommendations,
  validateExecutiveCommandReadiness,
} from "@/lib/executive-command-engine/timeline";
import type { ExecutiveLiveContext } from "@/lib/executive-command-engine/live";

const emptyContext: ExecutiveLiveContext = {
  dashboard: null,
  dashboardError: "Unavailable",
  health: null,
  healthError: "Unavailable",
  operations: null,
  operationsError: "Unavailable",
  incidents: null,
  incidentsError: "Unavailable",
  omegaAlerts: null,
  omegaAlertsError: "Unavailable",
  transactions24h: null,
  transactions24hError: "Unavailable",
  refundCount24h: null,
  refundCount24hError: "Unavailable",
  protectionFee24h: null,
  protectionFee24hError: "Unavailable",
  deviceTrustScore: null,
  deviceTrustError: "Unavailable",
};

describe("executive command center engine v1.0", () => {
  it("registers executive command route", () => {
    expect(EXECUTIVE_COMMAND_ROUTE.href).toBe("/super-admin/mobile/omega/executive-command");
  });

  it("registers executive actions and exports", () => {
    expect(EXECUTIVE_ACTIONS.length).toBeGreaterThanOrEqual(9);
    expect(EXECUTIVE_EXPORT_TYPES.length).toBe(5);
    expect(EXECUTIVE_CERTIFICATION_LABELS.length).toBe(13);
  });

  it("marks unavailable metrics as No live data", () => {
    const metric = unavailableMetric("CPU");
    expect(metric.available).toBe(false);
    expect(metric.display).toBe("No live data");
  });

  it("formats live number metrics", () => {
    const metric = liveNumberMetric("Orders", 42);
    expect(metric.available).toBe(true);
    expect(metric.display).toBe("42");
  });

  it("maps health checks to scores", () => {
    expect(healthCheckToScore({ status: "healthy", latencyMs: 10 })).toBe(100);
    expect(healthCheckToScore({ status: "degraded", latencyMs: 10 })).toBe(72);
    expect(healthCheckToScore({ status: "unhealthy", latencyMs: 10 })).toBe(38);
  });

  it("maps platform health status to scores", () => {
    expect(healthStatusToScore("healthy")).toBe(100);
    expect(healthStatusToScore("degraded")).toBe(74);
  });

  it("builds snapshot with unavailable business data when context empty", () => {
    const snapshot = buildExecutiveCommandSnapshot(emptyContext, null, null);
    expect(snapshot.business.dailyRevenue.display).toBe("No live data");
    expect(snapshot.infrastructure.cpu.display).toBe("No live data");
    expect(snapshot.security.blockedAttacks.display).toBe("No live data");
  });

  it("lists unavailable data sources explicitly", () => {
    const snapshot = buildExecutiveCommandSnapshot(emptyContext, null, null);
    expect(snapshot.dataSourcesUnavailable).toContain("CPU");
    expect(snapshot.dataSourcesUnavailable).toContain("Blocked Attacks");
  });

  it("builds ORI recommendations from limited data", () => {
    const recs = buildExecutiveOriRecommendations(emptyContext, []);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]?.recommendedActions.length).toBeGreaterThan(0);
  });

  it("prioritizes critical incidents in ORI recommendations", () => {
    const recs = buildExecutiveOriRecommendations(emptyContext, [
      {
        id: "i1",
        severity: "critical",
        status: "open",
        time: new Date().toISOString(),
        module: "API",
        title: "API outage",
        recommendedAction: "Scale workers",
        source: "operations",
      },
    ]);
    expect(recs[0]?.priority).toBe(1);
    expect(recs[0]?.title).toContain("critical");
  });

  it("validates readiness when health unavailable", () => {
    const snapshot = buildExecutiveCommandSnapshot(emptyContext, null, null);
    const { ready, blockers } = validateExecutiveCommandReadiness(snapshot);
    expect(ready).toBe(false);
    expect(blockers.some((b) => b.includes("unavailable"))).toBe(true);
  });

  it("includes certification labels", () => {
    expect(EXECUTIVE_CERTIFICATION_LABELS).toContain("OMEGA GOLD");
    expect(EXECUTIVE_CERTIFICATION_LABELS).toContain("GDPR");
  });

  it("includes executive report action", () => {
    expect(EXECUTIVE_ACTIONS.some((a) => a.id === "executive-report")).toBe(true);
  });

  it("includes emergency mode action", () => {
    expect(EXECUTIVE_ACTIONS.some((a) => a.id === "emergency")).toBe(true);
  });

  it("includes compliance center link", () => {
    expect(EXECUTIVE_ACTIONS.some((a) => "href" in a && a.href?.includes("/audit/compliance"))).toBe(true);
  });

  it("builds incident summary counts", () => {
    const snapshot = buildExecutiveCommandSnapshot(emptyContext, null, null);
    expect(snapshot.incidentSummary.openIncidents.available).toBe(true);
  });

  it("uses live latency when health available", () => {
    const snapshot = buildExecutiveCommandSnapshot(
      {
        ...emptyContext,
        health: {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          checks: {
            api: { status: "healthy", latencyMs: 120 },
            database: { status: "healthy", latencyMs: 24 },
            storage: { status: "healthy", latencyMs: 0 },
            stripe: { status: "healthy", latencyMs: 0 },
            redis: { status: "healthy", latencyMs: 0 },
            cron: { status: "healthy", latencyMs: 0 },
            email: { status: "healthy", latencyMs: 0 },
            push: { status: "degraded", latencyMs: 0 },
          },
        },
      },
      null,
      null,
    );
    expect(snapshot.performance.apiResponseTime.display).toBe("120ms");
    expect(snapshot.platformHealth.overall.display).toBe("100%");
  });

  it("keeps CPU as no live data even with health context", () => {
    const snapshot = buildExecutiveCommandSnapshot(
      {
        ...emptyContext,
        health: {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          checks: {
            api: { status: "healthy", latencyMs: 120 },
            database: { status: "healthy", latencyMs: 24 },
            storage: { status: "healthy", latencyMs: 0 },
            stripe: { status: "healthy", latencyMs: 0 },
            redis: { status: "healthy", latencyMs: 0 },
            cron: { status: "healthy", latencyMs: 0 },
            email: { status: "healthy", latencyMs: 0 },
            push: { status: "degraded", latencyMs: 0 },
          },
        },
      },
      null,
      null,
    );
    expect(snapshot.infrastructure.cpu.display).toBe("No live data");
  });

  it("exports executive pdf type", () => {
    expect(EXECUTIVE_EXPORT_TYPES.some((e) => e.label === "Executive PDF")).toBe(true);
  });

  it("provides platform health domain metrics", () => {
    const snapshot = buildExecutiveCommandSnapshot(emptyContext, null, null);
    expect(snapshot.platformHealth.marketplace.label).toBe("Marketplace Health");
    expect(snapshot.platformHealth.communication.label).toBe("Communication Health");
  });
});

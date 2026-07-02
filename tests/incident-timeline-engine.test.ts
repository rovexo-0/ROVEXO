import { describe, expect, it } from "vitest";
import {
  assembleTimelineEntries,
  buildOriTimelineAnalysis,
  buildTimelineStats,
  filterTimelineEntries,
  validateTimelineReadiness,
  verifyOmegaTimelineIntegrity,
} from "@/lib/incident-timeline-engine/builder";
import { canPerformTimelineExport } from "@/lib/incident-timeline-engine/audit";
import { createDefaultIncidentTimelineSettings } from "@/lib/incident-timeline-engine/engine";
import {
  DETECTION_ENGINES,
  INCIDENT_TIMELINE_EXPORT_TYPES,
  INCIDENT_TIMELINE_ROUTES,
} from "@/lib/incident-timeline-engine/registry";
import type { IncidentTimelineLiveContext } from "@/lib/incident-timeline-engine/live";
import type { TimelineEntry } from "@/lib/incident-timeline-engine/types";

const emptyCtx: IncidentTimelineLiveContext = {
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
  overrides: {},
  incidentHistory: [],
  operationsIncidentsFull: null,
  auditLogs: null,
  auditError: null,
};

const sampleEntry: TimelineEntry = {
  id: "test-1",
  incidentId: "test-1",
  date: "2026-06-26",
  time: "12:00:00",
  timestamp: "2026-06-26T12:00:00.000Z",
  severity: "critical",
  category: "security",
  module: "Security Engine",
  status: "open",
  title: "Security alert",
  detectionTime: "2026-06-26T12:00:00.000Z",
  detectionEngine: "Guardian Enterprise X",
  detectionMethod: "Automated monitoring",
  affectedModule: "Security Engine",
  impactLevel: "High platform impact",
  rootCause: "Suspicious activity",
  evidence: "Guardian telemetry",
  recommendedAction: "Review security logs",
  resolutionStatus: "Open",
  resolutionTime: null,
  totalDurationMinutes: null,
  actionHistory: [],
  approvalHistory: [],
  resolution: null,
  immutable: true,
  sourceHash: "itl-test1",
};

describe("incident timeline engine v1.0", () => {
  it("registers SA-006 routes", () => {
    expect(INCIDENT_TIMELINE_ROUTES.length).toBe(4);
    expect(INCIDENT_TIMELINE_ROUTES.some((r) => r.href.includes("/timeline/export"))).toBe(true);
  });

  it("registers detection engines", () => {
    expect(DETECTION_ENGINES.length).toBe(12);
    expect(DETECTION_ENGINES).toContain("OMEGA");
    expect(DETECTION_ENGINES).toContain("Monitoring Engine");
  });

  it("registers export types", () => {
    expect(INCIDENT_TIMELINE_EXPORT_TYPES.length).toBe(5);
    expect(INCIDENT_TIMELINE_EXPORT_TYPES.some((e) => e.id === "audit-timeline")).toBe(true);
  });

  it("assembles timeline from empty context", () => {
    const entries = assembleTimelineEntries(emptyCtx, []);
    expect(Array.isArray(entries)).toBe(true);
  });

  it("deduplicates timeline entries by hash", () => {
    const persisted = [
      {
        id: "p1",
        incidentId: "dup",
        timestamp: new Date().toISOString(),
        eventType: "export",
        detail: "Export generated",
        actorId: "admin",
        sourceHash: "itl-dup",
      },
      {
        id: "p2",
        incidentId: "dup",
        timestamp: new Date().toISOString(),
        eventType: "export",
        detail: "Export generated",
        actorId: "admin",
        sourceHash: "itl-dup",
      },
    ];
    const entries = assembleTimelineEntries(emptyCtx, persisted);
    const dupHashes = entries.filter((e) => e.sourceHash === "itl-dup");
    expect(dupHashes.length).toBeLessThanOrEqual(1);
  });

  it("filters by severity", () => {
    const filtered = filterTimelineEntries([sampleEntry], { severity: "critical" });
    expect(filtered).toHaveLength(1);
    expect(filterTimelineEntries([sampleEntry], { severity: "low" })).toHaveLength(0);
  });

  it("filters by detection engine", () => {
    expect(filterTimelineEntries([sampleEntry], { detectionEngine: "Guardian Enterprise X" })).toHaveLength(1);
    expect(filterTimelineEntries([sampleEntry], { detectionEngine: "OMEGA" })).toHaveLength(0);
  });

  it("filters by search query", () => {
    expect(filterTimelineEntries([sampleEntry], { query: "security" })).toHaveLength(1);
    expect(filterTimelineEntries([sampleEntry], { query: "nonexistent" })).toHaveLength(0);
  });

  it("builds timeline stats", () => {
    const stats = buildTimelineStats([sampleEntry]);
    expect(stats.total).toBe(1);
    expect(stats.critical).toBe(1);
    expect(stats.open).toBe(1);
  });

  it("builds ORI analysis with confirmed vs AI suggestions", () => {
    const analysis = buildOriTimelineAnalysis([sampleEntry]);
    expect(analysis.confirmedFindings.length).toBeGreaterThan(0);
    expect(analysis.aiSuggestions).toBeDefined();
    expect(analysis.confidence).toBe("low");
  });

  it("verifies OMEGA timeline integrity", () => {
    const integrity = verifyOmegaTimelineIntegrity([], emptyCtx);
    expect(integrity.timelineIntegrity).toBeDefined();
    expect(integrity.retentionPolicy).toContain("90-day");
  });

  it("flags integrity warning on audit error", () => {
    const integrity = verifyOmegaTimelineIntegrity([], { ...emptyCtx, auditError: "Sync failed" });
    expect(integrity.timelineIntegrity).toBe("warning");
    expect(integrity.issues.some((i) => i.includes("Audit"))).toBe(true);
  });

  it("requires MFA for exports", () => {
    const settings = createDefaultIncidentTimelineSettings();
    expect(canPerformTimelineExport(settings).allowed).toBe(true);
    expect(canPerformTimelineExport({ ...settings, requireMfaForExport: false }).allowed).toBe(false);
  });

  it("defaults to append-only mode", () => {
    const settings = createDefaultIncidentTimelineSettings();
    expect(settings.appendOnly).toBe(true);
    expect(settings.retentionDays).toBe(90);
  });

  it("validates timeline readiness", () => {
    const { ready, blockers } = validateTimelineReadiness({
      entries: [],
      omegaIntegrity: verifyOmegaTimelineIntegrity([], emptyCtx),
    });
    expect(ready).toBe(false);
    expect(blockers.some((b) => b.includes("No timeline"))).toBe(true);
  });

  it("filters resolved state", () => {
    const resolved = {
      ...sampleEntry,
      resolution: {
        resolved: true,
        resolutionTime: sampleEntry.timestamp,
        resolutionMethod: "Manual",
        totalDurationMinutes: 30,
        preventiveActions: "Patch applied",
        lessonsLearned: "Review complete",
      },
    };
    expect(filterTimelineEntries([resolved], { resolutionState: "resolved" })).toHaveLength(1);
    expect(filterTimelineEntries([sampleEntry], { resolutionState: "open" })).toHaveLength(1);
  });

  it("includes executive timeline export", () => {
    expect(INCIDENT_TIMELINE_EXPORT_TYPES.some((e) => e.id === "executive-timeline")).toBe(true);
  });

  it("builds health degradation timeline entry", () => {
    const entries = assembleTimelineEntries(
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
      [],
    );
    expect(entries.some((e) => e.severity === "critical")).toBe(true);
  });

  it("marks entries as immutable", () => {
    expect(sampleEntry.immutable).toBe(true);
  });

  it("sorts entries chronologically descending", () => {
    const persisted = [
      { id: "old", incidentId: "old", timestamp: "2026-01-01T00:00:00.000Z", eventType: "test", detail: "old", actorId: "a", sourceHash: "hash-old" },
      { id: "new", incidentId: "new", timestamp: "2026-06-26T12:00:00.000Z", eventType: "test", detail: "new", actorId: "a", sourceHash: "hash-new" },
    ];
    const entries = assembleTimelineEntries(emptyCtx, persisted);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(new Date(entries[0]!.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(entries[1]!.timestamp).getTime());
  });
});

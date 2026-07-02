import { describe, expect, it } from "vitest";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { canPerformObservabilityAction, requiresMfaForObservability } from "@/lib/enterprise-observability-center/audit";
import { isObservabilityConfigAction } from "@/lib/enterprise-observability-center/config-actions";
import { OBSERVABILITY_MODULE_DESCRIPTOR } from "@/lib/enterprise-observability-center/descriptor";
import {
  acknowledgeAlert,
  captureTelemetrySnapshot,
  computeAvailability,
  computeObservabilityEnterpriseScore,
  createDefaultObservabilitySettings,
  createDefaultObservabilityState,
  isProtectedMonitoringTarget,
  runDiagnosticsScan,
  runPlatformMonitoring,
  scanAlerts,
  syncOmegaFeed,
} from "@/lib/enterprise-observability-center/engine";
import { exportObservabilitySnapshot, isValidObservabilityExportFormat } from "@/lib/enterprise-observability-center/export";
import { computeObservabilityHealth } from "@/lib/enterprise-observability-center/health";
import { validateObservabilityReadiness } from "@/lib/enterprise-observability-center/reader";
import {
  ALERT_TYPES,
  CAPACITY_FORECASTS,
  DIAGNOSTIC_DOMAINS,
  HEALTH_DASHBOARD_METRICS,
  MONITORING_SUBSYSTEMS,
  OBSERVABILITY_API,
  OBSERVABILITY_ROUTES,
  OMEGA_FEED_TYPES,
  PROTECTED_AREAS,
  TELEMETRY_METRICS,
  TIMELINE_EVENT_TYPES,
} from "@/lib/enterprise-observability-center/registry";
import type { ObservabilitySnapshot } from "@/lib/enterprise-observability-center/types";

function sampleSnapshot(): ObservabilitySnapshot {
  const state = createDefaultObservabilityState();
  const settings = createDefaultObservabilitySettings();
  return {
    tab: "dashboard",
    ...state,
    settings,
    history: [],
    auditLog: [],
    featureFlagsConfig: {
      enterprise_observability_center_v1: true,
      live_monitoring_enabled: true,
      telemetry_capture_enabled: true,
      alert_engine_enabled: true,
      topology_map_enabled: true,
      diagnostics_engine_enabled: true,
      capacity_planning_enabled: true,
      omega_integration_enabled: true,
      read_only_monitoring: true,
    },
    pendingPublish: false,
    health: { status: "healthy", score: state.dashboard.enterpriseScore, message: "ok" },
  };
}

describe("enterprise observability descriptor", () => {
  it("registers module id", () => {
    expect(OBSERVABILITY_MODULE_DESCRIPTOR.id).toBe("enterprise-observability-center");
  });

  it("auto registers", () => {
    expect(OBSERVABILITY_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("exposes base href", () => {
    expect(OBSERVABILITY_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/observability");
  });

  it("has master feature flag", () => {
    expect(OBSERVABILITY_MODULE_DESCRIPTOR.featureFlags[0]?.id).toBe("enterprise_observability_center_v1");
  });

  it("registers in enterprise architecture", () => {
    expect(getEnterpriseModuleDescriptor("enterprise-observability-center")?.id).toBe("enterprise-observability-center");
  });

  it("discovered by module registry v2", () => {
    expect(getDiscoveredModuleV2("enterprise-observability-center")?.moduleId).toBe("enterprise-observability-center");
  });
});

describe("enterprise observability registry constants", () => {
  it("defines monitoring subsystems", () => {
    expect(MONITORING_SUBSYSTEMS.length).toBeGreaterThan(25);
    expect(MONITORING_SUBSYSTEMS).toContain("checkout");
    expect(MONITORING_SUBSYSTEMS).toContain("database");
  });

  it("defines health dashboard metrics", () => {
    expect(HEALTH_DASHBOARD_METRICS).toContain("platform-health");
    expect(HEALTH_DASHBOARD_METRICS).toContain("qa-health");
  });

  it("defines telemetry metrics", () => {
    expect(TELEMETRY_METRICS).toContain("api-latency");
    expect(TELEMETRY_METRICS).toContain("cache-hit-ratio");
  });

  it("defines alert types", () => {
    expect(ALERT_TYPES).toContain("high-latency");
    expect(ALERT_TYPES).toContain("payment-failures");
  });

  it("defines routes and api", () => {
    expect(OBSERVABILITY_ROUTES.length).toBe(10);
    expect(OBSERVABILITY_API.snapshot).toBe("/api/super-admin/observability");
    expect(OBSERVABILITY_API.monitor).toBe("/api/super-admin/observability/monitor");
  });

  it("defines protected areas", () => {
    expect(PROTECTED_AREAS).toContain("payments");
    expect(PROTECTED_AREAS).toContain("business-rules");
  });
});

describe("enterprise observability engine", () => {
  it("creates default state with monitoring data", () => {
    const state = createDefaultObservabilityState();
    expect(state.subsystems.length).toBe(MONITORING_SUBSYSTEMS.length);
    expect(state.telemetry.length).toBe(TELEMETRY_METRICS.length);
    expect(state.healthMetrics.length).toBe(HEALTH_DASHBOARD_METRICS.length);
    expect(state.omegaFeed.length).toBe(OMEGA_FEED_TYPES.length);
  });

  it("computes enterprise score", () => {
    const state = createDefaultObservabilityState();
    const score = computeObservabilityEnterpriseScore(state);
    expect(score).toBeGreaterThan(90);
  });

  it("runs platform monitoring", () => {
    const subsystems = runPlatformMonitoring();
    expect(subsystems.length).toBe(MONITORING_SUBSYSTEMS.length);
    expect(subsystems[0]?.lastCheckedAt).toBeTruthy();
  });

  it("captures telemetry snapshot", () => {
    const telemetry = captureTelemetrySnapshot();
    expect(telemetry.length).toBe(TELEMETRY_METRICS.length);
    expect(telemetry[0]?.capturedAt).toBeTruthy();
  });

  it("runs diagnostics scan", () => {
    const diagnostics = runDiagnosticsScan();
    expect(diagnostics.length).toBe(DIAGNOSTIC_DOMAINS.length);
    expect(diagnostics[0]?.summary).toContain("read-only");
  });

  it("scans alerts", () => {
    const alerts = scanAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]?.acknowledged).toBe(false);
  });

  it("syncs omega feed", () => {
    const feed = syncOmegaFeed();
    expect(feed.length).toBe(OMEGA_FEED_TYPES.length);
    expect(feed[0]?.status).toBe("healthy");
  });

  it("acknowledges alerts", () => {
    const alerts = scanAlerts();
    const acked = acknowledgeAlert(alerts[0]!);
    expect(acked.acknowledged).toBe(true);
  });

  it("detects protected monitoring targets", () => {
    expect(isProtectedMonitoringTarget("payments")).toBe(true);
    expect(isProtectedMonitoringTarget("homepage")).toBe(false);
  });

  it("computes availability", () => {
    const subsystems = runPlatformMonitoring();
    expect(computeAvailability(subsystems)).toBeGreaterThan(99);
  });
});

describe("enterprise observability export and health", () => {
  it("exports snapshot formats", () => {
    const snapshot = sampleSnapshot();
    expect(isValidObservabilityExportFormat("json")).toBe(true);
    expect(exportObservabilitySnapshot(snapshot, "json")).toContain("exportedAt");
    expect(exportObservabilitySnapshot(snapshot, "csv")).toContain("latencyMs");
    expect(exportObservabilitySnapshot(snapshot, "pdf")).toContain("Platform Health");
  });

  it("computes health checks", () => {
    const snapshot = sampleSnapshot();
    const health = computeObservabilityHealth(snapshot);
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("validates readiness", () => {
    const snapshot = sampleSnapshot();
    const readiness = validateObservabilityReadiness(snapshot);
    expect(readiness.ready).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(75);
  });
});

describe("enterprise observability audit and permissions", () => {
  it("maps config actions", () => {
    expect(isObservabilityConfigAction("publish-config")).toBe(true);
    expect(isObservabilityConfigAction("monitor")).toBe(false);
  });

  it("requires mfa for publish-config", () => {
    expect(requiresMfaForObservability("publish-config")).toBe(true);
    expect(requiresMfaForObservability("monitor")).toBe(false);
  });

  it("allows monitor for super-admin role mapping", () => {
    const result = canPerformObservabilityAction({ action: "monitor" });
    expect(result.allowed).toBe(true);
  });
});

describe("enterprise observability timeline and capacity", () => {
  it("tracks timeline event types", () => {
    expect(TIMELINE_EVENT_TYPES).toContain("outage");
    expect(TIMELINE_EVENT_TYPES).toContain("certification-change");
  });

  it("tracks capacity forecasts", () => {
    expect(CAPACITY_FORECASTS).toContain("traffic-growth");
    expect(CAPACITY_FORECASTS).toContain("infrastructure-scaling");
  });
});

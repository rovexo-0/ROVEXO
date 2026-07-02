import { describe, expect, it } from "vitest";
import { createOperationsEngineAuditEntry } from "@/lib/operations-center-engine/audit";
import { createDefaultOperationsEngineDocument } from "@/lib/operations-center-engine/defaults";
import {
  OPERATIONS_CENTER_ENGINE_DRAFT_KEY,
  OPERATIONS_CENTER_ENGINE_LIVE_KEY,
  OPERATIONS_CENTER_INCIDENTS_KEY,
  OPERATIONS_CENTER_MAINTENANCE_KEY,
} from "@/lib/operations-center-engine/keys";
import {
  OPERATIONS_LOG_CATEGORIES,
  OPERATIONS_PLATFORM_SERVICES,
  OPERATIONS_RECOVERY_ACTIONS,
} from "@/lib/operations-center-engine/registry";
import {
  buildDashboardWidgets,
  buildLiveCounters,
  buildOperationsAlerts,
  buildOperationsDashboard,
  buildPlatformServices,
  buildSystemMetrics,
  canPerformOperationsAction,
  countEnabledFlags,
  getRecoveryActions,
  searchOperationsData,
} from "@/lib/operations-center-engine/timeline";

const healthyHealth = {
  status: "healthy" as const,
  timestamp: new Date().toISOString(),
  version: "1.0",
  checks: {
    api: { status: "healthy" as const, latencyMs: 42 },
    database: { status: "healthy" as const, latencyMs: 18 },
    storage: { status: "healthy" as const, latencyMs: 12 },
    stripe: { status: "healthy" as const, latencyMs: 55 },
    redis: { status: "healthy" as const, latencyMs: 8 },
    cron: { status: "healthy" as const, latencyMs: 20 },
    email: { status: "healthy" as const, latencyMs: 30 },
    push: { status: "degraded" as const, latencyMs: 0, message: "Web push optional" },
  },
};

const unhealthyHealth = {
  ...healthyHealth,
  status: "unhealthy" as const,
  checks: {
    ...healthyHealth.checks,
    database: { status: "unhealthy" as const, latencyMs: 900, message: "Connection failed" },
    stripe: { status: "degraded" as const, latencyMs: 600 },
    api: { status: "healthy" as const, latencyMs: 650 },
  },
};

const baseOperations = {
  health: healthyHealth,
  platform: {
    totalUsers: 1000,
    activeUsers7d: 400,
    totalOrders: 120,
    awaitingPayment: 2,
    awaitingShipment: 1,
    completedOrders: 100,
    activeSubscriptions: 10,
    pendingWithdrawals: 0,
    pendingModeration: 0,
    pendingVerifications: 0,
    openProtectionCases: 0,
    failedEmails: 0,
    pendingEmails: 0,
  },
  cron: { lastRunAt: "2026-06-26T10:00:00.000Z", lastStatus: "success", recentRuns: [{ id: "1", jobName: "sync", status: "success", startedAt: "2026-06-26T10:00:00.000Z", errorMessage: null }] },
  errors: [],
  environment: { supabase: true, stripe: true, resend: true, redis: true, cron: true, appUrl: true },
};

const baseDashboard = {
  metrics: {
    onlineUsers: 25,
    liveVisitors: 40,
    newUsersToday: 5,
    revenueToday: 320,
    revenueThisMonth: 12000,
    walletBalance: 800,
    conversionRate: 2.5,
    activeSellers: 8,
    totalListings: 500,
    listingsToday: 12,
  },
  orders: { totalOrders: 120 },
} as never;

describe("operations center engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultOperationsEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.monitoring.platformHealth).toBe(true);
    expect(doc.monitoring.automatedActions).toBe(true);
    expect(doc.security.auditProtected).toBe(true);
    expect(doc.integrations.missionControl).toBe(true);
  });

  it("registers all platform services for health monitor", () => {
    const ids = OPERATIONS_PLATFORM_SERVICES.map((service) => service.id);
    expect(ids).toContain("platform-health");
    expect(ids).toContain("payments");
    expect(ids).toContain("asset-manager");
    expect(ids).toContain("visual-cms");
    expect(ids.length).toBe(20);
  });

  it("builds platform services from health monitor", () => {
    const services = buildPlatformServices({
      health: healthyHealth,
      operations: baseOperations,
      env: baseOperations.environment,
    });
    expect(services.length).toBe(20);
    expect(services.every((service) => service.status)).toBe(true);
    expect(services.find((service) => service.id === "database")?.status).toBe("healthy");
  });

  it("builds system metrics from health monitor", () => {
    const metrics = buildSystemMetrics({ health: healthyHealth, operations: baseOperations, errorCount: 2 });
    expect(metrics.some((metric) => metric.id === "cpu")).toBe(true);
    expect(metrics.some((metric) => metric.id === "redis")).toBe(true);
    expect(metrics.some((metric) => metric.id === "ssl")).toBe(true);
  });

  it("builds live counters for dashboard", () => {
    const counters = buildLiveCounters({ dashboard: baseDashboard, operations: baseOperations, health: healthyHealth });
    expect(counters.some((counter) => counter.id === "online-users")).toBe(true);
    expect(counters.find((counter) => counter.id === "sellers")?.value).toBe(8);
  });

  it("builds alert engine output for degraded health", () => {
    const alerts = buildOperationsAlerts({
      operations: { ...baseOperations, cron: { ...baseOperations.cron, lastStatus: "failed" } },
      health: unhealthyHealth,
    });
    expect(alerts.some((alert) => alert.category === "database")).toBe(true);
    expect(alerts.some((alert) => alert.category === "cron")).toBe(true);
    expect(alerts.some((alert) => alert.category === "api")).toBe(true);
  });

  it("builds live dashboard widgets", () => {
    const widgets = buildDashboardWidgets({ dashboard: baseDashboard, operations: baseOperations, health: healthyHealth });
    expect(widgets.some((widget) => widget.id === "platform-health")).toBe(true);
    expect(widgets.some((widget) => widget.id === "revenue-today")).toBe(true);
    expect(widgets.some((widget) => widget.id === "errors")).toBe(true);
  });

  it("builds operations dashboard with incident manager metrics", () => {
    const doc = createDefaultOperationsEngineDocument();
    const services = buildPlatformServices({
      health: healthyHealth,
      operations: baseOperations,
      env: baseOperations.environment,
    });
    const dashboard = buildOperationsDashboard({
      config: doc,
      services,
      alerts: [],
      incidents: [
        {
          id: "inc-1",
          title: "Payment latency",
          priority: "high",
          status: "open",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeline: [],
        },
      ],
      maintenance: { enabled: false, mode: "disabled", message: "", whitelistAdmin: true },
    });
    expect(dashboard.openIncidents).toBe(1);
    expect(dashboard.operationsScore).toBeGreaterThan(70);
  });

  it("reflects maintenance mode in dashboard", () => {
    const doc = createDefaultOperationsEngineDocument();
    const services = buildPlatformServices({
      health: healthyHealth,
      operations: baseOperations,
      env: baseOperations.environment,
    });
    const enabled = buildOperationsDashboard({
      config: doc,
      services,
      alerts: [],
      incidents: [],
      maintenance: { enabled: true, mode: "scheduled", message: "Scheduled maintenance", whitelistAdmin: true },
    });
    const disabled = buildOperationsDashboard({
      config: doc,
      services,
      alerts: [],
      incidents: [],
      maintenance: { enabled: false, mode: "disabled", message: "", whitelistAdmin: true },
    });
    expect(enabled.maintenanceEnabled).toBe(true);
    expect(enabled.operationsScore).toBeLessThan(disabled.operationsScore);
  });

  it("searches operations data across services, alerts, incidents, and logs", () => {
    const services = buildPlatformServices({
      health: healthyHealth,
      operations: baseOperations,
      env: baseOperations.environment,
    });
    const results = searchOperationsData({
      query: "payment",
      services,
      alerts: [{ id: "a1", title: "Payment gateway degraded", category: "payments", priority: "warning", status: "open", createdAt: new Date().toISOString() }],
      incidents: [{ id: "i1", title: "Payment incident", priority: "high", status: "open", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), timeline: [] }],
      logs: { payment: [{ id: "l1", level: "error", category: "payment", message: "Payment webhook failed", createdAt: new Date().toISOString() }] },
    });
    expect(results.services.some((service) => service.id === "payments")).toBe(true);
    expect(results.alerts.length).toBe(1);
    expect(results.incidents.length).toBe(1);
    expect(results.logs.length).toBe(1);
  });

  it("enforces super admin permissions for recovery actions", () => {
    const doc = createDefaultOperationsEngineDocument();
    expect(canPerformOperationsAction(doc, "superAdminRecovery")).toBe(true);
    expect(canPerformOperationsAction(doc, "superAdminMaintenance")).toBe(true);
    expect(canPerformOperationsAction(doc, "superAdminDeleteLogs")).toBe(false);
  });

  it("filters recovery actions when automated actions are enabled", () => {
    const doc = createDefaultOperationsEngineDocument();
    const actions = getRecoveryActions(doc);
    expect(actions.length).toBe(OPERATIONS_RECOVERY_ACTIONS.filter((action) => action.enabled).length);
    expect(actions.some((action) => action.id === "clear-cache")).toBe(true);
  });

  it("creates audit log entries for operations actions", () => {
    const entry = createOperationsEngineAuditEntry({
      administrator: "admin-1",
      module: "operations-center",
      action: "recovery",
      newValue: { actionId: "clear-cache" },
    });
    expect(entry.administrator).toBe("admin-1");
    expect(entry.action).toBe("recovery");
    expect(entry.rollbackAvailable).toBe(true);
  });

  it("exposes API storage keys and log categories", () => {
    expect(OPERATIONS_CENTER_ENGINE_LIVE_KEY).toBe("operations_center_engine_live_v1");
    expect(OPERATIONS_CENTER_ENGINE_DRAFT_KEY).toBe("operations_center_engine_draft_v1");
    expect(OPERATIONS_CENTER_INCIDENTS_KEY).toBe("operations_center_incidents_v1");
    expect(OPERATIONS_CENTER_MAINTENANCE_KEY).toBe("operations_center_maintenance_v1");
    expect(OPERATIONS_LOG_CATEGORIES).toContain("audit");
    expect(countEnabledFlags(createDefaultOperationsEngineDocument().monitoring)).toBeGreaterThan(5);
  });

  it("resolves all-clear alert when platform is healthy", () => {
    const alerts = buildOperationsAlerts({ operations: baseOperations, health: healthyHealth });
    expect(alerts.some((alert) => alert.id === "all-clear")).toBe(true);
  });
});

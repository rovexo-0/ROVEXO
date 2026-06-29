import { describe, expect, it } from "vitest";
import { createDefaultMissionControlEngineDocument } from "@/lib/mission-control-engine/defaults";
import {
  MISSION_CONTROL_ENGINE_SECTION_IDS,
  MISSION_CONTROL_ENGINE_SECTIONS,
  MISSION_CONTROL_QUICK_ACTIONS,
  registerMissionControlEngineSection,
} from "@/lib/mission-control-engine/registry";
import {
  attachSectionBadges,
  buildMissionControlDashboard,
  buildMissionControlLiveWidgets,
  buildMissionControlMonitoring,
  buildMissionControlNotificationPreviews,
  buildMissionControlStatusBar,
  computeMissionControlAnalytics,
  countEnabledFlags,
  countEnabledItems,
} from "@/lib/mission-control-engine/timeline";
import type { MissionControlSnapshot } from "@/lib/super-admin/mission-control/types";

const baseSnapshot: MissionControlSnapshot = {
  scannedAt: new Date().toISOString(),
  modules: [],
  services: [
    { id: "database", label: "Database", status: "online", detail: "healthy" },
    { id: "payments", label: "Payments", status: "online" },
    { id: "search", label: "Search", status: "warning" },
    { id: "security", label: "Security", status: "online" },
    { id: "server", label: "Server", status: "online" },
    { id: "api", label: "API", status: "online" },
    { id: "queue", label: "Queue", status: "online" },
    { id: "storage", label: "Storage", status: "online" },
    { id: "backup", label: "Backup", status: "online" },
    { id: "ai", label: "AI", status: "online" },
  ],
  counters: [
    { id: "orders", label: "Orders", value: 12, delta: 4 },
    { id: "payments", label: "Payments", value: 2, delta: 2 },
    { id: "messages", label: "Messages", value: 5, delta: 5 },
    { id: "notifications", label: "Notifications", value: 15, delta: 15 },
    { id: "reports", label: "Reports", value: 1, delta: 1 },
    { id: "alerts", label: "System Alerts", value: 1, delta: 1 },
  ],
  homepageBuilder: { version: 1, updatedAt: new Date().toISOString(), components: [] },
  banners: { version: 1, updatedAt: new Date().toISOString(), banners: [] },
  features: [],
  ai: { globalEnabled: true, features: [] },
  platformHealth: "online",
};

describe("mission control engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultMissionControlEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.sections.length).toBe(MISSION_CONTROL_ENGINE_SECTION_IDS.length);
    expect(doc.quickActions.length).toBe(MISSION_CONTROL_QUICK_ACTIONS.length);
    expect(doc.security.superAdminOnly).toBe(true);
    expect(doc.integrations.enterpriseCore).toBe(true);
  });

  it("registers all enterprise command center sections", () => {
    const ids = MISSION_CONTROL_ENGINE_SECTIONS.map((section) => section.id);
    expect(ids).toContain("dashboard");
    expect(ids).toContain("homepage-builder");
    expect(ids).toContain("theme-studio");
    expect(ids).toContain("developer-center");
    expect(ids).toContain("system-settings");
    expect(ids.length).toBeGreaterThanOrEqual(30);
  });

  it("registers section updates", () => {
    const next = registerMissionControlEngineSection({
      id: "dashboard",
      label: "Dashboard Pro",
      icon: "🛰️",
      description: "Updated dashboard",
      href: "/super-admin",
      group: "operations",
    });
    expect(next.find((section) => section.id === "dashboard")?.label).toBe("Dashboard Pro");
  });

  it("builds status bar from snapshot and operations", () => {
    const statusBar = buildMissionControlStatusBar({
      snapshot: baseSnapshot,
      operations: {
        cron: { lastRunAt: "2026-06-26T10:00:00.000Z", lastStatus: "success", recentRuns: [] },
      } as never,
    });
    expect(statusBar.platformStatus).toBe("online");
    expect(statusBar.database).toBe("healthy");
  });

  it("builds live widgets from enabled config", () => {
    const doc = createDefaultMissionControlEngineDocument();
    const widgets = buildMissionControlLiveWidgets({
      snapshot: baseSnapshot,
      dashboard: {
        metrics: {
          liveVisitors: 10,
          onlineUsers: 3,
          newUsersToday: 1,
          revenueToday: 120,
          revenueThisMonth: 5000,
          walletBalance: 800,
          conversionRate: 2.5,
        },
      } as never,
      operations: {
        platform: {
          totalOrders: 100,
          awaitingPayment: 2,
          awaitingShipment: 1,
          openProtectionCases: 1,
          pendingEmails: 4,
          pendingWithdrawals: 0,
        },
        errors: [],
        cron: { lastStatus: "success" },
      } as never,
      config: doc,
    });
    expect(widgets.length).toBeGreaterThan(15);
    expect(widgets.some((widget) => widget.id === "orders")).toBe(true);
  });

  it("builds monitoring metrics", () => {
    const doc = createDefaultMissionControlEngineDocument();
    const monitoring = buildMissionControlMonitoring({
      operations: {
        health: {
          status: "healthy",
          checks: { api: { latencyMs: 42, status: "healthy" } },
        },
        errors: [],
      } as never,
      monitoringWidgets: [{ id: "api", label: "API", status: "healthy", detail: "ok" }],
      config: doc,
    });
    expect(monitoring.healthScore).toBeGreaterThan(80);
    expect(monitoring.latencyMs).toBe(42);
  });

  it("builds notification previews", () => {
    const notifications = buildMissionControlNotificationPreviews({
      operations: {
        platform: { pendingEmails: 3, openProtectionCases: 2 },
        errors: [],
        cron: { lastStatus: "success", lastRunAt: null },
      } as never,
    });
    expect(notifications.some((notice) => notice.module === "notifications")).toBe(true);
    expect(notifications.some((notice) => notice.module === "protection")).toBe(true);
  });

  it("computes dashboard and analytics", () => {
    const doc = createDefaultMissionControlEngineDocument();
    const widgets = [{ id: "orders", label: "Orders", value: 4, level: "info" as const }];
    const dashboard = buildMissionControlDashboard({ config: doc, widgets, auditEvents24h: 12 });
    expect(dashboard.commandScore).toBeGreaterThan(50);
    expect(dashboard.widgetsLive).toBe(1);

    const analytics = computeMissionControlAnalytics({
      sections: MISSION_CONTROL_ENGINE_SECTIONS,
      config: doc,
    });
    expect(analytics.visualSections).toBeGreaterThan(0);
    expect(countEnabledItems(doc.sections)).toBe(doc.sections.length);
    expect(countEnabledFlags(doc.monitoring)).toBeGreaterThan(0);
  });

  it("attaches numeric badges to sections", () => {
    const sections = attachSectionBadges(MISSION_CONTROL_ENGINE_SECTIONS, baseSnapshot.counters);
    const orders = sections.find((section) => section.id === "orders-center");
    expect(orders?.badge).toBe(4);
  });
});

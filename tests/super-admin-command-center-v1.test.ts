import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCommandCenterSections, COMMAND_CENTER_QUICK_ACTIONS } from "@/lib/super-admin/command-center-v1/build-sections";

describe("Super Admin Command Center v1.0", () => {
  it("exposes operations center snapshot SSOT", () => {
    const snapshotSource = readFileSync(
      join(process.cwd(), "lib/super-admin/command-center-v1/snapshot.ts"),
      "utf8",
    );
    expect(snapshotSource).toContain("getCommandCenterV1Snapshot");
    expect(snapshotSource).toContain("getSuperAdminDashboardData");
  });

  it("wires home page to Command Center v2 live provider", () => {
    const pageSource = readFileSync(join(process.cwd(), "app/super-admin/page.tsx"), "utf8");
    expect(pageSource).toContain("CommandCenterLiveProvider");
    expect(pageSource).toContain("CommandCenterV2Live");
    expect(pageSource).toContain("getCommandCenterV1Snapshot");
  });

  it("includes NOC health cards and critical alerts in snapshot types", () => {
    const typesSource = readFileSync(
      join(process.cwd(), "lib/super-admin/command-center-v1/types.ts"),
      "utf8",
    );
    expect(typesSource).toContain("healthCards");
    expect(typesSource).toContain("criticalAlerts");
    const snapshotSource = readFileSync(
      join(process.cwd(), "lib/super-admin/command-center-v1/snapshot.ts"),
      "utf8",
    );
    expect(snapshotSource).toContain("buildNocHealthScores");
    expect(snapshotSource).toContain("buildNocCriticalAlerts");
  });

  it("uses GoShippo as the shipping SSOT in production data", () => {
    const productionSource = readFileSync(
      join(process.cwd(), "lib/super-admin/command-center-v1/production-data.ts"),
      "utf8",
    );
    expect(productionSource).toContain("ShippoService.checkHealth");
    expect(productionSource).toContain("goShippoApiStatus");
    expect(productionSource).not.toContain("Parcel2Go");
    expect(productionSource).not.toContain("parcel2Go");
  });

  it("returns operationsCenter from command-center API", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "app/api/super-admin/command-center/route.ts"),
      "utf8",
    );
    expect(routeSource).toContain("getCommandCenterV1Snapshot");
    expect(routeSource).toContain("operationsCenter");
  });

  it("builds all enterprise metric sections", () => {
    const sections = buildCommandCenterSections({
      liveUsers: { usersOnline: 12 },
      marketplace: { liveListings: 100 },
      sales: { todaysRevenue: 50 },
      payments: { stripeStatus: "Live" },
      shipping: { goShippoApiStatus: "Healthy", royalMail: "Online" },
      users: { totalUsers: 1000 },
      security: { omegaEngine: "Live" },
      servers: { api: "Live" },
      performance: { responseTime: "45ms" },
      ai: { aiRequests: 3 },
      analytics: { liveVisitors: 20 },
      support: { openTickets: 2 },
      marketHealth: { messages: 10 },
      financial: { platformRevenue: 5000 },
      audit: { buildStatus: "Passing" },
    });

    expect(sections.map((section) => section.id)).toEqual([
      "live-users",
      "marketplace",
      "sales",
      "payments",
      "shipping",
      "users",
      "security",
      "servers",
      "performance",
      "ai",
      "analytics",
      "customer-support",
      "market-health",
      "financial",
      "audit",
    ]);
    expect(sections.every((section) => section.metrics.length > 0)).toBe(true);
  });

  it("registers quick actions for operational controls", () => {
    expect(COMMAND_CENTER_QUICK_ACTIONS.length).toBeGreaterThanOrEqual(12);
    expect(COMMAND_CENTER_QUICK_ACTIONS.some((action) => action.id === "audit-logs")).toBe(true);
  });

  it("uses production data providers without synthetic trend builders", () => {
    const snapshotSource = readFileSync(
      join(process.cwd(), "lib/super-admin/command-center-v1/snapshot.ts"),
      "utf8",
    );
    const productionSource = readFileSync(
      join(process.cwd(), "lib/super-admin/command-center-v1/production-data.ts"),
      "utf8",
    );
    expect(snapshotSource).toContain("fetchCommandCenterProductionSections");
    expect(snapshotSource).toContain("fetchCommandCenterProductionCharts");
    expect(productionSource).not.toContain("buildTrendPoints");
    const uiSource = readFileSync(
      join(process.cwd(), "features/super-admin/command-center-v1/CommandCenterV1.tsx"),
      "utf8",
    );
    expect(uiSource).toContain("HealthScoresPanel");
    expect(uiSource).toContain("CriticalAlertsBar");
  });

  it("loads command center v1 and v2 styles", () => {
    const styles = readFileSync(join(process.cwd(), "styles/rovexo/index.css"), "utf8");
    expect(styles).toContain("command-center-v1.css");
    expect(styles).toContain("command-center-v2.css");
  });

  it("extends snapshot with v2 enterprise view model", () => {
    const typesSource = readFileSync(
      join(process.cwd(), "lib/super-admin/command-center-v1/types.ts"),
      "utf8",
    );
    expect(typesSource).toContain("CommandCenterV2Extensions");
    const snapshotSource = readFileSync(
      join(process.cwd(), "lib/super-admin/command-center-v1/snapshot.ts"),
      "utf8",
    );
    expect(snapshotSource).toContain("buildCommandCenterV2Extensions");
    expect(snapshotSource).toContain("fetchCategoryPerformance");
  });
});

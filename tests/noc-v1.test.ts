import { describe, expect, it } from "vitest";
import { buildNocCriticalAlerts, buildNocHealthScores } from "@/lib/super-admin/noc-v1";

const healthyCheck = { status: "healthy" as const, latencyMs: 45 };
const unhealthyCheck = { status: "unhealthy" as const, latencyMs: 0, message: "Down" };

describe("Super Admin NOC v1.0", () => {
  it("builds nine live health score cards from production signals", () => {
    const cards = buildNocHealthScores({
      platformStatus: "healthy",
      checks: {
        api: healthyCheck,
        database: healthyCheck,
        storage: healthyCheck,
        stripe: healthyCheck,
        redis: healthyCheck,
        cron: healthyCheck,
      },
      shippoHealth: {
        configured: true,
        status: "healthy",
        latencyMs: 80,
        message: "Shippo API reachable",
      },
      stripeConfigured: true,
      shippoConfigured: true,
      pendingModeration: 2,
      totalListings: 200,
      failedPayments24h: 0,
      completedOrders: 50,
      failedShippingOrders: 0,
      labelsToday: 4,
      authErrors24h: 0,
      securityErrors24h: 0,
      aiRequests24h: 10,
      aiErrors24h: 0,
      cpuUsagePercent: 35,
      ramUsagePercent: 42,
      databaseMigrationPending: false,
    });

    expect(cards).toHaveLength(9);
    expect(cards.map((card) => card.id)).toEqual([
      "overall",
      "marketplace",
      "security",
      "payments",
      "shipping",
      "database",
      "api",
      "ai",
      "infrastructure",
    ]);
    expect(cards.every((card) => card.score >= 0 && card.score <= 100)).toBe(true);
    expect(cards.every((card) => card.status.length > 0)).toBe(true);
  });

  it("raises critical alerts for failed core services", () => {
    const generatedAt = new Date().toISOString();
    const alerts = buildNocCriticalAlerts({
      generatedAt,
      checks: {
        api: unhealthyCheck,
        database: unhealthyCheck,
        stripe: unhealthyCheck,
        redis: unhealthyCheck,
      },
      shippoHealth: {
        configured: true,
        status: "unhealthy",
        latencyMs: 0,
        message: "Authentication failed",
      },
      shippoConfigured: true,
      stripeConfigured: true,
      failedPayments24h: 12,
      authErrors24h: 30,
      criticalErrors: 3,
      cpuUsagePercent: 96,
      ramUsagePercent: 97,
      databaseMigrationPending: true,
      platformStatus: "unhealthy",
    });

    expect(alerts.some((alert) => alert.title === "API Down")).toBe(true);
    expect(alerts.some((alert) => alert.title === "Database Down")).toBe(true);
    expect(alerts.some((alert) => alert.title === "GoShippo Failure")).toBe(true);
    expect(alerts.some((alert) => alert.title === "High CPU")).toBe(true);
    expect(alerts.some((alert) => alert.title === "Memory Exhausted")).toBe(true);
  });

  it("marks degraded Shippo as a warning alert", () => {
    const alerts = buildNocCriticalAlerts({
      generatedAt: new Date().toISOString(),
      checks: {
        api: healthyCheck,
        database: healthyCheck,
        stripe: healthyCheck,
        redis: healthyCheck,
      },
      shippoHealth: {
        configured: true,
        status: "degraded",
        latencyMs: 900,
        message: "High API latency",
      },
      shippoConfigured: true,
      stripeConfigured: true,
      failedPayments24h: 0,
      authErrors24h: 0,
      criticalErrors: 0,
      cpuUsagePercent: 20,
      ramUsagePercent: 30,
      databaseMigrationPending: false,
      platformStatus: "degraded",
    });

    expect(alerts.some((alert) => alert.title === "GoShippo Service Degraded")).toBe(true);
  });
});

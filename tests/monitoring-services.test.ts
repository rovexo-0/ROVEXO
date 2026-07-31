import { describe, expect, it } from "vitest";
import type { PlatformHealthReport } from "@/lib/ops/health-types";
import {
  mapHealthToMonitoringStatus,
  resolveCorePlatformStatus,
  resolveMarketplaceStatus,
  resolveNotificationsStatus,
  resolveServerStatus,
} from "@/lib/ops/monitoring-services";
import {
  RC1_OPTIONAL_INFRA_SERVICES,
  RC1_REQUIRED_INFRA_SERVICES,
} from "@/lib/ops/rc1-infrastructure-classification-v1";

function healthyChecks(): PlatformHealthReport["checks"] {
  return {
    api: { status: "healthy", latencyMs: 1 },
    database: { status: "healthy", latencyMs: 2 },
    storage: { status: "healthy", latencyMs: 3 },
    authentication: { status: "healthy", latencyMs: 4 },
    stripe: { status: "healthy", latencyMs: 4 },
    redis: { status: "not_configured", latencyMs: 0, message: "Redis optional for RC1 — memory fallback active" },
    cron: { status: "not_configured", latencyMs: 0, message: "Scheduled jobs optional for RC1" },
    email: { status: "not_configured", latencyMs: 0, message: "Transactional email optional for RC1" },
    push: { status: "not_configured", latencyMs: 0, message: "Web push optional for RC1" },
  };
}

describe("monitoring service status", () => {
  it("maps marketplace from api and database only", () => {
    const checks = healthyChecks();
    expect(resolveMarketplaceStatus(checks)).toBe("online");

    expect(resolveMarketplaceStatus({ ...checks, database: { status: "unhealthy", latencyMs: 0 } })).toBe("offline");
    expect(resolveMarketplaceStatus({ ...checks, api: { status: "degraded", latencyMs: 0 } })).toBe("warning");
  });

  it("maps server and notifications from api health", () => {
    const checks = healthyChecks();
    expect(resolveServerStatus(checks)).toBe("online");
    expect(resolveNotificationsStatus(checks)).toBe("online");
    expect(resolveServerStatus({ ...checks, api: { status: "unhealthy", latencyMs: 0 } })).toBe("offline");
  });

  it("keeps optional integrations out of core platform status", () => {
    const checks = healthyChecks();
    expect(resolveCorePlatformStatus(checks)).toBe("healthy");
    expect(
      resolveCorePlatformStatus({
        ...checks,
        email: { status: "degraded", latencyMs: 0 },
        push: { status: "degraded", latencyMs: 0 },
        redis: { status: "unhealthy", latencyMs: 0 },
      }),
    ).toBe("healthy");
  });

  it("maps health statuses to monitoring labels", () => {
    expect(mapHealthToMonitoringStatus("healthy")).toBe("online");
    expect(mapHealthToMonitoringStatus("degraded")).toBe("warning");
    expect(mapHealthToMonitoringStatus("unhealthy")).toBe("offline");
    expect(mapHealthToMonitoringStatus("not_configured")).toBe("not_configured");
  });

  it("classifies RC1 required vs optional services", () => {
    expect(RC1_REQUIRED_INFRA_SERVICES).toEqual([
      "api",
      "database",
      "storage",
      "authentication",
      "stripe",
    ]);
    expect(RC1_OPTIONAL_INFRA_SERVICES).toContain("redis");
    expect(RC1_OPTIONAL_INFRA_SERVICES).toContain("email");
    expect(RC1_OPTIONAL_INFRA_SERVICES).toContain("cron");
    expect(RC1_OPTIONAL_INFRA_SERVICES).toContain("push");
  });
});

describe("health runtime optional integrations", () => {
  it("classifies unconfigured email and push as not_configured", async () => {
    const original = {
      resend: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
      vapidPublic: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      vapidPrivate: process.env.VAPID_PRIVATE_KEY,
      vapidSubject: process.env.VAPID_SUBJECT,
      redisUrl: process.env.UPSTASH_REDIS_REST_URL,
      redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
      cron: process.env.CRON_SECRET,
    };

    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.CRON_SECRET;

    const { getPlatformHealthReport } = await import("@/lib/ops/health-runtime");
    const report = await getPlatformHealthReport();

    expect(report.checks.email.status).toBe("not_configured");
    expect(report.checks.push.status).toBe("not_configured");
    expect(report.checks.redis.status).toBe("not_configured");
    expect(report.checks.cron.status).toBe("not_configured");
    expect(report.checks.email.message).toMatch(/optional for RC1/i);
    expect(report.checks.redis.message).toMatch(/optional for RC1/i);

    if (original.resend) process.env.RESEND_API_KEY = original.resend;
    if (original.from) process.env.EMAIL_FROM = original.from;
    if (original.vapidPublic) process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = original.vapidPublic;
    if (original.vapidPrivate) process.env.VAPID_PRIVATE_KEY = original.vapidPrivate;
    if (original.vapidSubject) process.env.VAPID_SUBJECT = original.vapidSubject;
    if (original.redisUrl) process.env.UPSTASH_REDIS_REST_URL = original.redisUrl;
    if (original.redisToken) process.env.UPSTASH_REDIS_REST_TOKEN = original.redisToken;
    if (original.cron) process.env.CRON_SECRET = original.cron;
  });
});

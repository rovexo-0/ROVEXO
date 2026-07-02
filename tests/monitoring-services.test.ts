import { describe, expect, it } from "vitest";
import type { PlatformHealthReport } from "@/lib/ops/health-types";
import {
  mapHealthToMonitoringStatus,
  resolveCorePlatformStatus,
  resolveMarketplaceStatus,
  resolveNotificationsStatus,
  resolveServerStatus,
} from "@/lib/ops/monitoring-services";

function healthyChecks(): PlatformHealthReport["checks"] {
  return {
    api: { status: "healthy", latencyMs: 1 },
    database: { status: "healthy", latencyMs: 2 },
    storage: { status: "healthy", latencyMs: 3 },
    stripe: { status: "healthy", latencyMs: 4 },
    redis: { status: "healthy", latencyMs: 0, message: "Memory fallback active — Redis optional" },
    cron: { status: "healthy", latencyMs: 0, message: "Development only — CRON_SECRET not configured" },
    email: { status: "healthy", latencyMs: 0, message: "Development only — configure RESEND_API_KEY and EMAIL_FROM for production email" },
    push: { status: "healthy", latencyMs: 0, message: "Development only — web push optional" },
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
      }),
    ).toBe("healthy");
  });

  it("maps health statuses to monitoring labels", () => {
    expect(mapHealthToMonitoringStatus("healthy")).toBe("online");
    expect(mapHealthToMonitoringStatus("degraded")).toBe("warning");
    expect(mapHealthToMonitoringStatus("unhealthy")).toBe("offline");
  });
});

describe("health runtime optional integrations", () => {
  it("classifies unconfigured email and push as healthy development-only checks", async () => {
    const original = {
      resend: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
      vapidPublic: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      vapidPrivate: process.env.VAPID_PRIVATE_KEY,
      vapidSubject: process.env.VAPID_SUBJECT,
    };

    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;

    const { getPlatformHealthReport } = await import("@/lib/ops/health-runtime");
    const report = await getPlatformHealthReport();

    expect(report.checks.email.status).toBe("healthy");
    expect(report.checks.push.status).toBe("healthy");
    expect(report.checks.email.message).toContain("Development only");
    expect(report.checks.push.message).toContain("Development only");

    if (original.resend) process.env.RESEND_API_KEY = original.resend;
    if (original.from) process.env.EMAIL_FROM = original.from;
    if (original.vapidPublic) process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = original.vapidPublic;
    if (original.vapidPrivate) process.env.VAPID_PRIVATE_KEY = original.vapidPrivate;
    if (original.vapidSubject) process.env.VAPID_SUBJECT = original.vapidSubject;
  });
});

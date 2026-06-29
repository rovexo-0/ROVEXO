import type { HealthStatus, PlatformHealthReport } from "@/lib/ops/health-types";

export type MonitoringServiceStatus = "online" | "warning" | "offline";

export function mapHealthToMonitoringStatus(status: HealthStatus): MonitoringServiceStatus {
  if (status === "healthy") return "online";
  if (status === "degraded") return "warning";
  return "offline";
}

/** Core platform health — excludes optional integrations (email, push). */
export function resolveCorePlatformStatus(checks: PlatformHealthReport["checks"]): HealthStatus {
  const core: HealthStatus[] = [checks.api.status, checks.database.status, checks.storage.status];

  if (process.env.STRIPE_SECRET_KEY?.trim()) {
    core.push(checks.stripe.status);
  }
  if (process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()) {
    core.push(checks.redis.status);
  }
  if (process.env.CRON_SECRET?.trim()) {
    core.push(checks.cron.status);
  }

  if (core.some((status) => status === "unhealthy")) return "unhealthy";
  if (core.some((status) => status === "degraded")) return "degraded";
  return "healthy";
}

export function resolveMarketplaceStatus(checks: PlatformHealthReport["checks"]): MonitoringServiceStatus {
  if (checks.database.status === "unhealthy" || checks.api.status === "unhealthy") return "offline";
  if (checks.database.status === "degraded" || checks.api.status === "degraded") return "warning";
  return "online";
}

export function resolveServerStatus(checks: PlatformHealthReport["checks"]): MonitoringServiceStatus {
  return mapHealthToMonitoringStatus(checks.api.status);
}

/** In-app notifications are independent of transactional email delivery. */
export function resolveNotificationsStatus(checks: PlatformHealthReport["checks"]): MonitoringServiceStatus {
  return mapHealthToMonitoringStatus(checks.api.status);
}

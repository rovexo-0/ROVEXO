import type { HealthStatus, PlatformHealthReport, PlatformOverallStatus } from "@/lib/ops/health-types";

export type MonitoringServiceStatus = "online" | "warning" | "offline" | "not_configured";

export function mapHealthToMonitoringStatus(status: HealthStatus): MonitoringServiceStatus {
  if (status === "healthy") return "online";
  if (status === "degraded") return "warning";
  if (status === "not_configured") return "not_configured";
  return "offline";
}

/** Core platform health — RC1 required services only (optional integrations excluded). */
export function resolveCorePlatformStatus(checks: PlatformHealthReport["checks"]): PlatformOverallStatus {
  const core: HealthStatus[] = [
    checks.api.status,
    checks.database.status,
    checks.storage.status,
    checks.authentication.status,
    checks.stripe.status,
  ];

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

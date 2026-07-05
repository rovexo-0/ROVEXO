import type { HealthCheckResult } from "@/lib/ops/health-types";
import type { ShippoHealthResult } from "@/lib/shipping/shippo/types";
import type { NocCriticalAlert } from "@/lib/super-admin/noc-v1/types";

export type BuildNocCriticalAlertsInput = {
  generatedAt: string;
  checks: {
    api: HealthCheckResult;
    database: HealthCheckResult;
    stripe: HealthCheckResult;
    redis: HealthCheckResult;
  };
  shippoHealth: ShippoHealthResult;
  shippoConfigured: boolean;
  stripeConfigured: boolean;
  failedPayments24h: number;
  authErrors24h: number;
  criticalErrors: number;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  databaseMigrationPending: boolean;
  platformStatus: string;
};

export function buildNocCriticalAlerts(input: BuildNocCriticalAlertsInput): NocCriticalAlert[] {
  const alerts: NocCriticalAlert[] = [];
  const timestamp = input.generatedAt;

  if (input.checks.api.status === "unhealthy") {
    alerts.push({
      id: "api-down",
      title: "API Down",
      message: input.checks.api.message ?? "Core API health check failed",
      severity: "critical",
      timestamp,
      href: "/super-admin/monitoring",
    });
  }

  if (input.checks.database.status === "unhealthy") {
    alerts.push({
      id: "database-down",
      title: "Database Down",
      message: input.checks.database.message ?? "Supabase database unreachable",
      severity: "critical",
      timestamp,
      href: "/super-admin/database",
    });
  }

  if (input.stripeConfigured && input.checks.stripe.status === "unhealthy") {
    alerts.push({
      id: "payment-failure",
      title: "Payment Failure",
      message: input.checks.stripe.message ?? "Stripe connectivity check failed",
      severity: "critical",
      timestamp,
      href: "/super-admin/payments-engine",
    });
  } else if (input.failedPayments24h >= 5) {
    alerts.push({
      id: "payment-failure-volume",
      title: "Payment Failure",
      message: `${input.failedPayments24h} failed payments in the last 24 hours`,
      severity: "warning",
      timestamp,
      href: "/super-admin/payments-engine",
    });
  }

  if (input.shippoConfigured && input.shippoHealth.status === "unhealthy") {
    alerts.push({
      id: "goshippo-failure",
      title: "GoShippo Failure",
      message: input.shippoHealth.message,
      severity: "critical",
      timestamp,
      href: "/super-admin/shipping-engine",
    });
  } else if (input.shippoConfigured && input.shippoHealth.status === "degraded") {
    alerts.push({
      id: "goshippo-degraded",
      title: "GoShippo Service Degraded",
      message: input.shippoHealth.message,
      severity: "warning",
      timestamp,
      href: "/super-admin/shipping-engine",
    });
  } else if (!input.shippoConfigured) {
    alerts.push({
      id: "goshippo-not-configured",
      title: "GoShippo Failure",
      message: "SHIPPO_API_KEY is not configured",
      severity: "warning",
      timestamp,
      href: "/super-admin/shipping-engine",
    });
  }

  if (input.cpuUsagePercent >= 90) {
    alerts.push({
      id: "high-cpu",
      title: "High CPU",
      message: `CPU usage at ${input.cpuUsagePercent}%`,
      severity: input.cpuUsagePercent >= 95 ? "critical" : "warning",
      timestamp,
      href: "/super-admin/monitoring",
    });
  }

  if (input.ramUsagePercent >= 95) {
    alerts.push({
      id: "memory-exhausted",
      title: "Memory Exhausted",
      message: `Memory usage at ${input.ramUsagePercent}%`,
      severity: "critical",
      timestamp,
      href: "/super-admin/monitoring",
    });
  }

  if (input.checks.redis.status === "unhealthy") {
    alerts.push({
      id: "queue-blocked",
      title: "Queue Blocked",
      message: input.checks.redis.message ?? "Redis queue unavailable",
      severity: "critical",
      timestamp,
      href: "/super-admin/monitoring",
    });
  }

  if (input.authErrors24h >= 10) {
    alerts.push({
      id: "authentication-failure",
      title: "Authentication Failure",
      message: `${input.authErrors24h} authentication errors in the last 24 hours`,
      severity: input.authErrors24h >= 25 ? "critical" : "warning",
      timestamp,
      href: "/super-admin/security-engine",
    });
  }

  if (input.criticalErrors > 0) {
    alerts.push({
      id: "security-alert",
      title: "Security Alert",
      message: `${input.criticalErrors} critical system errors logged`,
      severity: "critical",
      timestamp,
      href: "/super-admin/monitoring",
    });
  }

  if (input.databaseMigrationPending) {
    alerts.push({
      id: "deployment-failure",
      title: "Deployment Failure",
      message: "Pending database migrations detected",
      severity: "warning",
      timestamp,
      href: "/super-admin/database",
    });
  }

  if (input.platformStatus === "unhealthy" && alerts.length === 0) {
    alerts.push({
      id: "platform-unhealthy",
      title: "Platform Unhealthy",
      message: "One or more platform health checks are failing",
      severity: "critical",
      timestamp,
      href: "/super-admin/monitoring",
    });
  }

  return alerts.slice(0, 12);
}

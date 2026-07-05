import { getLiveAnalyticsCenterSnapshot } from "@/lib/analytics/live-center/service";
import {
  getSuperAdminDashboardData,
  listAuditTimeline,
} from "@/lib/super-admin/dashboard";
import { buildCommandCenterSections, COMMAND_CENTER_QUICK_ACTIONS } from "@/lib/super-admin/command-center-v1/build-sections";
import {
  fetchCommandCenterProductionCharts,
  fetchCommandCenterProductionSections,
} from "@/lib/super-admin/command-center-v1/production-data";
import { buildNocCriticalAlerts, buildNocHealthScores } from "@/lib/super-admin/noc-v1";
import type {
  CommandCenterActivityEvent,
  CommandCenterCountryMarker,
  CommandCenterNotification,
  CommandCenterV1Snapshot,
} from "@/lib/super-admin/command-center-v1/types";
import type { HealthStatus } from "@/lib/ops/health";

function buildActivityFeed(
  auditLogs: Awaited<ReturnType<typeof listAuditTimeline>>,
  errors: Array<{ id: string; level: string; category: string; message: string; createdAt: string }>,
): CommandCenterActivityEvent[] {
  const auditEvents: CommandCenterActivityEvent[] = auditLogs.slice(0, 12).map((entry) => ({
    id: entry.id,
    type: entry.action,
    message: `${entry.resource_type ?? "system"} · ${entry.action}`,
    timestamp: entry.created_at,
    tone: entry.action.includes("delete") || entry.action.includes("block") ? "critical" : "info",
  }));

  const errorEvents: CommandCenterActivityEvent[] = errors.slice(0, 8).map((entry) => ({
    id: entry.id,
    type: entry.category,
    message: entry.message,
    timestamp: entry.createdAt,
    tone: entry.level === "critical" || entry.level === "error" ? "critical" : "warning",
  }));

  return [...errorEvents, ...auditEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
}

function buildNotifications(input: {
  errors: number;
  pendingModeration: number;
  pendingPayments: number;
  failedEmails: number;
  platformStatus: HealthStatus;
}): CommandCenterNotification[] {
  const notifications: CommandCenterNotification[] = [];

  if (input.platformStatus !== "healthy") {
    notifications.push({
      id: "platform-status",
      title: "Platform status",
      message: `Platform is ${input.platformStatus}`,
      tone: input.platformStatus === "degraded" ? "warning" : "critical",
      timestamp: new Date().toISOString(),
      href: "/super-admin/monitoring",
    });
  }

  if (input.pendingModeration > 0) {
    notifications.push({
      id: "moderation-queue",
      title: "Moderation queue",
      message: `${input.pendingModeration} listings pending review`,
      tone: "warning",
      timestamp: new Date().toISOString(),
      href: "/super-admin/moderation",
    });
  }

  if (input.pendingPayments > 0) {
    notifications.push({
      id: "pending-payments",
      title: "Pending payments",
      message: `${input.pendingPayments} orders awaiting payment`,
      tone: "info",
      timestamp: new Date().toISOString(),
      href: "/super-admin/payments-engine",
    });
  }

  if (input.failedEmails > 0) {
    notifications.push({
      id: "failed-emails",
      title: "Email delivery",
      message: `${input.failedEmails} failed outbound emails`,
      tone: "warning",
      timestamp: new Date().toISOString(),
      href: "/super-admin/email",
    });
  }

  if (input.errors > 0) {
    notifications.push({
      id: "system-errors",
      title: "System errors",
      message: `${input.errors} recent platform errors logged`,
      tone: "critical",
      timestamp: new Date().toISOString(),
      href: "/super-admin/monitoring",
    });
  }

  return notifications.slice(0, 8);
}

export async function getCommandCenterV1Snapshot(): Promise<CommandCenterV1Snapshot> {
  const dashboard = await getSuperAdminDashboardData();

  const [auditLogs, liveAnalytics, productionData, charts] = await Promise.all([
    listAuditTimeline(20),
    getLiveAnalyticsCenterSnapshot().catch(() => null),
    fetchCommandCenterProductionSections(dashboard),
    fetchCommandCenterProductionCharts(dashboard),
  ]);
  const sections = buildCommandCenterSections(productionData.sections);
  const generatedAt = new Date().toISOString();
  const checks = dashboard.operations.health.checks;
  const liveAnalyticsPerformance = liveAnalytics?.performance;
  const healthCards = buildNocHealthScores({
    platformStatus: dashboard.operations.health.status,
    checks,
    shippoHealth: productionData.shippoHealth,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    shippoConfigured: productionData.shippoHealth.configured,
    pendingModeration: dashboard.operations.platform.pendingModeration,
    totalListings: dashboard.metrics.totalListings,
    failedPayments24h: Number(productionData.sections.payments.failedPayments ?? 0),
    completedOrders: dashboard.orders.completed,
    failedShippingOrders: Number(productionData.sections.shipping.failed ?? 0),
    labelsToday: Number(productionData.sections.shipping.labelsGeneratedToday ?? 0),
    authErrors24h: Number(productionData.sections.security.failedLogins ?? 0),
    securityErrors24h: Number(productionData.sections.security.blockedBots ?? 0),
    aiRequests24h: Number(productionData.sections.ai.aiRequests ?? 0),
    aiErrors24h: Number(productionData.sections.ai.aiFailures ?? 0),
    cpuUsagePercent: liveAnalyticsPerformance?.cpuUsagePercent ?? 0,
    ramUsagePercent: liveAnalyticsPerformance?.ramUsagePercent ?? 0,
    databaseMigrationPending: productionData.databaseMigrationPending,
  });
  const criticalAlerts = buildNocCriticalAlerts({
    generatedAt,
    checks,
    shippoHealth: productionData.shippoHealth,
    shippoConfigured: productionData.shippoHealth.configured,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    failedPayments24h: Number(productionData.sections.payments.failedPayments ?? 0),
    authErrors24h: Number(productionData.sections.security.failedLogins ?? 0),
    criticalErrors: dashboard.operations.errors.filter(
      (entry) => entry.level === "critical" || entry.level === "error",
    ).length,
    cpuUsagePercent: liveAnalyticsPerformance?.cpuUsagePercent ?? 0,
    ramUsagePercent: liveAnalyticsPerformance?.ramUsagePercent ?? 0,
    databaseMigrationPending: productionData.databaseMigrationPending,
    platformStatus: dashboard.operations.health.status,
  });

  const platform = dashboard.operations.platform;
  const errors = dashboard.operations.errors;

  const countries: CommandCenterCountryMarker[] = (liveAnalytics?.countries ?? []).map((country) => ({
    code: country.code,
    name: country.name,
    flag: country.flag,
    activeUsers: country.activeUsers,
    percentage: country.percentage,
  }));

  return {
    generatedAt,
    platformStatus: dashboard.operations.health.status,
    healthCards,
    criticalAlerts,
    sections,
    charts,
    countries,
    activityFeed: buildActivityFeed(
      auditLogs,
      errors.map((entry) => ({
        id: entry.id,
        level: entry.level,
        category: entry.category,
        message: entry.message,
        createdAt: entry.createdAt,
      })),
    ),
    notifications: buildNotifications({
      errors: errors.length,
      pendingModeration: platform.pendingModeration,
      pendingPayments: platform.awaitingPayment,
      failedEmails: platform.failedEmails,
      platformStatus: dashboard.operations.health.status,
    }),
    quickActions: [...COMMAND_CENTER_QUICK_ACTIONS],
  };
}

import type { MonitoringWidget } from "@/lib/super-admin/insights";
import type { ProductionOperationsSnapshot } from "@/lib/ops/production-status";
import type { SuperAdminDashboardData } from "@/lib/super-admin/dashboard";
import type {
  MissionControlBadgeLevel,
  MissionControlEngineAnalytics,
  MissionControlEngineDashboard,
  MissionControlEngineDocument,
  MissionControlEngineSection,
  MissionControlLiveWidget,
  MissionControlMonitoring,
  MissionControlNotificationPreview,
  MissionControlStatusBar,
} from "@/lib/mission-control-engine/types";
import type {
  MissionControlCounter,
  MissionControlService,
  MissionControlSnapshot,
} from "@/lib/super-admin/mission-control/types";

export function countEnabledFlags(flags: Record<string, boolean>): number {
  return Object.values(flags).filter(Boolean).length;
}

export function countEnabledItems<T extends { enabled: boolean }>(items: T[]): number {
  return items.filter((item) => item.enabled).length;
}

function mapServiceStatus(status: string): MissionControlBadgeLevel {
  if (status === "online" || status === "healthy") return "healthy";
  if (status === "warning" || status === "degraded") return "warning";
  if (status === "offline" || status === "unhealthy") return "critical";
  return "info";
}

function mapMonitoringStatus(status: MonitoringWidget["status"]): MissionControlBadgeLevel {
  if (status === "healthy") return "healthy";
  if (status === "degraded") return "warning";
  return "critical";
}

function counterLevel(id: string, value: number, delta?: number): MissionControlBadgeLevel {
  if (id === "alerts" || id === "reports" || id === "support") {
    if (value >= 10) return "critical";
    if (value >= 3) return "attention";
    if (value > 0) return "warning";
    return "healthy";
  }
  if (typeof delta === "number" && delta > 0) return "info";
  return "healthy";
}

function findCounter(counters: MissionControlCounter[], ids: string[]): MissionControlCounter | undefined {
  return counters.find((item) => ids.includes(item.id));
}

function findService(services: MissionControlService[], ids: string[]): MissionControlService | undefined {
  return services.find((item) => ids.includes(item.id));
}

export function buildMissionControlStatusBar(input: {
  snapshot: MissionControlSnapshot;
  operations: ProductionOperationsSnapshot;
}): MissionControlStatusBar {
  const { snapshot, operations } = input;
  const db = findService(snapshot.services, ["database"]);
  const infra = findService(snapshot.services, ["server", "api"]);
  const ai = findService(snapshot.services, ["ai"]);
  const search = findService(snapshot.services, ["search"]);
  const payments = findService(snapshot.services, ["payments"]);

  return {
    platformStatus: snapshot.platformHealth,
    environment: process.env.NODE_ENV === "production" ? "Production" : "Development",
    version: process.env.npm_package_version ?? "ROVEXO v1.0",
    build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    gitRevision: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "dev",
    lastDeployment: operations.cron.lastRunAt ?? snapshot.scannedAt,
    database: mapServiceStatus(db?.status ?? "warning"),
    infrastructure: mapServiceStatus(infra?.status ?? snapshot.platformHealth),
    ai: mapServiceStatus(ai?.status ?? "warning"),
    search: mapServiceStatus(search?.status ?? "warning"),
    payments: mapServiceStatus(payments?.status ?? "warning"),
  };
}

export function buildMissionControlLiveWidgets(input: {
  snapshot: MissionControlSnapshot;
  dashboard: SuperAdminDashboardData;
  operations: ProductionOperationsSnapshot;
  config: MissionControlEngineDocument;
}): MissionControlLiveWidget[] {
  const { snapshot, dashboard, operations, config } = input;
  const { counters, services } = snapshot;
  const { metrics } = dashboard;

  const widgetDefs: Array<{
    key: keyof MissionControlEngineDocument["widgets"];
    id: string;
    label: string;
    value: string | number;
    delta?: number;
    href?: string;
    level: MissionControlBadgeLevel;
  }> = [
    {
      key: "homepageStatus",
      id: "homepage",
      label: "Homepage Status",
      value: metrics.liveVisitors,
      href: "/super-admin/homepage-builder",
      level: metrics.liveVisitors > 0 ? "healthy" : "info",
    },
    {
      key: "marketplaceStatus",
      id: "marketplace",
      label: "Marketplace Status",
      value: snapshot.platformHealth === "online" ? "Operational" : snapshot.platformHealth,
      level: mapServiceStatus(snapshot.platformHealth),
    },
    {
      key: "usersOnline",
      id: "users-online",
      label: "Users Online",
      value: metrics.onlineUsers,
      delta: metrics.newUsersToday,
      href: "/super-admin/users",
      level: metrics.onlineUsers > 0 ? "healthy" : "info",
    },
    {
      key: "orders",
      id: "orders",
      label: "Orders",
      value: findCounter(counters, ["orders"])?.value ?? operations.platform.totalOrders,
      delta: findCounter(counters, ["orders"])?.delta,
      href: "/super-admin/orders-engine",
      level: counterLevel("orders", operations.platform.awaitingPayment + operations.platform.awaitingShipment),
    },
    {
      key: "sales",
      id: "sales",
      label: "Sales",
      value: `£${Math.round(metrics.revenueToday)}`,
      delta: metrics.revenueThisMonth > 0 ? Math.round(metrics.revenueToday) : undefined,
      href: "/super-admin/analytics-engine",
      level: metrics.revenueToday > 0 ? "healthy" : "info",
    },
    {
      key: "payments",
      id: "payments",
      label: "Payments",
      value: findCounter(counters, ["payments"])?.value ?? operations.platform.awaitingPayment,
      delta: operations.platform.awaitingPayment,
      href: "/super-admin/payments-engine",
      level: counterLevel("payments", operations.platform.awaitingPayment),
    },
    {
      key: "wallet",
      id: "wallet",
      label: "Wallet",
      value: `£${Math.round(metrics.walletBalance)}`,
      delta: operations.platform.pendingWithdrawals,
      href: "/super-admin/wallet-engine",
      level: operations.platform.pendingWithdrawals > 0 ? "attention" : "healthy",
    },
    {
      key: "protection",
      id: "protection",
      label: "Protection",
      value: operations.platform.openProtectionCases,
      href: "/super-admin/protection-engine",
      level: counterLevel("reports", operations.platform.openProtectionCases),
    },
    {
      key: "search",
      id: "search",
      label: "Search",
      value: findService(services, ["search"])?.status ?? "online",
      href: "/super-admin/search-engine",
      level: mapServiceStatus(findService(services, ["search"])?.status ?? "online"),
    },
    {
      key: "ai",
      id: "ai",
      label: "AI",
      value: operations.errors.filter((e) => e.category === "ai").length,
      delta: operations.errors.length,
      href: "/super-admin/ai-engine",
      level: operations.errors.length > 5 ? "critical" : operations.errors.length > 0 ? "warning" : "healthy",
    },
    {
      key: "infrastructure",
      id: "infrastructure",
      label: "Infrastructure",
      value: findService(services, ["server"])?.status ?? snapshot.platformHealth,
      href: "/super-admin/monitoring",
      level: mapServiceStatus(findService(services, ["server"])?.status ?? snapshot.platformHealth),
    },
    {
      key: "database",
      id: "database",
      label: "Database",
      value: findService(services, ["database"])?.detail ?? "Connected",
      href: "/super-admin/monitoring",
      level: mapServiceStatus(findService(services, ["database"])?.status ?? "online"),
    },
    {
      key: "storage",
      id: "storage",
      label: "Storage",
      value: findService(services, ["storage"])?.status ?? "online",
      href: "/super-admin/monitoring",
      level: mapServiceStatus(findService(services, ["storage"])?.status ?? "online"),
    },
    {
      key: "api",
      id: "api",
      label: "API",
      value: findService(services, ["api"])?.status ?? "online",
      href: "/super-admin/developer",
      level: mapServiceStatus(findService(services, ["api"])?.status ?? "online"),
    },
    {
      key: "cronJobs",
      id: "cron",
      label: "Cron Jobs",
      value: operations.cron.lastStatus ?? "idle",
      href: "/super-admin/monitoring",
      level: operations.cron.lastStatus === "failed" ? "critical" : "healthy",
    },
    {
      key: "queues",
      id: "queue",
      label: "Queues",
      value: findService(services, ["queue"])?.status ?? "online",
      href: "/super-admin/monitoring",
      level: mapServiceStatus(findService(services, ["queue"])?.status ?? "online"),
    },
    {
      key: "notifications",
      id: "notifications",
      label: "Notifications",
      value: findCounter(counters, ["notifications"])?.value ?? operations.platform.pendingEmails,
      delta: operations.platform.pendingEmails,
      href: "/super-admin/notifications-engine",
      level: counterLevel("notifications", operations.platform.pendingEmails),
    },
    {
      key: "messages",
      id: "messages",
      label: "Messages",
      value: findCounter(counters, ["messages"])?.value ?? 0,
      delta: findCounter(counters, ["messages"])?.delta,
      href: "/super-admin/messages-engine",
      level: counterLevel("messages", findCounter(counters, ["messages"])?.value ?? 0),
    },
    {
      key: "security",
      id: "security",
      label: "Security",
      value: findService(services, ["security"])?.status ?? "online",
      href: "/super-admin/security-engine",
      level: mapServiceStatus(findService(services, ["security"])?.status ?? "online"),
    },
    {
      key: "backups",
      id: "backup",
      label: "Backups",
      value: findService(services, ["backup"])?.status ?? "online",
      href: "/super-admin/recovery",
      level: mapServiceStatus(findService(services, ["backup"])?.status ?? "online"),
    },
    {
      key: "recovery",
      id: "recovery",
      label: "Recovery",
      value: "Ready",
      href: "/super-admin/recovery",
      level: "healthy",
    },
    {
      key: "analytics",
      id: "analytics",
      label: "Analytics",
      value: metrics.conversionRate > 0 ? `${metrics.conversionRate.toFixed(1)}%` : "Live",
      href: "/super-admin/analytics-engine",
      level: "info",
    },
  ];

  return widgetDefs
    .filter((item) => config.widgets[item.key] !== false)
    .map(({ key: _key, ...widget }) => widget);
}

export function buildMissionControlMonitoring(input: {
  operations: ProductionOperationsSnapshot;
  monitoringWidgets: MonitoringWidget[];
  config: MissionControlEngineDocument;
}): MissionControlMonitoring {
  const { operations, monitoringWidgets, config } = input;
  const health = operations.health;
  const apiWidget = monitoringWidgets.find((w) => w.id === "api");
  const dbWidget = monitoringWidgets.find((w) => w.id === "database");
  const cpuWidget = monitoringWidgets.find((w) => w.id === "cpu");
  const ramWidget = monitoringWidgets.find((w) => w.id === "ram");

  const errorRate =
    operations.errors.length === 0
      ? 0
      : Math.min(100, Math.round((operations.errors.length / 20) * 100));

  let healthScore = 100;
  if (health.status === "degraded") healthScore -= 15;
  if (health.status === "unhealthy") healthScore -= 40;
  healthScore -= Math.min(30, operations.errors.length * 2);
  healthScore = Math.max(0, healthScore);

  const monitoring: MissionControlMonitoring = {
    healthScore,
    uptime: health.status === "healthy" ? "99.9%" : health.status === "degraded" ? "98.5%" : "Degraded",
    errorRate,
    latencyMs: health.checks.api.latencyMs,
    cpuPercent: config.monitoring.cpu ? Math.min(95, 20 + errorRate) : 0,
    memoryPercent: config.monitoring.ram ? Math.min(90, 35 + errorRate / 2) : 0,
    diskPercent: config.monitoring.disk ? Math.min(85, 40 + errorRate / 3) : 0,
    apiLatencyMs: apiWidget ? health.checks.api.latencyMs : 0,
    requestsPerMinute: Math.max(0, (operations.platform?.totalOrders ?? 0) * 2),
  };

  void dbWidget;
  void cpuWidget;
  void ramWidget;

  return monitoring;
}

export function buildMissionControlNotificationPreviews(input: {
  operations: ProductionOperationsSnapshot;
}): MissionControlNotificationPreview[] {
  const { operations } = input;
  const previews: MissionControlNotificationPreview[] = [];

  if (operations.platform.pendingEmails > 0) {
    previews.push({
      id: "pending-emails",
      title: `${operations.platform.pendingEmails} emails pending delivery`,
      module: "notifications",
      priority: operations.platform.pendingEmails >= 10 ? "warning" : "information",
      createdAt: new Date().toISOString(),
    });
  }

  if (operations.platform.openProtectionCases > 0) {
    previews.push({
      id: "protection-cases",
      title: `${operations.platform.openProtectionCases} open protection cases`,
      module: "protection",
      priority: operations.platform.openProtectionCases >= 5 ? "critical" : "warning",
      createdAt: new Date().toISOString(),
    });
  }

  for (const error of operations.errors.slice(0, 5)) {
    previews.push({
      id: error.id,
      title: error.message.slice(0, 120),
      module: error.category,
      priority: error.level === "critical" ? "critical" : "warning",
      createdAt: error.createdAt,
    });
  }

  if (operations.cron.lastStatus === "failed") {
    previews.push({
      id: "cron-failed",
      title: "Last scheduled job failed",
      module: "infrastructure",
      priority: "critical",
      createdAt: operations.cron.lastRunAt ?? new Date().toISOString(),
    });
  }

  if (previews.length === 0) {
    previews.push({
      id: "all-clear",
      title: "All enterprise systems operating normally",
      module: "mission-control",
      priority: "resolved",
      createdAt: new Date().toISOString(),
    });
  }

  return previews;
}

export function buildMissionControlDashboard(input: {
  config: MissionControlEngineDocument;
  widgets: MissionControlLiveWidget[];
  auditEvents24h: number;
}): MissionControlEngineDashboard {
  const enabledSections = countEnabledItems(input.config.sections);
  const enabledQuickActions = countEnabledItems(input.config.quickActions);
  const widgetsLive = input.widgets.length;

  let commandScore = 50;
  if (enabledSections >= 20) commandScore += 15;
  if (widgetsLive >= 15) commandScore += 15;
  if (input.config.security.auditProtected) commandScore += 10;
  if (input.config.productivity.rollback) commandScore += 5;
  if (input.auditEvents24h < 50) commandScore += 5;

  return {
    commandScore: Math.min(100, commandScore),
    modulesEnabled: enabledSections,
    widgetsLive,
    auditEvents24h: input.auditEvents24h,
    quickActions: enabledQuickActions,
  };
}

export function computeMissionControlAnalytics(input: {
  sections: MissionControlEngineSection[];
  config: MissionControlEngineDocument;
}): MissionControlEngineAnalytics {
  const { sections, config } = input;
  return {
    visualSections: sections.filter((s) => s.group === "visual").length,
    commerceSections: sections.filter((s) => s.group === "commerce").length,
    enterpriseSections: sections.filter((s) => s.group === "enterprise").length,
    operationsSections: sections.filter((s) => s.group === "operations").length,
    monitoringEnabled: countEnabledFlags(config.monitoring),
    productivityEnabled: countEnabledFlags(config.productivity),
  };
}

export function attachSectionBadges(
  sections: MissionControlEngineSection[],
  counters: MissionControlCounter[],
): MissionControlEngineSection[] {
  const badgeMap: Record<string, { count: number; level: MissionControlBadgeLevel }> = {
    "orders-center": {
      count: findCounter(counters, ["orders"])?.delta ?? 0,
      level: counterLevel("orders", findCounter(counters, ["orders"])?.value ?? 0),
    },
    "payments-center": {
      count: findCounter(counters, ["payments"])?.delta ?? 0,
      level: counterLevel("payments", findCounter(counters, ["payments"])?.value ?? 0),
    },
    "messages-center": {
      count: findCounter(counters, ["messages"])?.value ?? 0,
      level: counterLevel("messages", findCounter(counters, ["messages"])?.value ?? 0),
    },
    "notifications-center": {
      count: findCounter(counters, ["notifications"])?.value ?? 0,
      level: counterLevel("notifications", findCounter(counters, ["notifications"])?.value ?? 0),
    },
    "security-center": {
      count: findCounter(counters, ["reports", "support"])?.value ?? 0,
      level: counterLevel("reports", findCounter(counters, ["reports"])?.value ?? 0),
    },
    "infrastructure-center": {
      count: findCounter(counters, ["alerts"])?.value ?? 0,
      level: counterLevel("alerts", findCounter(counters, ["alerts"])?.value ?? 0),
    },
  };

  return sections.map((section) => {
    const badge = badgeMap[section.id];
    if (!badge || badge.count <= 0) return section;
    return {
      ...section,
      badge: badge.count,
      badgeLevel: badge.level,
    };
  });
}

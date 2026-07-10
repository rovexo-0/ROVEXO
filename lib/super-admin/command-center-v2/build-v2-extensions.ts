import type { LiveAnalyticsSnapshot } from "@/lib/analytics/live-center/types";
import type { HealthStatus } from "@/lib/ops/health";
import type { SendcloudHealthResult } from "@/lib/shipping/sendcloud/types";
import type { SuperAdminDashboardData } from "@/lib/super-admin/dashboard";
import type {
  CommandCenterAdminIdentity,
  CommandCenterChartSeries,
  CommandCenterV2Extensions,
  CommandCenterServiceState,
} from "@/lib/super-admin/command-center-v1/types";

const SERVICE_DIAGNOSTICS_HREF: Record<string, string> = {
  omega: "/super-admin/observability/omega",
  sentinel: "/super-admin/security-engine",
  database: "/super-admin/database",
  api: "/super-admin/observability/monitoring",
  sendcloud: "/super-admin/shipping-engine",
  stripe: "/super-admin/payments-engine",
  queue: "/super-admin/observability/monitoring",
  cron: "/super-admin/monitoring",
};
import type { CommandCenterProductionSections } from "@/lib/super-admin/command-center-v1/production-data";
import type { CategoryPerformanceRow } from "@/lib/super-admin/command-center-v1/queries";

function mapHealthToServiceState(status: HealthStatus | string, configured = true): CommandCenterServiceState {
  if (!configured) return "error";
  if (status === "healthy" || status === "online" || status === "live") return "online";
  if (status === "degraded" || status === "warning") return "warning";
  return "error";
}

function serviceStatusLabel(state: CommandCenterServiceState): string {
  if (state === "online") return "ONLINE";
  if (state === "warning") return "WARNING";
  if (state === "live") return "LIVE";
  return "ERROR";
}

function sparklineDelta(points: number[]): number {
  if (points.length < 2) return 0;
  const mid = Math.floor(points.length / 2);
  const first = points.slice(0, mid).reduce((sum, value) => sum + value, 0);
  const second = points.slice(mid).reduce((sum, value) => sum + value, 0);
  if (first === 0) return second > 0 ? 100 : 0;
  return Math.round(((second - first) / first) * 1000) / 10;
}

function chartPoints(charts: CommandCenterChartSeries[], id: string): number[] {
  return charts.find((chart) => chart.id === id)?.points ?? [];
}

function num(value: number | string | undefined): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

export function buildCommandCenterV2Extensions(input: {
  dashboard: SuperAdminDashboardData;
  sections: CommandCenterProductionSections;
  charts: CommandCenterChartSeries[];
  liveAnalytics: LiveAnalyticsSnapshot | null;
  categories: CategoryPerformanceRow[];
  sendcloudHealth: SendcloudHealthResult;
  totalReviews: number;
  admin: CommandCenterAdminIdentity;
}): CommandCenterV2Extensions {
  const {
    dashboard,
    sections,
    charts,
    liveAnalytics,
    categories,
    sendcloudHealth,
    totalReviews,
    admin,
  } = input;
  const { metrics, operations, orders } = dashboard;
  const checks = operations.health.checks;
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const sendcloudConfigured = sendcloudHealth.configured;

  const usersSparkline = chartPoints(charts, "users");
  const trafficSparkline = chartPoints(charts, "traffic");
  const listingsSparkline = chartPoints(charts, "listings");
  const ordersSparkline = chartPoints(charts, "orders");
  const revenueSparkline = chartPoints(charts, "revenue");
  const messagesSparkline = chartPoints(charts, "messages");

  const omegaState = mapHealthToServiceState(operations.health.status);
  const sentinelState = mapHealthToServiceState(checks.api.status);
  const databaseState = mapHealthToServiceState(checks.database.status);
  const apiState = mapHealthToServiceState(checks.api.status);
  const sendcloudState = sendcloudConfigured
    ? mapHealthToServiceState(sendcloudHealth.status === "healthy" ? "healthy" : sendcloudHealth.status === "degraded" ? "degraded" : "unhealthy", true)
    : "error";
  const stripeState = mapHealthToServiceState(checks.stripe.status, stripeConfigured);
  const queueState = mapHealthToServiceState(checks.redis.status);
  const cronState = mapHealthToServiceState(checks.cron.status);

  const queuePending = num(sections.payments.pendingPayments) + num(sections.payments.paymentQueue);
  const publishedListings = num(sections.marketplace.liveListings);
  const activeOrders =
    orders.awaitingPayment + orders.awaitingShipment + num(sections.sales.pending);
  const liveMessages = num(sections.support.unreadMessages);
  const verifiedBusinesses = num(sections.liveUsers.verifiedBusinesses);
  const openDisputes = num(sections.payments.disputes);
  const resolvedDisputes = num(sections.support.resolvedToday);
  const refundedDisputes = num(sections.sales.refunded);
  const pendingDisputes = num(sections.support.pending);

  const devices = (liveAnalytics?.devices ?? []).map((device) => ({
    id: device.id,
    label: device.label,
    value: device.activeUsers,
    percentage: device.percentage,
  }));

  const completedOrders = num(sections.payments.completedPayments);
  const processingOrders = num(sections.sales.pending);
  const pendingOrders = num(sections.payments.pendingPayments);
  const cancelledOrders = num(sections.sales.cancelled);

  const successfulPayments = completedOrders;
  const pendingPayments = pendingOrders;
  const failedPayments = num(sections.payments.failedPayments);
  const refundPayments = num(sections.payments.refunds);
  const chargebackPayments = num(sections.payments.chargebacks);
  const paymentTotal = Math.max(
    successfulPayments + pendingPayments + failedPayments + refundPayments + chargebackPayments,
    1,
  );

  const itemsSold = num(sections.marketplace.soldListings);
  const revenueToday = metrics.revenueToday;
  const ordersToday = num(sections.sales.ordersToday);
  const avgOrderValue = ordersToday > 0 ? Math.round((revenueToday / ordersToday) * 100) / 100 : 0;

  const shippingConnected = sendcloudConfigured && sendcloudHealth.status === "healthy";

  return {
    services: [
      {
        id: "omega",
        label: "OMEGA AI",
        state: omegaState,
        statusLabel: serviceStatusLabel(omegaState),
        detail: String(sections.ai.aiSuccessRate ?? "100") + "% success",
        href: SERVICE_DIAGNOSTICS_HREF.omega,
      },
      {
        id: "sentinel",
        label: "SENTINEL",
        state: sentinelState,
        statusLabel: sentinelState === "online" ? "PROTECTED" : serviceStatusLabel(sentinelState),
        detail: `${num(sections.security.blockedBots)} blocked`,
        href: SERVICE_DIAGNOSTICS_HREF.sentinel,
      },
      {
        id: "database",
        label: "DATABASE",
        state: databaseState,
        statusLabel: databaseState === "online" ? "HEALTHY" : serviceStatusLabel(databaseState),
        detail: `${checks.database.latencyMs} ms`,
        href: SERVICE_DIAGNOSTICS_HREF.database,
      },
      {
        id: "api",
        label: "API",
        state: apiState,
        statusLabel: serviceStatusLabel(apiState),
        detail: `${checks.api.latencyMs} ms`,
        href: SERVICE_DIAGNOSTICS_HREF.api,
      },
      {
        id: "sendcloud",
        label: "SENDCLOUD",
        state: sendcloudState,
        statusLabel: sendcloudConfigured
          ? sendcloudState === "online"
            ? "CONNECTED"
            : serviceStatusLabel(sendcloudState)
          : "ERROR",
        detail: sendcloudConfigured ? `${sendcloudHealth.latencyMs} ms` : "Not configured",
        href: SERVICE_DIAGNOSTICS_HREF.sendcloud,
      },
      {
        id: "stripe",
        label: "STRIPE",
        state: stripeState,
        statusLabel: stripeConfigured
          ? stripeState === "online"
            ? "CONNECTED"
            : serviceStatusLabel(stripeState)
          : "ERROR",
        detail: stripeConfigured ? `${checks.stripe.latencyMs} ms` : "Not configured",
        href: SERVICE_DIAGNOSTICS_HREF.stripe,
      },
      {
        id: "queue",
        label: "QUEUE",
        state: queueState,
        statusLabel: serviceStatusLabel(queueState),
        detail: `${queuePending} Pending`,
        href: SERVICE_DIAGNOSTICS_HREF.queue,
      },
      {
        id: "cron",
        label: "CRON",
        state: cronState,
        statusLabel: cronState === "online" ? "RUNNING" : serviceStatusLabel(cronState),
        detail: `${num(sections.audit.cronJobs)} today`,
        href: SERVICE_DIAGNOSTICS_HREF.cron,
      },
    ],
    kpis: [
      {
        id: "users-online",
        label: "Users Online",
        value: metrics.onlineUsers,
        format: "number",
        delta: sparklineDelta(usersSparkline),
        deltaLabel: "vs 30 min ago",
        tone: "blue",
        sparkline: usersSparkline.length ? usersSparkline : trafficSparkline,
      },
      {
        id: "registered-users",
        label: "Registered Users",
        value: metrics.totalUsers,
        format: "number",
        delta: sparklineDelta(usersSparkline),
        deltaLabel: "vs 24h ago",
        tone: "purple",
        sparkline: usersSparkline,
      },
      {
        id: "active-listings",
        label: "Active Listings",
        value: publishedListings,
        format: "number",
        delta: sparklineDelta(listingsSparkline),
        deltaLabel: "vs 24h ago",
        tone: "green",
        sparkline: listingsSparkline,
      },
      {
        id: "active-orders",
        label: "Active Orders",
        value: activeOrders,
        format: "number",
        delta: sparklineDelta(ordersSparkline),
        deltaLabel: "vs 24h ago",
        tone: "orange",
        sparkline: ordersSparkline,
      },
      {
        id: "revenue-today",
        label: "Today's Revenue",
        value: revenueToday,
        format: "currency",
        delta: sparklineDelta(revenueSparkline),
        deltaLabel: "vs yesterday",
        tone: "indigo",
        sparkline: revenueSparkline,
      },
      {
        id: "live-messages",
        label: "Live Messages",
        value: liveMessages,
        format: "number",
        delta: sparklineDelta(messagesSparkline),
        deltaLabel: "vs 30 min ago",
        tone: "pink",
        sparkline: messagesSparkline,
      },
      {
        id: "conversion-rate",
        label: "Conversion Rate",
        value: metrics.conversionRate,
        format: "percent",
        delta: sparklineDelta(trafficSparkline),
        deltaLabel: "vs yesterday",
        tone: "teal",
        sparkline: trafficSparkline,
      },
    ],
    devices,
    categories: categories.map((row) => ({
      id: row.id,
      name: row.name,
      listings: row.listings,
      sold: row.sold,
      revenue: row.revenue,
    })),
    systemHealth: [
      { id: "web", label: "Web Server", status: mapHealthToServiceState(checks.api.status), statusLabel: "Operational" },
      {
        id: "database",
        label: "Database",
        status: databaseState,
        statusLabel: databaseState === "online" ? "Operational" : serviceStatusLabel(databaseState),
      },
      {
        id: "api",
        label: "API",
        status: apiState,
        statusLabel: apiState === "online" ? "Operational" : serviceStatusLabel(apiState),
      },
      {
        id: "payments",
        label: "Payments",
        status: stripeState,
        statusLabel: stripeState === "online" ? "Operational" : serviceStatusLabel(stripeState),
      },
      {
        id: "sendcloud",
        label: "Sendcloud",
        status: sendcloudState,
        statusLabel: sendcloudState === "online" ? "Operational" : serviceStatusLabel(sendcloudState),
      },
      {
        id: "stripe",
        label: "Stripe",
        status: stripeState,
        statusLabel: stripeState === "online" ? "Operational" : serviceStatusLabel(stripeState),
      },
      {
        id: "storage",
        label: "Storage",
        status: mapHealthToServiceState(checks.storage.status),
        statusLabel: "Operational",
      },
      {
        id: "email",
        label: "Email",
        status: num(operations.platform.failedEmails) > 0 ? "warning" : "online",
        statusLabel: num(operations.platform.failedEmails) > 0 ? "WARNING" : "Operational",
      },
      {
        id: "workers",
        label: "Workers",
        status: queueState,
        statusLabel: queueState === "online" ? "Operational" : serviceStatusLabel(queueState),
      },
      {
        id: "queue",
        label: "Queue",
        status: queueState,
        statusLabel: queueState === "online" ? "Operational" : serviceStatusLabel(queueState),
      },
      {
        id: "cron",
        label: "Cron",
        status: cronState,
        statusLabel: cronState === "online" ? "Operational" : serviceStatusLabel(cronState),
      },
    ],
    security: [
      {
        id: "failed-logins",
        label: "Failed Logins",
        value: num(sections.security.failedLogins),
        sparkline: chartPoints(charts, "security"),
      },
      {
        id: "blocked-users",
        label: "Blocked Users",
        value: num(sections.users.blocked),
        sparkline: chartPoints(charts, "security"),
      },
      {
        id: "threat-detection",
        label: "Threat Detection",
        value: num(sections.security.criticalAlerts),
        sparkline: chartPoints(charts, "security"),
      },
      {
        id: "suspicious-ip",
        label: "Suspicious IP",
        value: num(sections.security.suspiciousIps),
        sparkline: chartPoints(charts, "security"),
      },
      {
        id: "firewall",
        label: "Firewall",
        value: String(sections.security.firewall),
        sparkline: chartPoints(charts, "security"),
      },
      {
        id: "rate-limit",
        label: "Rate Limit",
        value: String(sections.security.rateLimiting),
        sparkline: chartPoints(charts, "security"),
      },
      {
        id: "sessions",
        label: "Sessions",
        value: num(sections.liveUsers.activeSessions),
        sparkline: trafficSparkline,
      },
    ],
    traffic: {
      visitors: liveAnalytics?.visitorMetrics.currentVisitors ?? metrics.liveVisitors,
      sessions: num(sections.analytics.sessions),
      pageViews: num(sections.marketHealth.views),
      bounceRate: liveAnalytics?.visitorMetrics.bounceRate ?? num(sections.analytics.bounceRate),
      visitorSparkline: trafficSparkline,
      sessionSparkline: usersSparkline.length ? usersSparkline : trafficSparkline,
    },
    payments: {
      total: paymentTotal,
      segments: [
        { id: "successful", label: "Successful", value: successfulPayments, tone: "success" },
        { id: "pending", label: "Pending", value: pendingPayments, tone: "warning" },
        { id: "failed", label: "Failed", value: failedPayments, tone: "danger" },
        { id: "refunds", label: "Refunds", value: refundPayments, tone: "info" },
        { id: "chargebacks", label: "Chargebacks", value: chargebackPayments, tone: "danger" },
      ],
    },
    orders: {
      segments: [
        { id: "completed", label: "Completed", value: completedOrders, tone: "success" },
        { id: "processing", label: "Processing", value: processingOrders, tone: "info" },
        { id: "pending", label: "Pending", value: pendingOrders, tone: "warning" },
        { id: "cancelled", label: "Cancelled", value: cancelledOrders, tone: "danger" },
      ],
      timeline: ordersSparkline,
    },
    shipping: {
      connected: shippingConnected,
      statusLabel: shippingConnected ? "CONNECTED" : sendcloudConfigured ? "WARNING" : "OFFLINE",
      stats: [
        { id: "in-transit", label: "In Transit", value: num(sections.shipping.inTransit), tone: "online" },
        { id: "delivered", label: "Delivered", value: num(sections.shipping.delivered), tone: "online" },
        { id: "failed", label: "Failed", value: num(sections.shipping.failed), tone: num(sections.shipping.failed) > 0 ? "warning" : "online" },
        { id: "labels", label: "Labels Created", value: num(sections.shipping.labelsGeneratedToday), tone: "live" },
      ],
    },
    disputes: {
      open: openDisputes,
      resolved: resolvedDisputes,
      refunded: refundedDisputes,
      pending: pendingDisputes,
      openSparkline: chartPoints(charts, "security"),
      resolvedSparkline: chartPoints(charts, "payments"),
    },
    sales: {
      total: revenueToday,
      orders: ordersToday,
      avgOrderValue,
      itemsSold,
      timeline: revenueSparkline,
    },
    bottomBar: [
      {
        id: "users",
        label: "Total Users",
        value: metrics.totalUsers,
        format: "number",
        delta: sparklineDelta(usersSparkline),
      },
      {
        id: "listings",
        label: "Total Listings",
        value: metrics.totalListings,
        format: "number",
        delta: sparklineDelta(listingsSparkline),
      },
      {
        id: "orders",
        label: "Total Orders",
        value: orders.totalOrders,
        format: "number",
        delta: sparklineDelta(ordersSparkline),
      },
      {
        id: "revenue",
        label: "Total Revenue",
        value: metrics.revenueThisMonth,
        format: "currency",
        delta: sparklineDelta(revenueSparkline),
      },
      {
        id: "reviews",
        label: "Reviews",
        value: totalReviews,
        format: "number",
        delta: 0,
      },
      {
        id: "businesses",
        label: "Active Businesses",
        value: verifiedBusinesses,
        format: "number",
        delta: sparklineDelta(usersSparkline),
      },
    ],
    liveMessages,
    verifiedBusinesses,
    totalReviews,
    admin,
  };
}

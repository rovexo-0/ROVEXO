import {
  getSuperAdminDashboardData,
  listAuditTimeline,
  countRecentMessages,
  countReviews,
  countPlatformAuditLogs,
} from "@/lib/super-admin/dashboard";
import { getDatabaseHealthSnapshot } from "@/lib/super-admin/database-health/snapshot";
import { getCommandCenterRegistry } from "@/lib/super-admin/command-center/registry";

export type CommandCenterDashboardKpi = {
  id: string;
  label: string;
  value: number;
  delta?: number;
  href: string;
  format?: "number" | "currency";
};

export type CommandCenterDashboardSnapshot = {
  generatedAt: string;
  platformStatus: string;
  kpis: CommandCenterDashboardKpi[];
  services: Array<{ id: string; label: string; status: string; href: string }>;
  auditLogPreview: Awaited<ReturnType<typeof listAuditTimeline>>;
  registryModuleCount: number;
};

export async function getCommandCenterDashboardSnapshot(): Promise<CommandCenterDashboardSnapshot> {
  const [dashboard, database, auditLogPreview, reviewCount, messageCount, auditCount] = await Promise.all([
    getSuperAdminDashboardData(),
    getDatabaseHealthSnapshot(),
    listAuditTimeline(8),
    countReviews(),
    countRecentMessages(),
    countPlatformAuditLogs(),
  ]);

  const { metrics, operations, orders } = dashboard;
  const platform = operations.platform;

  const kpis: CommandCenterDashboardKpi[] = [
    {
      id: "revenue-today",
      label: "Revenue Today",
      value: metrics.revenueToday,
      format: "currency",
      href: "/super-admin/analytics-engine",
    },
    {
      id: "revenue-month",
      label: "Revenue (Month)",
      value: metrics.revenueThisMonth,
      format: "currency",
      href: "/super-admin/business-intelligence",
    },
    {
      id: "users",
      label: "Active Users",
      value: metrics.onlineUsers,
      delta: metrics.newUsersToday,
      href: "/super-admin/users",
    },
    {
      id: "sellers",
      label: "Sellers",
      value: metrics.activeSellers,
      href: "/super-admin/users",
    },
    {
      id: "businesses",
      label: "Businesses",
      value: metrics.activeSellers,
      href: "/super-admin/businesses",
    },
    {
      id: "listings",
      label: "Listings",
      value: metrics.totalListings,
      delta: metrics.listingsToday,
      href: "/super-admin/moderation",
    },
    {
      id: "orders",
      label: "Orders",
      value: orders.totalOrders,
      delta: platform.awaitingPayment + platform.awaitingShipment,
      href: "/super-admin/orders-engine",
    },
    {
      id: "messages",
      label: "Messages (24h)",
      value: messageCount,
      href: "/super-admin/messages-engine",
    },
    {
      id: "reports",
      label: "Reports",
      value: metrics.pendingReports,
      href: "/super-admin/reports",
    },
    {
      id: "reviews",
      label: "Reviews",
      value: reviewCount,
      href: "/super-admin/reviews",
    },
    {
      id: "wallet",
      label: "Wallet Balance",
      value: metrics.walletBalance,
      format: "currency",
      href: "/super-admin/wallet-engine",
    },
    {
      id: "shipping",
      label: "Awaiting Shipment",
      value: platform.awaitingShipment,
      href: "/super-admin/shipping-engine",
    },
    {
      id: "analytics",
      label: "Conversion",
      value: metrics.conversionRate,
      href: "/super-admin/analytics-engine",
    },
    {
      id: "ai-alerts",
      label: "AI / Errors",
      value: operations.errors.length,
      href: "/super-admin/operations/ai",
    },
    {
      id: "jobs",
      label: "Background Jobs",
      value: operations.cron.recentRuns.length,
      href: "/super-admin/monitoring",
    },
    {
      id: "queue",
      label: "Pending Emails",
      value: platform.pendingEmails,
      href: "/super-admin/notifications-engine",
    },
    {
      id: "security",
      label: "Security Alerts",
      value: operations.errors.filter((e) => e.category === "security").length,
      href: "/super-admin/security-engine",
    },
    {
      id: "audit",
      label: "Audit Events",
      value: auditCount,
      href: "/super-admin/audit",
    },
  ];

  const services = [
    { id: "api", label: "API Health", status: dashboard.operations.health.checks.api.status, href: "/super-admin/monitoring" },
    { id: "database", label: "Database Health", status: database.connection.status, href: "/super-admin/database" },
    { id: "cache", label: "Cache", status: dashboard.operations.health.checks.redis.status, href: "/super-admin/monitoring" },
    { id: "storage", label: "Storage", status: database.storage.status, href: "/super-admin/database" },
    { id: "payments", label: "Payments", status: dashboard.operations.health.checks.stripe.status, href: "/super-admin/payments-engine" },
  ];

  const registry = getCommandCenterRegistry();

  return {
    generatedAt: new Date().toISOString(),
    platformStatus: metrics.platformStatus,
    kpis,
    services,
    auditLogPreview,
    registryModuleCount: registry.categories.reduce((sum, cat) => sum + cat.modules.length, 0),
  };
}

import { createAdminClient } from "@/lib/supabase/admin";
import type { HealthStatus } from "@/lib/ops/health";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";
import { getAdminStats } from "@/lib/admin/queries";
import { getAdminPromotionStats } from "@/lib/promotions/admin";
import { getMonetizationOverview } from "@/lib/monetization/service";

export type SuperAdminDashboardMetrics = {
  totalUsers: number;
  totalListings: number;
  activeSellers: number;
  conversionRate: number;
  liveVisitors: number;
  onlineUsers: number;
  newUsersToday: number;
  listingsToday: number;
  pendingVerifications: number;
  pendingReports: number;
  pendingSupportRequests: number;
  revenueToday: number;
  revenueThisMonth: number;
  walletBalance: number;
  activeFeatured: number;
  activeBumps: number;
  platformStatus: HealthStatus;
};

export type SuperAdminDashboardData = {
  operations: Awaited<ReturnType<typeof getProductionOperationsSnapshot>>;
  orders: Awaited<ReturnType<typeof getAdminStats>>;
  monetization: Awaited<ReturnType<typeof getMonetizationOverview>>;
  promotionStats: Awaited<ReturnType<typeof getAdminPromotionStats>>;
  metrics: SuperAdminDashboardMetrics;
};

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

async function sumOrderRevenueSince(since: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("total")
    .gte("created_at", since)
    .in("status", ["completed", "awaiting_shipment", "shipped", "delivered"]);

  return (data ?? []).reduce((sum, row) => sum + Number(row.total), 0);
}

async function sumWalletBalances(): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin.from("wallets").select("available_balance");
  return (data ?? []).reduce((sum, row) => sum + Number(row.available_balance), 0);
}

export async function getSuperAdminDashboardData(): Promise<SuperAdminDashboardData> {
  const admin = createAdminClient();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  const todayStart = startOfTodayIso();
  const monthStart = startOfMonthIso();

  const [
    operations,
    orders,
    monetization,
    promotionStats,
    onlineUsers,
    newUsersToday,
    listingsToday,
    revenueToday,
    revenueThisMonth,
    walletBalance,
    pendingSupport,
    totalUsers,
    totalListings,
    activeSellers,
  ] = await Promise.all([
    getProductionOperationsSnapshot(),
    getAdminStats(),
    getMonetizationOverview(),
    getAdminPromotionStats(),
    admin
      .from("user_presence")
      .select("*", { count: "exact", head: true })
      .eq("online", true)
      .gte("updated_at", fiveMinutesAgo),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    admin
      .from("products")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    sumOrderRevenueSince(todayStart),
    sumOrderRevenueSince(monthStart),
    sumWalletBalances(),
    admin.from("email_outbox").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("products").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["seller", "business", "admin", "super_admin"]),
  ]);

  const metrics: SuperAdminDashboardMetrics = {
    totalUsers: totalUsers.count ?? 0,
    totalListings: totalListings.count ?? 0,
    activeSellers: activeSellers.count ?? 0,
    conversionRate:
      (totalUsers.count ?? 0) > 0
        ? Number((((orders.totalOrders ?? 0) / (totalUsers.count ?? 1)) * 100).toFixed(1))
        : 0,
    liveVisitors: onlineUsers.count ?? 0,
    onlineUsers: onlineUsers.count ?? 0,
    newUsersToday: newUsersToday.count ?? 0,
    listingsToday: listingsToday.count ?? 0,
    pendingVerifications: operations.platform.pendingVerifications,
    pendingReports: operations.platform.pendingModeration,
    pendingSupportRequests: pendingSupport.count ?? 0,
    revenueToday,
    revenueThisMonth,
    walletBalance,
    activeFeatured: promotionStats.featureCount,
    activeBumps: promotionStats.bumpCount,
    platformStatus: operations.health.status,
  };

  return {
    operations,
    orders,
    monetization,
    promotionStats,
    metrics,
  };
}

export async function getSuperAdminDiagnosticsSnapshot() {
  const data = await getSuperAdminDashboardData();
  return {
    metrics: data.metrics,
    health: {
      status: data.operations.health.status,
      version: data.operations.health.version,
    },
    cron: {
      lastStatus: data.operations.cron.lastStatus,
    },
    errors: data.operations.errors.slice(0, 5).map((error) => ({
      id: error.id,
      category: error.category,
      message: error.message,
    })),
    environment: {
      nodeEnv: process.env.NODE_ENV ?? "development",
    },
  };
}

export async function listAuditTimeline(limit = 50) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_audit_logs")
    .select("id, actor_id, action, resource_type, resource_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function countRecentMessages(hours = 24): Promise<number> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - hours * 60 * 60_000).toISOString();
    const { count } = await admin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function countReviews(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { count } = await admin.from("reviews").select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function countPlatformAuditLogs(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("platform_audit_logs")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function listUserAuditTimeline(userId: string, limit = 25) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_audit_logs")
    .select("id, actor_id, action, resource_type, resource_id, metadata, created_at")
    .or(`resource_id.eq.${userId},actor_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

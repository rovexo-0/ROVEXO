import { createAdminClient } from "@/lib/supabase/admin";
import type { HealthStatus } from "@/lib/ops/health";
import {
  resolveCorePlatformStatus,
  resolveMarketplaceStatus,
  resolveNotificationsStatus,
  resolveServerStatus,
} from "@/lib/ops/monitoring-services";
import { getSuperAdminDashboardData } from "@/lib/super-admin/dashboard";
import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";
import type { Json } from "@/lib/supabase/types/database";
import {
  AI_MANAGER_SETTING_KEY,
  BANNER_MANAGER_SETTING_KEY,
  createDefaultAiToggles,
  createDefaultBannerManagerConfig,
  createDefaultFeatureToggles,
  createDefaultHomepageBuilderConfig,
  FEATURE_MANAGER_SETTING_KEY,
  HOMEPAGE_BUILDER_SETTING_KEY,
} from "@/lib/super-admin/mission-control/defaults";
import { MISSION_CONTROL_MODULES } from "@/lib/super-admin/mission-control/registry";
import type {
  BannerManagerConfig,
  HomepageBuilderConfig,
  MissionControlCounter,
  MissionControlService,
  MissionControlServiceStatus,
  MissionControlSnapshot,
} from "@/lib/super-admin/mission-control/types";

function mapHealth(status: HealthStatus): MissionControlServiceStatus {
  if (status === "healthy") return "online";
  if (status === "degraded") return "warning";
  return "offline";
}

function buildServices(
  health: Awaited<ReturnType<typeof getSuperAdminDashboardData>>["operations"]["health"],
  env: Awaited<ReturnType<typeof getSuperAdminDashboardData>>["operations"]["environment"],
): MissionControlService[] {
  const checks = health.checks;
  return [
    {
      id: "marketplace",
      label: "Marketplace",
      status: resolveMarketplaceStatus(checks),
      detail: checks.api.message ?? checks.api.status,
    },
    { id: "database", label: "Database", status: mapHealth(checks.database.status), detail: checks.database.message },
    { id: "search", label: "Search", status: env.redis ? mapHealth(checks.redis.status) : "online", detail: "Search indexing" },
    { id: "payments", label: "Payments", status: mapHealth(checks.stripe.status), detail: checks.stripe.message },
    { id: "wallet", label: "Wallet", status: env.stripe ? "online" : "warning" },
    { id: "shipping", label: "Shipping", status: "online" },
    { id: "orders", label: "Orders", status: mapHealth(checks.api.status) },
    { id: "messages", label: "Messages", status: "online" },
    {
      id: "notifications",
      label: "Notifications",
      status: resolveNotificationsStatus(checks),
      detail: "In-app notifications operational",
    },
    { id: "ai", label: "AI", status: env.supabase ? "online" : "warning" },
    { id: "storage", label: "Storage", status: mapHealth(checks.storage.status), detail: checks.storage.message },
    { id: "cdn", label: "CDN", status: env.appUrl ? "online" : "warning" },
    { id: "email", label: "Email", status: mapHealth(checks.email.status), detail: checks.email.message },
    { id: "push", label: "Push Notifications", status: mapHealth(checks.push.status), detail: checks.push.message },
    { id: "backup", label: "Backup", status: "online" },
    { id: "security", label: "Security", status: env.supabase ? "online" : "warning" },
    { id: "server", label: "Server", status: resolveServerStatus(checks), detail: checks.api.message ?? checks.api.status },
    { id: "api", label: "API", status: mapHealth(checks.api.status), detail: checks.api.message },
    { id: "queue", label: "Queue", status: mapHealth(checks.redis.status), detail: checks.redis.message },
    { id: "cache", label: "Cache", status: mapHealth(checks.redis.status), detail: checks.redis.message },
  ];
}

function buildCounters(
  data: Awaited<ReturnType<typeof getSuperAdminDashboardData>>,
  messageDelta: number,
): MissionControlCounter[] {
  const { metrics, operations, orders } = data;
  const platform = operations.platform;

  return [
    { id: "homepage", label: "Homepage", value: metrics.liveVisitors, href: "/super-admin/homepage-builder" },
    { id: "listings", label: "Listings", value: metrics.totalListings, delta: metrics.listingsToday, href: "/super-admin/listings" },
    { id: "orders", label: "Orders", value: orders.totalOrders, delta: platform.awaitingPayment + platform.awaitingShipment, href: "/super-admin/orders" },
    { id: "payments", label: "Payments", value: platform.awaitingPayment, delta: platform.awaitingPayment, href: "/super-admin/payments" },
    { id: "shipping", label: "Shipping", value: platform.awaitingShipment, delta: platform.awaitingShipment, href: "/super-admin/shipping-engine" },
    { id: "reports", label: "Reports", value: metrics.pendingReports, delta: metrics.pendingReports, href: "/super-admin/reports" },
    { id: "businesses", label: "Businesses", value: metrics.activeSellers, href: "/super-admin/businesses" },
    { id: "reviews", label: "Reviews", value: 0, href: "/super-admin/reviews" },
    { id: "messages", label: "Messages", value: messageDelta, delta: messageDelta, href: "/super-admin/moderation" },
    { id: "notifications", label: "Notifications", value: platform.pendingEmails, delta: platform.pendingEmails, href: "/super-admin/notifications" },
    { id: "support", label: "Support", value: metrics.pendingSupportRequests, delta: metrics.pendingSupportRequests, href: "/super-admin/support" },
    { id: "ai", label: "AI", value: operations.errors.length, delta: operations.errors.length, href: "/super-admin/operations" },
    { id: "alerts", label: "System Alerts", value: operations.errors.length, delta: operations.errors.length, href: "/super-admin/monitoring" },
  ];
}

async function countRecentMessages(): Promise<number> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const { count } = await admin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getMissionControlSnapshot(): Promise<MissionControlSnapshot> {
  const [dashboard, homepageBuilder, banners, features, ai, messageDelta] = await Promise.all([
    getSuperAdminDashboardData(),
    getPlatformSetting<HomepageBuilderConfig>(HOMEPAGE_BUILDER_SETTING_KEY, createDefaultHomepageBuilderConfig()),
    getPlatformSetting<BannerManagerConfig>(BANNER_MANAGER_SETTING_KEY, createDefaultBannerManagerConfig()),
    getPlatformSetting(FEATURE_MANAGER_SETTING_KEY, createDefaultFeatureToggles()),
    getPlatformSetting(AI_MANAGER_SETTING_KEY, createDefaultAiToggles()),
    countRecentMessages(),
  ]);

  const services = buildServices(dashboard.operations.health, dashboard.operations.environment);
  const counters = buildCounters(dashboard, messageDelta);
  const platformHealth = mapHealth(resolveCorePlatformStatus(dashboard.operations.health.checks));

  const modules = MISSION_CONTROL_MODULES.map((module) => {
    const counter = counters.find((item) => item.id === module.id || item.label.toLowerCase() === module.label.toLowerCase());
    return counter?.delta ? { ...module, badge: counter.delta } : module;
  });

  return {
    scannedAt: new Date().toISOString(),
    modules,
    services,
    counters,
    homepageBuilder,
    banners,
    features,
    ai,
    platformHealth,
  };
}

export async function saveMissionControlSetting(key: string, value: unknown, actorId: string): Promise<void> {
  await updatePlatformSetting({ actorId, key, value: value as Json });
}

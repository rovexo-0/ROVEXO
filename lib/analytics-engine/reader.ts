import { getSellerAnalyticsData } from "@/lib/analytics/store";
import { getOrdersEngineAnalyticsForUser } from "@/lib/orders-engine/reader";
import { getPaymentsEngineAnalyticsForUser } from "@/lib/payments-engine/reader";
import { getWalletEngineAnalyticsForUser } from "@/lib/wallet-engine/reader";
import { getProtectionEngineAnalyticsForUser } from "@/lib/protection-engine/reader";
import { getMessagesEngineAnalyticsForUser } from "@/lib/messages-engine/reader";
import { getNotificationsEngineAnalyticsForUser } from "@/lib/notifications-engine/reader";
import {
  readLiveAnalyticsEngineDocument,
  getAnalyticsEngineSnapshotForAdmin,
} from "@/lib/analytics-engine/engine";
import { ANALYTICS_ENGINE_MODULES } from "@/lib/analytics-engine/registry";
import {
  buildFinancialMetrics,
  buildLiveDashboard,
  computeAnalyticsEngineMetrics,
} from "@/lib/analytics-engine/timeline";
import type {
  AnalyticsEngineAnalytics,
  AnalyticsEngineContext,
  AnalyticsEngineSnapshot,
} from "@/lib/analytics-engine/types";

export async function getPublicAnalyticsEngineConfig() {
  return readLiveAnalyticsEngineDocument();
}

export async function getAnalyticsEngineSnapshot(): Promise<AnalyticsEngineSnapshot> {
  const { draft, live, history } = await getAnalyticsEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: ANALYTICS_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

export async function getAnalyticsEngineContext(userId: string): Promise<AnalyticsEngineContext> {
  const [config, orders, payments, wallet, protection, messages, notifications, seller] =
    await Promise.all([
      readLiveAnalyticsEngineDocument(),
      getOrdersEngineAnalyticsForUser(userId),
      getPaymentsEngineAnalyticsForUser(userId),
      getWalletEngineAnalyticsForUser(userId),
      getProtectionEngineAnalyticsForUser(userId),
      getMessagesEngineAnalyticsForUser(userId),
      getNotificationsEngineAnalyticsForUser(userId),
      getSellerAnalyticsData(userId, "30d").catch(() => null),
    ]);

  const financial = buildFinancialMetrics({ seller, orders, payments, wallet });
  const live = buildLiveDashboard({ orders, messages, notifications, protection, wallet, seller });

  return {
    financial,
    live,
    currency: config.currency,
    rangeLabel: seller?.rangeLabel ?? "30 Days",
  };
}

export async function getAnalyticsEngineAnalyticsForUser(userId: string): Promise<AnalyticsEngineAnalytics> {
  const [orders, payments, wallet, protection, messages, notifications, seller] = await Promise.all([
    getOrdersEngineAnalyticsForUser(userId),
    getPaymentsEngineAnalyticsForUser(userId),
    getWalletEngineAnalyticsForUser(userId),
    getProtectionEngineAnalyticsForUser(userId),
    getMessagesEngineAnalyticsForUser(userId),
    getNotificationsEngineAnalyticsForUser(userId),
    getSellerAnalyticsData(userId, "30d").catch(() => null),
  ]);

  return computeAnalyticsEngineMetrics({
    orders,
    payments,
    wallet,
    protection,
    messages,
    notifications,
    seller,
  });
}

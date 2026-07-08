import { listUserAddresses } from "@/lib/addresses/repository";
import { listRecentlyViewed } from "@/lib/launch/recently-viewed";
import { listConversations } from "@/lib/messages/store";
import { listNotifications } from "@/lib/notifications/store";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import type { Order } from "@/lib/orders/types";
import { listSavedItems } from "@/lib/saved/store";
import { createClient } from "@/lib/supabase/server";
import { getTrustDashboardData } from "@/lib/trust/service";
import type { UserProfile } from "@/lib/profile/types";
import {
  BUYER_ACTIVE_ORDER_STATUSES,
  BUYER_HISTORY_ORDER_STATUSES,
  BUYER_PAYMENT_METHODS,
  BUYER_SETTINGS_LINKS,
  buildQuickActions,
} from "@/lib/buyer/constants";
import type {
  BuyerDashboardData,
  BuyerProtectionSummary,
  BuyerReviewsSummary,
  BuyerStatistics,
} from "@/types/buyer";

async function listBuyerReviewsSummary(userId: string): Promise<BuyerReviewsSummary> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewer_id", userId);

    const rows = data ?? [];
    if (rows.length === 0) {
      return { count: 0, averageRating: 0 };
    }

    const total = rows.reduce((sum, row) => sum + Number(row.rating), 0);
    return {
      count: rows.length,
      averageRating: Math.round((total / rows.length) * 10) / 10,
    };
  } catch {
    return { count: 0, averageRating: 0 };
  }
}

function buildProtectionSummary(orders: Order[]): BuyerProtectionSummary {
  const activeClaims = orders.filter((order) => order.status === "issue_open").length;
  return {
    status: activeClaims > 0 ? "claim_in_progress" : "protected",
    coverageLabel: "ROVEXO Purchase Protection",
    activeClaims,
    refundsEnabled: true,
    href: "/resolution",
  };
}

function buildStatistics(input: {
  orders: Order[];
  savedCount: number;
  reviewsCount: number;
  protection: BuyerProtectionSummary;
}): BuyerStatistics {
  return {
    orders: input.orders.length,
    saved: input.savedCount,
    reviews: input.reviewsCount,
    protectionActive: input.protection.status === "protected",
  };
}

export async function fetchBuyerDashboardRepository(
  profile: UserProfile,
): Promise<BuyerDashboardData> {
  const [
    trustResult,
    ordersResult,
    savedResult,
    recentlyViewedResult,
    addressesResult,
    conversationsResult,
    notificationsResult,
    reviewsResult,
  ] = await Promise.allSettled([
    getTrustDashboardData(profile.id, profile.verified),
    fetchOrdersForUser(profile.id, "buyer"),
    listSavedItems(profile.id),
    listRecentlyViewed(profile.id, 12),
    listUserAddresses(profile.id),
    listConversations(profile.id),
    listNotifications(profile.id),
    listBuyerReviewsSummary(profile.id),
  ]);

  const trust = trustResult.status === "fulfilled" ? trustResult.value : null;
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const saved = savedResult.status === "fulfilled" ? savedResult.value : [];
  const recentlyViewed =
    recentlyViewedResult.status === "fulfilled" ? recentlyViewedResult.value : [];
  const addresses = addressesResult.status === "fulfilled" ? addressesResult.value : [];
  const conversations =
    conversationsResult.status === "fulfilled" ? conversationsResult.value : [];
  const notifications =
    notificationsResult.status === "fulfilled" ? notificationsResult.value : [];
  const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : { count: 0, averageRating: 0 };

  const protection = buildProtectionSummary(orders);
  const activeOrders = orders.filter((order) => BUYER_ACTIVE_ORDER_STATUSES.has(order.status));
  const orderHistory = orders.filter((order) => BUYER_HISTORY_ORDER_STATUSES.has(order.status));

  const unreadMessages = conversations.reduce((sum, item) => sum + item.unreadCount, 0);
  const unreadNotifications = notifications.filter((item) => !item.read).length;

  return {
    profile,
    trust,
    statistics: buildStatistics({
      orders,
      savedCount: saved.length,
      reviewsCount: reviews.count,
      protection,
    }),
    quickActions: buildQuickActions({
      orders: orders.length,
      saved: saved.length,
      messages: unreadMessages,
      notifications: unreadNotifications,
    }),
    activeOrders,
    orderHistory,
    saved,
    recentlyViewed,
    protection,
    addresses,
    paymentMethods: BUYER_PAYMENT_METHODS,
    conversations: conversations.slice(0, 5),
    notifications: notifications.slice(0, 6),
    reviews,
    settingsLinks: BUYER_SETTINGS_LINKS,
  };
}

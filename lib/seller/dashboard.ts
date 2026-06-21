import { getSellerAnalyticsData } from "@/lib/analytics/store";
import { mapOrdersToRecentOrders } from "@/lib/dashboard/utils";
import { countLowStockListings } from "@/lib/listings/repository";
import { filterOrdersByRole } from "@/lib/orders/role";
import { listOrders } from "@/lib/orders/store";
import { getProfile } from "@/lib/profile/data";
import {
  getActiveSellerPromotions,
  getSellerPromotionHistory,
  getSellerPromotionStats,
} from "@/lib/promotions/service";
import { createClient } from "@/lib/supabase/server";
import type { SellerDashboardData } from "@/lib/seller/types";

export async function getSellerDashboardData(userId?: string): Promise<SellerDashboardData> {
  const profile = await getProfile();
  const sellerId = userId ?? profile.id;
  const stats = profile.sellerStats;
  const sellerOrders = filterOrdersByRole(await listOrders(), sellerId, "seller");

  const supabase = await createClient();
  const [
    { data: sellerProfile },
    analytics,
    lowStockCount,
    activePromotions,
    promotionStats,
    promotionHistory,
    { data: conversations },
  ] = await Promise.all([
    supabase
      .from("seller_profiles")
      .select("rating, review_count, follower_count, listing_count")
      .eq("id", sellerId)
      .maybeSingle(),
    getSellerAnalyticsData(sellerId, "30d"),
    countLowStockListings(sellerId),
    getActiveSellerPromotions(sellerId),
    getSellerPromotionStats(sellerId),
    getSellerPromotionHistory(sellerId),
    supabase.from("conversations").select("id").eq("seller_id", sellerId),
  ]);

  const conversationIds = (conversations ?? []).map((row) => row.id);
  const { data: messages } = conversationIds.length
    ? await supabase
        .from("messages")
        .select("sent_at, sender_id")
        .in("conversation_id", conversationIds)
        .order("sent_at", { ascending: false })
        .limit(200)
    : { data: [] };

  const responseTimeMinutes = estimateResponseTimeMinutes(messages ?? [], sellerId);
  const revenueMetric = analytics.overview.find((metric) => metric.label === "Revenue");
  const ordersMetric = analytics.overview.find((metric) => metric.label === "Orders");
  const conversionMetric = analytics.overview.find((metric) => metric.label === "Conversion");
  const viewsMetric = analytics.overview.find((metric) => metric.label === "Views");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = sellerOrders.filter(
    (order) => new Date(order.createdAt).getTime() >= today.getTime(),
  );
  const todaySales = todayOrders.reduce((sum, order) => sum + order.totals.total, 0);

  return {
    profile,
    sellerRating: Number(sellerProfile?.rating ?? 0),
    reviewCount: sellerProfile?.review_count ?? 0,
    activeListings: stats?.listings ?? sellerProfile?.listing_count ?? 0,
    lowStockCount,
    activePromotions,
    promotionStats,
    promotionHistory,
    followers: sellerProfile?.follower_count ?? stats?.followers ?? 0,
    profileViews: Number(viewsMetric?.value ?? 0),
    responseTimeMinutes,
    conversionRate: Number(conversionMetric?.value ?? 0),
    featuredCount: activePromotions.filter((promotion) => promotion.type === "feature").length,
    bumpCount: activePromotions.filter((promotion) => promotion.type === "bump").length,
    todaySummary: [
      { label: "Sales Today", value: Math.round(todaySales * 100), format: "currency" },
      { label: "Orders", value: todayOrders.length },
      { label: "Views", value: Number(viewsMetric?.value ?? 0) },
      { label: "Followers", value: sellerProfile?.follower_count ?? stats?.followers ?? 0 },
    ],
    performance: analytics.performance,
    recentOrders: mapOrdersToRecentOrders(sellerOrders.slice(0, 5), {
      hrefPrefix: "/seller/orders",
    }),
    monthlyRevenue: Number(revenueMetric?.value ?? 0),
    monthlyOrders: Number(ordersMetric?.value ?? 0),
  };
}

function estimateResponseTimeMinutes(
  messages: Array<{ sent_at: string; sender_id: string }>,
  sellerId: string,
): number {
  const sellerMessages = messages.filter((message) => message.sender_id === sellerId);
  if (sellerMessages.length < 2) {
    return 0;
  }

  const gaps: number[] = [];
  for (let index = 1; index < sellerMessages.length; index += 1) {
    const previous = new Date(sellerMessages[index - 1].sent_at).getTime();
    const current = new Date(sellerMessages[index].sent_at).getTime();
    const gapMinutes = (current - previous) / 60000;
    if (gapMinutes > 0 && gapMinutes < 24 * 60) {
      gaps.push(gapMinutes);
    }
  }

  if (!gaps.length) {
    return 0;
  }

  return Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
}

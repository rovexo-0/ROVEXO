import { buildDashboardPerformance, mapOrdersToRecentOrders } from "@/lib/dashboard/utils";
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
  const sellerOrders = filterOrdersByRole(await listOrders(), sellerId, "seller");
  const stats = profile.sellerStats;

  const supabase = await createClient();
  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("rating, review_count")
    .eq("id", sellerId)
    .maybeSingle();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = sellerOrders.filter(
    (order) => new Date(order.createdAt).getTime() >= today.getTime(),
  );
  const todaySales = todayOrders.reduce((sum, order) => sum + order.totals.total, 0);

  const performance = buildDashboardPerformance(
    ["W1", "W2", "W3", "W4"].map((label, index) => ({
      label,
      values: {
        revenue: Math.round(todaySales * (0.5 + index * 0.15) || (stats?.sales ?? 0)),
        views: (stats?.listings ?? 0) * 12 + index * 40,
        orders: Math.max(todayOrders.length, index),
      },
    })),
    [
      { id: "revenue", label: "Revenue", format: "currency" },
      { id: "views", label: "Views", format: "number" },
      { id: "orders", label: "Orders", format: "number" },
    ],
    "Last 30 Days",
  );

  return {
    profile,
    sellerRating: Number(sellerProfile?.rating ?? 0),
    reviewCount: sellerProfile?.review_count ?? 0,
    activeListings: stats?.listings ?? 0,
    lowStockCount: await countLowStockListings(sellerId),
    activePromotions: await getActiveSellerPromotions(sellerId),
    promotionStats: await getSellerPromotionStats(sellerId),
    promotionHistory: await getSellerPromotionHistory(sellerId),
    todaySummary: [
      { label: "Sales Today", value: Math.round(todaySales * 100), format: "currency" },
      { label: "Orders", value: todayOrders.length },
      { label: "Views", value: (stats?.listings ?? 0) * 24 },
      { label: "Saved", value: stats?.followers ?? 0 },
    ],
    performance,
    recentOrders: mapOrdersToRecentOrders(sellerOrders.slice(0, 5), {
      hrefPrefix: "/seller/orders",
    }),
  };
}

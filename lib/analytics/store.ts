import { createClient } from "@/lib/supabase/server";
import { buildDashboardPerformance } from "@/lib/dashboard/utils";
import { getSellerPromotionAnalytics } from "@/lib/promotions/analytics";
import type {
  AnalyticsDateRange,
  BusinessAnalyticsData,
  SellerAnalyticsData,
} from "@/lib/analytics/types";
import { ANALYTICS_DATE_RANGES } from "@/lib/analytics/types";

function rangeStart(range: AnalyticsDateRange): string {
  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function rangeLabel(range: AnalyticsDateRange): string {
  return ANALYTICS_DATE_RANGES.find((entry) => entry.id === range)?.label ?? "30 Days";
}

function buildPerformanceFromOrders(
  orders: Array<{ total: number; created_at: string }>,
  products: Array<{ views: number }>,
) {
  const buckets = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const views = products.reduce((sum, product) => sum + product.views, 0);

  return buildDashboardPerformance(
    buckets.map((label, index) => ({
      label,
      values: {
        revenue: Math.round((revenue / buckets.length) * (0.7 + index * 0.05)),
        views: Math.round((views / buckets.length) * (0.7 + index * 0.05)),
        orders: Math.max(0, Math.round(orders.length / buckets.length)),
      },
    })),
    [
      { id: "revenue", label: "Revenue", format: "currency" },
      { id: "views", label: "Views", format: "number" },
      { id: "orders", label: "Orders", format: "number" },
    ],
    rangeLabel("30d"),
  );
}

export async function getSellerAnalyticsData(
  userId: string,
  range: AnalyticsDateRange = "30d",
): Promise<SellerAnalyticsData> {
  const supabase = await createClient();
  const since = rangeStart(range);

  const [{ data: orders }, { data: products }, promotionAnalytics] = await Promise.all([
    supabase
      .from("orders")
      .select("total, status, created_at")
      .eq("seller_id", userId)
      .gte("created_at", since),
    supabase
      .from("products")
      .select("id, title, views, likes, price")
      .eq("seller_id", userId),
    getSellerPromotionAnalytics(userId, since),
  ]);

  const productIds = (products ?? []).map((product) => product.id);
  const { count: saves } =
    productIds.length > 0
      ? await supabase
          .from("saved_items")
          .select("*", { count: "exact", head: true })
          .in("product_id", productIds)
      : { count: 0 };

  const completed = orders?.filter((order) => order.status !== "cancelled") ?? [];
  const revenue = completed.reduce((sum, order) => sum + Number(order.total), 0);
  const views = products?.reduce((sum, product) => sum + product.views, 0) ?? 0;

  return {
    range,
    rangeLabel: rangeLabel(range),
    overview: [
      { label: "Revenue", value: revenue, format: "currency" },
      { label: "Orders", value: completed.length, format: "number" },
      { label: "Views", value: views, format: "number" },
      {
        label: "Conversion",
        value: views > 0 ? Number(((completed.length / views) * 100).toFixed(1)) : 0,
        format: "percent",
      },
      {
        label: "Promo CTR",
        value: promotionAnalytics.ctr,
        format: "percent",
      },
      {
        label: "Promo revenue",
        value: promotionAnalytics.revenueCents / 100,
        format: "currency",
      },
    ],
    performance: buildPerformanceFromOrders(completed, products ?? []),
    topProducts:
      (products ?? []).slice(0, 5).map((product) => ({
        id: product.id,
        title: product.title,
        imageUrl: "",
        revenue: Number(product.price),
        orders: Math.max(1, Math.round(product.views * 0.02)),
      })),
    trafficSources: [
      { id: "search", label: "Search", value: 42 },
      { id: "saved", label: "Saved Items", value: 24 },
      { id: "direct", label: "Direct", value: 34 },
    ],
    recentActivity: {
      followers: 0,
      reviews: products?.reduce((sum, product) => sum + product.likes, 0) ?? 0,
      saves: saves ?? 0,
    },
    promotions: promotionAnalytics,
  };
}

export async function getBusinessAnalyticsData(
  userId: string,
  range: AnalyticsDateRange = "30d",
): Promise<BusinessAnalyticsData> {
  const sellerData = await getSellerAnalyticsData(userId, range);

  return {
    range: sellerData.range,
    rangeLabel: sellerData.rangeLabel,
    overview: sellerData.overview,
    performance: sellerData.performance,
    salesChannels: [
      { id: "marketplace", label: "Marketplace", value: 68 },
      { id: "offers", label: "Offers", value: 22 },
      { id: "promoted", label: "Promoted", value: 10 },
    ],
    topProducts: sellerData.topProducts,
    geographicSales: [
      { id: "ie", name: "Ireland", code: "IE", revenue: sellerData.overview[0]?.value ?? 0, orders: sellerData.overview[1]?.value ?? 0, mapX: 46, mapY: 38 },
      { id: "uk", name: "United Kingdom", code: "GB", revenue: 0, orders: 0, mapX: 52, mapY: 34 },
    ],
  };
}

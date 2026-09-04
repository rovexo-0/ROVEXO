import { buildDashboardPerformance, mapOrdersToRecentOrders } from "@/lib/dashboard/utils";
import { filterOrdersByRole } from "@/lib/orders/role";
import { listOrders } from "@/lib/orders/store";
import { getBusinessProfile } from "@/lib/profile/data";
import { getInventoryOverview, getSkuByProductId } from "@/lib/business/inventory";
import { createClient } from "@/lib/supabase/server";
import type { BusinessDashboardData } from "@/lib/business/types";

export async function getBusinessDashboardData(userId?: string): Promise<BusinessDashboardData> {
  const profile = await getBusinessProfile();
  const sellerId = userId ?? profile.id;
  const sellerOrders = filterOrdersByRole(await listOrders(), sellerId, "seller");
  const stats = profile.sellerStats;
  const skuByProductId = await getSkuByProductId(sellerId);

  const supabase = await createClient();
  const { data: businessAccount } = await supabase
    .from("business_accounts")
    .select("business_name, trust_score, verified_business, verified_wholesale, verified_manufacturer, verified_supplier")
    .eq("id", sellerId)
    .maybeSingle();

  const revenue = sellerOrders
    .filter((order) => order.sellerContext === "business")
    .reduce((sum, order) => sum + order.totals.total, 0);
  const businessOrders = sellerOrders.filter((order) => order.sellerContext === "business");

  const performance = buildDashboardPerformance(
    ["W1", "W2", "W3", "W4"].map((label) => ({
      label,
      values: {
        revenue: 0,
        orders: 0,
        visitors: 0,
      },
    })),
    [
      { id: "revenue", label: "Revenue", format: "currency" },
      { id: "orders", label: "Orders", format: "number" },
      { id: "visitors", label: "Visitors", format: "number" },
    ],
    "Last 30 Days",
  );

  return {
    profile,
    company: {
      companyName: businessAccount?.business_name ?? profile.fullName,
      companyLogoUrl: profile.avatarUrl ?? null,
      storeSlug: profile.username,
      rating: 0,
      reviewCount: 0,
      activeListings: stats?.listings ?? 0,
      verifiedBusiness: Boolean(businessAccount?.verified_business),
      verifiedWholesale: Boolean(businessAccount?.verified_wholesale),
      verifiedManufacturer: Boolean(businessAccount?.verified_manufacturer),
      verifiedSupplier: Boolean(businessAccount?.verified_supplier),
    },
    todaySummary: [
      { label: "Revenue", value: Math.round(revenue * 100), format: "currency" },
      { label: "Orders", value: businessOrders.length },
      { label: "Views", value: 0 },
      { label: "Saved", value: 0 },
    ],
    inventoryOverview: await getInventoryOverview(sellerId),
    performance,
    recentOrders: mapOrdersToRecentOrders(businessOrders.slice(0, 5), {
      hrefPrefix: "/seller/orders",
      skuByProductId,
    }),
  };
}

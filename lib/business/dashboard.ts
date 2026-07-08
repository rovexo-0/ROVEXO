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

  const revenue = sellerOrders.reduce((sum, order) => sum + order.totals.total, 0);

  const performance = buildDashboardPerformance(
    ["W1", "W2", "W3", "W4"].map((label, index) => ({
      label,
      values: {
        revenue: Math.round((revenue / 4) * (0.8 + index * 0.1)),
        orders: Math.max(1, Math.round(sellerOrders.length / 4)),
        visitors: (stats?.listings ?? 0) * 20 + index * 50,
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
      rating: 4.8,
      reviewCount: stats?.sales ?? 0,
      activeListings: stats?.listings ?? 0,
      verifiedBusiness: Boolean(businessAccount?.verified_business),
      verifiedWholesale: Boolean(businessAccount?.verified_wholesale),
      verifiedManufacturer: Boolean(businessAccount?.verified_manufacturer),
      verifiedSupplier: Boolean(businessAccount?.verified_supplier),
    },
    todaySummary: [
      { label: "Revenue", value: Math.round(revenue * 100), format: "currency" },
      { label: "Orders", value: sellerOrders.length },
      { label: "Views", value: (stats?.listings ?? 0) * 24 },
      { label: "Saved", value: stats?.followers ?? 0 },
    ],
    inventoryOverview: await getInventoryOverview(sellerId),
    performance,
    recentOrders: mapOrdersToRecentOrders(sellerOrders.slice(0, 5), {
      hrefPrefix: "/seller/orders",
      skuByProductId,
    }),
  };
}

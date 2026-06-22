import { getAdminStats } from "@/lib/admin/queries";
import { getAdminPromotionStats } from "@/lib/promotions/admin";
import type { AdminPromotionStats } from "@/lib/promotions/admin-types";
import { getTrustAnalyticsSummary } from "@/lib/trust/service";
import { getWholesaleAnalyticsSummary } from "@/lib/wholesale/service";
import { getMonetizationOverview } from "@/lib/monetization/service";

const EMPTY_PROMOTION_STATS: AdminPromotionStats = {
  totalPromotions: 0,
  activePromotions: 0,
  revenueCents: 0,
  monthRevenueCents: 0,
  bumpCount: 0,
  featureCount: 0,
  impressions: 0,
  clicks: 0,
  ctr: 0,
};

export type PlatformAnalyticsSnapshot = {
  orders: Awaited<ReturnType<typeof getAdminStats>>;
  promotions: Awaited<ReturnType<typeof getAdminPromotionStats>>;
  trust: Awaited<ReturnType<typeof getTrustAnalyticsSummary>>;
  wholesale: Awaited<ReturnType<typeof getWholesaleAnalyticsSummary>>;
  monetization: Awaited<ReturnType<typeof getMonetizationOverview>>;
};

export async function getPlatformAnalyticsSnapshot(): Promise<PlatformAnalyticsSnapshot> {
  const [orders, promotions, trust, wholesale, monetization] = await Promise.all([
    getAdminStats(),
    getAdminPromotionStats().catch(() => EMPTY_PROMOTION_STATS),
    getTrustAnalyticsSummary(),
    getWholesaleAnalyticsSummary(),
    getMonetizationOverview(),
  ]);

  return { orders, promotions, trust, wholesale, monetization };
}

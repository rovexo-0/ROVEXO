import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PromotionAnalyticsEventType,
  PromotionAnalyticsSummary,
  PromotionAnalyticsSurface,
} from "@/lib/promotions/admin-types";

export async function recordPromotionAnalyticsEvent(input: {
  productId: string;
  sellerId: string;
  eventType: PromotionAnalyticsEventType;
  surface: PromotionAnalyticsSurface;
  promotionId?: string | null;
}): Promise<void> {
  const admin = createAdminClient();

  await admin.from("promotion_analytics_events").insert({
    product_id: input.productId,
    seller_id: input.sellerId,
    promotion_id: input.promotionId ?? null,
    event_type: input.eventType,
    surface: input.surface,
  });
}

export async function getSellerPromotionAnalytics(
  sellerId: string,
  sinceIso: string,
): Promise<PromotionAnalyticsSummary> {
  const admin = createAdminClient();

  const [{ data: events }, { data: purchases }] = await Promise.all([
    admin
      .from("promotion_analytics_events")
      .select("event_type")
      .eq("seller_id", sellerId)
      .gte("created_at", sinceIso),
    admin
      .from("listing_promotions")
      .select("amount_cents")
      .eq("seller_id", sellerId)
      .in("status", ["active", "expired"])
      .gte("created_at", sinceIso),
  ]);

  const impressions = (events ?? []).filter((row) => row.event_type === "impression").length;
  const clicks = (events ?? []).filter((row) => row.event_type === "click").length;
  const revenueCents = (purchases ?? []).reduce((sum, row) => sum + row.amount_cents, 0);

  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(1)) : 0,
    purchases: purchases?.length ?? 0,
    revenueCents,
  };
}

export async function getAdminPromotionAnalytics(sinceIso: string): Promise<PromotionAnalyticsSummary> {
  const admin = createAdminClient();

  const [{ data: events }, { data: purchases }] = await Promise.all([
    admin
      .from("promotion_analytics_events")
      .select("event_type")
      .gte("created_at", sinceIso),
    admin
      .from("listing_promotions")
      .select("amount_cents")
      .in("status", ["active", "expired"])
      .gte("created_at", sinceIso),
  ]);

  const impressions = (events ?? []).filter((row) => row.event_type === "impression").length;
  const clicks = (events ?? []).filter((row) => row.event_type === "click").length;
  const revenueCents = (purchases ?? []).reduce((sum, row) => sum + row.amount_cents, 0);

  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(1)) : 0,
    purchases: purchases?.length ?? 0,
    revenueCents,
  };
}

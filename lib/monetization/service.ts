import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminPromotionStats } from "@/lib/promotions/admin";
import { MONETIZATION_PRODUCTS, type MonetizationPlan, type MonetizationSubscription } from "@/lib/monetization/types";

function mapPlan(row: Record<string, unknown>): MonetizationPlan {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tier: row.tier as MonetizationPlan["tier"],
    priceCents: Number(row.price_cents),
    interval: String(row.interval),
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
  };
}

function mapSubscription(row: Record<string, unknown>, plan: MonetizationPlan | null): MonetizationSubscription {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    planSlug: plan?.slug ?? "unknown",
    planName: plan?.name ?? "Unknown",
    status: row.status as MonetizationSubscription["status"],
    currentPeriodEnd: row.current_period_end ? String(row.current_period_end) : null,
  };
}

export async function listMonetizationPlans(): Promise<MonetizationPlan[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("monetization_plans")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    return ((data as Record<string, unknown>[] | null) ?? []).map(mapPlan);
  } catch {
    return [];
  }
}

export async function getUserSubscription(userId: string): Promise<MonetizationSubscription | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("monetization_subscriptions")
      .select("*, monetization_plans(*)")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    const row = data as Record<string, unknown>;
    const planRow = row.monetization_plans as Record<string, unknown> | null;
    return mapSubscription(row, planRow ? mapPlan(planRow) : null);
  } catch {
    return null;
  }
}

export async function subscribeToPlan(userId: string, planSlug: string): Promise<MonetizationSubscription | null> {
  try {
    const admin = createAdminClient();
    const { data: plan } = await admin.from("monetization_plans").select("*").eq("slug", planSlug).eq("active", true).maybeSingle();
    if (!plan) return null;

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await admin
      .from("monetization_subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .in("status", ["active", "trialing"]);

    const { data } = await admin
      .from("monetization_subscriptions")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: "active",
        current_period_end: periodEnd.toISOString(),
      })
      .select("*, monetization_plans(*)")
      .single();

    if (!data) return null;
    const row = data as Record<string, unknown>;
    return mapSubscription(row, mapPlan(plan as Record<string, unknown>));
  } catch {
    return null;
  }
}

export async function getMonetizationOverview(): Promise<{
  plans: MonetizationPlan[];
  products: typeof MONETIZATION_PRODUCTS;
  promotionRevenueCents: number;
  activeSubscriptions: number;
}> {
  const [plans, promotionStats, activeSubscriptions] = await Promise.all([
    listMonetizationPlans(),
    getAdminPromotionStats().catch(() => ({ monthRevenueCents: 0, activePromotions: 0 })),
    countActiveSubscriptions(),
  ]);

  return {
    plans,
    products: MONETIZATION_PRODUCTS,
    promotionRevenueCents: promotionStats.monthRevenueCents,
    activeSubscriptions,
  };
}

async function countActiveSubscriptions(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("monetization_subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "trialing"]);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export function userHasPremiumFeature(
  subscription: MonetizationSubscription | null,
  feature: "analytics" | "rfq_premium" | "premium_ai" | "priority_search" | "priority_support",
): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active" && subscription.status !== "trialing") return false;
  if (feature === "premium_ai") return ["enterprise", "wholesale"].includes(subscription.planSlug);
  if (feature === "rfq_premium") return ["wholesale", "enterprise", "business"].includes(subscription.planSlug);
  if (feature === "priority_search") return ["enterprise", "business", "seller-pro"].includes(subscription.planSlug);
  if (feature === "priority_support") return ["enterprise", "business", "seller-pro", "wholesale"].includes(subscription.planSlug);
  return ["seller-pro", "business", "wholesale", "enterprise"].includes(subscription.planSlug);
}

export async function getMonetizationAnalytics(): Promise<{
  activeSubscriptions: number;
  promotionRevenueCents: number;
  planBreakdown: Array<{ slug: string; count: number }>;
}> {
  const [activeSubscriptions, promotionStats, breakdown] = await Promise.all([
    countActiveSubscriptions(),
    getAdminPromotionStats().catch(() => ({ monthRevenueCents: 0 })),
    getPlanBreakdown(),
  ]);

  return {
    activeSubscriptions,
    promotionRevenueCents: promotionStats.monthRevenueCents,
    planBreakdown: breakdown,
  };
}

async function getPlanBreakdown(): Promise<Array<{ slug: string; count: number }>> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("monetization_subscriptions")
      .select("monetization_plans(slug)")
      .in("status", ["active", "trialing"]);
    const counts = new Map<string, number>();
    for (const row of (data as Array<{ monetization_plans: { slug: string } | null }> | null) ?? []) {
      const slug = row.monetization_plans?.slug ?? "unknown";
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    return [...counts.entries()].map(([slug, count]) => ({ slug, count }));
  } catch {
    return [];
  }
}

import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MonetizationPlan, MonetizationSubscription } from "@/lib/monetization/types";
import { getAppBaseUrl, getStripeClient, isStripeConfigured, isStripeRequired } from "@/lib/stripe/server";
import { subscribeToPlan } from "@/lib/monetization/service";

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

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): string {
  const itemEnd = subscription.items.data[0]?.current_period_end;
  if (itemEnd) {
    return new Date(itemEnd * 1000).toISOString();
  }

  const fallback = new Date();
  fallback.setMonth(fallback.getMonth() + 1);
  return fallback.toISOString();
}

async function loadPlanBySlug(planSlug: string): Promise<MonetizationPlan | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("monetization_plans").select("*").eq("slug", planSlug).eq("active", true).maybeSingle();
  return data ? mapPlan(data as Record<string, unknown>) : null;
}

export async function createSubscriptionCheckoutSession(input: {
  userId: string;
  userEmail?: string | null;
  planSlug: string;
}): Promise<{ url: string } | { error: string }> {
  const plan = await loadPlanBySlug(input.planSlug);
  if (!plan) return { error: "Plan not found." };
  if (plan.priceCents === 0) {
    const subscription = await subscribeToPlan(input.userId, plan.slug);
    return subscription
      ? { url: `${getAppBaseUrl()}/plans?subscription=success` }
      : { error: "Unable to activate free plan." };
  }

  if (!isStripeConfigured()) {
    if (isStripeRequired()) return { error: "Subscription payments are not configured." };
    const subscription = await subscribeToPlan(input.userId, plan.slug);
    return subscription
      ? { url: `${getAppBaseUrl()}/plans?subscription=success` }
      : { error: "Unable to activate plan." };
  }

  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl();
  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: input.userEmail ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: plan.priceCents,
            recurring: { interval: plan.interval === "year" ? "year" : "month" },
            product_data: {
              name: plan.name,
              description: `ROVEXO ${plan.name} subscription`,
            },
          },
        },
      ],
      metadata: {
        checkoutType: "subscription",
        planId: plan.id,
        planSlug: plan.slug,
        userId: input.userId,
      },
      subscription_data: {
        metadata: {
          planId: plan.id,
          planSlug: plan.slug,
          userId: input.userId,
        },
      },
      success_url: `${baseUrl}/plans?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/plans?subscription=cancelled`,
    },
    { idempotencyKey: `subscription-checkout-${input.userId}-${plan.slug}` },
  );

  if (!session.url) return { error: "Unable to create checkout session." };
  return { url: session.url };
}

export async function fulfillSubscriptionFromStripeSession(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = session.metadata ?? {};
  if (metadata.checkoutType !== "subscription") return;

  const userId = metadata.userId;
  const planId = metadata.planId;
  if (!userId || !planId) return;

  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;

  const admin = createAdminClient();
  await admin
    .from("monetization_subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", userId)
    .in("status", ["active", "trialing"]);

  let currentPeriodEnd: string | null = null;
  if (stripeSubscriptionId && isStripeConfigured()) {
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
  } else {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    currentPeriodEnd = periodEnd.toISOString();
  }

  await admin.from("monetization_subscriptions").insert({
    user_id: userId,
    plan_id: planId,
    status: "active",
    stripe_subscription_id: stripeSubscriptionId,
    current_period_end: currentPeriodEnd,
  });
}

export async function syncSubscriptionFromStripe(stripeSubscription: Stripe.Subscription): Promise<void> {
  const userId = stripeSubscription.metadata.userId;
  const planId = stripeSubscription.metadata.planId;
  if (!userId || !planId) return;

  const admin = createAdminClient();
  const statusMap: Record<string, MonetizationSubscription["status"]> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "expired",
    paused: "past_due",
  };

  const status = statusMap[stripeSubscription.status] ?? "expired";
  const currentPeriodEnd = getSubscriptionPeriodEnd(stripeSubscription);

  const { data: existing } = await admin
    .from("monetization_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", stripeSubscription.id)
    .maybeSingle();

  if (existing) {
    await admin
      .from("monetization_subscriptions")
      .update({ status, current_period_end: currentPeriodEnd })
      .eq("id", existing.id);
    return;
  }

  await admin.from("monetization_subscriptions").insert({
    user_id: userId,
    plan_id: planId,
    status,
    stripe_subscription_id: stripeSubscription.id,
    current_period_end: currentPeriodEnd,
  });
}

export async function cancelUserSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("monetization_subscriptions")
    .select("id, stripe_subscription_id, status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return false;

  if (row.stripe_subscription_id && isStripeConfigured()) {
    const stripe = getStripeClient();
    await stripe.subscriptions.cancel(row.stripe_subscription_id);
  }

  const admin = createAdminClient();
  await admin.from("monetization_subscriptions").update({ status: "cancelled" }).eq("id", row.id);
  return true;
}

export async function getUserSubscriptionRecord(userId: string): Promise<MonetizationSubscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("monetization_subscriptions")
    .select("*, monetization_plans(*)")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as Record<string, unknown>;
  const planRow = row.monetization_plans as Record<string, unknown> | null;
  return mapSubscription(row, planRow ? mapPlan(planRow) : null);
}

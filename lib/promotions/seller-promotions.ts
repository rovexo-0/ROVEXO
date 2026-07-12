import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { computePromotionScore } from "@/lib/promotions/format";
import { writePromotionAuditLog } from "@/lib/promotions/audit-log";
import {
  BOOST_PACKAGE_TIERS,
  resolveBoostPackageTier,
} from "@/lib/promotions/canonical-tools";
import { getMarketplacePricingSettings, DEFAULT_MARKETPLACE_PRICING } from "@/lib/promotions/marketplace-pricing";
import { getAppBaseUrl, getStripeClient, isStripeConfigured, isStripeRequired } from "@/lib/stripe/server";
import { revalidatePromotionSurfaces } from "@/lib/promotions/revalidate-surfaces";

export type SellerPromotionType = "store_featured" | "boost_package";

export type SellerPromotionStatus =
  | "pending"
  | "active"
  | "scheduled"
  | "paused"
  | "expired"
  | "failed"
  | "revoked";

type ActiveProductRow = {
  id: string;
  bump_count: number | null;
  bumped_until: string | null;
  featured_until: string | null;
  title: string;
};

function addDays(from: Date, days: number): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

function extendUntil(existing: string | null, days: number, from = new Date()): string {
  const base =
    existing && new Date(existing).getTime() > from.getTime() ? new Date(existing) : from;
  return addDays(base, days).toISOString();
}

async function fetchActiveSellerProducts(sellerId: string): Promise<ActiveProductRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id, bump_count, bumped_until, featured_until, title")
    .eq("seller_id", sellerId)
    .eq("status", "published")
    .gt("stock", 0);

  return (data ?? []) as ActiveProductRow[];
}

function resolveStoreFeaturedDays(packageId: string, showcaseDays: number): number {
  if (packageId === "unlimited") return 36500;
  const tier = resolveBoostPackageTier(packageId);
  if (tier) return tier.days;
  if (packageId === "7d") return 7;
  if (packageId === "14d") return 14;
  if (packageId === "28d") return 28;
  const custom = Number(packageId);
  if (Number.isFinite(custom) && custom > 0) return Math.floor(custom);
  return showcaseDays;
}

export function resolveSellerPromotionPricing(input: {
  type: SellerPromotionType;
  packageId: string;
}): { priceCents: number; durationLabel: string; days: number } | null {
  if (input.type === "store_featured") {
    const pricing = DEFAULT_MARKETPLACE_PRICING;
    const days = resolveStoreFeaturedDays(input.packageId, pricing.showcase.days);
    return {
      priceCents: pricing.showcase.priceCents,
      durationLabel: `${days} Days`,
      days,
    };
  }

  const tier = resolveBoostPackageTier(input.packageId);
  if (!tier) return null;
  return {
    priceCents: tier.priceCents,
    durationLabel: tier.label,
    days: tier.days,
  };
}

export async function applySellerPromotion(input: {
  sellerId: string;
  type: SellerPromotionType;
  packageId: string;
  amountCents: number;
  sellerPromotionId?: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  grantedByAdmin?: boolean;
  grantedByAdminId?: string | null;
  actorId?: string;
  reason?: string | null;
  scheduledStartAt?: string | null;
}): Promise<{ success: boolean; error?: string; sellerPromotionId?: string }> {
  const pricing = await getMarketplacePricingSettings();
  const resolved =
    input.type === "store_featured"
      ? {
          days: resolveStoreFeaturedDays(input.packageId, pricing.showcase.days),
          durationLabel: `${resolveStoreFeaturedDays(input.packageId, pricing.showcase.days)} Days`,
        }
      : resolveBoostPackageTier(input.packageId)
        ? {
            days: resolveBoostPackageTier(input.packageId)!.days,
            durationLabel: resolveBoostPackageTier(input.packageId)!.label,
          }
        : null;

  if (!resolved) {
    return { success: false, error: "Invalid promotion package." };
  }

  const products = await fetchActiveSellerProducts(input.sellerId);
  if (products.length === 0) {
    return { success: false, error: "You need at least one active listing to promote." };
  }

  const admin = createAdminClient();
  const now = new Date();
  const scheduledStart = input.scheduledStartAt ? new Date(input.scheduledStartAt) : null;

  if (scheduledStart && scheduledStart.getTime() > now.getTime()) {
    const endsAt = addDays(scheduledStart, resolved.days).toISOString();
    const update = {
      status: "scheduled" as const,
      starts_at: scheduledStart.toISOString(),
      ends_at: endsAt,
      amount_cents: input.amountCents,
      stripe_session_id: input.stripeSessionId ?? null,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      granted_by_admin: Boolean(input.grantedByAdmin),
      granted_by_admin_id: input.grantedByAdminId ?? null,
      reason: input.reason ?? null,
      updated_at: now.toISOString(),
    };

    if (input.sellerPromotionId) {
      await admin.from("seller_promotions").update(update).eq("id", input.sellerPromotionId);
    } else {
      const { data } = await admin
        .from("seller_promotions")
        .insert({
          seller_id: input.sellerId,
          type: input.type,
          package_id: input.packageId,
          ...update,
        })
        .select("id")
        .single();
      input.sellerPromotionId = data?.id;
    }

    if (input.actorId && input.sellerPromotionId) {
      await writePromotionAuditLog({
        actorId: input.actorId,
        userId: input.sellerId,
        promotionType: input.type,
        sellerPromotionId: input.sellerPromotionId,
        previousStatus: "pending",
        newStatus: "scheduled",
        reason: input.reason,
        durationLabel: resolved.durationLabel,
      });
    }

    return { success: true, sellerPromotionId: input.sellerPromotionId };
  }

  const endsAt = addDays(now, resolved.days).toISOString();
  const bumpHours = pricing.boost.find((tier) => tier.id === "7d")?.hours ?? 168;

  for (const product of products) {
    let bumpedUntil = product.bumped_until;
    const featuredUntil = extendUntil(product.featured_until, resolved.days, now);
    let bumpCount = product.bump_count ?? 0;

    if (input.type === "boost_package") {
      const bumpBase =
        product.bumped_until && new Date(product.bumped_until).getTime() > now.getTime()
          ? new Date(product.bumped_until)
          : now;
      const bumpEnd = new Date(bumpBase);
      bumpEnd.setHours(bumpEnd.getHours() + bumpHours);
      bumpedUntil = bumpEnd.toISOString();
      bumpCount += 1;
    }

    const promotionScore = computePromotionScore(bumpCount, bumpedUntil, featuredUntil);
    await admin
      .from("products")
      .update({
        featured_until: featuredUntil,
        ...(input.type === "boost_package"
          ? {
              bumped_until: bumpedUntil,
              bump_count: bumpCount,
              last_bumped_at: now.toISOString(),
            }
          : {}),
        promotion_score: promotionScore,
      })
      .eq("id", product.id)
      .eq("seller_id", input.sellerId);
  }

  const promotionRow = {
    status: "active" as const,
    starts_at: now.toISOString(),
    ends_at: endsAt,
    amount_cents: input.amountCents,
    stripe_session_id: input.stripeSessionId ?? null,
    stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    granted_by_admin: Boolean(input.grantedByAdmin),
    granted_by_admin_id: input.grantedByAdminId ?? null,
    reason: input.reason ?? null,
    updated_at: now.toISOString(),
  };

  let sellerPromotionId = input.sellerPromotionId;
  if (sellerPromotionId) {
    await admin.from("seller_promotions").update(promotionRow).eq("id", sellerPromotionId);
  } else {
    const { data } = await admin
      .from("seller_promotions")
      .insert({
        seller_id: input.sellerId,
        type: input.type,
        package_id: input.packageId,
        ...promotionRow,
      })
      .select("id")
      .single();
    sellerPromotionId = data?.id;
  }

  if (input.actorId && sellerPromotionId) {
    await writePromotionAuditLog({
      actorId: input.actorId,
      userId: input.sellerId,
      promotionType: input.type,
      sellerPromotionId,
      previousStatus: input.grantedByAdmin ? null : "pending",
      newStatus: "active",
      reason: input.reason,
      durationLabel: resolved.durationLabel,
    });
  }

  await revalidatePromotionSurfaces();
  return { success: true, sellerPromotionId };
}

export async function createPendingSellerPromotion(
  sellerId: string,
  type: SellerPromotionType,
  packageId: string,
  amountCents: number,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("seller_promotions")
    .insert({
      seller_id: sellerId,
      type,
      package_id: packageId,
      amount_cents: amountCents,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function createSellerPromotionCheckoutSession(input: {
  sellerId: string;
  type: SellerPromotionType;
  packageId: string;
}): Promise<{ url: string } | { error: string }> {
  const pricing = await getMarketplacePricingSettings();
  const quote =
    input.type === "store_featured"
      ? {
          priceCents: pricing.showcase.priceCents,
          days: resolveStoreFeaturedDays(input.packageId, pricing.showcase.days),
          label: "Featured Store",
        }
      : (() => {
          const tier = resolveBoostPackageTier(input.packageId);
          if (!tier) return null;
          return { priceCents: tier.priceCents, days: tier.days, label: "Boost Package" };
        })();

  if (!quote) {
    return { error: "Invalid promotion package." };
  }

  const products = await fetchActiveSellerProducts(input.sellerId);
  if (products.length === 0) {
    return { error: "You need at least one active listing to promote." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isStripeConfigured()) {
    if (isStripeRequired()) {
      return { error: "Promotion payments are not configured." };
    }

    const result = await applySellerPromotion({
      sellerId: input.sellerId,
      type: input.type,
      packageId: input.packageId,
      amountCents: quote.priceCents,
    });

    if (!result.success) {
      return { error: result.error ?? "Unable to apply promotion." };
    }

    return { url: `${getAppBaseUrl()}/account/promotion-tools?promotion=success&type=${input.type}` };
  }

  const pendingId = await createPendingSellerPromotion(
    input.sellerId,
    input.type,
    input.packageId,
    quote.priceCents,
  );

  if (!pendingId) {
    return { error: "Unable to start promotion checkout." };
  }

  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl();
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user?.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: quote.priceCents,
            product_data: {
              name: quote.label,
              description: `${quote.days} days — all active listings`,
            },
          },
        },
      ],
      metadata: {
        checkoutType: "seller_promotion",
        sellerPromotionId: pendingId,
        sellerId: input.sellerId,
        type: input.type,
        packageId: input.packageId,
        amountCents: String(quote.priceCents),
      },
      success_url: `${baseUrl}/account/promotion-tools?promotion=success&type=${input.type}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/account/promotion-tools?promotion=cancelled&promotion_id=${pendingId}`,
    },
    { idempotencyKey: `seller-promo-checkout-${pendingId}` },
  );

  if (!session.url) {
    return { error: "Unable to create Stripe checkout session." };
  }

  const admin = createAdminClient();
  await admin
    .from("seller_promotions")
    .update({ stripe_session_id: session.id })
    .eq("id", pendingId);

  return { url: session.url };
}

export async function fulfillSellerPromotionFromStripeSession(session: {
  id: string;
  metadata: Record<string, string | undefined> | null;
  payment_intent?: string | { id: string } | null;
}): Promise<{ success: boolean; error?: string }> {
  const metadata = session.metadata ?? {};
  const sellerPromotionId = metadata.sellerPromotionId;
  const sellerId = metadata.sellerId;
  const type = metadata.type as SellerPromotionType | undefined;
  const packageId = metadata.packageId;
  const amountCents = Number(metadata.amountCents ?? 0);

  if (!sellerPromotionId || !sellerId || !type || !packageId) {
    return { success: false, error: "Missing seller promotion metadata." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("seller_promotions")
    .select("status")
    .eq("id", sellerPromotionId)
    .maybeSingle();

  if (existing?.status === "active") {
    return { success: true };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  return applySellerPromotion({
    sellerId,
    type,
    packageId,
    amountCents,
    sellerPromotionId,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    actorId: sellerId,
  });
}

export async function grantSellerPromotion(input: {
  actorId: string;
  sellerId: string;
  type: SellerPromotionType;
  packageId: string;
  reason?: string | null;
  scheduledStartAt?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  return applySellerPromotion({
    sellerId: input.sellerId,
    type: input.type,
    packageId: input.packageId,
    amountCents: 0,
    grantedByAdmin: true,
    grantedByAdminId: input.actorId,
    actorId: input.actorId,
    reason: input.reason ?? "Granted by ROVEXO",
    scheduledStartAt: input.scheduledStartAt,
  });
}

export { BOOST_PACKAGE_TIERS };

export async function activateScheduledSellerPromotions(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: scheduled } = await admin
    .from("seller_promotions")
    .select("id, seller_id, type, package_id, amount_cents, granted_by_admin, granted_by_admin_id, reason")
    .eq("status", "scheduled")
    .lte("starts_at", now)
    .limit(50);

  let activated = 0;
  for (const promo of scheduled ?? []) {
    const result = await applySellerPromotion({
      sellerId: promo.seller_id,
      type: promo.type as SellerPromotionType,
      packageId: promo.package_id,
      amountCents: promo.amount_cents,
      sellerPromotionId: promo.id,
      grantedByAdmin: promo.granted_by_admin,
      grantedByAdminId: promo.granted_by_admin_id,
      actorId: promo.granted_by_admin_id ?? promo.seller_id,
      reason: promo.reason,
    });
    if (result.success) activated += 1;
  }
  return activated;
}

export async function refreshExpiredSellerPromotions(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: expired } = await admin
    .from("seller_promotions")
    .select("id, seller_id, type")
    .eq("status", "active")
    .lt("ends_at", now)
    .limit(100);

  let count = 0;
  for (const promo of expired ?? []) {
    const products = await fetchActiveSellerProducts(promo.seller_id);
    for (const product of products) {
      let bumpedUntil = product.bumped_until;
      let featuredUntil = product.featured_until;
      if (promo.type === "boost_package") bumpedUntil = null;
      if (promo.type === "store_featured") featuredUntil = null;
      await admin
        .from("products")
        .update({
          bumped_until: bumpedUntil,
          featured_until: featuredUntil,
          promotion_score: computePromotionScore(
            product.bump_count ?? 0,
            bumpedUntil,
            featuredUntil,
          ),
        })
        .eq("id", product.id);
    }
    await admin.from("seller_promotions").update({ status: "expired", updated_at: now }).eq("id", promo.id);
    count += 1;
  }

  if (count > 0) {
    await revalidatePromotionSurfaces();
  }
  return count;
}

export async function notifySellerPromotionsExpiringSoon(): Promise<number> {
  const admin = createAdminClient();
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const { data: rows } = await admin
    .from("seller_promotions")
    .select("id, seller_id, type, ends_at")
    .eq("status", "active")
    .gt("ends_at", now)
    .lte("ends_at", in24h)
    .limit(50);

  const { notifyPromotionExpiringSoon } = await import("@/lib/promotions/notifications");
  let sent = 0;
  for (const row of rows ?? []) {
    if (!row.ends_at) continue;
    await notifyPromotionExpiringSoon({
      userId: row.seller_id,
      promotionLabel: row.type === "store_featured" ? "Featured Store" : "Boost Package",
      endsAt: row.ends_at,
    });
    sent += 1;
  }
  return sent;
}

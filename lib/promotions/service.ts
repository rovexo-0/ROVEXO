import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import {
  BUMP_COOLDOWN_HOURS,
  computeEndsAt,
  getPromotionDuration,
  MAX_BUMPS_PER_DAY,
  type PromotionType,
} from "@/lib/promotions/config";
import { computePromotionScore } from "@/lib/promotions/format";
import type { ListingPromotionRecord } from "@/lib/promotions/types";
import { getAppBaseUrl, getStripeClient, isStripeConfigured, isStripeRequired } from "@/lib/stripe/server";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

type ApplyPromotionInput = {
  sellerId: string;
  productId: string;
  type: PromotionType;
  durationId: string;
  amountCents: number;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  promotionId?: string;
  scheduledStartAt?: string | null;
};

export async function refreshExpiredPromotions(): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  try {
    const admin = createAdminClient();
    await admin.rpc("refresh_expired_promotions");
  } catch {
    // Optional maintenance — must not block product reads or the homepage.
  }
}

export async function markPendingPromotionFailed(
  promotionId: string,
  sellerId?: string,
): Promise<void> {
  const admin = createAdminClient();
  let query = admin
    .from("listing_promotions")
    .update({ status: "failed" })
    .eq("id", promotionId)
    .eq("status", "pending");

  if (sellerId) {
    query = query.eq("seller_id", sellerId);
  }

  await query;
}

async function validateBumpPurchase(
  sellerId: string,
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("last_bumped_at")
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (product?.last_bumped_at) {
    const cooldownMs = BUMP_COOLDOWN_HOURS * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(product.last_bumped_at).getTime();
    if (elapsed < cooldownMs) {
      const minutesLeft = Math.ceil((cooldownMs - elapsed) / 60_000);
      return {
        ok: false,
        error: `Bump cooldown active. Try again in ${minutesLeft} minute(s).`,
      };
    }
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("listing_promotions")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("type", "bump")
    .gte("created_at", dayAgo)
    .in("status", ["pending", "active", "expired"]);

  if ((count ?? 0) >= MAX_BUMPS_PER_DAY) {
    return {
      ok: false,
      error: `Daily bump limit reached (${MAX_BUMPS_PER_DAY} per 24 hours).`,
    };
  }

  return { ok: true };
}

export async function createPendingPromotion(
  sellerId: string,
  productId: string,
  type: PromotionType,
  durationId: string,
  amountCents: number,
): Promise<ListingPromotionRecord | null> {
  const endsAt = computeEndsAt(type, durationId);
  const duration = getPromotionDuration(type, durationId);
  if (!endsAt || !duration) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_promotions")
    .insert({
      product_id: productId,
      seller_id: sellerId,
      type,
      duration_id: durationId,
      ends_at: endsAt.toISOString(),
      amount_cents: amountCents,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapPromotionRow(data);
}

export async function applyListingPromotion(
  input: ApplyPromotionInput,
): Promise<{ success: boolean; endsAt?: string; error?: string }> {
  const duration = getPromotionDuration(input.type, input.durationId);
  if (!duration) {
    return { success: false, error: "Invalid promotion duration." };
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: product, error: productError } = await admin
    .from("products")
    .select(
      "id, seller_id, bump_count, bumped_until, featured_until, title, status, product_images(url, is_primary, sort_order)",
    )
    .eq("id", input.productId)
    .eq("seller_id", input.sellerId)
    .maybeSingle();

  if (productError || !product) {
    return { success: false, error: "Listing not found." };
  }

  if (product.status !== "published") {
    return { success: false, error: "Only published listings can be promoted." };
  }

  if (input.scheduledStartAt) {
    const start = new Date(input.scheduledStartAt);
    if (start.getTime() > now.getTime()) {
      const scheduledEndsAt = computeEndsAt(input.type, input.durationId, start);
      if (!scheduledEndsAt) {
        return { success: false, error: "Invalid promotion duration." };
      }

      const scheduledUpdate = {
        status: "scheduled" as const,
        starts_at: start.toISOString(),
        ends_at: scheduledEndsAt.toISOString(),
        stripe_session_id: input.stripeSessionId ?? null,
        stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
        amount_cents: input.amountCents,
      };

      if (input.promotionId) {
        await admin
          .from("listing_promotions")
          .update(scheduledUpdate)
          .eq("id", input.promotionId)
          .eq("seller_id", input.sellerId);
      } else {
        await admin.from("listing_promotions").insert({
          product_id: input.productId,
          seller_id: input.sellerId,
          type: input.type,
          duration_id: input.durationId,
          ...scheduledUpdate,
        });
      }

      return { success: true, endsAt: scheduledEndsAt.toISOString() };
    }
  }

  const endsAt = computeEndsAt(input.type, input.durationId, now);
  if (!endsAt) {
    return { success: false, error: "Invalid promotion duration." };
  }

  let bumpedUntil = product.bumped_until;
  let featuredUntil = product.featured_until;
  let bumpCount = product.bump_count ?? 0;

  if (input.type === "bump") {
    const existingBumpEnd = product.bumped_until ? new Date(product.bumped_until) : null;
    const base = existingBumpEnd && existingBumpEnd.getTime() > now.getTime() ? existingBumpEnd : now;
    const extended = computeEndsAt("bump", input.durationId, base);
    bumpedUntil = extended?.toISOString() ?? endsAt.toISOString();
    bumpCount += 1;
  } else {
    const existingFeatureEnd = product.featured_until ? new Date(product.featured_until) : null;
    const base = existingFeatureEnd && existingFeatureEnd.getTime() > now.getTime() ? existingFeatureEnd : now;
    const extended = computeEndsAt("feature", input.durationId, base);
    featuredUntil = extended?.toISOString() ?? endsAt.toISOString();
  }

  const promotionScore = computePromotionScore(bumpCount, bumpedUntil, featuredUntil);
  const effectiveEndsAt =
    (input.type === "bump" ? bumpedUntil : featuredUntil) ?? endsAt.toISOString();

  const updatePayload =
    input.type === "bump"
      ? {
          bump_count: bumpCount,
          last_bumped_at: now.toISOString(),
          bumped_until: bumpedUntil,
          promotion_score: promotionScore,
        }
      : {
          featured_until: featuredUntil,
          promotion_score: promotionScore,
        };

  const { error: updateError } = await admin
    .from("products")
    .update(updatePayload)
    .eq("id", input.productId)
    .eq("seller_id", input.sellerId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  if (input.promotionId) {
    await admin
      .from("listing_promotions")
      .update({
        status: "active",
        starts_at: now.toISOString(),
        ends_at: effectiveEndsAt,
        stripe_session_id: input.stripeSessionId ?? null,
        stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
        amount_cents: input.amountCents,
      })
      .eq("id", input.promotionId)
      .eq("seller_id", input.sellerId);
  } else {
    const { data: inserted } = await admin
      .from("listing_promotions")
      .insert({
        product_id: input.productId,
        seller_id: input.sellerId,
        type: input.type,
        duration_id: input.durationId,
        starts_at: now.toISOString(),
        ends_at: effectiveEndsAt,
        amount_cents: input.amountCents,
        stripe_session_id: input.stripeSessionId ?? null,
        stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
        status: "active",
      })
      .select("id")
      .single();

    input.promotionId = inserted?.id ?? input.promotionId;
  }

  const images = [...(product.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );

  if (input.promotionId) {
    await recordPromotionWalletTransaction({
      sellerId: input.sellerId,
      promotionId: input.promotionId,
      productTitle: product.title,
      productImageUrl: images[0]?.url ?? PRODUCT_IMAGE_FALLBACK,
      amountCents: input.amountCents,
      type: input.type,
      durationId: input.durationId,
      stripeSessionId: input.stripeSessionId,
      stripePaymentIntentId: input.stripePaymentIntentId,
    });

    const { data: sellerProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", input.sellerId)
      .maybeSingle();

    const { notifyPromotionPurchased } = await import("@/lib/orders/notifications");
    await notifyPromotionPurchased({
      sellerId: input.sellerId,
      sellerEmail: sellerProfile?.email ?? "",
      productTitle: product.title,
      type: input.type,
      amountCents: input.amountCents,
    });
  }

  return { success: true, endsAt: effectiveEndsAt ?? undefined };
}

export async function createPromotionCheckoutSession(input: {
  sellerId: string;
  productId: string;
  type: PromotionType;
  durationId: string;
  scheduledStartAt?: string | null;
}): Promise<{ url: string } | { error: string }> {
  const duration = getPromotionDuration(input.type, input.durationId);
  if (!duration) {
    return { error: "Invalid promotion duration." };
  }

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, title, status")
    .eq("id", input.productId)
    .eq("seller_id", input.sellerId)
    .maybeSingle();

  if (!product) {
    return { error: "Listing not found." };
  }

  if (product.status !== "published") {
    return { error: "Only published listings can be promoted." };
  }

  if (input.type === "bump") {
    const bumpCheck = await validateBumpPurchase(input.sellerId, input.productId);
    if (!bumpCheck.ok) {
      return { error: bumpCheck.error };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isStripeConfigured()) {
    if (isStripeRequired()) {
      return { error: "Promotion payments are not configured." };
    }

    const result = await applyListingPromotion({
      sellerId: input.sellerId,
      productId: input.productId,
      type: input.type,
      durationId: input.durationId,
      amountCents: duration.priceCents,
      scheduledStartAt: input.scheduledStartAt,
    });

    if (!result.success) {
      return { error: result.error ?? "Unable to apply promotion." };
    }

    const params = new URLSearchParams({
      promotion: "success",
      type: input.type,
    });
    return { url: `${getAppBaseUrl()}/seller/listings?${params.toString()}` };
  }

  const pending = await createPendingPromotion(
    input.sellerId,
    input.productId,
    input.type,
    input.durationId,
    duration.priceCents,
  );

  if (!pending) {
    return { error: "Unable to start promotion checkout." };
  }

  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl();
  const label = input.type === "bump" ? "Bump listing" : "Feature listing";

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
            unit_amount: duration.priceCents,
            product_data: {
              name: `${label}: ${product.title}`,
              description: `${duration.label} — ${product.title}`,
            },
          },
        },
      ],
    metadata: {
      checkoutType: "promotion",
      promotionId: pending.id,
        productId: input.productId,
        sellerId: input.sellerId,
        type: input.type,
        durationId: input.durationId,
        amountCents: String(duration.priceCents),
        scheduledStartAt: input.scheduledStartAt ?? "",
      },
      success_url: `${baseUrl}/seller/listings?promotion=success&type=${input.type}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/seller/listings?promotion=cancelled&promotion_id=${pending.id}`,
    },
    {
      idempotencyKey: `promo-checkout-${pending.id}`,
    },
  );

  if (!session.url) {
    return { error: "Unable to create Stripe checkout session." };
  }

  const admin = createAdminClient();
  await admin
    .from("listing_promotions")
    .update({ stripe_session_id: session.id })
    .eq("id", pending.id);

  return { url: session.url };
}

export async function fulfillPromotionFromStripeSession(
  session: {
    id: string;
    metadata: Record<string, string | undefined> | null;
    payment_intent?: string | { id: string } | null;
  },
): Promise<{ success: boolean; error?: string }> {
  const metadata = session.metadata ?? {};
  const promotionId = metadata.promotionId;
  const productId = metadata.productId;
  const sellerId = metadata.sellerId;
  const type = metadata.type as PromotionType | undefined;
  const durationId = metadata.durationId;
  const amountCents = Number(metadata.amountCents ?? 0);
  const scheduledStartAt = metadata.scheduledStartAt || null;

  if (!promotionId || !productId || !sellerId || !type || !durationId) {
    return { success: false, error: "Missing promotion metadata." };
  }

  const admin = createAdminClient();

  if (session.id) {
    const { data: bySession } = await admin
      .from("listing_promotions")
      .select("status")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (bySession?.status === "active") {
      return { success: true };
    }
  }

  const { data: existing } = await admin
    .from("listing_promotions")
    .select("status")
    .eq("id", promotionId)
    .maybeSingle();

  if (existing?.status === "active") {
    return { success: true };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  return applyListingPromotion({
    sellerId,
    productId,
    type,
    durationId,
    amountCents,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    promotionId,
    scheduledStartAt,
  });
}

function mapPromotionRow(row: {
  id: string;
  product_id: string;
  seller_id: string;
  type: string;
  duration_id: string;
  starts_at: string;
  ends_at: string;
  amount_cents: number;
  stripe_session_id: string | null;
  status: string;
}): ListingPromotionRecord {
  return {
    id: row.id,
    productId: row.product_id,
    sellerId: row.seller_id,
    type: row.type as PromotionType,
    durationId: row.duration_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    amountCents: row.amount_cents,
    stripeSessionId: row.stripe_session_id,
    status: row.status as ListingPromotionRecord["status"],
  };
}

export async function confirmPromotionCheckoutSession(
  sessionId: string,
  sellerId: string,
): Promise<{ success: boolean; error?: string }> {
  if (isStripeRequired()) {
    return { success: false, error: "Promotion payments are not configured." };
  }

  if (!isStripeConfigured()) {
    return { success: true };
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.sellerId !== sellerId) {
    return { success: false, error: "Promotion session does not belong to this seller." };
  }

  if (session.payment_status !== "paid") {
    return { success: false, error: "Payment not completed." };
  }

  return fulfillPromotionFromStripeSession(session);
}

export async function getActiveSellerPromotions(
  sellerId: string,
): Promise<
  Array<{
    productId: string;
    title: string;
    imageUrl: string;
    type: PromotionType;
    endsAt: string;
  }>
> {
  await refreshExpiredPromotions();

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, title, bumped_until, featured_until, product_images(url, is_primary, sort_order)")
    .eq("seller_id", sellerId)
    .eq("status", "published");

  if (!products?.length) return [];

  const now = Date.now();
  const results: Array<{
    productId: string;
    title: string;
    imageUrl: string;
    type: PromotionType;
    endsAt: string;
  }> = [];

  for (const product of products) {
    const images = [...(product.product_images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    );
    const imageUrl = images[0]?.url ?? PRODUCT_IMAGE_FALLBACK;

    if (product.bumped_until && new Date(product.bumped_until).getTime() > now) {
      results.push({
        productId: product.id,
        title: product.title,
        imageUrl,
        type: "bump",
        endsAt: product.bumped_until,
      });
    }

    if (product.featured_until && new Date(product.featured_until).getTime() > now) {
      results.push({
        productId: product.id,
        title: product.title,
        imageUrl,
        type: "feature",
        endsAt: product.featured_until,
      });
    }
  }

  return results.sort(
    (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
  );
}

async function recordPromotionWalletTransaction(input: {
  sellerId: string;
  promotionId: string;
  productTitle: string;
  productImageUrl: string;
  amountCents: number;
  type: PromotionType;
  durationId: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const orderNumber = `PROMO-${input.promotionId.slice(0, 8).toUpperCase()}`;

  const { data: existing } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("user_id", input.sellerId)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (existing) return;

  let { data: wallet } = await admin
    .from("wallets")
    .select("id")
    .eq("user_id", input.sellerId)
    .maybeSingle();

  if (!wallet) {
    const { data: created } = await admin
      .from("wallets")
      .insert({ user_id: input.sellerId })
      .select("id")
      .single();
    wallet = created;
  }

  if (!wallet) return;

  const label = input.type === "bump" ? "Listing Bump" : "Featured Listing";

  await admin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: input.sellerId,
    order_number: orderNumber,
    product_title: `${label}: ${input.productTitle}`,
    product_image_url: input.productImageUrl,
    amount: -(input.amountCents / 100),
    status: "completed",
    type: "promotion",
    description: [
      input.type,
      input.durationId,
      input.stripePaymentIntentId ? `pi:${input.stripePaymentIntentId}` : null,
      input.stripeSessionId ? `cs:${input.stripeSessionId}` : null,
    ]
      .filter(Boolean)
      .join("|"),
  });
}

export async function getSellerPromotionStats(sellerId: string): Promise<
  import("@/lib/promotions/types").SellerPromotionStats
> {
  const admin = createAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: activeRows }, { data: monthRows }, { data: totalRows }] = await Promise.all([
    admin
      .from("listing_promotions")
      .select("id")
      .eq("seller_id", sellerId)
      .eq("status", "active"),
    admin
      .from("listing_promotions")
      .select("amount_cents")
      .eq("seller_id", sellerId)
      .in("status", ["active", "expired"])
      .gte("created_at", monthStart.toISOString()),
    admin
      .from("listing_promotions")
      .select("amount_cents")
      .eq("seller_id", sellerId)
      .in("status", ["active", "expired"]),
  ]);

  return {
    activeCount: activeRows?.length ?? 0,
    monthSpendCents: (monthRows ?? []).reduce((sum, row) => sum + row.amount_cents, 0),
    totalSpendCents: (totalRows ?? []).reduce((sum, row) => sum + row.amount_cents, 0),
  };
}

export async function getSellerPromotionHistory(
  sellerId: string,
  limit = 10,
): Promise<import("@/lib/promotions/types").SellerPromotionHistoryItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("listing_promotions")
    .select(
      `
      id,
      product_id,
      type,
      duration_id,
      amount_cents,
      status,
      starts_at,
      ends_at,
      stripe_session_id,
      stripe_payment_intent_id,
      created_at,
      products:product_id (
        title,
        product_images ( url, is_primary, sort_order )
      )
    `,
    )
    .eq("seller_id", sellerId)
    .in("status", ["active", "expired", "failed"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const product = row.products as {
      title: string;
      product_images?: Array<{ url: string; is_primary: boolean; sort_order: number }>;
    } | null;
    const images = [...(product?.product_images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    );

    return {
      id: row.id,
      productId: row.product_id,
      productTitle: product?.title ?? "Listing",
      productImageUrl: images[0]?.url ?? PRODUCT_IMAGE_FALLBACK,
      type: row.type as PromotionType,
      durationId: row.duration_id,
      amountCents: row.amount_cents,
      status: row.status as import("@/lib/promotions/types").ListingPromotionRecord["status"],
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      stripeSessionId: row.stripe_session_id,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      createdAt: row.created_at,
    };
  });
}

export async function activateScheduledPromotions(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: scheduled } = await admin
    .from("listing_promotions")
    .select("id, product_id, seller_id, type, duration_id, amount_cents, stripe_session_id, stripe_payment_intent_id")
    .eq("status", "scheduled")
    .lte("starts_at", now)
    .limit(50);

  let activated = 0;

  for (const promo of scheduled ?? []) {
    const result = await applyListingPromotion({
      sellerId: promo.seller_id,
      productId: promo.product_id,
      type: promo.type as PromotionType,
      durationId: promo.duration_id,
      amountCents: promo.amount_cents,
      stripeSessionId: promo.stripe_session_id,
      stripePaymentIntentId: promo.stripe_payment_intent_id,
      promotionId: promo.id,
    });

    if (result.success) {
      activated += 1;
    }
  }

  return activated;
}

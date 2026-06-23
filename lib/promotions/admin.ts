import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeEndsAt,
  getPromotionDuration,
  type PromotionType,
} from "@/lib/promotions/config";
import { computePromotionScore } from "@/lib/promotions/format";
import { applyListingPromotion } from "@/lib/promotions/service";
import type { AdminPromotionRow, AdminPromotionStats } from "@/lib/promotions/admin-types";
import { getAdminPromotionAnalytics } from "@/lib/promotions/analytics";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

function mapAdminPromotionRow(row: {
  id: string;
  product_id: string;
  seller_id: string;
  type: string;
  duration_id: string;
  amount_cents: number;
  status: string;
  starts_at: string;
  ends_at: string;
  stripe_session_id: string | null;
  created_at: string;
  products: {
    title: string;
    product_images?: Array<{ url: string; is_primary: boolean; sort_order: number }>;
  } | null;
  profiles: { full_name: string } | null;
}): AdminPromotionRow {
  const images = [...(row.products?.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );

  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.products?.title ?? "Listing",
    productImageUrl: images[0]?.url ?? PRODUCT_IMAGE_FALLBACK,
    sellerId: row.seller_id,
    sellerName: row.profiles?.full_name ?? "Seller",
    type: row.type as PromotionType,
    durationId: row.duration_id,
    amountCents: row.amount_cents,
    status: row.status as AdminPromotionRow["status"],
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    stripeSessionId: row.stripe_session_id,
    createdAt: row.created_at,
  };
}

export async function listAdminPromotions(input?: {
  status?: string;
  type?: PromotionType;
  query?: string;
  limit?: number;
}): Promise<AdminPromotionRow[]> {
  const admin = createAdminClient();
  let query = admin
    .from("listing_promotions")
    .select(
      `
      *,
      products:product_id (
        title,
        product_images ( url, is_primary, sort_order )
      ),
      profiles:seller_id ( full_name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 100);

  if (input?.status) {
    query = query.eq("status", input.status);
  }

  if (input?.type) {
    query = query.eq("type", input.type);
  }

  const { data } = await query;
  let rows = (data ?? []).map((row) =>
    mapAdminPromotionRow({
      ...row,
      products: row.products as {
        title: string;
        product_images?: Array<{ url: string; is_primary: boolean; sort_order: number }>;
      } | null,
      profiles: row.profiles as { full_name: string } | null,
    }),
  );

  if (input?.query?.trim()) {
    const term = input.query.trim().toLowerCase();
    rows = rows.filter(
      (row) =>
        row.productTitle.toLowerCase().includes(term) ||
        row.sellerName.toLowerCase().includes(term) ||
        row.id.toLowerCase().includes(term),
    );
  }

  return rows;
}

export async function getAdminPromotionStats(): Promise<AdminPromotionStats> {
  const admin = createAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: allRows }, analytics] = await Promise.all([
    admin.from("listing_promotions").select("type, status, amount_cents, created_at"),
    getAdminPromotionAnalytics(monthStart.toISOString()),
  ]);

  const rows = allRows ?? [];
  const monthRows = rows.filter((row) => new Date(row.created_at) >= monthStart);

  return {
    totalPromotions: rows.length,
    activePromotions: rows.filter((row) => row.status === "active").length,
    revenueCents: rows
      .filter((row) => row.status === "active" || row.status === "expired")
      .reduce((sum, row) => sum + row.amount_cents, 0),
    monthRevenueCents: monthRows
      .filter((row) => row.status === "active" || row.status === "expired")
      .reduce((sum, row) => sum + row.amount_cents, 0),
    bumpCount: rows.filter((row) => row.type === "bump").length,
    featureCount: rows.filter((row) => row.type === "feature").length,
    impressions: analytics.impressions,
    clicks: analytics.clicks,
    ctr: analytics.ctr,
  };
}

async function loadPromotion(promotionId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("listing_promotions")
    .select("id, product_id, seller_id, type, duration_id, status")
    .eq("id", promotionId)
    .maybeSingle();

  return data;
}

export async function adminActivatePromotion(promotionId: string): Promise<{ success: boolean; error?: string }> {
  const promotion = await loadPromotion(promotionId);
  if (!promotion) {
    return { success: false, error: "Promotion not found." };
  }

  const duration = getPromotionDuration(promotion.type as PromotionType, promotion.duration_id);
  if (!duration) {
    return { success: false, error: "Invalid duration." };
  }

  return applyListingPromotion({
    sellerId: promotion.seller_id,
    productId: promotion.product_id,
    type: promotion.type as PromotionType,
    durationId: promotion.duration_id,
    amountCents: 0,
    promotionId: promotion.id,
  });
}

export async function adminSuspendPromotion(promotionId: string): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const promotion = await loadPromotion(promotionId);
  if (!promotion) {
    return { success: false, error: "Promotion not found." };
  }

  const { data: product } = await admin
    .from("products")
    .select("bump_count, bumped_until, featured_until")
    .eq("id", promotion.product_id)
    .maybeSingle();

  if (!product) {
    return { success: false, error: "Listing not found." };
  }

  let bumpedUntil = product.bumped_until;
  let featuredUntil = product.featured_until;

  if (promotion.type === "bump") {
    bumpedUntil = null;
  } else {
    featuredUntil = null;
  }

  const promotionScore = computePromotionScore(
    product.bump_count ?? 0,
    bumpedUntil,
    featuredUntil,
  );

  await admin
    .from("products")
    .update({
      bumped_until: bumpedUntil,
      featured_until: featuredUntil,
      promotion_score: promotionScore,
    })
    .eq("id", promotion.product_id);

  await admin
    .from("listing_promotions")
    .update({ status: "suspended" })
    .eq("id", promotionId);

  return { success: true };
}

export async function adminExpirePromotion(promotionId: string): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const promotion = await loadPromotion(promotionId);
  if (!promotion) {
    return { success: false, error: "Promotion not found." };
  }

  const now = new Date().toISOString();

  const { data: product } = await admin
    .from("products")
    .select("bump_count, bumped_until, featured_until")
    .eq("id", promotion.product_id)
    .maybeSingle();

  if (product) {
    const bumpedUntil =
      promotion.type === "bump" && product.bumped_until ? now : product.bumped_until;
    const featuredUntil =
      promotion.type === "feature" && product.featured_until ? now : product.featured_until;

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
      .eq("id", promotion.product_id);
  }

  await admin
    .from("listing_promotions")
    .update({ status: "expired", ends_at: now })
    .eq("id", promotionId);

  return { success: true };
}

export async function adminRefundPromotion(
  promotionId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: promotion } = await admin
    .from("listing_promotions")
    .select("id, stripe_payment_intent_id, amount_cents, status")
    .eq("id", promotionId)
    .maybeSingle();

  if (!promotion) {
    return { success: false, error: "Promotion not found." };
  }

  if (!promotion.stripe_payment_intent_id || promotion.amount_cents <= 0) {
    return { success: false, error: "No refundable payment found." };
  }

  const { isStripeConfigured, getStripeClient } = await import("@/lib/stripe/server");
  if (!isStripeConfigured()) {
    return { success: false, error: "Stripe is not configured." };
  }

  const stripe = getStripeClient();
  await stripe.refunds.create(
    {
      payment_intent: promotion.stripe_payment_intent_id,
      amount: promotion.amount_cents,
      metadata: { promotionId },
    },
    { idempotencyKey: `promotion-refund-${promotionId}` },
  );

  await adminExpirePromotion(promotionId);
  await admin
    .from("listing_promotions")
    .update({ status: "failed" })
    .eq("id", promotionId);

  return { success: true };
}

export async function adminCreateManualPromotion(input: {
  sellerId: string;
  productId: string;
  type: PromotionType;
  durationId: string;
}): Promise<{ success: boolean; error?: string }> {
  const duration = getPromotionDuration(input.type, input.durationId);
  if (!duration) {
    return { success: false, error: "Invalid duration." };
  }

  const endsAt = computeEndsAt(input.type, input.durationId);
  if (!endsAt) {
    return { success: false, error: "Invalid duration." };
  }

  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("listing_promotions")
    .insert({
      product_id: input.productId,
      seller_id: input.sellerId,
      type: input.type,
      duration_id: input.durationId,
      ends_at: endsAt.toISOString(),
      amount_cents: 0,
      status: "pending",
    })
    .select("id")
    .single();

  if (!pending) {
    return { success: false, error: "Unable to create promotion." };
  }

  return applyListingPromotion({
    sellerId: input.sellerId,
    productId: input.productId,
    type: input.type,
    durationId: input.durationId,
    amountCents: 0,
    promotionId: pending.id,
  });
}

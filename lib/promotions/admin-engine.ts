import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminActivatePromotion,
  adminCreateManualPromotion,
  adminExpirePromotion,
  adminSuspendPromotion,
} from "@/lib/promotions/admin";
import { writePromotionAuditLog } from "@/lib/promotions/audit-log";
import type {
  AdminPromotionAction,
  PromotionScope,
  PromotionSource,
} from "@/lib/promotions/canonical-engine";
import {
  ADMIN_DURATION_OPTIONS,
  resolveAdminDurationDays,
  toCanonicalStatus,
} from "@/lib/promotions/canonical-engine";
import { computeEndsAt, type PromotionType } from "@/lib/promotions/config";
import { computePromotionScore } from "@/lib/promotions/format";
import { notifyPromotionLifecycle } from "@/lib/promotions/notifications";
import { revalidatePromotionSurfaces } from "@/lib/promotions/revalidate-surfaces";
import {
  applySellerPromotion,
  grantSellerPromotion,
  type SellerPromotionType,
} from "@/lib/promotions/seller-promotions";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";

export type PromotionUserSearchResult = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  storeName: string | null;
};

export type UserPromotionListingRow = {
  id: string;
  scope: "listing";
  productId: string;
  productTitle: string;
  type: string;
  durationId: string;
  status: string;
  canonicalStatus: string;
  source: string;
  startsAt: string;
  endsAt: string;
  amountCents: number;
  createdAt: string;
};

export type UserPromotionSellerRow = {
  id: string;
  scope: "seller";
  type: string;
  packageId: string;
  status: string;
  canonicalStatus: string;
  source: string;
  startsAt: string | null;
  endsAt: string | null;
  amountCents: number;
  grantedByAdmin: boolean;
  reason: string | null;
  createdAt: string;
};

export type UserPromotionProfile = {
  user: PromotionUserSearchResult;
  listingPromotions: UserPromotionListingRow[];
  sellerPromotions: UserPromotionSellerRow[];
};

type ActorContext = {
  actorId: string;
  actorName?: string | null;
  actorUsername?: string | null;
  ipAddress?: string | null;
};

export async function searchPromotionUsers(query: string): Promise<PromotionUserSearchResult[]> {
  const term = query.trim();
  if (!term) return [];

  const admin = createAdminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);

  if (isUuid) {
    const [{ data: profile }, { data: product }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, username, email, full_name, seller_profiles(bio)")
        .eq("id", term)
        .maybeSingle(),
      admin.from("products").select("seller_id").eq("id", term).maybeSingle(),
    ]);

    const userIds = new Set<string>();
    if (profile?.id) userIds.add(profile.id);
    if (product?.seller_id) userIds.add(product.seller_id);

    const results: PromotionUserSearchResult[] = [];
    if (profile) {
      const seller = profile.seller_profiles as { bio?: string } | null;
      results.push({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        fullName: profile.full_name,
        storeName: seller?.bio ?? profile.full_name,
      });
    }

    if (product?.seller_id && product.seller_id !== profile?.id) {
      const { data: sellerProfile } = await admin
        .from("profiles")
        .select("id, username, email, full_name, seller_profiles(bio)")
        .eq("id", product.seller_id)
        .maybeSingle();
      if (sellerProfile) {
        const seller = sellerProfile.seller_profiles as { bio?: string } | null;
        results.push({
          id: sellerProfile.id,
          username: sellerProfile.username,
          email: sellerProfile.email,
          fullName: sellerProfile.full_name,
          storeName: seller?.bio ?? sellerProfile.full_name,
        });
      }
    }

    return results;
  }

  const pattern = `%${term}%`;
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username, email, full_name, seller_profiles(bio)")
    .or(`username.ilike.${pattern},email.ilike.${pattern},full_name.ilike.${pattern}`)
    .limit(20);

  const byId = new Map<string, PromotionUserSearchResult>();

  for (const row of profiles ?? []) {
    const seller = row.seller_profiles as { bio?: string } | null;
    byId.set(row.id, {
      id: row.id,
      username: row.username,
      email: row.email,
      fullName: row.full_name,
      storeName: seller?.bio ?? row.full_name,
    });
  }

  const { data: bioMatches } = await admin
    .from("seller_profiles")
    .select("id, bio")
    .ilike("bio", pattern)
    .limit(20);

  if (bioMatches?.length) {
    const bioIds = bioMatches.map((row) => row.id);
    const { data: bioProfiles } = await admin
      .from("profiles")
      .select("id, username, email, full_name")
      .in("id", bioIds);
    for (const row of bioProfiles ?? []) {
      const store = bioMatches.find((s) => s.id === row.id);
      byId.set(row.id, {
        id: row.id,
        username: row.username,
        email: row.email,
        fullName: row.full_name,
        storeName: store?.bio ?? row.full_name,
      });
    }
  }

  const { data: listingMatches } = await admin
    .from("products")
    .select("seller_id, title")
    .or(`title.ilike.${pattern}`)
    .limit(10);

  if (listingMatches?.length) {
    const sellerIds = [...new Set(listingMatches.map((row) => row.seller_id))];
    const { data: listingSellers } = await admin
      .from("profiles")
      .select("id, username, email, full_name, seller_profiles(bio)")
      .in("id", sellerIds);
    for (const row of listingSellers ?? []) {
      const seller = row.seller_profiles as { bio?: string } | null;
      byId.set(row.id, {
        id: row.id,
        username: row.username,
        email: row.email,
        fullName: row.full_name,
        storeName: seller?.bio ?? row.full_name,
      });
    }
  }

  return Array.from(byId.values()).slice(0, 25);
}

export async function getUserPromotionProfile(userId: string): Promise<UserPromotionProfile | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, email, full_name, seller_profiles(bio)")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const seller = profile.seller_profiles as { bio?: string } | null;

  const [{ data: listingRows }, { data: sellerRows }] = await Promise.all([
    admin
      .from("listing_promotions")
      .select("*, products:product_id(title)")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("seller_promotions")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    user: {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      fullName: profile.full_name,
      storeName: seller?.bio ?? profile.full_name,
    },
    listingPromotions: (listingRows ?? []).map((row) => ({
      id: row.id,
      scope: "listing" as const,
      productId: row.product_id,
      productTitle: (row.products as { title?: string } | null)?.title ?? "Listing",
      type: row.type,
      durationId: row.duration_id,
      status: row.status,
      canonicalStatus: toCanonicalStatus(row.status),
      source: (row as { source?: string }).source ?? "purchased",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      amountCents: row.amount_cents,
      createdAt: row.created_at,
    })),
    sellerPromotions: (sellerRows ?? []).map((row) => ({
      id: row.id,
      scope: "seller" as const,
      type: row.type,
      packageId: row.package_id,
      status: row.status,
      canonicalStatus: toCanonicalStatus(row.status),
      source: (row as { source?: string }).source ?? "purchased",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      amountCents: row.amount_cents,
      grantedByAdmin: row.granted_by_admin,
      reason: row.reason,
      createdAt: row.created_at,
    })),
  };
}

async function loadActorProfile(actorId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("username, full_name")
    .eq("id", actorId)
    .maybeSingle();
  return data;
}

async function logAction(
  ctx: ActorContext,
  input: {
    userId: string;
    username?: string | null;
    promotionType: string;
    promotionSource?: PromotionSource | string | null;
    listingId?: string | null;
    listingPromotionId?: string | null;
    sellerPromotionId?: string | null;
    previousStatus?: string | null;
    newStatus: string;
    reason?: string | null;
    durationLabel?: string | null;
    activationDate?: string | null;
    expirationDate?: string | null;
  },
): Promise<void> {
  await writePromotionAuditLog({
    actorId: ctx.actorId,
    actorName: ctx.actorName,
    actorUsername: ctx.actorUsername,
    userId: input.userId,
    username: input.username,
    storeId: input.userId,
    promotionType: input.promotionType,
    promotionSource: input.promotionSource,
    listingId: input.listingId,
    listingPromotionId: input.listingPromotionId,
    sellerPromotionId: input.sellerPromotionId,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    reason: input.reason,
    durationLabel: input.durationLabel,
    activationDate: input.activationDate,
    expirationDate: input.expirationDate,
    ipAddress: ctx.ipAddress,
  });
}

function addDays(from: Date, days: number): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

async function clearSellerPromotionEffects(
  sellerId: string,
  type: SellerPromotionType,
): Promise<void> {
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, bump_count, bumped_until, featured_until")
    .eq("seller_id", sellerId)
    .eq("status", "published");

  const now = new Date().toISOString();
  for (const product of products ?? []) {
    const bumpedUntil = type === "boost_package" ? null : product.bumped_until;
    const featuredUntil = type === "store_featured" ? null : product.featured_until;
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
        ...(type === "boost_package" ? { last_bumped_at: now } : {}),
      })
      .eq("id", product.id);
  }
}

async function executeListingAction(
  ctx: ActorContext,
  promotionId: string,
  action: AdminPromotionAction,
  options: {
    reason?: string;
    scheduledStartAt?: string;
    daysDelta?: number;
    targetUserId?: string;
    targetProductId?: string;
    source?: PromotionSource;
  },
): Promise<{ success: boolean; error?: string; newPromotionId?: string }> {
  const admin = createAdminClient();
  const { data: promo } = await admin
    .from("listing_promotions")
    .select("*")
    .eq("id", promotionId)
    .maybeSingle();

  if (!promo) return { success: false, error: "Promotion not found." };

  const { data: userProfile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", promo.seller_id)
    .maybeSingle();

  const source = options.source ?? (promo as { source?: string }).source ?? "purchased";

  if (action === "activate") {
    const result = await adminActivatePromotion(promotionId);
    if (result.success) {
      await logAction(ctx, {
        userId: promo.seller_id,
        username: userProfile?.username,
        promotionType: promo.type,
        promotionSource: source,
        listingId: promo.product_id,
        listingPromotionId: promotionId,
        previousStatus: promo.status,
        newStatus: "active",
        reason: options.reason,
      });
      await notifyPromotionLifecycle({
        userId: promo.seller_id,
        action: "activate",
        promotionLabel: promo.type,
      });
      await revalidatePromotionSurfaces();
    }
    return result;
  }

  if (action === "schedule") {
    if (!options.scheduledStartAt) {
      return { success: false, error: "Scheduled start date is required." };
    }
    const endsAt = computeEndsAt(promo.type as PromotionType, promo.duration_id, new Date(options.scheduledStartAt));
    if (!endsAt) return { success: false, error: "Invalid duration." };

    await admin
      .from("listing_promotions")
      .update({
        status: "scheduled",
        starts_at: options.scheduledStartAt,
        ends_at: endsAt.toISOString(),
        source,
        reason: options.reason ?? null,
      })
      .eq("id", promotionId);

    await logAction(ctx, {
      userId: promo.seller_id,
        username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: source,
      listingId: promo.product_id,
      listingPromotionId: promotionId,
      previousStatus: promo.status,
      newStatus: "scheduled",
      reason: options.reason,
      activationDate: options.scheduledStartAt,
      expirationDate: endsAt.toISOString(),
    });
    await notifyPromotionLifecycle({ userId: promo.seller_id, action: "schedule", promotionLabel: promo.type });
    await revalidatePromotionSurfaces();
    return { success: true };
  }

  if (action === "pause") {
    await adminSuspendPromotion(promotionId);
    await admin
      .from("listing_promotions")
      .update({ status: "paused", paused_at: new Date().toISOString() })
      .eq("id", promotionId);
    await logAction(ctx, {
      userId: promo.seller_id,
        username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: source,
      listingId: promo.product_id,
      listingPromotionId: promotionId,
      previousStatus: promo.status,
      newStatus: "paused",
      reason: options.reason,
    });
    await notifyPromotionLifecycle({ userId: promo.seller_id, action: "pause", promotionLabel: promo.type });
    await revalidatePromotionSurfaces();
    return { success: true };
  }

  if (action === "resume") {
    const result = await adminActivatePromotion(promotionId);
    if (result.success) {
      await admin.from("listing_promotions").update({ status: "active", paused_at: null }).eq("id", promotionId);
      await logAction(ctx, {
        userId: promo.seller_id,
        username: userProfile?.username,
        promotionType: promo.type,
        promotionSource: source,
        listingId: promo.product_id,
        listingPromotionId: promotionId,
        previousStatus: promo.status,
        newStatus: "active",
        reason: options.reason,
      });
      await notifyPromotionLifecycle({ userId: promo.seller_id, action: "resume", promotionLabel: promo.type });
      await revalidatePromotionSurfaces();
    }
    return result;
  }

  if (action === "extend" || action === "reduce") {
    const delta = options.daysDelta ?? 0;
    if (delta <= 0) return { success: false, error: "Duration delta must be positive." };
    const sign = action === "extend" ? 1 : -1;
    const currentEnd = new Date(promo.ends_at);
    const newEnd = addDays(currentEnd, sign * delta);

    const { data: product } = await admin
      .from("products")
      .select("bump_count, bumped_until, featured_until")
      .eq("id", promo.product_id)
      .maybeSingle();

    if (product && promo.status === "active") {
      const bumpedUntil =
        promo.type === "bump" && product.bumped_until
          ? addDays(new Date(product.bumped_until), sign * delta).toISOString()
          : product.bumped_until;
      const featuredUntil =
        promo.type === "feature" && product.featured_until
          ? addDays(new Date(product.featured_until), sign * delta).toISOString()
          : product.featured_until;

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
        .eq("id", promo.product_id);
    }

    await admin.from("listing_promotions").update({ ends_at: newEnd.toISOString() }).eq("id", promotionId);
    await logAction(ctx, {
      userId: promo.seller_id,
        username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: source,
      listingId: promo.product_id,
      listingPromotionId: promotionId,
      previousStatus: promo.status,
      newStatus: promo.status,
      reason: options.reason ?? `${action} ${delta} day(s)`,
      expirationDate: newEnd.toISOString(),
    });
    await notifyPromotionLifecycle({ userId: promo.seller_id, action: action === "extend" ? "extend" : "expire", promotionLabel: promo.type });
    await revalidatePromotionSurfaces();
    return { success: true };
  }

  if (action === "expire") {
    await adminExpirePromotion(promotionId);
    await logAction(ctx, {
      userId: promo.seller_id,
        username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: source,
      listingId: promo.product_id,
      listingPromotionId: promotionId,
      previousStatus: promo.status,
      newStatus: "expired",
      reason: options.reason,
    });
    await notifyPromotionLifecycle({ userId: promo.seller_id, action: "expire", promotionLabel: promo.type });
    await revalidatePromotionSurfaces();
    return { success: true };
  }

  if (action === "revoke") {
    await adminExpirePromotion(promotionId);
    await admin.from("listing_promotions").update({ status: "revoked" }).eq("id", promotionId);
    await logAction(ctx, {
      userId: promo.seller_id,
        username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: source,
      listingId: promo.product_id,
      listingPromotionId: promotionId,
      previousStatus: promo.status,
      newStatus: "revoked",
      reason: options.reason,
    });
    await notifyPromotionLifecycle({ userId: promo.seller_id, action: "revoke", promotionLabel: promo.type });
    await revalidatePromotionSurfaces();
    return { success: true };
  }

  if (action === "duplicate") {
    const endsAt = computeEndsAt(promo.type as PromotionType, promo.duration_id);
    if (!endsAt) return { success: false, error: "Invalid duration." };
    const { data: copy } = await admin
      .from("listing_promotions")
      .insert({
        product_id: promo.product_id,
        seller_id: promo.seller_id,
        type: promo.type,
        duration_id: promo.duration_id,
        ends_at: endsAt.toISOString(),
        amount_cents: 0,
        status: "pending",
        source: "granted_by_rovexo",
        reason: options.reason ?? "Duplicated by Super Admin",
      })
      .select("id")
      .single();

    if (!copy) return { success: false, error: "Unable to duplicate." };
    await logAction(ctx, {
      userId: promo.seller_id,
        username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: "granted_by_rovexo",
      listingId: promo.product_id,
      listingPromotionId: copy.id,
      previousStatus: null,
      newStatus: "draft",
      reason: options.reason ?? "Duplicated",
    });
    return { success: true, newPromotionId: copy.id };
  }

  if (action === "clone") {
    const targetUserId = options.targetUserId;
    const targetProductId = options.targetProductId;
    if (!targetUserId || !targetProductId) {
      return { success: false, error: "Target user and listing are required to clone." };
    }
    const result = await adminCreateManualPromotion({
      sellerId: targetUserId,
      productId: targetProductId,
      type: promo.type as PromotionType,
      durationId: promo.duration_id,
    });
    if (result.success) {
      await logAction(ctx, {
        userId: targetUserId,
        promotionType: promo.type,
        promotionSource: "granted_by_rovexo",
        listingId: targetProductId,
        previousStatus: null,
        newStatus: "active",
        reason: options.reason ?? `Cloned from ${promotionId}`,
      });
      await revalidatePromotionSurfaces();
    }
    return result;
  }

  return { success: false, error: "Unsupported action." };
}

async function executeSellerAction(
  ctx: ActorContext,
  promotionId: string,
  action: AdminPromotionAction,
  options: {
    reason?: string;
    scheduledStartAt?: string;
    daysDelta?: number;
    targetUserId?: string;
    packageId?: string;
    source?: PromotionSource;
  },
): Promise<{ success: boolean; error?: string; newPromotionId?: string }> {
  const admin = createAdminClient();
  const { data: promo } = await admin
    .from("seller_promotions")
    .select("*")
    .eq("id", promotionId)
    .maybeSingle();

  if (!promo) return { success: false, error: "Promotion not found." };

  const { data: userProfile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", promo.seller_id)
    .maybeSingle();

  const source = options.source ?? (promo as { source?: string }).source ?? "granted_by_rovexo";

  if (action === "activate") {
    const result = await applySellerPromotion({
      sellerId: promo.seller_id,
      type: promo.type as SellerPromotionType,
      packageId: promo.package_id,
      amountCents: promo.amount_cents,
      sellerPromotionId: promo.id,
      grantedByAdmin: promo.granted_by_admin,
      grantedByAdminId: promo.granted_by_admin_id,
      actorId: ctx.actorId,
      reason: options.reason ?? promo.reason,
    });
    if (result.success) {
      await admin.from("seller_promotions").update({ source }).eq("id", promotionId);
      await notifyPromotionLifecycle({
        userId: promo.seller_id,
        action: "activate",
        promotionLabel: promo.type,
      });
      await revalidatePromotionSurfaces();
    }
    return result;
  }

  if (action === "schedule") {
    if (!options.scheduledStartAt) {
      return { success: false, error: "Scheduled start date is required." };
    }
    const days = resolveAdminDurationDays(promo.package_id) ?? 7;
    const endsAt = addDays(new Date(options.scheduledStartAt), days).toISOString();
    await admin
      .from("seller_promotions")
      .update({
        status: "scheduled",
        starts_at: options.scheduledStartAt,
        ends_at: endsAt,
        source,
        reason: options.reason ?? promo.reason,
      })
      .eq("id", promotionId);

    await logAction(ctx, {
      userId: promo.seller_id,
      username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: source,
      sellerPromotionId: promotionId,
      previousStatus: promo.status,
      newStatus: "scheduled",
      reason: options.reason,
      activationDate: options.scheduledStartAt,
      expirationDate: endsAt,
    });
    await notifyPromotionLifecycle({ userId: promo.seller_id, action: "schedule", promotionLabel: promo.type });
    await revalidatePromotionSurfaces();
    return { success: true };
  }

  if (action === "pause") {
    await clearSellerPromotionEffects(promo.seller_id, promo.type as SellerPromotionType);
    await admin
      .from("seller_promotions")
      .update({ status: "paused", paused_at: new Date().toISOString() })
      .eq("id", promotionId);
    await logAction(ctx, {
      userId: promo.seller_id,
      username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: source,
      sellerPromotionId: promotionId,
      previousStatus: promo.status,
      newStatus: "paused",
      reason: options.reason,
    });
    await notifyPromotionLifecycle({ userId: promo.seller_id, action: "pause", promotionLabel: promo.type });
    await revalidatePromotionSurfaces();
    return { success: true };
  }

  if (action === "resume") {
    const result = await applySellerPromotion({
      sellerId: promo.seller_id,
      type: promo.type as SellerPromotionType,
      packageId: promo.package_id,
      amountCents: promo.amount_cents,
      sellerPromotionId: promo.id,
      grantedByAdmin: true,
      grantedByAdminId: ctx.actorId,
      actorId: ctx.actorId,
      reason: options.reason ?? "Resumed by Super Admin",
    });
    if (result.success) {
      await admin.from("seller_promotions").update({ status: "active", paused_at: null }).eq("id", promotionId);
      await notifyPromotionLifecycle({ userId: promo.seller_id, action: "resume", promotionLabel: promo.type });
      await revalidatePromotionSurfaces();
    }
    return result;
  }

  if (action === "extend" || action === "reduce") {
    const delta = options.daysDelta ?? 0;
    if (delta <= 0) return { success: false, error: "Duration delta must be positive." };
    const sign = action === "extend" ? 1 : -1;
    const currentEnd = promo.ends_at ? new Date(promo.ends_at) : new Date();
    const newEnd = addDays(currentEnd, sign * delta).toISOString();

    if (promo.status === "active") {
      await applySellerPromotion({
        sellerId: promo.seller_id,
        type: promo.type as SellerPromotionType,
        packageId: String(delta),
        amountCents: 0,
        sellerPromotionId: promo.id,
        grantedByAdmin: true,
        grantedByAdminId: ctx.actorId,
        actorId: ctx.actorId,
        reason: options.reason ?? `${action} ${delta} day(s)`,
      });
    }

    await admin.from("seller_promotions").update({ ends_at: newEnd }).eq("id", promotionId);
    await logAction(ctx, {
      userId: promo.seller_id,
      username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: source,
      sellerPromotionId: promotionId,
      previousStatus: promo.status,
      newStatus: promo.status,
      reason: options.reason,
      expirationDate: newEnd,
    });
    await notifyPromotionLifecycle({
      userId: promo.seller_id,
      action: action === "extend" ? "extend" : "expire",
      promotionLabel: promo.type,
    });
    await revalidatePromotionSurfaces();
    return { success: true };
  }

  if (action === "expire" || action === "revoke") {
    await clearSellerPromotionEffects(promo.seller_id, promo.type as SellerPromotionType);
    const newStatus = action === "revoke" ? "revoked" : "expired";
    await admin
      .from("seller_promotions")
      .update({ status: newStatus, ends_at: new Date().toISOString() })
      .eq("id", promotionId);
    await logAction(ctx, {
      userId: promo.seller_id,
      username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: source,
      sellerPromotionId: promotionId,
      previousStatus: promo.status,
      newStatus,
      reason: options.reason,
    });
    await notifyPromotionLifecycle({
      userId: promo.seller_id,
      action: action === "revoke" ? "revoke" : "expire",
      promotionLabel: promo.type,
    });
    await revalidatePromotionSurfaces();
    return { success: true };
  }

  if (action === "duplicate") {
    const { data: copy } = await admin
      .from("seller_promotions")
      .insert({
        seller_id: promo.seller_id,
        type: promo.type,
        package_id: promo.package_id,
        status: "pending",
        amount_cents: 0,
        granted_by_admin: true,
        granted_by_admin_id: ctx.actorId,
        source: "granted_by_rovexo",
        reason: options.reason ?? "Duplicated by Super Admin",
      })
      .select("id")
      .single();

    if (!copy) return { success: false, error: "Unable to duplicate." };
    await logAction(ctx, {
      userId: promo.seller_id,
      username: userProfile?.username,
      promotionType: promo.type,
      promotionSource: "granted_by_rovexo",
      sellerPromotionId: copy.id,
      previousStatus: null,
      newStatus: "draft",
      reason: options.reason,
    });
    return { success: true, newPromotionId: copy.id };
  }

  if (action === "clone") {
    const targetUserId = options.targetUserId;
    if (!targetUserId) return { success: false, error: "Target user is required." };
    const result = await grantSellerPromotion({
      actorId: ctx.actorId,
      sellerId: targetUserId,
      type: promo.type as SellerPromotionType,
      packageId: options.packageId ?? promo.package_id,
      reason: options.reason ?? `Cloned from ${promotionId}`,
    });
    if (result.success) {
      await logAction(ctx, {
        userId: targetUserId,
        promotionType: promo.type,
        promotionSource: "granted_by_rovexo",
        previousStatus: null,
        newStatus: "active",
        reason: options.reason,
      });
      await revalidatePromotionSurfaces();
    }
    return result;
  }

  return { success: false, error: "Unsupported action." };
}

export async function grantPromotionAsAdmin(
  ctx: ActorContext,
  input: {
    userId: string;
    grantType: "bump" | "feature" | "store_featured" | "boost_package";
    productId?: string;
    packageId?: string;
    durationId?: string;
    customDays?: number;
    source?: PromotionSource;
    reason?: string;
    scheduledStartAt?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const source = input.source ?? "granted_by_rovexo";
  const actor = await loadActorProfile(ctx.actorId);
  const enrichedCtx: ActorContext = {
    ...ctx,
    actorName: ctx.actorName ?? actor?.full_name,
    actorUsername: ctx.actorUsername ?? actor?.username,
  };

  if (input.grantType === "bump" || input.grantType === "feature") {
    if (!input.productId) return { success: false, error: "Listing ID is required." };
    const durationId = input.durationId ?? (input.grantType === "bump" ? "7d" : "7d");
    const result = await adminCreateManualPromotion({
      sellerId: input.userId,
      productId: input.productId,
      type: input.grantType,
      durationId,
    });
    if (result.success) {
      const admin = createAdminClient();
      const { data: latest } = await admin
        .from("listing_promotions")
        .select("id")
        .eq("seller_id", input.userId)
        .eq("product_id", input.productId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      await admin
        .from("listing_promotions")
        .update({ source, reason: input.reason ?? "Granted by ROVEXO" })
        .eq("id", latest?.id ?? "");

      await logAction(enrichedCtx, {
        userId: input.userId,
        promotionType: input.grantType,
        promotionSource: source,
        listingId: input.productId,
        listingPromotionId: latest?.id,
        newStatus: "active",
        reason: input.reason,
      });
      await notifyPromotionLifecycle({
        userId: input.userId,
        action: "granted",
        promotionLabel: input.grantType,
      });
      await auditSuperAdminAction({
        actorId: ctx.actorId,
        action: "promotions.grant",
        resourceType: "listing_promotion",
        resourceId: latest?.id ?? input.productId,
        metadata: { type: input.grantType, userId: input.userId },
      });
      await revalidatePromotionSurfaces();
    }
    return result;
  }

  const packageId = input.packageId ?? input.durationId ?? "7d";
  const resolvedDays = resolveAdminDurationDays(packageId, input.customDays);
  const resolvedPackageId =
    resolvedDays && packageId === "custom" ? String(resolvedDays) : packageId;

  const result = await grantSellerPromotion({
    actorId: ctx.actorId,
    sellerId: input.userId,
    type: input.grantType,
    packageId: resolvedPackageId,
    reason: input.reason ?? "Granted by ROVEXO",
    scheduledStartAt: input.scheduledStartAt,
  });

  if (result.success) {
    const admin = createAdminClient();
    const { data: latest } = await admin
      .from("seller_promotions")
      .select("id")
      .eq("seller_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await admin.from("seller_promotions").update({ source }).eq("id", latest?.id ?? "");

    await logAction(enrichedCtx, {
      userId: input.userId,
      promotionType: input.grantType,
      promotionSource: source,
      sellerPromotionId: latest?.id,
      newStatus: input.scheduledStartAt ? "scheduled" : "active",
      reason: input.reason,
    });
    await notifyPromotionLifecycle({
      userId: input.userId,
      action: "granted",
      promotionLabel: input.grantType,
    });
    await auditSuperAdminAction({
      actorId: ctx.actorId,
      action: "promotions.grant",
      resourceType: "seller_promotion",
      resourceId: latest?.id ?? input.userId,
      metadata: { type: input.grantType, userId: input.userId, packageId: resolvedPackageId },
    });
    await revalidatePromotionSurfaces();
  }

  return result;
}

export async function executePromotionAdminAction(
  ctx: ActorContext,
  input: {
    scope: PromotionScope;
    promotionId?: string;
    action: AdminPromotionAction;
    reason?: string;
    scheduledStartAt?: string;
    daysDelta?: number;
    targetUserId?: string;
    targetProductId?: string;
    grantType?: "bump" | "feature" | "store_featured" | "boost_package";
    userId?: string;
    productId?: string;
    packageId?: string;
    durationId?: string;
    customDays?: number;
    source?: PromotionSource;
  },
): Promise<{ success: boolean; error?: string; newPromotionId?: string }> {
  const actor = await loadActorProfile(ctx.actorId);
  const enrichedCtx: ActorContext = {
    ...ctx,
    actorName: ctx.actorName ?? actor?.full_name,
    actorUsername: ctx.actorUsername ?? actor?.username,
  };

  if (input.action === "grant") {
    if (!input.userId || !input.grantType) {
      return { success: false, error: "User and grant type are required." };
    }
    return grantPromotionAsAdmin(enrichedCtx, {
      userId: input.userId,
      grantType: input.grantType,
      productId: input.productId,
      packageId: input.packageId,
      durationId: input.durationId,
      customDays: input.customDays,
      source: input.source,
      reason: input.reason,
      scheduledStartAt: input.scheduledStartAt,
    });
  }

  if (!input.promotionId) {
    return { success: false, error: "Promotion ID is required." };
  }

  const result =
    input.scope === "listing"
      ? await executeListingAction(enrichedCtx, input.promotionId, input.action, {
          reason: input.reason,
          scheduledStartAt: input.scheduledStartAt,
          daysDelta: input.daysDelta,
          targetUserId: input.targetUserId,
          targetProductId: input.targetProductId,
          source: input.source,
        })
      : await executeSellerAction(enrichedCtx, input.promotionId, input.action, {
          reason: input.reason,
          scheduledStartAt: input.scheduledStartAt,
          daysDelta: input.daysDelta,
          targetUserId: input.targetUserId,
          packageId: input.packageId,
          source: input.source,
        });

  if (result.success) {
    await auditSuperAdminAction({
      actorId: ctx.actorId,
      action: `promotions.${input.action}`,
      resourceType: input.scope === "listing" ? "listing_promotion" : "seller_promotion",
      resourceId: input.promotionId,
      metadata: { scope: input.scope, reason: input.reason },
    });
  }

  return result;
}

export { ADMIN_DURATION_OPTIONS };

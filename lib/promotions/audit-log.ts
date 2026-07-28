import type { PromotionSource } from "@/lib/promotions/canonical-engine";

export type PromotionAuditInput = {
  actorId: string;
  actorUsername?: string | null;
  actorName?: string | null;
  userId: string;
  username?: string | null;
  storeId?: string | null;
  promotionType: string;
  promotionSource?: PromotionSource | string | null;
  listingId?: string | null;
  sellerPromotionId?: string | null;
  listingPromotionId?: string | null;
  previousStatus?: string | null;
  newStatus: string;
  reason?: string | null;
  durationLabel?: string | null;
  activationDate?: string | null;
  expirationDate?: string | null;
  ipAddress?: string | null;
};

export async function writePromotionAuditLog(input: PromotionAuditInput): Promise<void> {
  const { tryCreateAdminClient } = await import("@/lib/supabase/admin");
  const admin = tryCreateAdminClient();
  if (!admin) return;

  await admin.from("promotion_action_audit").insert({
    actor_id: input.actorId,
    actor_username: input.actorUsername ?? null,
    actor_name: input.actorName ?? null,
    user_id: input.userId,
    username: input.username ?? null,
    store_id: input.storeId ?? input.userId,
    promotion_type: input.promotionType,
    promotion_source: input.promotionSource ?? null,
    listing_id: input.listingId ?? null,
    seller_promotion_id: input.sellerPromotionId ?? null,
    listing_promotion_id: input.listingPromotionId ?? null,
    previous_status: input.previousStatus ?? null,
    new_status: input.newStatus,
    reason: input.reason ?? null,
    duration_label: input.durationLabel ?? null,
    activation_date: input.activationDate ?? null,
    expiration_date: input.expirationDate ?? null,
    ip_address: input.ipAddress ?? null,
  });
}

export type PromotionAuditRow = {
  id: string;
  actorId: string;
  actorUsername: string | null;
  actorName: string | null;
  userId: string;
  username: string | null;
  storeId: string | null;
  promotionType: string;
  promotionSource: string | null;
  listingId: string | null;
  sellerPromotionId: string | null;
  listingPromotionId: string | null;
  previousStatus: string | null;
  newStatus: string;
  reason: string | null;
  durationLabel: string | null;
  activationDate: string | null;
  expirationDate: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export async function listPromotionAuditLog(input?: {
  userId?: string;
  limit?: number;
}): Promise<PromotionAuditRow[]> {
  const { tryCreateAdminClient } = await import("@/lib/supabase/admin");
  const admin = tryCreateAdminClient();
  if (!admin) return [];

  let query = admin
    .from("promotion_action_audit")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 100);

  if (input?.userId) {
    query = query.eq("user_id", input.userId);
  }

  const { data } = await query;
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    actorId: String(row.actor_id),
    actorUsername: (row.actor_username as string | null) ?? null,
    actorName: (row.actor_name as string | null) ?? null,
    userId: String(row.user_id),
    username: (row.username as string | null) ?? null,
    storeId: (row.store_id as string | null) ?? null,
    promotionType: String(row.promotion_type),
    promotionSource: (row.promotion_source as string | null) ?? null,
    listingId: (row.listing_id as string | null) ?? null,
    sellerPromotionId: (row.seller_promotion_id as string | null) ?? null,
    listingPromotionId: (row.listing_promotion_id as string | null) ?? null,
    previousStatus: (row.previous_status as string | null) ?? null,
    newStatus: String(row.new_status),
    reason: (row.reason as string | null) ?? null,
    durationLabel: (row.duration_label as string | null) ?? null,
    activationDate: (row.activation_date as string | null) ?? null,
    expirationDate: (row.expiration_date as string | null) ?? null,
    ipAddress: (row.ip_address as string | null) ?? null,
    createdAt: String(row.created_at),
  }));
}


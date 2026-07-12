import { createAdminClient } from "@/lib/supabase/admin";
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
  const admin = createAdminClient();
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
  const admin = createAdminClient();
  let query = admin
    .from("promotion_action_audit")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 100);

  if (input?.userId) {
    query = query.eq("user_id", input.userId);
  }

  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorUsername: row.actor_username,
    actorName: (row as { actor_name?: string | null }).actor_name ?? null,
    userId: row.user_id,
    username: row.username,
    storeId: (row as { store_id?: string | null }).store_id ?? null,
    promotionType: row.promotion_type,
    promotionSource: (row as { promotion_source?: string | null }).promotion_source ?? null,
    listingId: row.listing_id,
    sellerPromotionId: row.seller_promotion_id,
    listingPromotionId: row.listing_promotion_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    reason: row.reason,
    durationLabel: row.duration_label,
    activationDate: (row as { activation_date?: string | null }).activation_date ?? null,
    expirationDate: (row as { expiration_date?: string | null }).expiration_date ?? null,
    ipAddress: (row as { ip_address?: string | null }).ip_address ?? null,
    createdAt: row.created_at,
  }));
}

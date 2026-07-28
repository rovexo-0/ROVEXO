/**
 * Store Showcase persistence status — reads existing `seller_promotions`.
 * No schema changes. Type `store_featured` is the locked persistence key.
 */

import { createAdminClient, tryCreateAdminClient } from "@/lib/supabase/admin";
import { STORE_SHOWCASE_PERSISTENCE_TYPE } from "@/lib/promote/constants";

export type StoreShowcasePersistenceStatus = {
  hasActiveStoreShowcase: boolean;
  lastExpiredAt: string | null;
  activeStartsAt: string | null;
  activeEndsAt: string | null;
};

export async function getStoreShowcasePersistenceStatus(
  sellerId: string,
): Promise<StoreShowcasePersistenceStatus> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return {
      hasActiveStoreShowcase: false,
      lastExpiredAt: null,
      activeStartsAt: null,
      activeEndsAt: null,
    };
  }

  const nowIso = new Date().toISOString();

  const [{ data: activeRows }, { data: expiredRows }] = await Promise.all([
    admin
      .from("seller_promotions")
      .select("id, starts_at, ends_at, status")
      .eq("seller_id", sellerId)
      .eq("type", STORE_SHOWCASE_PERSISTENCE_TYPE)
      .eq("status", "active")
      .gt("ends_at", nowIso)
      .order("ends_at", { ascending: false })
      .limit(1),
    admin
      .from("seller_promotions")
      .select("ends_at, status")
      .eq("seller_id", sellerId)
      .eq("type", STORE_SHOWCASE_PERSISTENCE_TYPE)
      .in("status", ["expired", "revoked"])
      .order("ends_at", { ascending: false })
      .limit(1),
  ]);

  const active = activeRows?.[0] ?? null;
  const expired = expiredRows?.[0] ?? null;

  return {
    hasActiveStoreShowcase: Boolean(active),
    lastExpiredAt: expired?.ends_at ?? null,
    activeStartsAt: active?.starts_at ?? null,
    activeEndsAt: active?.ends_at ?? null,
  };
}

/** Admin-path helper when service role is required. */
export async function requireStoreShowcasePersistenceStatus(
  sellerId: string,
): Promise<StoreShowcasePersistenceStatus> {
  createAdminClient();
  return getStoreShowcasePersistenceStatus(sellerId);
}

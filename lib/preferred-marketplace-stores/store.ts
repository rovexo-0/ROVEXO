import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/types/database";
import {
  PREFERRED_MARKETPLACE_STORES_ENGINE_V1,
  type PreferredMarketplaceStoreConfig,
  type PreferredMarketplaceStoreInput,
} from "@/lib/preferred-marketplace-stores/preferred-marketplace-stores-engine-v1";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";

type StoreRow = Tables<"preferred_marketplace_stores">;

type ProfileLite = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
};

const STORE_SELECT =
  "id, seller_id, enabled, homepage_visibility, promotion_priority, min_position, max_position, start_at, end_at, max_simultaneous_listings, created_at, updated_at" as const;

function mapRow(
  row: StoreRow,
  profile?: ProfileLite | null,
): PreferredMarketplaceStoreConfig {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerEmail: profile?.email ?? null,
    sellerUsername: profile?.username ?? null,
    sellerName: profile?.full_name ?? null,
    enabled: row.enabled,
    homepageVisibility: row.homepage_visibility,
    promotionPriority: row.promotion_priority,
    minPosition: row.min_position,
    maxPosition: row.max_position,
    startAt: row.start_at,
    endAt: row.end_at,
    maxSimultaneousListings: row.max_simultaneous_listings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeInput(input: PreferredMarketplaceStoreInput): TablesInsert<"preferred_marketplace_stores"> {
  const defaults = PREFERRED_MARKETPLACE_STORES_ENGINE_V1.defaults;
  const minPosition = Math.max(1, input.minPosition ?? defaults.minPosition);
  const maxPosition = Math.max(minPosition, input.maxPosition ?? defaults.maxPosition);
  return {
    seller_id: input.sellerId,
    enabled: input.enabled ?? defaults.enabled,
    homepage_visibility: input.homepageVisibility ?? defaults.homepageVisibility,
    promotion_priority: input.promotionPriority ?? defaults.promotionPriority,
    min_position: minPosition,
    max_position: maxPosition,
    start_at: input.startAt ?? null,
    end_at: input.endAt ?? null,
    max_simultaneous_listings: Math.max(
      1,
      input.maxSimultaneousListings ?? defaults.maxSimultaneousListings,
    ),
    updated_at: new Date().toISOString(),
  };
}

export async function listPreferredMarketplaceStores(): Promise<PreferredMarketplaceStoreConfig[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("preferred_marketplace_stores")
    .select(STORE_SELECT)
    .order("promotion_priority", { ascending: false });

  if (error || !data) return [];
  const rows = data as StoreRow[];
  const sellerIds = [...new Set(rows.map((row) => row.seller_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, username, full_name")
    .in("id", sellerIds);
  const byId = new Map((profiles as ProfileLite[] | null)?.map((row) => [row.id, row]) ?? []);
  return rows.map((row) => mapRow(row, byId.get(row.seller_id) ?? null));
}

export async function listActivePreferredMarketplaceStores(): Promise<
  PreferredMarketplaceStoreConfig[]
> {
  const all = await listPreferredMarketplaceStores();
  const now = Date.now();
  return all.filter((store) => {
    if (!store.enabled || !store.homepageVisibility) return false;
    if (store.startAt && Date.parse(store.startAt) > now) return false;
    if (store.endAt && Date.parse(store.endAt) < now) return false;
    return true;
  });
}

export async function upsertPreferredMarketplaceStore(input: {
  actorId: string;
  store: PreferredMarketplaceStoreInput;
  id?: string;
}): Promise<PreferredMarketplaceStoreConfig | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createServiceRoleClient();
  const base = normalizeInput(input.store);

  const query = input.id
    ? admin
        .from("preferred_marketplace_stores")
        .update(base as TablesUpdate<"preferred_marketplace_stores">)
        .eq("id", input.id)
        .select(STORE_SELECT)
        .maybeSingle()
    : admin
        .from("preferred_marketplace_stores")
        .upsert(
          { ...base, created_by: input.actorId } satisfies TablesInsert<"preferred_marketplace_stores">,
          { onConflict: "seller_id" },
        )
        .select(STORE_SELECT)
        .maybeSingle();

  const { data, error } = await query;
  if (error || !data) return null;
  const row = data as StoreRow;

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: input.id ? "preferred_store.update" : "preferred_store.upsert",
    resourceType: "preferred_marketplace_stores",
    resourceId: row.id,
    metadata: { sellerId: input.store.sellerId },
  });

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, username, full_name")
    .eq("id", row.seller_id)
    .maybeSingle();

  return mapRow(row, (profile as ProfileLite | null) ?? null);
}

export async function deletePreferredMarketplaceStore(input: {
  actorId: string;
  id: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const admin = createServiceRoleClient();
  const { error } = await admin.from("preferred_marketplace_stores").delete().eq("id", input.id);
  if (error) return false;

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "preferred_store.delete",
    resourceType: "preferred_marketplace_stores",
    resourceId: input.id,
    metadata: {},
  });
  return true;
}

export async function findSellerIdByEmail(email: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data?.id ?? null;
}

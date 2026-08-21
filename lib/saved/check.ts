/**
 * ROVEXO v1.0 — Saved DB authority helpers (CEO P0).
 * Database is the absolute authority for ♡ / ❤️.
 */

import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

/** Cookie session client, or service-role when native Bearer has no RLS user. */
export async function savedDatabaseClient() {
  return tryCreateAdminClient() ?? (await createClient());
}

export async function resolveProductIdBySlug(productSlug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .maybeSingle();
  if (product?.id) return product.id;

  // Sold PDP / Saved: public sold rows may still be RLS-gated until migration lands.
  const admin = tryCreateAdminClient();
  if (!admin) return null;
  const { data: sold } = await admin
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .eq("status", "sold")
    .maybeSingle();
  return sold?.id ?? null;
}

export async function isProductSaved(userId: string, productSlug: string): Promise<boolean> {
  const productId = await resolveProductIdBySlug(productSlug);
  if (!productId) return false;
  return isProductIdSaved(userId, productId);
}

export async function isProductIdSaved(userId: string, productId: string): Promise<boolean> {
  const supabase = await savedDatabaseClient();
  const { data } = await supabase
    .from("saved_items")
    .select("product_id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  return Boolean(data);
}

/** STEP 2 — after DELETE, row must not exist. */
export async function assertSavedRowsAbsent(
  userId: string,
  productIds: string[],
): Promise<{ ok: true } | { ok: false; stillSavedProductIds: string[] }> {
  if (!productIds.length) return { ok: true };

  const supabase = await savedDatabaseClient();
  const { data, error } = await supabase
    .from("saved_items")
    .select("product_id")
    .eq("user_id", userId)
    .in("product_id", productIds);

  if (error) {
    return { ok: false, stillSavedProductIds: productIds };
  }

  const stillSavedProductIds = (data ?? []).map((row) => row.product_id);
  if (stillSavedProductIds.length) {
    return { ok: false, stillSavedProductIds };
  }
  return { ok: true };
}

/** After SAVE, row must exist. */
export async function assertSavedRowsPresent(
  userId: string,
  productIds: string[],
): Promise<{ ok: true } | { ok: false; missingProductIds: string[] }> {
  if (!productIds.length) return { ok: false, missingProductIds: [] };

  const supabase = await savedDatabaseClient();
  const { data, error } = await supabase
    .from("saved_items")
    .select("product_id")
    .eq("user_id", userId)
    .in("product_id", productIds);

  if (error) {
    return { ok: false, missingProductIds: productIds };
  }

  const present = new Set((data ?? []).map((row) => row.product_id));
  const missingProductIds = productIds.filter((id) => !present.has(id));
  if (missingProductIds.length) {
    return { ok: false, missingProductIds };
  }
  return { ok: true };
}

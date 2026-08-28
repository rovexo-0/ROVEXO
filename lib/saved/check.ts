/**
 * ROVEXO v1.0 — Saved DB authority helpers (CEO P0).
 * Database is the absolute authority for ♡ / ❤️.
 */

import { savedIdentityDb } from "@/lib/saved/saved-identity-db-v1";

export async function resolveProductIdBySlug(productSlug: string): Promise<string | null> {
  const supabase = await savedIdentityDb();
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .maybeSingle();
  return product?.id ?? null;
}

export async function isProductSaved(userId: string, productSlug: string): Promise<boolean> {
  const productId = await resolveProductIdBySlug(productSlug);
  if (!productId) return false;
  return isProductIdSaved(userId, productId);
}

export async function isProductIdSaved(userId: string, productId: string): Promise<boolean> {
  const supabase = await savedIdentityDb();
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

  const supabase = await savedIdentityDb();
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

  const supabase = await savedIdentityDb();
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

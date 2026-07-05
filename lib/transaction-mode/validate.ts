import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTransactionModeForCategoryId } from "@/lib/transaction-mode/server";
import { isMarketplaceMode } from "@/lib/transaction-mode/capabilities";
import type { TransactionMode } from "@/lib/transaction-mode/types";

export const DIRECT_CONTACT_PURCHASE_MESSAGE =
  "This listing uses direct contact — checkout and cart are not available.";

export async function resolveTransactionModeForProductSlug(slug: string): Promise<TransactionMode> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("category_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!data?.category_id) {
    return "MARKETPLACE";
  }

  return resolveTransactionModeForCategoryId(data.category_id);
}

export async function assertMarketplacePurchaseAllowedForProductSlug(
  slug: string,
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const mode = await resolveTransactionModeForProductSlug(slug);
  if (isMarketplaceMode(mode)) {
    return { allowed: true };
  }
  return { allowed: false, error: DIRECT_CONTACT_PURCHASE_MESSAGE };
}

export async function assertMarketplacePurchaseAllowedForCategoryId(
  categoryId: string,
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const mode = await resolveTransactionModeForCategoryId(categoryId);
  if (isMarketplaceMode(mode)) {
    return { allowed: true };
  }
  return { allowed: false, error: DIRECT_CONTACT_PURCHASE_MESSAGE };
}

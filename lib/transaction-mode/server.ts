import { createAdminClient } from "@/lib/supabase/admin";
import { getDescendantCategoryIds } from "@/lib/categories/server";
import { resolveTransactionModeForRootSlug } from "@/lib/transaction-mode/defaults";
import { resolveTransactionModeFromDbValue } from "@/lib/transaction-mode/resolver";
import type { TransactionMode } from "@/lib/transaction-mode/types";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";

function resolveModeFromProjection(
  categoryId: string,
  byId: Map<string, CategoryModeRow>,
): TransactionMode {
  let current = byId.get(categoryId);
  if (!current) {
    return DEFAULT_TRANSACTION_MODE;
  }

  if (current.transactionMode) {
    return current.transactionMode;
  }

  const chain: CategoryModeRow[] = [current];
  while (current.parentId) {
    current = byId.get(current.parentId);
    if (!current) break;
    chain.unshift(current);
  }

  const root = chain[0];
  if (root?.transactionMode) {
    return root.transactionMode;
  }

  if (root?.slug) {
    return resolveTransactionModeForRootSlug(root.slug);
  }

  return DEFAULT_TRANSACTION_MODE;
}

export async function resolveTransactionModeForCategoryId(categoryId: string): Promise<TransactionMode> {
  const admin = createAdminClient();
  const categories = await loadCategoryModeProjection(admin);
  const byId = new Map(categories.map((row) => [row.id, row]));
  return resolveModeFromProjection(categoryId, byId);
}

export async function resolveTransactionModeMapForCategoryIds(
  categoryIds: (string | null | undefined)[],
): Promise<Map<string, TransactionMode>> {
  const unique = [...new Set(categoryIds.filter((id): id is string => Boolean(id)))];
  const map = new Map<string, TransactionMode>();
  if (!unique.length) return map;

  const admin = createAdminClient();
  const categories = await loadCategoryModeProjection(admin);
  const byId = new Map(categories.map((row) => [row.id, row]));

  for (const id of unique) {
    map.set(id, resolveModeFromProjection(id, byId));
  }

  return map;
}

type CategoryModeRow = {
  id: string;
  slug: string;
  parentId: string | null;
  transactionMode: TransactionMode | null;
};

async function loadCategoryModeProjection(
  admin: ReturnType<typeof createAdminClient>,
): Promise<CategoryModeRow[]> {
  const withMode = await admin.from("categories").select("id, slug, parent_id, transaction_mode");

  if (!withMode.error && withMode.data) {
    return (withMode.data as Array<{
      id: string;
      slug: string;
      parent_id: string | null;
      transaction_mode: string | null;
    }>).map((row) => ({
      id: row.id,
      slug: row.slug,
      parentId: row.parent_id,
      transactionMode: row.transaction_mode
        ? resolveTransactionModeFromDbValue(row.transaction_mode)
        : null,
    }));
  }

  const fallback = await admin.from("categories").select("id, slug, parent_id");
  return ((fallback.data ?? []) as Array<{
    id: string;
    slug: string;
    parent_id: string | null;
  }>).map((row) => ({
    id: row.id,
    slug: row.slug,
    parentId: row.parent_id,
    transactionMode: null,
  }));
}

export async function updateCategoryTransactionModeCascade(
  categoryId: string,
  mode: TransactionMode,
): Promise<{ updated: number }> {
  const admin = createAdminClient();
  const ids = await getDescendantCategoryIds(categoryId);

  const { data, error } = await admin
    .from("categories")
    .update({ transaction_mode: mode })
    .in("id", ids)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return { updated: data?.length ?? 0 };
}

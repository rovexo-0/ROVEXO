import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDescendantCategoryIds, loadAllCategories } from "@/lib/categories/server";
import { resolveTransactionModeForRootSlug } from "@/lib/transaction-mode/defaults";
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
  const categories = await loadCategoryModeProjection();
  const byId = new Map(categories.map((row) => [row.id, row]));
  return resolveModeFromProjection(categoryId, byId);
}

export async function resolveTransactionModeMapForCategoryIds(
  categoryIds: (string | null | undefined)[],
): Promise<Map<string, TransactionMode>> {
  const unique = [...new Set(categoryIds.filter((id): id is string => Boolean(id)))];
  const map = new Map<string, TransactionMode>();
  if (!unique.length) return map;

  const categories = await loadCategoryModeProjection();
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

const loadCategoryModeProjection = cache(async function loadCategoryModeProjection(): Promise<
  CategoryModeRow[]
> {
  const categories = await loadAllCategories();
  return categories.map((row) => ({
    id: row.id,
    slug: row.slug,
    parentId: row.parentId,
    transactionMode: row.transactionMode,
  }));
});

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

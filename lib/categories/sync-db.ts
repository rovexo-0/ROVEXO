import { createAdminClient } from "@/lib/supabase/admin";
import { categoryTree } from "@/lib/categories/tree";
import type { CategoryNode } from "@/lib/categories/types";
import { getCategoryIcon } from "@/lib/categories/visuals";
import { getFiltersForCategorySlug } from "@/lib/categories/filters";
import { resolveTransactionModeForRootSlug } from "@/lib/transaction-mode/defaults";
import type { TransactionMode } from "@/lib/transaction-mode/types";

export type SyncResult = {
  categoriesUpserted: number;
  filtersUpserted: number;
  errors: string[];
};

type UpsertRow = {
  name: string;
  slug: string;
  parent_id: string | null;
  path_label: string;
  sort_order: number;
  icon: string;
  seo_title: string;
  seo_description: string;
  is_active: boolean;
  transaction_mode: TransactionMode;
};

async function upsertNode(
  node: CategoryNode,
  parentId: string | null,
  pathParts: string[],
  sortOrder: number,
  slugToId: Map<string, string>,
  stats: SyncResult,
  inheritedMode: TransactionMode,
) {
  const admin = createAdminClient();
  const pathLabel = pathParts.join(" › ");
  const slugKey = `${node.slug}:${parentId ?? "root"}`;

  const row: UpsertRow = {
    name: node.name,
    slug: node.slug,
    parent_id: parentId,
    path_label: pathLabel,
    sort_order: sortOrder,
    icon: node.icon ?? getCategoryIcon(node.slug),
    seo_title: `${node.name} for Sale UK | ROVEXO`,
    seo_description: `Buy and sell ${node.name.toLowerCase()} on ROVEXO. Verified sellers, purchase protection, and secure checkout across the UK.`,
    is_active: true,
    transaction_mode: node.transactionMode ?? inheritedMode,
  };

  const existingQuery = admin.from("categories").select("id").eq("slug", node.slug);
  const { data: existing } = parentId
    ? await existingQuery.eq("parent_id", parentId).maybeSingle()
    : await existingQuery.is("parent_id", null).maybeSingle();

  let categoryId: string;

  if (existing?.id) {
    const { data, error } = await admin
      .from("categories")
      .update(row)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error || !data) {
      stats.errors.push(`Failed to update ${pathLabel}: ${error?.message ?? "unknown"}`);
      return;
    }
    categoryId = data.id;
  } else {
    const { data, error } = await admin.from("categories").insert(row).select("id").single();
    if (error || !data) {
      stats.errors.push(`Failed to insert ${pathLabel}: ${error?.message ?? "unknown"}`);
      return;
    }
    categoryId = data.id;
  }

  slugToId.set(slugKey, categoryId);
  stats.categoriesUpserted += 1;

  const filters = getFiltersForCategorySlug(node.slug);
  for (let index = 0; index < filters.length; index++) {
    const filter = filters[index]!;
    const { error } = await admin.from("category_filter_definitions").upsert(
      {
        category_id: categoryId,
        filter_key: filter.key,
        label: filter.label,
        filter_type: filter.type,
        options: filter.options ?? [],
        sort_order: index,
        is_required: filter.required ?? false,
      },
      { onConflict: "category_id,filter_key" },
    );
    if (!error) stats.filtersUpserted += 1;
  }

  const children = node.children ?? [];
  const childMode = node.transactionMode ?? inheritedMode;
  for (let index = 0; index < children.length; index++) {
    await upsertNode(
      children[index]!,
      categoryId,
      [...pathParts, node.name],
      index + 1,
      slugToId,
      stats,
      childMode,
    );
  }
}

export async function syncEnterpriseTaxonomyToDatabase(): Promise<SyncResult> {
  const stats: SyncResult = { categoriesUpserted: 0, filtersUpserted: 0, errors: [] };
  const slugToId = new Map<string, string>();

  for (let index = 0; index < categoryTree.length; index++) {
    const root = categoryTree[index]!;
    const rootMode = root.transactionMode ?? resolveTransactionModeForRootSlug(root.slug);
    await upsertNode(root, null, [], index + 1, slugToId, stats, rootMode);
  }

  return stats;
}

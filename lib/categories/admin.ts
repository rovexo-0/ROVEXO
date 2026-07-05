import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types/database";
import {
  CATEGORY_FILTER_GROUPS,
  getFiltersForCategorySlug,
  type CategoryFilterDefinition,
} from "@/lib/categories/filters";
import { getCategoryIcon } from "@/lib/categories/visuals";
import type { TransactionMode } from "@/lib/transaction-mode/types";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  pathLabel: string;
  sortOrder: number;
  icon: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  transactionMode: TransactionMode;
};

export type AdminCategoryFilter = {
  id: string;
  categoryId: string;
  filterKey: string;
  label: string;
  filterType: CategoryFilterDefinition["type"];
  options: string[];
  sortOrder: number;
  isRequired: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  path_label: string;
  sort_order: number;
  icon?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  is_active?: boolean;
  transaction_mode?: TransactionMode;
};

function mapCategory(row: CategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    pathLabel: row.path_label,
    sortOrder: row.sort_order,
    icon: row.icon ?? getCategoryIcon(row.slug),
    seoTitle: row.seo_title ?? null,
    seoDescription: row.seo_description ?? null,
    isActive: row.is_active ?? true,
    transactionMode: row.transaction_mode ?? "MARKETPLACE",
  };
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("categories")
    .select(
      "id, name, slug, parent_id, path_label, sort_order, icon, seo_title, seo_description, is_active, transaction_mode",
    )
    .order("sort_order", { ascending: true });

  return ((data as CategoryRow[] | null) ?? []).map(mapCategory);
}

export async function getAdminCategory(id: string): Promise<AdminCategory | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("categories")
    .select(
      "id, name, slug, parent_id, path_label, sort_order, icon, seo_title, seo_description, is_active, transaction_mode",
    )
    .eq("id", id)
    .maybeSingle();

  return data ? mapCategory(data as CategoryRow) : null;
}

export async function createAdminCategory(input: {
  name: string;
  slug: string;
  parentId?: string | null;
  pathLabel: string;
  sortOrder?: number;
  icon?: string;
  seoTitle?: string;
  seoDescription?: string;
}): Promise<AdminCategory | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("categories")
    .insert({
      name: input.name,
      slug: input.slug,
      parent_id: input.parentId ?? null,
      path_label: input.pathLabel,
      sort_order: input.sortOrder ?? 0,
      icon: input.icon ?? getCategoryIcon(input.slug),
      seo_title: input.seoTitle ?? null,
      seo_description: input.seoDescription ?? null,
    })
    .select(
      "id, name, slug, parent_id, path_label, sort_order, icon, seo_title, seo_description, is_active, transaction_mode",
    )
    .single();

  if (error || !data) return null;
  return mapCategory(data as CategoryRow);
}

export async function updateAdminCategory(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    parentId: string | null;
    pathLabel: string;
    sortOrder: number;
    icon: string;
    seoTitle: string | null;
    seoDescription: string | null;
    isActive: boolean;
    transactionMode: TransactionMode;
  }>,
): Promise<AdminCategory | null> {
  const admin = createAdminClient();
  const updates: Database["public"]["Tables"]["categories"]["Update"] = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.parentId !== undefined) updates.parent_id = input.parentId;
  if (input.pathLabel !== undefined) updates.path_label = input.pathLabel;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.seoTitle !== undefined) updates.seo_title = input.seoTitle;
  if (input.seoDescription !== undefined) updates.seo_description = input.seoDescription;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  if (input.transactionMode !== undefined) updates.transaction_mode = input.transactionMode;

  const { data } = await admin
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select(
      "id, name, slug, parent_id, path_label, sort_order, icon, seo_title, seo_description, is_active, transaction_mode",
    )
    .single();

  return data ? mapCategory(data as CategoryRow) : null;
}

export async function deleteAdminCategory(id: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", id);
  return !error;
}

export async function listCategoryFilters(categoryId: string): Promise<AdminCategoryFilter[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("category_filter_definitions")
    .select("*")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  return ((data ?? []) as Array<{
    id: string;
    category_id: string;
    filter_key: string;
    label: string;
    filter_type: CategoryFilterDefinition["type"];
    options: string[] | null;
    sort_order: number;
    is_required: boolean;
  }>).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    filterKey: row.filter_key,
    label: row.label,
    filterType: row.filter_type,
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    sortOrder: row.sort_order,
    isRequired: row.is_required,
  }));
}

export async function seedCategoryFiltersForSlug(
  categoryId: string,
  slug: string,
): Promise<number> {
  const admin = createAdminClient();
  const filters = getFiltersForCategorySlug(slug);
  let inserted = 0;

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
    if (!error) inserted += 1;
  }

  return inserted;
}

export async function seedAllTopLevelCategoryFilters(): Promise<number> {
  const categories = await listAdminCategories();
  const topLevel = categories.filter((category) => !category.parentId);
  let total = 0;

  for (const category of topLevel) {
    const group = CATEGORY_FILTER_GROUPS.find((entry) => entry.categorySlug === category.slug);
    if (group) {
      total += await seedCategoryFiltersForSlug(category.id, category.slug);
    } else {
      total += await seedCategoryFiltersForSlug(category.id, "everything-else");
    }
  }

  return total;
}

export async function upsertCategoryFilter(input: {
  categoryId: string;
  filterKey: string;
  label: string;
  filterType: CategoryFilterDefinition["type"];
  options?: string[];
  sortOrder?: number;
  isRequired?: boolean;
}): Promise<AdminCategoryFilter | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("category_filter_definitions")
    .upsert(
      {
        category_id: input.categoryId,
        filter_key: input.filterKey,
        label: input.label,
        filter_type: input.filterType,
        options: input.options ?? [],
        sort_order: input.sortOrder ?? 0,
        is_required: input.isRequired ?? false,
      },
      { onConflict: "category_id,filter_key" },
    )
    .select("*")
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    categoryId: data.category_id,
    filterKey: data.filter_key,
    label: data.label,
    filterType: data.filter_type,
    options: Array.isArray(data.options) ? (data.options as string[]) : [],
    sortOrder: data.sort_order,
    isRequired: data.is_required,
  };
}

export async function deleteCategoryFilter(id: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("category_filter_definitions").delete().eq("id", id);
  return !error;
}

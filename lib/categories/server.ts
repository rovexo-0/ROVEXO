import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  breadcrumbsFromPath,
  findNodeBySlugPath,
  segmentsFromPath,
} from "@/lib/categories/navigation";
import { categoryTree } from "@/lib/categories/tree";
import type { CategoryBreadcrumb, CategorySegment } from "@/lib/categories/navigation";
import type { CategoryNode } from "@/lib/categories/types";
import { getCategoryImageUrl } from "@/lib/categories/visuals";

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  pathLabel: string;
  sortOrder: number;
};

export type CategoryPageData = {
  node: CategoryNode;
  path: CategoryNode[];
  segments: CategorySegment[];
  breadcrumbs: CategoryBreadcrumb[];
  subcategories: CategoryNode[];
  categoryIds: string[];
  imageUrl: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  path_label: string;
  sort_order: number;
};

function mapRow(row: CategoryRow): DbCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    pathLabel: row.path_label,
    sortOrder: row.sort_order,
  };
}

export async function loadAllCategories(): Promise<DbCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, path_label, sort_order")
    .order("sort_order", { ascending: true });

  return ((data as CategoryRow[] | null) ?? []).map(mapRow);
}

export async function resolveCategoryIdBySlugPath(slugs: string[]): Promise<string | null> {
  if (!slugs.length) return null;

  const categories = await loadAllCategories();
  let parentId: string | null = null;

  for (const slug of slugs) {
    const match = categories.find(
      (category) => category.slug === slug && category.parentId === parentId,
    );
    if (!match) return null;
    parentId = match.id;
  }

  return parentId;
}

export async function getDescendantCategoryIds(rootId: string): Promise<string[]> {
  const categories = await loadAllCategories();
  const ids = new Set<string>([rootId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        changed = true;
      }
    }
  }

  return [...ids];
}

export async function resolveCategoryPage(slugs: string[]): Promise<CategoryPageData | null> {
  const path = findNodeBySlugPath(categoryTree, slugs);
  if (!path?.length) return null;

  const node = path[path.length - 1]!;
  const segments = segmentsFromPath(path);
  const breadcrumbs = breadcrumbsFromPath(path);
  const dbId = await resolveCategoryIdBySlugPath(slugs);
  const categoryIds = dbId ? await getDescendantCategoryIds(dbId) : [];

  return {
    node,
    path,
    segments,
    breadcrumbs,
    subcategories: node.children ?? [],
    categoryIds,
    imageUrl: getCategoryImageUrl(node.slug),
  };
}

export async function getTopLevelCategoryCounts(): Promise<
  { id: string; name: string; slug: string; itemCount: number; imageUrl: string }[]
> {
  const admin = createAdminClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    admin.from("categories").select("id, name, slug, parent_id").is("parent_id", null),
    admin.from("products").select("category_id").eq("status", "published"),
  ]);

  const allCategories = await loadAllCategories();
  const countByRoot = new Map<string, number>();

  for (const product of products ?? []) {
    if (!product.category_id) continue;
    let current = allCategories.find((category) => category.id === product.category_id);
    while (current?.parentId) {
      current = allCategories.find((category) => category.id === current!.parentId);
    }
    if (current) {
      countByRoot.set(current.id, (countByRoot.get(current.id) ?? 0) + 1);
    }
  }

  return (categories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    itemCount: countByRoot.get(category.id) ?? 0,
    imageUrl: getCategoryImageUrl(category.slug),
  }));
}

export async function getCategoryBreadcrumbsForProduct(
  categoryId: string | null,
): Promise<CategoryBreadcrumb[]> {
  if (!categoryId) return [];

  const categories = await loadAllCategories();
  const chain: DbCategory[] = [];
  let current = categories.find((category) => category.id === categoryId);

  while (current) {
    chain.unshift(current);
    current = current.parentId
      ? categories.find((category) => category.id === current!.parentId)
      : undefined;
  }

  const segments: CategorySegment[] = chain.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));

  return segments.map((segment, index) => ({
    ...segment,
    href: `/category/${segments
      .slice(0, index + 1)
      .map((entry) => entry.slug)
      .join("/")}`,
  }));
}

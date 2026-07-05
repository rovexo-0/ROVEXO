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
import type { TransactionMode } from "@/lib/transaction-mode/types";

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  pathLabel: string;
  sortOrder: number;
  transactionMode: TransactionMode | null;
};

export type CategoryPageData = {
  node: CategoryNode;
  path: CategoryNode[];
  segments: CategorySegment[];
  breadcrumbs: CategoryBreadcrumb[];
  subcategories: CategoryNode[];
  categoryIds: string[];
  imageUrl: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  path_label: string;
  sort_order: number;
  seo_title?: string | null;
  seo_description?: string | null;
  is_active?: boolean;
  transaction_mode?: string | null;
};

function mapRow(row: CategoryRow): DbCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    pathLabel: row.path_label,
    sortOrder: row.sort_order,
    transactionMode: (row.transaction_mode as TransactionMode | null | undefined) ?? null,
  };
}

export async function loadAllCategories(): Promise<DbCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, path_label, sort_order, transaction_mode")
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

/**
 * A minimal persistence port for materialising a category chain. Kept as an
 * interface so the pure walk in {@link materializeCategoryChain} can be unit
 * tested with an in-memory store instead of a live Supabase connection.
 */
export type CategoryChainStore = {
  findId(slug: string, parentId: string | null): Promise<string | null>;
  create(input: {
    name: string;
    slug: string;
    parentId: string | null;
    pathLabel: string;
    sortOrder: number;
  }): Promise<string>;
};

/**
 * Validate a slug path against the canonical marketplace tree — the single
 * source of truth shared with the frontend picker and AI. Returns the resolved
 * node chain, or null when the path does not fully exist (real structural
 * validation — never display-name matching, never bypassed).
 */
export function resolveCanonicalCategoryNodes(slugs: string[]): CategoryNode[] | null {
  if (slugs.length < 2) return null;
  const nodes = findNodeBySlugPath(categoryTree, slugs);
  if (!nodes || nodes.length !== slugs.length) return null;
  return nodes;
}

/**
 * Ensure every node in a validated canonical chain exists in the database and
 * return the leaf's id. Categories are materialised lazily on first use so the
 * DB `categories` table is always a faithful projection of the canonical tree,
 * guaranteeing the frontend and backend resolve to the exact same taxonomy id.
 */
export async function materializeCategoryChain(
  nodes: CategoryNode[],
  store: CategoryChainStore,
): Promise<string | null> {
  if (nodes.length < 2) return null;

  let parentId: string | null = null;
  let leafId: string | null = null;
  const labelParts: string[] = [];

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    labelParts.push(node.name);

    const existing = await store.findId(node.slug, parentId);
    const id: string =
      existing ??
      (await store.create({
        name: node.name,
        slug: node.slug,
        parentId,
        pathLabel: labelParts.join(" > "),
        sortOrder: index,
      }));

    parentId = id;
    leafId = id;
  }

  return leafId;
}

function createSupabaseCategoryStore(): CategoryChainStore {
  const admin = createAdminClient();

  const selectId = async (slug: string, parentId: string | null): Promise<string | null> => {
    let query = admin.from("categories").select("id").eq("slug", slug);
    query = parentId === null ? query.is("parent_id", null) : query.eq("parent_id", parentId);
    const { data } = await query.maybeSingle();
    return (data as { id: string } | null)?.id ?? null;
  };

  return {
    findId: selectId,
    async create(input) {
      const { data, error } = await admin
        .from("categories")
        .insert({
          name: input.name,
          slug: input.slug,
          parent_id: input.parentId,
          path_label: input.pathLabel,
          sort_order: input.sortOrder,
        })
        .select("id")
        .single();

      if (!error && data) {
        return (data as { id: string }).id;
      }

      // Race-tolerant: a concurrent publish may have inserted the same node
      // (unique on slug+parent). Re-select rather than failing the publish.
      const retryId = await selectId(input.slug, input.parentId);
      if (retryId) return retryId;
      throw error ?? new Error(`Failed to create category "${input.slug}".`);
    },
  };
}

/**
 * Resolve a slug path to a database category id, creating any missing rows from
 * the canonical tree. Returns null only when the path is not a valid canonical
 * path (i.e. it does not exist in the marketplace taxonomy).
 */
export async function resolveOrCreateCategoryIdBySlugPath(
  slugs: string[],
): Promise<string | null> {
  const nodes = resolveCanonicalCategoryNodes(slugs);
  if (!nodes) return null;
  return materializeCategoryChain(nodes, createSupabaseCategoryStore());
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

  let seoTitle: string | null = null;
  let seoDescription: string | null = null;
  let isActive = true;

  if (dbId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("seo_title, seo_description, is_active")
      .eq("id", dbId)
      .maybeSingle();

    if (data) {
      seoTitle = data.seo_title;
      seoDescription = data.seo_description;
      isActive = data.is_active ?? true;
    }
  }

  return {
    node,
    path,
    segments,
    breadcrumbs,
    subcategories: node.children ?? [],
    categoryIds,
    imageUrl: getCategoryImageUrl(node.slug),
    seoTitle,
    seoDescription,
    isActive,
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

function buildBreadcrumbChain(
  categoryId: string,
  byId: Map<string, DbCategory>,
): CategoryBreadcrumb[] {
  const chain: DbCategory[] = [];
  let current = byId.get(categoryId);
  const guard = new Set<string>();

  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
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

export async function getCategoryBreadcrumbsForProduct(
  categoryId: string | null,
): Promise<CategoryBreadcrumb[]> {
  if (!categoryId) return [];

  const categories = await loadAllCategories();
  const byId = new Map(categories.map((category) => [category.id, category]));
  return buildBreadcrumbChain(categoryId, byId);
}

/**
 * Batched canonical breadcrumb resolver. Loads the category projection once and
 * builds the full root→leaf clickable path for each requested id, so a page of
 * search results costs a single categories read instead of one per product.
 */
export async function getCategoryBreadcrumbMap(
  categoryIds: (string | null | undefined)[],
): Promise<Map<string, CategoryBreadcrumb[]>> {
  const unique = [...new Set(categoryIds.filter((id): id is string => Boolean(id)))];
  const map = new Map<string, CategoryBreadcrumb[]>();
  if (!unique.length) return map;

  const categories = await loadAllCategories();
  const byId = new Map(categories.map((category) => [category.id, category]));

  for (const id of unique) {
    map.set(id, buildBreadcrumbChain(id, byId));
  }

  return map;
}

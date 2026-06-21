import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import { flatPathFromSegments, type FlatCategoryPath } from "@/lib/categories/types";
import { createClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  path_label: string | null;
};

async function fetchCategoryChain(categoryId: string): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const chain: CategoryRow[] = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const { data }: { data: CategoryRow | null } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, path_label")
      .eq("id", currentId)
      .maybeSingle();

    if (!data) break;
    chain.unshift(data);
    currentId = data.parent_id;
  }

  return chain;
}

export async function resolveFlatCategoryPathFromId(
  categoryId: string | null,
): Promise<FlatCategoryPath | null> {
  if (!categoryId) return null;

  const chain = await fetchCategoryChain(categoryId);
  if (chain.length < 2) return null;

  const slugs = chain.map((node) => node.slug);
  const fromTree = resolveCategoryPathBySlugs(slugs);
  if (fromTree) return fromTree;

  const segments = chain.map((node) => ({
    id: node.id,
    name: node.name,
    slug: node.slug,
  }));

  return flatPathFromSegments(segments);
}

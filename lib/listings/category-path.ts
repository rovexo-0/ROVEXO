import { flattenCategoryPaths, resolveCategoryPath } from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";
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

  const category = chain[0]!;
  const subcategory = chain[1]!;
  const child = chain[2];

  const resolved = resolveCategoryPath(
    category.slug,
    subcategory.slug,
    child?.slug,
  );

  if (resolved) {
    const flatMatch = flattenCategoryPaths().find((path) => {
      if (child?.slug) {
        return (
          path.categorySlug === category.slug &&
          path.subcategorySlug === subcategory.slug &&
          path.childCategorySlug === child.slug
        );
      }
      return path.categorySlug === category.slug && path.subcategorySlug === subcategory.slug;
    });

    if (flatMatch) return flatMatch;
  }

  const pathLabel =
    chain[chain.length - 1]?.path_label ??
    chain.map((node) => node.name).join(" › ");

  return {
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    subcategoryId: subcategory.id,
    subcategoryName: subcategory.name,
    subcategorySlug: subcategory.slug,
    childCategoryId: child?.id,
    childCategoryName: child?.name,
    childCategorySlug: child?.slug,
    pathLabel,
  };
}

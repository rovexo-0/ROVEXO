import { resolveOrCreateCategoryIdBySlugPath } from "@/lib/categories/server";
import type { FlatCategoryPath } from "@/lib/categories/types";

export type CategoryPathPayload = {
  categorySlug: string;
  subcategorySlug: string;
  childCategorySlug?: string;
  categorySlugs?: string[];
};

export async function resolveListingCategoryId(
  categoryPath: CategoryPathPayload | null | undefined,
): Promise<string | null> {
  if (!categoryPath) return null;

  if (categoryPath.categorySlugs?.length) {
    return resolveOrCreateCategoryIdBySlugPath(categoryPath.categorySlugs);
  }

  const slugs = [
    categoryPath.categorySlug,
    categoryPath.subcategorySlug,
    ...(categoryPath.childCategorySlug ? [categoryPath.childCategorySlug] : []),
  ];

  return resolveOrCreateCategoryIdBySlugPath(slugs);
}

export function categorySlugsFromFlatPath(flat: FlatCategoryPath): string[] {
  return flat.segments.map((segment) => segment.slug);
}

export function categoryPathPayloadFromFlat(flat: FlatCategoryPath): CategoryPathPayload {
  const slugs = categorySlugsFromFlatPath(flat);
  return {
    categorySlug: flat.categorySlug,
    subcategorySlug: flat.subcategorySlug,
    childCategorySlug: flat.childCategorySlug,
    categorySlugs: slugs,
  };
}

export function leafSlugFromPayload(categoryPath: CategoryPathPayload): string {
  if (categoryPath.categorySlugs?.length) {
    return categoryPath.categorySlugs[categoryPath.categorySlugs.length - 1]!;
  }
  return categoryPath.childCategorySlug ?? categoryPath.subcategorySlug;
}

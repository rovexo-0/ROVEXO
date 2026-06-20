import { categoryTree } from "@/lib/categories/tree";
import type { CategoryNode, CategoryPath, FlatCategoryPath } from "@/lib/categories/types";

function buildPathLabel(path: CategoryPath): string {
  const parts = [path.category.name, path.subcategory.name];
  if (path.childCategory) parts.push(path.childCategory.name);
  return parts.join(" › ");
}

function walkPaths(
  category: CategoryNode,
  subcategory: CategoryNode,
  childCategory: CategoryNode | undefined,
  results: FlatCategoryPath[],
): void {
  const path: CategoryPath = { category, subcategory, childCategory };
  results.push({
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    subcategoryId: subcategory.id,
    subcategoryName: subcategory.name,
    subcategorySlug: subcategory.slug,
    childCategoryId: childCategory?.id,
    childCategoryName: childCategory?.name,
    childCategorySlug: childCategory?.slug,
    pathLabel: buildPathLabel(path),
  });
}

export function flattenCategoryPaths(): FlatCategoryPath[] {
  const results: FlatCategoryPath[] = [];

  for (const category of categoryTree) {
    if (!category.children?.length) continue;

    for (const subcategory of category.children) {
      if (subcategory.children?.length) {
        for (const child of subcategory.children) {
          walkPaths(category, subcategory, child, results);
        }
      } else {
        walkPaths(category, subcategory, undefined, results);
      }
    }
  }

  return results;
}

export function resolveCategoryPath(
  categorySlug: string,
  subcategorySlug: string,
  childCategorySlug?: string,
): CategoryPath | null {
  const category = categoryTree.find((node) => node.slug === categorySlug);
  if (!category?.children) return null;

  const subcategory = category.children.find((node) => node.slug === subcategorySlug);
  if (!subcategory) return null;

  if (!childCategorySlug) {
    return { category, subcategory };
  }

  const childCategory = subcategory.children?.find((node) => node.slug === childCategorySlug);
  if (!childCategory) return null;

  return { category, subcategory, childCategory };
}

export function flatPathToCategoryPath(flat: FlatCategoryPath): CategoryPath | null {
  return resolveCategoryPath(
    flat.categorySlug,
    flat.subcategorySlug,
    flat.childCategorySlug,
  );
}

export function getCategoryTree(): CategoryNode[] {
  return categoryTree;
}

export function findCategoryPathById(pathId: string): FlatCategoryPath | undefined {
  return flattenCategoryPaths().find(
    (path) =>
      [path.childCategoryId, path.subcategoryId, path.categoryId].filter(Boolean).join(":") === pathId ||
      `${path.categorySlug}:${path.subcategorySlug}:${path.childCategorySlug ?? ""}` === pathId,
  );
}

export function toPathId(flat: FlatCategoryPath): string {
  return `${flat.categorySlug}:${flat.subcategorySlug}:${flat.childCategorySlug ?? ""}`;
}

export function categoryPathFromFlat(flat: FlatCategoryPath): CategoryPath {
  const resolved = flatPathToCategoryPath(flat);
  if (!resolved) {
    throw new Error("Invalid category path");
  }
  return resolved;
}

export { buildPathLabel };

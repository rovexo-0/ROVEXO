import { categoryTree } from "@/lib/categories/tree";
import type { CategoryNode, CategoryPath, FlatCategoryPath } from "@/lib/categories/types";
import { flatPathFromSegments, CATEGORY_PATH_SEPARATOR } from "@/lib/categories/types";
import {
  collectLeafPaths,
  findNodeBySlugPath,
  segmentsFromPath,
} from "@/lib/categories/navigation";

function buildPathLabel(path: CategoryPath): string {
  const parts = [path.category.name, path.subcategory.name];
  if (path.childCategory) parts.push(path.childCategory.name);
  return parts.join(CATEGORY_PATH_SEPARATOR);
}

function walkLegacyPaths(
  category: CategoryNode,
  subcategory: CategoryNode,
  childCategory: CategoryNode | undefined,
  results: FlatCategoryPath[],
): void {
  const segments = childCategory
    ? segmentsFromPath([category, subcategory, childCategory])
    : segmentsFromPath([category, subcategory]);

  results.push(flatPathFromSegments(segments));
}

export function flattenCategoryPaths(): FlatCategoryPath[] {
  return collectLeafPaths(categoryTree).map(({ segments }) => flatPathFromSegments(segments));
}

export function resolveCategoryPath(
  categorySlug: string,
  subcategorySlug: string,
  childCategorySlug?: string,
): CategoryPath | null {
  const slugs = childCategorySlug
    ? [categorySlug, subcategorySlug, childCategorySlug]
    : [categorySlug, subcategorySlug];
  const path = findNodeBySlugPath(categoryTree, slugs);
  if (!path || path.length < 2) return null;

  return {
    category: path[0]!,
    subcategory: path[1]!,
    childCategory: path[2],
  };
}

export function resolveCategoryPathBySlugs(slugs: string[]): FlatCategoryPath | null {
  const path = findNodeBySlugPath(categoryTree, slugs);
  if (!path || path.length < 2) return null;
  return flatPathFromSegments(segmentsFromPath(path));
}

export function flatPathToCategoryPath(flat: FlatCategoryPath): CategoryPath | null {
  const slugs = flat.segments.map((segment) => segment.slug);
  const path = findNodeBySlugPath(categoryTree, slugs);
  if (!path || path.length < 2) return null;

  return {
    category: path[0]!,
    subcategory: path[1]!,
    childCategory: path[2],
  };
}

export function getCategoryTree(): CategoryNode[] {
  return categoryTree;
}

export function findCategoryPathById(pathId: string): FlatCategoryPath | undefined {
  return flattenCategoryPaths().find(
    (path) =>
      path.segments.map((segment) => segment.id).join(":") === pathId ||
      `${path.categorySlug}:${path.subcategorySlug}:${path.childCategorySlug ?? ""}` === pathId ||
      path.segments.map((segment) => segment.slug).join(":") === pathId,
  );
}

export function toPathId(flat: FlatCategoryPath): string {
  return flat.segments.map((segment) => segment.slug).join(":");
}

export function categoryPathFromFlat(flat: FlatCategoryPath): CategoryPath {
  const resolved = flatPathToCategoryPath(flat);
  if (!resolved) {
    throw new Error("Invalid category path");
  }
  return resolved;
}

export { buildPathLabel, walkLegacyPaths };

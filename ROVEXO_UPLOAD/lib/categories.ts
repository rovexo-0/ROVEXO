/** @deprecated Import from `@/lib/categories/tree` instead. */
export { homeCategories } from "@/lib/categories/tree";

export type {
  CategoryNode,
  CategoryPath,
  CategorySegment,
  FlatCategoryPath,
} from "@/lib/categories/types";
export {
  flatPathFromSegments,
  leafSlugFromFlatPath,
} from "@/lib/categories/types";
export {
  categoryPathFromFlat,
  findCategoryPathById,
  flatPathToCategoryPath,
  flattenCategoryPaths,
  getCategoryTree,
  resolveCategoryPath,
  resolveCategoryPathBySlugs,
  toPathId,
  buildPathLabel,
} from "@/lib/categories/queries";
export {
  breadcrumbsFromPath,
  collectLeafPaths,
  findNodeBySlugPath,
  getCategoryHrefFromSlugs,
  segmentsFromPath,
} from "@/lib/categories/navigation";
export type { CategoryBreadcrumb } from "@/lib/categories/navigation";
export { getCategoryIcon, getCategoryImageUrl } from "@/lib/categories/visuals";
export { categoryTree } from "@/lib/categories/tree";

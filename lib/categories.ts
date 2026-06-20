/** @deprecated Import from `@/lib/categories/tree` instead. */
export { homeCategories } from "@/lib/categories/tree";

export type { CategoryNode, CategoryPath, FlatCategoryPath } from "@/lib/categories/types";
export {
  categoryPathFromFlat,
  findCategoryPathById,
  flatPathToCategoryPath,
  flattenCategoryPaths,
  getCategoryTree,
  resolveCategoryPath,
  toPathId,
  buildPathLabel,
} from "@/lib/categories/queries";
export { categoryTree } from "@/lib/categories/tree";

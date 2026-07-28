/**
 * Absolute Law XXXI — Database taxonomy trees are FORBIDDEN.
 * This module never returns legacy DB category trees.
 * All callers receive Catalog Master via getCategoryTree().
 */

import { getCategoryTree } from "@/lib/categories/queries";
import type { CategoryNode } from "@/lib/categories/types";

/**
 * @deprecated Name retained for compatibility only.
 * Always resolves to Catalog Master — never the database taxonomy.
 */
export async function buildCategoryTreeFromDatabase(): Promise<CategoryNode[]> {
  return getCategoryTree();
}

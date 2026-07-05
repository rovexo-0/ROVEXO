import { loadAllCategories, type DbCategory } from "@/lib/categories/server";
import type { CategoryNode } from "@/lib/categories/types";
import { resolveTransactionModeFromDbValue } from "@/lib/transaction-mode/resolver";

function buildNodes(categories: DbCategory[], parentId: string | null): CategoryNode[] {
  return categories
    .filter((category) => category.parentId === parentId)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      transactionMode: category.transactionMode
        ? resolveTransactionModeFromDbValue(category.transactionMode)
        : undefined,
      children: buildNodes(categories, category.id),
    }));
}

export async function buildCategoryTreeFromDatabase(): Promise<CategoryNode[]> {
  const categories = await loadAllCategories();
  if (!categories.length) return [];
  return buildNodes(categories, null);
}

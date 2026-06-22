import { flattenCategoryPaths } from "@/lib/categories/queries";

let cachedPromptBlock: string | null = null;

/**
 * Compact taxonomy block for the vision model.
 * Format: categorySlug/subcategorySlug/childCategorySlug|Human readable label
 */
export function getTaxonomyPromptBlock(): string {
  if (cachedPromptBlock) return cachedPromptBlock;

  cachedPromptBlock = flattenCategoryPaths()
    .map((path) => {
      const slugs = [
        path.categorySlug,
        path.subcategorySlug,
        path.childCategorySlug,
      ]
        .filter(Boolean)
        .join("/");
      return `${slugs}|${path.pathLabel}`;
    })
    .join("\n");

  return cachedPromptBlock;
}

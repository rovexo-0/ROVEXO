/**
 * ROVEXO Category Engine v1.0 — Sell category contract (Catalog Master SSOT).
 *
 * STATUS: OWNER AUTHORIZED · CONFIRM-ONLY SUGGESTION · FAIL CLOSED
 *
 * ONE taxonomy = Catalog Master (`lib/catalog/tree.ts` → `getCategoryTree()`).
 * Title-only leaf apply (Native canonical). Description is never a classifier.
 * Manual picker/search leaf is canonical and is not silently overwritten.
 * NEVER: AI category · description-based category · ranking percent overlay · confirm overlay.
 * Depth: Category → Subcategory → Product Type (exactly 3 levels).
 */

import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import { categoryTree } from "@/lib/categories/tree";
import type { CategoryNode, FlatCategoryPath } from "@/lib/categories/types";
import { analyzeListingContent } from "@/lib/moderation/analyzer";

export const CATEGORY_ENGINE_V1 = {
  id: "category-engine-v1",
  version: "1.0.0",
  status: "ACTIVE",
  ssot: "lib/catalog/tree.ts",
  depth: 3 as const,
  levels: ["category", "subcategory", "product_type"] as const,
  /** Title-only leaf apply · manual picker lock · Native canonical. */
  selection: "title_only_leaf_apply_manual_lock" as const,
  forbidden: [
    "ai_category",
    "auto_category",
    "auto_description",
    "auto_select_category",
    "auto_product_classification",
  ] as const,
} as const;

export type CategoryEngineGateResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

function findNodeBySlugPath(slugs: string[], nodes: CategoryNode[] = categoryTree): CategoryNode | null {
  if (slugs.length === 0) return null;
  let current: CategoryNode[] = nodes;
  let node: CategoryNode | null = null;
  for (const slug of slugs) {
    node = current.find((entry) => entry.slug === slug) ?? null;
    if (!node) return null;
    current = node.children ?? [];
  }
  return node;
}

/** Fail closed: slug path must be a Catalog Master leaf at depth 3. */
export function validateManualCategorySlugs(slugs: string[] | null | undefined): CategoryEngineGateResult {
  if (!slugs?.length) {
    return {
      ok: false,
      code: "CATEGORY_MISSING",
      message: "Select a category, subcategory, and product type.",
    };
  }

  if (slugs.length !== CATEGORY_ENGINE_V1.depth) {
    return {
      ok: false,
      code: "CATEGORY_DEPTH_INVALID",
      message: "Select Category → Subcategory → Product Type (3 levels).",
    };
  }

  if (slugs.some((slug) => !slug.trim())) {
    return {
      ok: false,
      code: "CATEGORY_INCOMPLETE",
      message: "Category, subcategory, and product type are all required.",
    };
  }

  const fromQuery = resolveCategoryPathBySlugs(slugs);
  const leaf = findNodeBySlugPath(slugs);
  if (!fromQuery || !leaf) {
    return {
      ok: false,
      code: "UNKNOWN_TAXONOMY_NODE",
      message: "Selected category is not in the official ROVEXO catalogue.",
    };
  }

  if (leaf.children?.length) {
    return {
      ok: false,
      code: "CATEGORY_NOT_LEAF",
      message: "Select a product type (final category level).",
    };
  }

  return { ok: true };
}

/** Fail closed: path must be a Catalog Master leaf at depth 3. */
export function validateManualCategoryPath(
  path: FlatCategoryPath | null | undefined,
): CategoryEngineGateResult {
  if (!path) {
    return {
      ok: false,
      code: "CATEGORY_MISSING",
      message: "Select a category, subcategory, and product type.",
    };
  }

  if (!path.categorySlug || !path.subcategorySlug || !path.childCategorySlug) {
    return {
      ok: false,
      code: "CATEGORY_INCOMPLETE",
      message: "Category, subcategory, and product type are all required.",
    };
  }

  return validateManualCategorySlugs(path.segments.map((segment) => segment.slug));
}

/**
 * Prohibited Items Engine — content gate used before publish (fail closed).
 * Uses the existing moderation analyzer (no parallel engine).
 */
export function validateListingAgainstProhibitedEngine(input: {
  title: string;
  description: string;
  brand?: string;
}): CategoryEngineGateResult {
  const result = analyzeListingContent({
    title: input.title,
    description: input.description,
    brand: input.brand,
  });

  if (result.decision === "blocked") {
    return {
      ok: false,
      code: "PROHIBITED_ITEM",
      message:
        result.summary?.trim() ||
        "This item is prohibited on ROVEXO and cannot be published.",
    };
  }

  return { ok: true };
}

/** Combined publish gate: taxonomy + prohibited content. */
export function assertSellCategoryPublishGate(input: {
  categoryPath: FlatCategoryPath | null | undefined;
  title: string;
  description: string;
  brand?: string;
}): CategoryEngineGateResult {
  const taxonomy = validateManualCategoryPath(input.categoryPath);
  if (!taxonomy.ok) return taxonomy;
  return validateListingAgainstProhibitedEngine({
    title: input.title,
    description: input.description,
    brand: input.brand,
  });
}

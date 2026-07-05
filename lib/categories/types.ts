import { resolveTransactionModeForRootSlug } from "@/lib/transaction-mode/defaults";
import type { TransactionMode } from "@/lib/transaction-mode/types";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  /** Inherited from root sector — MARKETPLACE (default) or DIRECT_CONTACT. */
  transactionMode?: TransactionMode;
  children?: CategoryNode[];
};

export type CategorySegment = {
  id: string;
  name: string;
  slug: string;
};

export type CategoryPath = {
  category: CategoryNode;
  subcategory: CategoryNode;
  childCategory?: CategoryNode;
};

export type FlatCategoryPath = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  subcategoryId: string;
  subcategoryName: string;
  subcategorySlug: string;
  childCategoryId?: string;
  childCategoryName?: string;
  childCategorySlug?: string;
  segments: CategorySegment[];
  pathLabel: string;
  transactionMode?: TransactionMode;
};

/** Separator used when displaying category paths in Sell, filters and browse UI. */
export const CATEGORY_PATH_SEPARATOR = " > ";

export function formatCategoryPathLabel(segments: CategorySegment[]): string {
  return segments.map((segment) => segment.name).join(CATEGORY_PATH_SEPARATOR);
}

export function flatPathFromSegments(segments: CategorySegment[]): FlatCategoryPath {
  const [category, subcategory, child] = segments;
  if (!category || !subcategory) {
    throw new Error("Category path requires at least two segments.");
  }

  const leaf = segments[segments.length - 1]!;

  return {
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    subcategoryId: subcategory.id,
    subcategoryName: subcategory.name,
    subcategorySlug: subcategory.slug,
    childCategoryId: child?.id ?? (segments.length > 2 ? leaf.id : undefined),
    childCategoryName: child?.name ?? (segments.length > 2 ? leaf.name : undefined),
    childCategorySlug: child?.slug ?? (segments.length > 2 ? leaf.slug : undefined),
    segments,
    pathLabel: formatCategoryPathLabel(segments),
    transactionMode: resolveTransactionModeForRootSlug(category.slug),
  };
}

export function leafSlugFromFlatPath(flat: FlatCategoryPath): string {
  return flat.segments[flat.segments.length - 1]?.slug ?? flat.childCategorySlug ?? flat.subcategorySlug;
}

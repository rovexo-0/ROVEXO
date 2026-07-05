import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import type { CategoryNode } from "@/lib/categories/types";
import type { FlatCategoryPath } from "@/lib/categories/types";
import type { CategoryPathPayload } from "@/lib/categories/resolve-listing";
import { resolveTransactionModeForRootSlug } from "@/lib/transaction-mode/defaults";
import type { TransactionMode } from "@/lib/transaction-mode/types";
import { DEFAULT_TRANSACTION_MODE, parseTransactionMode } from "@/lib/transaction-mode/types";

export function resolveTransactionModeFromFlatPath(flat: FlatCategoryPath): TransactionMode {
  if (flat.transactionMode) {
    return flat.transactionMode;
  }
  return resolveTransactionModeForRootSlug(flat.categorySlug);
}

export function resolveTransactionModeFromCategoryPathPayload(
  payload: CategoryPathPayload,
): TransactionMode {
  const slugs =
    payload.categorySlugs?.length && payload.categorySlugs.length >= 2
      ? payload.categorySlugs
      : [
          payload.categorySlug,
          payload.subcategorySlug,
          ...(payload.childCategorySlug ? [payload.childCategorySlug] : []),
        ];

  const flat = resolveCategoryPathBySlugs(slugs);
  return flat ? resolveTransactionModeFromFlatPath(flat) : DEFAULT_TRANSACTION_MODE;
}

export function resolveTransactionModeFromCategoryNode(node: CategoryNode, rootSlug?: string): TransactionMode {
  if (node.transactionMode) {
    return node.transactionMode;
  }
  if (rootSlug) {
    return resolveTransactionModeForRootSlug(rootSlug);
  }
  return resolveTransactionModeForRootSlug(node.slug);
}

export function resolveTransactionModeFromDbValue(value: unknown): TransactionMode {
  return parseTransactionMode(value, DEFAULT_TRANSACTION_MODE);
}

export function stampTransactionModeOnTree(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.map((node) => {
    const mode = resolveTransactionModeForRootSlug(node.slug);
    return stampNodeWithInheritedMode(node, mode);
  });
}

function stampNodeWithInheritedMode(node: CategoryNode, mode: TransactionMode): CategoryNode {
  return {
    ...node,
    transactionMode: mode,
    children: node.children?.map((child) => stampNodeWithInheritedMode(child, mode)),
  };
}

/**
 * Marketplace taxonomy validation — structural integrity for the canonical tree.
 */

import { categoryTree } from "@/lib/categories/tree";
import type { CategoryNode } from "@/lib/categories/types";
import { isTransactionMode } from "@/lib/transaction-mode/types";

export type TaxonomyValidationIssue = {
  code:
    | "duplicate-id"
    | "duplicate-slug"
    | "empty-name"
    | "invalid-slug"
    | "orphan-segment"
    | "shallow-path"
    | "invalid-transaction-mode";
  message: string;
  path?: string;
};

export type TaxonomyValidationReport = {
  valid: boolean;
  nodeCount: number;
  leafCount: number;
  maxDepth: number;
  issues: TaxonomyValidationIssue[];
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function walk(
  node: CategoryNode,
  parentSlugs: string[],
  seenIds: Map<string, string>,
  seenSlugs: Map<string, string>,
  issues: TaxonomyValidationIssue[],
  stats: { nodes: number; leaves: number; maxDepth: number },
  depth: number,
) {
  stats.nodes += 1;
  stats.maxDepth = Math.max(stats.maxDepth, depth);

  const slugPath = [...parentSlugs, node.slug].join("/");

  if (!node.name.trim()) {
    issues.push({ code: "empty-name", message: "Category name is empty.", path: slugPath });
  }

  if (!SLUG_PATTERN.test(node.slug)) {
    issues.push({ code: "invalid-slug", message: `Invalid slug "${node.slug}".`, path: slugPath });
  }

  const priorId = seenIds.get(node.id);
  if (priorId && priorId !== slugPath) {
    issues.push({
      code: "duplicate-id",
      message: `Duplicate id "${node.id}".`,
      path: slugPath,
    });
  } else {
    seenIds.set(node.id, slugPath);
  }

  const priorSlug = seenSlugs.get(slugPath);
  if (priorSlug) {
    issues.push({
      code: "duplicate-slug",
      message: `Duplicate slug path "${slugPath}".`,
      path: slugPath,
    });
  } else {
    seenSlugs.set(slugPath, node.id);
  }

  if (depth === 1 && node.transactionMode && !isTransactionMode(node.transactionMode)) {
    issues.push({
      code: "invalid-transaction-mode",
      message: `Invalid transaction mode on root "${node.slug}".`,
      path: slugPath,
    });
  }

  if (!node.children?.length) {
    stats.leaves += 1;
    if (depth < 2) {
      issues.push({
        code: "shallow-path",
        message: "Publishable paths require at least two segments.",
        path: slugPath,
      });
    }
    return;
  }

  for (const child of node.children) {
    walk(child, [...parentSlugs, node.slug], seenIds, seenSlugs, issues, stats, depth + 1);
  }
}

export function validateMarketplaceTaxonomy(tree: CategoryNode[] = categoryTree): TaxonomyValidationReport {
  const issues: TaxonomyValidationIssue[] = [];
  const stats = { nodes: 0, leaves: 0, maxDepth: 0 };
  const seenIds = new Map<string, string>();
  const seenSlugs = new Map<string, string>();

  for (const root of tree) {
    if (!root.children?.length) {
      issues.push({
        code: "orphan-segment",
        message: `Root "${root.slug}" has no subcategories.`,
        path: root.slug,
      });
    }
    walk(root, [], seenIds, seenSlugs, issues, stats, 1);
  }

  return {
    valid: issues.length === 0,
    nodeCount: stats.nodes,
    leafCount: stats.leaves,
    maxDepth: stats.maxDepth,
    issues,
  };
}

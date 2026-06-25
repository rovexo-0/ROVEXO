import { taxonomyTree, type TaxonomyCategoryNode } from "@/lib/taxonomy/category-tree";

export type TaxonomyIssueSeverity = "warning" | "error";

export type TaxonomyValidationIssue = {
  type: "duplicateId" | "duplicateSlug" | "duplicateSeoSlug" | "missingParent" | "emptyName" | "invalidSlug" | "invalidSeoSlug" | "invalidAlias" | "invalidKeyword" | "invalidBrand" | "invalidModel";
  message: string;
  node: TaxonomyCategoryNode;
};

function isValidSlug(slug: string): boolean {
  return typeof slug === "string" && slug.length > 0 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function validateTaxonomyTree(tree: TaxonomyCategoryNode[] = taxonomyTree): TaxonomyValidationIssue[] {
  const issues: TaxonomyValidationIssue[] = [];
  const idRegistry = new Set<string>();
  const slugRegistry = new Set<string>();
  const seoSlugRegistry = new Set<string>();
  const parentIds = new Set<string>();

  const walk = (node: TaxonomyCategoryNode, parentId: string | null) => {
    if (!node.name.trim()) {
      issues.push({ type: "emptyName", message: `Category name is empty for id ${node.id}.`, node });
    }

    if (!isValidSlug(node.slug)) {
      issues.push({ type: "invalidSlug", message: `Invalid slug '${node.slug}' for category ${node.id}.`, node });
    }

    if (!isValidSlug(node.seoSlug.replace(/\//g, "-"))) {
      issues.push({ type: "invalidSeoSlug", message: `Invalid seoSlug '${node.seoSlug}' for category ${node.id}.`, node });
    }

    if (idRegistry.has(node.id)) {
      issues.push({ type: "duplicateId", message: `Duplicate category id '${node.id}'.`, node });
    }
    idRegistry.add(node.id);

    if (slugRegistry.has(node.slug)) {
      issues.push({ type: "duplicateSlug", message: `Duplicate slug '${node.slug}' for category ${node.id}.`, node });
    }
    slugRegistry.add(node.slug);

    if (seoSlugRegistry.has(node.seoSlug)) {
      issues.push({ type: "duplicateSeoSlug", message: `Duplicate seoSlug '${node.seoSlug}' for category ${node.id}.`, node });
    }
    seoSlugRegistry.add(node.seoSlug);

    if (parentId) {
      parentIds.add(parentId);
    }

    for (const alias of node.aliases ?? []) {
      if (!alias.trim()) {
        issues.push({ type: "invalidAlias", message: `Empty alias on category ${node.id}.`, node });
      }
    }

    for (const keyword of node.keywords ?? []) {
      if (!keyword.trim()) {
        issues.push({ type: "invalidKeyword", message: `Empty keyword on category ${node.id}.`, node });
      }
    }

    for (const brand of node.brands ?? []) {
      if (!brand.trim()) {
        issues.push({ type: "invalidBrand", message: `Empty brand on category ${node.id}.`, node });
      }
    }

    for (const model of node.models ?? []) {
      if (!model.trim()) {
        issues.push({ type: "invalidModel", message: `Empty model on category ${node.id}.`, node });
      }
    }

    node.children.forEach((child) => walk(child, node.id));
  };

  tree.forEach((node) => walk(node, null));

  const missingParents = Array.from(parentIds).filter((parentId) => !idRegistry.has(parentId));
  for (const parentId of missingParents) {
    issues.push({
      type: "missingParent",
      message: `Parent id '${parentId}' is referenced but missing from taxonomy.`,
      node: tree[0],
    });
  }

  return issues;
}

export function assertTaxonomyIsValid(tree: TaxonomyCategoryNode[] = taxonomyTree): void {
  const issues = validateTaxonomyTree(tree);
  if (issues.length > 0) {
    const messages = issues.map((issue) => `${issue.type}: ${issue.message}`).join("\n");
    throw new Error(`Taxonomy validation failed:\n${messages}`);
  }
}

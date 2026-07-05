import type { CategoryNode } from "@/lib/categories/types";
import { getCategoryIcon } from "@/lib/categories/visuals";
import { resolveTransactionModeForRootSlug } from "@/lib/transaction-mode/defaults";
import type { TransactionMode } from "@/lib/transaction-mode/types";

export type CatalogItem = readonly [name: string, slug: string];

/** Product-type group under a subcategory (enables 4+ level paths). */
export type ProductGroupDef = {
  name: string;
  slug: string;
  items: readonly CatalogItem[];
};

export type DepartmentDef = {
  name: string;
  slug: string;
  /** Flat product types directly under the subcategory (3-level paths). */
  items?: readonly CatalogItem[];
  /** Nested product-type groups (4-level paths: category > subcategory > group > type). */
  groups?: readonly ProductGroupDef[];
  brands?: readonly string[];
};

export type SectorDef = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  departments: DepartmentDef[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function leaf(id: string, name: string, slug: string): CategoryNode {
  return { id, name, slug };
}

function branch(id: string, name: string, slug: string, children: CategoryNode[]): CategoryNode {
  return { id, name, slug, children };
}

function leaves(prefix: string, items: readonly CatalogItem[]): CategoryNode[] {
  return items.map(([name, slug]) => leaf(`${prefix}-${slug}`, name, slug));
}

function brandLeaves(prefix: string, brands: readonly string[]): CategoryNode[] {
  return brands.map((brand) => {
    const slug = slugify(brand);
    return leaf(`${prefix}-brand-${slug}`, brand, slug);
  });
}

export function buildDepartmentNode(sectorId: string, department: DepartmentDef): CategoryNode {
  const prefix = `${sectorId}-${department.slug}`;
  const children: CategoryNode[] = [];

  if (department.items?.length) {
    children.push(...leaves(prefix, department.items));
  }

  if (department.groups?.length) {
    for (const group of department.groups) {
      const groupPrefix = `${prefix}-${group.slug}`;
      children.push(branch(groupPrefix, group.name, group.slug, leaves(groupPrefix, group.items)));
    }
  }

  if (department.brands?.length) {
    children.push(
      branch(`${prefix}-brands`, "By Brand", "by-brand", brandLeaves(`${prefix}-brands`, department.brands)),
    );
  }

  return branch(prefix, department.name, department.slug, children);
}

function stampInheritedTransactionMode(node: CategoryNode, mode: TransactionMode): CategoryNode {
  return {
    ...node,
    transactionMode: mode,
    children: node.children?.map((child) => stampInheritedTransactionMode(child, mode)),
  };
}

export function buildSectorNode(sector: SectorDef): CategoryNode {
  const mode = resolveTransactionModeForRootSlug(sector.slug);
  return stampInheritedTransactionMode(
    branch(
      sector.id,
      sector.name,
      sector.slug,
      sector.departments.map((department) => buildDepartmentNode(sector.id, department)),
    ),
    mode,
  );
}

export function buildEnterpriseTree(sectors: SectorDef[]): CategoryNode[] {
  return sectors
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((sector) => ({
      ...buildSectorNode(sector),
      icon: getCategoryIcon(sector.slug),
    }));
}

export function countTreeNodes(tree: CategoryNode[]): { roots: number; branches: number; leaves: number } {
  let branches = 0;
  let leaves = 0;

  function walk(node: CategoryNode) {
    if (!node.children?.length) {
      leaves += 1;
      return;
    }
    branches += 1;
    for (const child of node.children) walk(child);
  }

  for (const root of tree) walk(root);
  return { roots: tree.length, branches, leaves };
}

export { slugify };

import type { CategoryNode } from "@/lib/categories/types";
import { getCategoryIcon } from "@/lib/categories/visuals";

export type CatalogItem = readonly [name: string, slug: string];

export type DepartmentDef = {
  name: string;
  slug: string;
  items: readonly CatalogItem[];
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
  const itemNodes = leaves(prefix, department.items);
  const brandNodes = department.brands?.length ? brandLeaves(`${prefix}-brands`, department.brands) : [];

  if (brandNodes.length) {
    return branch(prefix, department.name, department.slug, [
      ...itemNodes,
      branch(`${prefix}-brands`, "By Brand", "by-brand", brandNodes),
    ]);
  }

  return branch(prefix, department.name, department.slug, itemNodes);
}

export function buildSectorNode(sector: SectorDef): CategoryNode {
  return branch(
    sector.id,
    sector.name,
    sector.slug,
    sector.departments.map((department) => buildDepartmentNode(sector.id, department)),
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

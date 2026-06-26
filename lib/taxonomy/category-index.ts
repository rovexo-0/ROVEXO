import {
  getFlatTaxonomy as getFlatTaxonomyNodes,
  getTaxonomyTree as getTaxonomyTreeNodes,
  type TaxonomyCategoryNode,
} from "@/lib/taxonomy/category-tree";
import { normalizeText } from "@/lib/taxonomy/category-normalizer";
import { getKeywordMatches } from "@/lib/taxonomy/category-keywords";
import { getSynonymEntries } from "@/lib/taxonomy/category-synonyms";

export type CategoryIndexMaps = {
  byId: Map<string, TaxonomyCategoryNode>;
  bySlug: Map<string, TaxonomyCategoryNode>;
  bySeoSlug: Map<string, TaxonomyCategoryNode>;
  pathById: Map<string, string[]>;
};

let indexMaps: CategoryIndexMaps | null = null;

function buildIndexMaps(): CategoryIndexMaps {
  if (indexMaps) return indexMaps;

  const byId = new Map<string, TaxonomyCategoryNode>();
  const bySlug = new Map<string, TaxonomyCategoryNode>();
  const bySeoSlug = new Map<string, TaxonomyCategoryNode>();
  const pathById = new Map<string, string[]>();

  function walk(node: TaxonomyCategoryNode, path: string[]) {
    byId.set(node.id, node);
    bySlug.set(node.slug, node);
    bySeoSlug.set(node.seoSlug, node);
    pathById.set(node.id, [...path, node.slug]);

    for (const child of node.children) {
      walk(child, [...path, node.slug]);
    }
  }

  getTaxonomyTreeNodes().forEach((root) => walk(root, []));

  indexMaps = { byId, bySlug, bySeoSlug, pathById };
  return indexMaps;
}

export function getCategoryById(id: string): TaxonomyCategoryNode | undefined {
  return buildIndexMaps().byId.get(id);
}

export function getCategoryBySlug(slug: string): TaxonomyCategoryNode | undefined {
  return buildIndexMaps().bySlug.get(slug);
}

export function getCategoryBySeoSlug(seoSlug: string): TaxonomyCategoryNode | undefined {
  return buildIndexMaps().bySeoSlug.get(seoSlug);
}

export function getCategoryPathSlugs(categoryId: string): string[] {
  return buildIndexMaps().pathById.get(categoryId) ?? [];
}

export function getCategoryPathLabel(categoryId: string): string {
  return getCategoryPathSlugs(categoryId).map((segment) => segment.split("-").join(" ")).join(" › ");
}

export function getCategorySearchTokens(category: TaxonomyCategoryNode): string[] {
  const strings = [
    category.name,
    category.slug.replace(/-/g, " "),
    ...(category.aliases ?? []),
    ...(category.keywords ?? []),
    ...(category.brands ?? []),
    ...(category.models ?? []),
    category.seoSlug.replace(/\//g, " "),
  ];

  return Array.from(
    new Set(
      strings
        .filter(Boolean)
        .map(normalizeText)
        .flatMap((value) => value.split(/\s+/))
        .filter(Boolean),
    ),
  );
}

export function findCategoriesByText(text: string): TaxonomyCategoryNode[] {
  const normalized = normalizeText(text);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const categoryIds = new Set<string>();

  for (const token of tokens) {
    for (const entry of getKeywordMatches(token)) {
      categoryIds.add(entry.categoryId);
    }

    for (const synonym of getSynonymEntries(token)) {
      if (synonym.categoryId.startsWith("taxonomy:")) {
        categoryIds.add(synonym.categoryId);
      }
    }
  }

  return Array.from(categoryIds)
    .map((id) => getCategoryById(id))
    .filter((node): node is TaxonomyCategoryNode => Boolean(node));
}

export function getFlatTaxonomy(): TaxonomyCategoryNode[] {
  return getFlatTaxonomyNodes();
}

export function getTaxonomyTree(): TaxonomyCategoryNode[] {
  return getTaxonomyTreeNodes();
}

export function getTaxonomyReport() {
  const flat = getFlatTaxonomyNodes();
  const totalCategories = flat.length;
  const totalSubcategories = flat.filter((node) => !node.isLeaf).length;
  const totalLeafCategories = flat.filter((node) => node.isLeaf).length;
  const totalAliases = flat.reduce((sum, node) => sum + (node.aliases?.length ?? 0), 0);
  const totalKeywords = flat.reduce((sum, node) => sum + (node.keywords?.length ?? 0), 0);
  const totalBrands = flat.reduce((sum, node) => sum + (node.brands?.length ?? 0), 0);
  const totalModels = flat.reduce((sum, node) => sum + (node.models?.length ?? 0), 0);
  const totalSynonymPhrases = totalAliases + totalKeywords + totalBrands + totalModels + totalCategories;

  return {
    totalCategories,
    totalSubcategories,
    totalLeafCategories,
    totalAliases,
    totalKeywords,
    totalBrands,
    totalModels,
    totalSynonymPhrases,
    totalNodesInTree: totalCategories,
  };
}

export function getAllCategoryIds(): string[] {
  return getFlatTaxonomyNodes().map((node) => node.id);
}

export function getAllSeoSlugs(): string[] {
  return getFlatTaxonomyNodes().map((node) => node.seoSlug);
}

import { findNodeBySlugPath } from "@/lib/categories/navigation";
import { categoryTree } from "@/lib/categories/tree";
import { findLocationBySlug } from "@/lib/seo/locations/uk";
import {
  CATEGORY_ALIASES,
  CONDITION_SLUGS,
  PRICE_RANGE_SLUGS,
  resolveCategoryAlias,
} from "@/lib/seo/programmatic/aliases";

export type ProgrammaticPageType =
  | "category"
  | "category-location"
  | "category-brand"
  | "category-condition"
  | "category-price"
  | "location"
  | "brand";

export type ProgrammaticPage = {
  type: ProgrammaticPageType;
  title: string;
  description: string;
  path: string;
  categorySlugs: string[];
  locationSlug?: string;
  locationName?: string;
  brand?: string;
  condition?: string;
  priceRange?: { min?: number; max?: number; label: string };
  canonicalCategoryPath: string;
};

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCategoryPath(slugs: string[]): string {
  return `/category/${slugs.join("/")}`;
}

export function resolveProgrammaticPage(segments: string[]): ProgrammaticPage | null {
  if (!segments.length) return null;

  const first = segments[0]!.toLowerCase();
  let categorySlugs = resolveCategoryAlias(first) ?? [first];
  let index = CATEGORY_ALIASES[first] ? 1 : 1;

  if (!CATEGORY_ALIASES[first]) {
    const directPath = findNodeBySlugPath(categoryTree, segments);
    if (directPath) {
      categorySlugs = segments;
      return buildCategoryPage(categorySlugs, `/browse/${segments.join("/")}`);
    }
    const partial = findNodeBySlugPath(categoryTree, [first]);
    if (partial && segments.length > 1) {
      categorySlugs = [first, ...segments.slice(1)];
    }
  } else {
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]!.toLowerCase();
      const extended = findNodeBySlugPath(categoryTree, [...categorySlugs, segment]);
      if (extended) {
        categorySlugs = [...categorySlugs, segment];
        index = i + 1;
        continue;
      }
      break;
    }
  }

  const categoryPath = findNodeBySlugPath(categoryTree, categorySlugs);
  if (!categoryPath) return null;

  const remaining = segments.slice(index);
  if (!remaining.length) {
    return buildCategoryPage(categorySlugs, `/browse/${segments.join("/")}`);
  }

  const next = remaining[0]!;
  const location = findLocationBySlug(next);
  if (location) {
    const categoryName = categoryPath[categoryPath.length - 1]!.name;
    return {
      type: "category-location",
      title: `${categoryName} in ${location.name}`,
      description: `Find ${categoryName.toLowerCase()} in ${location.name} on ROVEXO. Buy and sell with purchase protection and secure checkout.`,
      path: `/browse/${[...segments.slice(0, index), location.slug].join("/")}`,
      categorySlugs,
      locationSlug: location.slug,
      locationName: location.name,
      canonicalCategoryPath: buildCategoryPath(categorySlugs),
    };
  }

  if (CONDITION_SLUGS.has(next)) {
    const categoryName = categoryPath[categoryPath.length - 1]!.name;
    return {
      type: "category-condition",
      title: `${slugToTitle(next)} ${categoryName}`,
      description: `Shop ${slugToTitle(next).toLowerCase()} ${categoryName.toLowerCase()} on ROVEXO with verified sellers.`,
      path: `/browse/${segments.join("/")}`,
      categorySlugs,
      condition: next,
      canonicalCategoryPath: buildCategoryPath(categorySlugs),
    };
  }

  const priceRange = PRICE_RANGE_SLUGS[next];
  if (priceRange) {
    const categoryName = categoryPath[categoryPath.length - 1]!.name;
    return {
      type: "category-price",
      title: `${categoryName} ${priceRange.label}`,
      description: `Browse ${categoryName.toLowerCase()} ${priceRange.label.toLowerCase()} on ROVEXO.`,
      path: `/browse/${segments.join("/")}`,
      categorySlugs,
      priceRange,
      canonicalCategoryPath: buildCategoryPath(categorySlugs),
    };
  }

  const brand = slugToTitle(next);
  const categoryName = categoryPath[categoryPath.length - 1]!.name;
  return {
    type: "category-brand",
    title: `${brand} ${categoryName}`,
    description: `Buy and sell ${brand} ${categoryName.toLowerCase()} on ROVEXO. Trusted UK marketplace with purchase protection.`,
    path: `/browse/${segments.join("/")}`,
    categorySlugs,
    brand,
    canonicalCategoryPath: buildCategoryPath(categorySlugs),
  };
}

function buildCategoryPage(categorySlugs: string[], path: string): ProgrammaticPage {
  const nodePath = findNodeBySlugPath(categoryTree, categorySlugs)!;
  const name = nodePath[nodePath.length - 1]!.name;
  return {
    type: "category",
    title: name,
    description: `Shop ${name.toLowerCase()} on ROVEXO. Browse listings from verified UK sellers with purchase protection.`,
    path,
    categorySlugs,
    canonicalCategoryPath: buildCategoryPath(categorySlugs),
  };
}

export function buildProgrammaticSearchQuery(page: ProgrammaticPage): {
  categorySlugPath?: string[];
  brand?: string;
  conditions?: string[];
  minPrice?: number;
  maxPrice?: number;
} {
  return {
    categorySlugPath: page.categorySlugs,
    brand: page.brand,
    conditions: page.condition ? [slugToTitle(page.condition)] : undefined,
    minPrice: page.priceRange?.min,
    maxPrice: page.priceRange?.max,
  };
}

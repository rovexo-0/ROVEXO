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
  | "category-brand-location"
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

  let brand: string | undefined;
  let locationSlug: string | undefined;
  let locationName: string | undefined;
  let condition: string | undefined;
  let priceRange: ProgrammaticPage["priceRange"];
  let cursor = 0;

  while (cursor < remaining.length) {
    const segment = remaining[cursor]!.toLowerCase();

    if (!locationSlug) {
      const location = findLocationBySlug(segment);
      if (location) {
        locationSlug = location.slug;
        locationName = location.name;
        cursor += 1;
        continue;
      }
    }

    if (!condition && CONDITION_SLUGS.has(segment)) {
      condition = segment;
      cursor += 1;
      continue;
    }

    if (!priceRange) {
      const range = PRICE_RANGE_SLUGS[segment];
      if (range) {
        priceRange = range;
        cursor += 1;
        continue;
      }
    }

    if (!brand) {
      brand = slugToTitle(segment);
      cursor += 1;
      continue;
    }

    break;
  }

  const categoryName = categoryPath[categoryPath.length - 1]!.name;
  const titleParts = [
    condition ? slugToTitle(condition) : null,
    brand ?? null,
    categoryName,
    locationName ? `in ${locationName}` : null,
    priceRange?.label ?? null,
  ].filter(Boolean);

  const type: ProgrammaticPageType =
    brand && locationName
      ? "category-brand-location"
      : locationName
        ? "category-location"
        : brand
          ? "category-brand"
          : condition
            ? "category-condition"
            : priceRange
              ? "category-price"
              : "category";

  return {
    type,
    title: titleParts.join(" "),
    description: `Shop ${titleParts.join(" ").toLowerCase()} on ROVEXO. Verified UK sellers with purchase protection.`,
    path: `/browse/${segments.join("/")}`,
    categorySlugs,
    locationSlug,
    locationName,
    brand,
    condition,
    priceRange,
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
  locationCity?: string;
} {
  return {
    categorySlugPath: page.categorySlugs,
    brand: page.brand,
    conditions: page.condition ? [slugToTitle(page.condition)] : undefined,
    minPrice: page.priceRange?.min,
    maxPrice: page.priceRange?.max,
    locationCity: page.locationName,
  };
}

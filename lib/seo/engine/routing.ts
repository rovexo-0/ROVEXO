import { ALL_UK_LOCATIONS, findLocationBySlug } from "@/lib/seo/locations/uk";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { findNodeBySlugPath } from "@/lib/categories/navigation";
import { categoryTree } from "@/lib/categories/tree";
import { isDiscoverySlug } from "@/lib/seo/engine/discovery";
import type { LocationCategoryPage } from "@/lib/seo/engine/types";

const PUBLIC_ROUTE_PREFIXES = [
  "/listing/",
  "/category/",
  "/browse/",
  "/brand/",
  "/discover/",
  "/l/",
  "/store/",
  "/user/",
  "/search",
  "/categories",
  "/help/",
];

export function resolveLocationCategoryPage(
  locationSlug: string,
  categorySegments: string[],
): LocationCategoryPage | null {
  const location = findLocationBySlug(locationSlug);
  if (!location || !categorySegments.length) return null;

  const aliasKey = categorySegments[0]!.toLowerCase();
  const categorySlugs = CATEGORY_ALIASES[aliasKey] ?? categorySegments;
  const categoryPath = findNodeBySlugPath(categoryTree, categorySlugs);
  if (!categoryPath) return null;

  const categoryName = categoryPath[categoryPath.length - 1]!.name;
  const path = `/l/${locationSlug}/${categorySegments.join("/")}`;

  return {
    kind: "location-category",
    locationSlug: location.slug,
    locationName: location.name,
    categorySlugs,
    categoryName,
    path,
    title: `${categoryName} in ${location.name}`,
    description: `Find ${categoryName.toLowerCase()} in ${location.name} on ROVEXO. Buy and sell with purchase protection.`,
  };
}

/** Root-level location-first URL: /london/electronics → /l/london/electronics */
export function resolveLocationFirstRewrite(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [locationSlug, ...categorySegments] = segments;
  const location = findLocationBySlug(locationSlug!);
  if (!location) return null;

  const page = resolveLocationCategoryPage(location.slug, categorySegments);
  if (!page) return null;

  return page.path;
}

export function isPublicMarketplacePath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function shouldRewriteToDiscover(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return null;

  const slug = segments[0]!;
  if (!isDiscoverySlug(slug)) return null;
  return `/discover/${slug}`;
}

export function getLocationCategoryStaticParams(limit = 200): { location: string; category: string[] }[] {
  const cities = ALL_UK_LOCATIONS.filter((location) => location.type === "city").slice(0, 40);
  const aliases = Object.keys(CATEGORY_ALIASES).slice(0, 10);
  const params: { location: string; category: string[] }[] = [];

  for (const city of cities) {
    for (const alias of aliases) {
      params.push({ location: city.slug, category: [alias] });
      if (params.length >= limit) return params;
    }
  }

  return params;
}

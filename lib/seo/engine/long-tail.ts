import type { EligibleListingsOptions } from "@/lib/listings/types";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { ALL_UK_LOCATIONS } from "@/lib/seo/locations/uk";
import { MARKETPLACE_BRANDS } from "@/lib/categories/enterprise/brands";
import type { DiscoveryPage, ProgrammaticFacet } from "@/lib/seo/engine/types";

const MODEL_PATTERNS: Record<string, { label: string; search: EligibleListingsOptions }> = {
  "iphone-15": { label: "iPhone 15", search: { query: "iPhone 15", brand: "Apple" } },
  "iphone-14": { label: "iPhone 14", search: { query: "iPhone 14", brand: "Apple" } },
  "iphone-13": { label: "iPhone 13", search: { query: "iPhone 13", brand: "Apple" } },
  "macbook-air": { label: "MacBook Air", search: { query: "MacBook Air", brand: "Apple" } },
  "macbook-pro": { label: "MacBook Pro", search: { query: "MacBook Pro", brand: "Apple" } },
  "ps5": { label: "PS5", search: { query: "PS5", categorySlugPath: ["gaming", "consoles"] } },
  "airpods": { label: "AirPods", search: { query: "AirPods", brand: "Apple" } },
};

function slugToTitle(slug: string): string {
  return slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function brandSlug(brand: string): string {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Resolve long-tail landing page slugs — only meaningful combinations. */
export function resolveLongTailPage(slug: string): DiscoveryPage | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  // brand-model: apple-iphone-15, samsung-galaxy-s24
  for (const [modelSlug, pattern] of Object.entries(MODEL_PATTERNS)) {
    if (normalized === modelSlug || normalized.endsWith(`-${modelSlug}`)) {
      return buildLongTailPage(normalized, pattern.label, pattern.search, ["brand", "category"]);
    }
  }

  // category-brand: phones-apple, laptops-dell
  for (const [alias, categorySlugs] of Object.entries(CATEGORY_ALIASES)) {
    for (const brand of MARKETPLACE_BRANDS.slice(0, 40)) {
      const combo = `${alias}-${brandSlug(brand)}`;
      if (normalized === combo) {
        return buildLongTailPage(
          normalized,
          `${brand} ${slugToTitle(alias)}`,
          { categorySlugPath: categorySlugs, brand },
          ["category", "brand"],
        );
      }
    }
  }

  // category-location-brand: phones-london-apple
  const parts = normalized.split("-");
  if (parts.length >= 3) {
    const location = ALL_UK_LOCATIONS.find((loc) => loc.slug === parts[parts.length - 2]);
    const brandPart = parts[parts.length - 1]!;
    const brand = MARKETPLACE_BRANDS.find((b) => brandSlug(b) === brandPart);
    const categoryKey = parts.slice(0, -2).join("-");
    const categorySlugs = CATEGORY_ALIASES[categoryKey];
    if (location && brand && categorySlugs) {
      return buildLongTailPage(
        normalized,
        `${brand} ${slugToTitle(categoryKey)} ${location.name}`,
        { categorySlugPath: categorySlugs, brand, locationCity: location.name },
        ["category", "brand", "location"],
      );
    }
  }

  return null;
}

function buildLongTailPage(
  slug: string,
  title: string,
  search: EligibleListingsOptions,
  facetTypes: ProgrammaticFacet[],
): DiscoveryPage {
  const path = `/discover/${slug}`;
  return {
    kind: "discovery",
    slug,
    path,
    title: `${title} | ROVEXO`,
    description: `Shop ${title.toLowerCase()} on ROVEXO. Verified UK sellers with purchase protection.`,
    search,
    facetTypes,
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: title, href: path },
    ],
    canonicalPath: search.categorySlugPath ? `/category/${search.categorySlugPath.join("/")}` : undefined,
  };
}

export function getLongTailSlugCandidates(limit = 200): string[] {
  const slugs: string[] = [];
  for (const modelSlug of Object.keys(MODEL_PATTERNS)) {
    slugs.push(modelSlug);
  }
  for (const alias of Object.keys(CATEGORY_ALIASES).slice(0, 8)) {
    for (const brand of MARKETPLACE_BRANDS.slice(0, 10)) {
      slugs.push(`${alias}-${brandSlug(brand)}`);
      if (slugs.length >= limit) return slugs;
    }
  }
  return slugs;
}

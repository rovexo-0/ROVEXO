import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { MARKETPLACE_BRANDS } from "@/lib/categories/enterprise/brands";
import { ALL_UK_LOCATIONS } from "@/lib/seo/locations/uk";
import { getStaticDiscoverySlugs, resolveDiscoveryPage } from "@/lib/seo/engine/discovery";
import { getAllCollectionSlugs, resolveCollectionPage } from "@/lib/seo/engine/collections";
import { ZERO_RESULT_THRESHOLDS } from "@/lib/organic-growth/config";

export type ZeroResultRecoveryLink = {
  label: string;
  href: string;
  reason: string;
};

export type ZeroResultRecovery = {
  query: string;
  resultCount: number;
  recoveryLinks: ZeroResultRecoveryLink[];
  suggestedCategories: ZeroResultRecoveryLink[];
  suggestedBrands: ZeroResultRecoveryLink[];
  suggestedLocations: ZeroResultRecoveryLink[];
  suggestedCollections: ZeroResultRecoveryLink[];
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function matchCategory(query: string): string | null {
  const normalized = query.toLowerCase();
  for (const [alias, slugs] of Object.entries(CATEGORY_ALIASES)) {
    if (normalized.includes(alias.replace(/-/g, " ")) || normalized.includes(alias)) {
      return `/category/${slugs.join("/")}`;
    }
  }
  return null;
}

function matchBrand(query: string): string | null {
  const normalized = query.toLowerCase();
  const brand = MARKETPLACE_BRANDS.find((entry) => normalized.includes(entry.toLowerCase()));
  return brand ? `/brand/${slugify(brand)}` : null;
}

function matchLocation(query: string): string | null {
  const normalized = query.toLowerCase();
  const location = ALL_UK_LOCATIONS.find((entry) => normalized.includes(entry.name.toLowerCase()));
  return location ? `/l/${location.slug}` : null;
}

function matchDiscovery(query: string): ZeroResultRecoveryLink | null {
  const normalized = slugify(query);
  for (const slug of getStaticDiscoverySlugs()) {
    if (slug.includes(normalized) || normalized.includes(slug)) {
      const page = resolveDiscoveryPage(slug);
      if (page) {
        return { label: page.title.replace(/ \| ROVEXO$/, ""), href: page.path, reason: "discovery_match" };
      }
    }
  }
  return null;
}

/** Zero Result Engine — never show dead ends; always recommend alternatives. */
export function buildZeroResultRecovery(query: string, resultCount = 0): ZeroResultRecovery {
  const recoveryLinks: ZeroResultRecoveryLink[] = [];
  const suggestedCategories: ZeroResultRecoveryLink[] = [];
  const suggestedBrands: ZeroResultRecoveryLink[] = [];
  const suggestedLocations: ZeroResultRecoveryLink[] = [];
  const suggestedCollections: ZeroResultRecoveryLink[] = [];

  const categoryPath = matchCategory(query);
  if (categoryPath) {
    suggestedCategories.push({ label: "Related category", href: categoryPath, reason: "category_match" });
    recoveryLinks.push({ label: "Browse related category", href: categoryPath, reason: "category_match" });
  }

  const brandPath = matchBrand(query);
  if (brandPath) {
    suggestedBrands.push({ label: "Brand hub", href: brandPath, reason: "brand_match" });
    recoveryLinks.push({ label: "Browse brand", href: brandPath, reason: "brand_match" });
  }

  const locationPath = matchLocation(query);
  if (locationPath) {
    suggestedLocations.push({ label: "Local listings", href: locationPath, reason: "location_match" });
    recoveryLinks.push({ label: "Browse nearby", href: locationPath, reason: "location_match" });
  }

  const discovery = matchDiscovery(query);
  if (discovery) recoveryLinks.push(discovery);

  for (const slug of getAllCollectionSlugs().slice(0, 6)) {
    const page = resolveCollectionPage(slug);
    if (page) {
      suggestedCollections.push({
        label: page.title.replace(/ \| ROVEXO$/, ""),
        href: page.path,
        reason: "popular_collection",
      });
    }
  }

  if (resultCount <= ZERO_RESULT_THRESHOLDS.noResults) {
    recoveryLinks.push(
      { label: "Trending today", href: "/collections/trending-today", reason: "fallback_trending" },
      { label: "Best deals", href: "/collections/best-deals", reason: "fallback_deals" },
      { label: "Browse categories", href: "/categories", reason: "fallback_categories" },
    );
  } else if (resultCount < ZERO_RESULT_THRESHOLDS.lowInventory) {
    recoveryLinks.push(
      { label: "Similar categories", href: "/categories", reason: "low_inventory_expand" },
      { label: "Recently listed", href: "/collections/newly-listed", reason: "low_inventory_fresh" },
    );
  }

  const uniqueLinks = [...new Map(recoveryLinks.map((link) => [link.href, link])).values()].slice(0, 8);

  return {
    query,
    resultCount,
    recoveryLinks: uniqueLinks,
    suggestedCategories: suggestedCategories.slice(0, 4),
    suggestedBrands: suggestedBrands.slice(0, 4),
    suggestedLocations: suggestedLocations.slice(0, 4),
    suggestedCollections: suggestedCollections.slice(0, 4),
  };
}

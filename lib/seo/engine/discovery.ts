import type { EligibleListingsOptions } from "@/lib/listings/types";
import { MARKETPLACE_BRANDS } from "@/lib/categories/enterprise/brands";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { ALL_UK_LOCATIONS } from "@/lib/seo/locations/uk";
import type { DiscoveryPage, ProgrammaticFacet } from "@/lib/seo/engine/types";
import { isDiscoveryPage } from "@/lib/seo/engine/types";
import { resolveLongTailPage } from "@/lib/seo/engine/long-tail";

type ProductPattern = {
  label: string;
  search: EligibleListingsOptions;
};

const CONDITION_MAP: Record<string, string> = {
  used: "Used",
  new: "New",
  refurbished: "Refurbished",
  "like-new": "Like New",
};

/** Inventory-driven product keyword patterns — auto-generated landing pages. */
const PRODUCT_PATTERNS: Record<string, ProductPattern> = {
  iphone: {
    label: "iPhone",
    search: { query: "iPhone", brand: "Apple", categorySlugPath: ["phones", "smartphones"] },
  },
  ipad: {
    label: "iPad",
    search: { query: "iPad", brand: "Apple", categorySlugPath: ["phones", "tablets"] },
  },
  macbook: {
    label: "MacBook",
    search: { query: "MacBook", brand: "Apple", categorySlugPath: ["computers", "laptops"] },
  },
  laptop: {
    label: "Laptop",
    search: { query: "laptop", categorySlugPath: ["computers", "laptops"] },
  },
  "gaming-laptop": {
    label: "Gaming Laptop",
    search: { query: "gaming laptop", categorySlugPath: ["computers", "laptops"] },
  },
  ps5: {
    label: "PS5",
    search: { query: "PS5", categorySlugPath: ["gaming", "consoles"] },
  },
  xbox: {
    label: "Xbox",
    search: { query: "Xbox", categorySlugPath: ["gaming", "consoles"] },
  },
  sofa: {
    label: "Sofa",
    search: { query: "sofa", categorySlugPath: ["home-garden", "furniture"] },
  },
  bicycle: {
    label: "Bicycle",
    search: { query: "bicycle", categorySlugPath: ["cycling", "bikes"] },
  },
  car: {
    label: "Car",
    search: { query: "car", categorySlugPath: ["vehicles", "cars"] },
  },
  motorcycle: {
    label: "Motorcycle",
    search: { query: "motorcycle", categorySlugPath: ["vehicles", "motorcycles-scooters"] },
  },
  "garden-tools": {
    label: "Garden Tools",
    search: { query: "garden tools", categorySlugPath: ["home-garden", "garden-patio"] },
  },
  "baby-clothes": {
    label: "Baby Clothes",
    search: { query: "baby clothes", categorySlugPath: ["baby", "baby-clothing"] },
  },
  shoes: {
    label: "Shoes",
    search: { query: "shoes", categorySlugPath: ["shoes"] },
  },
  furniture: {
    label: "Furniture",
    search: { categorySlugPath: ["home-garden", "furniture"] },
  },
  electronics: {
    label: "Electronics",
    search: { categorySlugPath: ["electronics"] },
  },
};

const LOCATION_SLUGS = [...ALL_UK_LOCATIONS]
  .map((location) => location.slug)
  .sort((a, b) => b.length - a.length);

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseLocationSuffix(slug: string): { productSlug: string; locationSlug?: string; locationName?: string } {
  for (const locationSlug of LOCATION_SLUGS) {
    const suffix = `-${locationSlug}`;
    if (slug.endsWith(suffix) && slug.length > suffix.length) {
      const location = ALL_UK_LOCATIONS.find((entry) => entry.slug === locationSlug);
      return {
        productSlug: slug.slice(0, -suffix.length),
        locationSlug,
        locationName: location?.name,
      };
    }
  }
  return { productSlug: slug };
}

function matchBrandPrefix(slug: string): { brand: string; remainder: string } | null {
  const sorted = [...MARKETPLACE_BRANDS].sort((a, b) => b.length - a.length);
  for (const brand of sorted) {
    const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (slug === brandSlug) return { brand, remainder: "" };
    if (slug.startsWith(`${brandSlug}-`)) {
      return { brand, remainder: slug.slice(brandSlug.length + 1) };
    }
  }
  return null;
}

function buildDiscoveryPage(
  slug: string,
  title: string,
  description: string,
  search: EligibleListingsOptions,
  facetTypes: ProgrammaticFacet[] = ["category"],
): DiscoveryPage {
  return {
    kind: "discovery",
    slug,
    path: `/discover/${slug}`,
    title,
    description,
    search,
    facetTypes,
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: title.replace(/ \| ROVEXO$/, ""), href: `/discover/${slug}` },
    ],
  };
}

/** Resolve a discovery landing page slug into search criteria + metadata. */
export function resolveDiscoveryPage(slug: string): DiscoveryPage | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  // buy-electronics / sell-furniture
  const intentMatch = normalized.match(/^(buy|sell)-(.+)$/);
  if (intentMatch) {
    const [, intent, categoryKey] = intentMatch;
    const categorySlugs = CATEGORY_ALIASES[categoryKey!] ?? [categoryKey!];
    const categoryLabel = slugToTitle(categoryKey!);
    const verb = intent === "buy" ? "Buy" : "Sell";
    return buildDiscoveryPage(
      normalized,
      `${verb} ${categoryLabel} UK | ROVEXO`,
      `${verb} ${categoryLabel.toLowerCase()} on ROVEXO. Verified UK sellers, purchase protection, and secure checkout.`,
      { categorySlugPath: categorySlugs, query: intent === "buy" ? categoryLabel : undefined },
      ["category"],
    );
  }

  // used-iphone / cheap-laptop / new-iphone / refurbished-laptop
  const modifierMatch = normalized.match(/^(used|new|refurbished|cheap|like-new)-(.+)$/);
  if (modifierMatch) {
    const [, modifier, productKey] = modifierMatch;
    const { productSlug, locationSlug, locationName } = parseLocationSuffix(productKey!);
    const pattern = PRODUCT_PATTERNS[productSlug];
    if (!pattern) return null;

    const modifierLabel = modifier === "cheap" ? "Cheap" : slugToTitle(modifier!);
    const locationSuffix = locationName ? ` ${locationName}` : " UK";
    const title = `${modifierLabel} ${pattern.label}${locationSuffix}`;
    const search: EligibleListingsOptions = {
      ...pattern.search,
      locationCity: locationName,
    };

    if (modifier === "cheap") {
      search.sort = "price_asc";
    } else if (modifier && CONDITION_MAP[modifier]) {
      search.conditions = [CONDITION_MAP[modifier]!];
    }

    return buildDiscoveryPage(
      normalized,
      `${title} | ROVEXO`,
      `Shop ${title.toLowerCase()} on ROVEXO. Browse listings from verified UK sellers with purchase protection.`,
      search,
      [modifier === "cheap" ? "price" : "condition", locationName ? "location" : "category"],
    );
  }

  // nike-shoes-manchester / bmw-parts-birmingham
  const brandMatch = matchBrandPrefix(normalized);
  if (brandMatch) {
    const remainderParsed = brandMatch.remainder ? parseLocationSuffix(brandMatch.remainder) : null;
    const productKey = remainderParsed?.productSlug ?? "";
    const locName = remainderParsed?.locationName;
    const categorySlugs = productKey ? CATEGORY_ALIASES[productKey] : undefined;
    const label = productKey ? `${brandMatch.brand} ${slugToTitle(productKey)}` : brandMatch.brand;
    const title = locName ? `${label} ${locName}` : `${label} UK`;

    return buildDiscoveryPage(
      normalized,
      `${title} | ROVEXO`,
      `Shop ${label.toLowerCase()}${locName ? ` in ${locName}` : ""} on ROVEXO.`,
      {
        brand: brandMatch.brand,
        categorySlugPath: categorySlugs,
        query: productKey ? `${brandMatch.brand} ${slugToTitle(productKey)}` : brandMatch.brand,
        locationCity: locName,
      },
      locName ? ["brand", "location", "category"] : ["brand"],
    );
  }

  // gaming-laptop-manchester / furniture-birmingham
  const withLocation = parseLocationSuffix(normalized);
  if (withLocation.locationSlug && withLocation.locationName) {
    const pattern = PRODUCT_PATTERNS[withLocation.productSlug];
    if (pattern) {
      const title = `${pattern.label} ${withLocation.locationName}`;
      return buildDiscoveryPage(
        normalized,
        `${title} | ROVEXO`,
        `Find ${pattern.label.toLowerCase()} in ${withLocation.locationName} on ROVEXO.`,
        { ...pattern.search, locationCity: withLocation.locationName },
      );
    }

    const categorySlugs = CATEGORY_ALIASES[withLocation.productSlug];
    if (categorySlugs) {
      const categoryLabel = slugToTitle(withLocation.productSlug);
      const title = `${categoryLabel} ${withLocation.locationName}`;
      return buildDiscoveryPage(
        normalized,
        `${title} | ROVEXO`,
        `Browse ${categoryLabel.toLowerCase()} in ${withLocation.locationName} on ROVEXO.`,
        { categorySlugPath: categorySlugs, locationCity: withLocation.locationName },
      );
    }
  }

  // Direct product keyword: cheap-iphone handled above; bare product slugs
  const directPattern = PRODUCT_PATTERNS[normalized];
  if (directPattern) {
    return buildDiscoveryPage(
      normalized,
      `${directPattern.label} for Sale UK | ROVEXO`,
      `Shop ${directPattern.label.toLowerCase()} on ROVEXO. Verified UK sellers and purchase protection.`,
      directPattern.search,
    );
  }

  const longTail = resolveLongTailPage(normalized);
  return longTail && isDiscoveryPage(longTail) ? longTail : null;
}

/** All statically known discovery slugs for sitemap generation. */
export function getStaticDiscoverySlugs(): string[] {
  const slugs = new Set<string>();

  for (const alias of Object.keys(CATEGORY_ALIASES)) {
    slugs.add(`buy-${alias}`);
    slugs.add(`sell-${alias}`);
  }

  for (const productKey of Object.keys(PRODUCT_PATTERNS)) {
    slugs.add(`used-${productKey}`);
    slugs.add(`new-${productKey}`);
    slugs.add(`cheap-${productKey}`);
    slugs.add(`refurbished-${productKey}`);
    slugs.add(productKey);
  }

  const cities = ALL_UK_LOCATIONS.filter((location) => location.type === "city").slice(0, 20);
  for (const city of cities) {
    for (const productKey of ["iphone", "laptop", "gaming-laptop", "furniture", "car", "shoes"]) {
      slugs.add(`${productKey}-${city.slug}`);
    }
  }

  return [...slugs];
}

/** True when a root-level slug should rewrite to /discover/{slug}. */
export function isDiscoverySlug(slug: string): boolean {
  return resolveDiscoveryPage(slug) !== null;
}

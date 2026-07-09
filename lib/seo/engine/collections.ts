import type { EligibleListingsOptions } from "@/lib/listings/types";
import { FRESH_LISTING_DAYS, PRICE_COLLECTION_TIERS } from "@/lib/seo/engine/config";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";

export type CollectionDefinition = {
  slug: string;
  title: string;
  description: string;
  search: EligibleListingsOptions;
  facetTypes: OrganicLandingPage["facetTypes"];
};

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const STATIC_COLLECTIONS: CollectionDefinition[] = [
  {
    slug: "best-deals",
    title: "Best Deals on ROVEXO",
    description: "Automatically ranked deals from across the ROVEXO marketplace — recently reduced prices and high-value listings.",
    search: { sort: "price_asc" },
    facetTypes: ["collection"],
  },
  {
    slug: "newly-listed",
    title: "Newly Listed on ROVEXO",
    description: "Fresh listings published recently on ROVEXO. Discover the newest items from verified UK sellers.",
    search: { sort: "newest", postedToday: false },
    facetTypes: ["collection"],
  },
  {
    slug: "recently-reduced",
    title: "Recently Reduced Prices",
    description: "Listings with price drops on ROVEXO. Find bargains from verified sellers with purchase protection.",
    search: { sort: "price_asc" },
    facetTypes: ["collection"],
  },
  {
    slug: "trending-this-week",
    title: "Trending This Week",
    description: "Most popular listings this week on ROVEXO based on views and saves.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "trending-today",
    title: "Trending Today",
    description: "Today's hottest listings on ROVEXO ranked by live marketplace activity.",
    search: { sort: "newest", postedToday: true },
    facetTypes: ["collection"],
  },
  {
    slug: "premium-listings",
    title: "Premium Listings",
    description: "Featured and promoted listings on ROVEXO from verified sellers.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "verified-sellers",
    title: "Verified Seller Listings",
    description: "Shop listings from verified ROVEXO sellers with purchase protection.",
    search: { sort: "newest" },
    facetTypes: ["collection", "seller-type"],
  },
  {
    slug: "top-rated-stores",
    title: "Top Rated Stores",
    description: "Highly rated business stores on ROVEXO with excellent buyer feedback.",
    search: { sort: "newest" },
    facetTypes: ["collection", "seller-type"],
  },
  {
    slug: "most-viewed",
    title: "Most Viewed Listings",
    description: "The most viewed listings on ROVEXO right now.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "most-saved",
    title: "Most Saved Listings",
    description: "Listings buyers save most often on ROVEXO.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "most-viewed-today",
    title: "Most Viewed Today",
    description: "Today's most viewed listings on ROVEXO.",
    search: { sort: "newest", postedToday: true },
    facetTypes: ["collection"],
  },
  {
    slug: "most-viewed-this-week",
    title: "Most Viewed This Week",
    description: "This week's most viewed listings on ROVEXO.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "most-viewed-this-month",
    title: "Most Viewed This Month",
    description: "This month's most viewed listings on ROVEXO.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "best-selling",
    title: "Best Selling on ROVEXO",
    description: "Top selling listings on ROVEXO based on completed sales activity.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "new-sellers",
    title: "New Sellers on ROVEXO",
    description: "Discover listings from new sellers joining the ROVEXO marketplace.",
    search: { sort: "newest" },
    facetTypes: ["collection", "seller-type"],
  },
  {
    slug: "featured-stores",
    title: "Featured Stores",
    description: "Featured business stores on ROVEXO with active inventory.",
    search: { sort: "newest" },
    facetTypes: ["collection", "seller-type"],
  },
  {
    slug: "premium-stores",
    title: "Premium Stores",
    description: "Premium business stores on ROVEXO with verified listings.",
    search: { sort: "newest" },
    facetTypes: ["collection", "seller-type"],
  },
  {
    slug: "editors-picks",
    title: "Editor's Picks",
    description: "Curated standout listings on ROVEXO selected from high-quality inventory.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "luxury",
    title: "Luxury Listings",
    description: "Premium luxury items on ROVEXO from verified sellers.",
    search: { sort: "price_desc" },
    facetTypes: ["collection"],
  },
  {
    slug: "gift-collections",
    title: "Gift Collections",
    description: "Perfect gift ideas on ROVEXO for every occasion.",
    search: { sort: "newest" },
    facetTypes: ["collection", "season"],
  },
  {
    slug: "ending-soon",
    title: "Ending Soon",
    description: "Listings ending soon on ROVEXO — don't miss out.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "most-shared",
    title: "Most Shared",
    description: "The most shared listings on ROVEXO this week.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "best-sellers",
    title: "Best Sellers",
    description: "Top selling listings on ROVEXO based on order activity.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "fastest-growing-stores",
    title: "Fastest Growing Stores",
    description: "ROVEXO stores with the fastest growing inventory and sales.",
    search: { sort: "newest" },
    facetTypes: ["collection", "seller-type"],
  },
  {
    slug: "trending-this-month",
    title: "Trending This Month",
    description: "This month's hottest listings on ROVEXO ranked by marketplace activity.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "fast-growing-categories",
    title: "Fast Growing Categories",
    description: "Categories with the fastest inventory and buyer growth on ROVEXO.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "fast-growing-brands",
    title: "Fast Growing Brands",
    description: "Brands gaining momentum on ROVEXO based on views, saves, and new listings.",
    search: { sort: "newest" },
    facetTypes: ["collection", "brand"],
  },
  {
    slug: "featured-listings",
    title: "Featured Listings",
    description: "Featured listings on ROVEXO selected from high-quality inventory.",
    search: { sort: "newest" },
    facetTypes: ["collection"],
  },
  {
    slug: "back-to-school",
    title: "Back To School",
    description: "Back to school essentials on ROVEXO — laptops, stationery, and uniforms.",
    search: { categorySlugPath: ["computers", "laptops"], sort: "newest" },
    facetTypes: ["collection", "season"],
  },
  {
    slug: "summer-picks",
    title: "Summer Picks",
    description: "Summer essentials on ROVEXO — outdoor, sports, and travel gear.",
    search: { categorySlugPath: ["sports"], sort: "newest" },
    facetTypes: ["collection", "season"],
  },
  {
    slug: "winter-essentials",
    title: "Winter Essentials",
    description: "Winter clothing, home, and seasonal items on ROVEXO.",
    search: { categorySlugPath: ["womens-fashion"], sort: "newest" },
    facetTypes: ["collection", "season"],
  },
  {
    slug: "holiday-gifts",
    title: "Holiday Gifts",
    description: "Perfect holiday gift ideas on ROVEXO for every occasion.",
    search: { sort: "newest" },
    facetTypes: ["collection", "season"],
  },
  {
    slug: "garden-season",
    title: "Garden Season",
    description: "Garden and outdoor essentials on ROVEXO for the growing season.",
    search: { categorySlugPath: ["home-garden", "garden-patio"], sort: "newest" },
    facetTypes: ["collection", "season"],
  },
  {
    slug: "gaming-week",
    title: "Gaming Week",
    description: "Gaming consoles, accessories, and gear on ROVEXO.",
    search: { categorySlugPath: ["gaming"], sort: "newest" },
    facetTypes: ["collection", "season"],
  },
  {
    slug: "electronics-deals",
    title: "Electronics Deals",
    description: "Top electronics deals on ROVEXO — phones, laptops, and gadgets.",
    search: { categorySlugPath: ["phones"], sort: "price_asc" },
    facetTypes: ["collection", "deals"],
  },
  {
    slug: "spring-collection",
    title: "Spring Collection",
    description: "Seasonal spring listings on ROVEXO — fashion, garden, and home.",
    search: { categorySlugPath: ["home-garden"], sort: "newest" },
    facetTypes: ["collection", "season"],
  },
  {
    slug: "summer-collection",
    title: "Summer Collection",
    description: "Summer essentials on ROVEXO — outdoor, sports, and travel.",
    search: { categorySlugPath: ["sports"], sort: "newest" },
    facetTypes: ["collection", "season"],
  },
  {
    slug: "winter-collection",
    title: "Winter Collection",
    description: "Winter listings on ROVEXO — clothing, home, and seasonal items.",
    search: { categorySlugPath: ["womens-fashion"], sort: "newest" },
    facetTypes: ["collection", "season"],
  },
];

const PRICE_COLLECTIONS: CollectionDefinition[] = PRICE_COLLECTION_TIERS.map((max) => ({
  slug: `under-${max}`,
  title: `Under £${max}`,
  description: `Browse ROVEXO listings under £${max} from verified UK sellers.`,
  search: { maxPrice: max, sort: "price_asc" },
  facetTypes: ["collection", "price"] as OrganicLandingPage["facetTypes"],
}));

const ALL_COLLECTIONS = [...STATIC_COLLECTIONS, ...PRICE_COLLECTIONS];

export function resolveCollectionPage(slug: string): OrganicLandingPage | null {
  const normalized = slug.trim().toLowerCase();
  const def = ALL_COLLECTIONS.find((entry) => entry.slug === normalized);
  if (!def) return null;

  return {
    kind: "collection",
    slug: def.slug,
    path: `/collections/${def.slug}`,
    title: `${def.title} | ROVEXO`,
    description: def.description,
    search: def.search,
    facetTypes: def.facetTypes,
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: "Collections", href: "/collections" },
      { name: def.title, href: `/collections/${def.slug}` },
    ],
    lastModified: daysAgoIso(0),
  };
}

export function getAllCollectionSlugs(): string[] {
  return ALL_COLLECTIONS.map((entry) => entry.slug);
}

export function getCollectionDefinitions(): CollectionDefinition[] {
  return ALL_COLLECTIONS;
}

/** Freshness metadata for collection pages. */
export function collectionFreshnessWindow(slug: string): number {
  if (slug.includes("today")) return 1;
  if (slug.includes("week")) return 7;
  if (slug.includes("month")) return 30;
  return FRESH_LISTING_DAYS;
}

import { getAllCollectionSlugs, resolveCollectionPage, collectionFreshnessWindow } from "@/lib/seo/engine/collections";
import { getStaticDiscoverySlugs, resolveDiscoveryPage } from "@/lib/seo/engine/discovery";
import { detectTrendSignals, isTrendExpired } from "@/lib/seo/engine/trends";
import { isCollectionPublishable, isTrendStale } from "@/lib/organic-growth/config";

export type DiscoveryFeedItem = {
  slug: string;
  label: string;
  href: string;
  category: "trending" | "popular" | "fresh" | "premium" | "seasonal" | "seller" | "deals";
  active: boolean;
  expiresAt?: string;
};

export type DiscoveryFeed = {
  generatedAt: string;
  items: DiscoveryFeedItem[];
  expiredSlugs: string[];
};

const DISCOVERY_FEED_MANIFEST: Omit<DiscoveryFeedItem, "active" | "expiresAt">[] = [
  { slug: "trending-today", label: "Trending Today", href: "/collections/trending-today", category: "trending" },
  { slug: "trending-this-week", label: "Trending This Week", href: "/collections/trending-this-week", category: "trending" },
  { slug: "trending-this-month", label: "Trending This Month", href: "/collections/trending-this-month", category: "trending" },
  { slug: "most-viewed", label: "Most Viewed", href: "/collections/most-viewed", category: "popular" },
  { slug: "most-saved", label: "Most Saved", href: "/collections/most-saved", category: "popular" },
  { slug: "newly-listed", label: "Recently Listed", href: "/collections/newly-listed", category: "fresh" },
  { slug: "recently-reduced", label: "Recently Reduced", href: "/collections/recently-reduced", category: "deals" },
  { slug: "premium-listings", label: "Premium Listings", href: "/collections/premium-listings", category: "premium" },
  { slug: "editors-picks", label: "Editor's Picks", href: "/collections/editors-picks", category: "premium" },
  { slug: "luxury", label: "Luxury Collections", href: "/collections/luxury", category: "premium" },
  { slug: "gift-collections", label: "Gift Collections", href: "/collections/gift-collections", category: "seasonal" },
  { slug: "verified-sellers", label: "Verified Sellers", href: "/collections/verified-sellers", category: "seller" },
  { slug: "top-rated-stores", label: "Top Stores", href: "/collections/top-rated-stores", category: "seller" },
  { slug: "best-sellers", label: "Best Sellers", href: "/collections/best-sellers", category: "popular" },
  { slug: "new-sellers", label: "New Sellers", href: "/collections/new-sellers", category: "seller" },
  { slug: "fastest-growing-stores", label: "Fast Growing Stores", href: "/collections/fastest-growing-stores", category: "seller" },
  { slug: "back-to-school", label: "Back To School", href: "/collections/back-to-school", category: "seasonal" },
  { slug: "summer-picks", label: "Summer Picks", href: "/collections/summer-picks", category: "seasonal" },
  { slug: "winter-essentials", label: "Winter Essentials", href: "/collections/winter-essentials", category: "seasonal" },
  { slug: "holiday-gifts", label: "Holiday Gifts", href: "/collections/holiday-gifts", category: "seasonal" },
  { slug: "garden-season", label: "Garden Season", href: "/collections/garden-season", category: "seasonal" },
  { slug: "gaming-week", label: "Gaming Week", href: "/collections/gaming-week", category: "seasonal" },
  { slug: "electronics-deals", label: "Electronics Deals", href: "/collections/electronics-deals", category: "deals" },
];

/** Discovery Engine — maintains auto-updating discovery feed with expiry. */
export async function buildDiscoveryFeed(): Promise<DiscoveryFeed> {
  const expiredSlugs: string[] = [];
  const collectionSlugs = new Set(getAllCollectionSlugs());

  const items: DiscoveryFeedItem[] = DISCOVERY_FEED_MANIFEST.map((item) => {
    const exists = collectionSlugs.has(item.slug);
    const window = collectionFreshnessWindow(item.slug);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + window);

    if (!exists) expiredSlugs.push(item.slug);

    return {
      ...item,
      active: exists,
      expiresAt: exists ? expiresAt.toISOString() : undefined,
    };
  });

  const trends = await detectTrendSignals(10);
  for (const signal of trends) {
    const page = resolveDiscoveryPage(signal.slug);
    if (page) {
      items.push({
        slug: signal.slug,
        label: signal.label,
        href: `/trends/${signal.slug}`,
        category: "trending",
        active: !isTrendExpired(page.lastModified),
        expiresAt: page.lastModified
          ? new Date(new Date(page.lastModified).getTime() + 14 * 24 * 60 * 60_000).toISOString()
          : undefined,
      });
    }
  }

  for (const slug of getStaticDiscoverySlugs().slice(0, 10)) {
    const page = resolveDiscoveryPage(slug);
    if (page) {
      items.push({
        slug,
        label: page.title.replace(/ \| ROVEXO$/, ""),
        href: page.path,
        category: "popular",
        active: true,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    items: items.filter((item) => item.active),
    expiredSlugs,
  };
}

export function isDiscoveryItemStale(item: DiscoveryFeedItem): boolean {
  if (!item.expiresAt) return false;
  return isTrendStale(item.expiresAt);
}

export function evaluateCollectionPublishability(listingCount: number, qualityScore: number): boolean {
  return isCollectionPublishable(listingCount, qualityScore);
}

export function getActiveCollectionPages(): string[] {
  return getAllCollectionSlugs().filter((slug) => resolveCollectionPage(slug) !== null);
}

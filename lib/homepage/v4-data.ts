import type { Product, ProductsPage } from "@/lib/products/types";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { filterHomepageProducts } from "@/lib/homepage/homepage-eligibility";
import {
  HOMEPAGE_DEMO_PRODUCTS,
  resolveHomepageFeedItems,
  resolveShowcaseSections,
} from "@/lib/homepage/demo-data";
import { resolveHomepageMode } from "@/lib/homepage/config";
import { rotateShowcaseStores } from "@/lib/homepage/store-rotation";

const DEMO_ENABLED = resolveHomepageMode() === "demo";
const FEATURED_LIMIT = 12;
const SHOWCASE_SELLER_LIMIT = 6;

export type HomepageV4Sections = {
  showcases: ShowcaseSellerSection[];
  featured: Product[];
  feed: ProductsPage;
};

function uniqueProducts(items: Product[]): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function resolveFeatured(page: ProductsPage, exclude: Set<string>): Product[] {
  const filtered = uniqueProducts(filterHomepageProducts(page.items)).filter(
    (product) => !exclude.has(product.id),
  );

  if (filtered.length > 0) {
    return filtered.slice(0, FEATURED_LIMIT);
  }

  if (!DEMO_ENABLED) {
    return [];
  }

  return HOMEPAGE_DEMO_PRODUCTS.filter(
    (product) => product.isFeatured && !exclude.has(product.id),
  ).slice(0, FEATURED_LIMIT);
}

function resolveShowcases(sections: ShowcaseSellerSection[]): ShowcaseSellerSection[] {
  return rotateShowcaseStores(sections)
    .map((section) => {
      const listings = uniqueProducts(section.listings);
      if (listings.length === 0) return null;
      return { ...section, listings };
    })
    .filter((section): section is ShowcaseSellerSection => section !== null)
    .slice(0, SHOWCASE_SELLER_LIMIT);
}

export function resolveHomepageV4Sections(input: {
  featuredPage: ProductsPage;
  feed: ProductsPage;
  showcase: ShowcaseSellerSection[];
}): HomepageV4Sections {
  const allShowcaseSections = resolveShowcaseSections(input.showcase, input.feed.items);
  const showcases = resolveShowcases(allShowcaseSections);
  const showcaseIds = new Set<string>();
  for (const section of showcases) {
    for (const listing of section.listings) showcaseIds.add(listing.id);
  }

  const featured = resolveFeatured(input.featuredPage, showcaseIds);

  // Only listings rendered in a VISIBLE showcase section are reserved from the
  // main feed (to avoid duplicate rendering). The canonical layout renders no
  // standalone "featured" section, so featured listings MUST remain in the feed
  // — otherwise eligible/newly-published listings silently disappear from the
  // homepage even though /api/homepage/feed returns them.
  const reservedIds = new Set(showcaseIds);

  const feedPage = resolveHomepageFeedItems(input.feed);
  const feedItems = uniqueProducts(filterHomepageProducts(feedPage.items)).filter(
    (product) => !reservedIds.has(product.id),
  );

  return {
    showcases,
    featured,
    feed: {
      ...feedPage,
      items: feedItems,
    },
  };
}

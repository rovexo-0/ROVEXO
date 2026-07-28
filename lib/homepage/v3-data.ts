import type { Product, ProductsPage } from "@/lib/products/types";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { filterHomepageProducts } from "@/lib/homepage/homepage-eligibility";
import {
  resolveHomepageFeedItems,
  resolveShowcaseSections,
} from "@/lib/homepage/feed-resolve";

const RAIL_LIMIT = 12;

export type HomepageV3Sections = {
  showcase: ShowcaseSellerSection[];
  featured: Product[];
  recommended: Product[];
  newest: Product[];
  boosted: Product[];
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

function resolveRail(page: ProductsPage): Product[] {
  return uniqueProducts(filterHomepageProducts(page.items)).slice(0, RAIL_LIMIT);
}

export function resolveHomepageV3Sections(input: {
  featuredPage: ProductsPage;
  recommendedPage: ProductsPage;
  newestPage: ProductsPage;
  boostedPage: ProductsPage;
  feed: ProductsPage;
  showcase: ShowcaseSellerSection[];
}): HomepageV3Sections {
  const feed = resolveHomepageFeedItems(input.feed);

  return {
    showcase: resolveShowcaseSections(input.showcase, feed.items),
    featured: resolveRail(input.featuredPage),
    recommended: resolveRail(input.recommendedPage),
    newest: resolveRail(input.newestPage),
    boosted: resolveRail(input.boostedPage),
    feed,
  };
}

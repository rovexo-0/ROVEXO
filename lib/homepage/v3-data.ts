import type { Product, ProductsPage } from "@/lib/products/types";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import { filterHomepageProducts } from "@/lib/homepage/homepage-eligibility";
import {
  HOMEPAGE_DEMO_PRODUCTS,
  resolveHomepageFeedItems,
  resolveShowcaseSections,
} from "@/lib/homepage/demo-data";
import { resolveHomepageMode } from "@/lib/homepage/config";

const DEMO_ENABLED = resolveHomepageMode() === "demo";
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

function resolveRail(page: ProductsPage, picker: (pool: Product[]) => Product[]): Product[] {
  const filtered = uniqueProducts(filterHomepageProducts(page.items));
  if (filtered.length > 0) {
    return filtered.slice(0, RAIL_LIMIT);
  }

  if (!DEMO_ENABLED) {
    return [];
  }

  return picker(HOMEPAGE_DEMO_PRODUCTS).slice(0, RAIL_LIMIT);
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

  const featured = resolveRail(input.featuredPage, (pool) =>
    pool.filter((product) => product.isFeatured),
  );

  const recommended = resolveRail(input.recommendedPage, (pool) =>
    pool.filter((product) => product.sections?.includes("recommended")),
  );

  const newest = resolveRail(input.newestPage, (pool) =>
    pool.filter((product) => product.sections?.includes("new")),
  );

  const boosted = resolveRail(input.boostedPage, (pool) =>
    pool.filter((product) => product.isBumped),
  );

  const showcase = resolveShowcaseSections(input.showcase, feed.items);

  return {
    showcase,
    featured,
    recommended,
    newest,
    boosted,
    feed,
  };
}

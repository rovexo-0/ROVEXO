import "server-only";

import type { ProductsPage } from "@/lib/products/types";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import {
  fetchHomepageFeed,
  fetchShowcaseSellerSections,
} from "@/lib/products/queries";
import { resolveHomepageV4Sections } from "@/lib/homepage/v4-data";
import {
  getPlatformVisualConfig,
  getDefaultPlatformVisualConfig,
} from "@/lib/platform-visual/reader";
import { listActivePreferredMarketplaceStores } from "@/lib/preferred-marketplace-stores/store";
import type { PlatformVisualConfig } from "@/lib/platform-visual/types";
import { toPublicProductDocument } from "@/lib/products/public-product-contract-v1";

/** Empty featured rail input — canonical Homepage does not render a featured section. */
export const HOMEPAGE_EMPTY_FEATURED_PAGE: ProductsPage = {
  items: [],
  page: 1,
  hasMore: false,
};

export type HomepageDocumentData = {
  visualConfig: PlatformVisualConfig;
  sections: ReturnType<typeof resolveHomepageV4Sections>;
};

/**
 * PUBLIC Homepage document data only.
 * Catalogue + live/draft visual + preferred store slots — no identity, inbox, wallet, or orders.
 */
export async function loadHomepageDocumentData(options: {
  previewMode: "live" | "draft";
}): Promise<HomepageDocumentData> {
  const [visualConfig, feedResult, showcaseFromDb, preferredStores] = await Promise.all([
    getPlatformVisualConfig({ mode: options.previewMode }).catch(() =>
      getDefaultPlatformVisualConfig(),
    ),
    fetchHomepageFeed(1).catch(() => HOMEPAGE_EMPTY_FEATURED_PAGE),
    fetchShowcaseSellerSections().catch(() => [] as ShowcaseSellerSection[]),
    listActivePreferredMarketplaceStores().catch(() => []),
  ]);

  const sections = resolveHomepageV4Sections({
    featuredPage: HOMEPAGE_EMPTY_FEATURED_PAGE,
    feed: feedResult,
    showcase: showcaseFromDb,
    preferredStores,
  });

  // Final PUBLIC-document safety: username-only identity · never serialize seller emails.
  const publicSections = {
    ...sections,
    featured: sections.featured.map(toPublicProductDocument),
    feed: {
      ...sections.feed,
      items: sections.feed.items.map(toPublicProductDocument),
    },
    showcases: sections.showcases.map((section) => ({
      ...section,
      listings: section.listings.map(toPublicProductDocument),
    })),
  };

  return { visualConfig, sections: publicSections };
}

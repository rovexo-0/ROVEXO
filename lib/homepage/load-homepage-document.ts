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
async function timedHomepageBranch<T>(
  label: string,
  work: () => Promise<T>,
): Promise<{ value: T; ms: number }> {
  const started = performance.now();
  const value = await work();
  const ms = Math.round(performance.now() - started);
  return { value, ms };
}

export async function loadHomepageDocumentData(options: {
  previewMode: "live" | "draft";
}): Promise<HomepageDocumentData> {
  const wallStarted = performance.now();

  const [visualTimed, feedTimed, showcaseTimed, preferredTimed] = await Promise.all([
    timedHomepageBranch("visual", () =>
      getPlatformVisualConfig({ mode: options.previewMode }).catch(() =>
        getDefaultPlatformVisualConfig(),
      ),
    ),
    timedHomepageBranch("feed", () =>
      fetchHomepageFeed(1).catch(() => HOMEPAGE_EMPTY_FEATURED_PAGE),
    ),
    timedHomepageBranch("showcase", () =>
      fetchShowcaseSellerSections().catch(() => [] as ShowcaseSellerSection[]),
    ),
    timedHomepageBranch("preferredStores", () =>
      listActivePreferredMarketplaceStores().catch(() => []),
    ),
  ]);

  const visualConfig = visualTimed.value;
  const feedResult = feedTimed.value;
  const showcaseFromDb = showcaseTimed.value;
  const preferredStores = preferredTimed.value;

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

  const totalMs = Math.round(performance.now() - wallStarted);
  if (process.env.NODE_ENV !== "production") {
    const payload = {
      totalMs,
      visualMs: visualTimed.ms,
      feedMs: feedTimed.ms,
      showcaseMs: showcaseTimed.ms,
      preferredStoresMs: preferredTimed.ms,
      feedItems: feedResult.items.length,
      showcaseSections: showcaseFromDb.length,
      preferredStores: preferredStores.length,
    };
    console.info("[HP_PERF]", JSON.stringify(payload));
    try {
      const { appendFileSync } = await import("node:fs");
      appendFileSync("/tmp/hp-perf.jsonl", `${JSON.stringify(payload)}\n`);
    } catch {
      /* ignore local timing sink failures */
    }
  }

  return { visualConfig, sections: publicSections };
}

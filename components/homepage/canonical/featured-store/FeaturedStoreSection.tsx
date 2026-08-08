"use client";

import { memo, useMemo } from "react";
import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";
import {
  isShowcaseListingNavigable,
} from "@/lib/homepage/showcase-sellers";
import { FeaturedStoreHeader } from "@/components/homepage/canonical/featured-store/FeaturedStoreHeader";
import { ShowcaseViewAllCard } from "@/components/homepage/canonical/featured-store/ShowcaseViewAllCard";
import { ListingCard } from "@/components/ui/ListingCard";
import {
  HP_CANONICAL_LISTING_PROPS,
  HP_SHOWCASE_LISTING_IMAGE_SIZES,
} from "@/components/homepage/canonical/constants";
import {
  SHOWCASE_FINAL_DOM_VALUE,
  SHOWCASE_LISTING_CARD_DENSITY,
  takeShowcaseListings,
} from "@/lib/homepage/showcase-final-freeze-v1";
import {
  isValidHomepageStoreHref,
  listingHrefFromSlug,
} from "@/lib/homepage/homepage-final-freeze-v1";
import { storeListingCardAttr } from "@/lib/store/store-listing-card-premium-v1";
import css from "@/components/homepage/canonical/featured-store/FeaturedStore.module.css";

export type FeaturedStoreSectionProps = {
  sections: ShowcaseSellerSection[];
};

type HomepageFeaturedStore = ShowcaseSellerSection & {
  listings: ShowcaseSellerSection["listings"];
  listingCount: number;
};

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/**
 * Same visibility gate as the Featured Store section — used so homepage feed
 * LCP priority stays at most one listing image platform-wide.
 */
export function selectHomepageFeaturedStore(
  sections: ShowcaseSellerSection[],
): HomepageFeaturedStore | null {
  const primary =
    sections.find(
      (section) =>
        section.listings.length > 0 && isValidHomepageStoreHref(section.profileHref),
    ) ?? null;
  if (!primary) return null;

  const pool = uniqueById(primary.listings).filter(isShowcaseListingNavigable);
  const listings = takeShowcaseListings(pool);
  if (listings.length === 0) return null;

  const listingCount = Math.max(
    primary.listingCount ?? 0,
    primary.listings.length,
    pool.length,
    listings.length,
  );

  return { ...primary, listings, listingCount };
}

/**
 * Homepage Showcase Final Freeze v1.0:
 * Store header → 9 newest ListingCards → 1 View All card → horizontal scroll only.
 * Cap: nine listings + one View All. Never opens 404 / broken routes.
 * Real products only — never inject demo catalogue listings.
 */
export const FeaturedStoreSection = memo(function FeaturedStoreSection({
  sections,
}: FeaturedStoreSectionProps) {
  const store = useMemo(() => selectHomepageFeaturedStore(sections), [sections]);

  if (!store || !isValidHomepageStoreHref(store.profileHref)) {
    return null;
  }

  const storeCardAttr = storeListingCardAttr(SHOWCASE_LISTING_CARD_DENSITY);

  return (
    <section
      aria-label="Featured store"
      className={css.block}
      data-hp-featured-store
      data-hp-featured-store-version="v1.0-canonical"
      data-hp-showcase={SHOWCASE_FINAL_DOM_VALUE}
      data-hp-homepage-final="v1.0"
    >
      <FeaturedStoreHeader section={store} />
      <div className={css.carousel} role="list" aria-label="Showcase listings">
        {store.listings.map((product, index) => {
          const href = listingHrefFromSlug(product.slug);
          if (!href) return null;
          return (
            <div
              key={product.id}
              role="listitem"
              className={css.carouselItem}
              {...storeCardAttr}
            >
              <ListingCard
                product={product}
                href={href}
                variant="grid"
                {...HP_CANONICAL_LISTING_PROPS}
                imageSizes={HP_SHOWCASE_LISTING_IMAGE_SIZES}
                /* P0-01-A: exactly one homepage LCP listing when Showcase is visible. */
                priority={index === 0}
              />
            </div>
          );
        })}
        <div role="listitem" className={css.carouselItem} data-hp-showcase-slot="view-all">
          <ShowcaseViewAllCard
            href={store.profileHref}
            listingCount={store.listingCount ?? store.listings.length}
            storeName={store.sellerName}
          />
        </div>
      </div>
    </section>
  );
});
